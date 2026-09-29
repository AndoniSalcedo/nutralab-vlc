import { isMockPlayer } from '@/config/boneyardMockData';

export async function getWellnessRecordsByPlayerId(supabase, playerId, { from } = {}) {
  if (isMockPlayer(playerId)) return [];

  let query = supabase
    .from('registros_bienestar')
    .select('*')
    .eq('jugador_id', playerId)
    .order('fecha', { ascending: true });

  if (from) query = query.gte('fecha', from);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function upsertWellnessRecord(supabase, payload) {
  const { data, error } = await supabase
    .from('registros_bienestar')
    .upsert(payload, { onConflict: 'jugador_id,fecha' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
