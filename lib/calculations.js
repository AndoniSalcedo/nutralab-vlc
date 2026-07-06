import { resolveNutritionDayType, getObjectiveMacros } from './nutrition-day-types.js';

export { NUTRITION_DAY_TYPES, resolveNutritionDayType, getNutritionDayType, getDayTypeColor, getDayTypeLabel, PLAN_CONTEXTS } from './nutrition-day-types.js';
export { PLAYER_OBJECTIVES, OBJECTIVE_DAY_TYPE_MACROS, getObjectiveMacros, getObjectiveLabel, DEFAULT_OBJECTIVE_KEY } from './nutrition-day-types.js';

export const HYDRATION_BASE_ML_PER_KG = 40;
export const HYDRATION_TRAINING_EXTRA_ML_PER_KG = 6;
export const HYDRATION_MATCH_EXTRA_ML_PER_KG = 10;

export function calculateHydration(weightKg, dayTypeKey = 'descanso') {
  const base = Math.round(weightKg * HYDRATION_BASE_ML_PER_KG);
  if (dayTypeKey === 'entreno' || dayTypeKey === 'doble') {
    return base + Math.round(weightKg * HYDRATION_TRAINING_EXTRA_ML_PER_KG);
  }
  if (dayTypeKey === 'partido') {
    return base + Math.round(weightKg * HYDRATION_MATCH_EXTRA_ML_PER_KG);
  }
  return base;
}

export function getLeanMass(input) {
  if (input.leanMassKg && input.leanMassKg > 0) return input.leanMassKg;
  if (input.bodyFatPct === undefined || input.bodyFatPct === null) return 0;
  return input.weightKg * (1 - input.bodyFatPct / 100);
}

export function cunninghamPlan(input) {
  const dayType = resolveNutritionDayType(input.activityFactor);
  const inputFactor = Number(input.activityFactor);
  const leanMass = getLeanMass(input);
  const rmr = 500 + 22 * leanMass;
  const activityFactor = Number.isFinite(inputFactor) ? inputFactor : dayType.factor;
  const proteinGkg = input.proteinGkg ?? dayType.proteinGkg;
  const carbsGkg = input.carbsGkg ?? dayType.carbsGkg;
  const fatGkg = input.fatGkg ?? dayType.fatGkg;
  const kcal = Math.round(rmr * activityFactor);
  const protein = Math.round(input.weightKg * proteinGkg);
  const cho = Math.round(input.weightKg * carbsGkg);
  const fat = Math.round(input.weightKg * fatGkg);
  const hydrationMl = calculateHydration(input.weightKg, dayType.key);
  return { leanMass, rmr: Math.round(rmr), kcal, cho, protein, fat, hydrationMl };
}

export function calculateByObjective({ weightKg, objectiveKey, dayTypeKey }) {
  const macros = getObjectiveMacros(objectiveKey, dayTypeKey);
  if (!macros || !weightKg) return null;
  const kcal = Math.round(weightKg * macros.kcalPerKg);
  const protein = Math.round(weightKg * macros.proteinGkg);
  const cho = Math.round(weightKg * macros.carbsGkg);
  const fat = Math.round(weightKg * macros.fatGkg);
  const hydrationMl = calculateHydration(weightKg, dayTypeKey);
  return { kcal, protein, cho, fat, hydrationMl };
}

