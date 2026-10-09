import { aiClient } from './client';
import { env } from '@/config/env';
import { formatAstToText, validateMealAst } from '@/lib/engine/meal-ast';
import { buildFoodAstRules, normalizeFoodAst, extractJson } from './food-ast';
import { buildPlayerFoodTree, canResolveNodeForPlayer, createFoodItemFromName, findTreeNode, getFullFoodTree } from '@/lib/engine/food-tree';
import { getClinicalCatalogForPlayer, withNamedOnlyFoods } from '@/lib/nutrition/clinical-catalog';
import { isMainMeal as checkIsMainMeal } from '@/config/nutrition-days';

function normalizeMeals({ text, mealName, meals }) {
  const mealsToProcess = {};

  if (meals && typeof meals === 'object' && Object.keys(meals).length > 0) {
    Object.entries(meals).forEach(([key, value]) => {
      const rawValue = typeof value === 'string' ? value : value?.raw;
      mealsToProcess[key] = String(rawValue || '').trim();
    });
  } else if (text !== undefined) {
    mealsToProcess[mealName] = typeof text === 'string' ? text.trim() : '';
  }

  return mealsToProcess;
}

function isCompleteMealText(rawText) {
  if (!rawText) return true;
  const normalized = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return /^(variad|libre|variable|saludable|opciones?\s+variad|come\s+variable)/i.test(normalized);
}

function buildCompleteResult(rawText) {
  return {
    type: 'complete',
    raw: rawText,
    unrecognized: [],
    label: 'Árbol completo (Rotación variada)',
  };
}

/**
 * Mensaje para términos que no se han podido usar: distingue los que existen en el catálogo
 * pero no son aptos para el jugador en esta toma de los que no corresponden a ningún alimento.
 */
function describeUnusableTerms(terms, mealName, playerTree) {
  const fullTree = getFullFoodTree();
  const existsInCatalog = (term) => Boolean(createFoodItemFromName(term, null, fullTree) || findTreeNode(term, fullTree));
  const isNotSuitable = (term) => existsInCatalog(term) && !canResolveNodeForPlayer(term, null, playerTree);
  const notSuitable = terms.filter(isNotSuitable);
  const unknown = terms.filter((term) => !isNotSuitable(term));
  const parts = [];
  if (notSuitable.length > 0) {
    parts.push(`"${notSuitable.join('", "')}" no es apto para este jugador en ${mealName} (restricciones clínicas, aversiones o tipo de toma).`);
  }
  if (unknown.length > 0) {
    parts.push(`No se pudo interpretar "${unknown.join('", "')}" en ${mealName}. Prueba a describirlo con sus ingredientes.`);
  }
  return parts.join(' ');
}

function buildStructuredResult(rawText, item, mealName, playerTree) {
  const unresolved = [];
  const tree = normalizeFoodAst(item.tree, playerTree, unresolved);
  if (unresolved.length > 0) {
    throw new Error(describeUnusableTerms(unresolved, mealName, playerTree));
  }
  const isComplete = Boolean(item.type === 'complete' || !tree);
  const label = isComplete ? 'Árbol completo (Rotación variada)' : formatAstToText({ tree });

  if (!isComplete) {
    const validation = validateMealAst({ type: 'meal', tree });
    if (!validation.valid) throw new Error(validation.error);
  }

  return {
    type: isComplete ? 'complete' : 'meal',
    raw: rawText,
    ...(!isComplete ? { tree } : {}),
    unrecognized: Array.isArray(item.unrecognized) ? item.unrecognized : [],
    label,
  };
}

// Una misma palabra es fiambre/conserva o carne/pescado para cocinar según la toma y con qué se come.
const MEAL_CONTEXT_RULES = `CONTEXTO DE LA TOMA (fiambre o conserva frente a carne o pescado para cocinar):
Lee la toma entera antes de elegir: la misma palabra cambia según la toma y con qué se come.
- En una toma ligera (desayuno, almuerzo, merienda), con pan, tostadas, bocadillo, sándwich, wrap o tortitas, o junto a
  huevos, lácteos, aguacate, cereales o fruta, la proteína es fiambre o conserva:
  "pavo" → Pechuga de pavo (lonchas); "jamón" → Jamón serrano; "jamón york" o "jamón cocido" → Jamón cocido (York);
  "fiambre" → Embutidos y fiambres; "atún" → Atún natural; "salmón" → Salmón ahumado; "queso" → Quesos.
- Si forma un plato cocinado (con arroz, pasta, patata, boniato o verduras, o "a la plancha", "al horno", "guisado"),
  o es una comida o una cena, es la carne o el pescado para cocinar (ramas de pollo, pavo, ternera, pescado...).
- Si el texto dice el corte o la preparación ("pechuga de pollo a la plancha", "filete de pavo", "salmón al horno"),
  respétalo en cualquier toma: un jugador puede comer un plato cocinado en el desayuno (antes de un partido de mañana).

EJEMPLOS:
- Desayuno (ligera): "Pan blanco + huevos + pavo + aguacate" → Pan blanco + Huevos + Pechuga de pavo (lonchas) + Aguacate
- Desayuno (ligera): "tostadas con jamón y café con leche" → Panes + Jamón serrano + Café con leche
- Merienda (ligera): "yogur de proteína con fruta o pan con fiambre" → (Yogur proteico natural + Frutas) o (Panes + Embutidos y fiambres)
- Desayuno (ligera): "Patata + pollo + fruta" → Patata + Pollo (Genérico) + Frutas (plato cocinado: pollo para cocinar)
- Comida (principal): "pollo con arroz o patata" → Pollo (Genérico) + (Arroz o Patata)`;

