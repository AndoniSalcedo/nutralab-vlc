// Línea de tiempo del día de partido de un jugador, por horas respecto al inicio (H-4, H-1, descanso…).
// Se construye con su protocolo de partido (config_prepartido), los protocolos del equipo para el
// tipo de día «partido» (con sus versiones personalizadas) y su estrategia de hidratación.
import { isPreMatchMatchDayMeal, isPreMatchPreviousDayMeal, sortPreMatchMealsChronological } from '@/config/nutrition-days';
import { shiftDateKey } from '@/lib/dates';

const MATCH_SCHEDULES = ['manana', 'tarde', 'noche'];
// Hora orientativa cuando el partido solo tiene horario (plan semanal) y no hora exacta
export const DEFAULT_KICKOFF = { manana: '12:00', tarde: '18:30', noche: '21:00' };
const MATCH_MINUTES = 105; // 90 + descanso
const MIN_GAP_BETWEEN_MEALS = 120;

// Víspera: hora de reloj. Día de partido: número = minutos respecto al inicio; texto = hora de reloj
const EVE_MEALS = { merienda: '17:30', cena: '21:00' };
const MATCHDAY_MEALS = {
  manana: { desayuno: -210, almuerzo: -120 },
  tarde: { desayuno: '09:00', almuerzo: '11:30', comida: -240 },
  noche: { desayuno: '09:30', almuerzo: '12:00', comida: '14:00', merienda: -180 },
};

const norm = (value) => String(value || '').trim().toLowerCase();
const capitalize = (value) => String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);

/** Horario (mañana/tarde/noche) a partir de la hora de inicio 'HH:MM'. */
function scheduleFromHour(hhmm) {
  const hour = Number(String(hhmm).split(':')[0]);
  if (hour < 15) return 'manana';
  if (hour < 20) return 'tarde';
  return 'noche';
}

/** Instante (Date) de un día 'YYYY-MM-DD' y hora 'HH:MM' en Europe/Madrid. */
export function madridDateTime(dateKey, hhmm) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [h, mi] = String(hhmm).split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi || 0);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(guess));
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  const asLocal = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
  return new Date(guess - (asLocal - guess));
}

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

