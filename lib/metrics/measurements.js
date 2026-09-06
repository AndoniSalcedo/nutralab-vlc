export const TREND_MEASUREMENT_METRICS = [
  { key: 'peso_kg', label: 'Peso', unit: 'kg', color: '#2563eb', goodDown: null },
  { key: 'porcentaje_grasa', label: '% Grasa (Faulkner)', unit: '%', color: '#dc2626', goodDown: true },
  { key: 'porcentaje_musculo', label: '% Músculo (Lee)', unit: '%', color: '#16a34a', goodDown: false },
  { key: 'suma_6_pliegues', label: 'Suma 6', unit: 'mm', color: '#d97706', goodDown: true },
  { key: 'suma_8_pliegues', label: 'Suma 8', unit: 'mm', color: '#7c3aed', goodDown: true },
  { key: 'perimetro_muslo_derecho', label: 'Muslo der.', unit: 'cm', color: '#0891b2', goodDown: null },
  { key: 'perimetro_muslo_izquierdo', label: 'Muslo izq.', unit: 'cm', color: '#0d9488', goodDown: null },
  { key: 'perimetro_pantorrilla_derecha', label: 'Pantorrilla der.', unit: 'cm', color: '#65a30d', goodDown: null },
  { key: 'perimetro_pantorrilla_izquierda', label: 'Pantorrilla izq.', unit: 'cm', color: '#ea580c', goodDown: null },
];

export const MEASUREMENT_DETAIL_SECTIONS = [
  {
    title: 'Básicas',
    fields: [
      { key: 'peso_kg', label: 'Peso', unit: 'kg' },
      { key: 'altura_cm', label: 'Altura', unit: 'cm' },
      { key: 'porcentaje_grasa', label: 'Grasa Faulkner', unit: '%' },
      { key: 'peso_graso', label: 'Peso graso', unit: 'kg' },
      { key: 'porcentaje_musculo', label: '% Músculo Lee', unit: '%' },
      { key: 'peso_muscular', label: 'Masa muscular (Lee)', unit: 'kg' },
    ],
  },
  {
    title: 'Pliegues',
    fields: [
      { key: 'pliegue_biceps', label: 'Bíceps', unit: 'mm' },
      { key: 'pliegue_triceps', label: 'Tríceps', unit: 'mm' },
      { key: 'pliegue_subescapular', label: 'Subescapular', unit: 'mm' },
      { key: 'pliegue_cresta_iliaca', label: 'Cresta ilíaca', unit: 'mm' },
      { key: 'pliegue_supraeliaco', label: 'Suprailíaco', unit: 'mm' },
      { key: 'pliegue_abdominal', label: 'Abdominal', unit: 'mm' },
      { key: 'pliegue_pantorrilla', label: 'Pantorrilla', unit: 'mm' },
      { key: 'pliegue_muslo', label: 'Muslo', unit: 'mm' },
      { key: 'suma_6_pliegues', label: 'Suma 6 pliegues', unit: 'mm' },
      { key: 'suma_8_pliegues', label: 'Suma 8 pliegues', unit: 'mm' },
    ],
  },
  {
    title: 'Perímetros',
    fields: [
      { key: 'perimetro_brazo_contraido', label: 'Brazo contraído derecho', unit: 'cm' },
      { key: 'perimetro_brazo_relajado', label: 'Brazo relajado derecho', unit: 'cm' },
      { key: 'perimetro_antebrazo', label: 'Antebrazo derecho', unit: 'cm' },
      { key: 'perimetro_muneca', label: 'Muñeca derecha', unit: 'cm' },
      { key: 'perimetro_muslo_derecho', label: 'Muslo derecho', unit: 'cm' },
      { key: 'perimetro_muslo_izquierdo', label: 'Muslo izquierdo', unit: 'cm' },
      { key: 'perimetro_pantorrilla_derecha', label: 'Pantorrilla derecha', unit: 'cm' },
      { key: 'perimetro_pantorrilla_izquierda', label: 'Pantorrilla izquierda', unit: 'cm' },
    ],
  },
  {
    title: 'Diámetros',
    fields: [
      { key: 'diametro_humero', label: 'Húmero (codo)', unit: 'cm' },
      { key: 'diametro_femur', label: 'Fémur (rodilla)', unit: 'cm' },
      { key: 'diametro_muneca', label: 'Biestiloideo (muñeca)', unit: 'cm' },
    ],
  },
  {
    title: 'Composición',
    fields: [
      { key: 'porcentaje_grasa_yuhasz', label: 'Grasa Yuhasz', unit: '%' },
      { key: 'peso_magro', label: 'Peso magro', unit: 'kg' },
      { key: 'peso_oseo', label: 'Masa ósea', unit: 'kg' },
      { key: 'peso_residual', label: 'Masa residual', unit: 'kg' },
      { key: 'peso_deseable', label: 'Peso deseable', unit: 'kg' },
    ],
  },
  {
    title: 'Somatotipo',
    fields: [
      { key: 'endomorfia', label: 'Endomorfia' },
      { key: 'mesomorfia', label: 'Mesomorfia' },
      { key: 'ectomorfia', label: 'Ectomorfia' },
      { key: 'somatocarta_x', label: 'Somatocarta (Eje X)' },
      { key: 'somatocarta_y', label: 'Somatocarta (Eje Y)' },
      { key: 'indice_ponderal', label: 'Índice Ponderal' },
    ],
  },
];

