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
    meals: ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'],
    defaultMeals: {
      Desayuno: 'Huevos o yogur proteico + fruta',
      'Media mañana': 'Fruta + frutos secos o infusión',
      Comida: 'Plato del comedor priorizando proteína y verdura',
      Merienda: 'Yogur proteico o queso fresco + fruta',
      Cena: 'Pescado/huevos/carne magra + verdura',
    },
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
    meals: ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'],
    defaultMeals: {
      Desayuno: 'Yogur proteico + fruta + cereal fácil de digerir',
      'Media mañana': 'Fruta + requesón o yogur proteico',
      Comida: 'Hidrato moderado + proteína magra + verdura',
      Merienda: 'Batido o yogur proteico + fruta',
      Cena: 'Pescado o huevos + patata/arroz + verdura',
    },
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
    meals: ['Desayuno', 'Batido post', 'Comida', 'Merienda', 'Cena'],
    defaultMeals: {
      Desayuno: 'Yogur proteico + avena + fruta',
      'Batido post': 'Whey 30 g + plátano + creatina 3-5 g',
      Comida: 'Plato principal del comedor + ración de hidrato + verdura',
      Merienda: 'Yogur proteico + tortitas de arroz + fruta',
      Cena: 'Proteína magra + hidrato según carga + verdura',
    },
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
    meals: ['Desayuno', 'Post sesión 1', 'Comida', 'Merienda', 'Cena'],
    defaultMeals: {
      Desayuno: 'Avena o pan + fruta + proteína ligera',
      'Post sesión 1': 'Whey 30 g + fruta o bebida con hidratos',
      Comida: 'Arroz/pasta/patata + proteína magra + verdura',
      Merienda: 'Yogur proteico + tortitas/arroz + fruta',
      Cena: 'Proteína magra + hidrato de reposición + verdura',
    },
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
    meals: ['Desayuno', 'Comida pre', '-60 min', 'Durante', 'Post'],
    defaultMeals: {
      Desayuno: 'Pan/arroz con mermelada + fruta + proteína ligera',
      'Comida pre': 'Hidrato principal + proteína baja en grasa + verdura cocida',
      '-60 min': 'Bebida isotónica + plátano o dátiles + cafeína si está pautada',
      Durante: 'Isotónica cada 15 min; gel si procede',
      Post: 'Whey 30 g + hidratos rápidos + electrolitos',
    },
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

export function getDefaultNutritionMealDetail(dayKey, mealName) {
  return getNutritionDayType(dayKey)?.defaultMeals?.[mealName] || '';
}
