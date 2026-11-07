import { isMockTeam } from '@/config/boneyardMockData';

// Hora exacta de inicio de los partidos del equipo, una por fecha. Qué jugadores juegan ese día
// lo dicen sus planes; esta tabla solo guarda la hora (rival y lugar quedan opcionales).
const FIELDS = { id: true, equipo_id: true, fecha: true, hora: true, rival: true, lugar: true };

/** Horas fijadas del equipo entre dos días ('YYYY-MM-DD', ambos incluidos), en orden. */
export async function getTeamKickoffsBetween(db, teamId, fromKey, toKey) {
  if (!teamId || isMockTeam(teamId)) return [];
  return db.partidos_programados.findMany({
    where: { equipo_id: teamId, fecha: { gte: fromKey, lte: toKey } },
    select: FIELDS,
    orderBy: [{ fecha: 'asc' }, { created_at: 'desc' }],
  });
}

/** Fija (o borra, con hora null) la hora del partido del equipo en una fecha. */
export async function setTeamKickoff(db, { equipo_id, fecha, hora, created_by }) {
  return db.$transaction(async (tx) => {
    await tx.partidos_programados.deleteMany({ where: { equipo_id, fecha } });
    if (!hora) return null;
    return tx.partidos_programados.create({ data: { equipo_id, fecha, hora, created_by }, select: FIELDS });
  });
}
