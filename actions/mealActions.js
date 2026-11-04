'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer, getAccessiblePlayer } from '@/lib/auth/team-access';
import {
  getMealsFiltered,
  getMealById,
  getMealPhotoWithMeta,
  saveMeal,
  deleteMeal
} from '@/repositories/mealsRepository';
import { parseMealTreeWithAI } from '@/lib/ai/meal-tree-parser';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { readImageUpload, toByteaHex } from '@/lib/security/uploads';
import { toDateKey } from '@/lib/dates';
import { ActionError } from '@/lib/actionError';
import {
  DISH_PHOTO_PREFIX,
  MAX_MEAL_DISHES,
  dishCalories,
  summarizeDishes,
  toNumber,
} from '@/lib/nutrition/mealDishes';

const MEAL_TYPES = new Set(['breakfast', 'midMorning', 'lunch', 'snack', 'dinner', 'lateSnack', 'extra']);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// `v` cambia al sustituir la foto: la respuesta se cachea como inmutable
const mealPhotoUrl = (id, size) => `/api/media/meal-photo?id=${id}&v=${size}`;
const dishPhotoUrl = (id, size) => `/api/media/meal-photo?dish=${id}&v=${size}`;

function mapDishToClient(dish) {
  return {
    id: dish.id,
    dishName: dish.dish_name,
    ingredients: dish.ingredients || [],
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
    photoUrl: dish.photo_size ? dishPhotoUrl(dish.id, dish.photo_size) : null,
  };
}

function mapMealToClient({ platos, ...dbMeal }) {
  const dishes = (platos || []).map(mapDishToClient);
  const legacyPhotoUrl = dbMeal.photo_size ? mealPhotoUrl(dbMeal.id, dbMeal.photo_size) : null;
  return {
    ...dbMeal,
    dishes,
    id: dbMeal.id,
    jugadorId: dbMeal.jugador_id,
    takenAt: dbMeal.taken_at,
    dishName: dbMeal.dish_name,
    mealType: dbMeal.meal_type,
    ingredients: dbMeal.ingredients || [],
    calories: dbMeal.calories,
    protein: dbMeal.protein ?? null,
    carbs: dbMeal.carbs ?? null,
    fat: dbMeal.fat ?? null,
    notes: dbMeal.notes,
    hasPhoto: !!dbMeal.photo_size,
    photoMime: dbMeal.photo_mime,
    photoSize: dbMeal.photo_size,
    createdAt: dbMeal.created_at,
    photoUrl: dishes.find((dish) => dish.photoUrl)?.photoUrl ?? legacyPhotoUrl,
  };
}

// Gramos de un macro: sin dato → null; se acota a un rango creíble para una comida
function parseMacro(value) {
  const num = toNumber(value);
  if (num == null || num < 0) return null;
  return Math.round(Math.min(num, 1000) * 10) / 10;
}

const pickMacros = (source) => ({
  protein: parseMacro(source?.protein),
  carbs: parseMacro(source?.carbs),
  fat: parseMacro(source?.fat),
});

function parseDishes(raw) {
  let list = [];
  try {
    list = JSON.parse(String(raw ?? '[]'));
  } catch {
    throw new ActionError('Platos no válidos');
  }
  return (Array.isArray(list) ? list : []).slice(0, MAX_MEAL_DISHES).map((dish) => ({
    id: dish?.id ?? null,
    dishName: String(dish?.dishName ?? '').trim().slice(0, 200) || null,
    ingredients: (Array.isArray(dish?.ingredients) ? dish.ingredients : []).map(String).filter(Boolean).slice(0, 60),
    calories: dishCalories(dish ?? {}),
    ...pickMacros(dish),
    removePhoto: Boolean(dish?.removePhoto),
    legacyPhoto: Boolean(dish?.legacyPhoto),
  }));
}

const photoColumns = (image) => ({
  photo: image ? toByteaHex(image.buffer) : null,
  photo_mime: image?.mime ?? null,
  photo_size: image?.size ?? null,
});

// Columnas de un plato: la foto solo se toca si hay una nueva o se ha quitado
function dishRow(dish, position, image) {
  const row = {
    position,
    dish_name: dish.dishName,
    ingredients: dish.ingredients,
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
  };
  if (image) return { ...row, ...photoColumns(image) };
  return dish.removePhoto ? { ...row, ...photoColumns(null) } : row;
}

const isUploadedFile = (value) => value instanceof File && value.size > 0;

