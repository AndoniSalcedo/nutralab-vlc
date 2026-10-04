import { resolvePlayerSupplementsData } from '@/lib/nutrition/supplementation';
import { upsertMany } from '@/lib/db/prisma';

const byJugador = (row) => ({ jugador_id: row.jugador_id });
const byJugadorSuplemento = (row) => ({
  jugador_id_suplemento_id: { jugador_id: row.jugador_id, suplemento_id: row.suplemento_id },
});

export async function getAllSuplementos(db) {
  return db.suplementos.findMany({ orderBy: { nombre: 'asc' } });
}

export async function getAllSuplementacionListas(db) {
  return db.suplementacion_listas.findMany({ orderBy: { orden: 'asc' } });
}

export async function getAllSuplementacionListaItems(db) {
  return db.suplementacion_lista_items.findMany({ orderBy: { orden: 'asc' } });
}

export async function getJugadorSuplementacion(db, jugadorId) {
  return db.jugador_suplementacion.findUnique({ where: { jugador_id: jugadorId } });
}

export async function getJugadorSuplementosExtra(db, jugadorId) {
  return db.jugador_suplementos_extra.findMany({
    where: { jugador_id: jugadorId },
    orderBy: { created_at: 'asc' },
  });
}

export async function getJugadorSuplementacionByPlayers(db, playerIds) {
  return db.jugador_suplementacion.findMany({ where: { jugador_id: { in: playerIds } } });
}

export async function getJugadorSuplementosExtraByPlayers(db, playerIds) {
  return db.jugador_suplementos_extra.findMany({ where: { jugador_id: { in: playerIds } } });
}

export async function getSuplementacionHistorialByPlayers(db, playerIds) {
  return db.jugador_suplementacion_historial.findMany({
    where: { jugador_id: { in: playerIds } },
    select: { id: true, jugador_id: true, lista_id: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
}

export async function upsertJugadorSuplementacion(db, payload) {
  return db.jugador_suplementacion.upsert({ where: byJugador(payload), create: payload, update: payload });
}

export async function upsertJugadorSuplementacionBulk(db, payloads) {
  return upsertMany(db, 'jugador_suplementacion', payloads, byJugador);
}

export async function upsertJugadorSuplementosExtra(db, payload) {
  return db.jugador_suplementos_extra.upsert({ where: byJugadorSuplemento(payload), create: payload, update: payload });
}

export async function upsertJugadorSuplementosExtraBulk(db, payloads) {
  return upsertMany(db, 'jugador_suplementos_extra', payloads, byJugadorSuplemento);
}

export async function deleteJugadorSuplementosExtra(db, extraId, jugadorId) {
  await db.jugador_suplementos_extra.deleteMany({ where: { id: extraId, jugador_id: jugadorId } });
  return true;
}

export async function upsertSuplemento(db, payload) {
  return db.suplementos.upsert({ where: { slug: payload.slug }, create: payload, update: payload });
}

export async function updateSuplemento(db, id, payload) {
  return db.suplementos.update({ where: { id }, data: payload });
}

export async function deleteSuplemento(db, id) {
  await db.suplementos.deleteMany({ where: { id } });
  return true;
}

export async function deleteSuplementacionLista(db, id) {
  await db.suplementacion_listas.deleteMany({ where: { id } });
  return true;
}

export async function upsertSuplementacionLista(db, payload) {
  return db.suplementacion_listas.upsert({ where: { slug: payload.slug }, create: payload, update: payload });
}

export async function getSuplementacionListaItemsByList(db, listaId) {
  return db.suplementacion_lista_items.findMany({
    where: { lista_id: listaId },
    select: { orden: true },
    orderBy: { orden: 'desc' },
    take: 1,
  });
}

export async function upsertSuplementacionListaItem(db, payload) {
  return db.suplementacion_lista_items.upsert({
    where: { lista_id_suplemento_id: { lista_id: payload.lista_id, suplemento_id: payload.suplemento_id } },
    create: payload,
    update: payload,
  });
}

export async function deleteSuplementacionListaItem(db, itemId) {
  await db.suplementacion_lista_items.deleteMany({ where: { id: itemId } });
  return true;
}

export async function nextListOrder(db) {
  const data = await db.suplementacion_listas.findMany({
    select: { orden: true },
    orderBy: { orden: 'desc' },
    take: 1,
  });
  return Number(data?.[0]?.orden || 0) + 1;
}

export async function getResolvedPlayerSupplementation(db, jugadorId, pesoKg = null) {
  if (!jugadorId) return [];
  const [
    suplementos,
    listas,
    items,
    asignacion,
    extras,
  ] = await Promise.all([
    getAllSuplementos(db),
    getAllSuplementacionListas(db),
    getAllSuplementacionListaItems(db),
    getJugadorSuplementacion(db, jugadorId),
    getJugadorSuplementosExtra(db, jugadorId),
  ]);

  return resolvePlayerSupplementsData({
    suplementos,
    listas,
    items,
    asignacion,
    extras,
    peso: pesoKg,
  });
}

