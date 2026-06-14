import { resolveNutritionDayType } from './nutrition-day-types.js';

export { NUTRITION_DAY_TYPES, resolveNutritionDayType } from './nutrition-day-types.js';

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
  const hydrationMl = Math.round(input.weightKg * 40);
  return { leanMass, rmr: Math.round(rmr), kcal, cho, protein, fat, hydrationMl };
}
