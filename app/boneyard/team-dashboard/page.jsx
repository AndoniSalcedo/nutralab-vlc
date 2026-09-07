import DashboardContent from '@/components/DashboardContent';
import TeamHeaderTabs from '@/components/TeamHeaderTabs';
import { mockPlayers, mockEvolutions, mockPesajes, mockTeam } from '@/lib/boneyardMockData';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { Stack } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamDashboard() {
  const players = mockPlayers.map((player) =>
    withLatestMeasurement(
      player,
      mockEvolutions.filter((item) => String(item.jugador_id) === String(player.id)),
      mockPesajes.filter((item) => String(item.jugador_id) === String(player.id))
    )
  );

  return (
    <Stack gap="lg">
      <TeamHeaderTabs team={mockTeam} />
      <DashboardContent players={players} team={mockTeam} />
    </Stack>
  );
}
