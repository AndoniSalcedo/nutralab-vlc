import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnedTeam } from '@/lib/team-access';
import { Anchor, Stack, Text } from '@mantine/core';
import TeamMenuDashboard from '@/components/TeamMenuDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamMenuPage({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const team = await getOwnedTeam(supabase, user, params.teamId);

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
    const { data, error } = await supabase
      .from('menu_semanal')
      .select('*')
      .eq('equipo_id', team.id)
      .order('semana', { ascending: false });

    if (error) throw error;
    menus = data || [];
  } catch (error) {
    console.error('Error fetching weekly menus:', error);
  }

  return (
    <TeamMenuDashboard 
      initialMenus={menus} 
      teamId={team.id}
    />
  );
}
