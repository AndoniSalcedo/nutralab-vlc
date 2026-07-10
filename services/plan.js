export async function getAiPlans(jugadorId) {
  const res = await fetch(`/api/ai-plan?jugador_id=${jugadorId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cargar planes');
  return data;
}

export async function generateAiPlanDraft({ jugador, nombre, contexto, contextoAdicional, calendario, semanaMenu }) {
  const res = await fetch('/api/ai-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jugador, nombre, contexto, contextoAdicional, calendario, semanaMenu, draftOnly: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al generar la ficha');
  return data;
}

export async function saveAiPlan({ jugador, nombre, contexto, contextoAdicional, datos, contenido }) {
  const res = await fetch('/api/ai-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jugador,
      nombre,
      contexto,
      contextoAdicional,
      datos,
      contenido
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al guardar el plan');
  return data;
}

export async function updateAiPlan({ id, nombre, contenido, datos, contexto, contextoAdicional }) {
  const res = await fetch('/api/ai-plan', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      nombre,
      contenido,
      datos,
      contexto,
      contextoAdicional,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al guardar el plan');
  return data;
}

export async function downloadAiPlanPdf(planId) {
  const res = await fetch(`/api/ai-plan/${planId}/pdf`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo descargar el PDF');
  }
  return res;
}

export async function deleteAiPlan(id) {
  const res = await fetch(`/api/ai-plan?id=${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar el plan');
  return data;
}
