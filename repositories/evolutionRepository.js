
import { mockEvolutions, isMockPlayer } from '@/config/boneyardMockData';
import { selectFields } from '@/lib/db/prisma';

export async function getEvolutionsByPlayerId(db, playerId) {
  if (isMockPlayer(playerId)) {
    return mockEvolutions;
  }

  return db.evoluciones.findMany({
    where: { jugador_id: playerId },
    orderBy: { fecha: 'asc' },
  });
}

export async function getEvolutionsByPlayerIdOrdered(db, playerId) {
  if (isMockPlayer(playerId)) {
    return mockEvolutions;
  }

  return db.evoluciones.findMany({
    where: { jugador_id: playerId },
    orderBy: { fecha: 'asc' },
  });
}

export async function getEvolutionsByPlayerIdsSimple(db, playerIds) {
  if (!playerIds || playerIds.length === 0) return [];
  if (Array.isArray(playerIds) && playerIds.every(isMockPlayer)) {
    return mockEvolutions;
  }

  return db.evoluciones.findMany({
    where: { jugador_id: { in: playerIds } },
    select: selectFields('jugador_id,fecha,peso_kg,porcentaje_grasa,peso_magro'),
  });
}

export async function getEvolutionsByPlayerIds(db, playerIds) {
  if (!playerIds || playerIds.length === 0) return [];
  if (Array.isArray(playerIds) && playerIds.every(isMockPlayer)) {
    return mockEvolutions;
  }

  return db.evoluciones.findMany({
    where: { jugador_id: { in: playerIds } },
    orderBy: { fecha: 'asc' },
  });
}

export async function getEvolutionById(db, id) {
  return db.evoluciones.findUnique({
    where: { id },
    select: { id: true, jugador_id: true },
  });
}

export async function updateEvolution(db, id, payload) {
  return db.evoluciones.update({ where: { id }, data: payload });
}

export async function upsertEvolution(db, payload) {
  return db.evoluciones.upsert({
    where: { jugador_id_fecha: { jugador_id: payload.jugador_id, fecha: payload.fecha } },
    create: payload,
    update: payload,
  });
}

export async function insertEvolutionsBulk(db, payloads) {
  if (!payloads?.length) return [];
  return db.evoluciones.createManyAndReturn({ data: payloads });
}

export async function deleteEvolution(db, id) {
  await db.evoluciones.deleteMany({ where: { id } });
  return true;
}

export async function getEvolutionByPlayerAndDate(db, playerId, date) {
  return db.evoluciones.findUnique({
    where: { jugador_id_fecha: { jugador_id: playerId, fecha: date } },
  });
}

export async function insertEvolution(db, payload) {
  return db.evoluciones.create({ data: payload });
}
