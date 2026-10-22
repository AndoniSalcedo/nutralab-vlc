'use server';

import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessiblePlayer, getAccessibleTeam, getOwnedTeam } from '@/lib/auth/team-access';
import { ActionError } from '@/lib/actionError';
import { todayKey, shiftDateKey } from '@/lib/dates';
import { buildPlayerMatchDay } from '@/services/matchDay';
import {
  getScheduledMatchesBetween,
  insertScheduledMatch,
  deleteScheduledMatch as repoDeleteScheduledMatch,
} from '@/repositories/scheduledMatchRepository';

const HOUR_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const cleanText = (value, max = 80) => String(value || '').trim().slice(0, max);

/** Línea de tiempo del día de partido del jugador (él mismo o staff con acceso). null si no hay partido. */
export async function getMatchDay(jugadorId) {
  if (!jugadorId) throw new ActionError('Falta jugador');
  const user = await getUser();
  if (!user) throw new ActionError('No autorizado');
  const db = getDb();

  if (user.role === 'jugador') {
    if (String(user.id) !== String(jugadorId)) throw new ActionError('No tienes acceso a este jugador');
  } else if (!(await getAccessiblePlayer(db, user, jugadorId))) {
    throw new ActionError('No tienes acceso a este jugador');
  }

  return buildPlayerMatchDay(db, jugadorId);
}

/** Próximos partidos programados del equipo (desde ayer, para ver el de anoche). */
export async function listScheduledMatches(teamId) {
  const user = await getUser();
  const db = getDb();
  const team = await getAccessibleTeam(db, user, teamId);
  if (!team) throw new ActionError('No tienes acceso a este equipo');
  return getScheduledMatchesBetween(db, team.id, shiftDateKey(todayKey(), -1), null);
}

export async function createScheduledMatch(teamId, payload = {}) {
  const user = await getUser();
  if (user?.role !== 'admin') throw new ActionError('Sin permisos');
  const db = getDb();
  const team = await getOwnedTeam(db, user, teamId);
  if (!team) throw new ActionError('No tienes acceso a este equipo');

  const fecha = String(payload.fecha || '');
  const hora = String(payload.hora || '');
  const today = todayKey();
  if (!DATE_RE.test(fecha) || fecha < shiftDateKey(today, -1) || fecha > shiftDateKey(today, 400)) {
    throw new ActionError('Fecha no válida');
  }
  if (!HOUR_RE.test(hora)) throw new ActionError('Hora no válida (HH:MM)');

  return insertScheduledMatch(db, {
    equipo_id: team.id,
    fecha,
    hora,
    rival: cleanText(payload.rival),
    lugar: cleanText(payload.lugar),
    created_by: user.email || String(user.id),
  });
}

export async function deleteScheduledMatch(teamId, matchId) {
  const user = await getUser();
  if (user?.role !== 'admin') throw new ActionError('Sin permisos');
  const db = getDb();
  const team = await getOwnedTeam(db, user, teamId);
  if (!team) throw new ActionError('No tienes acceso a este equipo');
  await repoDeleteScheduledMatch(db, team.id, matchId);
  return { ok: true };
}
