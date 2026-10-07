import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getAccessiblePlayer } from '@/lib/auth/team-access';
import PlayerTabs from './_tabs/PlayerTabs';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import NothingFound from '@/components/NothingFound';

export default async function JugadorLayout({ children, params }) {
  const db = getDb();
  const user = await getUser();
  const isPlayer = user?.role === 'jugador';
  const { id } = await params;

  if (!isPlayer) {
    const accessiblePlayer = await getAccessiblePlayer(db, user, id);
    if (!accessiblePlayer) {
      return (
        <NothingFound
          title="Sin acceso"
          icon3d="lock"
          description="No tienes acceso a este jugador."
          actionLabel="Volver al panel"
          actionHref="/dashboard"
          withPaper
        />
      );
    }
  }

  let jugador = null;
  try {
    jugador = await getPlayerWithTeamConfig(db, id);
  } catch (err) {
    console.error('Error fetching jugador details:', err);
  }

  if (!jugador) {
    return (
      <NothingFound
        title="Jugador no encontrado"
        icon3d="search"
        description="No se pudo cargar la información del jugador o no existe."
        actionLabel="Volver al panel"
        actionHref="/dashboard"
        withPaper
      />
    );
  }

  if (isPlayer && String(user.id) !== String(jugador.id)) {
    return (
      <NothingFound
        title="Sin acceso"
        icon3d="lock"
        description="No tienes acceso a este jugador."
        actionLabel="Volver al panel"
        actionHref="/dashboard"
        withPaper
      />
    );
  }

  return (
    <PlayerTabs
      jugador={jugador}
      user={user}
      readOnly={isPlayer || user?.role === 'tecnico'}
      isPlayer={isPlayer}
    >
      {children}
    </PlayerTabs>
  );
}
