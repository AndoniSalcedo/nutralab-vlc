export const DEFAULT_NUTRITION_DAY_TYPE_KEY = 'entreno';

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

export const PLAN_DAY_TYPES = NUTRITION_DAY_TYPES.map((dayType) => ({
  ...dayType,
  label: dayType.planLabel,
  shortLabel: dayType.label,
  kcalLabel: dayType.planLabel,
}));

export function getNutritionDayType(key) {
  return NUTRITION_DAY_TYPES.find((dayType) => dayType.key === key) || null;
}

export function getDayTypeColor(key) {
  return getNutritionDayType(key)?.color || 'green';
}

export function getDayTypeLabel(key) {
  return getNutritionDayType(key)?.label || key;
}

export const PLAN_CONTEXTS = [
  { value: 'semana_normal', label: 'Semana normal de entrenamiento', promptDescription: 'semana normal de entrenamiento (3-4 sesiones)' },
  { value: 'semana_partido', label: 'Semana con partido oficial (microciclo competitivo)', promptDescription: 'semana con partido oficial (microciclo competitivo)' },
  { value: 'dia_partido', label: 'Día de partido (ajuste máximo de timing nutricional)', promptDescription: 'dia de partido (ajuste maximo de timing nutricional)' },
  { value: 'viaje', label: 'Viaje / desplazamiento', promptDescription: 'viaje o desplazamiento para jugar fuera' },
  { value: 'lesion', label: 'Lesión / inactividad', promptDescription: 'periodo de lesion o inactividad reducida' },
  { value: 'vacaciones', label: 'Vacaciones / fuera de temporada', promptDescription: 'periodo vacacional fuera de temporada' },
  { value: 'pretemporada', label: 'Pretemporada (alta carga)', promptDescription: 'pretemporada (alta carga de trabajo)' },
];


export const AVAILABLE_MEALS = [
  { value: 'Desayuno', label: 'Desayuno' },
  { value: 'Almuerzo', label: 'Almuerzo' },
  { value: 'Comida', label: 'Comida' },
  { value: 'Merienda', label: 'Merienda' },
  { value: 'Cena', label: 'Cena' }
];

export const STANDARD_MEALS = ['Desayuno', 'Almuerzo', 'Comida', 'Merienda', 'Cena'];

export const DEFAULT_PLAYER_MEALS_STRING = 'Desayuno, Comida, Cena';

export function getUserMeals(jugador) {
  if (!jugador) return ['Desayuno', 'Comida', 'Cena'];
  let meals = [];
  if (jugador.num_comidas) {
    if (!isNaN(Number(jugador.num_comidas))) {
      const count = Number(jugador.num_comidas);
      meals = STANDARD_MEALS.slice(0, Math.min(count, 5));
    } else {
      meals = jugador.num_comidas.split(',').map((s) => s.trim()).filter(Boolean);
      // Sort by canonical order
      const order = [...STANDARD_MEALS, 'Post-entreno'];
      meals.sort((a, b) => {
        const ia = order.findIndex((m) => m.toLowerCase() === a.toLowerCase());
        const ib = order.findIndex((m) => m.toLowerCase() === b.toLowerCase());
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
    }
  } else {
    meals = ['Desayuno', 'Comida', 'Cena'];
  }

  if (jugador.postentreno) {
    const hasPost = meals.some(
      (m) => m.toLowerCase() === 'post-entreno' || m.toLowerCase() === 'post entreno' || m.toLowerCase() === 'post'
    );
    if (!hasPost) {
      meals.push('Post-entreno');
    }
  }
  return meals;
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

export function getObjectiveMacros(objectiveKey, dayTypeKey) {
  return OBJECTIVE_DAY_TYPE_MACROS[objectiveKey]?.[dayTypeKey] || null;
}

export function getObjectiveLabel(objectiveKey) {
  return PLAYER_OBJECTIVES.find((o) => o.value === objectiveKey)?.label || objectiveKey || '';
}

export function getTeamNutritionDayTypes(teamConfig) {
  if (teamConfig?.dayTypes && Array.isArray(teamConfig.dayTypes) && teamConfig.dayTypes.length > 0) {
    return teamConfig.dayTypes;
  }
  return NUTRITION_DAY_TYPES;
}

export function getTeamObjectiveDayTypeMacros(teamConfig) {
  if (teamConfig?.objectiveMacros && Object.keys(teamConfig.objectiveMacros).length > 0) {
    return teamConfig.objectiveMacros;
  }
  return OBJECTIVE_DAY_TYPE_MACROS;
}

export function getTeamNutritionDayType(key, teamConfig) {
  return getTeamNutritionDayTypes(teamConfig).find((dayType) => dayType.key === key) || null;
}

export function getTeamDayTypeColor(key, teamConfig) {
  return getTeamNutritionDayType(key, teamConfig)?.color || 'green';
}

export function getTeamDayTypeLabel(key, teamConfig) {
  return getTeamNutritionDayType(key, teamConfig)?.label || key;
}

export function getTeamObjectiveMacros(objectiveKey, dayTypeKey, teamConfig) {
  return getTeamObjectiveDayTypeMacros(teamConfig)[objectiveKey]?.[dayTypeKey] || null;
}

export function getUserMealsForDay(jugador, tipoDia, teamConfig) {
  const baseMeals = getUserMeals(jugador);
  if (!jugador) return baseMeals;

  const hasPostentrenoEnabled = jugador.postentreno;
  if (!hasPostentrenoEnabled) {
    return baseMeals.filter((meal) => {
      const isPost = meal.toLowerCase() === 'post-entreno' || meal.toLowerCase() === 'post entreno' || meal.toLowerCase() === 'post';
      return !isPost;
    });
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

  return baseMeals.filter((meal) => {
    const isPost = meal.toLowerCase() === 'post-entreno' || meal.toLowerCase() === 'post entreno' || meal.toLowerCase() === 'post';
    if (isPost) {
      return tienePostentreno;
    }
    return true;
  });
}
