// Reto semanal de adherencia del equipo (voluntario). Puntúa días cumplidos de agua, suplementos,
// diario de comidas y bienestar. Solo se exponen nombres y puntos: nunca peso ni medidas.
import { calculateHydration } from '@/lib/metrics/anthropometry';
import { toDateKey, shiftDateKey, mondayKeyOf } from '@/lib/dates';
import { madridDateTime } from '@/lib/nutrition/match-timeline';
import { getChallengeParticipants, getChallengeActivity } from '@/repositories/challengeRepository';
import { getPesajesByPlayerIdsSimple } from '@/repositories/pesajeRepository';
import { getEvolutionsByPlayerIdsSimple } from '@/repositories/evolutionRepository';
import {
  getAllSuplementacionListaItems,
  getJugadorSuplementacionByPlayers,
  getJugadorSuplementosExtraByPlayers,
} from '@/repositories/supplementationRepository';
import { CHALLENGE_CATEGORIES } from '@/config/challenges';

const displayName = (p) => [p.nombre, p.apellidos ? `${String(p.apellidos).trim().charAt(0)}.` : ''].filter(Boolean).join(' ');

// Peso más reciente de cada jugador (solo para su objetivo de agua; no se devuelve)
function latestWeights(pesajes, evoluciones) {
  const latest = new Map();
  [...evoluciones, ...pesajes].forEach((row) => {
    const weight = Number(row.peso_kg);
    if (!Number.isFinite(weight) || weight <= 0) return;
    const key = String(row.jugador_id);
    const prev = latest.get(key);
    if (!prev || String(row.fecha) >= prev.fecha) latest.set(key, { fecha: String(row.fecha), weight });
  });
  return latest;
}

/** Ranking de la semana en curso (lunes a hoy) de los participantes del equipo. */
export async function buildTeamChallenge(db, teamId, now = new Date()) {
  const today = toDateKey(now);
  const fromKey = mondayKeyOf(today);
  const participants = await getChallengeParticipants(db, teamId);
  const ids = participants.map((p) => p.id);
  const daysElapsed = Math.round((new Date(`${today}T12:00:00Z`) - new Date(`${fromKey}T12:00:00Z`)) / 86400000) + 1;

  const [activity, pesajes, evoluciones, listItems, asignaciones, extras] = await Promise.all([
    getChallengeActivity(db, ids, {
      fromKey,
      toKey: today,
      fromUtc: madridDateTime(fromKey, '00:00').toISOString(),
      toUtc: madridDateTime(shiftDateKey(today, 1), '00:00').toISOString(),
    }),
    getPesajesByPlayerIdsSimple(db, ids),
    getEvolutionsByPlayerIdsSimple(db, ids),
    ids.length ? getAllSuplementacionListaItems(db) : [],
    ids.length ? getJugadorSuplementacionByPlayers(db, ids) : [],
    ids.length ? getJugadorSuplementosExtraByPlayers(db, ids) : [],
  ]);

  const weights = latestWeights(pesajes || [], evoluciones || []);
  const assignedCount = new Map(ids.map((id) => {
    const listaId = Number(asignaciones.find((a) => String(a.jugador_id) === String(id))?.lista_id || 0);
    const fromList = listItems.filter((item) => Number(item.lista_id) === listaId).map((item) => Number(item.suplemento_id));
    const fromExtras = extras.filter((e) => String(e.jugador_id) === String(id)).map((e) => Number(e.suplemento_id));
    return [String(id), new Set([...fromList, ...fromExtras]).size];
  }));

  const scores = new Map(ids.map((id) => [String(id), { agua: new Set(), suplementos: new Set(), diario: new Set(), bienestar: new Set() }]));
  activity.daily.forEach((row) => {
    const s = scores.get(String(row.jugador_id));
    if (!s) return;
    const weight = weights.get(String(row.jugador_id))?.weight;
    const waterTarget = weight ? calculateHydration(weight, 'descanso') : 2500;
    if ((row.agua_ml || 0) >= waterTarget) s.agua.add(row.fecha);
    const assigned = assignedCount.get(String(row.jugador_id)) || 0;
    if (assigned > 0 && (row.suplementos_tomados?.length || 0) >= assigned) s.suplementos.add(row.fecha);
  });
  activity.wellness.forEach((row) => scores.get(String(row.jugador_id))?.bienestar.add(row.fecha));
  activity.meals.forEach((row) => scores.get(String(row.jugador_id))?.diario.add(toDateKey(row.taken_at)));

  const ranking = participants
    .map((p) => {
      const s = scores.get(String(p.id));
      const breakdown = Object.fromEntries(CHALLENGE_CATEGORIES.map((c) => [c.key, s[c.key].size]));
      return {
        id: p.id,
        name: displayName(p),
        points: Object.values(breakdown).reduce((a, b) => a + b, 0),
        breakdown,
      };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return {
    week: { from: fromKey, to: shiftDateKey(fromKey, 6), daysElapsed },
    maxPoints: daysElapsed * CHALLENGE_CATEGORIES.length,
    ranking,
  };
}
