import { NextResponse } from 'next/server';
import { getOwnedTeam as getOwnedTeamFromRepo } from '@/repositories/teamRepository';
import { getOwnedPlayer as getOwnedPlayerFromRepo } from '@/repositories/playerRepository';
import { getTecnicoTeam as getTecnicoTeamFromRepo, getTecnicoPlayer as getTecnicoPlayerFromRepo } from '@/repositories/tecnicoRepository';

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
  return getTecnicoTeamFromRepo(supabase, user.id, teamId);
}

export async function getTecnicoPlayer(supabase, user, playerId) {
  if (!user || user.role !== 'tecnico' || !playerId) return null;
  return getTecnicoPlayerFromRepo(supabase, user.id, playerId);
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
