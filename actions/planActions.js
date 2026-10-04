'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer, getAccessiblePlayer } from '@/lib/auth/team-access';
import { sanitizePlanData } from '@/lib/engine';
import { generatePlanDraft, resolvePlanMenu, savePlan } from '@/lib/plans/generate';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerId } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerId } from '@/repositories/pesajeRepository';
import {
  getAiPlansByPlayerId,
  getAiPlanById,
  updateAiPlan as updateAiPlanInRepo,
  deleteAiPlan as deleteAiPlanInRepo
} from '@/repositories/aiPlanRepository';

async function loadPlayerWithLatestMetrics(db, jugadorId) {
  const [jugador, evoluciones, pesajes] = await Promise.all([
    getPlayerWithTeamConfig(db, jugadorId),
    getEvolutionsByPlayerId(db, jugadorId),
    getPesajesByPlayerId(db, jugadorId),
  ]);

  return withLatestMeasurement(jugador, evoluciones || [], pesajes || []);
}

export async function getAiPlans(jugadorId, semana = null) {
  if (!jugadorId) throw new Error('Falta jugador_id');

  const db = getDb();
  const user = await getUser();
  if (!user) throw new Error('No autenticado');
  if (user.role === 'jugador' && String(user.id) !== String(jugadorId)) {
    throw new Error('Sin permisos');
  }
  if (user.role !== 'jugador') {
    const accessiblePlayer = await getAccessiblePlayer(db, user, jugadorId);
    if (!accessiblePlayer) throw new Error('No tienes acceso a este jugador');
  }

  const planes = await getAiPlansByPlayerId(db, jugadorId, semana);
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

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const ownedPlayer = await getOwnedPlayer(db, user, jugador.id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  const jugadorConMetricas = await loadPlayerWithLatestMetrics(db, jugador.id);
  const teamConfig = jugadorConMetricas?.equipos?.configuracion_nutricional;

  const equipoId = jugadorConMetricas?.equipo_id;
  const isDraftOnly = draftOnly || payload?.guardar === false;
  const isNewGeneration = isDraftOnly || (!datos && (contenido === undefined || contenido === ''));

  const generatedDatos = isNewGeneration
    ? await generatePlanDraft(db, {
        jugador: jugadorConMetricas,
        nombre: planNombre,
        menu: await resolvePlanMenu(db, { semanaMenu, equipoId }),
        calendario,
        preMatchConfig,
        teamConfig,
        equipoId,
        equipoNombre: jugadorConMetricas?.equipos?.nombre,
        user,
        origen: 'plan_individual',
      })
    : sanitizePlanData(datos, teamConfig);

  if (isDraftOnly) {
    return { datos: generatedDatos };
  }

  const plan = await savePlan(db, {
    jugadorId: jugador.id,
    nombre: planNombre,
    datos: generatedDatos,
    contenido: String(contenido || ''),
  });

  revalidatePath(`/dashboard/jugador/${jugador.id}`);
  return { plan };
}

export async function updateAiPlan(payload) {
  const { id, nombre, contenido, datos } = payload || {};
  if (!id) throw new Error('Falta id del plan');
  const planNombre = String(nombre || '').trim();
  if (!planNombre) throw new Error('El nombre del plan es obligatorio');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const currentPlan = await getAiPlanById(db, id);
  if (!currentPlan) throw new Error('Plan no encontrado');

  const ownedPlayer = await getOwnedPlayer(db, user, currentPlan.jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  const jugadorConMetricas = await loadPlayerWithLatestMetrics(db, currentPlan.jugador_id);
  const teamConfig = jugadorConMetricas?.equipos?.configuracion_nutricional;

  const sanitizedDatos = sanitizePlanData(datos, teamConfig);
  const finalContenido = String(contenido || '');

  const plan = await updateAiPlanInRepo(db, id, {
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

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const plan = await getAiPlanById(db, id);
  if (!plan) throw new Error('Plan no encontrado');

  const ownedPlayer = await getOwnedPlayer(db, user, plan.jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  await deleteAiPlanInRepo(db, id);
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
