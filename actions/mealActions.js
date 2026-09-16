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

export async function listPlayerMealsAction(jugadorId, { mealType, day } = {}) {
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

  return { meals: resultMeals };
}

export async function savePlayerMealAction(formData) {
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

  const payload = {
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
    payload.photo = `\\x${photoBuffer.toString('hex')}`;
    payload.photo_mime = photoFile.type;
    payload.photo_size = photoFile.size;
  }

  let resultMeal;
  if (id) {
    resultMeal = await updateMeal(supabase, id, payload);
  } else {
    resultMeal = await insertMeal(supabase, payload);
  }

  revalidatePath(`/dashboard/jugador/${jugadorId}`);
  return { success: true, meal: resultMeal };
}

export async function deletePlayerMealAction(id) {
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

export async function parseMealTreeAction(body) {
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
