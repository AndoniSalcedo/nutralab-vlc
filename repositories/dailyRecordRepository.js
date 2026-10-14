import { isMockPlayer } from '@/config/boneyardMockData';

export async function getDailyRecord(db, playerId, fecha) {
  if (isMockPlayer(playerId)) return null;

  return db.registros_diarios.findUnique({
    where: { jugador_id_fecha: { jugador_id: playerId, fecha } },
  });
}

export async function upsertDailyRecord(db, payload) {
  const { jugador_id, fecha } = payload;
  const upsert = () => db.registros_diarios.upsert({
    where: { jugador_id_fecha: { jugador_id, fecha } },
    create: payload,
    update: payload,
  });
  try {
    return await upsert();
  } catch (error) {
    // Agua y suplementos pueden crear la fila del día a la vez: el segundo reintenta como update
    if (error?.code === 'P2002') return upsert();
    throw error;
  }
}
