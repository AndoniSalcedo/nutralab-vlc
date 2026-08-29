import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getOwnedTeam } from '@/lib/team-access';
import { cleanText, toPositiveNumber, slugify as sharedSlugify } from '@/lib/utils';
import { getPlayersByTeam, getPlayersByTeamIds } from '@/repositories/playerRepository';
import {
  getAllSuplementos,
  getAllSuplementacionListas,
  getAllSuplementacionListaItems,
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

function canManage(user) {
  return user && user.role === 'admin';
}

const slugify = (value) => sharedSlugify(value).slice(0, 80);


export async function GET() {
  const user = await getUser();
  if (!user || user.role === 'jugador') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  try {
    const [suplementos, listas, items] = await Promise.all([
      getAllSuplementos(supabase),
      getAllSuplementacionListas(supabase),
      getAllSuplementacionListaItems(supabase),
    ]);

    return NextResponse.json({
      suplementos,
      listas,
      items,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getUser();
  if (!canManage(user)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const action = cleanText(body.action);
  const supabase = getSupabaseAdmin();

  try {
    if (action === 'create_supplement') {
      const nombre = cleanText(body.nombre);
      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del suplemento es obligatorio' }, { status: 400 });
      }

      const slug = slugify(body.slug || nombre);
      const doseType = body.dose_type === 'per_kg_range' ? 'per_kg_range' : 'custom';
      const payload = {
        slug,
        nombre,
        categoria: cleanText(body.categoria) || 'Custom',
        descripcion: cleanText(body.descripcion) || null,
        pauta: cleanText(body.pauta) || 'Según producto.',
        timing: cleanText(body.timing) || 'Según pauta',
        dose_type: doseType,
        dose_min: doseType === 'per_kg_range' ? toPositiveNumber(body.dose_min) : null,
        dose_max: doseType === 'per_kg_range' ? toPositiveNumber(body.dose_max) : null,
        dose_unit: doseType === 'per_kg_range' ? (cleanText(body.dose_unit) || null) : null,
        dose_text: cleanText(body.dose_text || body.pauta) || 'Según producto',
        notas: cleanText(body.notas) || null,
        updated_at: new Date().toISOString(),
      };

      const data = await upsertSuplemento(supabase, payload);
      return NextResponse.json({ suplemento: data }, { status: 201 });
    }

    if (action === 'update_supplement') {
      const id = toPositiveNumber(body.id);
      if (!id) {
        return NextResponse.json({ error: 'ID de suplemento no válido' }, { status: 400 });
      }

      const nombre = cleanText(body.nombre);
      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del suplemento es obligatorio' }, { status: 400 });
      }

      const doseType = body.dose_type === 'per_kg_range' ? 'per_kg_range' : 'custom';
      const payload = {
        nombre,
        categoria: cleanText(body.categoria) || 'Custom',
        descripcion: cleanText(body.descripcion) || null,
        pauta: cleanText(body.pauta) || 'Según producto.',
        timing: cleanText(body.timing) || 'Según pauta',
        dose_type: doseType,
        dose_min: doseType === 'per_kg_range' ? toPositiveNumber(body.dose_min) : null,
        dose_max: doseType === 'per_kg_range' ? toPositiveNumber(body.dose_max) : null,
        dose_unit: doseType === 'per_kg_range' ? (cleanText(body.dose_unit) || null) : null,
        dose_text: cleanText(body.dose_text || body.pauta) || 'Según producto',
        notas: cleanText(body.notas) || null,
        updated_at: new Date().toISOString(),
      };

      const data = await updateSuplemento(supabase, id, payload);
      return NextResponse.json({ suplemento: data }, { status: 200 });
    }

    if (action === 'delete_supplement') {
      const id = toPositiveNumber(body.id);
      if (!id) {
        return NextResponse.json({ error: 'ID de suplemento no válido' }, { status: 400 });
      }

      await deleteSuplemento(supabase, id);
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete_list') {
      const id = toPositiveNumber(body.id);
      if (!id) {
        return NextResponse.json({ error: 'ID de catálogo no válido' }, { status: 400 });
      }

      await deleteSuplementacionLista(supabase, id);
      return NextResponse.json({ ok: true });
    }

    if (action === 'create_list') {
      const nombre = cleanText(body.nombre);
      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del catálogo es obligatorio' }, { status: 400 });
      }

      const slug = slugify(body.slug || nombre);
      const payload = {
        slug,
        nombre,
        orden: toPositiveNumber(body.orden) || await nextListOrder(supabase),
        descripcion: cleanText(body.descripcion) || null,
        updated_at: new Date().toISOString(),
      };

      const data = await upsertSuplementacionLista(supabase, payload);
      return NextResponse.json({ lista: data }, { status: 201 });
    }

    if (action === 'add_item') {
      const listaId = toPositiveNumber(body.lista_id);
      const suplementoId = toPositiveNumber(body.suplemento_id);
      if (!listaId || !suplementoId) {
        return NextResponse.json({ error: 'Falta catálogo o suplemento' }, { status: 400 });
      }

      const existing = await getSuplementacionListaItemsByList(supabase, listaId);

      const payload = {
        lista_id: listaId,
        suplemento_id: suplementoId,
        orden: Number(existing?.[0]?.orden || 0) + 1,
        notas: cleanText(body.notas) || null,
      };

      const data = await upsertSuplementacionListaItem(supabase, payload);
      return NextResponse.json({ item: data }, { status: 201 });
    }

    if (action === 'remove_item') {
      const itemId = toPositiveNumber(body.item_id);
      if (!itemId) {
        return NextResponse.json({ error: 'Falta item_id' }, { status: 400 });
      }

      await deleteSuplementacionListaItem(supabase, itemId);
      return NextResponse.json({ ok: true });
    }

    if (action === 'assign_all') {
      const listaId = toPositiveNumber(body.lista_id);
      const team = await getOwnedTeam(supabase, user, body.team_id);
      if (!listaId) {
        return NextResponse.json({ error: 'Selecciona un catálogo' }, { status: 400 });
      }
      if (!team) {
        return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 });
      }

      const players = await getPlayersByTeam(supabase, team.id);

      const rows = (players || []).map((player) => ({
        jugador_id: player.id,
        lista_id: listaId,
        updated_at: new Date().toISOString(),
      }));

      if (rows.length) {
        await upsertJugadorSuplementacionBulk(supabase, rows);
      }

      return NextResponse.json({ ok: true, assigned: rows.length });
    }

    if (action === 'assign_to_players') {
      const listaId = toPositiveNumber(body.lista_id);
      const jugadorIds = Array.isArray(body.jugadorIds)
        ? body.jugadorIds.map(Number).filter(Number.isFinite)
        : [];

      if (!listaId) {
        return NextResponse.json({ error: 'Selecciona un catálogo' }, { status: 400 });
      }
      if (!jugadorIds.length) {
        return NextResponse.json({ error: 'Debes seleccionar al menos un jugador' }, { status: 400 });
      }

      const team = await getOwnedTeam(supabase, user, body.team_id);
      if (!team) {
        return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 });
      }

      const teamPlayers = await getPlayersByTeamIds(supabase, team.id, jugadorIds);

      const rows = (teamPlayers || []).map((player) => ({
        jugador_id: player.id,
        lista_id: listaId,
        updated_at: new Date().toISOString(),
      }));

      if (rows.length) {
        await upsertJugadorSuplementacionBulk(supabase, rows);
      }

      return NextResponse.json({ ok: true, assigned: rows.length });
    }

    if (action === 'assign_extra_to_players') {
      const suplementoIds = Array.isArray(body.suplementoIds)
        ? body.suplementoIds.map(Number).filter(Number.isFinite)
        : [];
      const jugadorIds = Array.isArray(body.jugadorIds)
        ? body.jugadorIds.map(Number).filter(Number.isFinite)
        : [];

      if (!suplementoIds.length) {
        return NextResponse.json({ error: 'Selecciona al menos un suplemento' }, { status: 400 });
      }
      if (!jugadorIds.length) {
        return NextResponse.json({ error: 'Debes seleccionar al menos un jugador' }, { status: 400 });
      }

      const team = await getOwnedTeam(supabase, user, body.team_id);
      if (!team) {
        return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 });
      }

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

      return NextResponse.json({ ok: true, assigned: rows.length });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

