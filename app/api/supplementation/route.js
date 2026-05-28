import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getOwnedPlayer } from '@/lib/team-access';

function toPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cleanText(value) {
  return String(value || '').trim();
}

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
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
    if (!ownedPlayer) {
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
  const [
    suplementosRes,
    listasRes,
    itemsRes,
    asignacionRes,
    extrasRes,
  ] = await Promise.all([
    supabase.from('suplementos').select('*').order('nombre', { ascending: true }),
    supabase.from('suplementacion_listas').select('*').order('orden', { ascending: true }),
    supabase.from('suplementacion_lista_items').select('*').order('orden', { ascending: true }),
    supabase.from('jugador_suplementacion').select('*').eq('jugador_id', jugadorId).maybeSingle(),
    supabase.from('jugador_suplementos_extra').select('*').eq('jugador_id', jugadorId).order('created_at', { ascending: true }),
  ]);

  const firstError = [suplementosRes, listasRes, itemsRes, asignacionRes, extrasRes].find((res) => res.error)?.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    suplementos: suplementosRes.data || [],
    listas: listasRes.data || [],
    items: itemsRes.data || [],
    asignacion: asignacionRes.data || null,
    extras: extrasRes.data || [],
    canManage: canManage(user),
  });
}

export async function POST(request) {
  const user = await getUser();
  if (!canManage(user)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const action = cleanText(body.action);
  const jugadorId = toPositiveNumber(body.jugador_id);
  const supabase = getSupabaseAdmin();

  if (!jugadorId) {
    return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });
  }

  const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
  if (!ownedPlayer) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  if (action === 'set_list') {
    const listaId = toPositiveNumber(body.lista_id);
    const payload = {
      jugador_id: jugadorId,
      lista_id: listaId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('jugador_suplementacion')
      .upsert(payload, { onConflict: 'jugador_id' })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

    const { data, error } = await supabase
      .from('jugador_suplementos_extra')
      .upsert(payload, { onConflict: 'jugador_id,suplemento_id' })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ extra: data }, { status: 201 });
  }

  if (action === 'delete_extra') {
    const extraId = toPositiveNumber(body.extra_id);
    if (!extraId) {
      return NextResponse.json({ error: 'Falta extra_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('jugador_suplementos_extra')
      .delete()
      .eq('id', extraId)
      .eq('jugador_id', jugadorId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
}
