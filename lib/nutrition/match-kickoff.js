// Hora de inicio de los partidos. El plan de cada jugador decide qué días juega y con qué horario
// (mañana/tarde/noche, en preMatchConfig.partidos[dayKey]); la hora exacta de ese día la pone el
// staff en la sección Partidos del equipo. Sin hora exacta se usa la orientativa del horario.

export const MATCH_SCHEDULES = ['manana', 'tarde', 'noche'];
const DEFAULT_MATCH_SCHEDULE = 'tarde';
// Hora orientativa cuando el partido solo tiene horario y no hora exacta
export const DEFAULT_KICKOFF = { manana: '12:00', tarde: '18:30', noche: '21:00' };

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/** Día del plan semanal ('lunes'…'domingo') de una fecha 'YYYY-MM-DD'. */
export const weekdayKey = (dateKey) => DAY_KEYS[new Date(`${dateKey}T12:00:00Z`).getUTCDay()];

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

/** Horario (mañana/tarde/noche) del partido de un día según el plan; tarde si no se eligió. */
function planMatchSchedule(preMatchConfig, dayKey) {
  const stored = preMatchConfig?.partidos?.[dayKey]?.horario || preMatchConfig?.horario;
  return MATCH_SCHEDULES.includes(stored) ? stored : DEFAULT_MATCH_SCHEDULE;
}

/**
 * Inicio del partido de un día: { horario, hora, exacta }. El horario es siempre el del plan (con él
 * se pautaron las comidas); la hora es la exacta del equipo para esa fecha o, si no hay, la orientativa.
 */
export function resolveMatchKickoff(preMatchConfig, dayKey, teamKickoff = null) {
  const horario = planMatchSchedule(preMatchConfig, dayKey);
  const hora = normalizeKickoff(teamKickoff);
  return hora ? { horario, hora, exacta: true } : { horario, hora: DEFAULT_KICKOFF[horario], exacta: false };
}

/**
 * Días de partido del equipo en las fechas dadas, a partir del último plan semanal de cada jugador.
 * Solo aparece una fecha si algún plan la marca como «partido», y solo con esos jugadores.
 * @param {string[]} fechas 'YYYY-MM-DD' en orden
 * @param {Array<{ id, nombre?, apellidos?, plan?: { dias?, meta? } }>} players
 * @param {Array<{ fecha: string, hora: string }>} kickoffs horas fijadas por el staff
 * @returns {Array<{ fecha, dayKey, hora: string|null, jugadores: Array<{ id, nombre, horario }> }>}
 */
export function collectTeamMatchDays(fechas, players, kickoffs = []) {
  return fechas
    .map((fecha) => {
      const dayKey = weekdayKey(fecha);
      const jugadores = players
        .filter((p) => p.plan?.dias?.[dayKey]?.tipoDia === 'partido')
        .map((p) => ({
          id: p.id,
          nombre: [p.nombre, p.apellidos].filter(Boolean).join(' ') || 'Jugador',
          horario: planMatchSchedule(p.plan?.meta?.preMatchConfig, dayKey),
        }));
      const hora = normalizeKickoff(kickoffs.find((k) => k.fecha === fecha)?.hora);
      return { fecha, dayKey, hora, jugadores };
    })
    .filter((day) => day.jugadores.length > 0);
}
