import { getSupabaseAdmin } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import PlayerTabs from '@/components/PlayerTabs';
import AnaliticasTab from '@/components/AnaliticasTab';
import EvolucionTab from '@/components/EvolucionTab';
import { Anchor, Group, Stack, Text, Title, Paper, Avatar, Badge, Button, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconEdit } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function JugadorPage({ params }) {
  const { id } = params;
  const supabase = getSupabaseAdmin();

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

  return (
    <Stack gap="lg">
      <Paper radius="lg" p="lg" withBorder shadow="sm" bg="white">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="md">
            <Anchor href="/dashboard" style={{ textDecoration: 'none' }}>
              <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                <IconChevronLeft size={24} />
              </ActionIcon>
            </Anchor>

            <Avatar size={84} radius="xl" color="blue">
              {jugador.nombre?.[0]}{jugador.apellidos?.[0]}
            </Avatar>

            <Stack gap={4}>
              <Title order={2} c="dark.4" lh={1.1} fz={26}>
                {jugador.nombre} {jugador.apellidos}
              </Title>
              
              <Group gap="xs" align="center">
                <Text c="dimmed" size="sm">
                  {jugador.posicion || 'Sin posición'}
                </Text>
                {jugador.club && (
                  <>
                    <Text c="dimmed" size="xs">•</Text>
                    <Text c="dimmed" size="sm">{jugador.club}</Text>
                  </>
                )}
              </Group>

              <Group gap="xs" mt={4}>
                {jugador.altura_cm && (
                  <Badge variant="light" color="gray" size="sm" radius="sm">
                    {jugador.altura_cm} cm
                  </Badge>
                )}
                {jugador.peso_kg && (
                  <Badge variant="light" color="blue" size="sm" radius="sm">
                    {jugador.peso_kg} kg
                  </Badge>
                )}
                {jugador.porcentaje_grasa && (
                  <Badge variant="light" color="orange" size="sm" radius="sm">
                    {jugador.porcentaje_grasa}% grasa
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>

          <Group gap="xs">
            <Button variant="default" radius="xl" size="sm" leftSection={<IconEdit size={16} />}>
              Editar Ficha
            </Button>
          </Group>
        </Group>
      </Paper>

      <Stack gap="md">
        <PlayerTabs jugador={jugador} />
      </Stack>

      <Stack gap="sm" mt="md">
        <Title order={3}>Evolución</Title>
        <EvolucionTab jugadorId={jugador.id} evolucionesIniciales={evoluciones || []} />
      </Stack>

      <Stack gap="sm" mt="md">
        <Title order={3}>Analíticas de sangre</Title>
        <AnaliticasTab jugadorId={jugador.id} analiticasIniciales={analiticas || []} />
      </Stack>
    </Stack>
  );
}