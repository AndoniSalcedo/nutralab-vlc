import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnedTeam, forbidden } from '@/lib/team-access';
import { getOwnedPlayersByIds, insertPlayersBulk, updatePlayer } from '@/repositories/playerRepository';

function getOwnerId(user) {
  if (!user || user.role === 'jugador' || user.role === 'tecnico') return null;
  return String(user.external_admin_id || user.id || user.email || user.username || '').trim() || null;
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user || user.role === 'jugador' || user.role === 'tecnico') {
      return forbidden('No autorizado');
    }

    const ownerId = getOwnerId(user);
    if (!ownerId) return forbidden('No se pudo determinar el propietario');

    const { playerIds, targetTeamId, action } = await request.json();

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json({ error: 'Faltan jugadores por transferir' }, { status: 400 });
    }
    if (!targetTeamId) {
      return NextResponse.json({ error: 'Falta el equipo de destino' }, { status: 400 });
    }
    if (action !== 'move' && action !== 'copy') {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify target team is owned by the user
    const targetTeam = await getOwnedTeam(supabase, user, targetTeamId);
    if (!targetTeam) {
      return forbidden('No tienes acceso al equipo de destino');
    }

    // Verify all players are owned by the user
    const players = await getOwnedPlayersByIds(supabase, ownerId, playerIds);
    if (players.length !== playerIds.length) {
      return forbidden('No tienes acceso a todos los jugadores seleccionados o algunos no existen');
    }

    if (action === 'move') {
      // Update all players to the new team
      for (const player of players) {
        // Skipping if they are already in the target team
        if (player.equipo_id === targetTeamId) continue;
        await updatePlayer(supabase, player.id, { equipo_id: targetTeamId });
      }
      return NextResponse.json({ success: true, message: 'Jugadores movidos correctamente' });
    }

    if (action === 'copy') {
      // Copy players to the new team
      const payloads = players.map(player => {
        // eslint-disable-next-line no-unused-vars
        const { id, equipo_id, auth_user_id, auth_email, credentials_created_at, created_at, equipos, ...playerData } = player;
        return {
          ...playerData,
          equipo_id: targetTeamId
        };
      });

      if (payloads.length > 0) {
        await insertPlayersBulk(supabase, payloads);
      }
      return NextResponse.json({ success: true, message: 'Jugadores copiados correctamente' });
    }

  } catch (error) {
    console.error('Error transferring players:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
