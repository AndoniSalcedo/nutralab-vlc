import TeamSupplementationDashboard from '@/components/TeamSupplementationDashboard';
import TeamHeaderTabs from '@/components/TeamHeaderTabs';
import {
  mockPlayers,
  mockTeam,
  mockAssignments,
  mockExtras,
  mockHistory,
  mockCatalogs
} from '@/lib/boneyardMockData';
import { Stack } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamSupplementation() {
  return (
    <Stack gap="lg">
      <TeamHeaderTabs team={mockTeam} />
      <TeamSupplementationDashboard
        players={mockPlayers}
        team={mockTeam}
        initialAssignments={mockAssignments}
        initialExtras={mockExtras}
        history={mockHistory}
        catalogs={mockCatalogs}
        initialSelectedPlayerIds={null}
      />
    </Stack>
  );
}
