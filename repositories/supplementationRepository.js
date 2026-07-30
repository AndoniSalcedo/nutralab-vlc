import { resolvePlayerSupplementsData } from '@/lib/supplementation-helper';

export async function getAllSuplementos(supabase) {
  const { data, error } = await supabase
    .from('suplementos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAllSuplementacionListas(supabase) {
  const { data, error } = await supabase
    .from('suplementacion_listas')
    .select('*')
    .order('orden', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAllSuplementacionListaItems(supabase) {
  const { data, error } = await supabase
    .from('suplementacion_lista_items')
    .select('*')
    .order('orden', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getJugadorSuplementacion(supabase, jugadorId) {
  const { data, error } = await supabase
    .from('jugador_suplementacion')
    .select('*')
    .eq('jugador_id', jugadorId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getJugadorSuplementosExtra(supabase, jugadorId) {
  const { data, error } = await supabase
    .from('jugador_suplementos_extra')
    .select('*')
    .eq('jugador_id', jugadorId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getJugadorSuplementacionByPlayers(supabase, playerIds) {
  const { data, error } = await supabase
    .from('jugador_suplementacion')
    .select('*')
    .in('jugador_id', playerIds);

  if (error) throw error;
  return data || [];
}

export async function getJugadorSuplementosExtraByPlayers(supabase, playerIds) {
  const { data, error } = await supabase
    .from('jugador_suplementos_extra')
    .select('*')
    .in('jugador_id', playerIds);

  if (error) throw error;
  return data || [];
}

export async function getSuplementacionHistorialByPlayers(supabase, playerIds) {
  const { data, error } = await supabase
    .from('jugador_suplementacion_historial')
    .select('id, jugador_id, lista_id, created_at')
    .in('jugador_id', playerIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function upsertJugadorSuplementacion(supabase, payload) {
  const { data, error } = await supabase
    .from('jugador_suplementacion')
    .upsert(payload, { onConflict: 'jugador_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function upsertJugadorSuplementacionBulk(supabase, payloads) {
  const { data, error } = await supabase
    .from('jugador_suplementacion')
    .upsert(payloads, { onConflict: 'jugador_id' })
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function upsertJugadorSuplementosExtra(supabase, payload) {
  const { data, error } = await supabase
    .from('jugador_suplementos_extra')
    .upsert(payload, { onConflict: 'jugador_id,suplemento_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function upsertJugadorSuplementosExtraBulk(supabase, payloads) {
  const { data, error } = await supabase
    .from('jugador_suplementos_extra')
    .upsert(payloads, { onConflict: 'jugador_id,suplemento_id' })
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function deleteJugadorSuplementosExtra(supabase, extraId, jugadorId) {
  const { error } = await supabase
    .from('jugador_suplementos_extra')
    .delete()
    .eq('id', extraId)
    .eq('jugador_id', jugadorId);

  if (error) throw error;
  return true;
}

export async function upsertSuplemento(supabase, payload) {
  const { data, error } = await supabase
    .from('suplementos')
    .upsert(payload, { onConflict: 'slug' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateSuplemento(supabase, id, payload) {
  const { data, error } = await supabase
    .from('suplementos')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSuplemento(supabase, id) {
  const { error } = await supabase
    .from('suplementos')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function deleteSuplementacionLista(supabase, id) {
  const { error } = await supabase
    .from('suplementacion_listas')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function upsertSuplementacionLista(supabase, payload) {
  const { data, error } = await supabase
    .from('suplementacion_listas')
    .upsert(payload, { onConflict: 'slug' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getSuplementacionListaItemsByList(supabase, listaId) {
  const { data, error } = await supabase
    .from('suplementacion_lista_items')
    .select('orden')
    .eq('lista_id', listaId)
    .order('orden', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data || [];
}

export async function upsertSuplementacionListaItem(supabase, payload) {
  const { data, error } = await supabase
    .from('suplementacion_lista_items')
    .upsert(payload, { onConflict: 'lista_id,suplemento_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSuplementacionListaItem(supabase, itemId) {
  const { error } = await supabase
    .from('suplementacion_lista_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
  return true;
}

export async function nextListOrder(supabase) {
  const { data, error } = await supabase
    .from('suplementacion_listas')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1);

  if (error) throw error;
  return Number(data?.[0]?.orden || 0) + 1;
}

export async function getResolvedPlayerSupplementation(supabase, jugadorId, pesoKg = null) {
  if (!jugadorId) return [];
  const [
    suplementos,
    listas,
    items,
    asignacion,
    extras,
  ] = await Promise.all([
    getAllSuplementos(supabase),
    getAllSuplementacionListas(supabase),
    getAllSuplementacionListaItems(supabase),
    getJugadorSuplementacion(supabase, jugadorId),
    getJugadorSuplementosExtra(supabase, jugadorId),
  ]);

  return resolvePlayerSupplementsData({
    suplementos,
    listas,
    items,
    asignacion,
    extras,
    peso: pesoKg,
  });
}

