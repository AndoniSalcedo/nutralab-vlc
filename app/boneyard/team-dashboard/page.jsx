import DashboardContent from '@/components/DashboardContent';
import { mockPlayers, mockEvolutions, mockTeam } from '@/lib/boneyardMockData';
import { withLatestMeasurement } from '@/lib/player-metrics';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamDashboard() {
  const players = mockPlayers.map((player) =>
    withLatestMeasurement(
      player,
      mockEvolutions.filter((item) => String(item.jugador_id) === String(player.id))
    )
  );

  return <DashboardContent players={players} team={mockTeam} />;
}
