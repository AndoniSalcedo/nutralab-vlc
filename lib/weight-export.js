import * as XLSX from 'xlsx';

export function formatFullDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function dateToIso(val) {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function exportWeightExcel({
  teamName = 'Plantilla',
  fecha = '',
  fechaFormatted = '',
  records = [],
  summary = {},
}) {
  const displayDate = fechaFormatted || fecha;
  const conPesoCount = records.filter((r) => r.hasWeight).length;

  const optimoCount = summary.optimo ?? records.filter((r) => r.status === 'verde').length;
  const precaucionCount = summary.precaucion ?? records.filter((r) => r.status === 'amarillo').length;
  const alertaCount = summary.alerta ?? records.filter((r) => r.status === 'rojo').length;

  const aoa = [
    ['NUTRALAB VLC - INFORME DE TOMA DE PESO'],
    ['Equipo:', teamName, '', 'Fecha de Medición:', displayDate],
    [
      'Generado el:',
      new Date().toLocaleDateString('es-ES'),
      '',
      'Jugadores evaluados:',
      `${conPesoCount} de ${records.length}`,
    ],
    [
      'Resumen Semáforo:',
      `🟢 Óptimo: ${optimoCount}   |   🟡 Precaución: ${precaucionCount}   |   🔴 Alerta: ${alertaCount}`,
    ],
    [], // empty row separator
    [
      '#',
      'Jugador',
      'Posición',
      'Peso Registrado (kg)',
      'Peso Ref. Media (kg)',
      'Variación (kg)',
      'Estado Semáforo',
      'Detalle Semáforo',
    ],
  ];

  records.forEach((r, idx) => {
    const hasWeight = r.hasWeight;
    let emojiStatus = '⚪ Sin registro';
    if (r.status === 'verde') emojiStatus = '🟢 Óptimo';
    else if (r.status === 'amarillo') emojiStatus = '🟡 Precaución';
    else if (r.status === 'rojo') {
      emojiStatus = r.diff < 0 ? '🔴 Alerta (Pérdida)' : '🔴 Alerta (Exceso)';
    }

    const diffStr =
      r.diff !== null && r.diff !== undefined
        ? r.diff > 0
          ? `+${r.diff.toFixed(2)}`
          : `${r.diff.toFixed(2)}`
        : '';

    aoa.push([
      idx + 1,
      `${r.nombre} ${r.apellidos || ''}`.trim(),
      r.posicion || '—',
      hasWeight && r.peso !== null && r.peso !== undefined ? Number(r.peso) : 'Sin registro',
      r.pesoReferencia !== null && r.pesoReferencia !== undefined ? Number(r.pesoReferencia) : '—',
      hasWeight && diffStr ? Number(r.diff) : '—',
      hasWeight ? emojiStatus : '⚪ Sin registro',
      hasWeight ? r.statusLabel || 'Registrado' : 'Sin pesaje en esta fecha',
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  worksheet['!cols'] = [
    { wch: 5 },  // #
    { wch: 28 }, // Jugador
    { wch: 16 }, // Posición
    { wch: 22 }, // Peso Registrado (kg)
    { wch: 22 }, // Peso Ref. Media (kg)
    { wch: 16 }, // Variación (kg)
    { wch: 22 }, // Estado Semáforo
    { wch: 26 }, // Detalle Semáforo
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pesajes');

  const safeTeam = teamName.replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/g, '_');
  const safeDate = fecha.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'Medicion';
  const filename = `Toma_Pesos_${safeTeam}_${safeDate}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

export async function downloadWeightPdf({
  teamName = 'Plantilla',
  fecha = '',
  fechaFormatted = '',
  records = [],
  summary = {},
}) {
  const res = await fetch('/api/reports/weight-export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamName,
      fecha,
      fechaFormatted,
      records,
      summary,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al generar el archivo PDF');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const safeTeam = teamName.replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/g, '_');
  const safeDate = fecha.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'Medicion';
  a.download = `Toma_Pesos_${safeTeam}_${safeDate}.pdf`;

  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
