// Platos de una ingesta: lógica compartida por el formulario y el servidor (sin dependencias)
export const MAX_MEAL_DISHES = 5;
export const DISH_PHOTO_PREFIX = 'dishPhoto_';
export const MACRO_KEYS = ['protein', 'carbs', 'fat'];

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };
const FOOD_KEY = { calories: 'kcal', protein: 'pro', carbs: 'cho', fat: 'fat' };
const NUTRIENTS = Object.keys(FOOD_KEY);
const GRAMS_SUFFIX = /\(\s*\d+(?:[.,]\d+)?\s*g\s*\)$/i;

export const roundMacro = (value) => Math.round(value * 10) / 10;

/** Número de una cifra escrita a mano ('12,5 g' → 12.5). Sin cifra → null. */
export function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/** Toma más probable según la hora: evita elegirla a mano en el caso habitual. */
export function suggestMealType(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < 11) return 'breakfast';
  if (hour < 13) return 'midMorning';
  if (hour < 16.5) return 'lunch';
  if (hour < 20) return 'snack';
  if (hour < 23) return 'dinner';
  return 'lateSnack';
}

const foodLine = (name, grams) => `${name} (${grams} g)`;
const rowLine = (row) => row.line ?? foodLine(row.food.name, row.grams);

function rowNutrients(row) {
  const grams = Number(row?.grams);
  return Object.fromEntries(NUTRIENTS.map((key) => {
    const per100 = Number(row?.food?.[FOOD_KEY[key]]);
    return [key, Number.isFinite(per100) && Number.isFinite(grams) ? (per100 * grams) / 100 : 0];
  }));
}

export const foodKcal = (food, grams) => rowNutrients({ food, grams }).calories;
export const rowMacros = (row) => {
  const { protein, carbs, fat } = rowNutrients(row);
  return { protein: roundMacro(protein), carbs: roundMacro(carbs), fat: roundMacro(fat) };
};

/** Ingredientes del textarea: una línea por ingrediente; sin gramos también vale separar con comas. */
export function parseIngredients(text) {
  return String(text ?? '')
    .split('\n')
    .flatMap((line) => (GRAMS_SUFFIX.test(line.trim()) ? [line] : line.split(',')))
    .map((item) => item.trim())
    .filter(Boolean);
}

function swapLine(text, oldLine, newLine) {
  const lines = String(text ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
  const idx = oldLine ? lines.indexOf(oldLine) : -1;
  if (idx >= 0) {
    if (newLine) lines[idx] = newLine;
    else lines.splice(idx, 1);
  } else if (newLine && !oldLine) {
    // Si la línea ya no está, la editó la persona: se respeta lo que escribió
    lines.push(newLine);
  }
  return lines.join('\n');
}

/**
 * Aplica al plato el cambio de un alimento (alta: prev null; baja: next null).
 * Suma solo la diferencia, así lo escrito a mano o precargado del plan nunca se pierde.
 */
export function applyFoodChange(dish, prev, next) {
  const before = rowNutrients(prev);
  const after = rowNutrients(next);
  const shifted = { ...dish, ingredients: swapLine(dish.ingredients, prev && rowLine(prev), next && rowLine(next)) };
  for (const key of NUTRIENTS) {
    const total = (toNumber(dish[key]) ?? 0) + after[key] - before[key];
    const rounded = key === 'calories' ? Math.round(total) : roundMacro(total);
    shifted[key] = rounded > 0 ? String(rounded) : '';
  }
  return shifted;
}

/** Filas editables a partir de los ingredientes guardados con el formato "Nombre (150 g)". */
export function rowsFromIngredients(lines, foods, nextId) {
  const byName = new Map(foods.map((food) => [food.name.toLowerCase(), food]));
  return (Array.isArray(lines) ? lines : []).flatMap((line) => {
    const match = String(line).match(/^(.+?)\s*\(\s*(\d+(?:\.\d+)?)\s*g\s*\)$/i);
    const food = match && byName.get(match[1].trim().toLowerCase());
    return food ? [{ id: nextId(), food, grams: Number(match[2]), line }] : [];
  });
}

/** Calorías de un plato; si solo hay macros se deducen de ellos para que cuenten en el balance. */
export function dishCalories(dish) {
  const calories = toNumber(dish.calories);
  if (calories > 0) return Math.round(calories);
  const fromMacros = MACRO_KEYS.reduce((sum, key) => sum + (toNumber(dish[key]) ?? 0) * KCAL_PER_G[key], 0);
  return fromMacros > 0 ? Math.round(fromMacros) : null;
}

/** Totales de la ingesta: lo que leen resúmenes, avisos y widgets, que no conocen los platos. */
export function summarizeDishes(dishes) {
  const total = (key) => {
    const values = dishes.map((dish) => toNumber(dish[key])).filter((value) => value != null);
    return values.length ? roundMacro(values.reduce((sum, value) => sum + value, 0)) : null;
  };
  const calories = dishes.map(dishCalories).filter((value) => value != null);
  const names = dishes.map((dish) => String(dish.dishName ?? '').trim()).filter(Boolean);

  return {
    dishName: names.join(' · ') || null,
    calories: calories.length ? calories.reduce((sum, value) => sum + value, 0) : null,
    protein: total('protein'),
    carbs: total('carbs'),
    fat: total('fat'),
    ingredients: dishes.flatMap((dish) => (Array.isArray(dish.ingredients) ? dish.ingredients : [])),
  };
}

/**
 * Consumido en el día: kcal y macros guardados con cada comida. Los registros anteriores a
 * guardar macros se recalculan con sus ingredientes "Nombre (150 g)" y la biblioteca.
 */
export function consumedFromMeals(meals, foods) {
  const totals = { kcal: 0, pro: 0, cho: 0, fat: 0 };

  for (const meal of meals) {
    const hasStoredMacros = MACRO_KEYS.some((key) => meal[key] != null);
    const rows = hasStoredMacros ? [] : rowsFromIngredients(meal.ingredients, foods, () => 0);
    const fromRows = rows.map(rowNutrients);
    const rowsTotal = (key) => fromRows.reduce((sum, row) => sum + row[key], 0);

    totals.kcal += toNumber(meal.calories) ?? rowsTotal('calories');
    totals.pro += hasStoredMacros ? (toNumber(meal.protein) ?? 0) : rowsTotal('protein');
    totals.cho += hasStoredMacros ? (toNumber(meal.carbs) ?? 0) : rowsTotal('carbs');
    totals.fat += hasStoredMacros ? (toNumber(meal.fat) ?? 0) : rowsTotal('fat');
  }

  return {
    kcal: Math.round(totals.kcal),
    pro: roundMacro(totals.pro),
    cho: roundMacro(totals.cho),
    fat: roundMacro(totals.fat),
  };
}

export function hasDishContent(dish) {
  return Boolean(
    String(dish.dishName ?? '').trim()
    || String(dish.ingredients ?? '').trim()
    || dish.file
    || dish.photoUrl
    || NUTRIENTS.some((key) => toNumber(dish[key]) != null)
  );
}
