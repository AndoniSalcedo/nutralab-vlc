import { FOOTBALL_DAY_TYPES, FOOTBALL_OBJECTIVE_MACROS } from '@/config/day-types/football';


function getNutritionDayType(key) {
  return FOOTBALL_DAY_TYPES.find((dayType) => dayType.key === key) || null;
}

export function getDayTypeLabel(key) {
  return getNutritionDayType(key)?.label || key;
}



export const AVAILABLE_MEALS = [
  { value: 'Desayuno', label: 'Desayuno' },
  { value: 'Almuerzo', label: 'Almuerzo' },
  { value: 'Comida', label: 'Comida' },
  { value: 'Merienda', label: 'Merienda' },
  { value: 'Cena', label: 'Cena' }
];

const STANDARD_MEALS = ['Desayuno', 'Almuerzo', 'Comida', 'Merienda', 'Cena'];

export const DEFAULT_PLAYER_MEALS_STRING = 'Desayuno, Comida, Cena';

const MEALS_BY_COUNT = {
  1: ['Comida'],
  2: ['Comida', 'Cena'],
  3: ['Desayuno', 'Comida', 'Cena'],
  4: ['Desayuno', 'Almuerzo', 'Comida', 'Cena'],
  5: [...STANDARD_MEALS],
};

export function getMealsForCount(count) {
  const numericCount = Number(count);
  return MEALS_BY_COUNT[numericCount]
    ? [...MEALS_BY_COUNT[numericCount]]
    : [...STANDARD_MEALS];
}

