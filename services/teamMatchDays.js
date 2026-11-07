// Días de partido próximos del equipo según los planes de sus jugadores, con la hora fijada
// por el staff para cada fecha. Sin comprobación de acceso.
import { getPlayersByTeamSelectSimple } from '@/repositories/playerRepository';
import { getLatestAiPlansByPlayerIds } from '@/repositories/aiPlanRepository';
import { getTeamKickoffsBetween } from '@/repositories/scheduledMatchRepository';
import { collectTeamMatchDays } from '@/lib/nutrition/match-kickoff';
import { PLAN_MODES } from '@/config/plan-modes';
import { toDateKey, shiftDateKey } from '@/lib/dates';

const DAYS_AHEAD = 14;

export async function buildTeamMatchDays(db, teamId, now = new Date()) {
  const today = toDateKey(now);
  const fechas = Array.from({ length: DAYS_AHEAD }, (_, i) => shiftDateKey(today, i));
  const players = await getPlayersByTeamSelectSimple(db, teamId);
  const [plans, kickoffs] = await Promise.all([
    getLatestAiPlansByPlayerIds(db, players.map((p) => p.id), { modo: PLAN_MODES.SEMANA }),
    getTeamKickoffsBetween(db, teamId, today, fechas[fechas.length - 1]),
  ]);
  const planByPlayer = new Map(plans.map((plan) => [String(plan.jugador_id), plan.datos]));
  const withPlans = players.map((p) => ({ ...p, plan: planByPlayer.get(String(p.id)) || null }));
  return collectTeamMatchDays(fechas, withPlans, kickoffs);
}
