import { NextResponse } from 'next/server';
import { getOwnerId } from '@/lib/auth/owner';
import { getOwnedTeam as getOwnedTeamFromRepo } from '@/repositories/teamRepository';
import { getOwnedPlayer as getOwnedPlayerFromRepo } from '@/repositories/playerRepository';
import { getTecnicoTeam as getTecnicoTeamFromRepo, getTecnicoPlayer as getTecnicoPlayerFromRepo } from '@/repositories/tecnicoRepository';

export { getOwnerId };

export function forbidden(message = 'Sin permisos') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getOwnedTeam(db, user, teamId) {
  return getOwnedTeamFromRepo(db, user, teamId);
}

export async function getOwnedPlayer(db, user, playerId) {
  return getOwnedPlayerFromRepo(db, user, playerId);
}

async function getTecnicoTeam(db, user, teamId) {
  if (!user || user.role !== 'tecnico' || !teamId) return null;
  return getTecnicoTeamFromRepo(db, user.id, teamId);
}

async function getTecnicoPlayer(db, user, playerId) {
  if (!user || user.role !== 'tecnico' || !playerId) return null;
  return getTecnicoPlayerFromRepo(db, user.id, playerId);
}

export async function getAccessibleTeam(db, user, teamId) {
  if (!user) return null;
  if (user.role === 'tecnico') {
    return getTecnicoTeam(db, user, teamId);
  }
  return getOwnedTeam(db, user, teamId);
}

export async function getAccessiblePlayer(db, user, playerId) {
  if (!user) return null;
  if (user.role === 'tecnico') {
    return getTecnicoPlayer(db, user, playerId);
  }
  return getOwnedPlayer(db, user, playerId);
}
