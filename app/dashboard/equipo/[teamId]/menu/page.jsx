import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getAccessibleTeam } from '@/lib/team-access';
import TeamMenuDashboard from '@/components/TeamMenuDashboard';
import { getMenusByTeam } from '@/repositories/menuRepository';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamMenuPage({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const { teamId } = await params;
  const team = await getAccessibleTeam(supabase, user, teamId);

  if (!team) {
    return (
      <NothingFound
        title="Sin acceso"
        description="No se pudo cargar este equipo o no tienes acceso."
        actionLabel="Volver a equipos"
        actionHref="/dashboard"
        withPaper
      />
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
