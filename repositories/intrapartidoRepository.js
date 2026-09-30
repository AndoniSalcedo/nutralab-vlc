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
