import { isMockPlayer } from '@/config/boneyardMockData';

export async function getWellnessRecordsByPlayerId(db, playerId, { from } = {}) {
  if (isMockPlayer(playerId)) return [];

  return db.registros_bienestar.findMany({
    where: from ? { jugador_id: playerId, fecha: { gte: from } } : { jugador_id: playerId },
    orderBy: { fecha: 'asc' },
  });
}

export async function upsertWellnessRecord(db, payload) {
  return db.registros_bienestar.upsert({
    where: { jugador_id_fecha: { jugador_id: payload.jugador_id, fecha: payload.fecha } },
    create: payload,
    update: payload,
  });
}
