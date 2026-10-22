// Recordatorios push programados para los jugadores (los lanza /api/cron/notifications).
// Cada aviso tiene una ventana horaria (Europe/Madrid) y una clave: aunque el cron corra cada
// 15 min o cada hora, cada recordatorio sale como mucho una vez.
import { getDb } from '@/lib/db/prisma';
import { isPushConfigured, notifyPlayerOnce } from '@/lib/push';
import { resolveNotificationPrefs } from '@/config/notifications';
import { PLAN_MODES } from '@/config/plan-modes';
import { calculateHydration } from '@/lib/metrics/anthropometry';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { toDateKey, shiftDateKey } from '@/lib/dates';
import { madridDateTime } from '@/lib/nutrition/match-timeline';
import {
  listPlayersWithPush,
  getNotificationPrefsMap,
  purgeOldNotificationLogs,
} from '@/repositories/notificationsRepository';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerId } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerId } from '@/repositories/pesajeRepository';
import { getDailyRecord } from '@/repositories/dailyRecordRepository';
import { getMealsFiltered } from '@/repositories/mealsRepository';
import { getWellnessRecordsByPlayerId } from '@/repositories/wellnessRepository';
import { getLatestAiPlanByPlayerId } from '@/repositories/aiPlanRepository';
import { getAssignedSupplementIds } from '@/repositories/supplementationRepository';
import { buildPlayerMatchDay } from '@/services/matchDay';

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Tomas del plan: nombre → tipo del diario y hora del aviso (mismas horas que el widget Plan de hoy)
const MEAL_REMINDERS = [
  { match: 'desayuno', type: 'breakfast', at: 8.5, what: 'el desayuno', emoji: '☕' },
  { match: 'almuerzo', type: 'midMorning', at: 11.5, what: 'el almuerzo', emoji: '🥪' },
  { match: 'media manana', type: 'midMorning', at: 11.5, what: 'la media mañana', emoji: '🥪' },
  { match: 'comida', type: 'lunch', at: 14, what: 'la comida', emoji: '🍽️' },
  { match: 'merienda', type: 'snack', at: 17.5, what: 'la merienda', emoji: '🍎' },
  { match: 're-cena', type: 'lateSnack', at: 23, what: 'la re-cena', emoji: '🌙' },
  { match: 'cena', type: 'dinner', at: 21, what: 'la cena', emoji: '🥗' },
];
const WATER_CHECKPOINTS = [
  { at: 12, share: 0.35 },
  { at: 17, share: 0.65 },
  { at: 20.5, share: 0.9 },
];
const MEAL_WINDOW = 1.5;
const WATER_WINDOW = 2;
const EVENING_WINDOW = 2;
const SUPPLEMENTS_AT = 20;
const WELLNESS_AT = 21;
// Pasos del día de partido: se avisan dentro de los 40 min siguientes a su hora
const MATCH_STEP_WINDOW_MS = 40 * 60 * 1000;

