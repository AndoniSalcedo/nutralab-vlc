export const NUTRITION_DAY_TYPES = [
  {
    key: 'descanso',
    label: 'Descanso',
    planLabel: 'Día descanso',
    color: 'blue',
    tienePostentreno: false,
    tienePreentreno: false,
  },
  {
    key: 'recuperacion',
    label: 'Recuperación',
    planLabel: 'Día recuperación',
    color: 'teal',
    tienePostentreno: false,
    tienePreentreno: false,
  },
  {
    key: 'entreno',
    label: 'Entrenamiento',
    planLabel: 'Día entrenamiento',
    color: 'green',
    tienePostentreno: true,
    tienePreentreno: true,
  },
  {
    key: 'doble',
    label: 'Doble sesión',
    planLabel: 'Día doble sesión',
    color: 'orange',
    tienePostentreno: true,
    tienePreentreno: true,
  },
  {
    key: 'partido',
    label: 'Partido',
    planLabel: 'Día partido',
    color: 'red',
    tienePostentreno: true,
    tienePreentreno: true,
  },
];



function getNutritionDayType(key) {
  return NUTRITION_DAY_TYPES.find((dayType) => dayType.key === key) || null;
}

export function getDayTypeColor(key) {
  return getNutritionDayType(key)?.color || 'green';
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

export function sortMeals(meals = []) {
  if (!Array.isArray(meals)) return [];
  const order = [...STANDARD_MEALS, 'Post-entreno'].map((m) => String(m).toLowerCase());
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

export const OBJECTIVE_DAY_TYPE_MACROS = {
  perdida_grasa: {
    descanso:      { kcalPerKg: 21.5, proteinGkg: 2.2,  carbsGkg: 2.15, fatGkg: 0.925 },
    entreno:       { kcalPerKg: 25.5, proteinGkg: 2.1,  carbsGkg: 3.0,  fatGkg: 0.825 },
    doble:         { kcalPerKg: 28.5, proteinGkg: 2.1,  carbsGkg: 4.0,  fatGkg: 0.75  },
    recuperacion:  { kcalPerKg: 23.5, proteinGkg: 2.3,  carbsGkg: 2.5,  fatGkg: 0.85  },
    partido:       { kcalPerKg: 42.5, proteinGkg: 1.9,  carbsGkg: 6.5,  fatGkg: 0.75  },
  },
  perdida_peso: {
    descanso:      { kcalPerKg: 22.5, proteinGkg: 2.0,  carbsGkg: 2.4,  fatGkg: 0.925 },
    entreno:       { kcalPerKg: 26.5, proteinGkg: 1.9,  carbsGkg: 3.1,  fatGkg: 0.875 },
    doble:         { kcalPerKg: 29.5, proteinGkg: 1.9,  carbsGkg: 4.3,  fatGkg: 0.8   },
    recuperacion:  { kcalPerKg: 24.5, proteinGkg: 2.1,  carbsGkg: 2.7,  fatGkg: 0.85  },
    partido:       { kcalPerKg: 37.5, proteinGkg: 1.9,  carbsGkg: 6.25, fatGkg: 0.8   },
  },
  ganancia_musculo: {
    descanso:      { kcalPerKg: 31.5, proteinGkg: 2.3,  carbsGkg: 3.5,  fatGkg: 1.05  },
    entreno:       { kcalPerKg: 35.5, proteinGkg: 2.1,  carbsGkg: 5.0,  fatGkg: 1.0   },
    doble:         { kcalPerKg: 39.5, proteinGkg: 2.1,  carbsGkg: 6.0,  fatGkg: 0.95  },
    recuperacion:  { kcalPerKg: 32.5, proteinGkg: 2.4,  carbsGkg: 4.0,  fatGkg: 1.0   },
    partido:       { kcalPerKg: 43.5, proteinGkg: 2.0,  carbsGkg: 7.0,  fatGkg: 0.9   },
  },
  mejora_condicion: {
    descanso:      { kcalPerKg: 25.5, proteinGkg: 2.4,  carbsGkg: 3.0,  fatGkg: 0.9   },
    entreno:       { kcalPerKg: 29.5, proteinGkg: 2.3,  carbsGkg: 4.0,  fatGkg: 0.85  },
    doble:         { kcalPerKg: 32.5, proteinGkg: 2.3,  carbsGkg: 5.0,  fatGkg: 0.8   },
    recuperacion:  { kcalPerKg: 27.5, proteinGkg: 2.5,  carbsGkg: 3.5,  fatGkg: 0.85  },
    partido:       { kcalPerKg: 41.5, proteinGkg: 2.1,  carbsGkg: 6.5,  fatGkg: 0.8   },
  },
  mejora_rendimiento: {
    descanso:      { kcalPerKg: 27.5, proteinGkg: 2.0,  carbsGkg: 3.5,  fatGkg: 0.95  },
    entreno:       { kcalPerKg: 31.5, proteinGkg: 1.9,  carbsGkg: 4.5,  fatGkg: 0.9   },
    doble:         { kcalPerKg: 36.5, proteinGkg: 1.9,  carbsGkg: 6.0,  fatGkg: 0.85  },
    recuperacion:  { kcalPerKg: 28.5, proteinGkg: 2.1,  carbsGkg: 4.0,  fatGkg: 0.9   },
    partido:       { kcalPerKg: 42.5, proteinGkg: 1.85, carbsGkg: 6.9,  fatGkg: 0.9   },
  },
};



export function getObjectiveLabel(objectiveKey) {
  return PLAYER_OBJECTIVES.find((o) => o.value === objectiveKey)?.label || objectiveKey || '';
}

export function getTeamNutritionDayTypes(teamConfig) {
  const cfg = teamConfig?.configuracion_nutricional || teamConfig;
  if (cfg?.dayTypes && Array.isArray(cfg.dayTypes) && cfg.dayTypes.length > 0) {
    return cfg.dayTypes;
  }
  return NUTRITION_DAY_TYPES;
}

export function getTeamObjectiveDayTypeMacros(teamConfig) {
  const cfg = teamConfig?.configuracion_nutricional || teamConfig;
  if (cfg?.objectiveMacros && Object.keys(cfg.objectiveMacros).length > 0) {
    return cfg.objectiveMacros;
  }
  return OBJECTIVE_DAY_TYPE_MACROS;
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



export function getUserMealsForDay(jugador, tipoDia, teamConfig, preMatchConfig = null, dayKey = null) {
  const baseMeals = getUserMeals(jugador);
  if (!jugador) return baseMeals;

  if (tipoDia === 'partido' && preMatchConfig?.enabled) {
    const horario = preMatchConfig?.partidos?.[dayKey]?.horario || preMatchConfig?.horario || 'tarde';
    const matchConfig = jugador?.config_prepartido?.[horario];
    if (matchConfig && Array.isArray(matchConfig.ingestas) && matchConfig.ingestas.length > 0) {
      const matchMeals = [...matchConfig.ingestas];
      const hasPost = matchConfig.postentreno !== undefined ? Boolean(matchConfig.postentreno) : Boolean(jugador.postentreno);
      const isAlreadyPost = matchMeals.some((m) => {
        const low = String(m || '').toLowerCase();
        return low === 'post-entreno' || low === 'post entreno' || low === 'post' || low === 'post-partido' || low === 'post partido';
      });
      if (hasPost && !isAlreadyPost) {
        matchMeals.push('Post-entreno');
      } else if (!hasPost && isAlreadyPost) {
        return sortMeals(matchMeals.filter((m) => {
          const low = String(m || '').toLowerCase();
          return !(low === 'post-entreno' || low === 'post entreno' || low === 'post' || low === 'post-partido' || low === 'post partido');
        }));
      }
      return sortMeals(matchMeals);
    }
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
