import {
  isAnimalProteinFood,
  getTreeNodeForFood,
  isFatFood,
  createFoodItemFromName,
  resolveFoodItemForPlayer,
} from './food-tree.js';
import { getProteinRole, PROTEIN_ROLE } from './protein-roles.js';
import { roundToFive } from '@/lib/utils';

/**
 * Alimentos de una toma: raciones fijas de los complementos, grasa de cocinado de las comidas principales y
 * macros de los componentes que no se ajustan.
 */

const FIXED_MEAL_PORTIONS = {
  fruta: 200,
  yogur: 250,
  leche: 250,
};

// Comida o cena con varias verduras (pisto, wok, ensalada griega...): se reparten una ración total de verdura en vez
// de llevar cada una su ración completa.
const SHARED_VEGETABLES_MIN_COUNT = 3; // a partir de cuántas verduras se reparte la ración
const SHARED_VEGETABLES_TOTAL_G = 200; // ración total de verdura de la toma
const SHARED_VEGETABLE_MIN_G = 25; // ración mínima de cada verdura del reparto

function getFixedFoodGroup(food) {
  if (!food) return null;
  // Complementos (salsas, condimentos): ración fija de acompañamiento, nunca se calibran.
  if (getTreeNodeForFood(food)?.isExtra) return 'complemento';
  const path = Array.isArray(food.treePath) ? food.treePath.map((part) => String(part).toLowerCase()) : [];
  if (path[0] === 'frutas') return 'fruta';
  if (path[0] === 'lacteos' && path[1] === 'yogures') return 'yogur';
  if (path[0] === 'lacteos' && path[1] === 'leches') return 'leche';
  if (path[0] === 'lacteos') return 'lacteo';
  return null;
}

function getFoodRootBranch(food) {
  return Array.isArray(food?.treePath) ? String(food.treePath[0] || '').toLowerCase() : null;
}

function getFixedFoodPortion(food, group) {
  const preferred = FIXED_MEAL_PORTIONS[group];
  const min = Number(food?.minGrams);
  const max = Number(food?.maxGrams);
  const basePortion = Number.isFinite(preferred) ? preferred : min;
  if (!Number.isFinite(basePortion)) return null;
  const withMinimum = Number.isFinite(min) ? Math.max(min, basePortion) : basePortion;
  return Number.isFinite(max) ? Math.min(max, withMinimum) : withMinimum;
}

function calculateMacroTotals(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { kcal: 0, p: 0, hc: 0, g: 0, proteina: 0, hidratos: 0, grasa: 0 };
  }
  return items.reduce((totals, item) => {
    const grams = Number(item?.grams);
    const food = item?.food;
    if (!Number.isFinite(grams) || !food) return totals;
    const kcal = totals.kcal + (grams / 100) * Number(food.kcal ?? 0);
    const p = totals.p + (grams / 100) * Number(food.pro ?? 0);
    const hc = totals.hc + (grams / 100) * Number(food.cho ?? 0);
    const g = totals.g + (grams / 100) * Number(food.fat ?? 0);
    return {
      kcal,
      p,
      hc,
      g,
      proteina: p,
      hidratos: hc,
      grasa: g,
    };
  }, { kcal: 0, p: 0, hc: 0, g: 0, proteina: 0, hidratos: 0, grasa: 0 });
}

/**
 * En comidas principales sin grasa explícita y con algún componente escalable (no solo fruta
 * o lácteos), se añade AOVE como grasa de cocinado para que la calibración cuadre las grasas.
 */
export function ensureMainMealFat(items, isMainMeal, clinicalCatalog, playerFoodTree) {
  if (!isMainMeal || !Array.isArray(items) || items.length === 0) return items;
  if (items.some((item) => item?.food && isFatFood(item.food))) return items;
  const hasScalableComponent = items.some((item) => !['frutas', 'lacteos'].includes(getFoodRootBranch(item?.food)));
  if (!hasScalableComponent) return items;
  const fatItem = createFoodItemFromName('AOVE', clinicalCatalog, playerFoodTree)
    || resolveFoodItemForPlayer('aceites', clinicalCatalog, null, null, playerFoodTree);
  return fatItem ? [...items, fatItem] : items;
}

