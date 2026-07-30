import { cleanText } from './utils';

export function formatSupplementDose(suplemento, peso, override) {
  if (override) return { value: override, needsWeight: false };

  if (suplemento?.dose_type === 'per_kg_range') {
    if (!peso) {
      return { value: suplemento.dose_text || suplemento.pauta || 'Según peso', needsWeight: true };
    }

    const min = Math.round(Number(suplemento.dose_min || 0) * peso);
    const max = Math.round(Number(suplemento.dose_max || 0) * peso);
    const unit = suplemento.dose_unit || '';

    if (min === max) {
      return { value: `${min} ${unit}`.trim(), needsWeight: false };
    }
    return { value: `${min}-${max} ${unit}`.trim(), needsWeight: false };
  }

  return {
    value: suplemento?.dose_text || suplemento?.pauta || 'Según pauta',
    needsWeight: false,
  };
}

export function resolvePlayerSupplementsData({ suplementos = [], items = [], asignacion = null, extras = [], peso = null }) {
  const supplementMap = new Map((suplementos || []).map((s) => [Number(s.id), s]));
  const activeListId = Number(asignacion?.lista_id || 0);
  const extrasBySupplement = new Map((extras || []).map((extra) => [Number(extra.suplemento_id), extra]));
  const used = new Set();

  const baseItems = (items || [])
    .filter((item) => Number(item.lista_id) === activeListId)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
    .map((item) => {
      const suplemento = supplementMap.get(Number(item.suplemento_id));
      if (!suplemento) return null;
      const extra = extrasBySupplement.get(Number(item.suplemento_id));
      used.add(Number(item.suplemento_id));

      const dose = formatSupplementDose(suplemento, peso, extra?.dose_override);
      const timing = extra?.timing_override || suplemento.timing || 'Según pauta';
      const notas = extra?.note_override || suplemento.descripcion || suplemento.notas || '';

      return {
        id: suplemento.id,
        nombre: suplemento.nombre,
        categoria: suplemento.categoria || 'Suplemento',
        dosis: dose.value,
        timing: cleanText(timing),
        notas: cleanText(notas),
        source: 'list',
      };
    })
    .filter(Boolean);

  const extraItems = (extras || [])
    .filter((extra) => !used.has(Number(extra.suplemento_id)))
    .map((extra) => {
      const suplemento = supplementMap.get(Number(extra.suplemento_id));
      if (!suplemento) return null;

      const dose = formatSupplementDose(suplemento, peso, extra.dose_override);
      const timing = extra.timing_override || suplemento.timing || 'Según pauta';
      const notas = extra.note_override || suplemento.descripcion || suplemento.notas || '';

      return {
        id: suplemento.id,
        nombre: suplemento.nombre,
        categoria: suplemento.categoria || 'Suplemento',
        dosis: dose.value,
        timing: cleanText(timing),
        notas: cleanText(notas),
        source: 'extra',
      };
    })
    .filter(Boolean);

  return [...baseItems, ...extraItems];
}
