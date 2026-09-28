import { aiClient as client } from './client';
import { env } from '@/config/env';
import { FOODS_CRUDO, normalizeFoodName } from '@/data/foods-crudo';
import { FOODS_MENU } from '@/data/foods-menu';
import { FOOD_TREE } from '@/lib/engine/food-tree';

function normalizeTreeReference(value) {
  return normalizeFoodName(value);
}

const CATALOG_FOODS_BY_NAME = new Map();
for (const food of [...FOODS_CRUDO, ...FOODS_MENU]) {
  CATALOG_FOODS_BY_NAME.set(normalizeTreeReference(food.name), food.name);
}
for (const food of [...FOODS_CRUDO, ...FOODS_MENU]) {
  const originalName = food.originalName;
  const normalizedOriginalName = normalizeTreeReference(originalName);
  if (originalName && !CATALOG_FOODS_BY_NAME.has(normalizedOriginalName)) {
    CATALOG_FOODS_BY_NAME.set(normalizedOriginalName, food.name);
  }
}

const TREE_REFERENCE_BY_NAME = new Map();
function indexTreeReferences(node) {
  if (!node?.id) return;
  TREE_REFERENCE_BY_NAME.set(normalizeTreeReference(node.id), node.id);
  if (node.label) TREE_REFERENCE_BY_NAME.set(normalizeTreeReference(node.label), node.id);
  Object.values(node.children || {}).forEach(indexTreeReferences);
}
indexTreeReferences(FOOD_TREE);

const VALID_INGREDIENT_REFERENCES = Array.from(new Set([
  ...Array.from(CATALOG_FOODS_BY_NAME.values()),
  ...Array.from(TREE_REFERENCE_BY_NAME.values()),
]));

function getTreeReference(value) {
  if (!value || typeof value !== 'string') return null;
  const normalizedValue = normalizeTreeReference(value);
  return CATALOG_FOODS_BY_NAME.get(normalizedValue)
    || TREE_REFERENCE_BY_NAME.get(normalizedValue)
    || null;
}

function normalizeIngredientReference(value, context = 'ingrediente') {
  if (value == null || value === '') return null;
  const category = context.split(' / ').at(-1);
  if (typeof value === 'object') {
    const name = value.name || value.foodName || value.id || value.label;
    if (!name) return null;
    const reference = getTreeReference(String(name));
    if (!reference) throw new Error(`Referencia fuera del árbol para ${context}: "${name}"`);
    return { type: 'food', category, name: reference };
  }
  const reference = getTreeReference(value);
  if (!reference) throw new Error(`Referencia fuera del árbol para ${context}: "${value}"`);
  return { type: 'food', category, name: reference };
}

function normalizeIngredientList(values, context) {
  if (!values) return null;
  const list = Array.isArray(values) ? values : [values];
  const normalized = list.map((value) => normalizeIngredientReference(value, context)).filter(Boolean);
  if (normalized.length === 0) return null;
  return normalized.length === 1 ? normalized[0] : { type: 'allOf', children: normalized };
}

/**
 * Desglosa los platos del menú semanal en ingredientes elementales.
 * - Proteínas: especifica el corte/alimento real del catálogo (ej. "Contramuslo de pollo deshuesado", "Pechuga de pollo", "Solomillo de ternera", "Merluza", "Sepia").
 * - Hidratos: genéricos cuando aplica (ej. "pasta", "arroz", "patata", "boniato", "fideos", "lentejas").
 * - Verduras: verduras reales en crudo (ej. "Calabacín", "Pimiento verde", "Zanahoria").
 * - Grasa: "AOVE".
 */
