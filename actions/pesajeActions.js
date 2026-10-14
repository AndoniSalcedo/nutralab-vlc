'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer } from '@/lib/auth/team-access';
import {
  getPesajeById,
  updatePesaje,
  upsertPesaje,
  deletePesaje as deletePesajeInRepo
} from '@/repositories/pesajeRepository';
import { ActionError } from '@/lib/actionError';


export async function savePesaje(body) {
  const { id, jugador_id, fecha, peso_kg } = body || {};
  if (!jugador_id || !fecha || peso_kg === undefined) {
    throw new ActionError('Faltan datos obligatorios');
  }

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new ActionError('No autorizado');
  }

  const ownedPlayer = await getOwnedPlayer(db, user, jugador_id);
  if (!ownedPlayer) throw new ActionError('No tienes acceso a este jugador');

  let data;
  if (id) {
    const existing = await getPesajeById(db, id);
    if (!existing || String(existing.jugador_id) !== String(jugador_id)) {
      throw new ActionError('Registro de peso no encontrado');
    }
    data = await updatePesaje(db, id, { fecha, peso_kg });
  } else {
    data = await upsertPesaje(db, {
      jugador_id,
      fecha,
      peso_kg
    });
  }

  revalidatePath(`/dashboard/jugador/${jugador_id}`);
  if (ownedPlayer?.equipo_id) {
    revalidatePath(`/dashboard/equipo/${ownedPlayer.equipo_id}`);
  }
  revalidatePath('/dashboard');
  return { ok: true, pesaje: data };
}

export async function deletePesaje(id) {
  if (!id) throw new ActionError('Falta id del registro de peso');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new ActionError('No autorizado');
  }

  const pesaje = await getPesajeById(db, id);
  if (!pesaje) throw new ActionError('Registro de peso no encontrado');

  const ownedPlayer = await getOwnedPlayer(db, user, pesaje.jugador_id);
  if (!ownedPlayer) throw new ActionError('No tienes acceso a este jugador');

  await deletePesajeInRepo(db, id);
  revalidatePath(`/dashboard/jugador/${pesaje.jugador_id}`);
  if (ownedPlayer?.equipo_id) {
    revalidatePath(`/dashboard/equipo/${ownedPlayer.equipo_id}`);
  }
  revalidatePath('/dashboard');
  return { ok: true };
}
