import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer, getAccessiblePlayer } from '@/lib/team-access';
import {
  getPesajesByPlayerId,
  getPesajeById,
  updatePesaje,
  upsertPesaje,
  deletePesaje
} from '@/repositories/pesajeRepository';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jugadorId = searchParams.get('jugador_id');
  if (!jugadorId) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.role === 'jugador' && String(user.id) !== String(jugadorId)) return forbidden();
  if (user.role !== 'jugador') {
    const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
    if (!accessiblePlayer) return forbidden('No tienes acceso a este jugador');
  }

  try {
    const data = await getPesajesByPlayerId(supabase, jugadorId);
    return NextResponse.json({ pesajes: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, jugador_id, fecha, peso_kg } = body;
    if (!jugador_id || !fecha || peso_kg === undefined) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

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

    return NextResponse.json({ ok: true, pesaje: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

    const pesaje = await getPesajeById(supabase, id);
    if (!pesaje) return NextResponse.json({ error: 'Registro de peso no encontrado' }, { status: 404 });

    const ownedPlayer = await getOwnedPlayer(supabase, user, pesaje.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    await deletePesaje(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
