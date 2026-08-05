export async function getHydrationRecordsByPlayerId(supabase, playerId) {
  const { data, error } = await supabase
    .from('registros_hidratacion')
    .select('*')
    .eq('jugador_id', playerId)
    .order('fecha', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getHydrationRecordsByPlayerIds(supabase, playerIds) {
  const { data, error } = await supabase
    .from('registros_hidratacion')
    .select('*')
    .in('jugador_id', playerIds)
    .order('fecha', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertHydrationRecords(supabase, records) {
  const { data, error } = await supabase
    .from('registros_hidratacion')
    .upsert(records, { onConflict: 'jugador_id,fecha,tipo' })
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function updateHydrationRecord(supabase, id, jugadorId, payload) {
  const { data, error } = await supabase
    .from('registros_hidratacion')
    .update(payload)
    .eq('id', id)
    .eq('jugador_id', jugadorId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertHydrationRecord(supabase, payload) {
  const { data, error } = await supabase
    .from('registros_hidratacion')
    .upsert(payload, { onConflict: 'jugador_id,fecha,tipo' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getHydrationRecordById(supabase, id) {
  const { data, error } = await supabase
    .from('registros_hidratacion')
    .select('jugador_id')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data || null;
}

export async function deleteHydrationRecord(supabase, id) {
  const { error } = await supabase
    .from('registros_hidratacion')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function insertHydrationRecordsBulk(supabase, records) {
  const { data, error } = await supabase
    .from('registros_hidratacion')
    .insert(records)
    .select('*');

  if (error) throw error;
  return data || [];
}
