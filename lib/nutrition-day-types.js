export const DEFAULT_NUTRITION_DAY_TYPE_KEY = 'entreno';

export const NUTRITION_DAY_TYPES = [
  {
    key: 'descanso',
    label: 'Descanso',
    planLabel: 'Día descanso',
    factor: 1.2,
    proteinGkg: 1.8,
    carbsGkg: 3.1,
    fatGkg: 1.3,
    color: 'blue',
  },
  {
    key: 'recuperacion',
    label: 'Recuperación',
    planLabel: 'Día recuperación',
    factor: 1.4,
    proteinGkg: 1.8,
    carbsGkg: 4.6,
    fatGkg: 1.2,
    color: 'teal',
  },
  {
    key: 'entreno',
    label: 'Entrenamiento',
    planLabel: 'Día entrenamiento',
    factor: 1.55,
    proteinGkg: 1.8,
    carbsGkg: 5.6,
    fatGkg: 1.2,
    color: 'green',
  },
  {
    key: 'doble',
    label: 'Doble sesión',
    planLabel: 'Día doble sesión',
    factor: 1.7,
    proteinGkg: 1.8,
    carbsGkg: 6.8,
    fatGkg: 1.1,
    color: 'orange',
  },
  {
    key: 'partido',
    label: 'Partido',
    planLabel: 'Día partido',
    factor: 1.8,
    proteinGkg: 1.8,
    carbsGkg: 7.4,
    fatGkg: 1.1,
    color: 'red',
  },
];

export const PLAN_DAY_TYPES = NUTRITION_DAY_TYPES.map((dayType) => ({
  ...dayType,
  label: dayType.planLabel,
  shortLabel: dayType.label,
  kcalLabel: dayType.planLabel,
}));

export function resolveNutritionDayType(value) {
  const factor = Number(value);
  const defaultType = NUTRITION_DAY_TYPES.find((dayType) => dayType.key === DEFAULT_NUTRITION_DAY_TYPE_KEY) || NUTRITION_DAY_TYPES[0];
  if (!Number.isFinite(factor)) return defaultType;

  return NUTRITION_DAY_TYPES.reduce((closest, dayType) => {
    const closestDistance = Math.abs(closest.factor - factor);
    const currentDistance = Math.abs(dayType.factor - factor);
    return currentDistance < closestDistance ? dayType : closest;
  }, NUTRITION_DAY_TYPES[0]);
}

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
