import { roundToFive } from '@/lib/utils';
import { normalizeFoodName } from '@/data/foods-crudo';
import { isMainMeal as checkIsMainMeal } from '@/config/nutrition-days';
import {
  hasTreePath,
  isAnimalProteinFood,
  isFatFood,
  isDairyFood,
  isEggFood,
  resolveNodeForPlayer,
  getPlayerFoodTree,
  buildContextualPlayerFoodTree,
} from '@/lib/engine/food-tree';
import {
  isEggItem,
  calculateEggAndClaras,
  formatMealItemDisplayName,
} from '@/lib/nutrition/utils';

// ====================================================================================================
// REGLAS DE RACIÓN DEL CALCULADOR
// Gramos por ración servida, salvo que se indique otra unidad. Los mínimos y máximos de cada alimento salen de su
// ficha del catálogo; aquí están solo las reglas que el calculador añade encima. Si cambias un valor, repite la
// simulación de planes para ver si el cuadre y las restricciones se mantienen.
// ====================================================================================================

// --- Pan
const BREAD_COMPANION_MIN_G = 30; // ración mínima del pan que acompaña a un plato de hidrato
const BREAD_COMPANION_MAX_G = 60; // ración máxima de ese pan de acompañamiento
const BREAD_COMPANION_START_G = 40; // ración inicial del pan que se añade cuando hay hipercarga
const BREAD_COMPANION_TRIGGER_DISH_G = 140; // se añade pan si lo que sobra equivale a más de estos g del hidrato de plato

// --- Hidrato de plato (arroz, pasta, tubérculo, legumbre, otros granos)
const DISH_CARB_MIN_MAIN_G = 75; // ración mínima de un plato de hidrato en comida o cena
const MIN_DISH_G = { tuber: 150, cereal: 60 }; // plato mínimo "digno": decide si además del plato cabe el pan
const STANDARD_DISH_G = { tuber: 250, cereal: 85 }; // plato estándar: lo que queda por encima es para el pan
const TUBER_RESIDUAL_EXCESS_CHO_G = 20; // exceso de hidratos (g) por debajo del cual no se añade un cereal secundario
const TUBER_REBALANCED_G = 310; // ración a la que baja el tubérculo cuando se rebalancea con un cereal secundario
const FRUIT_AFTER_TUBER_REBALANCE_G = 150; // fruta de esa comida tras el rebalanceo
const HYPERCARGA_CEREAL_MIN_G = 130; // cereal de plato en hipercarga: suelo
const HYPERCARGA_CEREAL_MAX_G = 160; // cereal de plato en hipercarga: techo
const FRUIT_HYPERCARGA_G = 180; // fruta en hipercarga

// --- Fruta de postre en comidas y cenas
const DESSERT_FRUIT_MIN_G = 100; // ración mínima de la fruta de postre añadida por el motor
const DESSERT_FRUIT_MAX_G = 120; // ración máxima de la fruta de postre añadida por el motor

// --- Tomas ligeras: qué se considera hidrato o proteína principal (por 100 g de alimento)
const LIGHT_MEAL_CARB_MIN_CHO = 15; // hidratos mínimos para que un alimento pueda ser el hidrato principal
const LIGHT_MEAL_PROTEIN_MIN_PRO = 10; // proteína mínima para que un alimento pueda ser la proteína principal
const CARB_PRIORITY_DISH_MAIN = 2; // prioridad de un plato de hidrato en comida o cena
const CARB_PRIORITY_DISH_LIGHT = 1.5; // prioridad de un plato de hidrato en una toma ligera
const CARB_PRIORITY_OTHER = 1; // prioridad de cualquier otro alimento con hidratos

// --- Redes de seguridad
const PROTEIN_RESCUE_START_G = 150; // ración inicial de la proteína que se añade si la comida no tiene ninguna
const CARB_RESCUE_START_G = 100; // ración inicial del hidrato que se añade si la comida no tiene ninguno
const PROTEIN_COMPLEMENT_MIN_SHORTFALL_G = 15; // proteína que debe faltar (g) para añadir una proteína de plato más

// --- Huevos
const EXPLICIT_EGGS_PROTEIN_G = 12.5; // proteína de los 2 huevos de una pauta en comida o cena
const MIN_PRIMARY_PROTEIN_EGG_G = 6.25; // proteína mínima del huevo como proteína principal (1 huevo)
const MIN_PRIMARY_PROTEIN_G = 6; // proteína mínima de cualquier otra proteína principal
const DEFAULT_EGG_PRO_PER_100G = 13; // proteína por 100 g que se asume si la ficha del huevo no la trae

// --- Alimento sin ración todavía
const UNSET_ITEM_G = 100; // ración que se asume para un alimento al que aún no se le ha calculado ninguna

// --- Ajuste fino de cada toma y del día completo
const PROTEIN_TOLERANCE_G = 3; // la proteína nunca se aleja más de esto de su objetivo para cuadrar otros macros
const REFINE_STEPS_G = [-20, -10, -5, 5, 10, 20]; // cambios de gramos que se prueban en cada alimento
const REFINE_MAX_ITERATIONS = 40; // vueltas máximas del ajuste de una toma
const DAY_REFINE_MAX_ITERATIONS = 300; // vueltas máximas del ajuste del día completo
const DAY_REFINE_MEAL_WEIGHT = 0.15; // peso de que cada toma siga cerca de su presupuesto frente al cuadre del día

function getCatalogFood(name, options = {}) {
  if (!name) return null;
  const normalizedName = normalizeFoodName(name);
  const byNorm = options.clinicalCatalog?.foodsByNormalizedName?.get(normalizedName);
  if (byNorm) return byNorm;
  if (Array.isArray(options.clinicalCatalog?.foods)) {
    const found = options.clinicalCatalog.foods.find((f) =>
      normalizeFoodName(f.name) === normalizedName ||
      normalizeFoodName(f.originalName || '') === normalizedName
    );
    if (found) return found;
  }
  return null;
}

/**
 * Normaliza una hoja que ya viene resuelta por el árbol.
 *
 * El alimento ya contiene sus datos del catálogo y no hay que volver a
 * localizarlo por nombre.
 */
function normalizeResolvedMealItem(item) {
  if (!item?.food) return null;

  return {
    name: item.name || item.food.name,
    grams: item.grams ?? item.food.minGrams ?? null,
    food: item.food,
    displayName: item.displayName,
    isFixedComponent: item.isFixedComponent === true,
    explicit: item.explicit === true,
  };
}

function calculateResolvedMealMacros(items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const totals = { kcal: 0, proteina: 0, hidratos: 0, grasa: 0 };
  for (const item of items) {
    const grams = Number(item?.grams);
    const food = item?.food;
    if (!Number.isFinite(grams) || !food) return null;
    if (![food.kcal, food.pro, food.cho, food.fat].every((value) => Number.isFinite(Number(value)))) {
      return null;
    }

    const factor = grams / 100;
    totals.kcal += factor * Number(food.kcal);
    totals.proteina += factor * Number(food.pro);
    totals.hidratos += factor * Number(food.cho);
    totals.grasa += factor * Number(food.fat);
  }

  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, Math.round(value)])
  );
}

function withMealDiagnostics(text, items, enabled) {
  if (!enabled) return text;
  return {
    text,
    parsedItems: items,
    items,
    macrosReales: calculateResolvedMealMacros(items),
  };
}