export async function decomposeDishListWithAI(dishes) {
  if (!dishes || dishes.length === 0) return {};

  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < dishes.length; i += chunkSize) {
    chunks.push(dishes.slice(i, i + chunkSize));
  }

  async function processChunk(chunk) {
    const prompt = `Actúa como chef y nutricionista deportivo de élite del Valencia CF.
Desglosa cada uno de los siguientes platos del comedor en sus ingredientes elementales en crudo:

REGLAS ESENCIALES:
1. Devuelve cada ingrediente usando únicamente una referencia de esta lista de alimentos del catálogo o ramas del árbol. Respeta exactamente el nombre/id; no inventes alimentos ni uses texto libre:
${JSON.stringify(VALID_INGREDIENT_REFERENCES)}
Los valores fuera de la lista se rechazarán.
2. "proteina": array con los alimentos proteicos reales. ¡IMPORTANTE! En carnes y aves DEBES IDENTIFICAR EL CORTE O PREPARACIÓN EXACTA si aparece en el nombre; si no se puede determinar el corte, utiliza la rama genérica del árbol que corresponda. Por ejemplo:
   - Si el plato indica "contramuslo", pon "Contramuslo de pollo deshuesado".
   - Si indica "pechuga" o "pollo asado", pon "Pechuga de pollo".
   - Si indica "alitas", pon "Alitas de pollo".
   - Si indica "carne picada", pon "Carne picada de ternera" o "Carne picada de pollo" según corresponda.
   - Si indica "solomillo", pon "Solomillo de ternera".
   - Si indica "carrillera" o "creps de carrillera", pon "Carrillera de ternera".
   - Si indica "chuletas de pavo", pon "Pechuga de pavo".
   - Si indica "secreto", pon "Secreto ibérico" o "Lomo de cerdo".
   - Si indica pescados o mariscos, pon el pescado exacto: "Merluza", "Rape", "Corvina", "Gallineta", "Sepia", "Atún fresco", "Gambas", "Bacalao".
   - Si el plato no lleva carne, pescado ni huevos principales, pon null.
3. "hidrato": alimento o rama del árbol. Usa ids canónicos de rama cuando sea genérico (por ejemplo "pasta", "arroz", "tuberculos", "legumbres"); para un alimento concreto, usa su nombre exacto de catálogo. Si no lleva, pon null.
4. "verdura": array de verduras específicas del catálogo o ramas canónicas de verduras (por ejemplo "Calabacín", "Pimiento", "Zanahoria"). Si no lleva, pon null.
5. "fruta": array de frutas específicas del catálogo o la rama canónica "frutas". Si no lleva, pon null.
6. "lacteo": array de lácteos concretos del catálogo o ramas canónicas de lácteos. Si no lleva, pon null.
7. "grasa": id de una rama/alimento del árbol, normalmente "aceites" o "AOVE", o null. Solo si el plato lleva grasa añadida.

Platos a desglosar:
${JSON.stringify(chunk, null, 2)}

Devuelve ÚNICAMENTE un objeto JSON donde cada clave sea el nombre exacto del plato y el valor un objeto con:
{
  "nombre": string (nombre del plato),
  "proteina": array de referencias del árbol o null,
  "hidrato": referencia del árbol o null,
  "verdura": array de referencias del árbol o null,
  "fruta": array de referencias del árbol o null,
  "lacteo": array de referencias del árbol o null,
  "grasa": referencia del árbol o null
}`;

    const res = await client.messages.create({
      model: env.AI_MODEL,
      max_tokens: 4000,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: prompt }],
    });

    const text = res.content.find((c) => c.type === 'text')?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se pudo extraer JSON en el desglose de platos');
    const cleaned = jsonMatch[0]
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/[\u0000-\u001F]+/g, ' ');
    try {
      return JSON.parse(cleaned);
    } catch {
      return JSON.parse(jsonMatch[0]);
    }
  }

  const results = await Promise.all(chunks.map((c) => processChunk(c)));
  const merged = Object.assign({}, ...results);
  const canonicalMap = {};
  Object.entries(merged).forEach(([k, v]) => {
    canonicalMap[k] = canonicalizeDecomposedDish(v);
  });
  return canonicalMap;
}

function canonicalizeDecomposedDish(dish) {
  if (!dish) return dish;

  const dishName = dish.nombre || 'Plato sin nombre';

  const rootChildren = [];
  for (const [key, category] of Object.entries({
    proteina: 'proteina',
    hidrato: 'hidratos',
    verdura: 'verduras',
    fruta: 'frutas',
    lacteo: 'lacteos',
    grasa: 'grasas',
  })) {
    const value = key === 'hidrato' || key === 'grasa'
      ? normalizeIngredientReference(dish[key], `${dishName} / ${category}`)
      : normalizeIngredientList(dish[key], `${dishName} / ${category}`);
    if (value) rootChildren.push(value);
  }
  return {
    nombre: dishName,
    tree: { type: 'allOf', label: dishName, children: rootChildren },
  };
}

