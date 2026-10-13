/**
 * Cuadre del día: reparte los macros del día entre las tomas, compensa en cascada lo que cada toma se desvía y
 * regenera el día con otra selección de alimentos cuando, aun así, no cuadra.
 */

import { getMealKind } from '@/config/nutrition-days';
import { DEFAULT_MEAL_DISTRIBUTIONS, FALLBACK_MEAL_WEIGHTS, FALLBACK_OTHER_MEAL_WEIGHT } from '@/config/meal-distribution';

// Clave de reparto de cada tipo de toma.
const MEAL_SHARE_KEYS = { post: 'Post', merienda: 'Merienda', desayuno: 'Desayuno', almuerzo: 'Almuerzo', comida: 'Comida', cena: 'Cena' };

const getShareKey = (name) => MEAL_SHARE_KEYS[getMealKind(name)] || name;

/** Reparto en % enteros que suman 100 (resto mayor) a partir de pesos relativos por toma. */
function toWholePercents(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (entries.length === 0 || total <= 0) return {};
  const raw = entries.map(([name, w]) => ({ name, value: (w / total) * 100 }));
  const result = Object.fromEntries(raw.map(({ name, value }) => [name, Math.floor(value)]));
  let missing = 100 - Object.values(result).reduce((sum, v) => sum + v, 0);
  [...raw]
    .sort((a, b) => (b.value - Math.floor(b.value)) - (a.value - Math.floor(a.value)))
    .forEach(({ name }) => {
      if (missing > 0) {
        result[name] += 1;
        missing -= 1;
      }
    });
  return result;
}

/**
 * % de kcal por toma por defecto (enteros, suman 100) según la combinación de tomas y el post-entreno, de la tabla de
 * config/meal-distribution.js. Las tomas post no entran: tienen macros fijos y el resto del día se reparte entre las demás.
 */
export function getDefaultMealDistribution(mealNames = [], { hasPost = false } = {}) {
  const meals = mealNames.filter((name) => name && getMealKind(name) !== 'post');
  const keys = meals.map(getShareKey);
  const row = DEFAULT_MEAL_DISTRIBUTIONS.find(({ tomas }) => (
    tomas.length === keys.length && tomas.every((toma) => keys.includes(toma))
  ));
  if (row) {
    const reparto = hasPost ? row.conPost : row.sinPost;
    return Object.fromEntries(meals.map((name) => [name, reparto[getShareKey(name)]]));
  }
  return toWholePercents(Object.fromEntries(
    meals.map((name) => [name, FALLBACK_MEAL_WEIGHTS[getShareKey(name)] ?? FALLBACK_OTHER_MEAL_WEIGHT])
  ));
}

/**
 * Pesos de cada toma del día según el reparto de kcal del jugador ({ Desayuno: 20, Comida: 40, ... } en %). Una toma
 * del día que no está en su reparto (p. ej. una toma prepartido) o un jugador sin reparto usan el % por defecto; las
 * post se excluyen porque sus macros son fijos.
 */
