'use server';

import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessiblePlayer, getAccessibleTeam, getOwnedTeam } from '@/lib/auth/team-access';
import { ActionError } from '@/lib/actionError';
import { todayKey, shiftDateKey } from '@/lib/dates';
import { normalizeKickoff } from '@/lib/nutrition/match-kickoff';
import { buildPlayerMatchDay } from '@/services/matchDay';
import { buildTeamMatchDays } from '@/services/teamMatchDays';
import { setTeamKickoff } from '@/repositories/scheduledMatchRepository';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

/** Próximos días de partido del equipo (según los planes de sus jugadores) y su hora fijada. */
export async function listTeamMatchDays(teamId) {
  const user = await getUser();
  const db = getDb();
  const team = await getAccessibleTeam(db, user, teamId);
  if (!team) throw new ActionError('No tienes acceso a este equipo');
  return buildTeamMatchDays(db, team.id);
}

/** Fija la hora exacta del partido de una fecha ('HH:MM'), o la quita con hora vacía. */
export async function setTeamMatchKickoff(teamId, fecha, hora) {
  const user = await getUser();
  if (user?.role !== 'admin') throw new ActionError('Sin permisos');
  const db = getDb();
  const team = await getOwnedTeam(db, user, teamId);
  if (!team) throw new ActionError('No tienes acceso a este equipo');

  const fechaKey = String(fecha || '');
  const today = todayKey();
  if (!DATE_RE.test(fechaKey) || fechaKey < shiftDateKey(today, -1) || fechaKey > shiftDateKey(today, 60)) {
    throw new ActionError('Fecha no válida');
  }
  const horaText = String(hora || '').trim();
  const kickoff = horaText ? normalizeKickoff(horaText) : null;
  if (horaText && !kickoff) throw new ActionError('Hora no válida (HH:MM)');

  await setTeamKickoff(db, { equipo_id: team.id, fecha: fechaKey, hora: kickoff, created_by: user.email || String(user.id) });
  return { fecha: fechaKey, hora: kickoff };
}
