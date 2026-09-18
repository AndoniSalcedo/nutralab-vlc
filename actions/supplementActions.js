'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getAccessiblePlayer, getOwnedTeam } from '@/lib/auth/team-access';
import { cleanText, toPositiveNumber, slugify as sharedSlugify } from '@/lib/utils';
import { getPlayersByTeam, getPlayersByTeamIds } from '@/repositories/playerRepository';
import {
  getAllSuplementos,
  getAllSuplementacionListas,
  getAllSuplementacionListaItems,
  getJugadorSuplementacion,
  getJugadorSuplementosExtra,
  upsertJugadorSuplementacion,
  upsertJugadorSuplementosExtra,
  deleteJugadorSuplementosExtra,
  upsertSuplemento,
  updateSuplemento,
  deleteSuplemento,
  deleteSuplementacionLista,
  upsertSuplementacionLista,
  getSuplementacionListaItemsByList,
  upsertSuplementacionListaItem,
  deleteSuplementacionListaItem,
  upsertJugadorSuplementacionBulk,
  upsertJugadorSuplementosExtraBulk,
  nextListOrder
} from '@/repositories/supplementationRepository';

const slugify = (value) => sharedSlugify(value).slice(0, 80);

function canManage(user) {
  return user && user.role !== 'jugador';
}

export async function getPlayerSupplementation(requestedJugadorId) {
  const user = await getUser();
  if (!user) throw new Error('No autenticado');

  const requested = toPositiveNumber(requestedJugadorId);
  const jugadorId = user?.role === 'jugador' ? toPositiveNumber(user.id) : requested;

  if (!jugadorId) throw new Error('Falta jugador_id');
  if (user?.role === 'jugador' && String(user.id) !== String(jugadorId)) {
    throw new Error('Sin permisos');
  }

  const supabase = getSupabaseAdmin();
  if (user?.role !== 'jugador') {
    const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
    if (!accessiblePlayer) throw new Error('Sin permisos');
  }

  const [
    suplementos,
    listas,
    items,
    asignacion,
    extras,
  ] = await Promise.all([
    getAllSuplementos(supabase),
    getAllSuplementacionListas(supabase),
    getAllSuplementacionListaItems(supabase),
    getJugadorSuplementacion(supabase, jugadorId),
    getJugadorSuplementosExtra(supabase, jugadorId),
  ]);

  return {
    suplementos,
    listas,
    items,
    asignacion,
    extras,
    canManage: canManage(user) && user?.role !== 'tecnico',
  };
}

export async function postPlayerSupplementation(jugadorIdParam, payload) {
  const user = await getUser();
  if (!canManage(user) || user?.role === 'tecnico') {
    throw new Error('Sin permisos');
  }

  const action = cleanText(payload?.action);
  const jugadorId = toPositiveNumber(payload?.jugador_id || jugadorIdParam);
  const supabase = getSupabaseAdmin();

  if (!jugadorId) throw new Error('Falta jugador_id');

  const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
  if (!accessiblePlayer) throw new Error('Sin permisos');

  if (action === 'set_list') {
    const listaId = toPositiveNumber(payload.lista_id);
    const data = await upsertJugadorSuplementacion(supabase, {
      jugador_id: jugadorId,
      lista_id: listaId,
      updated_at: new Date().toISOString(),
    });
    revalidatePath(`/dashboard/jugador/${jugadorId}`);
    return { asignacion: data };
  }

  if (action === 'add_extra') {
    const suplementoId = toPositiveNumber(payload.suplemento_id);
    if (!suplementoId) throw new Error('Falta suplemento_id');

    const data = await upsertJugadorSuplementosExtra(supabase, {
      jugador_id: jugadorId,
      suplemento_id: suplementoId,
      dose_override: cleanText(payload.dose_override) || null,
      timing_override: cleanText(payload.timing_override) || null,
      note_override: cleanText(payload.note_override) || null,
      updated_at: new Date().toISOString(),
    });
    revalidatePath(`/dashboard/jugador/${jugadorId}`);
    return { extra: data };
  }

  if (action === 'delete_extra') {
    const extraId = toPositiveNumber(payload.extra_id);
    if (!extraId) throw new Error('Falta extra_id');

    await deleteJugadorSuplementosExtra(supabase, extraId, jugadorId);
    revalidatePath(`/dashboard/jugador/${jugadorId}`);
    return { ok: true };
  }

  throw new Error('Acción no soportada');
}