export async function listPlayerMeals(jugadorId, { mealType, day } = {}) {
  if (!jugadorId) throw new ActionError('Falta jugador_id');

  const db = getDb();
  const user = await getUser();
  if (!user) throw new ActionError('No autorizado');

  const isPlayer = user.role === 'jugador';
  if (!isPlayer) {
    const accessiblePlayer = await getAccessiblePlayer(db, user, jugadorId);
    if (!accessiblePlayer) throw new ActionError('No tienes acceso a este jugador');
  } else {
    if (String(user.id) !== String(jugadorId)) {
      throw new ActionError('No tienes acceso a este jugador');
    }
  }

  if (day && (!DAY_RE.test(String(day)) || Number.isNaN(Date.parse(`${day}T00:00:00Z`)))) {
    throw new ActionError('Fecha no válida');
  }

  let resultMeals = [];
  if (day) {
    const fromUTC = new Date(`${day}T00:00:00Z`);
    fromUTC.setHours(fromUTC.getHours() - 3);
    const toUTC = new Date(`${day}T23:59:59Z`);
    toUTC.setHours(toUTC.getHours() + 3);
    
    resultMeals = await getMealsFiltered(db, jugadorId, mealType, fromUTC.toISOString(), toUTC.toISOString());
    resultMeals = resultMeals.filter(m => toDateKey(m.taken_at) === day);
  } else {
    resultMeals = await getMealsFiltered(db, jugadorId, mealType, null, null);
  }

  return (resultMeals || []).map(mapMealToClient);
}

export async function savePlayerMeal(jugadorIdOrFormData, payload) {
  let formData;
  if (jugadorIdOrFormData instanceof FormData) {
    formData = jugadorIdOrFormData;
  } else if (payload instanceof FormData) {
    formData = payload;
    formData.set('jugador_id', String(jugadorIdOrFormData));
  } else {
    const jugadorId = jugadorIdOrFormData;
    formData = new FormData();
    if (payload?.id) formData.append('id', payload.id);
    if (payload?.takenAt) {
      const d = payload.takenAt instanceof Date ? payload.takenAt : new Date(payload.takenAt);
      if (!Number.isNaN(+d)) formData.append('takenAt', d.toISOString());
    }
    if (payload?.dishName) formData.append('dishName', payload.dishName);
    if (payload?.mealType) formData.append('mealType', payload.mealType);

    if (Array.isArray(payload?.ingredients)) {
      formData.append('ingredients', JSON.stringify(payload.ingredients));
    } else if (typeof payload?.ingredients === 'string') {
      const arr = payload.ingredients.split('\n').map(s => s.trim()).filter(Boolean);
      formData.append('ingredients', JSON.stringify(arr));
    }

    if (Number.isFinite(Number(payload?.calories))) {
      formData.append('calories', String(Math.round(Number(payload.calories))));
    }
    for (const key of ['protein', 'carbs', 'fat']) {
      if (payload?.[key] != null) formData.append(key, String(payload[key]));
    }
    if (payload?.notes) formData.append('notes', payload.notes);
    if (payload?.photo) formData.append('photo', payload.photo);
    if (jugadorId) formData.set('jugador_id', String(jugadorId));
  }

  const id = formData.get('id');
  const jugadorId = formData.get('jugador_id');
  const takenAt = formData.get('takenAt');
  const dishName = formData.get('dishName');
  const mealType = formData.get('mealType');
  const ingredientsRaw = formData.get('ingredients');
  const calories = formData.get('calories');
  const notes = formData.get('notes');
  const photoFile = formData.get('photo');
  const dishes = parseDishes(formData.get('dishes'));

  if (!jugadorId) throw new ActionError('Falta jugador_id');
  if (!mealType) throw new ActionError('Falta el tipo de ingesta');
  if (!MEAL_TYPES.has(String(mealType))) throw new ActionError('Tipo de ingesta no válido');

  const user = await getUser();
  if (!user || user.role === 'tecnico') throw new ActionError('No autorizado');
  const db = getDb();

  const isPlayer = user.role === 'jugador';
  if (!isPlayer) {
    const ownedPlayer = await getOwnedPlayer(db, user, jugadorId);
    if (!ownedPlayer) throw new ActionError('No tienes acceso a este jugador');
  } else {
    if (String(user.id) !== String(jugadorId)) {
      throw new ActionError('No tienes acceso a este jugador');
    }
  }

  let existing = null;
  if (id) {
    // El id llega del cliente: el registro debe pertenecer al jugador autorizado
    // (si no, se podrían editar/reasignar comidas de otros jugadores).
    existing = await getMealById(db, id);
    if (!existing || String(existing.jugador_id) !== String(jugadorId)) {
      throw new ActionError('Comida no encontrada');
    }
  }

  let ingredients = [];
  if (ingredientsRaw) {
    try {
      ingredients = JSON.parse(ingredientsRaw);
      if (!Array.isArray(ingredients)) {
        ingredients = [String(ingredientsRaw)];
      }
    } catch {
      ingredients = String(ingredientsRaw).split('\n').map(s => s.trim()).filter(Boolean);
    }
  }

  const summary = dishes.length ? summarizeDishes(dishes) : null;

  const mealPayload = {
    jugador_id: Number(jugadorId),
    taken_at: takenAt && !Number.isNaN(Date.parse(String(takenAt))) ? new Date(takenAt).toISOString() : new Date().toISOString(),
    meal_type: mealType,
    notes: notes ? String(notes).trim().slice(0, 1000) : null,
    ...(summary
      ? {
        dish_name: summary.dishName,
        ingredients: summary.ingredients,
        calories: summary.calories,
        protein: summary.protein,
        carbs: summary.carbs,
        fat: summary.fat,
      }
      : {
        dish_name: dishName ? String(dishName).trim() : null,
        ingredients,
        calories: calories && Number.isFinite(Number(calories)) ? Number(calories) : null,
        ...pickMacros({
          protein: formData.get('protein'),
          carbs: formData.get('carbs'),
          fat: formData.get('fat'),
        }),
      }),
  };

  // Validar las fotos antes de escribir nada
  const dishImages = await Promise.all(dishes.map(async (_, index) => {
    const file = formData.get(`${DISH_PHOTO_PREFIX}${index}`);
    return isUploadedFile(file) ? readImageUpload(file) : null;
  }));

  if (isUploadedFile(photoFile)) {
    Object.assign(mealPayload, photoColumns(await readImageUpload(photoFile)));
  }

  // Un registro de antes de tener platos pasa su foto al plato al guardarse
  const legacyPhoto = id && dishes.some((dish) => dish.legacyPhoto && !dish.removePhoto)
    ? await getMealPhotoWithMeta(db, id)
    : null;
  const existingIds = new Set((existing?.platos || []).map((dish) => String(dish.id)));
  const rows = dishes.map((dish, position) => {
    const known = dish.id != null && existingIds.has(String(dish.id));
    const image = dishImages[position];
    const data = dishRow(dish, position, image);
    if (!image && dish.legacyPhoto && legacyPhoto?.photo) {
      Object.assign(data, photoColumns({
        buffer: legacyPhoto.photo,
        mime: legacyPhoto.photo_mime,
        size: legacyPhoto.photo_size,
      }));
    }
    return { id: known ? dish.id : null, data };
  });
  const keptIds = new Set(rows.map((row) => String(row.id)));

  if (summary) Object.assign(mealPayload, photoColumns(null));

  const resultMeal = await saveMeal(db, id || null, mealPayload, {
    dishes: rows,
    removedDishIds: [...existingIds].filter((dishId) => !keptIds.has(dishId)),
  });

  revalidatePath(`/dashboard/jugador/${jugadorId}`);
  return { success: true, meal: resultMeal };
}

