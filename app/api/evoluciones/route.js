import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jugadorId = searchParams.get('jugador_id');
  if (!jugadorId) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.role === 'jugador' && String(user.id) !== String(jugadorId)) return forbidden();
  if (user.role !== 'jugador') {
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
  }

  const { data, error } = await supabase
    .from('evoluciones')
    .select('*')
    .eq('jugador_id', jugadorId)
    .order('fecha', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ evoluciones: data });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, jugador_id, fecha, altura_cm, peso_kg, porcentaje_grasa, masa_magra_kg, suma_6_pliegues, notas } = body;
    if (!jugador_id || !fecha) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    let query;
    if (id) {
      query = supabase
        .from('evoluciones')
        .update({ fecha, altura_cm, peso_kg, porcentaje_grasa, masa_magra_kg, suma_6_pliegues, notas })
        .eq('id', id);
    } else {
      query = supabase
        .from('evoluciones')
        .upsert({ jugador_id, fecha, altura_cm, peso_kg, porcentaje_grasa, masa_magra_kg, suma_6_pliegues, notas }, { onConflict: 'jugador_id,fecha' });
    }

    const { data, error } = await query.select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, evolucion: data });
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

    const { data: evolucion, error: fetchError } = await supabase
      .from('evoluciones')
      .select('id, jugador_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!evolucion) return NextResponse.json({ error: 'Medición no encontrada' }, { status: 404 });

    const ownedPlayer = await getOwnedPlayer(supabase, user, evolucion.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const { error } = await supabase.from('evoluciones').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
