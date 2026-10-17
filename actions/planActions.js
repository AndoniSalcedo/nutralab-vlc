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
import { ActionError } from '@/lib/actionError';
import { PLAN_MODES, isValidPlanMode } from '@/config/plan-modes';

async function loadPlayerWithLatestMetrics(db, jugadorId) {
  const [jugador, evoluciones, pesajes] = await Promise.all([
    getPlayerWithTeamConfig(db, jugadorId),
    getEvolutionsByPlayerId(db, jugadorId),
    getPesajesByPlayerId(db, jugadorId),
  ]);

  return withLatestMeasurement(jugador, evoluciones || [], pesajes || []);
}

export async function getAiPlans(jugadorId, modo) {
  if (!jugadorId) throw new ActionError('Falta jugador_id');
  if (!isValidPlanMode(modo)) throw new ActionError('Modo de plan no válido');

  const db = getDb();
  const user = await getUser();
  if (!user) throw new ActionError('No autenticado');
  if (user.role === 'jugador' && String(user.id) !== String(jugadorId)) {
    throw new ActionError('Sin permisos');
  }
  if (user.role !== 'jugador') {
    const accessiblePlayer = await getAccessiblePlayer(db, user, jugadorId);
    if (!accessiblePlayer) throw new ActionError('No tienes acceso a este jugador');
  }

  const planes = await getAiPlansByPlayerId(db, jugadorId, { modo });
  return { planes: planes || [] };
}

// El modo de una ficha lo fija quien la guarda (la subpestaña o el plan existente), no los datos que llegan.
function withPlanMode(datos, modo) {
  if (!datos) return datos;
  if (datos.meta.modo !== modo) throw new ActionError('La ficha no corresponde a este tipo de plan');
  return datos;
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
    preMatchConfig,
    modo,
    tiposDia,
  } = payload || {};

  const planNombre = String(nombre || '').trim();
  if (!jugador?.id) throw new ActionError('Falta jugador');
  if (!planNombre) throw new ActionError('El nombre del plan es obligatorio');
  if (!isValidPlanMode(modo)) throw new ActionError('Modo de plan no válido');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new ActionError('No autorizado');
  }

  const ownedPlayer = await getOwnedPlayer(db, user, jugador.id);
  if (!ownedPlayer) throw new ActionError('No tienes acceso a este jugador');

  const jugadorConMetricas = await loadPlayerWithLatestMetrics(db, jugador.id);
  const teamConfig = jugadorConMetricas?.equipos?.configuracion_nutricional;

  const equipoId = jugadorConMetricas?.equipo_id;
  const isDraftOnly = draftOnly || payload?.guardar === false;
  const isNewGeneration = isDraftOnly || (!datos && (contenido === undefined || contenido === ''));

  const generatedDatos = isNewGeneration
    ? await generatePlanDraft(db, {
        jugador: jugadorConMetricas,
        nombre: planNombre,
        menu: modo === PLAN_MODES.TIPOS ? null : await resolvePlanMenu(db, { semanaMenu, equipoId }),
        calendario,
        preMatchConfig,
        teamConfig,
        modo,
        tiposDia,
        equipoId,
        equipoNombre: jugadorConMetricas?.equipos?.nombre,
        user,
        origen: 'plan_individual',
      })
    : withPlanMode(sanitizePlanData(datos, teamConfig), modo);

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
  if (!id) throw new ActionError('Falta id del plan');
  const planNombre = String(nombre || '').trim();
  if (!planNombre) throw new ActionError('El nombre del plan es obligatorio');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new ActionError('No autorizado');
  }

  const currentPlan = await getAiPlanById(db, id);
  if (!currentPlan) throw new ActionError('Plan no encontrado');

  const ownedPlayer = await getOwnedPlayer(db, user, currentPlan.jugador_id);
  if (!ownedPlayer) throw new ActionError('No tienes acceso a este jugador');

  const jugadorConMetricas = await loadPlayerWithLatestMetrics(db, currentPlan.jugador_id);
  const teamConfig = jugadorConMetricas?.equipos?.configuracion_nutricional;

  const sanitizedDatos = withPlanMode(sanitizePlanData(datos, teamConfig), currentPlan.modo);
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
  if (!id) throw new ActionError('Falta id del plan');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new ActionError('No autorizado');
  }

  const plan = await getAiPlanById(db, id);
  if (!plan) throw new ActionError('Plan no encontrado');

  const ownedPlayer = await getOwnedPlayer(db, user, plan.jugador_id);
  if (!ownedPlayer) throw new ActionError('No tienes acceso a este jugador');

  await deleteAiPlanInRepo(db, id);
  revalidatePath(`/dashboard/jugador/${plan.jugador_id}`);
  return { ok: true };
}

export async function generateAiPlanDraft({ jugador, nombre, calendario, semanaMenu, preMatchConfig, modo, tiposDia }) {
  return await createAiPlan({
    jugador,
    nombre,
    calendario,
    semanaMenu,
    preMatchConfig,
    modo,
    tiposDia,
    draftOnly: true,
    guardar: false,
  });
}

export async function saveAiPlan({ jugador, nombre, datos, contenido, modo }) {
  return await createAiPlan({
    jugador,
    nombre,
    datos,
    contenido,
    modo,
    guardar: true,
  });
}
