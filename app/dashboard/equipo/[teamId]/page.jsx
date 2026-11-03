import { getDb } from '@/lib/db/prisma';
import DashboardContent from '@/components/DashboardContent';
import { getUser } from '@/lib/auth/session';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { getAccessibleTeam } from '@/lib/auth/team-access';
import { getPlayersByTeamSelect, getLastActivityByPlayerIds } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdsSimple } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerIdsSimple } from '@/repositories/pesajeRepository';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamDashboard({ params }) {
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
  try {
    const resJugadores = await getPlayersByTeamSelect(
      db,
      team.id,
      'id,nombre,apellidos,posicion,objetivo,porcentaje_grasa_objetivo,auth_user_id,auth_email,credentials_created_at,equipo_id,avatar_size,updated_at,fecha_nacimiento,num_comidas,gustos_preferencias,aversiones,intolerancias,contexto_clinico,postentreno,preentreno'
    );

    const playerIds = (resJugadores || []).map((player) => player.id);
    let evoluciones = [];
    let pesajes = [];
    let lastActivity = {};
    if (playerIds.length) {
      [evoluciones, pesajes, lastActivity] = await Promise.all([
        getEvolutionsByPlayerIdsSimple(db, playerIds),
        getPesajesByPlayerIdsSimple(db, playerIds),
        // Un fallo aquí no debe dejar la plantilla vacía: es solo un indicador
        getLastActivityByPlayerIds(db, playerIds).catch((err) => {
          console.error('Error fetching player last activity:', err);
          return {};
        }),
      ]);
    }

    players = (resJugadores || []).map((player) => ({
      ...withLatestMeasurement(
        player,
        evoluciones.filter((item) => String(item.jugador_id) === String(player.id)),
        pesajes.filter((item) => String(item.jugador_id) === String(player.id))
      ),
      ultimo_registro: lastActivity[player.id] || null,
    }));
  } catch (err) {
    console.error('Error fetching team players/evolutions/pesajes:', err);
  }

  return <DashboardContent players={players} team={team} readOnly={user?.role === 'tecnico'} />;
}

