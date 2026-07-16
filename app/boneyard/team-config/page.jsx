import TeamConfigClient from '@/app/dashboard/equipo/[teamId]/configuracion/TeamConfigClient';
import { mockTeam } from '@/lib/boneyardMockData';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamConfig() {
  return (
    <TeamConfigClient team={mockTeam} readOnly={false} />
  );
}
