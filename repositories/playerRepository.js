function getOwnerId(user) {
  if (!user || user.role === 'jugador') return null;
  return String(user.external_admin_id || user.id || user.email || user.username || '').trim() || null;
}

export async function getOwnedPlayer(supabase, user, playerId) {
  if (user?.isBoneyardBypass) {
    const { data, error } = await supabase
      .from('jugadores')
      .select('id,equipo_id,equipos!inner(id,owner_id)')
      .eq('id', playerId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  const ownerId = getOwnerId(user);
  if (!ownerId || !playerId) return null;

  const { data, error } = await supabase
    .from('jugadores')
    .select('id,equipo_id,equipos!inner(id,owner_id)')
    .eq('id', playerId)
    .eq('equipos.owner_id', ownerId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getPlayerById(supabase, id) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayerByIdMaybe(supabase, id) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPlayerAuthUserId(supabase, id) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('auth_user_id')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayerForCredentials(supabase, id) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, auth_user_id, auth_email')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayerByAuthUserId(supabase, authUserId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, apellidos')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPlayerByAuthUserIdSingle(supabase, authUserId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, apellidos')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayersByOwner(supabase, ownerId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id,equipo_id,nombre,apellidos,posicion,equipos!inner(owner_id)')
    .eq('equipos.owner_id', ownerId)
    .order('nombre');

  if (error) throw error;
  return data || [];
}

export async function getPlayersByTeam(supabase, teamId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('*')
    .eq('equipo_id', teamId)
    .order('nombre');

  if (error) throw error;
  return data || [];
}

export async function getPlayersByTeamSelect(supabase, teamId, selectFields = '*') {
  const { data, error } = await supabase
    .from('jugadores')
    .select(selectFields)
    .eq('equipo_id', teamId)
    .order('nombre');

  if (error) throw error;
  return data || [];
}

export async function getPlayersByTeamSelectSimple(supabase, teamId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id,nombre,apellidos,posicion')
    .eq('equipo_id', teamId)
    .order('nombre');

  if (error) throw error;
  return data || [];
}

export async function getPlayersByTeamIds(supabase, teamId, ids) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id')
    .eq('equipo_id', teamId)
    .in('id', ids);

  if (error) throw error;
  return data || [];
}

export async function getPlayerWithTeamConfig(supabase, id) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('*, equipos(configuracion_nutricional)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayerWithTeamConfigMaybe(supabase, id) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('*, equipos(configuracion_nutricional)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPlayersIdsByTeamOrdered(supabase, teamId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id')
    .eq('equipo_id', teamId)
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPlayersForImport(supabase, teamId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, apellidos, equipo_id')
    .eq('equipo_id', teamId);

  if (error) throw error;
  return data || [];
}

export async function getPlayerIdByAuthUserId(supabase, authUserId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function insertPlayer(supabase, payload) {
  const { data, error } = await supabase
    .from('jugadores')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function insertPlayersBulk(supabase, payloads) {
  const { data, error } = await supabase
    .from('jugadores')
    .insert(payloads)
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function updatePlayer(supabase, id, payload) {
  const { data, error } = await supabase
    .from('jugadores')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlayer(supabase, id) {
  const { error } = await supabase
    .from('jugadores')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getOwnedPlayersByIds(supabase, ownerId, playerIds) {
  if (!ownerId || !playerIds || !playerIds.length) return [];

  const { data, error } = await supabase
    .from('jugadores')
    .select('*, equipos!inner(owner_id)')
    .in('id', playerIds)
    .eq('equipos.owner_id', ownerId);

  if (error) throw error;
  return data || [];
}

export async function getPlayerAvatar(supabase, id) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, apellidos, equipo_id, avatar, avatar_mime, avatar_size, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

