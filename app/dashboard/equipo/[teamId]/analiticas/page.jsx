import { getSupabaseAdmin } from '@/lib/supabase-server';
import TeamAnalyticsDashboard from '@/components/TeamAnalyticsDashboard';
import { getUser } from '@/lib/auth';
import { getOwnedTeam } from '@/lib/team-access';
import { Anchor, Stack, Text } from '@mantine/core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamAnalyticsPage({ params }) {
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
  let analiticas = [];

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
      const resAnaliticas = await supabase
        .from('analiticas')
        .select('*')
        .in('jugador_id', playerIds)
        .order('fecha_extraccion', { ascending: false });

      if (resAnaliticas.error) throw resAnaliticas.error;
      analiticas = resAnaliticas.data || [];
    }
  } catch (error) {
    console.error('Error fetching team analytics:', error);
  }

  return <TeamAnalyticsDashboard players={players} analiticas={analiticas} team={team} />;
}