export function prepareFixedMealItems(rawResult, isMainMeal = false) {
  if (!Array.isArray(rawResult)) {
    return {
      rawResult,
      fixedComponents: 0,
      fixedMacros: { kcal: 0, p: 0, hc: 0, g: 0, proteina: 0, hidratos: 0, grasa: 0 },
      fixedOnly: false,
    };
  }

  const portioned = rawResult.map((item) => {
    // Acompañamiento de un plato en comida o cena (fiambre, huevo, lácteo): su ración mínima, fija.
    // Lo que una pauta o un protocolo nombran a mano se calcula como siempre.
    if (isMainMeal && !item?.explicit && getProteinRole(item?.food, { isMainMeal: true }) === PROTEIN_ROLE.SIDE) {
      return { ...item, grams: Number(item.food.minGrams) || item.grams, isFixedComponent: true };
    }
    const group = getFixedFoodGroup(item?.food);
    if (!group) return item;
    // Los complementos (salsas, condimentos) son una ración fija de acompañamiento.
    if (group === 'complemento') {
      return { ...item, grams: getFixedFoodPortion(item.food, group) ?? item.grams, isFixedComponent: true };
    }
    // Fruta, yogur, leche y otros lácteos: la ración típica es el punto de partida, pero el motor la ajusta
    // dentro del rango del catálogo como cualquier otro alimento.
    const portion = isMainMeal && group === 'fruta'
      ? Math.min(120, Math.max(100, Number(item.food?.minGrams) || 100))
      : getFixedFoodPortion(item.food, group) ?? item.grams;
    return { ...item, grams: portion, isFixedComponent: false };
  });
  const isVegetable = (item) => getFoodRootBranch(item?.food) === 'verduras';
  const vegetableCount = isMainMeal ? portioned.filter(isVegetable).length : 0;
  const vegetableShare = Math.max(SHARED_VEGETABLE_MIN_G, roundToFive(SHARED_VEGETABLES_TOTAL_G / Math.max(1, vegetableCount)));
  const prepared = vegetableCount >= SHARED_VEGETABLES_MIN_COUNT
    ? portioned.map((item) => (isVegetable(item) ? { ...item, grams: vegetableShare, isFixedComponent: true } : item))
    : portioned;
  const hasBranchData = prepared.every((item) => getFoodRootBranch(item?.food));
  const hasPrimaryProtein = prepared.some((item) => getFoodRootBranch(item?.food) === 'proteina' || isAnimalProteinFood(item?.food));
  const hasPrimaryCarb = prepared.some((item) => getFoodRootBranch(item?.food) === 'hidratos');
  const fixedOnly = !isMainMeal && prepared.length > 0 && hasBranchData && !hasPrimaryProtein && !hasPrimaryCarb
    && prepared.every((item) => item.isFixedComponent === true);
  const fixedPrepared = fixedOnly
    ? prepared.map((item) => {
      if (Number.isFinite(Number(item?.grams))) return { ...item, isFixedComponent: true };
      const rootBranch = getFoodRootBranch(item?.food);
      const isProtein = rootBranch === 'proteina' || isAnimalProteinFood(item?.food);
      const isCarb = rootBranch === 'hidratos';
      const fallbackGrams = (isProtein || isCarb)
        ? Number(item?.food?.maxGrams)
        : Number(item?.food?.minGrams);
      return Number.isFinite(fallbackGrams)
        ? { ...item, grams: fallbackGrams, isFixedComponent: true }
        : { ...item, isFixedComponent: true };
    })
    : prepared;
  const fixedItems = fixedOnly
    ? fixedPrepared
    : fixedPrepared.filter((item) => item?.isFixedComponent === true);

  return {
    rawResult: fixedPrepared,
    fixedComponents: fixedItems.length,
    fixedMacros: calculateMacroTotals(fixedItems),
    fixedOnly,
  };
}
