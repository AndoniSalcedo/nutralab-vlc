import { aiClient } from './client';
import { env } from '@/config/env';
import { formatAstToText, validateMealAst } from '@/lib/engine/meal-ast';
import { buildPlayerFoodTree, describeFoodTreeOutline, findTreeNode } from '@/lib/engine/food-tree';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';

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
 * Normaliza el AST devuelto por la IA. Cada hoja "food" debe referenciar un nodo
 * del árbol del jugador (rama o alimento) con el mismo resolvedor que usa el
 * generador; si no existe se acumula en `unresolved`.
 */
function normalizeAstNode(node, playerTree, unresolved = []) {
  if (!node || typeof node !== 'object') return null;

  if (node.type === 'food') {
    const name = String(node.name || node.foodName || node.label || '').trim();
    if (!name) return null;
    const treeNode = findTreeNode(name, playerTree);
    if (!treeNode) {
      unresolved.push(name);
      return null;
    }
    return { type: 'food', name: treeNode.label || name };
  }

  const normalizeChildren = (children) => (children || []).map((child) => normalizeAstNode(child, playerTree, unresolved)).filter(Boolean);

  if (node.type === 'oneOf') {
    const children = normalizeChildren(node.children);
    if (children.length === 0) return null;
    if (children.length === 1) return children[0];
    return {
      type: 'oneOf',
      label: node.label || undefined,
      children,
    };
  }

  if (node.type === 'allOf') {
    const children = normalizeChildren(node.children);
    if (children.length === 0) return null;
    if (children.length === 1) return children[0];
    return {
      type: 'allOf',
      label: node.label || undefined,
      children,
    };
  }

  return null;
}

function buildStructuredResult(rawText, item, mealName, playerTree) {
  const unresolved = [];
  const tree = normalizeAstNode(item.tree, playerTree, unresolved);
  if (unresolved.length > 0) {
    throw new Error(`"${unresolved.join('", "')}" no existe en el árbol nutricional del jugador (${mealName}).`);
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

function buildPrompt(mealsForAI, playerTree) {
  return `Actúa como chef y nutricionista deportivo de élite del Valencia CF.
Tu misión es estructurar las tomas de alimentación de un jugador en un Árbol Sintáctico (AST) nutricional formal, distinguiendo con total rigor entre conjunciones ("allOf") y disyunciones ("oneOf").

REGLAS DEL ÁRBOL SINTÁCTICO (AST):
1. Cada toma tiene un árbol con nodos de tres tipos:
   - "allOf": Conjunción (todos sus hijos se comen juntos en la toma, ej: "pollo con patata y ensalada").
   - "oneOf": Disyunción (opciones excluyentes donde el motor elegirá una sola, ej: "arroz o patata", "pollo o ternera", "opción 1 o opción 2").
   - "food": Hoja que referencia un nodo del ÁRBOL NUTRICIONAL de abajo, con:
     * "type": "food"
     * "name": nombre EXACTO de una rama (el texto entre corchetes) o de un alimento listado en ella.
       Elige el nivel del árbol que corresponda a lo que dice el texto: una rama referencia la rama
       completa con todas sus subramas y alimentos (el motor rota entre ellos), un alimento referencia
       solo esa hoja. Ej: "fruta" → la rama de frutas; "proteína" → la rama de proteínas entera;
       "pollo" → la rama de pollo; "pechuga de pollo" → ese alimento.

2. DISTINCIÓN ENTRE CONJUNCIÓN Y DISYUNCIÓN:
   - Si el texto dice "Pollo con patata y arroz" o "pasta con boloñesa + pollo y puré de patata":
     Es un "allOf" que contiene los alimentos (doble hidrato / plato combinado).
   - Si el texto dice "Pollo con arroz o patata":
     La raíz es un "allOf" con el Pollo, y un nodo hijo "oneOf" con Arroz y Patata.
   - Si el texto dice "Pasta con boloñesa o ternera con puré de patata":
     La raíz es un "oneOf" cuyos hijos son dos nodos "allOf" (un "allOf" para la pasta con boloñesa y otro "allOf" para la ternera con puré).
   - Si el texto es libre o rotación ("Comida libre", "Variado", etc.):
    "type": "complete" y sin propiedad "tree".

3. Los símbolos "+", "," o "y" indican conjunción ("allOf"). Interpreta erratas evidentes como el nodo del árbol al que se refieren.

4. "unrecognized": array SOLO con términos que no correspondan a ningún nodo del árbol (palabras sin sentido o no alimentarias).

ÁRBOL NUTRICIONAL DEL JUGADOR (única fuente válida de nombres; ramas entre corchetes, seguidas de sus alimentos):
${describeFoodTreeOutline(playerTree)}

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

function extractJson(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se pudo estructurar el árbol nutricional con la IA. Inténtalo de nuevo.');
  return JSON.parse(jsonMatch[0]);
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

  // Mismo árbol que construye el generador de planes para este jugador.
  const playerTree = buildPlayerFoodTree(getClinicalCatalogForPlayer(jugador || []));

  const aiRes = await aiClient.messages.create({
    model: env.AI_MODEL || 'openai/gpt-6-luna-pro',
    max_tokens: 3000,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: buildPrompt(mealsForAI, playerTree) }],
  });

  const responseText = aiRes.content?.find((content) => content.type === 'text')?.text || '';
  const aiResults = extractJson(responseText).results || {};

  for (const [currentMealName, rawText] of Object.entries(mealsForAI)) {
    const item = aiResults[currentMealName];
    if (!item || typeof item !== 'object') {
      throw new Error(`La IA no devolvió un AST para ${currentMealName}.`);
    }

    if (Array.isArray(item.unrecognized) && item.unrecognized.length > 0) {
      throw new Error(`No se pudo interpretar "${item.unrecognized.join(', ')}" en ${currentMealName}. Por favor, escribe alimentos válidos.`);
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
