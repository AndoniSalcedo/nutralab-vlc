import TeamsDashboard from '@/components/TeamsDashboard';
import { mockTeams } from '@/lib/boneyardMockData';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamsList() {
  return <TeamsDashboard teams={mockTeams} />;
}
