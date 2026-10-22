'use server';

import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessiblePlayer } from '@/lib/auth/team-access';
import { ActionError } from '@/lib/actionError';
import { isChallengeParticipant, joinChallenge, leaveChallenge } from '@/repositories/challengeRepository';
import { buildTeamChallenge } from '@/services/challenges';

/**
 * Reto semanal del equipo visto desde un jugador (él mismo o staff con acceso).
 * Al jugador que no participa solo se le muestra cuántos compañeros hay apuntados.
 */
export async function getTeamChallenge(jugadorId) {
  if (!jugadorId) throw new ActionError('Falta jugador');
  const user = await getUser();
  if (!user) throw new ActionError('No autorizado');
  const db = getDb();

  let jugador;
  if (user.role === 'jugador') {
    if (String(user.id) !== String(jugadorId)) throw new ActionError('No tienes acceso a este jugador');
    jugador = await db.jugadores.findUnique({ where: { id: jugadorId }, select: { id: true, equipo_id: true } });
  } else {
    jugador = await getAccessiblePlayer(db, user, jugadorId);
  }
  if (!jugador) throw new ActionError('No tienes acceso a este jugador');
  if (!jugador.equipo_id) return null;

  const [joined, challenge] = await Promise.all([
    isChallengeParticipant(db, jugadorId),
    buildTeamChallenge(db, jugador.equipo_id),
  ]);
  const isPlayer = user.role === 'jugador';
  return {
    joined,
    isPlayer,
    participants: challenge.ranking.length,
    week: challenge.week,
    maxPoints: challenge.maxPoints,
    // Un jugador que no participa no ve el ranking de los demás
    ranking: !isPlayer || joined ? challenge.ranking : [],
  };
}

export async function setChallengeParticipation(join) {
  const user = await getUser();
  if (!user || user.role !== 'jugador') throw new ActionError('No autorizado');
  const db = getDb();
  if (join) await joinChallenge(db, user.id);
  else await leaveChallenge(db, user.id);
  return { joined: Boolean(join) };
}
