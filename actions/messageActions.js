'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getOwnedPlayer, getOwnedTeam, getOwnerId } from '@/lib/auth/team-access';
import { insertMessages } from '@/repositories/messagesRepository';

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeRecipientIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0)
  ));
}


export async function sendMessageAction(payload) {
  const user = await getUser();
  if (user?.role !== 'admin') {
    throw new Error('Sin permisos');
  }

  const titulo = cleanText(payload?.titulo);
  const contenido = cleanText(payload?.contenido);
  const sendToAll = Boolean(payload?.sendToAll);
  const recipientIds = normalizeRecipientIds(payload?.recipientIds);
  const teamId = cleanText(payload?.team_id);

  if (!titulo || !contenido) {
    throw new Error('Título y mensaje son obligatorios');
  }

  if (!sendToAll && recipientIds.length === 0) {
    throw new Error('Selecciona al menos un jugador');
  }

  const base = {
    titulo,
    contenido,
    created_by: user.email || user.id || null,
    created_by_name: user.name || user.username || 'Nutricionista',
  };

  const supabase = getSupabaseAdmin();
  const team = await getOwnedTeam(supabase, user, teamId);
  if (!team) throw new Error('No tienes acceso a este equipo');

  if (!sendToAll) {
    for (const jugadorId of recipientIds) {
      const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
      if (!ownedPlayer || String(ownedPlayer.equipo_id) !== String(team.id)) {
        throw new Error('Hay jugadores fuera de este equipo');
      }
    }
  }

  const rows = sendToAll
    ? [{ ...base, owner_id: getOwnerId(user), equipo_id: team.id, jugador_id: null }]
    : recipientIds.map((jugadorId) => ({ ...base, owner_id: getOwnerId(user), equipo_id: team.id, jugador_id: jugadorId }));

  const data = await insertMessages(supabase, rows);
  revalidatePath(`/dashboard/equipo/${teamId}`);
  return { messages: data || [] };
}

export { sendMessageAction as sendMessage };