const inWindow = (hour, start, length) => hour >= start && hour < start + length;
const fmtL = (ml) => (ml / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 });
const normalize = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function madridHour(date) {
  const parts = new Intl.DateTimeFormat('es-ES', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Europe/Madrid' }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return (get('hour') % 24) + get('minute') / 60;
}

async function remindPlayer(db, jugadorId, { now, hour, today, savedPrefs }) {
  const prefs = resolveNotificationPrefs(savedPrefs);
  const send = (tipo, clave, payload) => notifyPlayerOnce(jugadorId, tipo, clave, payload, savedPrefs ?? null);
  const results = [];
  const home = '/dashboard';

  // --- Día de partido: cada paso con aviso, a su hora ---
  let matchToday = false;
  if (prefs.partido) {
    const matchDay = await buildPlayerMatchDay(db, jugadorId, now).catch(() => null);
    if (matchDay) {
      matchToday = matchDay.match.fecha === today;
      matchDay.steps
        .filter((step) => step.push)
        .filter((step) => {
          const at = new Date(step.at).getTime();
          return now.getTime() >= at && now.getTime() < at + MATCH_STEP_WINDOW_MS;
        })
        .forEach((step) => {
          results.push(send('partido', `${matchDay.match.fecha}:${matchDay.match.hora}:${step.id}`, {
            title: `⚽ ${step.title}`,
            body: step.detail || 'Mira tu plan del día de partido.',
            url: home,
          }));
        });
    }
  }

  const needsPlan = prefs.comidas || prefs.agua;
  const [plan, record] = await Promise.all([
    needsPlan ? getLatestAiPlanByPlayerId(db, jugadorId, { modo: PLAN_MODES.SEMANA }).catch(() => null) : null,
    getDailyRecord(db, jugadorId, today),
  ]);
  const dayPlan = plan?.datos?.dias?.[DAY_KEYS[new Date(`${today}T12:00:00Z`).getUTCDay()]] || null;

  // --- Tomas del plan semanal (en día de partido ya avisa la línea de tiempo) ---
  if (prefs.comidas && dayPlan && !matchToday) {
    const due = (dayPlan.ingestas || [])
      .map((meal) => MEAL_REMINDERS.find((r) => normalize(meal?.nombre).includes(r.match)))
      .filter((r) => r && inWindow(hour, r.at, MEAL_WINDOW));
    if (due.length) {
      const from = madridDateTime(today, '00:00').toISOString();
      const to = madridDateTime(shiftDateKey(today, 1), '00:00').toISOString();
      const logged = new Set((await getMealsFiltered(db, jugadorId, null, from, to)).map((m) => m.meal_type));
      due.filter((r) => !logged.has(r.type)).forEach((r) => {
        results.push(send('comidas', `${today}:${r.type}`, {
          title: `Te toca ${r.what} ${r.emoji}`,
          body: 'Mira qué toca en tu plan de hoy y regístralo cuando lo tomes.',
          url: home,
        }));
      });
    }
  }

  // --- Agua: si va por detrás en cada punto de control ---
  const checkpoint = WATER_CHECKPOINTS.find((c) => inWindow(hour, c.at, WATER_WINDOW));
  if (prefs.agua && checkpoint) {
    const [raw, evoluciones, pesajes] = await Promise.all([
      getPlayerWithTeamConfig(db, jugadorId).catch(() => null),
      getEvolutionsByPlayerId(db, jugadorId),
      getPesajesByPlayerId(db, jugadorId),
    ]);
    const weight = Number(withLatestMeasurement(raw, evoluciones, pesajes)?.peso_kg);
    if (Number.isFinite(weight) && weight > 0) {
      const targetMl = calculateHydration(weight, matchToday ? 'partido' : dayPlan?.tipoDia || 'descanso');
      const drunk = record?.agua_ml || 0;
      if (drunk < targetMl * checkpoint.share) {
        results.push(send('agua', `${today}:${checkpoint.at}`, {
          title: 'Un vaso de agua 💧',
          body: `Llevas ${fmtL(drunk)} de ${fmtL(targetMl)} L hoy. Bebe un poco y súmalo en tu perfil.`,
          url: home,
        }));
      }
    }
  }

  // --- Suplementos pendientes por la noche ---
  if (prefs.suplementos && inWindow(hour, SUPPLEMENTS_AT, EVENING_WINDOW)) {
    const assigned = await getAssignedSupplementIds(db, jugadorId);
    const taken = new Set((record?.suplementos_tomados || []).map(Number));
    const pending = [...assigned].filter((id) => !taken.has(id)).length;
    if (pending > 0) {
      results.push(send('suplementos', today, {
        title: 'Suplementos de hoy 💊',
        body: pending === 1 ? 'Te queda 1 suplemento por marcar.' : `Te quedan ${pending} suplementos por marcar.`,
        url: home,
      }));
    }
  }

  // --- Hexágono de bienestar ---
  if (prefs.bienestar && inWindow(hour, WELLNESS_AT, EVENING_WINDOW)) {
    const records = await getWellnessRecordsByPlayerId(db, jugadorId, { from: today });
    if (!records.some((r) => String(r.fecha).slice(0, 10) === today)) {
      results.push(send('bienestar', today, {
        title: '¿Cómo te encuentras hoy? ✨',
        body: 'Rellena tu bienestar en un minuto: sueño, fatiga, dolor muscular…',
        url: home,
      }));
    }
  }

  const sent = await Promise.all(results);
  return sent.filter(Boolean).length;
}

/** Recorre los jugadores con avisos activos y envía los recordatorios que tocan ahora. */
export async function runPlayerReminders(now = new Date()) {
  if (!isPushConfigured()) return { ok: true, skipped: 'Sin claves VAPID' };

  const db = getDb();
  const hour = madridHour(now);
  const today = toDateKey(now);
  const jugadorIds = await listPlayersWithPush(db);
  const prefsMap = await getNotificationPrefsMap(db, jugadorIds);

  let sent = 0;
  let failed = 0;
  for (const jugadorId of jugadorIds) {
    try {
      sent += await remindPlayer(db, jugadorId, { now, hour, today, savedPrefs: prefsMap.get(String(jugadorId)) });
    } catch (error) {
      failed += 1;
      console.error('[reminders] Error con un jugador:', error?.message || error);
    }
  }

  await purgeOldNotificationLogs(db).catch(() => {});
  return { ok: true, players: jugadorIds.length, sent, failed };
}
