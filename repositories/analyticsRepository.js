export async function getAnalyticsByPlayerId(supabase, playerId) {
  const { data, error } = await supabase
    .from('analiticas')
    .select('*')
    .eq('jugador_id', playerId)
    .order('fecha_extraccion', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAnalyticsByPlayerIds(supabase, playerIds) {
  const { data, error } = await supabase
    .from('analiticas')
    .select('*')
    .in('jugador_id', playerIds)
    .order('fecha_extraccion', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAnalyticsById(supabase, id) {
  const { data, error } = await supabase
    .from('analiticas')
    .select('id, jugador_id')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function insertAnalytics(supabase, payload) {
  const { data, error } = await supabase
    .from('analiticas')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAnalyticsVisibility(supabase, id, visible_para_jugador) {
  const { data, error } = await supabase
    .from('analiticas')
    .update({ visible_para_jugador })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAnalytics(supabase, id) {
  const { error } = await supabase
    .from('analiticas')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function insertAnalyticsBulk(supabase, payloads) {
  const { data, error } = await supabase
    .from('analiticas')
    .insert(payloads)
    .select();

  if (error) throw error;
  return data || [];
}
