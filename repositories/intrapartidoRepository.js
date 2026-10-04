import { isMockTeam } from '@/config/boneyardMockData';
import { normalizeRows } from '@/lib/db/prisma';

const MATCH_FIELDS = { id: true, rival: true, competicion: true, lugar: true, fecha: true };

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
// y reemplaza convocatoria y tomas en una transacción).
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
      ${JSON.stringify(params.tomas ?? [])}::jsonb
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
