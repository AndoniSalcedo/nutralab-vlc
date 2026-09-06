import { NextResponse } from 'next/server';
import { getOwnedTeam as getOwnedTeamFromRepo } from '@/repositories/teamRepository';
import { getOwnedPlayer as getOwnedPlayerFromRepo } from '@/repositories/playerRepository';

export function getOwnerId(user) {
  if (!user || user.role === 'jugador' || user.role === 'tecnico') return null;
  return String(user.external_admin_id || user.id || user.email || user.username || '').trim() || null;
}

export function forbidden(message = 'Sin permisos') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getOwnedTeam(supabase, user, teamId) {
  return getOwnedTeamFromRepo(supabase, user, teamId);
}

export async function getOwnedPlayer(supabase, user, playerId) {
  return getOwnedPlayerFromRepo(supabase, user, playerId);
}

export async function getTecnicoTeam(supabase, user, teamId) {
  if (!user || user.role !== 'tecnico' || !teamId) return null;
  if (user?.isBoneyardBypass) {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('id', teamId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  const { data, error } = await supabase
    .from('tecnico_equipos')
    .select('equipo_id, equipos(*)')
    .eq('tecnico_id', user.id)
    .eq('equipo_id', teamId)
    .maybeSingle();

  if (error) throw error;
  return data?.equipos || null;
}

export async function getTecnicoPlayer(supabase, user, playerId) {
  if (!user || user.role !== 'tecnico' || !playerId) return null;
  if (user?.isBoneyardBypass) {
    const { data: jugador, error: jugadorError } = await supabase
      .from('jugadores')
      .select('id, equipo_id')
      .eq('id', playerId)
      .maybeSingle();
    if (jugadorError) throw jugadorError;
    return jugador || null;
  }

  const { data: jugador, error: jugadorError } = await supabase
    .from('jugadores')
    .select('id, equipo_id')
    .eq('id', playerId)
    .maybeSingle();

  if (jugadorError) throw jugadorError;
  if (!jugador) return null;

  const team = await getTecnicoTeam(supabase, user, jugador.equipo_id);
  return team ? jugador : null;
}

export async function getAccessibleTeam(supabase, user, teamId) {
  if (!user) return null;
  if (user.role === 'tecnico') {
    return getTecnicoTeam(supabase, user, teamId);
  }
  return getOwnedTeam(supabase, user, teamId);
}

export async function getAccessiblePlayer(supabase, user, playerId) {
  if (!user) return null;
  if (user.role === 'tecnico') {
    return getTecnicoPlayer(supabase, user, playerId);
  }
  return getOwnedPlayer(supabase, user, playerId);
}
