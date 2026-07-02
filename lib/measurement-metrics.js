export const TREND_MEASUREMENT_METRICS = [
  { key: 'peso_kg', label: 'Peso', unit: 'kg', color: '#2563eb', goodDown: null },
  { key: 'porcentaje_grasa', label: '% grasa', unit: '%', color: '#dc2626', goodDown: true },
  { key: 'masa_magra_kg', label: 'Masa magra', unit: 'kg', color: '#16a34a', goodDown: false },
  { key: 'suma_6_pliegues', label: 'Suma 6', unit: 'mm', color: '#d97706', goodDown: true },
  { key: 'suma_8_pliegues', label: 'Suma 8', unit: 'mm', color: '#7c3aed', goodDown: true },
  { key: 'perimetro_muslo_derecho', label: 'Muslo der.', unit: 'cm', color: '#0891b2', goodDown: null, fallbackKeys: ['perimetro_muslo'] },
  { key: 'perimetro_muslo_izquierdo', label: 'Muslo izq.', unit: 'cm', color: '#0d9488', goodDown: null },
  { key: 'perimetro_pantorrilla_derecha', label: 'Pantorrilla der.', unit: 'cm', color: '#65a30d', goodDown: null, fallbackKeys: ['perimetro_pantorrilla'] },
  { key: 'perimetro_pantorrilla_izquierda', label: 'Pantorrilla izq.', unit: 'cm', color: '#ea580c', goodDown: null },
];

export const MEASUREMENT_DETAIL_SECTIONS = [
  {
    title: 'Básicas',
    fields: [
      { key: 'altura_cm', label: 'Altura', unit: 'cm' },
      { key: 'peso_kg', label: 'Peso', unit: 'kg' },
      { key: 'porcentaje_grasa', label: '% grasa', unit: '%' },
      { key: 'masa_magra_kg', label: 'Masa magra', unit: 'kg' },
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
      { key: 'perimetro_muslo_derecho', label: 'Muslo derecho', unit: 'cm', fallbackKeys: ['perimetro_muslo'] },
      { key: 'perimetro_muslo_izquierdo', label: 'Muslo izquierdo', unit: 'cm' },
      { key: 'perimetro_pantorrilla_derecha', label: 'Pantorrilla derecha', unit: 'cm', fallbackKeys: ['perimetro_pantorrilla'] },
      { key: 'perimetro_pantorrilla_izquierda', label: 'Pantorrilla izquierda', unit: 'cm' },
    ],
  },
  {
    title: 'Composición',
    fields: [
      { key: 'porcentaje_grasa_faulkner', label: '% grasa Faulkner', unit: '%' },
      { key: 'porcentaje_grasa_yuhasz', label: '% grasa Yuhasz', unit: '%' },
      { key: 'peso_oseo', label: 'Peso óseo', unit: 'kg' },
      { key: 'peso_residual', label: 'Peso residual', unit: 'kg' },
      { key: 'peso_graso', label: 'Peso graso', unit: 'kg' },
      { key: 'peso_muscular', label: 'Peso muscular', unit: 'kg' },
      { key: 'peso_magro', label: 'Peso magro', unit: 'kg' },
      { key: 'peso_deseable', label: 'Peso deseable', unit: 'kg' },
    ],
  },
  {
    title: 'Somatotipo',
    fields: [
      { key: 'endomorfia', label: 'Endomorfia' },
      { key: 'mesomorfia', label: 'Mesomorfia' },
      { key: 'ectomorfia', label: 'Ectomorfia' },
    ],
  },
];

export function hasMetricValue(value) {
  return value !== null && value !== undefined && value !== '';
}

export function metricValue(record, metric) {
  if (!record || !metric) return null;
  if (hasMetricValue(record[metric.key])) return record[metric.key];
  for (const fallbackKey of metric.fallbackKeys || []) {
    if (hasMetricValue(record[fallbackKey])) return record[fallbackKey];
  }
  return null;
}

export function formatMetricNumber(value, digits = 1) {
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

