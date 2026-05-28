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
    const { jugador_id, fecha, altura_cm, peso_kg, porcentaje_grasa, masa_magra_kg, suma_6_pliegues, notas } = body;
    if (!jugador_id || !fecha) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const { data, error } = await supabase
      .from('evoluciones')
      .upsert({ jugador_id, fecha, altura_cm, peso_kg, porcentaje_grasa, masa_magra_kg, suma_6_pliegues, notas }, { onConflict: 'jugador_id,fecha' })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, evolucion: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
