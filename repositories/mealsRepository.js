
import { mockMeals, isMockPlayer } from '@/config/boneyardMockData';
import { selectFields } from '@/lib/db/prisma';

const MEAL_FIELDS = selectFields('id, jugador_id, taken_at, dish_name, meal_type, ingredients, calories, protein, carbs, fat, notes, photo_size, photo_mime, created_at');
const MEAL_WITH_DISHES = {
  ...MEAL_FIELDS,
  platos: {
    orderBy: { position: 'asc' },
    select: selectFields('id, dish_name, ingredients, calories, protein, carbs, fat, photo_size'),
  },
};

export async function getMealsFiltered(db, jugadorId, mealType, dayFromUTC, dayToUTC) {
  if (isMockPlayer(jugadorId)) {
    let result = mockMeals;
    if (mealType) {
      result = result.filter(m => m.meal_type === mealType);
    }
    return result;
  }

  const where = { jugador_id: jugadorId };

  if (mealType) {
    where.meal_type = mealType;
  }

  if (dayFromUTC && dayToUTC) {
    where.taken_at = { gte: dayFromUTC, lte: dayToUTC };
  }

  return db.comidas.findMany({
    where,
    select: MEAL_WITH_DISHES,
    orderBy: { taken_at: 'desc' },
  });
}

export async function getMealById(db, id) {
  return db.comidas.findUnique({
    where: { id },
    select: { ...selectFields('id, jugador_id, photo_size, photo_mime'), platos: { select: { id: true } } },
  });
}

/**
 * Guarda la ingesta y sus platos de una vez. `dishes`: { id|null, data }; `removedDishIds`: los que ya no están.
 * Sin `id` crea la ingesta.
 */
export async function saveMeal(db, id, payload, { dishes = [], removedDishIds = [] } = {}) {
  return db.$transaction(async (tx) => {
    const meal = id
      ? await tx.comidas.update({ where: { id }, data: payload, select: MEAL_FIELDS })
      : await tx.comidas.create({ data: payload, select: MEAL_FIELDS });

    if (removedDishIds.length) {
      await tx.comidas_platos.deleteMany({ where: { id: { in: removedDishIds }, comida_id: meal.id } });
    }
    for (const dish of dishes) {
      if (dish.id) await tx.comidas_platos.update({ where: { id: dish.id }, data: dish.data, select: { id: true } });
      else await tx.comidas_platos.create({ data: { ...dish.data, comida_id: meal.id }, select: { id: true } });
    }
    return meal;
  });
}

export async function deleteMeal(db, id) {
  await db.comidas.deleteMany({ where: { id } });
  return true;
}

export async function getMealPhotoWithMeta(db, id) {
  return db.comidas.findUnique({
    where: { id },
    select: selectFields('jugador_id, photo, photo_mime, photo_size'),
  });
}

export async function getMealDishPhotoWithMeta(db, id) {
  const dish = await db.comidas_platos.findUnique({
    where: { id },
    select: { ...selectFields('photo, photo_mime, photo_size'), comidas: { select: { jugador_id: true } } },
  });
  return dish && { jugador_id: dish.comidas.jugador_id, photo: dish.photo, photo_mime: dish.photo_mime };
}