function buildPrompt(mealsForAI, playerTree, mealTypes) {
  return `Actúa como chef y nutricionista deportivo de élite del Valencia CF.
Tu misión es estructurar las tomas de alimentación de un jugador en un Árbol Sintáctico (AST) nutricional formal, distinguiendo con total rigor entre conjunciones ("allOf") y disyunciones ("oneOf").

${buildFoodAstRules(playerTree)}

${MEAL_CONTEXT_RULES}

- Si el texto es libre o rotación ("Comida libre", "Variado", etc.): "type": "complete" y sin propiedad "tree".
- "unrecognized": array SOLO con términos que no correspondan a ningún nodo del árbol ni se puedan descomponer en ingredientes del árbol (palabras sin sentido o no alimentarias).

Tipo de cada toma:
${JSON.stringify(mealTypes, null, 2)}

Tomas a analizar:
${JSON.stringify(mealsForAI, null, 2)}

Devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "results": {
    "NombreDeLaComida": {
      "type": "meal",
      "tree": {
        "type": "allOf",
        "children": [
          { "type": "food", "name": "Pollo (Genérico)" },
          {
            "type": "oneOf",
            "children": [
              { "type": "food", "name": "Arroz (Grupo genérico)" },
              { "type": "food", "name": "Patata" }
            ]
          }
        ]
      },
      "unrecognized": []
    }
  }
}`;
}

/**
 * Interpreta texto libre de pautas nutricionales y lo convierte directamente
 * al AST tipado (allOf / oneOf / food).
 */
export async function parseMealTreeWithAI({
  text,
  mealName = 'Comida',
  meals,
  jugador = null,
  isMainMeal = null,
} = {}) {
  const mealsToProcess = normalizeMeals({ text, mealName, meals });
  if (Object.keys(mealsToProcess).length === 0) {
    return { success: true, results: {} };
  }

  const results = {};
  const mealsForAI = {};

  Object.entries(mealsToProcess).forEach(([currentMealName, rawText]) => {
    if (isCompleteMealText(rawText)) {
      results[currentMealName] = buildCompleteResult(rawText);
    } else {
      mealsForAI[currentMealName] = rawText;
    }
  });

  if (Object.keys(mealsForAI).length === 0) {
    return {
      success: true,
      results,
      tree: Object.values(results)[0] || null,
    };
  }

  // Tipo de cada toma (lo marcado en el editor o, si no, por su nombre): orienta fiambre frente a carne para cocinar.
  const singleMeal = Object.keys(mealsForAI).length === 1;
  const mealTypes = Object.fromEntries(Object.keys(mealsForAI).map((name) => {
    const main = singleMeal && typeof isMainMeal === 'boolean' ? isMainMeal : checkIsMainMeal(name);
    return [name, main ? 'principal' : 'ligera'];
  }));

  // Árbol clínico del jugador (sin reglas de composición de la toma): lo que la pauta nombra
  // de forma concreta se sirve siempre, aunque la rotación automática no lo elija en esa toma.
  const playerTree = buildPlayerFoodTree(
    // Catálogo de menú: incluye todo el catálogo en crudo más los alimentos de comedor.
    withNamedOnlyFoods(getClinicalCatalogForPlayer(jugador || [], { useMenuCatalog: true })),
  );

  const aiRes = await aiClient.messages.create({
    model: env.AI_MODEL || 'openai/gpt-6-luna-pro',
    max_tokens: 3000,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: buildPrompt(mealsForAI, playerTree, mealTypes) }],
  });

  const responseText = aiRes.content?.find((content) => content.type === 'text')?.text || '';
  const aiResults = extractJson(responseText).results || {};

  for (const [currentMealName, rawText] of Object.entries(mealsForAI)) {
    const item = aiResults[currentMealName];
    if (!item || typeof item !== 'object') {
      throw new Error(`La IA no devolvió un AST para ${currentMealName}.`);
    }

    if (Array.isArray(item.unrecognized) && item.unrecognized.length > 0) {
      throw new Error(describeUnusableTerms(item.unrecognized, currentMealName, playerTree));
    }

    if (item.type === 'complete' && !item.tree) {
      results[currentMealName] = buildCompleteResult(rawText);
      continue;
    }

    results[currentMealName] = buildStructuredResult(rawText, item, currentMealName, playerTree);
  }

  return {
    success: true,
    results,
    tree: Object.values(results)[0] || null,
  };
}
