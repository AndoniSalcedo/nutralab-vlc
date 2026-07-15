export async function getLatestMenu(supabase, equipoId) {
  if (!equipoId) return null;
  const { data, error } = await supabase
    .from('menu_semanal')
    .select('*')
    .eq('equipo_id', equipoId)
    .order('semana', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getMenusByTeam(supabase, teamId) {
  const { data, error } = await supabase
    .from('menu_semanal')
    .select('*')
    .eq('equipo_id', teamId)
    .order('semana', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMenusLimit(supabase, limit = 10) {
  const { data, error } = await supabase
    .from('menu_semanal')
    .select('*')
    .order('semana', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function insertMenu(supabase, payload) {
  const { data, error } = await supabase
    .from('menu_semanal')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateMenu(supabase, id, payload) {
  const { data, error } = await supabase
    .from('menu_semanal')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMenu(supabase, id) {
  const { error } = await supabase
    .from('menu_semanal')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getMenuByWeekAndTeam(supabase, week, teamId) {
  const { data, error } = await supabase
    .from('menu_semanal')
    .select('*')
    .eq('semana', week)
    .eq('equipo_id', teamId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getMenuById(supabase, id) {
  const { data, error } = await supabase
    .from('menu_semanal')
    .select('id, equipo_id')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function upsertMenu(supabase, payload) {
  const { data, error } = await supabase
    .from('menu_semanal')
    .upsert(payload, { onConflict: 'semana,equipo_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getMenusByTeamLimit(supabase, teamId, semana, limit = 10) {
  let query = supabase
    .from('menu_semanal')
    .select('*')
    .eq('equipo_id', teamId)
    .order('semana', { ascending: false });

  if (semana) query = query.eq('semana', semana);
  const { data, error } = await query.limit(limit);

  if (error) throw error;
  return data || [];
}
