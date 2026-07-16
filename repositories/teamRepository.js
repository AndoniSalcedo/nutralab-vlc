function getOwnerId(user) {
  if (!user || user.role === 'jugador') return null;
  return String(user.external_admin_id || user.id || user.email || user.username || '').trim() || null;
}

export async function getOwnedTeam(supabase, user, teamId) {
  if (user?.isBoneyardBypass) {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('id', teamId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  const ownerId = getOwnerId(user);
  if (!ownerId || !teamId) return null;

  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .eq('id', teamId)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getTeamsByOwner(supabase, ownerId) {
  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .eq('owner_id', ownerId)
    .order('temporada', { ascending: false })
    .order('nombre');

  if (error) throw error;
  return data || [];
}

export async function getTeamById(supabase, teamId) {
  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .eq('id', teamId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getTeamByIdAndOwner(supabase, teamId, ownerId) {
  const { data, error } = await supabase
    .from('equipos')
    .select('id')
    .eq('id', teamId)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function insertTeam(supabase, { owner_id, nombre, temporada, descripcion }) {
  const { data, error } = await supabase
    .from('equipos')
    .insert({ owner_id, nombre, temporada, descripcion })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeam(supabase, teamId) {
  const { error } = await supabase
    .from('equipos')
    .delete()
    .eq('id', teamId);

  if (error) throw error;
  return true;
}

export async function updateTeamConfig(supabase, teamId, configuracion_nutricional) {
  const { error } = await supabase
    .from('equipos')
    .update({ configuracion_nutricional })
    .eq('id', teamId);

  if (error) throw error;
  return true;
}

export async function updateTeam(supabase, teamId, { nombre, temporada, descripcion }) {
  const { data, error } = await supabase
    .from('equipos')
    .update({ nombre, temporada, descripcion })
    .eq('id', teamId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
