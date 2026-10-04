import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessibleTeam } from '@/lib/auth/team-access';
import NothingFound from '@/components/NothingFound';
import TeamHeaderTabs from '@/components/TeamHeaderTabs';
import { TeamHeaderSlotProvider } from '@/components/TeamHeaderContext';
import { Box, Stack } from '@mantine/core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamDashboardLayout({ children, params }) {
  const db = getDb();
  const user = await getUser();
  const { teamId } = await params;
  const team = await getAccessibleTeam(db, user, teamId);

  if (!team) {
    return (
      <NothingFound
        title="Sin acceso"
        icon3d="lock"
        description="No se pudo cargar este equipo o no tienes acceso."
        actionLabel="Volver a equipos"
        actionHref="/dashboard"
        withPaper
      />
    );
  }

  return (
    <TeamHeaderSlotProvider>
      <Stack gap={0} style={{ width: '100%', minWidth: 0, maxWidth: '100%' }} pb={{ base: 76, sm: 0 }} px={{ base: 6, sm: 0 }}>
        <TeamHeaderTabs team={team} readOnly={user?.role === 'tecnico'} />
        <Box mt={{ base: 2, md: 'md' }} >
          {children}
        </Box>
      </Stack>
    </TeamHeaderSlotProvider >
  );
}
