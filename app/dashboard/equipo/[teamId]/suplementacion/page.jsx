import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnedTeam } from '@/lib/team-access';
import { Anchor, Stack, Text } from '@mantine/core';
import TeamSupplementationDashboard from '@/components/TeamSupplementationDashboard';

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
    const resPlayers = await supabase
      .from('jugadores')
      .select('id,nombre,apellidos,posicion,auth_email')
      .eq('equipo_id', team.id)
      .order('nombre');

    if (resPlayers.error) throw resPlayers.error;
    players = resPlayers.data || [];

    const playerIds = players.map((player) => player.id);
    
    if (playerIds.length) {
      const [resAssignments, resExtras, resHistory, resCatalogs] = await Promise.all([
        supabase.from('jugador_suplementacion').select('*').in('jugador_id', playerIds),
        supabase.from('jugador_suplementos_extra').select('*').in('jugador_id', playerIds),
        supabase.from('jugador_suplementacion_historial')
          .select('id, jugador_id, lista_id, created_at')
          .in('jugador_id', playerIds)
          .order('created_at', { ascending: false }),
        supabase.from('suplementacion_listas').select('*').order('orden', { ascending: true })
      ]);

      if (resAssignments.error) throw resAssignments.error;
      if (resExtras.error) throw resExtras.error;
      if (resHistory.error) throw resHistory.error;
      if (resCatalogs.error) throw resCatalogs.error;

      assignments = resAssignments.data || [];
      extras = resExtras.data || [];
      history = resHistory.data || [];
      catalogs = resCatalogs.data || [];
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
