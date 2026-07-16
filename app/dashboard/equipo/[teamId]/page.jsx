import { getSupabaseAdmin } from '@/lib/supabase-server';
import DashboardContent from '@/components/DashboardContent';
import { getUser } from '@/lib/auth';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { getOwnedTeam } from '@/lib/team-access';
import { Anchor, Stack, Text } from '@mantine/core';
import { getPlayersByTeamSelect } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdsSimple } from '@/repositories/evolutionRepository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamDashboard({ params }) {
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
  try {
    const resJugadores = await getPlayersByTeamSelect(
      supabase,
      team.id,
      'id,nombre,apellidos,posicion,objetivo,auth_user_id,auth_email,credentials_created_at,equipo_id'
    );

    const playerIds = (resJugadores || []).map((player) => player.id);
    let evoluciones = [];
    if (playerIds.length) {
      evoluciones = await getEvolutionsByPlayerIdsSimple(supabase, playerIds);
    }

    players = (resJugadores || []).map((player) => (
      withLatestMeasurement(player, evoluciones.filter((item) => String(item.jugador_id) === String(player.id)))
    ));
  } catch (err) {
    console.error('Error fetching team players/evolutions:', err);
  }

  return <DashboardContent players={players} team={team} />;
}

