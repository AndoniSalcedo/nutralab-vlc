'use server';

import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAnalyticsByPlayerId } from '@/repositories/analyticsRepository';
import { getAiPlansByPlayerId } from '@/repositories/aiPlanRepository';
import { PLAN_MODES } from '@/config/plan-modes';
import { compareRecords, sortByDateDesc } from '@/lib/analytics/compare';

const RECENT_DAYS = 10;
const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function isRecent(dateLike) {
  if (!dateLike) return false;
  const t = new Date(dateLike).getTime();
  return Number.isFinite(t) && Date.now() - t < RECENT_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Novedades recientes del jugador para el aviso animado de una sola vez:
 * última analítica visible y último plan nutricional publicado.
 * Qué se ha visto lo guarda el navegador; aquí solo se devuelven los candidatos.
 */
export async function getPlayerNews() {
  const user = await getUser();
  if (!user || user.role !== 'jugador') return { ok: true, news: [] };

  const db = getDb();
  const [analytics, plans] = await Promise.all([
    getAnalyticsByPlayerId(db, user.id).catch(() => []),
    // La novedad muestra el plan día a día de la semana: solo cuenta el semanal.
    getAiPlansByPlayerId(db, user.id, { modo: PLAN_MODES.SEMANA }).catch(() => []),
  ]);

  const news = [];

  const visible = sortByDateDesc((analytics || []).filter((a) => a.visible_para_jugador));
  const [latest, previous] = visible;
  if (latest && isRecent(latest.created_at || latest.fecha_extraccion)) {
    const rows = previous ? compareRecords(latest, previous) : [];
    const params = (latest.parametros || []).map((p) => {
      const row = rows.find((r) => r.nombre === p.nombre);
      return {
        nombre: p.nombre,
        valor: p.valor,
        unidad: p.unidad || '',
        fuera_rango: Boolean(p.fuera_rango),
        trend: row?.trend || null,
      };
    });
    news.push({
      kind: 'analitica',
      id: `analitica-${latest.id}`,
      fecha: latest.fecha_extraccion,
      mejoran: rows.filter((r) => r.trend === 'mejora').length,
      empeoran: rows.filter((r) => r.trend === 'empeora').length,
      fueraRango: params.filter((p) => p.fuera_rango).length,
      params: params.sort((a, b) => Number(b.fuera_rango) - Number(a.fuera_rango)).slice(0, 5),
    });
  }

  const plan = (plans || [])[0];
  if (plan && isRecent(plan.created_at)) {
    const dias = plan.datos?.dias || {};
    news.push({
      kind: 'plan',
      id: `plan-${plan.id}`,
      nombre: plan.nombre || plan.datos?.meta?.nombre || 'Plan nutricional',
      dias: DAY_ORDER.filter((d) => dias[d]).map((d) => ({
        dia: d,
        tipo: dias[d].tipoDia || '',
        kcal: Math.round(Number(dias[d].kcal) || 0),
      })),
    });
  }

  return { ok: true, news };
}
