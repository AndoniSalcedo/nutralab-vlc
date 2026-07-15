import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import {
  getMealsFiltered,
  getMealById,
  insertMeal,
  updateMeal,
  deleteMeal
} from '@/repositories/mealsRepository';

export const dynamic = 'force-dynamic';

const DEFAULT_TZ = 'Europe/Madrid';

function getDateStr(dateStr, tz = DEFAULT_TZ) {
  return new Date(dateStr).toLocaleDateString('sv-SE', { timeZone: tz });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jugadorId = searchParams.get('jugador_id');
    const mealType = searchParams.get('mealType');
    const day = searchParams.get('day'); // YYYY-MM-DD
    
    if (!jugadorId) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const isPlayer = user.role === 'jugador';
    if (!isPlayer) {
      const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
      if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    } else {
      if (String(user.id) !== String(jugadorId)) {
        return forbidden('No tienes acceso a este jugador');
      }
    }

    let resultMeals = [];
    if (day) {
      // Fetch a wider UTC range to cover the Madrid timezone and filter exactly below
      const fromUTC = new Date(`${day}T00:00:00Z`);
      fromUTC.setHours(fromUTC.getHours() - 3);
      const toUTC = new Date(`${day}T23:59:59Z`);
      toUTC.setHours(toUTC.getHours() + 3);
      
      resultMeals = await getMealsFiltered(supabase, jugadorId, mealType, fromUTC.toISOString(), toUTC.toISOString());
      resultMeals = resultMeals.filter(m => getDateStr(m.taken_at) === day);
    } else {
      resultMeals = await getMealsFiltered(supabase, jugadorId, mealType, null, null);
    }

    return NextResponse.json({ meals: resultMeals });
  } catch (e) {
    console.error('Error in comidas GET:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const id = formData.get('id');
    const jugadorId = formData.get('jugador_id');
    const takenAt = formData.get('takenAt');
    const dishName = formData.get('dishName');
    const mealType = formData.get('mealType');
    const ingredientsRaw = formData.get('ingredients');
    const calories = formData.get('calories');
    const notes = formData.get('notes');
    const photoFile = formData.get('photo');

    if (!jugadorId) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });
    if (!mealType) return NextResponse.json({ error: 'Falta el tipo de ingesta' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const isPlayer = user.role === 'jugador';
    if (!isPlayer) {
      const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
      if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    } else {
      if (String(user.id) !== String(jugadorId)) {
        return forbidden('No tienes acceso a este jugador');
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

    if (photoFile && photoFile instanceof File) {
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

    return NextResponse.json({ success: true, meal: resultMeal });
  } catch (e) {
    console.error('Error in comidas POST:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const meal = await getMealById(supabase, id);
    if (!meal) return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });

    const isPlayer = user.role === 'jugador';
    if (!isPlayer) {
      const ownedPlayer = await getOwnedPlayer(supabase, user, meal.jugador_id);
      if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    } else {
      if (String(user.id) !== String(meal.jugador_id)) {
        return forbidden('No tienes acceso a este jugador');
      }
    }

    await deleteMeal(supabase, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error in comidas DELETE:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

