import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import JugadorHeader from '@/components/JugadorHeader';
import PlayerTabs from '@/app/dashboard/jugador/[id]/_tabs/PlayerTabs';
import {
  mockPlayers,
  mockAnalytics,
  mockEvolutions,
  mockPesajes,
  mockHydration,
  mockMessages,
  mockMenus
} from '@/lib/boneyardMockData';
import { withLatestMeasurement } from '@/lib/player-metrics';

export const dynamic = 'force-dynamic';

export default function BoneyardPlayerDashboard() {
  const rawPlayer = mockPlayers.find((p) => p.id === 220);
  const evoluciones = mockEvolutions.filter((e) => e.jugador_id === 220);
  const pesajes = mockPesajes.filter((p) => p.jugador_id === 220);
  const jugador = withLatestMeasurement(rawPlayer, evoluciones, pesajes);

  const analiticas = mockAnalytics.filter((a) => a.jugador_id === 220);
  const registrosHidratacion = mockHydration.filter((h) => h.jugador_id === 220);
  const messages = mockMessages.filter((m) => m.jugador_id === 220);
  const menus = mockMenus.slice(0, 10);

  const mockUser = {
    id: 'boneyard-mock-user',
    email: 'boneyard@nutralab.com',
    role: 'tecnico',
    name: 'Boneyard Crawler',
  };

  return (
    <BoneyardSkeleton name="player-dashboard-metricas-mediciones" loading={false}>
      <JugadorHeader jugador={jugador} user={mockUser} />
      <PlayerTabs
        jugador={jugador}
        analiticas={analiticas}
        evoluciones={evoluciones}
        pesajes={pesajes}
        registrosHidratacion={registrosHidratacion}
        messages={messages}
        menus={menus}
        activeTab="metricas"
        activeSubtab="mediciones"
        readOnly={false}
      />
    </BoneyardSkeleton>
  );
}
