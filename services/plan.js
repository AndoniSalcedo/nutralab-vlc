import {
  getAiPlansAction,
  createAiPlanAction,
  updateAiPlanAction,
  deleteAiPlanAction
} from '@/actions/planActions';

export async function getAiPlans(jugadorId, semana = null) {
  return await getAiPlansAction(jugadorId, semana);
}

export async function generateAiPlanDraft({ jugador, nombre, contextoAdicional, calendario, semanaMenu, preMatchConfig }) {
  return await createAiPlanAction({
    jugador,
    nombre,
    contexto: 'semana_normal',
    contextoAdicional,
    calendario,
    semanaMenu,
    preMatchConfig,
    draftOnly: true
  });
}

export async function saveAiPlan({ jugador, nombre, contexto, contextoAdicional, datos, contenido }) {
  return await createAiPlanAction({
    jugador,
    nombre,
    contexto,
    contextoAdicional,
    datos,
    contenido
  });
}

export async function updateAiPlan({ id, nombre, contenido, datos, contexto, contextoAdicional }) {
  return await updateAiPlanAction({
    id,
    nombre,
    contenido,
    datos,
    contexto,
    contextoAdicional,
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
