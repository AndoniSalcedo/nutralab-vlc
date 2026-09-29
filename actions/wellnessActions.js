'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer, getAccessiblePlayer } from '@/lib/auth/team-access';
import { WELLNESS_KEYS, WELLNESS_AVERAGE_DAYS } from '@/config/wellness';
import { getWellnessRecordsByPlayerId, upsertWellnessRecord } from '@/repositories/wellnessRepository';

const DEFAULT_TZ = 'Europe/Madrid';

function todayStr() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: DEFAULT_TZ });
}

function shiftDate(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseScore(value, key) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    throw new Error(`Valor no válido para ${key} (debe ser 1-5)`);
  }
  return num;
}

export async function getWellnessRecords(jugadorId) {
  if (!jugadorId) throw new Error('Falta jugador_id');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user) throw new Error('No autorizado');

  if (user.role === 'jugador') {
    if (String(user.id) !== String(jugadorId)) throw new Error('No tienes acceso a este jugador');
  } else {
    const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
    if (!accessiblePlayer) throw new Error('No tienes acceso a este jugador');
  }

  const today = todayStr();
  const records = await getWellnessRecordsByPlayerId(supabase, jugadorId, {
    from: shiftDate(today, -WELLNESS_AVERAGE_DAYS),
  });
  return { ok: true, today, records };
}

export async function saveWellnessRecord(payload) {
  const { jugador_id, fecha, molestia, molestia_detalle } = payload || {};
  if (!jugador_id) throw new Error('Falta jugador_id');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'tecnico') throw new Error('No autorizado');

  if (user.role === 'jugador') {
    if (String(user.id) !== String(jugador_id)) throw new Error('No tienes acceso a este jugador');
  } else {
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador_id);
    if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');
  }

  const recordDate = fecha ? String(fecha) : todayStr();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate) || Number.isNaN(Date.parse(`${recordDate}T12:00:00Z`))) {
    throw new Error('Fecha no válida');
  }
  // Los registros son del día: no se permiten fechas futuras ni muy antiguas.
  const today = todayStr();
  if (recordDate > today || recordDate < shiftDate(today, -WELLNESS_AVERAGE_DAYS)) {
    throw new Error('La fecha del registro está fuera del rango permitido');
  }

  const hasMolestia = molestia === true;
  const detalle = String(molestia_detalle || '').trim();
  if (hasMolestia && !detalle) throw new Error('Indica dónde y qué intensidad tiene la molestia');

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

  const record = await upsertWellnessRecord(supabase, recordPayload);
  revalidatePath(`/dashboard/jugador/${jugador_id}`);
  return { ok: true, record };
}
