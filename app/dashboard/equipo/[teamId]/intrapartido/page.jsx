import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessibleTeam } from '@/lib/auth/team-access';
import { buildSessionFromRows } from '@/config/intrapartido';
import { getPlayersByTeamSelectSimple } from '@/repositories/playerRepository';
import { getIntrapartidoHistoryByTeamId } from '@/repositories/intrapartidoRepository';
import TeamIntrapartidoDashboard from '@/components/TeamIntrapartidoDashboard';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamIntrapartidoPage({ params }) {
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
  let sessions = [];

  try {
    const [playersRes, history] = await Promise.all([
      getPlayersByTeamSelectSimple(db, team.id),
      getIntrapartidoHistoryByTeamId(db, team.id),
    ]);
    players = playersRes;
    sessions = history.map(({ match, convocados, tomas }) => buildSessionFromRows(match, convocados, tomas));
  } catch (error) {
    console.error('Error fetching team intrapartido history:', error);
  }

  return (
    <TeamIntrapartidoDashboard
      players={players}
      sessions={sessions}
      team={team}
      readOnly={user?.role === 'tecnico'}
    />
  );
}
