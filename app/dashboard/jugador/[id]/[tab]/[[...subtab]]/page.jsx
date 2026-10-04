import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { getAccessiblePlayer } from '@/lib/auth/team-access';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getAnalyticsByPlayerId } from '@/repositories/analyticsRepository';
import { getEvolutionsByPlayerId } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerId } from '@/repositories/pesajeRepository';
import { getMenusByTeam } from '@/repositories/menuRepository';
import { getAiPlansByPlayerId } from '@/repositories/aiPlanRepository';
import { getHydrationRecordsByPlayerId } from '@/repositories/hydrationRepository';
import { getMessages } from '@/repositories/messagesRepository';
import NothingFound from '@/components/NothingFound';
import PlayerTabContainer from './PlayerTabContainer';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

export const dynamic = 'force-dynamic';

export default async function JugadorTabPage({ params }) {
  const db = getDb();
  const user = await getUser();
  const isPlayer = user?.role === 'jugador';
  const DEFAULT_SUBTABS = {
    resumen: 'perfil',
    metricas: 'mediciones',
    nutricion: 'plan',
  };

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const activeTab = resolvedParams.tab || 'resumen';
  const activeSubtab = resolvedParams.subtab?.[0] || DEFAULT_SUBTABS[activeTab] || 'perfil';

  const rawJugador = await getPlayerWithTeamConfig(db, id);
  if (!rawJugador) {
    return (
      <NothingFound
        title="Jugador no encontrado"
        icon3d="search"
        description="No se pudo cargar la información del jugador o no existe."
        actionLabel="Volver al panel"
        actionHref="/dashboard"
        withPaper
      />
    );
  }

  if (!isPlayer) {
    const accessiblePlayer = await getAccessiblePlayer(db, user, id);
    if (!accessiblePlayer) {
      return (
        <NothingFound
          title="Sin acceso"
          icon3d="lock"
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
        icon3d="lock"
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
  let latestPlan = null;
  let jugador = rawJugador;

  try {
    if (activeTab === 'resumen') {
      const [resEvoluciones, resPesajes, resHidratacion, resMenus, resPlanes] = await Promise.all([
        getEvolutionsByPlayerId(db, id),
        getPesajesByPlayerId(db, id),
        getHydrationRecordsByPlayerId(db, id),
        rawJugador?.equipo_id ? getMenusByTeam(db, rawJugador.equipo_id) : [],
        // El plan es opcional para el resumen: si falla, el widget muestra su estado vacío
        getAiPlansByPlayerId(db, id).catch(() => []),
      ]);
      evoluciones = resEvoluciones;
      pesajes = resPesajes;
      registrosHidratacion = resHidratacion;
      menus = (resMenus || []).slice(0, 10);
      // Ordenados por created_at desc: el primero es el último plan publicado
      latestPlan = (resPlanes || [])[0] || null;
      jugador = withLatestMeasurement(rawJugador, evoluciones, pesajes);
      if (jugador?.equipo_id) {
        messages = await getMessages(db, jugador.equipo_id, id);
      }
    } else if (activeTab === 'metricas') {
      const [resAnaliticas, resEvoluciones, resHidratacion, resPesajes] = await Promise.all([
        getAnalyticsByPlayerId(db, id),
        getEvolutionsByPlayerId(db, id),
        getHydrationRecordsByPlayerId(db, id),
        getPesajesByPlayerId(db, id),
      ]);
      analiticas = isPlayer ? resAnaliticas.filter(a => a.visible_para_jugador === true) : resAnaliticas;
      evoluciones = resEvoluciones;
      pesajes = resPesajes;
      jugador = withLatestMeasurement(rawJugador, evoluciones, pesajes);
      registrosHidratacion = resHidratacion;
    } else if (activeTab === 'nutricion') {
      const [resMenus, resEvoluciones, resPesajes] = await Promise.all([
        rawJugador?.equipo_id ? getMenusByTeam(db, rawJugador.equipo_id) : [],
        getEvolutionsByPlayerId(db, id),
        getPesajesByPlayerId(db, id),
      ]);
      menus = resMenus.slice(0, 10);
      evoluciones = resEvoluciones;
      pesajes = resPesajes;
      jugador = withLatestMeasurement(rawJugador, evoluciones, pesajes);
    }
  } catch (err) {
    console.error('Error fetching tab details:', err);
  }

  const skeletonName = activeSubtab
    ? `player-dashboard-${activeTab}-${activeSubtab}`
    : `player-dashboard-${activeTab}`;

  return (
    <BoneyardSkeleton name={skeletonName} loading={false}>
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
        latestPlan={latestPlan}
      />
    </BoneyardSkeleton>
  );
}
