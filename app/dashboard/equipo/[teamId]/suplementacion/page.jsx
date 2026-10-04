import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessibleTeam } from '@/lib/auth/team-access';
import TeamSupplementationDashboard from '@/components/TeamSupplementationDashboard';
import { getPlayersByTeamSelect } from '@/repositories/playerRepository';
import {
  getJugadorSuplementacionByPlayers,
  getJugadorSuplementosExtraByPlayers,
  getSuplementacionHistorialByPlayers,
  getAllSuplementacionListas
} from '@/repositories/supplementationRepository';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamSupplementationPage({ params, searchParams }) {
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
  let assignments = [];
  let extras = [];
  let history = [];
  let catalogs = [];

  try {
    players = await getPlayersByTeamSelect(db, team.id, 'id,nombre,apellidos,posicion,auth_email,avatar_size,updated_at');

    const playerIds = players.map((player) => player.id);
    
    if (playerIds.length) {
      const [resAssignments, resExtras, resHistory, resCatalogs] = await Promise.all([
        getJugadorSuplementacionByPlayers(db, playerIds),
        getJugadorSuplementosExtraByPlayers(db, playerIds),
        getSuplementacionHistorialByPlayers(db, playerIds),
        getAllSuplementacionListas(db)
      ]);

      assignments = resAssignments;
      extras = resExtras;
      history = resHistory;
      catalogs = resCatalogs;
    }
  } catch (error) {
    console.error('Error fetching team supplementation:', error);
  }

  const sParams = await searchParams;
  const playersParam = sParams?.players || sParams?.jugadores || sParams?.playerIds;
  const initialSelectedPlayerIds = playersParam
    ? String(playersParam).split(',').map(Number).filter(Number.isFinite)
    : null;

  return (
    <TeamSupplementationDashboard 
      players={players} 
      team={team} 
      initialAssignments={assignments}
      initialExtras={extras}
      history={history}
      catalogs={catalogs}
      readOnly={user?.role === 'tecnico'}
      initialSelectedPlayerIds={initialSelectedPlayerIds}
    />
  );
}