function refineBounds(it, { isMainMeal }) {
  const max = Number(it.food.maxGrams);
  // Compensación: el hidrato de plato baja de 75 g hasta su mínimo de catálogo si el cuadre lo pide.
  // El aceite de cocinado de una comida principal puede bajar, pero siempre queda un mínimo de 5 g.
  const min = isMainMeal && hasTreePath(it.food, 'aceites') ? 5 : Number(it.food.minGrams);
  return { min, max };
}

// Alimentos que el motor puede retirar del todo (0 g) si sus raciones mínimas no caben en el presupuesto:
// la fruta de postre y el pan de una comida principal que no vienen de una pauta o protocolo.
function isOptionalItem(it, { isMainMeal }) {
  return Boolean(isMainMeal && !it.explicit && (hasTreePath(it.food, 'frutas') || hasTreePath(it.food, 'panes')));
}

function getRefinableItems(items, ctx) {
  return items.filter((it) => {
    if (it?.isFixedComponent === true || isEggItem(it) || !it.food) return false;
    if (hasTreePath(it.food, 'verduras') || hasTreePath(it.food, 'condimentos')) return false;
    if (!Number.isFinite(it.grams)) return false;
    const { min, max } = refineBounds(it, ctx);
    return Number.isFinite(min) && Number.isFinite(max) && max > min;
  });
}

function sumItemMacros(items) {
  return items.reduce((acc, it) => {
    const g = Number(it.grams);
    if (!Number.isFinite(g) || !it.food) return acc;
    acc.p += (g / 100) * Number(it.food.pro || 0);
    acc.hc += (g / 100) * Number(it.food.cho || 0);
    acc.g += (g / 100) * Number(it.food.fat || 0);
    acc.kcal += (g / 100) * Number(it.food.kcal || 0);
    return acc;
  }, { p: 0, hc: 0, g: 0, kcal: 0 });
}

// Error de un conjunto de macros frente a su objetivo, en el espacio de kcal.
// Las kcal totales son las reales de los alimentos (tabla) frente a las que implican los macros del objetivo:
// así se compensa, por ejemplo, la fruta o los frutos secos, que aportan menos kcal que 4·P + 4·HC + 9·G.
function macroError(totals, target, proteinWeight = 0) {
  const eP = 4 * (totals.p - target.p);
  const eC = 4 * (totals.hc - target.hc);
  const eG = 9 * (totals.g - target.g);
  const eK = (Number.isFinite(totals.kcal) ? totals.kcal : 4 * totals.p + 4 * totals.hc + 9 * totals.g)
    - (4 * target.p + 4 * target.hc + 9 * target.g);
  return proteinWeight * eP * eP + eC * eC + eG * eG + 0.5 * eK * eK;
}

const proteinWithinTolerance = (candidateP, currentP, targetP) => {
  const dp = Math.abs(candidateP - targetP);
  return dp <= PROTEIN_TOLERANCE_G || dp <= Math.abs(currentP - targetP);
};

/**
 * Ajuste fino final de una toma: tras el dimensionado por macro principal, prueba pequeños
 * cambios de gramos en todos los alimentos modificables y se queda solo con los que acercan
 * la toma a su objetivo. Reglas:
 * - la proteína es una restricción: ningún cambio puede alejarla del objetivo más allá de
 *   PROTEIN_TOLERANCE_G (salvo que la acerque);
 * - hidratos, grasa y kcal totales se minimizan juntos;
 * - cada alimento respeta sus mínimos y máximos de catálogo;
 * - lo fijo, los huevos, las verduras y los condimentos no se tocan;
 * - nunca se añade ni se quita un alimento.
 */
function refineMealMacros(items, targetBudget, { isMainMeal }) {
  const target = { p: Number(targetBudget?.p), hc: Number(targetBudget?.hc), g: Number(targetBudget?.g) };
  if (![target.p, target.hc, target.g].every(Number.isFinite)) return;

  const ctx = { isMainMeal };
  const adjustable = getRefinableItems(items, ctx);
  if (adjustable.length === 0) return;

  let current = sumItemMacros(items);
  for (let iter = 0; iter < REFINE_MAX_ITERATIONS; iter++) {
    const currentCost = macroError(current, target);
    let best = null;
    for (const it of adjustable) {
      const { min, max } = refineBounds(it, ctx);
      const nextValues = REFINE_STEPS_G.map((step) => roundToFive(Math.min(max, Math.max(min, it.grams + step))));
      if (isOptionalItem(it, ctx)) nextValues.push(0);
      for (const next of nextValues) {
        if (next === it.grams) continue;
        const delta = next - it.grams;
        const candidate = {
          p: current.p + (delta / 100) * Number(it.food.pro || 0),
          hc: current.hc + (delta / 100) * Number(it.food.cho || 0),
          g: current.g + (delta / 100) * Number(it.food.fat || 0),
          kcal: current.kcal + (delta / 100) * Number(it.food.kcal || 0),
        };
        if (!proteinWithinTolerance(candidate.p, current.p, target.p)) continue;
        const c = macroError(candidate, target);
        if (c < currentCost - 1e-6 && (!best || c < best.cost)) best = { it, next, candidate, cost: c };
      }
    }
    if (!best) break;
    best.it.grams = best.next;
    current = best.candidate;
  }
}

/**
 * Mejora iterativa del día completo. Con todas las tomas ya calculadas, ajusta los gramos de
 * los alimentos modificables de cualquier toma, de uno en uno, y aplica en cada vuelta el cambio
 * que más acerca el día a su objetivo, hasta que ningún cambio mejora. Reglas:
 * - el error del día (kcal, hidratos, grasa, proteína) es lo que se minimiza, con un peso menor
 *   para que cada toma siga cerca de su presupuesto original y no se concentre el desvío en una;
 * - la proteína, tanto del día como de cada toma, no se aleja más de PROTEIN_TOLERANCE_G;
 * - mismos límites y exclusiones que el ajuste por toma; nunca se añade ni se quita un alimento.
 *
 * @param {Array<{items: Array, isMainMeal: boolean, target: {p:number,hc:number,g:number}}>} meals
 * @param {{p:number,hc:number,g:number}} dayTarget
 * @param {{ fixedTotals?: {p:number,hc:number,g:number} }} options
 */
