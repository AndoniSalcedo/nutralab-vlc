export async function generateWeeklySquadReport(payload) {
  const res = await fetch('/api/reports/weekly-squad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo generar el informe');
  }
  return res;
}

export async function exportWeightsReport(payload) {
  const res = await fetch('/api/reports/weight-export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al generar el archivo PDF');
  }
  return res.blob();
}

export async function downloadAiPlanPdf(planId) {
  const res = await fetch(`/api/reports/plan/${planId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo descargar el PDF');
  }
  return res;
}
