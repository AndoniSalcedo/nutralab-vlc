// Modos de plan nutricional (columna `planes_ia.modo` y `datos.meta.modo`).
// - semana: lunes a domingo según el calendario de la semana, con menú de comedor y víspera de partido.
// - tipos: N opciones por tipo de día (p. ej. 3 de partido, 3 de descanso), sin menú ni víspera.
export const PLAN_MODES = {
  SEMANA: 'semana',
  TIPOS: 'tipos',
};

export const WEEK_DAY_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export const WEEK_DAY_LABELS = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

// Tope de opciones de un plan por tipos: la ficha y el PDF se maquetan en una página.
export const MAX_TYPE_PLAN_DAYS = 12;

export function isValidPlanMode(modo) {
  return Object.values(PLAN_MODES).includes(modo);
}

/** Claves de los días del plan en el orden en que se muestran. */
export function getPlanDayKeys(meta) {
  return meta?.modo === PLAN_MODES.TIPOS ? (meta.ordenDias || []) : WEEK_DAY_KEYS;
}

/** Reparte los días del plan en las dos columnas de la ficha (la izquierda se queda con el impar). */
export function splitPlanDayColumns(meta) {
  const keys = getPlanDayKeys(meta);
  const half = Math.ceil(keys.length / 2);
  return [keys.slice(0, half), keys.slice(half)];
}
