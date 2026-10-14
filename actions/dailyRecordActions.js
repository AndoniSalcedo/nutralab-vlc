'use server';

import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessiblePlayer } from '@/lib/auth/team-access';
import { getDailyRecord as repoGetDailyRecord, upsertDailyRecord } from '@/repositories/dailyRecordRepository';
import {
  getAllSuplementacionListaItems,
  getJugadorSuplementacion,
  getJugadorSuplementosExtra,
} from '@/repositories/supplementationRepository';
import { todayKey } from '@/lib/dates';

const MAX_DAILY_WATER_ML = 20000;

function toDto(today, record) {
  return {
    ok: true,
    today,
    exists: Boolean(record),
    agua_ml: record?.agua_ml ?? 0,
    suplementos_tomados: record?.suplementos_tomados ?? [],
  };
}

// Suplementos que el jugador tiene pautados: los de su lista asignada + los extra
async function getAssignedSupplementIds(db, jugadorId) {
  const [asignacion, items, extras] = await Promise.all([
    getJugadorSuplementacion(db, jugadorId),
    getAllSuplementacionListaItems(db),
    getJugadorSuplementosExtra(db, jugadorId),
  ]);
  const listaId = Number(asignacion?.lista_id || 0);
  return new Set([
    ...items.filter((item) => Number(item.lista_id) === listaId).map((item) => Number(item.suplemento_id)),
    ...extras.map((extra) => Number(extra.suplemento_id)),
  ]);
}

// Agua y suplementos de hoy (día en Europe/Madrid). El staff con acceso al jugador puede leerlos.
export async function getDailyRecord(jugadorId) {
  if (!jugadorId) throw new Error('Falta jugador_id');

  const db = getDb();
  const user = await getUser();
  if (!user) throw new Error('No autorizado');

  if (user.role === 'jugador') {
    if (String(user.id) !== String(jugadorId)) throw new Error('No tienes acceso a este jugador');
  } else {
    const accessiblePlayer = await getAccessiblePlayer(db, user, jugadorId);
    if (!accessiblePlayer) throw new Error('No tienes acceso a este jugador');
  }

  const today = todayKey();
  return toDto(today, await repoGetDailyRecord(db, jugadorId, today));
}

// Solo el propio jugador registra lo que bebe y toma. Los campos ausentes no se tocan.
export async function saveDailyRecord(payload) {
  const { jugador_id, agua_ml, suplementos_tomados } = payload || {};
  if (!jugador_id) throw new Error('Falta jugador_id');

  const user = await getUser();
  if (!user || user.role !== 'jugador' || String(user.id) !== String(jugador_id)) {
    throw new Error('No autorizado');
  }

  const db = getDb();
  const today = todayKey();
  const recordPayload = {
    jugador_id: Number(jugador_id),
    fecha: today,
    updated_at: new Date().toISOString(),
  };

  if (agua_ml !== undefined) {
    const ml = Number(agua_ml);
    if (!Number.isInteger(ml) || ml < 0 || ml > MAX_DAILY_WATER_ML) throw new Error('Cantidad de agua no válida');
    recordPayload.agua_ml = ml;
  }

  if (suplementos_tomados !== undefined) {
    if (!Array.isArray(suplementos_tomados)) throw new Error('Lista de suplementos no válida');
    const assigned = await getAssignedSupplementIds(db, jugador_id);
    recordPayload.suplementos_tomados = [...new Set(suplementos_tomados.map(Number))].filter((id) => assigned.has(id));
  }

  return toDto(today, await upsertDailyRecord(db, recordPayload));
}
