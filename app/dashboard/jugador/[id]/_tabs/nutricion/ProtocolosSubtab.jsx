'use client';

import { Badge, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Timeline, Title } from '@mantine/core';
import { IconApple, IconBatteryCharging, IconClipboardList, IconCoffee, IconDroplet, IconFlag, IconRun } from '@tabler/icons-react';
import { EditableSection } from '../editable';
import { BentoCard } from '@/components/Bento/BentoItem';

export default function ProtocolosSubtab({ jugador, readOnly = false }) {
  const peso = Number(jugador.peso_kg || 0);
  const cafMin = peso ? Math.round(peso * 3) : 200;
  const cafMax = peso ? Math.round(peso * 6) : 400;

  async function saveField(field, value) {
    await fetch('/api/update-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: jugador.id, field, value }),
    });
  }

  const protDef = [
    `PROTOCOLO PREPARTIDO - ${jugador.nombre} ${jugador.apellidos}`,
    '',
    '-3/-4h | COMIDA PRINCIPAL:',
    '- CHO: arroz/pasta/patata',
    '- Proteina: 100-150g',
    '',
    '-90 min | SNACK: platano o gel',
    '',
    `-60 min | CAFEINA: ${cafMin}-${cafMax} mg`,
    '',
    'MEDIO TIEMPO: 300-500 ml isotonica',
    '',
    'POST +30min: proteina + CHO rapidos',
    '',
    'NOTAS:',
    '',
  ].join('\n');

  return (
    <Stack gap="lg">
      <Paper p="md" bg="white" shadow="xs" radius="lg" withBorder>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon color="dark" variant="light" radius="xl" size="lg">
              <IconClipboardList size={20} />
            </ThemeIcon>
            <Stack gap={2}>
              <Title order={3} fw={800} c="dark.4">Protocolos</Title>
              <Text size="sm" c="dimmed">
                Guía práctica para ordenar comida, ayudas, hidratación y recuperación del día de partido.
              </Text>
            </Stack>
          </Group>
          <Badge color="dark" variant="light" size="lg">Prepartido · medio tiempo · post</Badge>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" align="stretch">
        <BentoCard title="Timeline prepartido" icon={IconFlag} color="dark">
          <Timeline active={4} bulletSize={28} lineWidth={2} color="dark">
            <Timeline.Item bullet={<IconApple size={15} />} title="-3 / -4 h · Comida principal">
              <Text size="sm" c="dimmed">Base alta en CHO: arroz, pasta o patata. Proteína fácil de digerir, 100-150 g.</Text>
            </Timeline.Item>
            <Timeline.Item bullet={<IconRun size={15} />} title="-90 min · Snack">
              <Text size="sm" c="dimmed">Plátano, gel o opción habitual ya testada. Evitar novedades.</Text>
            </Timeline.Item>
            <Timeline.Item bullet={<IconCoffee size={15} />} title="-60 min · Cafeína">
              <Text size="sm" c="dimmed">{cafMin}-{cafMax} mg según tolerancia y rol esperado.</Text>
            </Timeline.Item>
            <Timeline.Item bullet={<IconDroplet size={15} />} title="Medio tiempo">
              <Text size="sm" c="dimmed">300-500 ml de isotónica y ajuste de CHO si hay alta carga.</Text>
            </Timeline.Item>
            <Timeline.Item bullet={<IconBatteryCharging size={15} />} title="+30 min · Recuperación">
              <Text size="sm" c="dimmed">Proteína + CHO rápidos. Priorizar disponibilidad si hay viaje.</Text>
            </Timeline.Item>
          </Timeline>
        </BentoCard>

        <BentoCard title="Checklist operativo" icon={IconClipboardList} color="blue">
          <Stack gap="sm">
            {[
              ['Comida', 'Baja en grasa y fibra si el jugador tiene molestias GI.'],
              ['Hidratación', 'Orina clara antes de salida. Electrolitos si calor o alta sudoración.'],
              ['Suplementos', 'Solo lo probado en entrenamiento. Nada nuevo en partido.'],
              ['Recuperación', 'Dejar preparado batido, snack y cena si hay desplazamiento.'],
            ].map(([title, detail]) => (
              <Paper key={title} p="sm" radius="md" bg="gray.0" withBorder>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{title}</Text>
                <Text size="sm" fw={600} c="dark.4">{detail}</Text>
              </Paper>
            ))}
          </Stack>
        </BentoCard>
      </SimpleGrid>

      <EditableSection
        title="Notas y protocolo individual"
        defaultValue={jugador.notas_protocolos || protDef}
        onSave={(v) => saveField('notas_protocolos', v)}
        readOnly={readOnly}
      />
    </Stack>
  );
}
