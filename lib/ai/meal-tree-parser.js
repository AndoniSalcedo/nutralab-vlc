import { aiClient } from './client';
import { env } from '@/config/env';
import { findTreeNode, getCompleteMealBranches } from '@/lib/engine/food-tree';

const TYPED_MEAL_KEYS = ['proteina', 'hidrato', 'verdura', 'fruta', 'lacteo'];

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function normalizeAlternative(alternative, index) {
  if (!alternative || typeof alternative !== 'object') return null;

  const normalized = {
    label: String(alternative.label || alternative.nombre || alternative.raw || `Alternativa ${index + 1}`).trim(),
    nombre: alternative.nombre || alternative.label || `Alternativa ${index + 1}`,
    proteina: asArray(alternative.proteina),
    hidrato: asArray(alternative.hidrato),
    verdura: asArray(alternative.verdura),
    fruta: asArray(alternative.fruta),
    lacteo: asArray(alternative.lacteo),
    grasa: alternative.grasa || null,
  };

  const hasIngredients = TYPED_MEAL_KEYS.some((key) => normalized[key].length > 0) || Boolean(normalized.grasa);
  return hasIngredients ? normalized : null;
}

function normalizeAlternatives(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeAlternative).filter(Boolean);
}

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
  const normalized = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return !rawText || [
    'variadas', 'variado', 'come variable', 'variable', 'libre', 'variadas saludables',
    'opciones variadas dulces saludables', 'variado le gusta comer sano', 'saludable',
  ].some((prefix) => normalized === prefix || normalized.startsWith(prefix));
}

function buildCompleteResult(rawText, mealName) {
  const branches = getCompleteMealBranches(mealName);
  return {
    raw: rawText,
    isComplete: true,
    proteina: [],
    hidrato: [],
    verdura: [],
    fruta: [],
    lacteo: [],
    grasa: null,
    alternativas: [],
    branches,
    unrecognized: [],
    isValid: true,
    label: `Árbol completo (${branches.map((branch) => branch.label).join(' + ')})`,
  };
}

function buildBranches(items, mealName) {
  const branches = [];
  const seenIds = new Set();

  for (const itemName of items) {
    const node = findTreeNode(itemName);
    if (node) {
      const nodeId = node.id.toLowerCase();
      if (!seenIds.has(nodeId)) {
        seenIds.add(nodeId);
        branches.push({
          id: node.id,
          label: node.label,
          isGeneric: Boolean(node.isGeneric || !node.isLeaf),
          category: node.id,
          foodName: Array.isArray(node.foodNames) && node.foodNames.length > 0 ? node.foodNames[0] : node.label,
        });
      }
      continue;
    }

    const normalizedName = itemName.toLowerCase();
    if (!seenIds.has(normalizedName)) {
      seenIds.add(normalizedName);
      branches.push({
        id: normalizedName,
        label: itemName,
        isGeneric: false,
        category: 'especifico',
        foodName: itemName,
      });
    }
  }

  return branches.length > 0 ? branches : getCompleteMealBranches(mealName);
}

function buildStructuredResult(rawText, item, mealName) {
  const alternativas = normalizeAlternatives(item.alternativas || item.alternatives);
  const allItems = [
    ...asArray(item.hidrato),
    ...asArray(item.proteina),
    ...asArray(item.verdura),
    ...asArray(item.fruta),
    ...asArray(item.lacteo),
    ...(item.grasa ? [item.grasa] : []),
  ];

  const label = alternativas.length > 0
    ? alternativas.map((alternative) => alternative.label).join(' / ')
    : allItems.length > 0 ? allItems.join(' + ') : 'Árbol completo';

  return {
    raw: rawText,
    isComplete: false,
    // Las alternativas se mantienen agrupadas para que el generador no las mezcle.
    proteina: alternativas.length > 0 ? [] : asArray(item.proteina),
    hidrato: alternativas.length > 0 ? [] : asArray(item.hidrato),
    verdura: alternativas.length > 0 ? [] : asArray(item.verdura),
    fruta: alternativas.length > 0 ? [] : asArray(item.fruta),
    lacteo: alternativas.length > 0 ? [] : asArray(item.lacteo),
    grasa: alternativas.length > 0 ? null : item.grasa || null,
    alternativas,
    branches: alternativas.length > 0
      ? []
      : buildBranches(allItems, mealName),
    unrecognized: [],
    isValid: true,
    label,
  };
}

