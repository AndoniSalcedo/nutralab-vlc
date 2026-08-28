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
      'Peso a 10% (kg)',
      'Peso a 9% (kg)',
      'Peso a 8% (kg)',
      '% Grasa Obj.',
      'Peso Objetivo (kg)',
      'Variación (kg)',
      'Estado Semáforo',
      'Detalle Semáforo',
    ],
  ];

  records.forEach((r, idx) => {
    const hasWeight = r.hasWeight;
    const targetFat = Number(r.porcentajeGrasaObjetivo) || 10;
    const masaMagra = r.masaMagra || (r.pesoReferencia && r.porcentajeGrasaObjetivo ? Math.round(r.pesoReferencia * (1 - r.porcentajeGrasaObjetivo / 100) * 100) / 100 : null);
    const p10 = r.peso10 !== null && r.peso10 !== undefined ? r.peso10 : (masaMagra ? Math.round((masaMagra / 0.90) * 100) / 100 : null);
    const p9 = r.peso9 !== null && r.peso9 !== undefined ? r.peso9 : (masaMagra ? Math.round((masaMagra / 0.91) * 100) / 100 : null);
    const p8 = r.peso8 !== null && r.peso8 !== undefined ? r.peso8 : (masaMagra ? Math.round((masaMagra / 0.92) * 100) / 100 : null);

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
      p10 !== null && p10 !== undefined ? Number(p10) : '—',
      p9 !== null && p9 !== undefined ? Number(p9) : '—',
      p8 !== null && p8 !== undefined ? Number(p8) : '—',
      `${targetFat}%`,
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
    { wch: 14 }, // Posición
    { wch: 20 }, // Peso Registrado (kg)
    { wch: 16 }, // Peso a 10% (kg)
    { wch: 16 }, // Peso a 9% (kg)
    { wch: 16 }, // Peso a 8% (kg)
    { wch: 14 }, // % Grasa Obj.
    { wch: 18 }, // Peso Objetivo (kg)
    { wch: 15 }, // Variación (kg)
    { wch: 18 }, // Estado Semáforo
    { wch: 24 }, // Detalle Semáforo
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