export function refineDayMacros(meals, dayTarget, { fixedTotals = { p: 0, hc: 0, g: 0 } } = {}) {
  if (!Array.isArray(meals) || meals.length === 0) return;
  if (![dayTarget?.p, dayTarget?.hc, dayTarget?.g].every((value) => Number.isFinite(Number(value)))) return;
  const day = { p: Number(dayTarget.p), hc: Number(dayTarget.hc), g: Number(dayTarget.g) };

  const states = meals.map((meal) => {
    const target = { p: Number(meal.target?.p), hc: Number(meal.target?.hc), g: Number(meal.target?.g) };
    const ctx = { isMainMeal: meal.isMainMeal };
    return { meal, target, ctx, adjustable: getRefinableItems(meal.items, ctx), totals: sumItemMacros(meal.items) };
  });
  if (states.every((state) => state.adjustable.length === 0)) return;

  const dayTotals = () => states.reduce((acc, state) => ({
    p: acc.p + state.totals.p,
    hc: acc.hc + state.totals.hc,
    g: acc.g + state.totals.g,
    kcal: acc.kcal + state.totals.kcal,
  }), { kcal: 4 * fixedTotals.p + 4 * fixedTotals.hc + 9 * fixedTotals.g, ...fixedTotals });
  const mealPenalty = (state, totals) => (
    Number.isFinite(state.target.p) && Number.isFinite(state.target.hc) && Number.isFinite(state.target.g)
      ? DAY_REFINE_MEAL_WEIGHT * macroError(totals, state.target, 2)
      : 0
  );
  const totalCost = (currentDay) => macroError(currentDay, day, 2) + states.reduce((sum, state) => sum + mealPenalty(state, state.totals), 0);

  let currentDay = dayTotals();
  for (let iter = 0; iter < DAY_REFINE_MAX_ITERATIONS; iter++) {
    const baseCost = totalCost(currentDay);
    let best = null;
    for (const state of states) {
      const baseMealPenalty = mealPenalty(state, state.totals);
      for (const it of state.adjustable) {
        const { min, max } = refineBounds(it, state.ctx);
        const nextValues = REFINE_STEPS_G.map((step) => roundToFive(Math.min(max, Math.max(min, it.grams + step))));
        if (isOptionalItem(it, state.ctx)) nextValues.push(0);
        for (const next of nextValues) {
          if (next === it.grams) continue;
          const delta = ((next - it.grams) / 100);
          const d = { p: delta * Number(it.food.pro || 0), hc: delta * Number(it.food.cho || 0), g: delta * Number(it.food.fat || 0), kcal: delta * Number(it.food.kcal || 0) };
          const mealTotals = { p: state.totals.p + d.p, hc: state.totals.hc + d.hc, g: state.totals.g + d.g, kcal: state.totals.kcal + d.kcal };
          const candidateDay = { p: currentDay.p + d.p, hc: currentDay.hc + d.hc, g: currentDay.g + d.g, kcal: currentDay.kcal + d.kcal };
          if (Number.isFinite(state.target.p) && !proteinWithinTolerance(mealTotals.p, state.totals.p, state.target.p)) continue;
          if (!proteinWithinTolerance(candidateDay.p, currentDay.p, day.p)) continue;
          const cost = baseCost - baseMealPenalty + mealPenalty(state, mealTotals) - macroError(currentDay, day, 2) + macroError(candidateDay, day, 2);
          if (cost < baseCost - 1e-6 && (!best || cost < best.cost)) best = { state, it, next, mealTotals, candidateDay, cost };
        }
      }
    }
    if (!best) break;
    best.it.grams = best.next;
    best.state.totals = best.mealTotals;
    currentDay = best.candidateDay;
  }
}

/** Texto y macros finales de una toma a partir de sus alimentos ya calibrados. */
export function buildMealOutput(items) {
  return {
    text: items.map((it) => formatMealItemDisplayName(it)).join(', '),
    macrosReales: calculateResolvedMealMacros(items),
  };
}

/**
 * Calibrador de precisión:
 * Ajusta matemáticamente los gramos del cereal/tubérculo y de la proteína principal
 * redondeando SIEMPRE a múltiplos de 5 gramos (ej: 193g -> 195g).
 */
