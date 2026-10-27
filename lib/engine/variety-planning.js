import { extractPlannedCarbAndProtein, createFoodItemFromName, getFullFoodTree, getFoodProcessing } from './food-tree.js';

/**
 * Planificación de variedad: decide qué hidratos y proteínas debe evitar una toma según lo que ya hay en el
 * mismo día (la memoria que guarda el WeeklyVarietyTracker), según las alternativas de la cena del comedor y según
 * lo que los días contiguos llevan sí o sí.
 */

const EMPTY_VARIETY = Object.freeze({ proteinBranches: [], carbBranches: [], foods: [], processing: [] });

/** Variedad de una opción de pauta, un plato o una toma: sus ramas, alimentos y procesados de proteína e hidrato. */
export function getItemsVariety(items, clinicalCatalog) {
  const info = extractPlannedCarbAndProtein(items, clinicalCatalog);
  const foods = [...new Set([...info.proteinFoods, ...info.carbFoods])];
  return {
    proteinBranches: info.proteinBranches,
    carbBranches: info.carbBranches,
    foods,
    processing: [...new Set(foods.flatMap((food) => getFoodProcessing(food)))],
  };
}

function unionVariety(list) {
  const merge = (key) => [...new Set(list.flatMap((entry) => entry[key]))];
  return { proteinBranches: merge('proteinBranches'), carbBranches: merge('carbBranches'), foods: merge('foods'), processing: merge('processing') };
}

function intersectVariety(list) {
  if (list.length === 0) return EMPTY_VARIETY;
  const common = (key) => list[0][key].filter((value) => list.every((entry) => entry[key].includes(value)));
  return { proteinBranches: common('proteinBranches'), carbBranches: common('carbBranches'), foods: common('foods'), processing: common('processing') };
}

/** Ramas, alimentos y procesados de proteína e hidrato de una combinación de platos del menú. */
export function comboVariety(combo, clinicalCatalog) {
  return unionVariety((combo?.dishes || []).map((dish) => getItemsVariety(dish?.tree || dish, clinicalCatalog)));
}

// Lo que un nodo de pauta sirve sí o sí: todo lo de un allOf y solo lo común a todas las opciones de un oneOf.
// Un grupo (p. ej. "Legumbres") aporta su rama aunque no se sepa qué alimento saldrá.
function astUnavoidableVariety(node, clinicalCatalog) {
  if (!node) return EMPTY_VARIETY;
  if (node.type === 'food') return getItemsVariety(node, clinicalCatalog);
  const children = (node.children || []).map((child) => astUnavoidableVariety(child, clinicalCatalog));
  if (node.type === 'allOf') return unionVariety(children);
  if (node.type === 'oneOf') return intersectVariety(children);
  return EMPTY_VARIETY;
}

/**
 * Lo que una toma ya decidida (pauta, protocolo o servicio del comedor, como los guarda el generador) lleva sí o sí:
 * la rotación variada y los post fijos no comprometen nada; del menú, lo que comparten todas las combinaciones.
 */
export function getUnavoidableVariety(mealTree, clinicalCatalog) {
  if (!mealTree || mealTree.kind === 'fixed') return EMPTY_VARIETY;
  if (mealTree.kind === 'menu-options') {
    return intersectVariety((mealTree.combinations || []).map((combo) => comboVariety(combo, clinicalCatalog)));
  }
  const value = mealTree.value;
  if (!value || value.type === 'complete' || !value.tree) return EMPTY_VARIETY;
  return astUnavoidableVariety(value.tree, clinicalCatalog);
}

/**
 * Precarga de la semana: por cada día, lo que sus tomas llevan sí o sí (protocolos, pautas fijas, grupos que la
 * pauta nombra y platos del menú sin alternativa). Así el día anterior ya sabe qué no debe repetir.
 */
export function buildPlannedDays(weeklyTrees, dayKeys, clinicalCatalog) {
  return Object.fromEntries(dayKeys
    .filter((dayKey) => weeklyTrees[dayKey])
    .map((dayKey) => [
      dayKey,
      unionVariety(Object.values(weeklyTrees[dayKey]).map((tree) => getUnavoidableVariety(tree, clinicalCatalog))),
    ]));
}

/** Registra en la memoria de variedad del día lo que una toma sirve: proteína, hidrato, fruta y verdura. */
export function recordServedMeal(tracker, items, clinicalCatalog) {
  if (!tracker || !Array.isArray(items)) return;
  const info = extractPlannedCarbAndProtein(items, clinicalCatalog);
  info.proteinBranches.forEach((branch) => tracker.recordProtein(null, branch));
  info.carbBranches.forEach((branch) => tracker.recordCarb(null, branch));
  for (const item of items) {
    if (item?.name && item.grams !== 0) tracker.recordFood(item.name);
  }
}

// Nombre del alimento de cada parte del detalle de una toma ("Pechuga de pollo 150g", "2 Huevos y 3 Claras").
function mealDetailFoodNames(detalle) {
  return String(detalle || '')
    .split(/,\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (/^\d+\s+huevos?\b/i.test(part)
      ? 'Huevo entero'
      : part.replace(/\s+-?\d+(?:[.,]\d+)?\s*g$/i, '').replace(/\s+\d+\s+unidad(?:es)?$/i, '')));
}

/**
 * Precarga el tracker con el plan semanal anterior del jugador, toma a toma y en orden, como si se acabara de
 * generar: así el inicio de la semana nueva no repite lo del final de la anterior. Solo se cuenta lo que se
 * reconoce en el catálogo (un texto editado a mano que no coincide con ningún alimento se ignora).
 */
export function seedTrackerFromPreviousPlan(tracker, previousDays, dayKeys, clinicalCatalog) {
  if (!tracker || !previousDays) return;
  const fullTree = getFullFoodTree();
  for (const dayKey of dayKeys) {
    tracker.startNewDay(`anterior:${dayKey}`);
    for (const meal of previousDays[dayKey]?.ingestas || []) {
      // El pan del desayuno se presenta como "Tostadas de <pan>".
      const foods = mealDetailFoodNames(meal?.detalle)
        .map((name) => (createFoodItemFromName(name, null, fullTree)
          || createFoodItemFromName(name.replace(/^tostadas de /i, ''), null, fullTree))?.food)
        .filter(Boolean);
      if (foods.length === 0) continue;
      const info = extractPlannedCarbAndProtein(foods, clinicalCatalog);
      info.proteinBranches.forEach((branch) => tracker.recordProtein(null, branch));
      info.proteinFoods.forEach((food) => tracker.recordProtein(food));
      info.carbBranches.forEach((branch) => tracker.recordCarb(null, branch));
      info.carbFoods.forEach((food) => tracker.recordCarb(food));
      for (const food of foods) {
        if (food.treePath?.[0] === 'verduras') tracker.recordVeggie(food.name);
        if (food.treePath?.[0] === 'frutas') tracker.recordFruit(food.name);
      }
    }
  }
}
