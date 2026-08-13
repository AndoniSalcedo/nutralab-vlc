import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnedTeam } from '@/lib/team-access';
import TeamConfigClient from './TeamConfigClient';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamConfigPage({ params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const { teamId } = await params;
  const team = await getOwnedTeam(supabase, user, teamId);

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

  return (
    <TeamConfigClient team={team} readOnly={user?.role === 'tecnico'} />
  );
}
