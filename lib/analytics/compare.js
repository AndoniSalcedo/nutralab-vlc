function hasValue(v) {
  return v !== null && v !== undefined && v !== '';
}

// Distancia del valor al rango de referencia (0 si está dentro o no hay rango).
function distanceOutside(p) {
  const value = Number(p.valor);
  if (!Number.isFinite(value)) return 0;
  const min = hasValue(p.rango_min) ? Number(p.rango_min) : null;
  const max = hasValue(p.rango_max) ? Number(p.rango_max) : null;
  if (Number.isFinite(min) && value < min) return min - value;
  if (Number.isFinite(max) && value > max) return value - max;
  return 0;
}

export function sortByDateDesc(records = []) {
  return [...records].sort((a, b) => String(b.fecha_extraccion || '').localeCompare(String(a.fecha_extraccion || '')));
}

// Compara dos analíticas parámetro a parámetro (por nombre).
// trend: 'mejora' (se acerca al rango), 'empeora' (se aleja), 'estable'.
export function compareRecords(current, previous) {
  const prevMap = new Map((previous?.parametros || []).map((p) => [p.nombre, p]));
  return (current?.parametros || [])
    .filter((p) => prevMap.has(p.nombre))
    .map((p) => {
      const prev = prevMap.get(p.nombre);
      const valor = Number(p.valor);
      const anterior = Number(prev.valor);
      const delta = valor - anterior;
      const pct = anterior !== 0 && Number.isFinite(delta) ? (delta / Math.abs(anterior)) * 100 : null;
      const distNow = distanceOutside(p);
      const distBefore = distanceOutside({ ...p, valor: anterior });
      let trend = 'estable';
      if (distNow < distBefore) trend = 'mejora';
      else if (distNow > distBefore) trend = 'empeora';
      return {
        nombre: p.nombre,
        unidad: p.unidad || prev.unidad || '',
        valor,
        anterior,
        delta,
        pct,
        trend,
        parametro: p,
        previo: prev,
      };
    });
}

export function formatDelta(delta) {
  if (!Number.isFinite(delta)) return '—';
  const rounded = Math.round(delta * 100) / 100;
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

export const TREND_META = {
  mejora: { color: 'salvia', label: 'Mejora' },
  empeora: { color: 'arcilla', label: 'Empeora' },
  estable: { color: 'gray', label: 'Estable' },
};
