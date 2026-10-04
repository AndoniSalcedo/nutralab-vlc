import { mockMessages, isMockPlayer, isMockTeam } from '@/config/boneyardMockData';
import { selectFields } from '@/lib/db/prisma';

const MESSAGE_FIELDS = selectFields('id,jugador_id,titulo,contenido,created_by_name,created_at');

export async function getMessages(db, equipoId, jugadorId) {
  if (isMockPlayer(jugadorId) || isMockTeam(equipoId)) {
    return mockMessages;
  }

  return db.mensajes.findMany({
    where: {
      equipo_id: equipoId,
      OR: [{ jugador_id: null }, { jugador_id: jugadorId }],
    },
    select: MESSAGE_FIELDS,
    orderBy: { created_at: { sort: 'desc', nulls: 'first' } },
  });
}

export async function insertMessages(db, rows) {
  if (!rows?.length) return [];
  return db.mensajes.createManyAndReturn({ data: rows, select: MESSAGE_FIELDS });
}
