import TeamSupplementationDashboard from '@/components/TeamSupplementationDashboard';
import {
  mockPlayers,
  mockTeam,
  mockAssignments,
  mockExtras,
  mockHistory,
  mockCatalogs
} from '@/lib/boneyardMockData';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamSupplementation() {
  return (
    <TeamSupplementationDashboard
      players={mockPlayers}
      team={mockTeam}
      initialAssignments={mockAssignments}
      initialExtras={mockExtras}
      history={mockHistory}
      catalogs={mockCatalogs}
      initialSelectedPlayerIds={null}
    />
  );
}