export function isServiceEvent(text) {
  if (!text || typeof text !== 'string') return true;
  const upper = text.toUpperCase().trim();
  return (
    upper.includes('PREPARTIDO') ||
    upper.includes('PARTIDO') ||
    upper.includes('DESCANSO') ||
    upper.includes('LIBRE') ||
    upper.includes('PICNIC') ||
    upper.includes('HOTEL') ||
    upper.includes('SIN REGISTRAR') ||
    upper === '-'
  );
}

function getCourseAstByName(serviceTree) {
  const result = new Map();
  const courses = serviceTree?.type === 'allOf' ? serviceTree.children || [] : serviceTree ? [serviceTree] : [];
  for (const courseNode of courses) {
    const course = courseNode.course || null;
    for (const dishNode of courseNode.type === 'oneOf' ? courseNode.children || [] : [courseNode]) {
      const name = String(dishNode?.label || '').trim();
      if (name) result.set(`${course || ''}:${normalizeFoodName(name)}`, dishNode);
    }
  }
  return result;
}

/** Añade o renueva únicamente el AST que falte; conserva AST ya editados. */
export async function enrichMenuWithDecomposedDishes(dias) {
  if (!Array.isArray(dias) || dias.length === 0) return dias;

  const existingDishTrees = new Map();
  const dishSet = new Set();
  dias.forEach((d) => {
    ['comida', 'cena'].forEach((service) => {
      const serviceData = d[service];
      const treesByCourse = getCourseAstByName(serviceData?.tree);
      for (const course of ['primero', 'segundo', 'postre']) {
        const text = serviceData?.[course];
        if (text && typeof text === 'string') {
          for (const rawName of text.split('/')) {
            const name = rawName.trim();
            if (!name || isServiceEvent(name)) continue;
            const existing = treesByCourse.get(`${course}:${normalizeFoodName(name)}`);
            if (existing) existingDishTrees.set(`${course}:${normalizeFoodName(name)}`, existing);
            else dishSet.add(name);
          }
        }
      }
    });
  });

  const missingDishNames = Array.from(dishSet);
  const decomposedMap = missingDishNames.length > 0 ? await decomposeDishListWithAI(missingDishNames) : {};

  // Reconstruir los AST de servicio manteniendo los árboles editados y añadiendo los nuevos.
  return dias.map((d) => {
    const newComida = { ...(d.comida || {}) };
    const newCena = { ...(d.cena || {}) };

    function buildServiceAst(serviceData) {
      const courses = [];
      for (const course of ['primero', 'segundo', 'postre']) {
        const text = serviceData?.[course];
        if (!text || typeof text !== 'string') continue;
        const dishNodes = [];
        for (const rawName of text.split('/')) {
          const name = rawName.trim();
          if (!name || isServiceEvent(name)) continue;
          const dishKey = `${course}:${normalizeFoodName(name)}`;
          const existingTree = existingDishTrees.get(dishKey);
          if (existingTree) {
            dishNodes.push(existingTree);
            continue;
          }
          const decomposed = decomposedMap[name];
          if (!decomposed?.tree) throw new Error(`Falta AST de menú para el plato "${name}"`);
          dishNodes.push({
            ...decomposed.tree,
            label: decomposed.nombre,
            ...(course === 'postre' ? { course: 'postre' } : {}),
          });
        }
        if (dishNodes.length > 0) courses.push({ type: 'oneOf', label: course, course, children: dishNodes });
      }
      if (courses.length === 0) return null;
      return { type: 'allOf', label: 'Servicio de menú', children: courses };
    }

    newComida.tree = buildServiceAst(newComida);
    newCena.tree = buildServiceAst(newCena);
    delete newComida.platos_desglosados;
    delete newCena.platos_desglosados;

    return {
      ...d,
      comida: newComida,
      cena: newCena,
    };
  });
}
