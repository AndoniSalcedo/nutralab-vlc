import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessibleTeam } from '@/lib/auth/team-access';
import TeamConfigClient from './TeamConfigClient';
import NothingFound from '@/components/NothingFound';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamConfigPage({ params }) {
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
    <TeamConfigClient team={team} readOnly={user?.role === 'tecnico'} />
  );
}
