export async function getMealsFiltered(supabase, jugadorId, mealType, dayFromUTC, dayToUTC) {
  let query = supabase
    .from('comidas')
    .select('id, jugador_id, taken_at, dish_name, meal_type, ingredients, calories, notes, photo_size, photo_mime, created_at')
    .eq('jugador_id', jugadorId);

  if (mealType) {
    query = query.eq('meal_type', mealType);
  }

  if (dayFromUTC && dayToUTC) {
    query = query.gte('taken_at', dayFromUTC).lte('taken_at', dayToUTC);
  }

  query = query.order('taken_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMealById(supabase, id) {
  const { data, error } = await supabase
    .from('comidas')
    .select('id, jugador_id, photo_size, photo_mime')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getMealPhoto(supabase, id) {
  const { data, error } = await supabase
    .from('comidas')
    .select('photo, photo_mime')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function insertMeal(supabase, payload) {
  const { data, error } = await supabase
    .from('comidas')
    .insert(payload)
    .select('id, jugador_id, taken_at, dish_name, meal_type, ingredients, calories, notes, photo_size, photo_mime, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updateMeal(supabase, id, payload) {
  const { data, error } = await supabase
    .from('comidas')
    .update(payload)
    .eq('id', id)
    .select('id, jugador_id, taken_at, dish_name, meal_type, ingredients, calories, notes, photo_size, photo_mime, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMeal(supabase, id) {
  const { error } = await supabase
    .from('comidas')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getMealPhotoWithMeta(supabase, id) {
  const { data, error } = await supabase
    .from('comidas')
    .select('jugador_id, photo, photo_mime, photo_size')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

