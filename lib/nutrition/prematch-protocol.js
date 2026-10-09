import {
  getUserMeals,
  isMainMeal,
  isPreMatchMatchDayMeal,
  isPreMatchPreviousDayMeal,
  sortPreMatchMealsChronological,
} from '@/config/nutrition-days';

/**
 * Protocolo de partido de cada jugador: todo jugador tiene protocolo para cada horario de partido, de modo que las tomas
 * de la víspera y previas al partido siempre se generan con las reglas del protocolo (sin alimentos altos en fibra ni FODMAP).
 *
 * Cada toma del protocolo es:
 * - manual (`origen: 'manual'`): la ha escrito el nutricionista; nunca se toca;
 * - por defecto (`origen: 'defecto'`): copia de la pauta habitual de esa toma (o rotación variada si no tiene). Se
 *   rehace cada vez que cambian las comidas o las pautas del jugador, así que siempre coincide con lo que come.
 *
 * Lo manual manda: una toma manual se conserva aunque el jugador ya no tenga esa comida.
 */

const PREMATCH_SCHEDULES = ['manana', 'tarde', 'noche'];
export const PROTOCOL_ORIGIN = { DEFAULT: 'defecto', MANUAL: 'manual' };

const isPostMeal = (meal) => String(meal || '').toLowerCase().includes('post');
const findMealKey = (patterns, meal) => Object.keys(patterns || {})
  .find((key) => key.toLowerCase().trim() === String(meal).toLowerCase().trim());

/** Toma del protocolo que sigue la pauta habitual. Sin origen (datos anteriores), una rotación vacía no la escribió nadie. */
export function isDefaultProtocolMeal(pattern) {
  if (!pattern) return true;
  if (pattern.origen) return pattern.origen === PROTOCOL_ORIGIN.DEFAULT;
  return pattern.type === 'complete' && !String(pattern.raw || '').trim();
}

/** Tomas del jugador que cubre el protocolo de un horario: las de la víspera y las previas al partido. */
export function getProtocolMeals(jugador, schedule) {
  return getUserMeals(jugador)
    .filter((meal) => !isPostMeal(meal))
    .filter((meal) => isPreMatchPreviousDayMeal(schedule, meal) || isPreMatchMatchDayMeal(schedule, meal));
}

/** Toma por defecto: la pauta habitual del jugador para esa comida, o rotación variada si no tiene. */
export function buildDefaultProtocolMeal(meal, recomendacionesDefecto = {}) {
  const habitualKey = findMealKey(recomendacionesDefecto, meal);
  const habitual = habitualKey ? recomendacionesDefecto[habitualKey] : null;
  const base = habitual?.type
    ? JSON.parse(JSON.stringify(habitual))
    : { type: 'complete', label: 'Rotación variada', raw: '', unrecognized: [] };
  delete base.origen;
  return { ...base, isMainMeal: base.isMainMeal ?? isMainMeal(meal), origen: PROTOCOL_ORIGIN.DEFAULT };
}

/**
 * Protocolo completo del jugador: conserva lo manual y rehace las tomas por defecto con sus comidas y pautas actuales.
 * Es idempotente: aplicarlo dos veces da el mismo resultado.
 */
export function syncPreMatchProtocol(jugador) {
  const current = jugador?.config_prepartido && typeof jugador.config_prepartido === 'object'
    ? jugador.config_prepartido
    : {};
  const habitual = jugador?.recomendaciones_defecto || {};
  const next = { ...current };

  for (const schedule of PREMATCH_SCHEDULES) {
    const cfg = current[schedule] || {};
    const recomendaciones = Object.fromEntries(
      Object.entries(cfg.recomendaciones || {}).filter(([, pattern]) => !isDefaultProtocolMeal(pattern))
    );
    const protocolMeals = getProtocolMeals(jugador, schedule);
    for (const meal of protocolMeals) {
      if (!findMealKey(recomendaciones, meal)) recomendaciones[meal] = buildDefaultProtocolMeal(meal, habitual);
    }
    const ingestas = sortPreMatchMealsChronological(
      schedule,
      Array.from(new Set([...protocolMeals, ...Object.keys(recomendaciones)]))
    );
    next[schedule] = { ...cfg, ingestas, recomendaciones };
  }

  return next;
}
