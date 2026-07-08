import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getAccessibleTeam } from '@/lib/team-access';
import { Anchor, Stack, Text } from '@mantine/core';
import TeamMenuDashboard from '@/components/TeamMenuDashboard';
import { getMenusByTeam } from '@/repositories/menuRepository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamMenuPage({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const team = await getAccessibleTeam(supabase, user, params.teamId);

  if (!team) {
    return (
      <Stack gap="lg" mt="md">
        <Text c="red">No se pudo cargar este equipo o no tienes acceso.</Text>
        <Anchor href="/dashboard">Volver a equipos</Anchor>
      </Stack>
    );
  }

  let menus = [];
  try {
    menus = await getMenusByTeam(supabase, team.id);
  } catch (error) {
    console.error('Error fetching weekly menus:', error);
  }

  return (
    <TeamMenuDashboard 
      initialMenus={menus} 
      teamId={team.id} 
      readOnly={user?.role === 'tecnico'}
    />
  );
}
