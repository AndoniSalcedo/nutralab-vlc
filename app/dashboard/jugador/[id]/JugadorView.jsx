import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { getOwnedPlayer } from '@/lib/team-access';
import JugadorHeader from '@/components/JugadorHeader';
import PlayerTabs from './_tabs/PlayerTabs';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import NothingFound from '@/components/NothingFound';
import { getAnalyticsByPlayerId } from '@/repositories/analyticsRepository';
import { getEvolutionsByPlayerId } from '@/repositories/evolutionRepository';
import { getMenusByTeam } from '@/repositories/menuRepository';
import { getHydrationRecordsByPlayerId } from '@/repositories/hydrationRepository';
import { getMessages } from '@/repositories/messagesRepository';

export default async function JugadorView({ id, activeTab = 'resumen', activeSubtab }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const isPlayer = user?.role === 'jugador';

  if (!isPlayer) {
    const ownedPlayer = await getOwnedPlayer(supabase, user, id);
    if (!ownedPlayer) {
      return (
        <NothingFound
          title="Sin acceso"
          description="No tienes acceso a este jugador."
          actionLabel="Volver al panel"
          actionHref="/dashboard"
          withPaper
        />
      );
    }
  }

  let jugador = null;
  let analiticas = [];
  let evoluciones = [];
  let messages = [];
  let menus = [];
  let registrosHidratacion = [];

  try {
    const rawJugador = await getPlayerWithTeamConfig(supabase, id);

    const [resAnaliticas, resEvoluciones, resMenus, resHidratacion] = await Promise.all([
      getAnalyticsByPlayerId(supabase, id),
      getEvolutionsByPlayerId(supabase, id),
      rawJugador?.equipo_id ? getMenusByTeam(supabase, rawJugador.equipo_id) : Promise.resolve([]),
      getHydrationRecordsByPlayerId(supabase, id),
    ]);

    analiticas = isPlayer ? resAnaliticas.filter(a => a.visible_para_jugador === true) : resAnaliticas;
    evoluciones = resEvoluciones;
    jugador = withLatestMeasurement(rawJugador, evoluciones);
    menus = resMenus.slice(0, 10);
    registrosHidratacion = resHidratacion;

    if (jugador?.equipo_id) {
      messages = await getMessages(supabase, jugador.equipo_id, id);
    }
  } catch (err) {
    console.error('Error fetching jugador details:', err);
  }


  if (!jugador) {
    return (
      <Stack gap="lg" mt="md">
        <Text c="red">No se pudo cargar la información del jugador o no existe.</Text>
        <Anchor href="/dashboard">Volver al panel</Anchor>
      </Stack>
    );
  }

  if (isPlayer && String(user.id) !== String(jugador.id)) {
    return (
      <NothingFound
        title="Sin acceso"
        description="No tienes acceso a este jugador."
        actionLabel="Volver al panel"
        actionHref="/dashboard"
        withPaper
      />
    );
  }

  return (
    <BoneyardSkeleton name="player-dashboard" loading={false}>
      <JugadorHeader jugador={jugador} user={user} />
      <PlayerTabs
        jugador={jugador}
        analiticas={analiticas}
        evoluciones={evoluciones}
        registrosHidratacion={registrosHidratacion}
        messages={messages}
        menus={menus}
        activeTab={activeTab}
        activeSubtab={activeSubtab}
        readOnly={isPlayer}
      />
    </BoneyardSkeleton>
  );
}
