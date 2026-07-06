import { getSupabaseAdmin } from '@/lib/supabase-server';
import DashboardContent from '@/components/DashboardContent';
import { getUser } from '@/lib/auth';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { getOwnedTeam } from '@/lib/team-access';
import { Anchor, Stack, Text } from '@mantine/core';

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
    const resJugadores = await supabase
      .from('jugadores')
      .select('id,nombre,apellidos,posicion,kcal_objetivo,factor_actividad,objetivo,auth_user_id,auth_email,credentials_created_at,equipo_id')
      .eq('equipo_id', team.id)
      .order('nombre');

    if (resJugadores.error) throw resJugadores.error;

    const playerIds = (resJugadores.data || []).map((player) => player.id);
    let evoluciones = [];
    if (playerIds.length) {
      const res = await supabase
        .from('evoluciones')
        .select('jugador_id,fecha,peso_kg,porcentaje_grasa,masa_magra_kg')
        .in('jugador_id', playerIds);
      if (res.error) throw res.error;
      evoluciones = res.data || [];
    }

    players = (resJugadores.data || []).map((player) => (
      withLatestMeasurement(player, evoluciones.filter((item) => String(item.jugador_id) === String(player.id)))
    ));
  } catch (err) {
    console.error('Error fetching team players/evolutions:', err);
  }

  return <DashboardContent players={players} team={team} />;
}
