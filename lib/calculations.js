import { getObjectiveMacros, getTeamObjectiveMacros } from './nutrition-day-types.js';

export { NUTRITION_DAY_TYPES, getNutritionDayType, getDayTypeColor, getDayTypeLabel, PLAN_CONTEXTS, getTeamNutritionDayTypes, getTeamObjectiveDayTypeMacros, getTeamNutritionDayType, getTeamDayTypeColor, getTeamDayTypeLabel, getTeamObjectiveMacros } from './nutrition-day-types.js';
export { PLAYER_OBJECTIVES, OBJECTIVE_DAY_TYPE_MACROS, getObjectiveMacros, getObjectiveLabel, DEFAULT_OBJECTIVE_KEY } from './nutrition-day-types.js';

export const HYDRATION_BASE_ML_PER_KG = 40;
export const HYDRATION_TRAINING_EXTRA_ML_PER_KG = 6;
export const HYDRATION_MATCH_EXTRA_ML_PER_KG = 10;

export function calculateHydration(weightKg, dayTypeKey = 'descanso') {
  const base = Math.round(weightKg * HYDRATION_BASE_ML_PER_KG);
  const keyLower = String(dayTypeKey || '').toLowerCase();
  if (keyLower.includes('entreno') || keyLower.includes('doble') || keyLower.includes('sesi') || keyLower.includes('entrenamiento')) {
    return base + Math.round(weightKg * HYDRATION_TRAINING_EXTRA_ML_PER_KG);
  }
  if (keyLower.includes('partido') || keyLower.includes('juego')) {
    return base + Math.round(weightKg * HYDRATION_MATCH_EXTRA_ML_PER_KG);
  }
  return base;
}

export function getLeanMass(input) {
  if (input.leanMassKg && input.leanMassKg > 0) return input.leanMassKg;
  if (input.bodyFatPct === undefined || input.bodyFatPct === null) return 0;
  return input.weightKg * (1 - input.bodyFatPct / 100);
}



export function calculateByObjective({ weightKg, objectiveKey, dayTypeKey, teamConfig }) {
  const macros = teamConfig 
    ? getTeamObjectiveMacros(objectiveKey, dayTypeKey, teamConfig)
    : getObjectiveMacros(objectiveKey, dayTypeKey);
  if (!macros || !weightKg) return null;
  const kcal = Math.round(weightKg * macros.kcalPerKg);
  const protein = Math.round(weightKg * macros.proteinGkg);
  const cho = Math.round(weightKg * macros.carbsGkg);
  const fat = Math.round(weightKg * macros.fatGkg);
  const hydrationMl = calculateHydration(weightKg, dayTypeKey);
  return { kcal, protein, cho, fat, hydrationMl };
}