export async function getSupplementationCatalog() {
  const user = await getUser();
  if (!user || user.role === 'jugador') {
    throw new Error('Sin permisos');
  }

  const supabase = getSupabaseAdmin();
  const [suplementos, listas, items] = await Promise.all([
    getAllSuplementos(supabase),
    getAllSuplementacionListas(supabase),
    getAllSuplementacionListaItems(supabase),
  ]);

  return {
    suplementos,
    listas,
    items,
  };
}

export async function updateSupplementationCatalog(payload) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Sin permisos');
  }

  const action = cleanText(payload?.action);
  const supabase = getSupabaseAdmin();

  if (action === 'create_supplement') {
    const nombre = cleanText(payload.nombre);
    if (!nombre) throw new Error('El nombre del suplemento es obligatorio');

    const slug = slugify(payload.slug || nombre);
    const doseType = payload.dose_type === 'per_kg_range' ? 'per_kg_range' : 'custom';
    const body = {
      slug,
      nombre,
      categoria: cleanText(payload.categoria) || 'Custom',
      descripcion: cleanText(payload.descripcion) || null,
      pauta: cleanText(payload.pauta) || 'Según producto.',
      timing: cleanText(payload.timing) || 'Según pauta',
      dose_type: doseType,
      dose_min: doseType === 'per_kg_range' ? toPositiveNumber(payload.dose_min) : null,
      dose_max: doseType === 'per_kg_range' ? toPositiveNumber(payload.dose_max) : null,
      dose_unit: doseType === 'per_kg_range' ? (cleanText(payload.dose_unit) || null) : null,
      dose_text: cleanText(payload.dose_text || payload.pauta) || 'Según producto',
      notas: cleanText(payload.notas) || null,
      updated_at: new Date().toISOString(),
    };

    const data = await upsertSuplemento(supabase, body);
    revalidatePath('/dashboard');
    return { suplemento: data };
  }

  if (action === 'update_supplement') {
    const id = toPositiveNumber(payload.id);
    if (!id) throw new Error('ID de suplemento no válido');

    const nombre = cleanText(payload.nombre);
    if (!nombre) throw new Error('El nombre del suplemento es obligatorio');

    const doseType = payload.dose_type === 'per_kg_range' ? 'per_kg_range' : 'custom';
    const body = {
      nombre,
      categoria: cleanText(payload.categoria) || 'Custom',
      descripcion: cleanText(payload.descripcion) || null,
      pauta: cleanText(payload.pauta) || 'Según producto.',
      timing: cleanText(payload.timing) || 'Según pauta',
      dose_type: doseType,
      dose_min: doseType === 'per_kg_range' ? toPositiveNumber(payload.dose_min) : null,
      dose_max: doseType === 'per_kg_range' ? toPositiveNumber(payload.dose_max) : null,
      dose_unit: doseType === 'per_kg_range' ? (cleanText(payload.dose_unit) || null) : null,
      dose_text: cleanText(payload.dose_text || payload.pauta) || 'Según producto',
      notas: cleanText(payload.notas) || null,
      updated_at: new Date().toISOString(),
    };

    const data = await updateSuplemento(supabase, id, body);
    revalidatePath('/dashboard');
    return { suplemento: data };
  }

  if (action === 'delete_supplement') {
    const id = toPositiveNumber(payload.id);
    if (!id) throw new Error('ID de suplemento no válido');

    await deleteSuplemento(supabase, id);
    revalidatePath('/dashboard');
    return { ok: true };
  }

  if (action === 'delete_list') {
    const id = toPositiveNumber(payload.id);
    if (!id) throw new Error('ID de catálogo no válido');

    await deleteSuplementacionLista(supabase, id);
    revalidatePath('/dashboard');
    return { ok: true };
  }

  if (action === 'create_list') {
    const nombre = cleanText(payload.nombre);
    if (!nombre) throw new Error('El nombre del catálogo es obligatorio');

    const slug = slugify(payload.slug || nombre);
    const body = {
      slug,
      nombre,
      orden: toPositiveNumber(payload.orden) || await nextListOrder(supabase),
      descripcion: cleanText(payload.descripcion) || null,
      updated_at: new Date().toISOString(),
    };

    const data = await upsertSuplementacionLista(supabase, body);
    revalidatePath('/dashboard');
    return { lista: data };
  }

  if (action === 'add_item') {
    const listaId = toPositiveNumber(payload.lista_id);
    const suplementoId = toPositiveNumber(payload.suplemento_id);
    if (!listaId || !suplementoId) throw new Error('Falta catálogo o suplemento');

    const existing = await getSuplementacionListaItemsByList(supabase, listaId);
    const body = {
      lista_id: listaId,
      suplemento_id: suplementoId,
      orden: Number(existing?.[0]?.orden || 0) + 1,
      notas: cleanText(payload.notas) || null,
    };

    const data = await upsertSuplementacionListaItem(supabase, body);
    revalidatePath('/dashboard');
    return { item: data };
  }

  if (action === 'remove_item') {
    const itemId = toPositiveNumber(payload.item_id);
    if (!itemId) throw new Error('Falta item_id');

    await deleteSuplementacionListaItem(supabase, itemId);
    revalidatePath('/dashboard');
    return { ok: true };
  }

  if (action === 'assign_all') {
    const listaId = toPositiveNumber(payload.lista_id);
    const team = await getOwnedTeam(supabase, user, payload.team_id);
    if (!listaId) throw new Error('Selecciona un catálogo');
    if (!team) throw new Error('No tienes acceso a este equipo');

    const players = await getPlayersByTeam(supabase, team.id);
    const rows = (players || []).map((player) => ({
      jugador_id: player.id,
      lista_id: listaId,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length) {
      await upsertJugadorSuplementacionBulk(supabase, rows);
    }
    revalidatePath(`/dashboard/equipo/${team.id}`);
    return { ok: true, assigned: rows.length };
  }

  if (action === 'assign_to_players') {
    const listaId = toPositiveNumber(payload.lista_id);
    const jugadorIds = Array.isArray(payload.jugadorIds)
      ? payload.jugadorIds.map(Number).filter(Number.isFinite)
      : [];

    if (!listaId) throw new Error('Selecciona un catálogo');
    if (!jugadorIds.length) throw new Error('Debes seleccionar al menos un jugador');

    const team = await getOwnedTeam(supabase, user, payload.team_id);
    if (!team) throw new Error('No tienes acceso a este equipo');

    const teamPlayers = await getPlayersByTeamIds(supabase, team.id, jugadorIds);
    const rows = (teamPlayers || []).map((player) => ({
      jugador_id: player.id,
      lista_id: listaId,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length) {
      await upsertJugadorSuplementacionBulk(supabase, rows);
    }
    revalidatePath(`/dashboard/equipo/${team.id}`);
    return { ok: true, assigned: rows.length };
  }

  if (action === 'assign_extra_to_players') {
    const suplementoIds = Array.isArray(payload.suplementoIds)
      ? payload.suplementoIds.map(Number).filter(Number.isFinite)
      : [];
    const jugadorIds = Array.isArray(payload.jugadorIds)
      ? payload.jugadorIds.map(Number).filter(Number.isFinite)
      : [];

    if (!suplementoIds.length) throw new Error('Selecciona al menos un suplemento');
    if (!jugadorIds.length) throw new Error('Debes seleccionar al menos un jugador');

    const team = await getOwnedTeam(supabase, user, payload.team_id);
    if (!team) throw new Error('No tienes acceso a este equipo');

    const teamPlayers = await getPlayersByTeamIds(supabase, team.id, jugadorIds);
    const rows = [];
    (teamPlayers || []).forEach((player) => {
      suplementoIds.forEach((supId) => {
        rows.push({
          jugador_id: player.id,
          suplemento_id: supId,
          updated_at: new Date().toISOString(),
        });
      });
    });

    if (rows.length) {
      await upsertJugadorSuplementosExtraBulk(supabase, rows);
    }
    revalidatePath(`/dashboard/equipo/${team.id}`);
    return { ok: true, assigned: rows.length };
  }

  throw new Error('Acción no soportada');
}
