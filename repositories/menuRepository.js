import { mockMenus, isMockTeam } from '@/config/boneyardMockData';

export async function getMenusByTeam(supabase, teamId) {
  if (isMockTeam(teamId)) {
    return mockMenus;
  }

  const { data, error } = await supabase
    .from('menu_semanal')
    .select('*')
    .eq('equipo_id', teamId)
    .order('semana', { ascending: false });

  if (error) throw error;
  return data || [];
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
  if (id === 101 || isMockTeam(id)) {
    return mockMenus[0] || null;
  }

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
  if (isMockTeam(teamId)) {
    return mockMenus.slice(0, limit);
  }

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
