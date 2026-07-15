import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnedTeam } from '@/lib/team-access';
import { Anchor, Stack, Text } from '@mantine/core';
import TeamSupplementationDashboard from '@/components/TeamSupplementationDashboard';
import { getPlayersByTeamSelect } from '@/repositories/playerRepository';
import {
  getJugadorSuplementacionByPlayers,
  getJugadorSuplementosExtraByPlayers,
  getSuplementacionHistorialByPlayers,
  getAllSuplementacionListas
} from '@/repositories/supplementationRepository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamSupplementationPage({ params, searchParams }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const team = await getOwnedTeam(supabase, user, params.teamId);

  if (!team) {
    return (
      <Stack gap="lg" mt="md">
        <Text c="red">No se pudo cargar este equipo o no tienes acceso.</Text>
        <Anchor href="/dashboard">Volver a equipos</Anchor>
      </Stack>
    );
  }

  let players = [];
  let assignments = [];
  let extras = [];
  let history = [];
  let catalogs = [];

  try {
    players = await getPlayersByTeamSelect(supabase, team.id, 'id,nombre,apellidos,posicion,auth_email');

    const playerIds = players.map((player) => player.id);
    
    if (playerIds.length) {
      const [resAssignments, resExtras, resHistory, resCatalogs] = await Promise.all([
        getJugadorSuplementacionByPlayers(supabase, playerIds),
        getJugadorSuplementosExtraByPlayers(supabase, playerIds),
        getSuplementacionHistorialByPlayers(supabase, playerIds),
        getAllSuplementacionListas(supabase)
      ]);

      assignments = resAssignments;
      extras = resExtras;
      history = resHistory;
      catalogs = resCatalogs;
    }
  } catch (error) {
    console.error('Error fetching team supplementation:', error);
  }


  const playersParam = searchParams?.players || searchParams?.jugadores || searchParams?.playerIds;
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
      initialSelectedPlayerIds={initialSelectedPlayerIds}
    />
  );
}
