import { getObjectiveMacros, getTeamObjectiveMacros, DEFAULT_OBJECTIVE_KEY } from '@/config/nutrition-days';

export {
  NUTRITION_DAY_TYPES,
  getNutritionDayType,
  getDayTypeColor,
  getDayTypeLabel,
  PLAN_CONTEXTS,
  getTeamNutritionDayTypes,
  getTeamObjectiveDayTypeMacros,
  getTeamNutritionDayType,
  getTeamDayTypeColor,
  getTeamDayTypeLabel,
  getTeamObjectiveMacros,
  getUserMealsForDay,
  PLAYER_OBJECTIVES,
  OBJECTIVE_DAY_TYPE_MACROS,
  getObjectiveMacros,
  getObjectiveLabel,
  DEFAULT_OBJECTIVE_KEY,
} from '@/config/nutrition-days';

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

export function calculateByObjective({ weightKg, objectiveKey, dayTypeKey, teamConfig }) {
  let resolvedKey = objectiveKey;
  const validKeys = ['perdida_grasa', 'perdida_peso', 'ganancia_musculo', 'mejora_condicion', 'mejora_rendimiento'];

  if (!resolvedKey || !validKeys.includes(resolvedKey)) {
    const norm = String(resolvedKey || '').toLowerCase();
    if (norm.includes('grasa')) resolvedKey = 'perdida_grasa';
    else if (norm.includes('peso')) resolvedKey = 'perdida_peso';
    else if (norm.includes('músculo') || norm.includes('musculo') || norm.includes('masa')) resolvedKey = 'ganancia_musculo';
    else if (norm.includes('condici')) resolvedKey = 'mejora_condicion';
    else resolvedKey = DEFAULT_OBJECTIVE_KEY;
  }

  let macros = teamConfig 
    ? getTeamObjectiveMacros(resolvedKey, dayTypeKey, teamConfig)
    : getObjectiveMacros(resolvedKey, dayTypeKey);

  if (!macros) {
    macros = teamConfig
      ? getTeamObjectiveMacros(DEFAULT_OBJECTIVE_KEY, dayTypeKey, teamConfig)
      : getObjectiveMacros(DEFAULT_OBJECTIVE_KEY, dayTypeKey);
  }

  if (!macros || !weightKg) return null;
  const protein = Math.round(weightKg * macros.proteinGkg);
  const cho = Math.round(weightKg * macros.carbsGkg);
  const fat = Math.round(weightKg * macros.fatGkg);
  const kcal = Math.round((protein * 4) + (cho * 4) + (fat * 9));
  const hydrationMl = calculateHydration(weightKg, dayTypeKey);
  return { kcal, protein, cho, fat, hydrationMl };
}
