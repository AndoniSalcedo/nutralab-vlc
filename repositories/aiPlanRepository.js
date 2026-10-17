
import { mockAiPlans, isMockPlayer } from '@/config/boneyardMockData';

/** Planes del jugador, del más reciente al más antiguo. `modo` ('semana' | 'tipos') los filtra; sin él, todos. */
export async function getAiPlansByPlayerId(db, jugadorId, { modo } = {}) {
  if (isMockPlayer(jugadorId)) return modo ? mockAiPlans.filter((plan) => plan.modo === modo) : mockAiPlans;

  const where = { jugador_id: jugadorId };
  if (modo) where.modo = modo;

  return db.planes_ia.findMany({
    where,
    orderBy: { created_at: { sort: 'desc', nulls: 'first' } },
  });
}

/** Último plan publicado del jugador o null. Trae una sola fila: el JSON de cada plan pesa bastante. */
export async function getLatestAiPlanByPlayerId(db, jugadorId, { modo } = {}) {
  if (isMockPlayer(jugadorId)) return (await getAiPlansByPlayerId(db, jugadorId, { modo }))[0] || null;

  const where = { jugador_id: jugadorId };
  if (modo) where.modo = modo;

  return db.planes_ia.findFirst({
    where,
    orderBy: { created_at: { sort: 'desc', nulls: 'first' } },
  });
}

export async function getAiPlanById(db, id) {
  return db.planes_ia.findUnique({ where: { id } });
}

export async function insertAiPlan(db, payload) {
  return db.planes_ia.create({ data: payload });
}

export async function updateAiPlan(db, id, payload) {
  return db.planes_ia.update({ where: { id }, data: payload });
}

export async function deleteAiPlan(db, id) {
  await db.planes_ia.deleteMany({ where: { id } });
  return true;
}

export async function insertAiPlansBulk(db, payloads) {
  if (!payloads?.length) return [];
  return db.planes_ia.createManyAndReturn({ data: payloads });
}
