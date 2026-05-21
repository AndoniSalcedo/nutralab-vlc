'use client';

import { Badge, Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBottle, IconBolt, IconCoffee, IconMoonStars, IconPill, IconShieldCheck } from '@tabler/icons-react';
import { EditableSection } from '../editable';
import { BentoCard } from '@/components/Bento/BentoItem';

function SupplementCard({ title, dose, timing, note, color, icon: Icon }) {
  return (
    <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm" h="100%" style={{ borderTop: `4px solid var(--mantine-color-${color}-filled)` }}>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{title}</Text>
            <Text size="lg" fw={800} c="dark.4">{dose}</Text>
          </Stack>
          <ThemeIcon color={color} variant="light" radius="xl" size="lg">
            <Icon size={20} />
          </ThemeIcon>
        </Group>
        <Badge color={color} variant="light" radius="sm" w="fit-content">{timing}</Badge>
        <Text size="xs" c="dimmed">{note}</Text>
      </Stack>
    </Paper>
  );
}

export default function SuplementacionSubtab({ jugador, readOnly = false }) {
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

  const supDef = [
    `SUPLEMENTACION - ${jugador.nombre} ${jugador.apellidos}`,
    '',
    'EVIDENCIA A:',
    '- Creatina: 3-5 g/dia post-entreno',
    `- Cafeina: ${cafMin}-${cafMax} mg x 60 min pre-partido`,
    '- Beta-alanina: 3.2-6.4 g/dia',
    '',
    'MICRONUTRIENTES:',
    '- Vitamina D3: 2000-4000 UI/dia',
    '- Omega-3: 2-4 g EPA+DHA',
    '- Magnesio: 300-400 mg noche',
    '',
    'NOTAS ANALITICA:',
    '',
  ].join('\n');

  return (
    <Stack gap={0}>
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon color="grape" variant="light" radius="xl" size="lg">
              <IconBottle size={20} />
            </ThemeIcon>
            <Stack gap={2}>
              <Title order={3} fw={800} c="dark.4">Suplementación</Title>
              <Text size="sm" c="dimmed">
                Ayudas y micronutrientes.
              </Text>
            </Stack>
          </Group>
          <Badge color="grape" variant="light" size="lg">
            {peso ? `${peso} kg · cafeína personalizada` : 'Dosis estándar'}
          </Badge>
        </Group>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }}>
        <Stack gap={0}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 'md', sm: 'md' }} mb={{ base: 'md', sm: 'xl' }}>
            <SupplementCard
              title="Creatina"
              dose="3-5 g"
              timing="Diario"
              note="Preferible post-entreno o con comida. Mantener constancia."
              color="blue"
              icon={IconBolt}
            />
            <SupplementCard
              title="Cafeína"
              dose={`${cafMin}-${cafMax} mg`}
              timing="60 min pre"
              note="Reservar para partido o sesiones clave. Ajustar tolerancia individual."
              color="orange"
              icon={IconCoffee}
            />
            <SupplementCard
              title="Beta-alanina"
              dose="3.2-6.4 g"
              timing="Diario"
              note="Dividir tomas para reducir parestesias. Útil en bloques de carga."
              color="red"
              icon={IconPill}
            />
          </SimpleGrid>

          <BentoCard title="Micronutrientes a revisar" icon={IconShieldCheck} color="teal" mb={{ base: 'md', sm: 'xl' }}>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing={{ base: 'md', sm: 'sm' }}>
              {[
                ['Vitamina D3', '2000-4000 UI/día', 'Cruzar con analítica y exposición solar'],
                ['Omega-3', '2-4 g EPA+DHA', 'Valorar si baja ingesta de pescado azul'],
                ['Magnesio', '300-400 mg noche', 'Interesante si hay calambres o mala recuperación'],
              ].map(([name, dose, note]) => (
                <Paper key={name} p="sm" radius="md" bg="gray.0" withBorder>
                  <Group gap="xs" align="flex-start" wrap="nowrap">
                    <ThemeIcon color="teal" variant="light" radius="xl" size="sm">
                      <IconMoonStars size={14} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text size="sm" fw={800}>{name}</Text>
                      <Text size="xs" fw={700} c="teal">{dose}</Text>
                      <Text size="xs" c="dimmed">{note}</Text>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </BentoCard>

          <EditableSection
            title="Notas y protocolo de suplementación"
            defaultValue={jugador.notas_suplementacion || supDef}
            onSave={(v) => saveField('notas_suplementacion', v)}
            readOnly={readOnly}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