// '-3h', '-90m', '-1h30', '3 h', 'Post', 'Post +30m', 'Descanso' → minutos respecto al inicio
function parseTimeLabel(label) {
  const text = norm(label);
  if (!text) return null;
  const amount = (str) => {
    const match = str.match(/(\d+(?:[.,]\d+)?)\s*(h|hora|horas)?\s*(\d+)?\s*(m|min|mins|minutos|')?/);
    if (!match) return null;
    const value = Number(match[1].replace(',', '.'));
    if (match[2]) return value * 60 + (Number(match[3]) || 0);
    return value;
  };
  if (/post|final|despu/.test(text)) return MATCH_MINUTES + (amount(text) ?? 15);
  if (/descanso|medio tiempo|mt\b/.test(text)) return 45;
  const minutes = amount(text);
  if (minutes == null) return null;
  return text.startsWith('+') ? minutes : -minutes;
}

// Pauta de una toma del protocolo: { type, label, raw, … }
function describePattern(pattern) {
  if (!pattern) return null;
  const raw = String(pattern.raw || '').trim();
  if (raw) return raw;
  if (pattern.type === 'complete') return 'Tu pauta habitual, sin alimentos altos en fibra ni FODMAP.';
  return String(pattern.label || '').trim() || null;
}

function findPattern(recomendaciones, meal) {
  const key = Object.keys(recomendaciones || {}).find((k) => norm(k) === norm(meal));
  return key ? recomendaciones[key] : null;
}

// Protocolos del equipo para «partido», con la versión personalizada del jugador si la tiene
function matchProtocols(jugador) {
  const teamProtocols = jugador?.equipos?.configuracion_nutricional?.protocols || [];
  const customs = jugador?.protocolos_custom || {};
  return teamProtocols
    .filter((p) => norm(p?.dayTypeKey) === 'partido')
    .map((p) => customs[p.id] || p);
}

function clockOrOffset(value, dateKey, kickoff) {
  return typeof value === 'number' ? addMinutes(kickoff, value) : madridDateTime(dateKey, value);
}

/**
 * @param {{ jugador: object, match: { fecha: string, hora: string, rival?: string, lugar?: string, horario?: string }, strategy?: object|null }} input
 * @returns {{ kickoff: string, horario: string, steps: Array<{ id, at, title, detail, icon, kind, push }> }}
 */
export function buildMatchTimeline({ jugador, match, strategy = null }) {
  const horario = MATCH_SCHEDULES.includes(match.horario) ? match.horario : scheduleFromHour(match.hora);
  const kickoff = madridDateTime(match.fecha, match.hora);
  const protocol = jugador?.config_prepartido?.[horario] || {};
  const recomendaciones = protocol.recomendaciones || {};
  const ingestas = sortPreMatchMealsChronological(horario, Array.isArray(protocol.ingestas) ? protocol.ingestas : []);
  const steps = [];

  // --- Víspera ---
  const eveKey = shiftDateKey(match.fecha, -1);
  ingestas.filter((meal) => isPreMatchPreviousDayMeal(horario, meal)).forEach((meal) => {
    const time = EVE_MEALS[norm(meal)];
    if (!time) return;
    steps.push({
      id: `vispera-${norm(meal)}`,
      at: madridDateTime(eveKey, time),
      title: `${capitalize(meal)} de la víspera`,
      detail: describePattern(findPattern(recomendaciones, meal)) || 'Carga de hidratos para llegar con el depósito lleno.',
      icon: 'moon',
      kind: 'meal',
      push: true,
    });
  });

  // --- Tomas del día de partido (separadas al menos 2 h entre sí) ---
  const offsets = MATCHDAY_MEALS[horario] || {};
  const dayMeals = ingestas
    .filter((meal) => isPreMatchMatchDayMeal(horario, meal) && offsets[norm(meal)] !== undefined)
    .map((meal) => ({ meal, at: clockOrOffset(offsets[norm(meal)], match.fecha, kickoff) }));
  for (let i = dayMeals.length - 2; i >= 0; i -= 1) {
    const latest = addMinutes(dayMeals[i + 1].at, -MIN_GAP_BETWEEN_MEALS);
    if (dayMeals[i].at > latest) dayMeals[i].at = latest;
  }
  dayMeals.forEach(({ meal, at }, index) => {
    const isLast = index === dayMeals.length - 1;
    steps.push({
      id: `toma-${norm(meal)}`,
      at,
      title: isLast ? `${capitalize(meal)} pre-partido` : capitalize(meal),
      detail: describePattern(findPattern(recomendaciones, meal)) || (isLast ? 'Hidratos de fácil digestión y proteína magra; poca grasa y fibra.' : 'Tu toma habitual del día de partido.'),
      icon: isLast ? 'pasta' : 'coffee',
      kind: 'meal',
      push: true,
    });
  });

  // --- Hidratación ---
  const plan = strategy?.plan;
  steps.push({
    id: 'hidratacion-previa',
    at: addMinutes(kickoff, -180),
    title: 'Hidratación previa',
    detail: plan
      ? `${plan.pre.minMl}-${plan.pre.maxMl} ml (5-7 ml/kg) de aquí al calentamiento, a sorbos.`
      : '400-600 ml de agua o isotónica de aquí al calentamiento, a sorbos.',
    icon: 'water_bottle',
    kind: 'hydration',
    push: true,
  });
  steps.push({
    id: 'calentamiento',
    at: addMinutes(kickoff, -20),
    title: 'Antes de salir',
    detail: '150-250 ml tras el calentamiento.',
    icon: 'running',
    kind: 'hydration',
    push: false,
  });

  // --- Protocolos del equipo ---
  matchProtocols(jugador).forEach((p) => {
    (Array.isArray(p.timeline) ? p.timeline : []).forEach((item, index) => {
      const offset = parseTimeLabel(item?.timeLabel);
      if (offset == null || !item?.title) return;
      steps.push({
        id: `protocolo-${p.id}-${item.id || index}`,
        at: addMinutes(kickoff, offset),
        title: item.title,
        detail: item.description || p.name || null,
        icon: 'flag',
        kind: 'protocol',
        // Durante el partido no se mira el móvil; tras el final ya avisa el paso de recuperación
        push: offset <= -45,
      });
    });
  });

  // --- Partido, descanso y recuperación ---
  steps.push({
    id: 'inicio',
    at: kickoff,
    title: match.rival ? `Partido vs ${match.rival}` : 'Inicio del partido',
    detail: match.lugar || null,
    icon: 'soccer',
    kind: 'match',
    push: false,
  });
  steps.push({
    id: 'descanso',
    at: addMinutes(kickoff, 45),
    title: 'Descanso',
    detail: plan
      ? `~${plan.during.halftimeMl} ml y ${Math.round(plan.carbsG[0] / 2)}-${Math.round(plan.carbsG[1] / 2)} g de hidratos (gel o isotónica).`
      : '250-500 ml de isotónica y un gel si lo usas.',
    icon: 'alarmclock',
    kind: 'hydration',
    push: false,
  });
  const postPattern = findPattern(recomendaciones, 'Post-partido');
  steps.push({
    id: 'recuperacion',
    at: addMinutes(kickoff, MATCH_MINUTES + 15),
    title: 'Recuperación',
    detail: [
      describePattern(postPattern) || 'Hidratos y proteína en los 30-60 min siguientes.',
      'Rehidrata 1,25-1,5 L por kg perdido, con sal.',
    ].join(' '),
    icon: 'battery',
    kind: 'recovery',
    push: true,
  });

  steps.sort((a, b) => a.at - b.at);
  return {
    kickoff: kickoff.toISOString(),
    horario,
    steps: steps.map((step) => ({ ...step, at: step.at.toISOString() })),
  };
}
