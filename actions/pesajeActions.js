'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer } from '@/lib/auth/team-access';
import {
  getPesajeById,
  updatePesaje,
  upsertPesaje,
  deletePesaje as deletePesajeInRepo
} from '@/repositories/pesajeRepository';


export async function savePesaje(body) {
  const { id, jugador_id, fecha, peso_kg } = body || {};
  if (!jugador_id || !fecha || peso_kg === undefined) {
    throw new Error('Faltan datos obligatorios');
  }

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const ownedPlayer = await getOwnedPlayer(supabase, user, jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  let data;
  if (id) {
    data = await updatePesaje(supabase, id, { fecha, peso_kg });
  } else {
    data = await upsertPesaje(supabase, {
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
  if (!id) throw new Error('Falta id del registro de peso');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const pesaje = await getPesajeById(supabase, id);
  if (!pesaje) throw new Error('Registro de peso no encontrado');

  const ownedPlayer = await getOwnedPlayer(supabase, user, pesaje.jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  await deletePesajeInRepo(supabase, id);
  revalidatePath(`/dashboard/jugador/${pesaje.jugador_id}`);
  if (ownedPlayer?.equipo_id) {
    revalidatePath(`/dashboard/equipo/${ownedPlayer.equipo_id}`);
  }
  revalidatePath('/dashboard');
  return { ok: true };
}
