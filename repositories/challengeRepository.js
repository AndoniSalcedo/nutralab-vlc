import { isMockPlayer, isMockTeam } from '@/config/boneyardMockData';

export async function isChallengeParticipant(db, jugadorId) {
  if (isMockPlayer(jugadorId)) return false;
  const row = await db.retos_participantes.findUnique({ where: { jugador_id: jugadorId }, select: { jugador_id: true } });
  return Boolean(row);
}

export async function joinChallenge(db, jugadorId) {
  return db.retos_participantes.upsert({
    where: { jugador_id: jugadorId },
    update: {},
    create: { jugador_id: jugadorId },
  });
}

export async function leaveChallenge(db, jugadorId) {
  return db.retos_participantes.deleteMany({ where: { jugador_id: jugadorId } });
}

/** Jugadores del equipo que participan en los retos (solo nombre: nunca datos corporales). */
export async function getChallengeParticipants(db, teamId) {
  if (!teamId || isMockTeam(teamId)) return [];
  return db.jugadores.findMany({
    where: { equipo_id: teamId, retos_participantes: { isNot: null } },
    select: { id: true, nombre: true, apellidos: true },
    orderBy: { nombre: 'asc' },
  });
}

/** Registros de la semana de varios jugadores para puntuar el reto. */
export async function getChallengeActivity(db, playerIds, { fromKey, toKey, fromUtc, toUtc }) {
  if (!playerIds.length) return { daily: [], wellness: [], meals: [] };
  const [daily, wellness, meals] = await Promise.all([
    db.registros_diarios.findMany({
      where: { jugador_id: { in: playerIds }, fecha: { gte: fromKey, lte: toKey } },
      select: { jugador_id: true, fecha: true, agua_ml: true, suplementos_tomados: true },
    }),
    db.registros_bienestar.findMany({
      where: { jugador_id: { in: playerIds }, fecha: { gte: fromKey, lte: toKey } },
      select: { jugador_id: true, fecha: true },
    }),
    db.comidas.findMany({
      where: { jugador_id: { in: playerIds }, taken_at: { gte: fromUtc, lt: toUtc } },
      select: { jugador_id: true, taken_at: true },
    }),
  ]);
  return { daily, wellness, meals };
}
