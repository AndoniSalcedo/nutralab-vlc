import { isMockTeam } from '@/config/boneyardMockData';

const FIELDS = { id: true, equipo_id: true, fecha: true, hora: true, rival: true, lugar: true };

/** Partidos programados del equipo entre dos días ('YYYY-MM-DD', ambos incluidos), en orden. */
export async function getScheduledMatchesBetween(db, teamId, fromKey, toKey) {
  if (!teamId || isMockTeam(teamId)) return [];
  return db.partidos_programados.findMany({
    where: { equipo_id: teamId, fecha: { gte: fromKey, ...(toKey ? { lte: toKey } : {}) } },
    select: FIELDS,
    orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
  });
}

export async function insertScheduledMatch(db, data) {
  return db.partidos_programados.create({ data, select: FIELDS });
}

export async function deleteScheduledMatch(db, teamId, id) {
  return db.partidos_programados.deleteMany({ where: { id, equipo_id: teamId } });
}