function buildPrompt(mealsForAI) {
  return `Actúa como chef y nutricionista deportivo de élite del Valencia CF.
Tu misión es estructurar las tomas de alimentación de un jugador en los componentes canónicos de nuestro Árbol Nutricional oficial (FOOD_TREE).

CLASIFICA CADA TOMA EN SUS CATEGORÍAS TIPADAS:
- "proteina": array con las fuentes de proteína (ej: "Pollo (Genérico)", "Huevos", "Pechuga de pollo", "Ternera magra", "Salmón", "Atún fresco", "Sepia", "Proteínas", "Merluza", "Jamón serrano", etc.)
- "hidrato": array con las fuentes de hidratos/cereales/tubérculos (ej: "Arroz (Grupo genérico)", "Pasta (Grupo genérico)", "Patata", "Boniato", "Panes (Grupo genérico)", "Copos de avena", "Hidratos de Carbono", "Quinoa", etc.)
- "verdura": array con verduras y hortalizas (ej: "Tomate", "Calabacín", "Zanahoria", "Hojas verdes y ensaladas", "Verduras y Hortalizas", "Espinacas", etc.)
- "fruta": array con frutas (ej: "Plátano", "Manzana", "Frutas", "Naranja", "Dátil", etc.)
- "lacteo": array con lácteos y postres (ej: "Arroz con leche", "Yogur natural", "Yogur proteico natural", "Leches (Grupo genérico)", "Kéfir", etc.)
- "grasa": string o null (ej: "AOVE", "Aguacate", "Nueces", o null)
- "alternativas": array de platos completos alternativos. Si el texto contiene
  una disyunción entre platos completos (por ejemplo "pasta con boloñesa o
  patata con pollo"), cada opción debe ir en un elemento separado. No mezcles
  los ingredientes de opciones distintas en los arrays principales.
  Cada elemento tiene: {"label": string, "proteina": [], "hidrato": [],
  "verdura": [], "fruta": [], "lacteo": [], "grasa": null}.
  Si no hay platos alternativos completos, devuelve [].
- "isComplete": boolean (true si es comida libre/variada/saludable por defecto)
- "unrecognized": array con términos ininteligibles o no alimentarios si los hay (ej: palabras sin sentido o errores ininteligibles). Si un término no se puede interpretar como alimento o grupo, colócalo aquí.

Tomas a analizar:
${JSON.stringify(mealsForAI, null, 2)}

Devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "results": {
    "NombreDeLaComida": {
      "isComplete": false,
      "proteina": [],
      "hidrato": [],
      "verdura": [],
      "fruta": [],
      "lacteo": [],
      "grasa": null,
      "alternativas": [],
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
 * Interpreta texto libre de pautas nutricionales y lo convierte al contrato
 * estructurado que consume el árbol alimentario.
 *
 * La autenticación y el acceso al jugador se resuelven fuera de este módulo,
 * en la Server Action. Este módulo solo contiene la integración con la IA y
 * la normalización de su respuesta.
 */
export async function parseMealTreeWithAI({
  text,
  mealName = 'Comida',
  meals,
} = {}) {
  const mealsToProcess = normalizeMeals({ text, mealName, meals });
  if (Object.keys(mealsToProcess).length === 0) {
    return { success: true, results: {} };
  }

  const results = {};
  const mealsForAI = {};

  Object.entries(mealsToProcess).forEach(([currentMealName, rawText]) => {
    if (isCompleteMealText(rawText)) {
      results[currentMealName] = buildCompleteResult(rawText, currentMealName);
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

  const aiRes = await aiClient.messages.create({
    model: env.CHAT_MODEL || 'claude-sonnet-5',
    max_tokens: 3000,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: buildPrompt(mealsForAI) }],
  });

  const responseText = aiRes.content?.find((content) => content.type === 'text')?.text || '';
  const aiResults = extractJson(responseText).results || {};

  for (const [currentMealName, rawText] of Object.entries(mealsForAI)) {
    const item = aiResults[currentMealName] || {
      isComplete: false,
      proteina: [],
      hidrato: [],
      verdura: [],
      fruta: [],
      lacteo: [],
      grasa: null,
      alternativas: [],
      unrecognized: [],
    };

    if (Array.isArray(item.unrecognized) && item.unrecognized.length > 0) {
      throw new Error(`No se pudo interpretar "${item.unrecognized.join(', ')}" en ${currentMealName}. Por favor, escribe alimentos válidos.`);
    }

    const alternativas = normalizeAlternatives(item.alternativas || item.alternatives);
    if (item.isComplete && alternativas.length === 0) {
      results[currentMealName] = buildCompleteResult(rawText, currentMealName);
      continue;
    }

    results[currentMealName] = buildStructuredResult(
      rawText,
      { ...item, alternativas },
      currentMealName
    );
  }

  return {
    success: true,
    results,
    tree: Object.values(results)[0] || null,
  };
}
