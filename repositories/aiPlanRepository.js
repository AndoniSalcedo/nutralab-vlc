
import { mockAiPlans, isMockPlayer } from '@/config/boneyardMockData';

export async function getAiPlansByPlayerId(db, jugadorId, semana = null) {
  if (isMockPlayer(jugadorId)) return semana ? [] : mockAiPlans;

  const where = { jugador_id: jugadorId };
  if (semana) {
    where.datos = { path: ['meta', 'semanaMenu'], equals: semana };
  }

  return db.planes_ia.findMany({
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
