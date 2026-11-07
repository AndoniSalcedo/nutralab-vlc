'use server';

import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessiblePlayer } from '@/lib/auth/team-access';
import { ActionError } from '@/lib/actionError';
import { buildPlayerMatchDay } from '@/services/matchDay';

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
