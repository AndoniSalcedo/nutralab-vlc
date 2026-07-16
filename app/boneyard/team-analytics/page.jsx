import TeamAnalyticsDashboard from '@/components/TeamAnalyticsDashboard';
import { mockPlayers, mockAnalytics, mockTeam } from '@/lib/boneyardMockData';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamAnalytics() {
  return (
    <TeamAnalyticsDashboard
      players={mockPlayers}
      analiticas={mockAnalytics}
      team={mockTeam}
    />
  );
}
