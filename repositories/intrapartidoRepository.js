import { isMockTeam } from '@/config/boneyardMockData';
import { normalizeRows } from '@/lib/db/prisma';

const MATCH_FIELDS = {
  id: true, rival: true, competicion: true, lugar: true, fecha: true,
  estado: true, fase_actual: true, paso: true, fases: true, updated_at: true,
};

export async function getIntrapartidoMatchesByTeamId(db, teamId) {
  if (isMockTeam(teamId)) return [];

  return db.partidos_intrapartido.findMany({
    where: { equipo_id: teamId },
    select: MATCH_FIELDS,
    orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
  });
}

export async function getIntrapartidoMatchById(db, teamId, matchId) {
  if (isMockTeam(teamId)) return null;

  const match = await db.partidos_intrapartido.findFirst({
    where: { id: matchId, equipo_id: teamId },
    select: MATCH_FIELDS,
  });
  if (!match) return null;

  const [convocados, tomas] = await Promise.all([
    db.partido_convocados.findMany({
      where: { partido_id: match.id },
      select: { jugador_id: true, titular: true },
    }),
    db.partido_tomas.findMany({
      where: { partido_id: match.id },
      select: { jugador_id: true, momento: true, producto_id: true, cantidad: true },
    }),
  ]);

  return { match, convocados, tomas };
}

// Guardado atómico en la función SQL teams.guardar_intrapartido (crea/actualiza el partido
// y reemplaza convocatoria y tomas en una transacción). `estado` es 'borrador' mientras el
// control está en curso y 'finalizado' al guardar el balance. `fases` es la copia de las
// fases del partido (null conserva la guardada).
export async function saveIntrapartidoMatch(db, params) {
  if (isMockTeam(params.teamId)) return null;

  const matchId = params.matchId === null || params.matchId === undefined ? null : String(params.matchId);
  const rows = await db.$queryRaw`
    select teams.guardar_intrapartido(
      ${matchId}::bigint,
      ${String(params.teamId)}::bigint,
      ${params.rival}::text,
      ${params.competicion}::text,
      ${params.lugar}::text,
      ${params.fecha}::date,
      ${params.createdBy ?? null}::text,
      ${JSON.stringify(params.convocados ?? [])}::jsonb,
      ${JSON.stringify(params.tomas ?? [])}::jsonb,
      ${params.estado ?? 'finalizado'}::text,
      ${Number(params.faseActual) || 0}::smallint,
      ${params.paso ?? 'alineacion'}::text,
      ${params.fases ? JSON.stringify(params.fases) : null}::jsonb
    ) as id`;

  return normalizeRows(rows)[0]?.id ?? null;
}

export async function deleteIntrapartidoMatch(db, teamId, matchId) {
  if (isMockTeam(teamId)) return;

  await db.partidos_intrapartido.deleteMany({ where: { id: matchId, equipo_id: teamId } });
}

/**
 * Historial completo del equipo: cada partido con su convocatoria y sus tomas.
 * @returns {Promise<Array<{ match: object, convocados: object[], tomas: object[] }>>}
 */
export async function getIntrapartidoHistoryByTeamId(db, teamId) {
  const matches = await getIntrapartidoMatchesByTeamId(db, teamId);
  if (matches.length === 0) return [];

  const ids = matches.map((m) => m.id);
  const [convocados, tomas] = await Promise.all([
    db.partido_convocados.findMany({
      where: { partido_id: { in: ids } },
      select: { partido_id: true, jugador_id: true, titular: true },
      orderBy: [{ partido_id: 'asc' }, { jugador_id: 'asc' }],
    }),
    db.partido_tomas.findMany({
      where: { partido_id: { in: ids } },
      select: { partido_id: true, jugador_id: true, momento: true, producto_id: true, cantidad: true },
      orderBy: [{ partido_id: 'asc' }, { jugador_id: 'asc' }, { momento: 'asc' }, { producto_id: 'asc' }],
    }),
  ]);

  const group = (rows) => {
    const map = new Map();
    rows.forEach((row) => {
      const list = map.get(row.partido_id) || [];
      list.push(row);
      map.set(row.partido_id, list);
    });
    return map;
  };
  const convocadosByMatch = group(convocados);
  const tomasByMatch = group(tomas);

  return matches.map((match) => ({
    match,
    convocados: convocadosByMatch.get(match.id) || [],
    tomas: tomasByMatch.get(match.id) || [],
  }));
}

/**
 * Borradores (controles a medias) de todos los equipos del nutricionista, el más reciente primero.
 */
export async function getIntrapartidoDraftsByOwner(db, ownerId) {
  if (!ownerId) return [];

  const rows = await db.partidos_intrapartido.findMany({
    where: { estado: 'borrador', equipos: { owner_id: ownerId } },
    select: { ...MATCH_FIELDS, equipo_id: true, equipos: { select: { nombre: true } } },
    orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
  });
  return rows.map(({ equipos, ...row }) => ({ ...row, equipo_nombre: equipos?.nombre || '' }));
}

/**
 * Controles finalizados en los que ha participado un jugador, con sus propias tomas.
 * @returns {Promise<Array<{ match: object, convocado: object, tomas: object[] }>>}
 */
export async function getIntrapartidoHistoryByPlayerId(db, playerId) {
  const convocados = await db.partido_convocados.findMany({
    where: { jugador_id: playerId, partidos_intrapartido: { estado: 'finalizado' } },
    select: { partido_id: true, jugador_id: true, titular: true, partidos_intrapartido: { select: MATCH_FIELDS } },
  });
  if (convocados.length === 0) return [];

  const tomas = await db.partido_tomas.findMany({
    where: { jugador_id: playerId, partido_id: { in: convocados.map((c) => c.partido_id) } },
    select: { partido_id: true, jugador_id: true, momento: true, producto_id: true, cantidad: true },
  });

  return convocados
    .map(({ partidos_intrapartido: match, ...convocado }) => ({
      match,
      convocado,
      tomas: tomas.filter((t) => t.partido_id === convocado.partido_id),
    }))
    .sort((a, b) => String(b.match.fecha).localeCompare(String(a.match.fecha)));
}

const RECENT_MATCH_MS = 24 * 60 * 60 * 1000;

/**
 * Control finalizado en las últimas 24 h que el jugador aún no ha visto (el más reciente).
 * @returns {Promise<{ match: object, convocado: object, tomas: object[] } | null>}
 */
export async function getUnseenIntrapartidoForPlayer(db, playerId) {
  const row = await db.partido_convocados.findFirst({
    where: {
      jugador_id: playerId,
      visto_at: null,
      partidos_intrapartido: { estado: 'finalizado', updated_at: { gte: new Date(Date.now() - RECENT_MATCH_MS) } },
    },
    select: { partido_id: true, jugador_id: true, titular: true, partidos_intrapartido: { select: MATCH_FIELDS } },
    orderBy: { partido_id: 'desc' },
  });
  if (!row) return null;

  const { partidos_intrapartido: match, ...convocado } = row;
  const tomas = await db.partido_tomas.findMany({
    where: { partido_id: row.partido_id, jugador_id: playerId },
    select: { partido_id: true, jugador_id: true, momento: true, producto_id: true, cantidad: true },
  });
  return { match, convocado, tomas };
}

export async function markIntrapartidoSeen(db, playerId, matchId) {
  await db.partido_convocados.updateMany({
    where: { jugador_id: playerId, partido_id: matchId, visto_at: null },
    data: { visto_at: new Date() },
  });
}
