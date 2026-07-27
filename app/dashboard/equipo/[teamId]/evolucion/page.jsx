import { getSupabaseAdmin } from '@/lib/supabase-server';
import TeamEvolutionDashboard from '@/components/TeamEvolutionDashboard';
import { getUser } from '@/lib/auth';
import { getAccessibleTeam } from '@/lib/team-access';
import { getPlayersByTeamSelectSimple } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIds } from '@/repositories/evolutionRepository';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamEvolutionPage({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const team = await getAccessibleTeam(supabase, user, params.teamId);

  if (!team) {
    return (
      <NothingFound
        title="Sin acceso"
        description="No se pudo cargar este equipo o no tienes acceso."
        actionLabel="Volver a equipos"
        actionHref="/dashboard"
        withPaper
      />
    );
  }

  let players = [];
  let evolutions = [];

  try {
    players = await getPlayersByTeamSelectSimple(supabase, team.id);

    const playerIds = players.map((player) => player.id);
    if (playerIds.length) {
      evolutions = await getEvolutionsByPlayerIds(supabase, playerIds);
    }
  } catch (error) {
    console.error('Error fetching team evolution:', error);
  }

  return (
    <TeamEvolutionDashboard 
      players={players} 
      evolutions={evolutions} 
      team={team} 
      readOnly={user?.role === 'tecnico'}
    />
  );
}

