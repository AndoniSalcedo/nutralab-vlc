'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer, getAccessiblePlayer } from '@/lib/auth/team-access';
import {
  getMealsFiltered,
  getMealById,
  insertMeal,
  updateMeal,
  deleteMeal
} from '@/repositories/mealsRepository';
import { parseMealTreeWithAI } from '@/lib/ai/meal-tree-parser';

const DEFAULT_TZ = 'Europe/Madrid';

function getDateStr(dateStr, tz = DEFAULT_TZ) {
  return new Date(dateStr).toLocaleDateString('sv-SE', { timeZone: tz });
}

function mapMealToClient(dbMeal) {
  if (!dbMeal) return null;
  return {
    ...dbMeal,
    id: dbMeal.id,
    jugadorId: dbMeal.jugador_id,
    takenAt: dbMeal.taken_at,
    dishName: dbMeal.dish_name,
    mealType: dbMeal.meal_type,
    ingredients: dbMeal.ingredients || [],
    calories: dbMeal.calories,
    notes: dbMeal.notes,
    hasPhoto: !!dbMeal.photo_size,
    photoMime: dbMeal.photo_mime,
    photoSize: dbMeal.photo_size,
    createdAt: dbMeal.created_at,
    photoUrl: dbMeal.photo_size ? `/api/media/meal-photo?id=${dbMeal.id}` : null,
  };
}

export async function listPlayerMeals(jugadorId, { mealType, day } = {}) {
  if (!jugadorId) throw new Error('Falta jugador_id');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user) throw new Error('No autorizado');

  const isPlayer = user.role === 'jugador';
  if (!isPlayer) {
    const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
    if (!accessiblePlayer) throw new Error('No tienes acceso a este jugador');
  } else {
    if (String(user.id) !== String(jugadorId)) {
      throw new Error('No tienes acceso a este jugador');
    }
  }

  let resultMeals = [];
  if (day) {
    const fromUTC = new Date(`${day}T00:00:00Z`);
    fromUTC.setHours(fromUTC.getHours() - 3);
    const toUTC = new Date(`${day}T23:59:59Z`);
    toUTC.setHours(toUTC.getHours() + 3);
    
    resultMeals = await getMealsFiltered(supabase, jugadorId, mealType, fromUTC.toISOString(), toUTC.toISOString());
    resultMeals = resultMeals.filter(m => getDateStr(m.taken_at) === day);
  } else {
    resultMeals = await getMealsFiltered(supabase, jugadorId, mealType, null, null);
  }

  return (resultMeals || []).map(mapMealToClient);
}

export async function savePlayerMeal(jugadorIdOrFormData, payload) {
  let formData;
  if (jugadorIdOrFormData instanceof FormData) {
    formData = jugadorIdOrFormData;
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

  if (!jugadorId) throw new Error('Falta jugador_id');
  if (!mealType) throw new Error('Falta el tipo de ingesta');

  const user = await getUser();
  if (!user || user.role === 'tecnico') throw new Error('No autorizado');
  const supabase = getSupabaseAdmin();

  const isPlayer = user.role === 'jugador';
  if (!isPlayer) {
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
    if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');
  } else {
    if (String(user.id) !== String(jugadorId)) {
      throw new Error('No tienes acceso a este jugador');
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

  const mealPayload = {
    jugador_id: Number(jugadorId),
    taken_at: takenAt ? new Date(takenAt).toISOString() : new Date().toISOString(),
    dish_name: dishName ? String(dishName).trim() : null,
    meal_type: mealType,
    ingredients,
    calories: calories ? Number(calories) : null,
    notes: notes ? String(notes).trim() : null,
  };

  if (photoFile && photoFile instanceof File && photoFile.size > 0) {
    const photoBuffer = Buffer.from(await photoFile.arrayBuffer());
    mealPayload.photo = `\\x${photoBuffer.toString('hex')}`;
    mealPayload.photo_mime = photoFile.type;
    mealPayload.photo_size = photoFile.size;
  }

  let resultMeal;
  if (id) {
    resultMeal = await updateMeal(supabase, id, mealPayload);
  } else {
    resultMeal = await insertMeal(supabase, mealPayload);
  }

  revalidatePath(`/dashboard/jugador/${jugadorId}`);
  return { success: true, meal: resultMeal };
}

export async function deletePlayerMeal(id) {
  if (!id) throw new Error('Falta id');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'tecnico') throw new Error('No autorizado');

  const meal = await getMealById(supabase, id);
  if (!meal) throw new Error('Comida no encontrada');

  const isPlayer = user.role === 'jugador';
  if (!isPlayer) {
    const ownedPlayer = await getOwnedPlayer(supabase, user, meal.jugador_id);
    if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');
  } else {
    if (String(user.id) !== String(meal.jugador_id)) {
      throw new Error('No tienes acceso a este jugador');
    }
  }

  await deleteMeal(supabase, id);
  revalidatePath(`/dashboard/jugador/${meal.jugador_id}`);
  return { success: true };
}

export async function parseMealTree(body) {
  const user = await getUser();
  if (!user) {
    throw new Error('No autenticado');
  }

  const { jugadorId = null, ...parseInput } = body || {};

  let jugador = null;
  if (jugadorId) {
    const supabase = getSupabaseAdmin();
    jugador = await getOwnedPlayer(supabase, user, jugadorId);
  }

  return parseMealTreeWithAI({ ...parseInput, jugador });
}