export function sortMeals(meals = [], scheduleKey = null) {
  if (!Array.isArray(meals)) return [];
  let order;
  if (scheduleKey === 'manana') {
    order = ['desayuno', 'almuerzo', 'post-partido', 'post-entreno', 'post', 'comida', 'merienda', 'cena'];
  } else if (scheduleKey === 'tarde') {
    order = ['desayuno', 'almuerzo', 'comida', 'post-partido', 'post-entreno', 'post', 'merienda', 'cena'];
  } else if (scheduleKey === 'noche') {
    order = ['desayuno', 'almuerzo', 'comida', 'merienda', 'post-partido', 'post-entreno', 'post', 'cena'];
  } else {
    order = [...STANDARD_MEALS, 'Post-entreno'].map((m) => String(m).toLowerCase());
  }

  return [...meals].sort((a, b) => {
    const strA = String(a || '').trim().toLowerCase();
    const strB = String(b || '').trim().toLowerCase();
    const ia = order.indexOf(strA);
    const ib = order.indexOf(strB);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

export function getUserMeals(jugador) {
  if (!jugador) return ['Desayuno', 'Comida', 'Cena'];
  let meals = [];
  if (jugador.num_comidas) {
    if (!isNaN(Number(jugador.num_comidas))) {
      meals = getMealsForCount(jugador.num_comidas);
    } else {
      meals = sortMeals(jugador.num_comidas.split(',').map((s) => s.trim()).filter(Boolean));
    }
  } else {
    meals = ['Desayuno', 'Comida', 'Cena'];
  }

  if (jugador.postentreno) {
    const hasPost = meals.some((m) => {
      const low = String(m || '').toLowerCase();
      return low === 'post-entreno' || low === 'post entreno' || low === 'post';
    });
    if (!hasPost) {
      meals.push('Post-entreno');
    }
  }
  return sortMeals(meals);
}

export function isMainMeal(mealName, mealConfig = null) {
  if (typeof mealConfig === 'boolean') {
    return mealConfig;
  }
  if (mealConfig && typeof mealConfig === 'object') {
    if (mealConfig.isMainMeal !== undefined) {
      return Boolean(mealConfig.isMainMeal);
    }
    if (mealConfig.value && typeof mealConfig.value === 'object' && mealConfig.value.isMainMeal !== undefined) {
      return Boolean(mealConfig.value.isMainMeal);
    }
    if (mealConfig.isMain !== undefined) {
      return Boolean(mealConfig.isMain);
    }
  }
  const norm = String(mealName || '').toLowerCase().trim();
  return norm.includes('comida') || norm.includes('cena');
}

export const DEFAULT_OBJECTIVE_KEY = 'mejora_rendimiento';

export const PLAYER_OBJECTIVES = [
  { value: 'perdida_grasa', label: 'Pérdida de Grasa' },
  { value: 'perdida_peso', label: 'Pérdida de Peso' },
  { value: 'ganancia_musculo', label: 'Ganancia de Músculo' },
  { value: 'mejora_condicion', label: 'Mejora de la Condición Muscular' },
  { value: 'mejora_rendimiento', label: 'Mejora del Rendimiento Deportivo' },
];




/** Objetivo válido del jugador: si el valor no es uno de PLAYER_OBJECTIVES (o falta), se usa el objetivo por defecto. */
export function normalizeObjective(value) {
  return PLAYER_OBJECTIVES.some((objective) => objective.value === value) ? value : DEFAULT_OBJECTIVE_KEY;
}

export function getObjectiveLabel(objectiveKey) {
  return PLAYER_OBJECTIVES.find((o) => o.value === objectiveKey)?.label || objectiveKey || '';
}

export function getTeamNutritionDayTypes(teamConfig) {
  const cfg = teamConfig?.configuracion_nutricional || teamConfig;
  if (cfg?.dayTypes && Array.isArray(cfg.dayTypes) && cfg.dayTypes.length > 0) {
    return cfg.dayTypes;
  }
  return FOOTBALL_DAY_TYPES;
}

export function getTeamObjectiveDayTypeMacros(teamConfig) {
  const cfg = teamConfig?.configuracion_nutricional || teamConfig;
  if (cfg?.objectiveMacros && Object.keys(cfg.objectiveMacros).length > 0) {
    return cfg.objectiveMacros;
  }
  return FOOTBALL_OBJECTIVE_MACROS;
}

function getTeamNutritionDayType(key, teamConfig) {
  return getTeamNutritionDayTypes(teamConfig).find((dayType) => dayType.key === key) || null;
}

export function getTeamDayTypeColor(key, teamConfig) {
  return getTeamNutritionDayType(key, teamConfig)?.color || 'green';
}

export function getTeamDayTypeLabel(key, teamConfig) {
  return getTeamNutritionDayType(key, teamConfig)?.label || key;
}



export function isPreMatchPreviousDayMeal(scheduleKey, mealName) {
  const norm = String(mealName || '').toLowerCase().trim();
  if (scheduleKey === 'manana' || scheduleKey === 'tarde') {
    return norm === 'cena' || norm === 'merienda';
  }
  if (scheduleKey === 'noche') {
    return norm === 'cena';
  }
  return norm === 'cena';
}

export function isPreMatchMatchDayMeal(scheduleKey, mealName) {
  const norm = String(mealName || '').toLowerCase().trim();
  if (norm === 'post' || norm === 'post-entreno' || norm === 'post entreno' || norm === 'post-partido' || norm === 'post partido') {
    return false;
  }
  if (isPreMatchPreviousDayMeal(scheduleKey, mealName)) {
    return false;
  }
  if (scheduleKey === 'manana') {
    return norm === 'desayuno' || norm === 'almuerzo';
  }
  if (scheduleKey === 'tarde') {
    return norm === 'desayuno' || norm === 'almuerzo' || norm === 'comida';
  }
  if (scheduleKey === 'noche') {
    return norm === 'desayuno' || norm === 'almuerzo' || norm === 'comida' || norm === 'merienda';
  }
  return false;
}

export function getMealTimingBadge(scheduleKey, mealName) {
  return isPreMatchPreviousDayMeal(scheduleKey, mealName)
    ? 'Día anterior · Carga 24h'
    : 'Día de partido';
}

export function sortPreMatchMealsChronological(scheduleKey, meals = []) {
  if (!Array.isArray(meals)) return [];
  let order;
  if (scheduleKey === 'manana') {
    order = ['merienda', 'cena', 'desayuno', 'almuerzo', 'post-partido', 'post-entreno', 'post', 'comida', 'cena'];
  } else if (scheduleKey === 'tarde') {
    order = ['merienda', 'cena', 'desayuno', 'almuerzo', 'comida', 'post-partido', 'post-entreno', 'post'];
  } else if (scheduleKey === 'noche') {
    order = ['cena', 'desayuno', 'almuerzo', 'comida', 'merienda', 'post-partido', 'post-entreno', 'post'];
  } else {
    order = ['cena', 'desayuno', 'almuerzo', 'comida', 'merienda', 'post-partido', 'post-entreno', 'post'];
  }
  return [...meals].sort((a, b) => {
    const ia = order.indexOf(String(a).toLowerCase().trim());
    const ib = order.indexOf(String(b).toLowerCase().trim());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function getUserMealsForDay(jugador, tipoDia, teamConfig, preMatchConfig = null, dayKey = null) {
  const baseMeals = getUserMeals(jugador);
  if (!jugador) return baseMeals;

  if (tipoDia === 'partido' && preMatchConfig?.enabled) {
    const horario = preMatchConfig?.partidos?.[dayKey]?.horario || preMatchConfig?.horario || 'tarde';
    const matchConfig = jugador?.config_prepartido?.[horario];

    // Ingestas pre-partido específicas del día de partido
    const preMatchMeals = Array.isArray(matchConfig?.ingestas)
      ? matchConfig.ingestas.filter((m) => isPreMatchMatchDayMeal(horario, m))
      : [];

    // Combinar las tomas base habituales del jugador con las tomas prepartido del día
    // Manteniendo todas las tomas normales posteriores al partido (ej. Cena en noche, Comida/Cena en mañana)
    const combinedMealsSet = new Set([
      ...preMatchMeals,
      ...baseMeals.filter((m) => {
        const low = String(m || '').toLowerCase();
        return !(low === 'post-entreno' || low === 'post entreno' || low === 'post' || low === 'post-partido' || low === 'post partido');
      }),
    ]);

    const hasPost = matchConfig?.postentreno !== undefined
      ? Boolean(matchConfig.postentreno)
      : Boolean(jugador.postentreno);

    if (hasPost) {
      combinedMealsSet.add('Post-entreno');
    }

    return sortMeals([...combinedMealsSet], horario);
  }

  const hasPostentrenoEnabled = Boolean(jugador.postentreno);
  if (!hasPostentrenoEnabled) {
    return sortMeals(baseMeals.filter((meal) => {
      const low = String(meal || '').toLowerCase();
      const isPost = low === 'post-entreno' || low === 'post entreno' || low === 'post';
      return !isPost;
    }));
  }

  const dayTypes = getTeamNutritionDayTypes(teamConfig);
  const dayTypeConfig = dayTypes.find((t) => t.key === tipoDia) || dayTypes[0];

  let tienePostentreno = false;
  if (dayTypeConfig) {
    if (dayTypeConfig.tienePostentreno !== undefined) {
      tienePostentreno = dayTypeConfig.tienePostentreno;
    } else if (dayTypeConfig.tienePreentreno !== undefined) {
      tienePostentreno = dayTypeConfig.tienePreentreno;
    } else {
      tienePostentreno = ['doble', 'entreno', 'partido'].includes(dayTypeConfig.key);
    }
  }

  return sortMeals(baseMeals.filter((meal) => {
    const low = String(meal || '').toLowerCase();
    const isPost = low === 'post-entreno' || low === 'post entreno' || low === 'post';
    if (isPost) {
      return tienePostentreno;
    }
    return true;
  }));
}
