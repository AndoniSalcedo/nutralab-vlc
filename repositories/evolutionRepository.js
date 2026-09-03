export async function getEvolutionsByPlayerId(supabase, playerId) {
  const { data, error } = await supabase
    .from('evoluciones')
    .select('*')
    .eq('jugador_id', playerId)
    .order('fecha', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getEvolutionsByPlayerIdOrdered(supabase, playerId) {
  const { data, error } = await supabase
    .from('evoluciones')
    .select('*')
    .eq('jugador_id', playerId)
    .order('fecha');

  if (error) throw error;
  return data || [];
}

export async function getEvolutionsByPlayerIdsSimple(supabase, playerIds) {
  const { data, error } = await supabase
    .from('evoluciones')
    .select('jugador_id,fecha,peso_kg,porcentaje_grasa,peso_magro')
    .in('jugador_id', playerIds);

  if (error) throw error;
  return data || [];
}

export async function getEvolutionsByPlayerIds(supabase, playerIds) {
  const { data, error } = await supabase
    .from('evoluciones')
    .select('*')
    .in('jugador_id', playerIds)
    .order('fecha', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getEvolutionById(supabase, id) {
  const { data, error } = await supabase
    .from('evoluciones')
    .select('id, jugador_id')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function updateEvolution(supabase, id, payload) {
  const { data, error } = await supabase
    .from('evoluciones')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertEvolution(supabase, payload) {
  const { data, error } = await supabase
    .from('evoluciones')
    .upsert(payload, { onConflict: 'jugador_id,fecha' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertEvolutionsBulk(supabase, payloads) {
  const { data, error } = await supabase
    .from('evoluciones')
    .insert(payloads)
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function deleteEvolution(supabase, id) {
  const { error } = await supabase
    .from('evoluciones')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getEvolutionByPlayerAndDate(supabase, playerId, date) {
  const { data, error } = await supabase
    .from('evoluciones')
    .select('*')
    .eq('jugador_id', playerId)
    .eq('fecha', date)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function insertEvolution(supabase, payload) {
  const { data, error } = await supabase
    .from('evoluciones')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