export async function deletePlayerMeal(id) {
  if (!id) throw new ActionError('Falta id');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'tecnico') throw new ActionError('No autorizado');

  const meal = await getMealById(db, id);
  if (!meal) throw new ActionError('Comida no encontrada');

  const isPlayer = user.role === 'jugador';
  if (!isPlayer) {
    const ownedPlayer = await getOwnedPlayer(db, user, meal.jugador_id);
    if (!ownedPlayer) throw new ActionError('No tienes acceso a este jugador');
  } else {
    if (String(user.id) !== String(meal.jugador_id)) {
      throw new ActionError('No tienes acceso a este jugador');
    }
  }

  await deleteMeal(db, id);
  revalidatePath(`/dashboard/jugador/${meal.jugador_id}`);
  return { success: true };
}

// Devuelve { success: false, error } en lugar de lanzar: en producción Next.js
// oculta el mensaje de los errores lanzados en Server Actions (React error #441).
export async function parseMealTree(body) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    await enforceRateLimit('ai-parse-meal', String(user.id), { limit: 20, windowMs: 60 * 60 * 1000 });

    const { jugadorId = null, ...parseInput } = body || {};

    let jugador = null;
    if (jugadorId) {
      const db = getDb();
      jugador = await getOwnedPlayer(db, user, jugadorId);
    }

    return await parseMealTreeWithAI({ ...parseInput, jugador });
  } catch (err) {
    console.error('[parseMealTree]', err);
    return { success: false, error: err?.message || 'Error al conectar con el servicio de IA.' };
  }
}