function getMealShares(mealNames, distribution) {
  const valueOf = (name) => {
    const value = Number(distribution?.[name] ?? distribution?.[getShareKey(name)]);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const meals = mealNames.filter((name) => getMealKind(name) !== 'post');
  const defaults = getDefaultMealDistribution(meals, { hasPost: meals.length < mealNames.length });
  return Object.fromEntries(meals.map((name) => [name, valueOf(name) ?? defaults[name] ?? 0]));
}

export function calculateMealBudgets(day, options = {}) {
  const { kcal, proteina, hidratos, grasa, ingestas } = day || {};
  if (!ingestas || ingestas.length === 0) return [];

  if (!Number(kcal) || !Number(proteina) || !Number(hidratos) || !Number(grasa)) {
    const dayName = day?.label || day?.dayKey || 'desconocido';
    throw new Error(`Datos nutricionales incompletos para el día ${dayName}: kcal=${kcal}, proteina=${proteina}, hidratos=${hidratos}, grasa=${grasa}. Comprueba el peso del jugador y los objetivos de su equipo.`);
  }

  const mealNames = ingestas.map((i) => i?.nombre).filter(Boolean);
  const postMealName = mealNames.find((n) => getMealKind(n) === 'post');
  const hasPost = Boolean(postMealName);

  const customFixedMeals = options.fixedMeals && typeof options.fixedMeals === 'object'
    ? options.fixedMeals
    : null;
  const fixedOnlyMealNames = new Set(Array.isArray(options.fixedOnlyMeals) ? options.fixedOnlyMeals : []);
  const fixedMacrosByMeal = new Map(
    Object.entries(customFixedMeals || {}).map(([name, value]) => [name, {
      kcal: Number(value?.kcal) || 0,
      p: Number(value?.p) || 0,
      hc: Number(value?.hc) || 0,
      g: Number(value?.g) || 0,
    }])
  );

  const POST_FIXED_PROTEIN = 20; // 20g fijos de proteína siempre para post-entreno y post-partido
  const postP = hasPost ? Math.min(POST_FIXED_PROTEIN, proteina) : 0;

  // Compatibilidad para los consumidores antiguos de esta función: si no se
  // proporciona el análisis de árboles, el post sigue siendo la única toma fija.
  if (!customFixedMeals && hasPost && postMealName) {
    fixedMacrosByMeal.set(postMealName, { kcal: postP * 4, p: postP, hc: 0, g: 0 });
    fixedOnlyMealNames.add(postMealName);
  }

  // Reparto de kcal por toma del jugador: cada toma recibe el mismo % de proteína, hidratos y grasa.
  const mealShares = getMealShares(mealNames, options.mealDistribution);

  const fixedTotals = Array.from(fixedMacrosByMeal.values()).reduce((totals, value) => ({
    kcal: totals.kcal + value.kcal,
    p: totals.p + value.p,
    hc: totals.hc + value.hc,
    g: totals.g + value.g,
  }), { kcal: 0, p: 0, hc: 0, g: 0 });

  const remaining = {
    p: Math.max(0, proteina - fixedTotals.p),
    hc: Math.max(0, hidratos - fixedTotals.hc),
    g: Math.max(0, grasa - fixedTotals.g),
  };

  const eligibleIngestas = ingestas.filter((ing) => !fixedOnlyMealNames.has(ing.nombre));
  const eligibleNames = eligibleIngestas.map((ing) => ing.nombre);
  // Las cuotas se renormalizan únicamente entre las ingestas que sí pueden calibrarse.
  const shareWeight = (name) => {
    const value = Number(mealShares[name]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };
  const totalWeight = eligibleNames.reduce((sum, eligibleName) => sum + shareWeight(eligibleName), 0);
  const normalizedShare = (name) => (totalWeight > 0 ? shareWeight(name) / totalWeight : 1 / eligibleNames.length);

  const budgets = {};
  const assigned = { p: 0, hc: 0, g: 0 };
  eligibleIngestas.forEach((ing, index) => {
    const isLastEligible = index === eligibleIngestas.length - 1;
    const share = normalizedShare(ing.nombre);
    const variableP = isLastEligible ? remaining.p - assigned.p : Math.round(remaining.p * share);
    const variableHC = isLastEligible ? remaining.hc - assigned.hc : Math.round(remaining.hc * share);
    const variableG = isLastEligible ? remaining.g - assigned.g : Math.round(remaining.g * share);
    const fixed = fixedMacrosByMeal.get(ing.nombre) || { p: 0, hc: 0, g: 0 };
    const mP = Math.max(0, variableP + fixed.p);
    const mHC = Math.max(0, variableHC + fixed.hc);
    const mG = Math.max(0, variableG + fixed.g);

    budgets[ing.nombre] = {
      kcal: Math.round(mP * 4 + mHC * 4 + mG * 9),
      p: mP,
      hc: mHC,
      g: mG,
    };
    assigned.p += variableP;
    assigned.hc += variableHC;
    assigned.g += variableG;
  });

  fixedOnlyMealNames.forEach((mealName) => {
    const fixed = fixedMacrosByMeal.get(mealName) || { kcal: 0, p: 0, hc: 0, g: 0 };
    budgets[mealName] = {
      kcal: Math.round(fixed.p * 4 + fixed.hc * 4 + fixed.g * 9),
      p: fixed.p,
      hc: fixed.hc,
      g: fixed.g,
    };
  });

  return ingestas.map((ing) => ({
    nombre: ing.nombre,
    target: budgets[ing.nombre] || {
      kcal: Math.round(kcal / ingestas.length),
      p: Math.round(proteina / ingestas.length),
      hc: Math.round(hidratos / ingestas.length),
      g: Math.round(grasa / ingestas.length),
    },
  }));
}

// El primer recurso es compensar gramos. Solo si el día sigue fuera de estas tolerancias se vuelve a
// generar con otra selección de alimentos (hasta DAY_MAX_ATTEMPTS intentos), como último recurso.
const DAY_MAX_ATTEMPTS = 15;
const DAY_TOLERANCE = { kcal: 60, proteina: 4, hidratos: 12, grasa: 8 };

function isDayWithinTolerance(deviation) {
  return Math.abs(deviation.kcal) <= DAY_TOLERANCE.kcal
    && Math.abs(deviation.proteina) <= DAY_TOLERANCE.proteina
    && Math.abs(deviation.hidratos) <= DAY_TOLERANCE.hidratos
    && Math.abs(deviation.grasa) <= DAY_TOLERANCE.grasa;
}

// Coste de un día (menor es mejor): error en kcal de cada macro, con la proteína más ponderada.
function dayDeviationCost(deviation) {
  if (!deviation) return Number.POSITIVE_INFINITY;
  const eP = 4 * deviation.proteina;
  const eC = 4 * deviation.hidratos;
  const eG = 9 * deviation.grasa;
  const eK = eP + eC + eG;
  return 2 * eP * eP + eC * eC + eG * eG + 0.5 * eK * eK;
}

// Límites de la compensación entre tomas: cada toma puede variar su parte variable ±30 %.
const CASCADE_RATIO_MIN = 0.7;
const CASCADE_RATIO_MAX = 1.3;

/**
 * Compensación en cascada: el objetivo de una toma se ajusta con lo que se ha desviado el día
 * hasta ese punto. Lo consumido por las tomas ya calculadas se descuenta del día y el resto
 * (menos los componentes fijos) se reparte entre la toma actual y las pendientes en proporción
 * a su presupuesto original. Los componentes fijos nunca se modifican.
 */
export function adaptTargetToDay({ target, meal, pendingMeals, budgetFor, dayData, consumed }) {
  const fixedOf = (m) => ({ p: Number(m?.fixedMacros?.p) || 0, hc: Number(m?.fixedMacros?.hc) || 0, g: Number(m?.fixedMacros?.g) || 0 });
  const group = [meal, ...pendingMeals];
  const day = { p: Number(dayData.proteina), hc: Number(dayData.hidratos), g: Number(dayData.grasa) };
  const fixedMeal = fixedOf(meal);
  const adapted = {};
  for (const macro of ['p', 'hc', 'g']) {
    const fixedGroup = group.reduce((sum, m) => sum + fixedOf(m)[macro], 0);
    const variablePot = group.reduce((sum, m) => sum + Math.max(0, (budgetFor(m)?.[macro] || 0) - fixedOf(m)[macro]), 0);
    const leftover = day[macro] - consumed[macro] - fixedGroup;
    const variableCurrent = Math.max(0, target[macro] - fixedMeal[macro]);
    const ratio = variablePot > 0
      ? Math.min(CASCADE_RATIO_MAX, Math.max(CASCADE_RATIO_MIN, leftover / variablePot))
      : 1;
    adapted[macro] = Math.max(fixedMeal[macro], Math.round(fixedMeal[macro] + variableCurrent * ratio));
  }
  adapted.kcal = Math.round(adapted.p * 4 + adapted.hc * 4 + adapted.g * 9);
  return adapted;
}

/**
 * Genera un día con `generateDay` y, si queda fuera de tolerancia, lo repite (con la memoria de variedad y los
 * avisos restaurados) hasta DAY_MAX_ATTEMPTS veces. Devuelve el mejor intento y deja el tracker y los avisos en el
 * estado de ese intento.
 */
export async function generateBestDay({ generateDay, tracker, avisos }) {
  const startSnapshot = tracker?.snapshot();
  const avisosStart = avisos.length;
  let best = null;
  for (let attempt = 0; attempt < DAY_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      tracker?.restore(startSnapshot);
      avisos.length = avisosStart;
    }
    const day = await generateDay();
    const cost = dayDeviationCost(day.desviacionMacros);
    if (!best || cost < best.cost) {
      best = { day, cost, endSnapshot: tracker?.snapshot(), avisos: avisos.slice(avisosStart) };
    }
    if (!day.desviacionMacros || isDayWithinTolerance(day.desviacionMacros)) break;
  }
  tracker?.restore(best.endSnapshot);
  avisos.length = avisosStart;
  avisos.push(...best.avisos);
  return best.day;
}
