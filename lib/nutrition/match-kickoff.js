// Hora de inicio de los partidos del plan. El plan del jugador es la fuente de verdad: cada día
// «partido» guarda en preMatchConfig.partidos[dayKey] su horario (mañana/tarde/noche) y, si se
// conoce, la hora exacta de inicio ('HH:MM'). Sin hora exacta se usa la orientativa del horario.

export const MATCH_SCHEDULES = ['manana', 'tarde', 'noche'];
const DEFAULT_MATCH_SCHEDULE = 'tarde';
// Hora orientativa cuando el partido solo tiene horario y no hora exacta
export const DEFAULT_KICKOFF = { manana: '12:00', tarde: '18:30', noche: '21:00' };

const HOUR_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 'HH:MM' válida o null. */
export function normalizeKickoff(value) {
  const text = String(value ?? '').trim();
  return HOUR_RE.test(text) ? text : null;
}

/** Horario (mañana/tarde/noche) a partir de la hora de inicio 'HH:MM'. */
export function scheduleFromHour(hhmm) {
  const hour = Number(String(hhmm).split(':')[0]);
  if (hour < 15) return 'manana';
  if (hour < 20) return 'tarde';
  return 'noche';
}

/**
 * Inicio del partido de un día del plan: { horario, hora, exacta }.
 * Con hora exacta el horario sale de ella, para que plan y línea de tiempo no se contradigan.
 */
export function resolveMatchKickoff(preMatchConfig, dayKey) {
  const day = preMatchConfig?.partidos?.[dayKey] || {};
  const hora = normalizeKickoff(day.hora);
  if (hora) return { horario: scheduleFromHour(hora), hora, exacta: true };
  const stored = day.horario || preMatchConfig?.horario;
  const horario = MATCH_SCHEDULES.includes(stored) ? stored : DEFAULT_MATCH_SCHEDULE;
  return { horario, hora: DEFAULT_KICKOFF[horario], exacta: false };
}
