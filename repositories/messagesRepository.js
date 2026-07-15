export async function getMessages(supabase, equipoId, jugadorId) {
  const { data, error } = await supabase
    .from('mensajes')
    .select('id,jugador_id,titulo,contenido,created_by_name,created_at')
    .eq('equipo_id', equipoId)
    .or(`jugador_id.is.null,jugador_id.eq.${jugadorId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function insertMessages(supabase, rows) {
  const { data, error } = await supabase
    .from('mensajes')
    .insert(rows)
    .select('id,jugador_id,titulo,contenido,created_by_name,created_at');

  if (error) throw error;
  return data || [];
}
