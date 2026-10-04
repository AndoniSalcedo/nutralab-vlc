import { mockAnalytics, isMockPlayer } from '@/config/boneyardMockData';

export async function getAnalyticsByPlayerId(db, playerId) {
  if (isMockPlayer(playerId)) {
    return mockAnalytics;
  }

  return db.analiticas.findMany({
    where: { jugador_id: playerId },
    orderBy: { fecha_extraccion: { sort: 'desc', nulls: 'first' } },
  });
}

export async function getAnalyticsByPlayerIds(db, playerIds) {
  if (!playerIds || playerIds.length === 0) return [];
  if (Array.isArray(playerIds) && playerIds.every(isMockPlayer)) {
    return mockAnalytics;
  }

  return db.analiticas.findMany({
    where: { jugador_id: { in: playerIds } },
    orderBy: { fecha_extraccion: { sort: 'desc', nulls: 'first' } },
  });
}

export async function getAnalyticsById(db, id) {
  return db.analiticas.findUnique({
    where: { id },
    select: { id: true, jugador_id: true },
  });
}

export async function insertAnalytics(db, payload) {
  return db.analiticas.create({ data: payload });
}

export async function updateAnalyticsVisibility(db, id, visible_para_jugador) {
  return db.analiticas.update({ where: { id }, data: { visible_para_jugador } });
}

export async function deleteAnalytics(db, id) {
  await db.analiticas.deleteMany({ where: { id } });
  return true;
}

export async function insertAnalyticsBulk(db, payloads) {
  if (!payloads?.length) return [];
  return db.analiticas.createManyAndReturn({ data: payloads });
}
