import { getDb } from '@/lib/db/prisma';
import TeamAnalyticsDashboard from '@/components/TeamAnalyticsDashboard';
import { getUser } from '@/lib/auth/session';
import { getAccessibleTeam } from '@/lib/auth/team-access';
import { getPlayersByTeamSelectSimple } from '@/repositories/playerRepository';
import { getAnalyticsByPlayerIds } from '@/repositories/analyticsRepository';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamAnalyticsPage({ params }) {
  const db = getDb();
  const user = await getUser();
  const { teamId } = await params;
  const team = await getAccessibleTeam(db, user, teamId);

  if (!team) {
    return (
      <NothingFound
        title="Sin acceso"
        icon3d="lock"
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
    players = await getPlayersByTeamSelectSimple(db, team.id);

    const playerIds = players.map((player) => player.id);
    if (playerIds.length) {
      analiticas = await getAnalyticsByPlayerIds(db, playerIds);
    }
  } catch (error) {
    console.error('Error fetching team analytics:', error);
  }

  return <TeamAnalyticsDashboard players={players} analiticas={analiticas} team={team} />;
}