export function hasMetricValue(value) {
  return value !== null && value !== undefined && value !== '';
}

export function metricValue(record, metric) {
  if (!record || !metric) return null;

  // Direct column match
  if (hasMetricValue(record[metric.key])) return record[metric.key];

  // Specific fallbacks for % músculo
  if (metric.key === 'porcentaje_musculo') {
    if (record.metricas_excel && typeof record.metricas_excel === 'object') {
      for (const k of ['%Peso Muscular Lee&cols', '% Peso Muscular Lee&cols', '%Peso Muscular Lee']) {
        if (hasMetricValue(record.metricas_excel[k])) return record.metricas_excel[k];
      }
    }
    if (hasMetricValue(record.peso_muscular) && hasMetricValue(record.peso_kg) && Number(record.peso_kg) > 0) {
      const pct = (Number(record.peso_muscular) / Number(record.peso_kg)) * 100;
      return Number(pct.toFixed(2));
    }
    return null;
  }

  // Specific fallbacks for % grasa
  if (metric.key === 'porcentaje_grasa') {
    if (hasMetricValue(record.porcentaje_grasa_faulkner)) return record.porcentaje_grasa_faulkner;
    if (hasMetricValue(record.porcentaje_grasa_yuhasz)) return record.porcentaje_grasa_yuhasz;
    return null;
  }

  // Specific fallbacks for peso magro / masa magra
  if (metric.key === 'peso_magro' || metric.key === 'masa_magra_kg') {
    if (hasMetricValue(record.peso_magro)) return record.peso_magro;
    if (hasMetricValue(record.masa_magra_kg)) return record.masa_magra_kg;
    if (hasMetricValue(record.peso_kg) && hasMetricValue(record.porcentaje_grasa)) {
      const p = Number(record.peso_kg);
      const g = Number(record.porcentaje_grasa);
      if (Number.isFinite(p) && Number.isFinite(g)) {
        return Number((p * (1 - g / 100)).toFixed(2));
      }
    }
    return null;
  }

  // Fallbacks for peso muscular in kg if % is present
  if (metric.key === 'peso_muscular') {
    if (hasMetricValue(record.porcentaje_musculo) && hasMetricValue(record.peso_kg)) {
      const p = Number(record.peso_kg);
      const pm = Number(record.porcentaje_musculo);
      if (Number.isFinite(p) && Number.isFinite(pm)) {
        return Number((p * (pm / 100)).toFixed(2));
      }
    }
    return null;
  }

  // Check custom fallback keys if any
  for (const fallbackKey of metric.fallbackKeys || []) {
    if (hasMetricValue(record[fallbackKey])) return record[fallbackKey];
  }

  // Check raw excel keys if specified
  if (metric.excelKeys && record.metricas_excel && typeof record.metricas_excel === 'object') {
    for (const k of metric.excelKeys) {
      if (hasMetricValue(record.metricas_excel[k])) return record.metricas_excel[k];
    }
  }

  return null;
}

export function formatMetricNumber(value, digits = 2) {
  if (!hasMetricValue(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(digits)) : null;
}

export function formatMetricValue(value, unit = '') {
  if (!hasMetricValue(value)) return '-';
  const n = formatMetricNumber(value);
  const display = n === null ? String(value) : String(n);
  return unit ? `${display} ${unit}` : display;
}

export function getSeason(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return null;
  if (month >= 7) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}


