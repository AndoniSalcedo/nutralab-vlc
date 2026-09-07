import TeamEvolutionDashboard from '@/components/TeamEvolutionDashboard';
import TeamHeaderTabs from '@/components/TeamHeaderTabs';
import { mockPlayers, mockEvolutions, mockTeam } from '@/lib/boneyardMockData';
import { Stack } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamEvolution() {
  return (
    <Stack gap="lg">
      <TeamHeaderTabs team={mockTeam} />
      <TeamEvolutionDashboard
        players={mockPlayers}
        evolutions={mockEvolutions}
        team={mockTeam}
      />
    </Stack>
  );
}
