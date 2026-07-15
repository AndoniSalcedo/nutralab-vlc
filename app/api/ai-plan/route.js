import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import { planDataToLegacyContent, sanitizePlanData } from '@/lib/nutrition-plan-card';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { generarDatosPlan } from '@/lib/ai-plan-generator';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerId } from '@/repositories/evolutionRepository';
import {
  getAiPlansByPlayerId,
  getAiPlanById,
  insertAiPlan,
  updateAiPlan,
  deleteAiPlan
} from '@/repositories/aiPlanRepository';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';

async function loadPlayerWithLatestMetrics(supabase, jugadorId) {
  const [jugador, evoluciones] = await Promise.all([
    getPlayerWithTeamConfig(supabase, jugadorId),
    getEvolutionsByPlayerId(supabase, jugadorId),
  ]);

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

    const planes = await getAiPlansByPlayerId(supabase, jugadorId);
    return NextResponse.json({ planes: planes || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { jugador, nombre, contexto, contextoAdicional, contenido, datos, draftOnly = false, calendario, semanaMenu, recomendacionesIngestas } = await req.json();
    const planNombre = String(nombre || '').trim();
    if (!jugador?.id) return NextResponse.json({ error: 'Falta jugador' }, { status: 400 });
    if (!planNombre) return NextResponse.json({ error: 'El nombre del plan es obligatorio' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador.id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    const jugadorConMetricas = await loadPlayerWithLatestMetrics(supabase, jugador.id);
    const teamConfig = jugadorConMetricas?.equipos?.configuracion_nutricional;

    let resolvedMenu = undefined;
    if (semanaMenu === 'none' || semanaMenu === null) {
      resolvedMenu = null;
    } else if (semanaMenu) {
      resolvedMenu = await getMenuByWeekAndTeam(supabase, semanaMenu, teamConfig?.equipo_id || jugadorConMetricas?.equipo_id);
    }

    const generatedDatos = draftOnly || (!datos && (contenido === undefined || contenido === ''))
      ? await generarDatosPlan({
          jugador: jugadorConMetricas,
          nombre: planNombre,
          contexto: contexto || 'semana_normal',
          contextoAdicional,
          calendario,
          menu: resolvedMenu,
          teamConfig,
          recomendacionesIngestas
        })
      : sanitizePlanData(datos, teamConfig);

    if (draftOnly) {
      return NextResponse.json({ datos: generatedDatos });
    }

    const finalContenido = generatedDatos ? planDataToLegacyContent(generatedDatos, teamConfig) : String(contenido || '');
    const now = new Date().toISOString();
    const plan = await insertAiPlan(supabase, {
      jugador_id: jugador.id,
      nombre: planNombre,
      contexto,
      contexto_adicional: contextoAdicional || '',
      contenido: finalContenido,
      datos: generatedDatos,
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ plan });
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

    const currentPlan = await getAiPlanById(supabase, id);
    if (!currentPlan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    const ownedPlayer = await getOwnedPlayer(supabase, user, currentPlan.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    
    const jugadorConMetricas = await loadPlayerWithLatestMetrics(supabase, currentPlan.jugador_id);
    const teamConfig = jugadorConMetricas?.equipos?.configuracion_nutricional;

    const sanitizedDatos = sanitizePlanData(datos, teamConfig);
    const finalContenido = sanitizedDatos ? planDataToLegacyContent(sanitizedDatos, teamConfig) : String(contenido || '');

    const plan = await updateAiPlan(supabase, id, {
      nombre: planNombre,
      contenido: finalContenido,
      datos: sanitizedDatos,
      contexto,
      contexto_adicional: contextoAdicional || '',
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ plan });
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

    const plan = await getAiPlanById(supabase, id);
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });

    const ownedPlayer = await getOwnedPlayer(supabase, user, plan.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    await deleteAiPlan(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

