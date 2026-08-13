import { getSupabaseAdmin } from '@/lib/supabase-server';
import DashboardContent from '@/components/DashboardContent';
import { getUser } from '@/lib/auth';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { getAccessibleTeam } from '@/lib/team-access';
import { getPlayersByTeamSelect } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdsSimple } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerIdsSimple } from '@/repositories/pesajeRepository';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamDashboard({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const { teamId } = await params;
  const team = await getAccessibleTeam(supabase, user, teamId);

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
  try {
    const resJugadores = await getPlayersByTeamSelect(
      supabase,
      team.id,
      'id,nombre,apellidos,posicion,objetivo,auth_user_id,auth_email,credentials_created_at,equipo_id'
    );

    const playerIds = (resJugadores || []).map((player) => player.id);
    let evoluciones = [];
    let pesajes = [];
    if (playerIds.length) {
      [evoluciones, pesajes] = await Promise.all([
        getEvolutionsByPlayerIdsSimple(supabase, playerIds),
        getPesajesByPlayerIdsSimple(supabase, playerIds),
      ]);
    }

    players = (resJugadores || []).map((player) => (
      withLatestMeasurement(
        player,
        evoluciones.filter((item) => String(item.jugador_id) === String(player.id)),
        pesajes.filter((item) => String(item.jugador_id) === String(player.id))
      )
    ));
  } catch (err) {
    console.error('Error fetching team players/evolutions/pesajes:', err);
  }

  return <DashboardContent players={players} team={team} readOnly={user?.role === 'tecnico'} />;
}

