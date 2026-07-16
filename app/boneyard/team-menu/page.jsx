import TeamMenuDashboard from '@/components/TeamMenuDashboard';
import { mockMenus, mockTeam } from '@/lib/boneyardMockData';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamMenu() {
  return (
    <TeamMenuDashboard
      initialMenus={mockMenus}
      teamId={mockTeam.id}
    />
  );
}