export async function calibrateMeal(mealDetailStr, targetBudget, options = {}) {
  const isStructuredMeal = Array.isArray(mealDetailStr);
  if (!mealDetailStr || (!isStructuredMeal && typeof mealDetailStr !== 'string')) {
    return withMealDiagnostics(mealDetailStr, null, options.returnDiagnostics);
  }
  if (!targetBudget) return withMealDiagnostics(mealDetailStr, null, options.returnDiagnostics);

  // Las comidas normales llegan desde el árbol como hojas estructuradas.
  // Si entra texto sin resolver, se conserva sin intentar adivinar alimentos.
  if (!isStructuredMeal) return withMealDiagnostics(mealDetailStr, null, options.returnDiagnostics);

  let parsedItems = mealDetailStr.map(normalizeResolvedMealItem).filter(Boolean);

  if (parsedItems.length === 0) return withMealDiagnostics('', null, options.returnDiagnostics);

  // Consolidar duplicados del mismo alimento (ej: dos entradas de "Arroz blanco")
  const consolidatedMap = new Map();
  parsedItems.forEach(it => {
    const key = normalizeFoodName(it.name);
    if (consolidatedMap.has(key)) {
      const existing = consolidatedMap.get(key);
      existing.grams = (existing.grams || UNSET_ITEM_G) + (it.grams || UNSET_ITEM_G);
    } else {
      consolidatedMap.set(key, { ...it });
    }
  });
  parsedItems = Array.from(consolidatedMap.values());

  const isFixedItem = (item) => item?.isFixedComponent === true;

  if (options.fixedOnly) {
    const fixedText = parsedItems.map((item) => formatMealItemDisplayName(item)).join(', ');
    return withMealDiagnostics(fixedText, parsedItems, options.returnDiagnostics);
  }



  // Identificar roles de alimentos
  let primaryCarbIndex = -1;
  let maxChoPriority = -1; // 2: Cereal/tubérculo de plato, 1: Pan/tortas/harinas, 0: otros
  let maxChoDensity = -1;

  let primaryProteinIndex = -1;
  let maxProDensity = -1;
  const isPlantProtein = (item) => {
    return hasTreePath(item.food, 'legumbres') || hasTreePath(item.food, 'vegetal_proteina');
  };

  let primaryFatIndex = -1;

  const isMainMeal = checkIsMainMeal(options.mealName, options);
  // Vista de comida principal del jugador: sin cereales de desayuno (tortitas, avena...), pan ni conservas.
  // Es la que usa el motor cuando elige por su cuenta (hidrato y proteína de rescate, complemento de proteína).
  let mainMealTreeCache = null;
  const getMainMealTree = () => {
    mainMealTreeCache ||= buildContextualPlayerFoodTree(
      getPlayerFoodTree(options.clinicalCatalog, options.playerFoodTree),
      { mealName: options.mealName, isMainMeal: true }
    );
    return mainMealTreeCache;
  };
  const allowsPlantProtein = options.isVegan || options.isVegetarian;

  parsedItems.forEach((it, idx) => {
    if (isFixedItem(it)) return;

    // Hidrato primario
    const isFruit = hasTreePath(it.food, 'frutas');
    const isWrap = hasTreePath(it.food, 'wraps');
    const isDishCarb = hasTreePath(it.food, 'arroz') ||
      hasTreePath(it.food, 'pasta') ||
      hasTreePath(it.food, 'tuberculos') ||
      hasTreePath(it.food, 'otros_granos') ||
      hasTreePath(it.food, 'legumbres') ||
      isWrap;
    const isBread = hasTreePath(it.food, 'panes');
    const isVegOrCondiment = hasTreePath(it.food, 'verduras') || hasTreePath(it.food, 'condimentos');

    const isEligiblePrimaryCarb = !isFruit && !isVegOrCondiment && (
      isDishCarb ||
      (!isMainMeal && (it.food?.cho || 0) > LIGHT_MEAL_CARB_MIN_CHO)
    );

    if (isEligiblePrimaryCarb) {
      // En comidas principales, el pan convencional nunca puede ser el hidrato principal (solo secundario de acompañamiento)
      if (isMainMeal && isBread) {
        return;
      }

      // En comidas y cenas principales, los cereales/tubérculos de plato tienen prioridad absoluta (2)
      let carbPriority = isDishCarb ? (isMainMeal ? CARB_PRIORITY_DISH_MAIN : CARB_PRIORITY_DISH_LIGHT) : CARB_PRIORITY_OTHER;

      if (carbPriority > maxChoPriority || (carbPriority === maxChoPriority && (it.food.cho || 0) > maxChoDensity)) {
        maxChoPriority = carbPriority;
        maxChoDensity = it.food.cho || 0;
        primaryCarbIndex = idx;
      }
    }

    // Proteína primaria (carne, ave, pescado, conservas o claras escalables)
    if (isMainMeal) {
      // En comidas y cenas principales, la proteína primaria DEBE ser carne, ave o pescado limpio de plato
      if (isAnimalProteinFood(it.food) || (allowsPlantProtein && isPlantProtein(it))) {
        if (it.food.pro > maxProDensity) {
          maxProDensity = it.food.pro;
          primaryProteinIndex = idx;
        }
      }
    } else {
      if (isAnimalProteinFood(it.food) || isDairyFood(it.food) || isEggItem(it) || (it.food?.pro > LIGHT_MEAL_PROTEIN_MIN_PRO)) {
        if (it.food.pro > maxProDensity) {
          maxProDensity = it.food.pro;
          primaryProteinIndex = idx;
        }
      }
    }

    // Grasa primaria (AOVE / Aceites / Grasas limpias del árbol)
    if (isFatFood(it.food)) {
      primaryFatIndex = idx;
    }
  });

  // En comidas y cenas principales, SOLO PUEDE HABER UNA PROTEÍNA PRINCIPAL LIMPIA (carne, ave o pescado).
  // Se purga cualquier segunda proteína incompatible (huevos, claras, quesos, yogures o segunda carne).
  if (isMainMeal && primaryProteinIndex !== -1) {
    const toRemove = [];
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryProteinIndex && !isFixedItem(it) && !it.explicit) {
        // Las legumbres son hidrato de plato (se dimensionan como tal): solo se purga la proteína vegetal
        // dedicada (soja, tofu, seitán...), nunca la legumbre elegida como hidrato.
        const isPlantProt = isPlantProtein(it) && !hasTreePath(it.food, 'legumbres');
        const isProt = (
          isAnimalProteinFood(it.food) ||
          isDairyFood(it.food) ||
          isEggFood(it.food) ||
          isEggItem(it) ||
          (isPlantProt && !allowsPlantProtein)
        );
        if (isProt) {
          toRemove.push(idx);
        }
      }
    });
    if (toRemove.length > 0) {
      const primaryItem = parsedItems[primaryProteinIndex];
      const primaryCarbItem = primaryCarbIndex !== -1 ? parsedItems[primaryCarbIndex] : null;
      const primaryFatItem = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
      parsedItems = parsedItems.filter((_, idx) => !toRemove.includes(idx));
      primaryProteinIndex = parsedItems.indexOf(primaryItem);
      if (primaryCarbItem) primaryCarbIndex = parsedItems.indexOf(primaryCarbItem);
      if (primaryFatItem) primaryFatIndex = parsedItems.indexOf(primaryFatItem);
    }
  }

  // En comidas y cenas principales, calibración del acompañante de hidratos (pan):
  // El pan no tiene una ración fija: se evalúa dinámicamente según la holgura de hidratos.
  // Si no hay margen para mantener una ración digna del plato principal (arroz/pasta/patata), se descarta el pan.
  if (isMainMeal && primaryCarbIndex !== -1) {
    const breadIdx = parsedItems.findIndex((it, idx) => {
      if (idx === primaryCarbIndex) return false;
      return hasTreePath(it.food, 'panes');
    });

    if (breadIdx !== -1) {
      const breadItem = parsedItems[breadIdx];
      const primaryItem = parsedItems[primaryCarbIndex];
      const primaryChoFactor = Number(primaryItem.food.cho) / 100;
      const isTuber = hasTreePath(primaryItem.food, 'tuberculos');
      const minDishGrams = isTuber ? MIN_DISH_G.tuber : MIN_DISH_G.cereal;
      const minDishCho = minDishGrams * primaryChoFactor;

      // Hidratos aportados por fruta de postre y verduras
      let fixedCarbs = 0;
      parsedItems.forEach((it, idx) => {
        if (idx !== breadIdx && idx !== primaryCarbIndex) {
          fixedCarbs += (it.grams / 100) * Number(it.food?.cho || 0);
        }
      });

      const carbRoom = targetBudget.hc - fixedCarbs;
      const minBreadCho = BREAD_COMPANION_MIN_G * (Number(breadItem.food.cho) / 100);

      if (carbRoom < minDishCho + minBreadCho && breadItem.explicit) {
        // El pan lo nombra la pauta o el protocolo: se conserva en su ración mínima.
        breadItem.grams = breadItem.food.minGrams;
      } else if (carbRoom < minDishCho + minBreadCho) {
        // No hay margen suficiente para el plato principal y el pan a la vez:
        // Se purga el pan para que el plato principal mantenga su gramaje mínimo digno.
        const primaryCarbObj = parsedItems[primaryCarbIndex];
        parsedItems = parsedItems.filter((_, idx) => idx !== breadIdx);
        primaryCarbIndex = parsedItems.indexOf(primaryCarbObj);
        if (primaryProteinIndex > breadIdx) primaryProteinIndex--;
        if (primaryFatIndex > breadIdx) primaryFatIndex--;
      } else {
        // Hay margen holgado: calibrar el pan dinámicamente entre 30g y 60g según los hidratos sobrantes
        const standardDishCho = (isTuber ? STANDARD_DISH_G.tuber : STANDARD_DISH_G.cereal) * primaryChoFactor;
        const availableForBread = Math.max(0, carbRoom - standardDishCho);
        const breadChoFactor = Number(breadItem.food.cho) / 100;
        let calibratedBreadGrams = roundToFive(availableForBread / breadChoFactor);
        calibratedBreadGrams = Math.min(BREAD_COMPANION_MAX_G, Math.max(BREAD_COMPANION_MIN_G, calibratedBreadGrams));
        breadItem.grams = calibratedBreadGrams;
      }
    }
  }

  if (isMainMeal && primaryCarbIndex !== -1) {

    // En comidas y cenas, evitar duplicar dos bases de plato de la misma categoría de cereal/pasta compitiendo
    const isCerealDish = (item) => {
      if (!item?.food) return false;
      return hasTreePath(item.food, 'arroz') ||
        hasTreePath(item.food, 'pasta') ||
        hasTreePath(item.food, 'otros_granos');
    };

    const isPrimaryCereal = isCerealDish(parsedItems[primaryCarbIndex]);

    if (isPrimaryCereal) {
      const competingIndices = [];
      parsedItems.forEach((it, idx) => {
        if (idx !== primaryCarbIndex && isCerealDish(it)) {
          competingIndices.push(idx);
        }
      });

      const namesCompetingCereal = [primaryCarbIndex, ...competingIndices].some((idx) => parsedItems[idx]?.explicit);
      if (competingIndices.length > 0 && !namesCompetingCereal) {
        let bestIndex = primaryCarbIndex;
        competingIndices.forEach(idx => {
          if ((parsedItems[idx].grams || 0) > (parsedItems[bestIndex].grams || 0)) {
            bestIndex = idx;
          }
        });

        const toRemove = [primaryCarbIndex, ...competingIndices].filter(i => i !== bestIndex);
        const bestItem = parsedItems[bestIndex];
        const primaryProteinItem = primaryProteinIndex !== -1 ? parsedItems[primaryProteinIndex] : null;
        const primaryFatItem = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
        console.warn(`[NUTRICIÓN] Purgando cereal secundario incompatible en comida principal para evitar duplicar bases.`);
        parsedItems = parsedItems.filter((_, idx) => !toRemove.includes(idx));
        primaryCarbIndex = parsedItems.indexOf(bestItem);
        if (primaryCarbIndex === -1) {
          primaryCarbIndex = 0;
        }
        if (primaryProteinItem) primaryProteinIndex = parsedItems.indexOf(primaryProteinItem);
        if (primaryFatItem) primaryFatIndex = parsedItems.indexOf(primaryFatItem);
      }
    }
  }

  // Si hay claras y huevos enteros en desayuno, preferir calibrar las claras líquidas
  const clarasIdx = parsedItems.findIndex(it => String(it?.name || '').toLowerCase().includes('clara'));
  if (clarasIdx !== -1) {
    primaryProteinIndex = clarasIdx;
  }

  // RED DE SEGURIDAD OBLIGATORIA DE PROTEÍNA EN COMIDAS Y CENAS:
  // Si en una comida o cena principal no hay fuente de proteína limpia,
  // inyectar automáticamente una proteína limpia del árbol taxonómico del jugador
  if (isMainMeal && primaryProteinIndex === -1) {
    let chosenFood = null;
    const resolvedProtName = resolveNodeForPlayer(
      'proteina',
      options.clinicalCatalog,
      null,
      options.tracker,
      getMainMealTree()
    );
    if (resolvedProtName) {
      chosenFood = getCatalogFood(resolvedProtName, options);
    }

    if (chosenFood) {
      const rescueItem = {
        name: chosenFood.name,
        grams: PROTEIN_RESCUE_START_G,
        food: chosenFood,
      };

      const insertIdx = primaryCarbIndex !== -1 ? primaryCarbIndex + 1 : 0;
      parsedItems.splice(insertIdx, 0, rescueItem);
      primaryProteinIndex = insertIdx;
      if (primaryCarbIndex >= insertIdx && primaryCarbIndex !== -1) primaryCarbIndex++;
      if (primaryFatIndex >= insertIdx) primaryFatIndex++;
    }
  }

  // RED DE SEGURIDAD OBLIGATORIA DE HIDRATO DE PLATO EN COMIDAS Y CENAS:
  // Si en una comida o cena principal no hay hidrato de plato,
  // inyectar un cereal/tubérculo limpio resuelto desde el árbol taxonómico del jugador
  if (isMainMeal && primaryCarbIndex === -1) {
    let chosenCarb = null;
    const resolvedCarbName = resolveNodeForPlayer(
      'hidratos',
      options.clinicalCatalog,
      null,
      options.tracker,
      getMainMealTree()
    );
    if (resolvedCarbName) {
      chosenCarb = getCatalogFood(resolvedCarbName, options);
    }
    if (chosenCarb) {
      const rescueCarb = {
        name: chosenCarb.name,
        grams: CARB_RESCUE_START_G,
        food: chosenCarb,
      };
      parsedItems.unshift(rescueCarb);
      primaryCarbIndex = 0;
      if (primaryProteinIndex !== -1) primaryProteinIndex++;
      if (primaryFatIndex !== -1) primaryFatIndex++;
    }
  }

  // 1. Calibrar Carbohidratos con Reparto Armónico:
  let nonPrimaryCarbs = 0;
  parsedItems.forEach((it, idx) => {
    if (idx === primaryCarbIndex) return;
    const isVeg = hasTreePath(it.food, 'verduras') || hasTreePath(it.food, 'condimentos');
    // En comidas principales, las verduras fibrosas y condimentos libres no restan cuota de hidratos al cereal principal
    if (isMainMeal && isVeg) return;
    nonPrimaryCarbs += (it.grams / 100) * (it.food?.cho || 0);
  });

  if (primaryCarbIndex !== -1) {
    const carbItem = parsedItems[primaryCarbIndex];
    if (!carbItem.food || carbItem.food.minGrams === undefined || carbItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${carbItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }
    const choFactor = Number(carbItem.food.cho) / 100;
    if (choFactor <= 0) {
      throw new Error(`Alimento de hidratos "${carbItem.name}" sin carbohidratos válidos en el catálogo.`);
    }
    const isDishCarb = hasTreePath(carbItem.food, 'arroz') ||
      hasTreePath(carbItem.food, 'pasta') ||
      hasTreePath(carbItem.food, 'otros_granos') ||
      hasTreePath(carbItem.food, 'legumbres');
    const minP = isMainMeal && isDishCarb
      ? Math.max(carbItem.food.minGrams, DISH_CARB_MIN_MAIN_G)
      : carbItem.food.minGrams;
    const maxP = carbItem.food.maxGrams;
    const isTuber = hasTreePath(carbItem.food, 'tuberculos');

    // Identificar o asegurar fruta de postre en comida principal
    let fruitItem = parsedItems.find(it => hasTreePath(it.food, 'frutas'));
    let fruitCanAdjust = fruitItem && !isFixedItem(fruitItem);
    if (!fruitItem && isMainMeal) {
      let dessertFruit = null;
      const fruitName = resolveNodeForPlayer(
        'frutas',
        options.clinicalCatalog,
        null,
        options.tracker,
        options.playerFoodTree
      );
      if (fruitName) {
        dessertFruit = getCatalogFood(fruitName, options);
      }
      if (dessertFruit) {
        const baseFruitGrams = Math.min(DESSERT_FRUIT_MAX_G, Math.max(DESSERT_FRUIT_MIN_G, Number(dessertFruit.minGrams) || DESSERT_FRUIT_MIN_G));
        fruitItem = {
          name: dessertFruit.name,
          grams: baseFruitGrams,
          food: dessertFruit,
        };
        parsedItems.push(fruitItem);
        fruitCanAdjust = true;
        nonPrimaryCarbs += (baseFruitGrams / 100) * Number(dessertFruit.cho);
      }
    }

    let maxF = 0;
    let fruitChoFactor = 0;
    if (fruitItem) {
      if (!fruitItem.food || fruitItem.food.minGrams === undefined || fruitItem.food.maxGrams === undefined) {
        throw new Error(`Alimento "${fruitItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
      }
      maxF = fruitItem.food.maxGrams;
      fruitChoFactor = Number(fruitItem.food.cho) / 100;
    }

    const neededCho = Math.max(0, targetBudget.hc - nonPrimaryCarbs);
    let rawCarbGrams = roundToFive(neededCho / choFactor);

    if (isTuber) {
      // === CASO TUBÉRCULO (Patata / Boniato) ===
      if (rawCarbGrams <= maxP) {
        carbItem.grams = roundToFive(Math.max(minP, rawCarbGrams));
      } else {
        // Supera el máximo del tubérculo (450g)
        const excessCho = Math.max(0, (rawCarbGrams - maxP) * choFactor);
        const currentFruitGrams = fruitItem ? (fruitItem.grams || UNSET_ITEM_G) : UNSET_ITEM_G;
        const availableFruitCho = fruitCanAdjust
          ? Math.max(0, (maxF - currentFruitGrams) * fruitChoFactor)
          : 0;

        if (excessCho <= availableFruitCho && fruitCanAdjust) {
          // Exceso pequeño: cabe en la fruta sin rebasar su tope de 200g
          carbItem.grams = maxP;
          const extraFruitGrams = roundToFive(excessCho / fruitChoFactor);
          fruitItem.grams = roundToFive(Math.min(maxF, currentFruitGrams + extraFruitGrams));
        } else {
          // El exceso supera la holgura de la fruta
          const remExcessAfterFruit = excessCho - availableFruitCho;
          if (remExcessAfterFruit < TUBER_RESIDUAL_EXCESS_CHO_G) {
            // Exceso residual pequeño (< 20g HC): la fruta sube a su tope (200g) y el tubérculo queda en 450g.
            // No se añade cereal testimonial (ej: 15g de arroz) para evitar platos amorfos.
            carbItem.grams = maxP;
            if (fruitCanAdjust) fruitItem.grams = maxF;
          } else if (isMainMeal) {
            // Exceso elevado (>= 20g HC pendientes, e.g. hipercarga o >130g HC totales):
            // Rebalanceo armónico: Tubérculo a zona media de confort (310g) + Cereal secundario (arroz/pasta >= 60g)
            carbItem.grams = TUBER_REBALANCED_G;
            if (fruitCanAdjust) fruitItem.grams = FRUIT_AFTER_TUBER_REBALANCE_G;

            let otherCho = 0;
            parsedItems.forEach((it, idx) => {
              if (idx !== primaryCarbIndex) {
                otherCho += (it.grams / 100) * (it.food?.cho || 0);
              }
            });
            const primaryCho = (carbItem.grams / 100) * (carbItem.food?.cho || 0);
            const deficitForCereal = Math.max(0, targetBudget.hc - (otherCho + primaryCho));

            const existingCereal = parsedItems.find((it, idx) => {
              if (idx === primaryCarbIndex) return false;
              return (
                hasTreePath(it.food, 'arroz') ||
                hasTreePath(it.food, 'pasta') ||
                hasTreePath(it.food, 'otros_granos')
              ) && !hasTreePath(it.food, 'tuberculos');
            });

            if (existingCereal) {
              if (!existingCereal.food || existingCereal.food.minGrams === undefined || existingCereal.food.maxGrams === undefined) {
                throw new Error(`Alimento "${existingCereal.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
              }
              const secChoFactor = Number(existingCereal.food.cho) / 100;
              const minS = existingCereal.food.minGrams;
              const maxS = existingCereal.food.maxGrams;
              let secGrams = roundToFive(deficitForCereal / secChoFactor);
              secGrams = Math.min(maxS, Math.max(minS, secGrams));
              existingCereal.grams = secGrams;
            } else {
              let preferredCereal = 'arroz';
              if (options.tracker?.isSameDayCarb('arroz', 'arroz')) {
                preferredCereal = options.tracker?.isSameDayCarb('pasta', 'pasta') ? 'panes' : 'pasta';
              }
              const cerealName = resolveNodeForPlayer(
                preferredCereal,
                options.clinicalCatalog,
                options.player,
                options.tracker,
                options.playerFoodTree
              ) || resolveNodeForPlayer('arroz', options.clinicalCatalog, options.player, options.tracker, options.playerFoodTree) || 'Arroz blanco';
              let cerealFood = getCatalogFood(cerealName, options);
              if (!cerealFood) {
                cerealFood = getCatalogFood('Arroz blanco', options);
              }
              if (cerealFood) {
                if (cerealFood.minGrams === undefined || cerealFood.maxGrams === undefined) {
                  throw new Error(`Alimento "${cerealFood.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
                }
                const secChoFactor = Number(cerealFood.cho) / 100;
                const minS = cerealFood.minGrams;
                const maxS = cerealFood.maxGrams;
                let secGrams = roundToFive(Math.max(minS, deficitForCereal / secChoFactor));
                secGrams = Math.min(maxS, secGrams);
                const secondaryCerealItem = {
                  name: cerealFood.name,
                  grams: secGrams,
                  food: cerealFood,
                };
                parsedItems.unshift(secondaryCerealItem);
                primaryCarbIndex = parsedItems.indexOf(secondaryCerealItem);
                if (primaryProteinIndex !== -1) primaryProteinIndex++;
                if (primaryFatIndex !== -1) primaryFatIndex++;
              } else {
                carbItem.grams = maxP;
              }
            }
          } else {
            carbItem.grams = maxP;
          }
        }
      }
    } else {
      // === CASO CEREAL DE PLATO (Arroz blanco / Macarrones / Espaguetis) ===
      if (rawCarbGrams < minP) {
        // Demanda baja: el cereal no baja de su ración mínima; el ajuste fino posterior compensa la fruta y el resto.
        carbItem.grams = roundToFive(Math.max(minP, rawCarbGrams));
      } else if (rawCarbGrams <= maxP) {
        // Carga normal: el cereal absorbe limpiamente dentro de [minP, maxP]
        carbItem.grams = roundToFive(rawCarbGrams);
      } else {
        // Hipercarga que excede el tope digestivo del cereal (170g)
        const excessCho = Math.max(0, (rawCarbGrams - maxP) * choFactor);
        const currentFruitGrams = fruitItem ? (fruitItem.grams || UNSET_ITEM_G) : UNSET_ITEM_G;
        const availableFruitCho = fruitCanAdjust
          ? Math.max(0, (maxF - currentFruitGrams) * fruitChoFactor)
          : 0;

        if (excessCho <= availableFruitCho && fruitCanAdjust) {
          carbItem.grams = maxP;
          const extraFruitGrams = roundToFive(excessCho / fruitChoFactor);
          fruitItem.grams = roundToFive(Math.min(maxF, currentFruitGrams + extraFruitGrams));
        } else {
          // Hipercarga que excede el tope del cereal y la capacidad de la fruta:
          // Rebalanceo armónico: Cereal a zona alta cómoda (140g-160g), fruta a 180g-200g,
          // y si es comida principal, acompañante de pan (30g-60g) para no sobrecargar el estómago.
          if (fruitCanAdjust) fruitItem.grams = Math.min(maxF, FRUIT_HYPERCARGA_G);
          const fruitCho = fruitItem ? (fruitItem.grams / 100) * Number(fruitItem.food.cho) : 0;

          let otherCho = 0;
          parsedItems.forEach((it, idx) => {
            if (idx !== primaryCarbIndex && it !== fruitItem) {
              otherCho += (it.grams / 100) * (it.food?.cho || 0);
            }
          });

          const remCho = Math.max(0, targetBudget.hc - (fruitCho + otherCho));

          // Verificar si ya existe pan de acompañamiento o cualquier pan en la toma
          const alreadyHasBread = parsedItems.some((it) => hasTreePath(it.food, 'panes'));
          let breadItem = parsedItems.find((it, idx) => {
            if (idx === primaryCarbIndex) return false;
            return hasTreePath(it.food, 'panes');
          });

          if (!alreadyHasBread && !breadItem && isMainMeal && remCho > (BREAD_COMPANION_TRIGGER_DISH_G * choFactor)) {
            let breadFood = null;
            const resolvedBreadName = resolveNodeForPlayer(
              'panes',
              options.clinicalCatalog,
              options.player,
              options.tracker,
              options.playerFoodTree
            );
            if (resolvedBreadName) {
              breadFood = getCatalogFood(resolvedBreadName, options);
            }
            if (!breadFood && options.clinicalCatalog?.foods) {
              breadFood = options.clinicalCatalog.foods.find((f) => hasTreePath(f, 'panes')) || null;
            }
            if (breadFood) {
              if (breadFood.minGrams === undefined || breadFood.maxGrams === undefined) {
                throw new Error(`Alimento "${breadFood.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
              }
              breadItem = {
                name: breadFood.name,
                grams: BREAD_COMPANION_START_G,
                food: breadFood,
              };
              parsedItems.push(breadItem);
            }
          }

          if (breadItem) {
            if (!breadItem.food || breadItem.food.minGrams === undefined || breadItem.food.maxGrams === undefined) {
              throw new Error(`Alimento "${breadItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
            }
            const breadChoFactor = Number(breadItem.food.cho) / 100;
            const targetCerealGrams = Math.min(HYPERCARGA_CEREAL_MAX_G, Math.max(HYPERCARGA_CEREAL_MIN_G, roundToFive((remCho - (BREAD_COMPANION_START_G * breadChoFactor)) / choFactor)));
            carbItem.grams = targetCerealGrams;
            const cerealCho = (targetCerealGrams / 100) * Number(carbItem.food.cho);
            const forBreadCho = Math.max(0, remCho - cerealCho);
            const maxBread = breadItem.food.maxGrams;
            let calibratedBreadGrams = roundToFive(forBreadCho / breadChoFactor);
            calibratedBreadGrams = Math.min(maxBread, Math.max(breadItem.food.minGrams, calibratedBreadGrams));
            breadItem.grams = calibratedBreadGrams;

            const actualBreadCho = (calibratedBreadGrams / 100) * Number(breadItem.food.cho);
            const remainingForCereal = Math.max(0, remCho - actualBreadCho);
            carbItem.grams = Math.min(maxP, Math.max(targetCerealGrams, roundToFive(remainingForCereal / choFactor)));
          } else {
            carbItem.grams = Math.min(maxP, roundToFive(remCho / choFactor));
          }
        }
      }
    }
  }



  // 2. Calibrar Proteínas:
  // Detectar todas las fuentes dedicadas de proteína en la toma
  const proteinItemIndices = [];
  parsedItems.forEach((it, idx) => {
    if (isFixedItem(it)) return;
    const isProt = (
      isAnimalProteinFood(it.food) ||
      isEggFood(it.food) ||
      isEggItem(it) ||
      (isDairyFood(it.food) && (it.food?.pro || 0) >= 8)
    );
    if (isProt) {
      proteinItemIndices.push(idx);
    }
  });

  // Huevos que la pauta nombra en una comida principal: ración fija de 2 huevos; la proteína principal
  // absorbe el resto del objetivo.
  if (isMainMeal) {
    for (const it of parsedItems) {
      if (it.explicit && isEggItem(it) && !isFixedItem(it)) {
        const eggs = calculateEggAndClaras(EXPLICIT_EGGS_PROTEIN_G, 2);
        it.grams = eggs.totalGrams;
        it.displayName = eggs.displayName;
      }
    }
  }

  // Proteína ya aportada por alimentos no proteicos (pan, cereal, fruta, verdura)
  let nonProteinSourcesP = 0;
  parsedItems.forEach((it, idx) => {
    if (!proteinItemIndices.includes(idx)) {
      nonProteinSourcesP += (it.grams / 100) * (it.food?.pro || 0);
    }
  });

  const neededTotalPro = Math.max(0, targetBudget.p - nonProteinSourcesP);

  if (isMainMeal && primaryProteinIndex !== -1) {
    // En comidas y cenas, la proteína principal (carne o pescado limpio) asume la totalidad de la proteína pendiente.
    // Los alimentos secundarios (ej: 1 huevo, claras, queso o pan de acompañamiento) mantienen su porción moderada fijada.
    let nonPrimaryProtein = 0;
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryProteinIndex) {
        nonPrimaryProtein += (it.grams / 100) * (it.food?.pro || 0);
      }
    });

    const primaryItem = parsedItems[primaryProteinIndex];
    if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }

    const neededPrimaryPro = Math.max(0, targetBudget.p - nonPrimaryProtein);
    const proFactor = Number(primaryItem.food.pro) / 100;
    if (proFactor <= 0) {
      throw new Error(`Alimento de proteína "${primaryItem.name}" sin proteínas válidas en el catálogo.`);
    }
    let exactGrams = roundToFive(neededPrimaryPro / proFactor);

    exactGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, exactGrams));

    primaryItem.grams = roundToFive(exactGrams);
  } else if (proteinItemIndices.length > 0) {
    if (proteinItemIndices.length === 1) {
      // Caso 1 sola proteína en desayuno/merienda
      const singleItem = parsedItems[proteinItemIndices[0]];
      if (isEggItem(singleItem)) {
        const maxPro = singleItem.food?.maxGrams
          ? (Number(singleItem.food.maxGrams) / 100) * Number(singleItem.food.pro || DEFAULT_EGG_PRO_PER_100G)
          : neededTotalPro;
        const targetPro = Math.min(neededTotalPro, maxPro);
        const eggCalc = calculateEggAndClaras(targetPro, 2);
        singleItem.grams = eggCalc.totalGrams;
        singleItem.displayName = eggCalc.displayName;
      } else {
        if (!singleItem.food || singleItem.food.minGrams === undefined || singleItem.food.maxGrams === undefined) {
          throw new Error(`Alimento "${singleItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
        }
        const proFactor = Number(singleItem.food.pro) / 100;
        if (proFactor <= 0) {
          throw new Error(`Alimento de proteína "${singleItem.name}" sin proteínas válidas en el catálogo.`);
        }
        let exactGrams = roundToFive(neededTotalPro / proFactor);
        exactGrams = Math.max(singleItem.food.minGrams, Math.min(singleItem.food.maxGrams, exactGrams));
        singleItem.grams = roundToFive(exactGrams);
      }
    } else {
      // Caso múltiples proteínas en desayuno/merienda (ej: Tostada con huevo + jamón/pavo/queso)
      // Identificar proteína principal (huevo) vs proteínas secundarias (lonchas de embutido/queso)
      let primaryIdx = proteinItemIndices.find(idx => isEggItem(parsedItems[idx]));
      if (primaryIdx === undefined) {
        primaryIdx = proteinItemIndices[0];
      }
      const secondaryIndices = proteinItemIndices.filter(idx => idx !== primaryIdx);
      const primaryItem = parsedItems[primaryIdx];
      const isEggPrimary = isEggItem(primaryItem);

      // Calcular mínimos culinarios reales
      const minPriPro = isEggPrimary ? MIN_PRIMARY_PROTEIN_EGG_G : MIN_PRIMARY_PROTEIN_G;
      let minSecProTotal = 0;
      const secInfoList = [];

      secondaryIndices.forEach(sIdx => {
        const sItem = parsedItems[sIdx];
        if (!sItem.food || sItem.food.minGrams === undefined || sItem.food.maxGrams === undefined) {
          throw new Error(`Alimento "${sItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
        }
        const sFactor = Number(sItem.food.pro) / 100;
        const sMinGrams = sItem.food.minGrams;
        const sPro = sMinGrams * sFactor;
        minSecProTotal += sPro;
        secInfoList.push({ idx: sIdx, item: sItem, grams: sMinGrams, pro: sPro });
      });

      const minTotalRequired = minPriPro + minSecProTotal;

      if (neededTotalPro < minTotalRequired && !secondaryIndices.some((idx) => parsedItems[idx].explicit)) {
        // No hay margen de proteína para sostener ambos con raciones útiles:
        // Se descartan las secundarias y se calibra únicamente la principal con cohesión gastronómica
        const toDrop = secondaryIndices;
        const primaryFatObj = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
        const primaryCarbObj = primaryCarbIndex !== -1 ? parsedItems[primaryCarbIndex] : null;
        parsedItems = parsedItems.filter((_, idx) => !toDrop.includes(idx));
        primaryProteinIndex = parsedItems.indexOf(primaryItem);
        if (primaryFatObj) primaryFatIndex = parsedItems.indexOf(primaryFatObj);
        if (primaryCarbObj) primaryCarbIndex = parsedItems.indexOf(primaryCarbObj);

        if (isEggPrimary) {
          const maxPro = primaryItem.food?.maxGrams
            ? (Number(primaryItem.food.maxGrams) / 100) * Number(primaryItem.food.pro || DEFAULT_EGG_PRO_PER_100G)
            : neededTotalPro;
          const targetPro = Math.min(neededTotalPro, maxPro);
          const eggCalc = calculateEggAndClaras(targetPro, 2);
          primaryItem.grams = eggCalc.totalGrams;
          primaryItem.displayName = eggCalc.displayName;
        } else {
          if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
            throw new Error(`Alimento "${primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
          }
          const proFactor = Number(primaryItem.food.pro) / 100;
          if (proFactor <= 0) {
            throw new Error(`Alimento de proteína "${primaryItem.name}" sin proteínas válidas en el catálogo.`);
          }
          let calculatedGrams = roundToFive(neededTotalPro / proFactor);
          calculatedGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, calculatedGrams));
          primaryItem.grams = calculatedGrams;
        }
      } else {
        // Sí caben ambas respetando sus mínimos culinarios:
        // Se asigna la ración útil a las secundarias y la principal absorbe el resto
        let assignedSecPro = 0;
        secInfoList.forEach(info => {
          info.item.grams = info.grams;
          assignedSecPro += info.pro;
        });

        const remainingPriPro = Math.max(minPriPro, neededTotalPro - assignedSecPro);

        if (isEggPrimary) {
          const maxPro = primaryItem.food?.maxGrams
            ? (Number(primaryItem.food.maxGrams) / 100) * Number(primaryItem.food.pro || DEFAULT_EGG_PRO_PER_100G)
            : remainingPriPro;
          const targetPro = Math.min(remainingPriPro, maxPro);
          const eggCalc = calculateEggAndClaras(targetPro, 1);
          primaryItem.grams = eggCalc.totalGrams;
          primaryItem.displayName = eggCalc.displayName;
        } else {
          if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
            throw new Error(`Alimento "${primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
          }
          const proFactor = Number(primaryItem.food.pro) / 100;
          if (proFactor <= 0) {
            throw new Error(`Alimento de proteína "${primaryItem.name}" sin proteínas válidas en el catálogo.`);
          }
          let calculatedGrams = roundToFive(remainingPriPro / proFactor);
          calculatedGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, calculatedGrams));
          primaryItem.grams = calculatedGrams;
        }
      }
    }
  }

  // Complemento de proteína: si la proteína de plato no llega (p. ej. el plato proteico es solo un poco de
  // jamón o la proteína principal está en su máximo), se añade una proteína de plato que cubra la diferencia.
  if (isMainMeal && Number.isFinite(Number(targetBudget.p))) {
    const proteinShortfall = targetBudget.p - sumItemMacros(parsedItems).p;
    if (proteinShortfall >= PROTEIN_COMPLEMENT_MIN_SHORTFALL_G) {
      const complementName = resolveNodeForPlayer('proteina', options.clinicalCatalog, null, options.tracker, getMainMealTree());
      const complementFood = complementName ? getCatalogFood(complementName, options) : null;
      const alreadyPresent = complementFood && parsedItems.some((it) => it.food?.name === complementFood.name);
      if (complementFood && !alreadyPresent && Number(complementFood.pro) > 0
        && complementFood.minGrams !== undefined && complementFood.maxGrams !== undefined) {
        const grams = Math.min(complementFood.maxGrams, Math.max(complementFood.minGrams, roundToFive(proteinShortfall / (Number(complementFood.pro) / 100))));
        const insertIdx = primaryProteinIndex !== -1 ? primaryProteinIndex + 1 : parsedItems.length;
        parsedItems.splice(insertIdx, 0, { name: complementFood.name, grams, food: complementFood });
        if (primaryFatIndex >= insertIdx) primaryFatIndex++;
        if (primaryCarbIndex >= insertIdx) primaryCarbIndex++;
      }
    }
  }

  // 3. Calibrar Grasas (AOVE):
  let nonPrimaryFat = 0;
  parsedItems.forEach((it, idx) => {
    if (idx !== primaryFatIndex) {
      const f = (it.grams / 100) * (it.food?.fat || 0);
      nonPrimaryFat += f;
    }
  });

  if (primaryFatIndex !== -1 && parsedItems[primaryFatIndex]) {
    const fatItem = parsedItems[primaryFatIndex];
    if (!fatItem.food || fatItem.food.minGrams === undefined || fatItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${fatItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }
    const fatFactor = Number(fatItem.food.fat) / 100;
    if (fatFactor <= 0) {
      throw new Error(`Alimento de grasa "${fatItem.name}" sin grasas válidas en el catálogo.`);
    }
    const neededFat = Math.max(0, targetBudget.g - nonPrimaryFat);
    let exactFatGrams = roundToFive(neededFat / fatFactor);
    exactFatGrams = Math.max(fatItem.food.minGrams, Math.min(fatItem.food.maxGrams, exactFatGrams));
    fatItem.grams = roundToFive(exactFatGrams);
  }

  // Respetar topes máximos y mínimos de cada alimento directamente desde su catálogo
  parsedItems.forEach(it => {
    if (isEggItem(it)) return;
    if (!it.food || it.food.minGrams === undefined || it.food.maxGrams === undefined) {
      throw new Error(`Alimento "${it.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }
    const isDishCarb = hasTreePath(it.food, 'arroz') ||
      hasTreePath(it.food, 'pasta') ||
      hasTreePath(it.food, 'otros_granos') ||
      hasTreePath(it.food, 'legumbres');
    const minG = isMainMeal && isDishCarb ? Math.max(it.food.minGrams, DISH_CARB_MIN_MAIN_G) : it.food.minGrams;
    const maxG = it.food.maxGrams;
    if (it.grams === null || it.grams === undefined) {
      it.grams = minG;
    }
    if (it.grams > maxG) {
      it.grams = maxG;
    }
    if (it.grams < minG) {
      it.grams = minG;
    }
  });

  refineMealMacros(parsedItems, targetBudget, { isMainMeal });
  // Un alimento que la compensación deja en 0 g desaparece de la toma.
  parsedItems = parsedItems.filter((it) => it.grams !== 0);

  // Consolidar items idénticos si los hubiera sumando sus gramajes
  const finalConsolidatedMap = new Map();
  for (const it of parsedItems) {
    const key = (it.food?.name || it.name || '').toLowerCase().trim();
    if (finalConsolidatedMap.has(key)) {
      const existing = finalConsolidatedMap.get(key);
      if (typeof existing.grams === 'number' && typeof it.grams === 'number') {
        existing.grams += it.grams;
      }
    } else {
      finalConsolidatedMap.set(key, { ...it });
    }
  }
  const finalItems = Array.from(finalConsolidatedMap.values());

  // Reconstruir la descripción con formato limpio, profesional y elegante
  const resultParts = finalItems.map(it => formatMealItemDisplayName(it));

  return withMealDiagnostics(resultParts.join(', '), finalItems, options.returnDiagnostics);
}
