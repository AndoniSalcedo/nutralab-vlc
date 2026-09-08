import TeamConfigClient from '@/app/dashboard/equipo/[teamId]/configuracion/TeamConfigClient';
import TeamHeaderTabs from '@/components/TeamHeaderTabs';
import { mockTeam } from '@/lib/boneyardMockData';
import { Stack } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default function BoneyardTeamConfig() {
  return (
    <Stack >
      <TeamHeaderTabs team={mockTeam} />
      <TeamConfigClient team={mockTeam} readOnly={false} />
    </Stack>
  );
}
