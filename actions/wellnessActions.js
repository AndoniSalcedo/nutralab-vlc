'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer, getAccessiblePlayer } from '@/lib/auth/team-access';
import { WELLNESS_KEYS, WELLNESS_AVERAGE_DAYS } from '@/config/wellness';
import { getWellnessRecordsByPlayerId, upsertWellnessRecord } from '@/repositories/wellnessRepository';
import { todayKey, shiftDateKey } from '@/lib/dates';
import { ActionError } from '@/lib/actionError';

function parseScore(value, key) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    throw new ActionError(`Valor no válido para ${key} (debe ser 1-5)`);
  }
  return num;
}

export async function getWellnessRecords(jugadorId) {
  if (!jugadorId) throw new ActionError('Falta jugador_id');

  const db = getDb();
  const user = await getUser();
  if (!user) throw new ActionError('No autorizado');

  if (user.role === 'jugador') {
    if (String(user.id) !== String(jugadorId)) throw new ActionError('No tienes acceso a este jugador');
  } else {
    const accessiblePlayer = await getAccessiblePlayer(db, user, jugadorId);
    if (!accessiblePlayer) throw new ActionError('No tienes acceso a este jugador');
  }

  const today = todayKey();
  const records = await getWellnessRecordsByPlayerId(db, jugadorId, {
    from: shiftDateKey(today, -WELLNESS_AVERAGE_DAYS),
  });
  return { ok: true, today, records };
}

export async function saveWellnessRecord(payload) {
  const { jugador_id, fecha, molestia, molestia_detalle } = payload || {};
  if (!jugador_id) throw new ActionError('Falta jugador_id');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'tecnico') throw new ActionError('No autorizado');

  if (user.role === 'jugador') {
    if (String(user.id) !== String(jugador_id)) throw new ActionError('No tienes acceso a este jugador');
  } else {
    const ownedPlayer = await getOwnedPlayer(db, user, jugador_id);
    if (!ownedPlayer) throw new ActionError('No tienes acceso a este jugador');
  }

  const recordDate = fecha ? String(fecha) : todayKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate) || Number.isNaN(Date.parse(`${recordDate}T12:00:00Z`))) {
    throw new ActionError('Fecha no válida');
  }
  // Los registros son del día: no se permiten fechas futuras ni muy antiguas.
  const today = todayKey();
  if (recordDate > today || recordDate < shiftDateKey(today, -WELLNESS_AVERAGE_DAYS)) {
    throw new ActionError('La fecha del registro está fuera del rango permitido');
  }

  const hasMolestia = molestia === true;
  const detalle = String(molestia_detalle || '').trim();
  if (hasMolestia && !detalle) throw new ActionError('Indica dónde y qué intensidad tiene la molestia');

  const recordPayload = {
    jugador_id: Number(jugador_id),
    fecha: recordDate,
    molestia: hasMolestia,
    molestia_detalle: hasMolestia ? detalle.slice(0, 280) : null,
    created_by: String(user.id || ''),
    updated_at: new Date().toISOString(),
  };
  WELLNESS_KEYS.forEach((key) => {
    recordPayload[key] = parseScore(payload[key], key);
  });

  const record = await upsertWellnessRecord(db, recordPayload);
  revalidatePath(`/dashboard/jugador/${jugador_id}`);
  return { ok: true, record };
}
