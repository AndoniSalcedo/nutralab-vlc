'use client';

import { Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import { BentoCard } from '@/components/Bento/BentoItem';

export default function FichaSubtab({ jugador }) {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Altura</Text>
          <Title order={2} mt={5}>{jugador.altura_cm ? `${jugador.altura_cm} cm` : '-'}</Title>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Peso actual</Text>
          <Title order={2} mt={5}>{jugador.peso_kg ? `${jugador.peso_kg} kg` : '-'}</Title>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>% Grasa</Text>
          <Title order={2} mt={5}>{jugador.porcentaje_grasa ? `${jugador.porcentaje_grasa}%` : '-'}</Title>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Masa magra</Text>
          <Title order={2} mt={5}>{jugador.masa_magra_kg ? `${jugador.masa_magra_kg} kg` : '-'}</Title>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Última medición</Text>
          <Title order={3} mt={8}>{jugador.fecha_ultima_medicion || '-'}</Title>
        </Paper>
        <Paper p="md" radius="lg" withBorder shadow="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Posición</Text>
          <Title order={3} mt={8}>{jugador.posicion || '-'}</Title>
        </Paper>
      </SimpleGrid>

      {(jugador.endomorfia || jugador.mesomorfia || jugador.ectomorfia) && (
        <BentoCard title="Somatotipo" icon={IconChartBar} color="violet">
          <SimpleGrid cols={3}>
            <Stack gap={0}>
              <Text size="xs" c="dimmed">Endomorfia</Text>
              <Text fw={700}>{jugador.endomorfia}</Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed">Mesomorfia</Text>
              <Text fw={700}>{jugador.mesomorfia}</Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed">Ectomorfia</Text>
              <Text fw={700}>{jugador.ectomorfia}</Text>
            </Stack>
          </SimpleGrid>
        </BentoCard>
      )}
    </Stack>
  );
}
