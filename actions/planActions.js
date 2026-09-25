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
  updateAiPlan as updateAiPlanInRepo,
  deleteAiPlan as deleteAiPlanInRepo
} from '@/repositories/aiPlanRepository';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';
import { trackUsageEvent } from '@/lib/billing/client';

async function loadPlayerWithLatestMetrics(supabase, jugadorId) {
  const [jugador, evoluciones, pesajes] = await Promise.all([
    getPlayerWithTeamConfig(supabase, jugadorId),
    getEvolutionsByPlayerId(supabase, jugadorId),
    getPesajesByPlayerId(supabase, jugadorId),
  ]);

  return withLatestMeasurement(jugador, evoluciones || [], pesajes || []);
}

export async function getAiPlans(jugadorId, semana = null) {
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

async function createAiPlan(payload) {
  const {
    jugador,
    nombre,
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

  let resolvedMenu = undefined;
  if (semanaMenu === 'none' || semanaMenu === null) {
    resolvedMenu = null;
  } else if (semanaMenu) {
    resolvedMenu = await getMenuByWeekAndTeam(supabase, semanaMenu, teamConfig?.equipo_id || jugadorConMetricas?.equipo_id);
  }

  const isDraftOnly = draftOnly || payload?.guardar === false;
  const isNewGeneration = isDraftOnly || (!datos && (contenido === undefined || contenido === ''));
  const generatedDatos = isNewGeneration
    ? await generarDatosPlan({
        jugador: jugadorConMetricas,
        nombre: planNombre,
        calendario,
        menu: resolvedMenu,
        teamConfig,
        preMatchConfig
      })
    : sanitizePlanData(datos, teamConfig);

  if (isNewGeneration) {
    const isPlayer = user.role === 'jugador';
    const emisor = isPlayer
      ? { tipo: 'cliente', nombre: user.name || 'Jugador', id: user.id }
      : { tipo: 'nutricionista', nombre: user.name || 'Técnico / Nutricionista Valencia FC', id: user.id };
    const cliente = {
      tipo: 'cliente',
      nombre: jugadorConMetricas?.nombre ? `${jugadorConMetricas.nombre} ${jugadorConMetricas.apellidos || ''}`.trim() : 'Jugador',
      id: jugador.id,
    };

    try {
      await trackUsageEvent({
        app: 'nutralab-vlc',
        tenantId: jugadorConMetricas?.equipo_id || jugador.id,
        tenantName: jugadorConMetricas?.equipos?.nombre || 'Valencia FC',
        userId: user.id,
        eventType: 'GENERACION_PLAN',
        description: `Plan nutricional (${planNombre})`,
        metadata: {
          jugadorId: jugador.id,
          tieneMenu: Boolean(resolvedMenu),
          emisor,
          cliente,
        },
      });
    } catch (billingErr) {
      console.warn('[planActions] Error al reportar evento a billing:', billingErr.message);
    }
  }

  if (isDraftOnly) {
    return { datos: generatedDatos };
  }

  const finalContenido = String(contenido || '');
  const now = new Date().toISOString();
  const plan = await insertAiPlan(supabase, {
    jugador_id: jugador.id,
    nombre: planNombre,
    contexto: null,
    contexto_adicional: null,
    contenido: finalContenido,
    datos: generatedDatos,
    created_at: now,
    updated_at: now,
  });

  revalidatePath(`/dashboard/jugador/${jugador.id}`);
  return { plan };
}

export async function updateAiPlan(payload) {
  const { id, nombre, contenido, datos } = payload || {};
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

  const sanitizedDatos = sanitizePlanData(datos, teamConfig);
  const finalContenido = String(contenido || '');

  const plan = await updateAiPlanInRepo(supabase, id, {
    nombre: planNombre,
    contenido: finalContenido,
    datos: sanitizedDatos,
    contexto: null,
    contexto_adicional: null,
    updated_at: new Date().toISOString(),
  });

  revalidatePath(`/dashboard/jugador/${currentPlan.jugador_id}`);
  return { plan };
}

export async function deleteAiPlan(id) {
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

  await deleteAiPlanInRepo(supabase, id);
  revalidatePath(`/dashboard/jugador/${plan.jugador_id}`);
  return { ok: true };
}

export async function generateAiPlanDraft({ jugador, nombre, calendario, semanaMenu, preMatchConfig }) {
  return await createAiPlan({
    jugador,
    nombre,
    calendario,
    semanaMenu,
    preMatchConfig,
    draftOnly: true,
    guardar: false,
  });
}

export async function saveAiPlan({ jugador, nombre, datos, contenido }) {
  return await createAiPlan({
    jugador,
    nombre,
    datos,
    contenido,
    guardar: true,
  });
}
