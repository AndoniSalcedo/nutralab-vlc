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


