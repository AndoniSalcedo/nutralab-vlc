import { getTeamObjectiveDayTypeMacros, DEFAULT_OBJECTIVE_KEY } from '@/config/nutrition-days';


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
  if (!weightKg) return null;

  const objectiveMacrosMap = getTeamObjectiveDayTypeMacros(teamConfig);
  const validKeys = Object.keys(objectiveMacrosMap);

  let resolvedKey = objectiveKey;
  if (!resolvedKey || !validKeys.includes(resolvedKey)) {
    const norm = String(resolvedKey || '').toLowerCase();
    const matched = validKeys.find((k) => {
      const kNorm = k.toLowerCase();
      return kNorm === norm || norm.includes(kNorm) || kNorm.includes(norm);
    });
    resolvedKey = matched || (validKeys.includes(DEFAULT_OBJECTIVE_KEY) ? DEFAULT_OBJECTIVE_KEY : validKeys[0]);
  }

  const macros = objectiveMacrosMap[resolvedKey]?.[dayTypeKey]
    || objectiveMacrosMap[DEFAULT_OBJECTIVE_KEY]?.[dayTypeKey]
    || (validKeys[0] ? objectiveMacrosMap[validKeys[0]]?.[dayTypeKey] : null);

  if (!macros) return null;
  const protein = Math.round(weightKg * macros.proteinGkg);
  const cho = Math.round(weightKg * macros.carbsGkg);
  const fat = Math.round(weightKg * macros.fatGkg);
  const kcal = Math.round((protein * 4) + (cho * 4) + (fat * 9));
  const hydrationMl = calculateHydration(weightKg, dayTypeKey);
  return { kcal, protein, cho, fat, hydrationMl };
}
