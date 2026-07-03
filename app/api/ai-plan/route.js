import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import { planDataToLegacyContent, sanitizePlanData } from '@/lib/nutrition-plan-card';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { generarDatosPlan } from '@/lib/ai-plan-generator';

async function loadPlayerWithLatestMetrics(supabase, jugadorId) {
  const [{ data: jugador, error: jugadorError }, { data: evoluciones, error: evolucionesError }] = await Promise.all([
    supabase.from('jugadores').select('*').eq('id', jugadorId).single(),
    supabase.from('evoluciones').select('*').eq('jugador_id', jugadorId).order('fecha', { ascending: true }),
  ]);

  if (jugadorError) throw jugadorError;
  if (evolucionesError) throw evolucionesError;
  return withLatestMeasurement(jugador, evoluciones || []);
}

export async function GET(req) {
  try {
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
      .from('planes_ia')
      .select('id,jugador_id,nombre,contexto,contexto_adicional,contenido,datos,created_at,updated_at')
      .eq('jugador_id', jugadorId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ planes: data || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { jugador, nombre, contexto, contextoAdicional, contenido, datos, draftOnly = false, calendario } = await req.json();
    const planNombre = String(nombre || '').trim();
    if (!jugador?.id) return NextResponse.json({ error: 'Falta jugador' }, { status: 400 });
    if (!planNombre) return NextResponse.json({ error: 'El nombre del plan es obligatorio' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador.id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    const jugadorConMetricas = await loadPlayerWithLatestMetrics(supabase, jugador.id);

    const generatedDatos = draftOnly || (!datos && (contenido === undefined || contenido === ''))
      ? await generarDatosPlan({ jugador: jugadorConMetricas, nombre: planNombre, contexto, contextoAdicional, calendario })
      : sanitizePlanData(datos);

    if (draftOnly) {
      return NextResponse.json({ datos: generatedDatos });
    }

    const finalContenido = generatedDatos ? planDataToLegacyContent(generatedDatos) : String(contenido || '');
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('planes_ia')
      .insert({
        jugador_id: jugador.id,
        nombre: planNombre,
        contexto,
        contexto_adicional: contextoAdicional || '',
        contenido: finalContenido,
        datos: generatedDatos,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, nombre, contenido, datos, contexto, contextoAdicional } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta id del plan' }, { status: 400 });
    const planNombre = String(nombre || '').trim();
    if (!planNombre) return NextResponse.json({ error: 'El nombre del plan es obligatorio' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

    const { data: currentPlan, error: currentPlanError } = await supabase
      .from('planes_ia')
      .select('jugador_id')
      .eq('id', id)
      .single();

    if (currentPlanError) throw currentPlanError;
    const ownedPlayer = await getOwnedPlayer(supabase, user, currentPlan.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const sanitizedDatos = sanitizePlanData(datos);
    const finalContenido = sanitizedDatos ? planDataToLegacyContent(sanitizedDatos) : String(contenido || '');

    const { data, error } = await supabase
      .from('planes_ia')
      .update({
        nombre: planNombre,
        contenido: finalContenido,
        datos: sanitizedDatos,
        contexto,
        contexto_adicional: contextoAdicional || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id del plan' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

    const { data: plan, error: fetchError } = await supabase
      .from('planes_ia')
      .select('id, jugador_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });

    const ownedPlayer = await getOwnedPlayer(supabase, user, plan.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const { error } = await supabase.from('planes_ia').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
