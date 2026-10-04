
import { mockMeals, isMockPlayer } from '@/config/boneyardMockData';
import { selectFields } from '@/lib/db/prisma';

const MEAL_FIELDS = selectFields('id, jugador_id, taken_at, dish_name, meal_type, ingredients, calories, notes, photo_size, photo_mime, created_at');

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
    select: MEAL_FIELDS,
    orderBy: { taken_at: 'desc' },
  });
}

export async function getMealById(db, id) {
  return db.comidas.findUnique({
    where: { id },
    select: selectFields('id, jugador_id, photo_size, photo_mime'),
  });
}

export async function insertMeal(db, payload) {
  return db.comidas.create({ data: payload, select: MEAL_FIELDS });
}

export async function updateMeal(db, id, payload) {
  return db.comidas.update({ where: { id }, data: payload, select: MEAL_FIELDS });
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
