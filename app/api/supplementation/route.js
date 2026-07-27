import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAccessiblePlayer } from '@/lib/team-access';
import { cleanText, toPositiveNumber } from '@/lib/utils';
import {
  getAllSuplementos,
  getAllSuplementacionListas,
  getAllSuplementacionListaItems,
  getJugadorSuplementacion,
  getJugadorSuplementosExtra,
  upsertJugadorSuplementacion,
  upsertJugadorSuplementosExtra,
  deleteJugadorSuplementosExtra
} from '@/repositories/supplementationRepository';

function canManage(user) {
  return user && user.role !== 'jugador';
}

async function getAllowedJugadorId(request, user) {
  const url = new URL(request.url);
  const requested = toPositiveNumber(url.searchParams.get('jugador_id'));
  const jugadorId = user?.role === 'jugador' ? toPositiveNumber(user.id) : requested;

  if (!jugadorId) {
    return { error: NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 }) };
  }

  if (user?.role === 'jugador' && String(user.id) !== String(jugadorId)) {
    return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) };
  }

  if (user?.role !== 'jugador') {
    const supabase = getSupabaseAdmin();
    const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
    if (!accessiblePlayer) {
      return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) };
    }
  }

  return { jugadorId };
}

export async function GET(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { jugadorId, error: jugadorError } = await getAllowedJugadorId(request, user);
  if (jugadorError) return jugadorError;

  const supabase = getSupabaseAdmin();
  
  try {
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

    return NextResponse.json({
      suplementos,
      listas,
      items,
      asignacion,
      extras,
      canManage: canManage(user) && user?.role !== 'tecnico',
    });
  } catch (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getUser();
  if (!canManage(user) || user?.role === 'tecnico') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const action = cleanText(body.action);
  const jugadorId = toPositiveNumber(body.jugador_id);
  const supabase = getSupabaseAdmin();

  if (!jugadorId) {
    return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });
  }

  const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
  if (!accessiblePlayer) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  try {
    if (action === 'set_list') {
      const listaId = toPositiveNumber(body.lista_id);
      const payload = {
        jugador_id: jugadorId,
        lista_id: listaId,
        updated_at: new Date().toISOString(),
      };

      const data = await upsertJugadorSuplementacion(supabase, payload);
      return NextResponse.json({ asignacion: data });
    }

    if (action === 'add_extra') {
      const suplementoId = toPositiveNumber(body.suplemento_id);
      if (!suplementoId) {
        return NextResponse.json({ error: 'Falta suplemento_id' }, { status: 400 });
      }

      const payload = {
        jugador_id: jugadorId,
        suplemento_id: suplementoId,
        dose_override: cleanText(body.dose_override) || null,
        timing_override: cleanText(body.timing_override) || null,
        note_override: cleanText(body.note_override) || null,
        updated_at: new Date().toISOString(),
      };

      const data = await upsertJugadorSuplementosExtra(supabase, payload);
      return NextResponse.json({ extra: data }, { status: 201 });
    }

    if (action === 'delete_extra') {
      const extraId = toPositiveNumber(body.extra_id);
      if (!extraId) {
        return NextResponse.json({ error: 'Falta extra_id' }, { status: 400 });
      }

      await deleteJugadorSuplementosExtra(supabase, extraId, jugadorId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

