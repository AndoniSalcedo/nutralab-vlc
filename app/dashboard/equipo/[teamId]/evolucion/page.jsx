import { getSupabaseAdmin } from '@/lib/supabase-server';
import TeamEvolutionDashboard from '@/components/TeamEvolutionDashboard';
import { getUser } from '@/lib/auth';
import { getOwnedTeam } from '@/lib/team-access';
import { Anchor, Stack, Text } from '@mantine/core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamEvolutionPage({ params }) {
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
  let evolutions = [];

  try {
    const resPlayers = await supabase
      .from('jugadores')
      .select('id,nombre,apellidos,posicion')
      .eq('equipo_id', team.id)
      .order('nombre');

    if (resPlayers.error) throw resPlayers.error;
    players = resPlayers.data || [];

    const playerIds = players.map((player) => player.id);
    if (playerIds.length) {
      const resEvolutions = await supabase
        .from('evoluciones')
        .select('id,jugador_id,fecha,peso_kg,porcentaje_grasa,masa_magra_kg,suma_6_pliegues')
        .in('jugador_id', playerIds)
        .order('fecha', { ascending: true });

      if (resEvolutions.error) throw resEvolutions.error;
      evolutions = resEvolutions.data || [];
    }
  } catch (error) {
    console.error('Error fetching team evolution:', error);
  }

  return <TeamEvolutionDashboard players={players} evolutions={evolutions} team={team} />;
}
