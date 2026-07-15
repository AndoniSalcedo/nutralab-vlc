import { NextResponse } from 'next/server';
import { getOwnedTeam as getOwnedTeamFromRepo } from '@/repositories/teamRepository';
import { getOwnedPlayer as getOwnedPlayerFromRepo } from '@/repositories/playerRepository';

export function getOwnerId(user) {
  if (!user || user.role === 'jugador') return null;
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

