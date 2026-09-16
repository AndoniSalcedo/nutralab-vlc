import {
  getAiPlansAction,
  createAiPlanAction,
  updateAiPlanAction,
  deleteAiPlanAction
} from '@/actions/planActions';

export async function getAiPlans(jugadorId, semana = null) {
  return await getAiPlansAction(jugadorId, semana);
}

export async function generateAiPlanDraft({ jugador, nombre, calendario, semanaMenu, preMatchConfig }) {
  return await createAiPlanAction({
    jugador,
    nombre,
    calendario,
    semanaMenu,
    preMatchConfig,
    draftOnly: true
  });
}

export async function saveAiPlan({ jugador, nombre, datos, contenido }) {
  return await createAiPlanAction({
    jugador,
    nombre,
    datos,
    contenido
  });
}

export async function updateAiPlan({ id, nombre, contenido, datos }) {
  return await updateAiPlanAction({
    id,
    nombre,
    contenido,
    datos,
  });
}

export async function downloadAiPlanPdf(planId) {
  const res = await fetch(`/api/reports/plan/${planId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo descargar el PDF');
  }
  return res;
}

export async function deleteAiPlan(id) {
  return await deleteAiPlanAction(id);
}
