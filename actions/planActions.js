'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer, getAccessiblePlayer } from '@/lib/auth/team-access';
import { sanitizePlanData, generarDatosPlan } from '@/lib/engine';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerId } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerId } from '@/repositories/pesajeRepository';
import {
  getAiPlansByPlayerId,
  getAiPlanById,
  insertAiPlan,
  updateAiPlan,
  deleteAiPlan
} from '@/repositories/aiPlanRepository';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';

async function loadPlayerWithLatestMetrics(supabase, jugadorId) {
  const [jugador, evoluciones, pesajes] = await Promise.all([
    getPlayerWithTeamConfig(supabase, jugadorId),
    getEvolutionsByPlayerId(supabase, jugadorId),
    getPesajesByPlayerId(supabase, jugadorId),
  ]);

  return withLatestMeasurement(jugador, evoluciones || [], pesajes || []);
}

function getDefaultMealRecommendations(jugador) {
  const recommendations = jugador?.recomendaciones_defecto;
  return recommendations && typeof recommendations === 'object' && !Array.isArray(recommendations)
    ? recommendations
    : {};
}

function forceDefaultMealRecommendations(datos, jugador) {
  if (!datos) return datos;
  return {
    ...datos,
    meta: {
      ...(datos.meta || {}),
      recomendacionesIngestas: getDefaultMealRecommendations(jugador),
    },
  };
}

export async function getAiPlansAction(jugadorId, semana = null) {
  if (!jugadorId) throw new Error('Falta jugador_id');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user) throw new Error('No autenticado');
  if (user.role === 'jugador' && String(user.id) !== String(jugadorId)) {
    throw new Error('Sin permisos');
  }
  if (user.role !== 'jugador') {
    const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
    if (!accessiblePlayer) throw new Error('No tienes acceso a este jugador');
  }

  const planes = await getAiPlansByPlayerId(supabase, jugadorId, semana);
  return { planes: planes || [] };
}

export async function createAiPlanAction(payload) {
  const {
    jugador,
    nombre,
    contexto,
    contextoAdicional,
    contenido,
    datos,
    draftOnly = false,
    calendario,
    semanaMenu,
    preMatchConfig
  } = payload || {};

  const planNombre = String(nombre || '').trim();
  if (!jugador?.id) throw new Error('Falta jugador');
  if (!planNombre) throw new Error('El nombre del plan es obligatorio');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const ownedPlayer = await getOwnedPlayer(supabase, user, jugador.id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  const jugadorConMetricas = await loadPlayerWithLatestMetrics(supabase, jugador.id);
  const teamConfig = jugadorConMetricas?.equipos?.configuracion_nutricional;
  const defaultMealRecommendations = getDefaultMealRecommendations(jugadorConMetricas);

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
        // Las recomendaciones editables del formulario no forman parte de la
        // entrada del motor: siempre se usan las pautas guardadas en el jugador.
        recomendacionesIngestas: defaultMealRecommendations,
        preMatchConfig
      })
    : forceDefaultMealRecommendations(sanitizePlanData(datos, teamConfig), jugadorConMetricas);

  if (draftOnly) {
    return { datos: generatedDatos };
  }

  const finalContenido = String(contenido || '');
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

  revalidatePath(`/dashboard/jugador/${jugador.id}`);
  return { plan };
}

export async function updateAiPlanAction(payload) {
  const { id, nombre, contenido, datos, contexto, contextoAdicional } = payload || {};
  if (!id) throw new Error('Falta id del plan');
  const planNombre = String(nombre || '').trim();
  if (!planNombre) throw new Error('El nombre del plan es obligatorio');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const currentPlan = await getAiPlanById(supabase, id);
  if (!currentPlan) throw new Error('Plan no encontrado');

  const ownedPlayer = await getOwnedPlayer(supabase, user, currentPlan.jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  const jugadorConMetricas = await loadPlayerWithLatestMetrics(supabase, currentPlan.jugador_id);
  const teamConfig = jugadorConMetricas?.equipos?.configuracion_nutricional;

  const sanitizedDatos = forceDefaultMealRecommendations(
    sanitizePlanData(datos, teamConfig),
    jugadorConMetricas
  );
  const finalContenido = String(contenido || '');

  const plan = await updateAiPlan(supabase, id, {
    nombre: planNombre,
    contenido: finalContenido,
    datos: sanitizedDatos,
    contexto,
    contexto_adicional: contextoAdicional || '',
    updated_at: new Date().toISOString(),
  });

  revalidatePath(`/dashboard/jugador/${currentPlan.jugador_id}`);
  return { plan };
}

export async function deleteAiPlanAction(id) {
  if (!id) throw new Error('Falta id del plan');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const plan = await getAiPlanById(supabase, id);
  if (!plan) throw new Error('Plan no encontrado');

  const ownedPlayer = await getOwnedPlayer(supabase, user, plan.jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  await deleteAiPlan(supabase, id);
  revalidatePath(`/dashboard/jugador/${plan.jugador_id}`);
  return { ok: true };
}
