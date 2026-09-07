import TeamMenuDashboard from '@/components/TeamMenuDashboard';
import TeamHeaderTabs from '@/components/TeamHeaderTabs';
import { mockMenus, mockTeam } from '@/lib/boneyardMockData';
import { Stack } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamMenu() {
  return (
    <Stack gap="lg">
      <TeamHeaderTabs team={mockTeam} />
      <TeamMenuDashboard
        initialMenus={mockMenus}
        teamId={mockTeam.id}
        team={mockTeam}
      />
    </Stack>
  );
}
