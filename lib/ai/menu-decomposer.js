import { aiClient as client } from './client';
import { env } from '@/config/env';
import { normalizeFoodName } from '@/data/foods-crudo';
import { getFullFoodTree } from '@/lib/engine/food-tree';
import { buildFoodAstRules, normalizeFoodAst, extractJson } from './food-ast';


function buildDishPrompt(dishes, foodTree) {
  return `Actúa como chef y nutricionista deportivo de élite del Valencia CF.
Estructura cada plato del comedor como un Árbol Sintáctico (AST) nutricional con sus ingredientes elementales.

${buildFoodAstRules(foodTree)}

CRITERIOS PARA PLATOS DE COMEDOR:
- Proteínas: si el nombre indica el corte o la pieza (contramuslo, pechuga, solomillo, merluza...), usa ese alimento; si no se puede determinar, usa la rama que corresponda.
- Un plato del comedor está cocinado: "pavo", "pollo" o "ternera" son la carne para cocinar (p. ej. "estofado de pavo" → Pavo (Genérico)).
  Solo es fiambre si el nombre lo dice: jamón, york, fiambre, lonchas.
- Hidratos: usa la rama genérica salvo que el plato indique uno concreto (ej. "arroz basmati").
- Incluye verduras, fruta, lácteos y grasa de cocinado solo si el plato los lleva.
- Si el plato ofrece alternativas ("con arroz o patata"), usa "oneOf".

Platos a estructurar (clave: nombre del plato, valor: descripción):
${JSON.stringify(dishes, null, 2)}

Devuelve ÚNICAMENTE un objeto JSON donde cada clave sea exactamente la clave del plato y el valor su AST. Ejemplo:
{
  "Pollo asado con patatas": {
    "type": "allOf",
    "children": [
      { "type": "food", "name": "Pechuga de pollo" },
      { "type": "food", "name": "Patata" },
      { "type": "food", "name": "AOVE" }
    ]
  }
}`;
}

/**
 * Estructura platos como AST (allOf / oneOf / food) referenciando nodos del árbol.
 *
 * @param {Object<string, string>} dishes - { [nombrePlato]: descripción del plato }
 * @returns {Promise<Object<string, Object>>} { [nombrePlato]: AST }
 */
export async function decomposeDishesToAst(dishes) {
  const entries = Object.entries(dishes || {});
  if (entries.length === 0) return {};

  // Menú de equipo: vocabulario del catálogo completo; se adapta a cada jugador al generar su plan.
  const foodTree = getFullFoodTree();
  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < entries.length; i += chunkSize) {
    chunks.push(Object.fromEntries(entries.slice(i, i + chunkSize)));
  }

  async function processChunk(chunk) {
    const res = await client.messages.create({
      model: env.AI_MODEL,
      max_tokens: 4000,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: buildDishPrompt(chunk, foodTree) }],
    });
    const text = res.content.find((c) => c.type === 'text')?.text || '';
    return extractJson(text);
  }

  const merged = Object.assign({}, ...(await Promise.all(chunks.map(processChunk))));
  const result = {};
  for (const [dishName] of entries) {
    const unresolved = [];
    const tree = normalizeFoodAst(merged[dishName], foodTree, unresolved);
    if (unresolved.length > 0) {
      throw new Error(`"${unresolved.join('", "')}" no existe en el árbol nutricional (plato "${dishName}").`);
    }
    if (!tree) throw new Error(`La IA no devolvió un AST para el plato "${dishName}".`);
    result[dishName] = tree;
  }
  return result;
}

/** Un plato del servicio es siempre un allOf (con su label) para poder localizarlo por nombre. */
export function toDishNode(tree) {
  return tree?.type === 'allOf' ? tree : { type: 'allOf', children: [tree] };
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
  const decomposedMap = missingDishNames.length > 0
    ? await decomposeDishesToAst(Object.fromEntries(missingDishNames.map((name) => [name, name])))
    : {};

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
          if (!decomposed) throw new Error(`Falta AST de menú para el plato "${name}"`);
          const dishTree = toDishNode(decomposed);
          dishNodes.push({
            ...dishTree,
            label: name,
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
