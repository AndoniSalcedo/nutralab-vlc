import { getSupabaseAdmin } from '@/lib/supabase-server';
import TeamsDashboard from '@/components/TeamsDashboard';
import { getUser } from '@/lib/auth';
import { getOwnerId } from '@/lib/team-access';
import { redirect } from 'next/navigation';
import { getPlayerById, getPlayersByOwner } from '@/repositories/playerRepository';
import { getTeamsByOwner } from '@/repositories/teamRepository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  
  // Jugador flow
  if (user?.role === 'jugador') {
    const jugador = await getPlayerById(supabase, user.id);
    
    if (!jugador) {
      return <p>Error: No se encontró tu perfil de jugador.</p>;
    }

    redirect(`/dashboard/jugador/${jugador.id}`);
  }

  const ownerId = getOwnerId(user);
  if (!ownerId) redirect('/login');

  let teams = [];
  try {
    const [resEquipos, resJugadores] = await Promise.all([
      getTeamsByOwner(supabase, ownerId),
      getPlayersByOwner(supabase, ownerId)
    ]);

    const counts = new Map();
    const playersByTeam = new Map();
    for (const player of resJugadores || []) {
      const teamId = String(player.equipo_id);
      counts.set(teamId, (counts.get(teamId) || 0) + 1);
      const currentPlayers = playersByTeam.get(teamId) || [];
      currentPlayers.push({
        id: player.id,
        nombre: player.nombre,
        apellidos: player.apellidos,
        posicion: player.posicion,
      });
      playersByTeam.set(teamId, currentPlayers);
    }

    teams = (resEquipos || []).map((team) => ({
      ...team,
      players_count: counts.get(String(team.id)) || 0,
      players: playersByTeam.get(String(team.id)) || [],
    }));
  } catch (err) {
    console.error('Error fetching teams:', err);
  }

  return <TeamsDashboard teams={teams} />;
}

