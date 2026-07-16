import TeamEvolutionDashboard from '@/components/TeamEvolutionDashboard';
import { mockPlayers, mockEvolutions, mockTeam } from '@/lib/boneyardMockData';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamEvolution() {
  return (
    <TeamEvolutionDashboard
      players={mockPlayers}
      evolutions={mockEvolutions}
      team={mockTeam}
    />
  );
}
