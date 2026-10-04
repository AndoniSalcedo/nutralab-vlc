import { mockHydration, isMockPlayer } from '@/config/boneyardMockData';
import { upsertMany } from '@/lib/db/prisma';

// `tipo` tiene valor por defecto en la tabla ('sosm'); la clave única lo incluye.
const byJugadorFechaTipo = (row) => ({
  jugador_id_fecha_tipo: { jugador_id: row.jugador_id, fecha: row.fecha, tipo: row.tipo ?? 'sosm' },
});

export async function getHydrationRecordsByPlayerId(db, playerId) {
  if (isMockPlayer(playerId)) {
    return mockHydration;
  }

  return db.registros_hidratacion.findMany({
    where: { jugador_id: playerId },
    orderBy: { fecha: 'asc' },
  });
}

export async function upsertHydrationRecords(db, records) {
  return upsertMany(db, 'registros_hidratacion', records, byJugadorFechaTipo);
}

export async function updateHydrationRecord(db, id, jugadorId, payload) {
  return db.registros_hidratacion.update({
    where: { id, jugador_id: jugadorId },
    data: payload,
  });
}

export async function upsertHydrationRecord(db, payload) {
  return db.registros_hidratacion.upsert({
    where: byJugadorFechaTipo(payload),
    create: payload,
    update: payload,
  });
}

export async function getHydrationRecordById(db, id) {
  return db.registros_hidratacion.findUniqueOrThrow({
    where: { id },
    select: { jugador_id: true },
  });
}

export async function deleteHydrationRecord(db, id) {
  await db.registros_hidratacion.deleteMany({ where: { id } });
  return true;
}

export async function insertHydrationRecordsBulk(db, records) {
  if (!records?.length) return [];
  return db.registros_hidratacion.createManyAndReturn({ data: records });
}
