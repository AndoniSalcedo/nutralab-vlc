import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import JugadorHeader from '@/components/JugadorHeader';
import { Anchor, Stack, Text } from '@mantine/core';
import PlayerTabs from './_tabs/PlayerTabs';

export default async function JugadorView({ id, activeTab = 'resumen', activeSubtab }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const isPlayer = user?.role === 'jugador';

  let jugador = null;
  let analiticas = [];
  let evoluciones = [];

  try {
    const [resJugador, resAnaliticas, resEvoluciones] = await Promise.all([
      supabase.from('jugadores').select('*').eq('id', id).single(),
      supabase.from('analiticas').select('*').eq('jugador_id', id).order('fecha_extraccion', { ascending: false }),
      supabase.from('evoluciones').select('*').eq('jugador_id', id).order('fecha', { ascending: true }),
    ]);

    jugador = resJugador.data;
    analiticas = resAnaliticas.data || [];
    evoluciones = resEvoluciones.data || [];
  } catch (err) {
    console.error('Error fetching jugador details:', err);
  }

  if (!jugador) {
    return (
      <Stack gap="lg" mt="md">
        <Text c="red">No se pudo cargar la información del jugador o no existe.</Text>
        <Anchor href="/dashboard">Volver al panel</Anchor>
      </Stack>
    );
  }

  if (isPlayer && String(user.id) !== String(jugador.id)) {
    return (
      <Stack gap="lg" mt="md">
        <Text c="red">No tienes acceso a este jugador.</Text>
        <Anchor href="/dashboard">Volver al panel</Anchor>
      </Stack>
    );
  }

  return (
    <>
      <JugadorHeader jugador={jugador} user={user} />
      <PlayerTabs
        jugador={jugador}
        analiticas={analiticas}
        evoluciones={evoluciones}
        activeTab={activeTab}
        activeSubtab={activeSubtab}
        readOnly={isPlayer}
      />
    </>
  );
}
