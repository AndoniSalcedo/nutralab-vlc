export async function getAiPlansByPlayerId(supabase, jugadorId) {
  const { data, error } = await supabase
    .from('planes_ia')
    .select('*')
    .eq('jugador_id', jugadorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAiPlanById(supabase, id) {
  const { data, error } = await supabase
    .from('planes_ia')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getAiPlansByPlayerIds(supabase, playerIds) {
  const { data, error } = await supabase
    .from('planes_ia')
    .select('jugador_id, datos, meta')
    .in('jugador_id', playerIds);

  if (error) throw error;
  return data || [];
}

export async function getAiPlansByPlayerIdsOrdered(supabase, playerIds) {
  const { data, error } = await supabase
    .from('planes_ia')
    .select('id, jugador_id, datos, meta')
    .in('jugador_id', playerIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function insertAiPlan(supabase, payload) {
  const { data, error } = await supabase
    .from('planes_ia')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateAiPlan(supabase, id, payload) {
  const { data, error } = await supabase
    .from('planes_ia')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAiPlan(supabase, id) {
  const { error } = await supabase
    .from('planes_ia')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getAiPlansByPlayerIdsFull(supabase, playerIds) {
  const { data, error } = await supabase
    .from('planes_ia')
    .select('*')
    .in('jugador_id', playerIds);

  if (error) throw error;
  return data || [];
}

