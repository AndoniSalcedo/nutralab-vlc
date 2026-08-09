export async function getPesajesByPlayerId(supabase, playerId) {
  const { data, error } = await supabase
    .from('pesajes')
    .select('*')
    .eq('jugador_id', playerId)
    .order('fecha', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPesajeById(supabase, id) {
  const { data, error } = await supabase
    .from('pesajes')
    .select('id, jugador_id')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function updatePesaje(supabase, id, payload) {
  const { data, error } = await supabase
    .from('pesajes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertPesaje(supabase, payload) {
  const { data, error } = await supabase
    .from('pesajes')
    .upsert(payload, { onConflict: 'jugador_id,fecha' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePesaje(supabase, id) {
  const { error } = await supabase
    .from('pesajes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
