import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getAccessiblePlayer } from '@/lib/team-access';
import JugadorHeader from '@/components/JugadorHeader';
import PlayerTabs from './_tabs/PlayerTabs';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import NothingFound from '@/components/NothingFound';
import { Box } from '@mantine/core';

export default async function JugadorLayout({ children, params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const isPlayer = user?.role === 'jugador';
  const { id } = await params;

  if (!isPlayer) {
    const accessiblePlayer = await getAccessiblePlayer(supabase, user, id);
    if (!accessiblePlayer) {
      return (
        <NothingFound
          title="Sin acceso"
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
    jugador = await getPlayerWithTeamConfig(supabase, id);
  } catch (err) {
    console.error('Error fetching jugador details:', err);
  }

  if (!jugador) {
    return (
      <NothingFound
        title="Jugador no encontrado"
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
        description="No tienes acceso a este jugador."
        actionLabel="Volver al panel"
        actionHref="/dashboard"
        withPaper
      />
    );
  }

  return (
    <>
      {/* En escritorio la ficha del jugador conserva su cabecera actual. En móvil
          se muestra dentro de Resumen > Perfil para dejar libre la parte superior. */}
      <Box visibleFrom="sm">
        <JugadorHeader jugador={jugador} user={user} />
      </Box>
      <PlayerTabs
        jugador={jugador}
        user={user}
        readOnly={isPlayer || user?.role === 'tecnico'}
        isPlayer={isPlayer}
      >
        {children}
      </PlayerTabs>
    </>
  );
}
