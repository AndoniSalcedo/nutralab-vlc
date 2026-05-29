import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { getOwnedPlayer } from '@/lib/team-access';
import JugadorHeader from '@/components/JugadorHeader';
import { Anchor, Stack, Text } from '@mantine/core';
import PlayerTabs from './_tabs/PlayerTabs';

export default async function JugadorView({ id, activeTab = 'general', activeSubtab }) {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  const isPlayer = user?.role === 'jugador';

  if (!isPlayer) {
    const ownedPlayer = await getOwnedPlayer(supabase, user, id);
    if (!ownedPlayer) {
      return (
        <Stack gap="lg" mt="md">
          <Text c="red">No tienes acceso a este jugador.</Text>
          <Anchor href="/dashboard">Volver al panel</Anchor>
        </Stack>
      );
    }
  }

  let jugador = null;
  let analiticas = [];
  let evoluciones = [];
  let messages = [];
  let menus = [];
  let registrosHidratacion = [];
  let informes = [];

  try {
    const [resJugador, resAnaliticas, resEvoluciones, resMenus, resHidratacion] = await Promise.all([
      supabase.from('jugadores').select('*').eq('id', id).single(),
      supabase.from('analiticas').select('*').eq('jugador_id', id).order('fecha_extraccion', { ascending: false }),
      supabase.from('evoluciones').select('*').eq('jugador_id', id).order('fecha', { ascending: true }),
      supabase.from('menu_semanal').select('*').order('semana', { ascending: false }).limit(10),
      supabase.from('registros_hidratacion').select('*').eq('jugador_id', id).order('fecha', { ascending: true }),
    ]);

    analiticas = resAnaliticas.data || [];
    evoluciones = resEvoluciones.data || [];
    jugador = withLatestMeasurement(resJugador.data, evoluciones);
    menus = resMenus.data || [];
    registrosHidratacion = resHidratacion.data || [];

    if (jugador?.equipo_id) {
      const [resMessages, resInformes] = await Promise.all([
        supabase
          .from('mensajes')
          .select('id,jugador_id,titulo,contenido,created_by_name,created_at')
          .eq('equipo_id', jugador.equipo_id)
          .or(`jugador_id.is.null,jugador_id.eq.${id}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('informes_semanales')
          .select('*')
          .eq('equipo_id', jugador.equipo_id)
          .order('semana', { ascending: false })
      ]);
      messages = resMessages.data || [];
      informes = resInformes.data || [];
    }
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
        registrosHidratacion={registrosHidratacion}
        messages={messages}
        menus={menus}
        informes={informes}
        activeTab={activeTab}
        activeSubtab={activeSubtab}
        readOnly={isPlayer}
      />
    </>
  );
}
