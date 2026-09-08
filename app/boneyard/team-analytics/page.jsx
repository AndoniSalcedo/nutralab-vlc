import TeamAnalyticsDashboard from '@/components/TeamAnalyticsDashboard';
import TeamHeaderTabs from '@/components/TeamHeaderTabs';
import { mockPlayers, mockAnalytics, mockTeam } from '@/lib/boneyardMockData';
import { Stack } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamAnalytics() {
  return (
    <Stack>
      <TeamHeaderTabs team={mockTeam} />
      <TeamAnalyticsDashboard
        players={mockPlayers}
        analiticas={mockAnalytics}
        team={mockTeam}
      />
    </Stack>
  );
}
