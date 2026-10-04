import { mockPesajes, isMockPlayer } from '@/config/boneyardMockData';
import { selectFields } from '@/lib/db/prisma';

export async function getPesajesByPlayerId(db, playerId) {
  if (isMockPlayer(playerId)) {
    return mockPesajes;
  }

  return db.pesajes.findMany({
    where: { jugador_id: playerId },
    orderBy: { fecha: 'asc' },
  });
}

export async function getPesajesByPlayerIdsSimple(db, playerIds) {
  if (!playerIds || playerIds.length === 0) return [];
  if (Array.isArray(playerIds) && playerIds.every(isMockPlayer)) {
    return mockPesajes;
  }

  return db.pesajes.findMany({
    where: { jugador_id: { in: playerIds } },
    select: selectFields('id,jugador_id,fecha,peso_kg'),
    orderBy: { fecha: 'asc' },
  });
}

export async function getPesajesByPlayerIds(db, playerIds) {
  if (!playerIds || playerIds.length === 0) return [];
  if (Array.isArray(playerIds) && playerIds.every(isMockPlayer)) {
    return mockPesajes;
  }

  return db.pesajes.findMany({
    where: { jugador_id: { in: playerIds } },
    orderBy: { fecha: 'asc' },
  });
}

export async function getPesajeById(db, id) {
  return db.pesajes.findUnique({
    where: { id },
    select: { id: true, jugador_id: true },
  });
}

export async function updatePesaje(db, id, payload) {
  return db.pesajes.update({ where: { id }, data: payload });
}

export async function upsertPesaje(db, payload) {
  return db.pesajes.upsert({
    where: { jugador_id_fecha: { jugador_id: payload.jugador_id, fecha: payload.fecha } },
    create: payload,
    update: payload,
  });
}

export async function deletePesaje(db, id) {
  await db.pesajes.deleteMany({ where: { id } });
  return true;
}
