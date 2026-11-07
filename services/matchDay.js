// Día de partido del jugador: próximo partido (según su plan semanal),
// su estrategia de hidratación y la línea de tiempo por horas. Sin comprobación de acceso.
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerId } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerId } from '@/repositories/pesajeRepository';
import { getHydrationRecordsByPlayerId } from '@/repositories/hydrationRepository';
import { getIntrapartidoHistoryByPlayerId } from '@/repositories/intrapartidoRepository';
import { getLatestAiPlanByPlayerId } from '@/repositories/aiPlanRepository';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { resolveMatchKickoff } from '@/lib/nutrition/match-kickoff';
import { PLAN_MODES } from '@/config/plan-modes';
import { toDateKey, shiftDateKey } from '@/lib/dates';
import { buildHydrationStrategy } from '@/lib/nutrition/hydration-strategy';
import { buildMatchTimeline, madridDateTime } from '@/lib/nutrition/match-timeline';

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
// La línea de tiempo se mantiene hasta pasada la recuperación
const VISIBLE_AFTER_KICKOFF_MS = 3 * 60 * 60 * 1000;

const weekdayKey = (dateKey) => DAY_KEYS[new Date(`${dateKey}T12:00:00Z`).getUTCDay()];

/**
 * Próximo partido de hoy o mañana según el último plan semanal del jugador (la fuente de verdad):
 * un día «partido» con la hora exacta que se puso al hacer el plan o, si no, la orientativa de su horario.
 */
async function resolveUpcomingMatch(db, jugador, now = new Date()) {
  const today = toDateKey(now);
  const plan = await getLatestAiPlanByPlayerId(db, jugador.id, { modo: PLAN_MODES.SEMANA }).catch(() => null);
  const dias = plan?.datos?.dias || {};
  for (const fecha of [today, shiftDateKey(today, 1)]) {
    const dayKey = weekdayKey(fecha);
    if (dias[dayKey]?.tipoDia !== 'partido') continue;
    const { horario, hora, exacta } = resolveMatchKickoff(plan.datos?.meta?.preMatchConfig, dayKey);
    if (madridDateTime(fecha, hora).getTime() + VISIBLE_AFTER_KICKOFF_MS > now.getTime()) {
      return { fecha, hora, horario, rival: '', lugar: '', approximate: !exacta };
    }
  }
  return null;
}

/** Todo lo que necesita la vista del día de partido, o null si no hay partido hoy ni mañana. */
export async function buildPlayerMatchDay(db, jugadorId, now = new Date()) {
  const raw = await getPlayerWithTeamConfig(db, jugadorId).catch(() => null);
  if (!raw) return null;

  const match = await resolveUpcomingMatch(db, raw, now);
  if (!match) return null;

  const [evoluciones, pesajes, registrosHidratacion, historialIntrapartido] = await Promise.all([
    getEvolutionsByPlayerId(db, jugadorId),
    getPesajesByPlayerId(db, jugadorId),
    getHydrationRecordsByPlayerId(db, jugadorId),
    getIntrapartidoHistoryByPlayerId(db, jugadorId).catch(() => []),
  ]);
  const jugador = withLatestMeasurement(raw, evoluciones, pesajes);
  const strategy = buildHydrationStrategy({
    jugadorId,
    weightKg: jugador.peso_kg,
    registrosHidratacion,
    historialIntrapartido,
    dayType: 'partido',
    today: toDateKey(now),
  });

  return { match, ...buildMatchTimeline({ jugador, match, strategy }) };
}
