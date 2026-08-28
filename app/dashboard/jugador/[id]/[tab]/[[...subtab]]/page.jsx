import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { getOwnedPlayer } from '@/lib/team-access';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getAnalyticsByPlayerId } from '@/repositories/analyticsRepository';
import { getEvolutionsByPlayerId } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerId } from '@/repositories/pesajeRepository';
import { getMenusByTeam } from '@/repositories/menuRepository';
import { getHydrationRecordsByPlayerId } from '@/repositories/hydrationRepository';
import { getMessages } from '@/repositories/messagesRepository';
import NothingFound from '@/components/NothingFound';
import PlayerTabContainer from './PlayerTabContainer';

export const dynamic = 'force-dynamic';

export default async function JugadorTabPage({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const isPlayer = user?.role === 'jugador';
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const activeTab = resolvedParams.tab;
  const activeSubtab = resolvedParams.subtab?.[0];

  const rawJugador = await getPlayerWithTeamConfig(supabase, id);
  if (!rawJugador) {
    return (
      <NothingFound
        title="Jugador no encontrado"
        description="No se pudo cargar la información del jugador o no existe."
        actionLabel="Volver al panel"
        actionHref="/dashboard"
        withPaper
      />
    );
  }

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

  if (isPlayer && String(user.id) !== String(rawJugador.id)) {
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

  let evoluciones = [];
  let pesajes = [];
  let analiticas = [];
  let registrosHidratacion = [];
  let messages = [];
  let menus = [];
  let jugador = rawJugador;

  try {
    if (activeTab === 'resumen') {
      const [resEvoluciones, resPesajes, resHidratacion, resMenus] = await Promise.all([
        getEvolutionsByPlayerId(supabase, id),
        getPesajesByPlayerId(supabase, id),
        getHydrationRecordsByPlayerId(supabase, id),
        rawJugador?.equipo_id ? getMenusByTeam(supabase, rawJugador.equipo_id) : [],
      ]);
      evoluciones = resEvoluciones;
      pesajes = resPesajes;
      registrosHidratacion = resHidratacion;
      menus = (resMenus || []).slice(0, 10);
      jugador = withLatestMeasurement(rawJugador, evoluciones, pesajes);
      if (jugador?.equipo_id) {
        messages = await getMessages(supabase, jugador.equipo_id, id);
      }
    } else if (activeTab === 'metricas') {
      const [resAnaliticas, resEvoluciones, resHidratacion, resPesajes] = await Promise.all([
        getAnalyticsByPlayerId(supabase, id),
        getEvolutionsByPlayerId(supabase, id),
        getHydrationRecordsByPlayerId(supabase, id),
        getPesajesByPlayerId(supabase, id),
      ]);
      analiticas = isPlayer ? resAnaliticas.filter(a => a.visible_para_jugador === true) : resAnaliticas;
      evoluciones = resEvoluciones;
      pesajes = resPesajes;
      jugador = withLatestMeasurement(rawJugador, evoluciones, pesajes);
      registrosHidratacion = resHidratacion;
    } else if (activeTab === 'nutricion') {
      const [resMenus, resEvoluciones, resPesajes] = await Promise.all([
        rawJugador?.equipo_id ? getMenusByTeam(supabase, rawJugador.equipo_id) : [],
        getEvolutionsByPlayerId(supabase, id),
        getPesajesByPlayerId(supabase, id),
      ]);
      menus = resMenus.slice(0, 10);
      evoluciones = resEvoluciones;
      pesajes = resPesajes;
      jugador = withLatestMeasurement(rawJugador, evoluciones, pesajes);
    }
  } catch (err) {
    console.error('Error fetching tab details:', err);
  }

  return (
    <PlayerTabContainer
      tab={activeTab}
      activeSubtab={activeSubtab}
      jugador={jugador}
      readOnly={isPlayer || user?.role === 'tecnico'}
      isPlayer={isPlayer}
      evoluciones={evoluciones}
      pesajes={pesajes}
      analiticas={analiticas}
      registrosHidratacion={registrosHidratacion}
      messages={messages}
      menus={menus}
    />
  );
}
