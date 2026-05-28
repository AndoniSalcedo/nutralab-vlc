import { NextResponse } from 'next/server';

export function getOwnerId(user) {
  if (!user || user.role === 'jugador') return null;
  return String(user.external_admin_id || user.id || user.email || user.username || '').trim() || null;
}

export function forbidden(message = 'Sin permisos') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getOwnedTeam(supabase, user, teamId) {
  const ownerId = getOwnerId(user);
  if (!ownerId || !teamId) return null;

  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .eq('id', teamId)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getOwnedPlayer(supabase, user, playerId) {
  const ownerId = getOwnerId(user);
  if (!ownerId || !playerId) return null;

  const { data, error } = await supabase
    .from('jugadores')
    .select('id,equipo_id,equipos!inner(id,owner_id)')
    .eq('id', playerId)
    .eq('equipos.owner_id', ownerId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}
