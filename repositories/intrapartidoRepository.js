import { isMockTeam } from '@/config/boneyardMockData';

export async function getIntrapartidoMatchesByTeamId(supabase, teamId) {
  if (isMockTeam(teamId)) return [];

  const { data, error } = await supabase
    .from('partidos_intrapartido')
    .select('id,rival,competicion,lugar,fecha')
    .eq('equipo_id', teamId)
    .order('fecha', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getIntrapartidoMatchById(supabase, teamId, matchId) {
  if (isMockTeam(teamId)) return null;

  const { data: match, error } = await supabase
    .from('partidos_intrapartido')
    .select('id,rival,competicion,lugar,fecha')
    .eq('id', matchId)
    .eq('equipo_id', teamId)
    .maybeSingle();

  if (error) throw error;
  if (!match) return null;

  const [convocados, tomas] = await Promise.all([
    supabase.from('partido_convocados').select('jugador_id,titular').eq('partido_id', match.id),
    supabase.from('partido_tomas').select('jugador_id,momento,producto_id,cantidad').eq('partido_id', match.id),
  ]);
  if (convocados.error) throw convocados.error;
  if (tomas.error) throw tomas.error;

  return { match, convocados: convocados.data || [], tomas: tomas.data || [] };
}

export async function saveIntrapartidoMatch(supabase, params) {
  if (isMockTeam(params.teamId)) return null;

  const { data, error } = await supabase.rpc('guardar_intrapartido', {
    p_partido_id: params.matchId,
    p_equipo_id: params.teamId,
    p_rival: params.rival,
    p_competicion: params.competicion,
    p_lugar: params.lugar,
    p_fecha: params.fecha,
    p_created_by: params.createdBy,
    p_convocados: params.convocados,
    p_tomas: params.tomas,
  });

  if (error) throw error;
  return data;
}

export async function deleteIntrapartidoMatch(supabase, teamId, matchId) {
  if (isMockTeam(teamId)) return;

  const { error } = await supabase
    .from('partidos_intrapartido')
    .delete()
    .eq('id', matchId)
    .eq('equipo_id', teamId);

  if (error) throw error;
}

// PostgREST devuelve como máximo 1000 filas por consulta: se pagina.
async function fetchAllRows(buildQuery) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

/**
 * Historial completo del equipo: cada partido con su convocatoria y sus tomas.
 * @returns {Promise<Array<{ match: object, convocados: object[], tomas: object[] }>>}
 */
export async function getIntrapartidoHistoryByTeamId(supabase, teamId) {
  const matches = await getIntrapartidoMatchesByTeamId(supabase, teamId);
  if (matches.length === 0) return [];

  const ids = matches.map((m) => m.id);
  const [convocados, tomas] = await Promise.all([
    fetchAllRows(() =>
      supabase
        .from('partido_convocados')
        .select('partido_id,jugador_id,titular')
        .in('partido_id', ids)
        .order('partido_id')
        .order('jugador_id'),
    ),
    fetchAllRows(() =>
      supabase
        .from('partido_tomas')
        .select('partido_id,jugador_id,momento,producto_id,cantidad')
        .in('partido_id', ids)
        .order('partido_id')
        .order('jugador_id')
        .order('momento')
        .order('producto_id'),
    ),
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
