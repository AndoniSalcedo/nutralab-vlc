import { mockTeam, mockTeams, mockPlayers, isMockTeam, isMockPlayer } from '@/lib/boneyardMockData';

export async function getTecnicosByOwner(supabase, ownerId) {
  const { data: links, error: linksError } = await supabase
    .from('nutricionista_tecnicos')
    .select('tecnico_id, tecnicos(*)')
    .eq('nutricionista_id', ownerId);

  if (linksError) throw linksError;

  const tecnicos = (links || []).map((l) => l.tecnicos).filter(Boolean);
  const tecnicoIds = tecnicos.map((t) => t.id);

  let assignments = [];
  if (tecnicoIds.length > 0) {
    const { data, error } = await supabase
      .from('tecnico_equipos')
      .select('tecnico_id, equipo_id')
      .in('tecnico_id', tecnicoIds);

    if (error) throw error;
    assignments = data || [];
  }

  const assignmentsMap = new Map();
  for (const assoc of assignments) {
    const tId = assoc.tecnico_id;
    const current = assignmentsMap.get(tId) || [];
    current.push(assoc.equipo_id);
    assignmentsMap.set(tId, current);
  }

  return tecnicos.map((tecnico) => ({
    ...tecnico,
    team_ids: assignmentsMap.get(tecnico.id) || [],
  }));
}

export async function getTecnicoByEmail(supabase, email) {
  const { data, error } = await supabase
    .from('tecnicos')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getTecnicoById(supabase, id) {
  const { data, error } = await supabase
    .from('tecnicos')
    .select('id, nombre, apellidos, email, avatar, avatar_mime, avatar_size, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getTecnicoByAuthUserId(supabase, authUserId) {
  const { data, error } = await supabase
    .from('tecnicos')
    .select('id, nombre, apellidos, email')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function createTecnicoRecord(supabase, { auth_user_id, nombre, apellidos, email, owner_id = null }) {
  const { data, error } = await supabase
    .from('tecnicos')
    .insert({
      auth_user_id,
      nombre,
      apellidos,
      email,
      owner_id,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function linkTecnicoToNutricionista(supabase, ownerId, tecnicoId) {
  const { error } = await supabase
    .from('nutricionista_tecnicos')
    .upsert({
      nutricionista_id: ownerId,
      tecnico_id: tecnicoId,
      status: 'accepted',
    }, { onConflict: 'nutricionista_id,tecnico_id' });

  if (error) throw error;
  return true;
}

export async function unlinkTecnicoFromNutricionista(supabase, ownerId, tecnicoId) {
  const { error: deleteLinkErr } = await supabase
    .from('nutricionista_tecnicos')
    .delete()
    .eq('nutricionista_id', ownerId)
    .eq('tecnico_id', tecnicoId);

  if (deleteLinkErr) throw deleteLinkErr;

  const { data: myTeams } = await supabase
    .from('equipos')
    .select('id')
    .eq('owner_id', ownerId);

  const myTeamIds = (myTeams || []).map((t) => t.id);
  if (myTeamIds.length > 0) {
    await supabase
      .from('tecnico_equipos')
      .delete()
      .eq('tecnico_id', tecnicoId)
      .in('equipo_id', myTeamIds);
  }

  return true;
}

export async function getNutricionistaTecnicoLink(supabase, ownerId, tecnicoId) {
  const { data, error } = await supabase
    .from('nutricionista_tecnicos')
    .select('id')
    .eq('nutricionista_id', ownerId)
    .eq('tecnico_id', tecnicoId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function assignTeamsToTecnico(supabase, ownerId, tecnicoId, teamIds) {
  if (teamIds.length > 0) {
    const { data: validTeams, error: teamsError } = await supabase
      .from('equipos')
      .select('id')
      .eq('owner_id', ownerId)
      .in('id', teamIds);

    if (teamsError) throw teamsError;
    if ((validTeams || []).length !== teamIds.length) {
      throw new Error('Intento de asignar equipos sin acceso');
    }
  }

  const { data: myTeams } = await supabase
    .from('equipos')
    .select('id')
    .eq('owner_id', ownerId);
  const myTeamIds = (myTeams || []).map((t) => t.id);

  if (myTeamIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('tecnico_equipos')
      .delete()
      .eq('tecnico_id', tecnicoId)
      .in('equipo_id', myTeamIds);

    if (deleteError) throw deleteError;
  }

  if (teamIds.length > 0) {
    const rows = teamIds.map((teamId) => ({
      tecnico_id: tecnicoId,
      equipo_id: teamId,
    }));

    const { error: insertError } = await supabase
      .from('tecnico_equipos')
      .insert(rows);

    if (insertError) throw insertError;
  }

  return true;
}

export async function getTeamsByTecnico(supabase, tecnicoId) {
  if (tecnicoId === 'boneyard-mock-user' || process.env.BONEYARD_MODE === 'true') {
    return mockTeams;
  }

  const { data: assignedTeams, error } = await supabase
    .from('tecnico_equipos')
    .select('equipo_id, equipos(*)')
    .eq('tecnico_id', tecnicoId);

  if (error) throw error;
  return (assignedTeams || []).map((a) => a.equipos).filter(Boolean);
}

export async function getTecnicoTeam(supabase, tecnicoId, teamId) {
  if (isMockTeam(teamId)) {
    return mockTeam;
  }

  const { data, error } = await supabase
    .from('tecnico_equipos')
    .select('equipo_id, equipos(*)')
    .eq('tecnico_id', tecnicoId)
    .eq('equipo_id', teamId)
    .maybeSingle();

  if (error) throw error;
  return data?.equipos || null;
}

export async function getTecnicoPlayer(supabase, tecnicoId, playerId) {
  if (isMockPlayer(playerId)) {
    return mockPlayers[0];
  }

  const { data: jugador, error: jugadorError } = await supabase
    .from('jugadores')
    .select('id, equipo_id')
    .eq('id', playerId)
    .maybeSingle();

  if (jugadorError) throw jugadorError;
  if (!jugador) return null;

  const { data: access, error: accessError } = await supabase
    .from('tecnico_equipos')
    .select('id')
    .eq('tecnico_id', tecnicoId)
    .eq('equipo_id', jugador.equipo_id)
    .maybeSingle();

  if (accessError) throw accessError;
  return access ? jugador : null;
}

export async function updateTecnicoAvatar(supabase, id, { avatar, avatar_mime, avatar_size }) {
  const { error } = await supabase
    .from('tecnicos')
    .update({
      avatar,
      avatar_mime,
      avatar_size,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function removeTecnicoAvatar(supabase, id) {
  const { error } = await supabase
    .from('tecnicos')
    .update({
      avatar: null,
      avatar_mime: null,
      avatar_size: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
  return true;
}
