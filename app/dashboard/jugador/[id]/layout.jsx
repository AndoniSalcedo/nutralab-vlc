import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnedPlayer } from '@/lib/team-access';
import JugadorHeader from '@/components/JugadorHeader';
import PlayerTabs from './_tabs/PlayerTabs';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import NothingFound from '@/components/NothingFound';

export default async function JugadorLayout({ children, params }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const isPlayer = user?.role === 'jugador';
  const id = params.id;

  if (!isPlayer) {
    const ownedPlayer = await getOwnedPlayer(supabase, user, id);
    if (!ownedPlayer) {
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
    <BoneyardSkeleton name="player-dashboard" loading={false}>
      <JugadorHeader jugador={jugador} user={user} />
      <PlayerTabs jugador={jugador}>
        {children}
      </PlayerTabs>
    </BoneyardSkeleton>
  );
}
