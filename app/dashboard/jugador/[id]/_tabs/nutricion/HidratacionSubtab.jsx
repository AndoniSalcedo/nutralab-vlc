'use client';

import { Badge, Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconActivityHeartbeat, IconDroplet } from '@tabler/icons-react';
import { EditableSection } from '../editable';
import { BentoCard } from '@/components/Bento/BentoItem';
import HydrationCalculator from '@/components/HydrationCalculator';

export default function HidratacionSubtab({ jugador, readOnly = false }) {
  const peso = Number(jugador.peso_kg || 0);
  const aguaBase = peso ? Math.round(peso * 40) : 0;
  const aguaEntreno = peso ? Math.round(peso * 6) : 0;
  const aguaPartido = peso ? Math.round(peso * 10) : 0;

  async function saveField(field, value) {
    await fetch('/api/update-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: jugador.id, field, value }),
    });
  }

  const hidDef = [
    `HIDRATACION - ${jugador.nombre} ${jugador.apellidos}`,
    '',
    `Descanso: ${aguaBase} ml | Entreno: ${aguaBase + aguaEntreno} ml | Partido: ${aguaBase + aguaPartido} ml`,
    '',
    'TIMING:',
    '- Al despertar: 500 ml',
    '- Pre-entreno: 500 ml + electrolitos',
    '- Durante entreno: 150-200 ml / 15 min',
    '- Post-entreno: 150% perdida',
    '- Con comidas: 300 ml',
    '',
    'NOTAS:',
    '',
  ].join('\n');

  return (
    <Stack gap={0}>
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
              <IconDroplet size={20} />
            </ThemeIcon>
            <Stack gap={2}>
              <Title order={3} fw={800} c="dark.4">Hidratación</Title>
              <Text size="sm" c="dimmed">
                Objetivos diarios de hidratación.
              </Text>
            </Stack>
          </Group>
          {peso ? (
            <Badge color="blue" variant="light" size="lg">{peso} kg · base 40 ml/kg</Badge>
          ) : (
            <Badge color="gray" variant="light" size="lg">Peso no definido</Badge>
          )}
        </Group>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <Stack gap={'md'}>
          <BentoCard title="Timing recomendado" icon={IconActivityHeartbeat} color="cyan">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing={{ base: 'md', sm: 'sm' }}>
              {[
                ['Al despertar', '500 ml'],
                ['Pre-entreno', '500 ml + electrolitos'],
                ['Durante', '150-200 ml / 15 min'],
                ['Post', '150% pérdida'],
                ['Comidas', '300 ml'],
              ].map(([label, value]) => (
                <Paper key={label} p="sm" radius="md" bg="gray.0" withBorder>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">{label}</Text>
                  <Text size="sm" fw={700} c="dark.4">{value}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </BentoCard>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={{ base: 'md', sm: 'lg' }} verticalSpacing={{ base: 'md', sm: 'lg' }}>
            <HydrationCalculator jugador={jugador} />
            <EditableSection title="Notas y ajustes de hidratación" defaultValue={jugador.notas_hidratacion || hidDef} onSave={(v) => saveField('notas_hidratacion', v)} readOnly={readOnly} />
          </SimpleGrid>
        </Stack>
      </Box>
    </Stack>
  );
}
