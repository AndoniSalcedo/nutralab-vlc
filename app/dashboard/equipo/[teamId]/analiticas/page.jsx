import { getSupabaseAdmin } from '@/lib/supabase-server';
import TeamAnalyticsDashboard from '@/components/TeamAnalyticsDashboard';
import { getUser } from '@/lib/auth';
import { getOwnedTeam } from '@/lib/team-access';
import { getPlayersByTeamSelectSimple } from '@/repositories/playerRepository';
import { getAnalyticsByPlayerIds } from '@/repositories/analyticsRepository';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamAnalyticsPage({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const { teamId } = await params;
  const team = await getOwnedTeam(supabase, user, teamId);

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
  let analiticas = [];

  try {
    players = await getPlayersByTeamSelectSimple(supabase, team.id);

    const playerIds = players.map((player) => player.id);
    if (playerIds.length) {
      analiticas = await getAnalyticsByPlayerIds(supabase, playerIds);
    }
  } catch (error) {
    console.error('Error fetching team analytics:', error);
  }

  return <TeamAnalyticsDashboard players={players} analiticas={analiticas} team={team} />;
}

