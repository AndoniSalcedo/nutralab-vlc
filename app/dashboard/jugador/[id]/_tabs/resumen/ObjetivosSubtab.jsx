'use client';

import { Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconClipboardList } from '@tabler/icons-react';
import { CampoEditable } from '../editable';
import { cunninghamPlan } from '@/lib/calculations';

const NUM_COMIDAS = [
  { value: '3', label: '3 comidas' },
  { value: '4', label: '4 comidas' },
  { value: '5', label: '5 comidas' },
  { value: '6', label: '6 comidas' },
  { value: '7', label: '7 comidas' },
];

export default function ObjetivosSubtab({ jugador, readOnly = false }) {
  const weightKg = Number(jugador.peso_kg || 0);
  const calc = weightKg ? cunninghamPlan({
    weightKg,
    bodyFatPct: jugador.porcentaje_grasa ? Number(jugador.porcentaje_grasa) : null,
    leanMassKg: jugador.masa_magra_kg ? Number(jugador.masa_magra_kg) : null,
    activityFactor: Number(jugador.factor_actividad || 1.6),
  }) : null;
  const kcal = jugador.kcal_objetivo || calc?.kcal;
  const protein = jugador.proteina_objetivo_g || calc?.protein;
  const cho = jugador.cho_objetivo_g || calc?.cho;
  const fat = jugador.grasa_objetivo_g || calc?.fat;

  return (
    <Stack gap={0}>
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Group gap="xs">
          <ThemeIcon color="green" variant="light" radius="xl" size="lg">
            <IconClipboardList size={20} />
          </ThemeIcon>
          <Stack gap={2}>
            <Title order={3} fw={800} c="dark.4">Objetivos</Title>
            <Text size="sm" c="dimmed">
              Objetivos, preferencias y ajustes individuales.
            </Text>
          </Stack>
        </Group>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <Stack gap={0}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 'md', sm: 'md' }} mb={{ base: 'md', sm: 'xl' }}>
            <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Kcal objetivo</Text>
              <Title order={2} mt={5}>{kcal ?? '-'}</Title>
            </Paper>
            <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Proteína</Text>
              <Title order={2} mt={5}>{protein ? `${protein}g` : '-'}</Title>
            </Paper>
            <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>CHO</Text>
              <Title order={2} mt={5}>{cho ? `${cho}g` : '-'}</Title>
            </Paper>
            <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Grasa</Text>
              <Title order={2} mt={5}>{fat ? `${fat}g` : '-'}</Title>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'md', sm: 'md' }}>
            <CampoEditable label="Número de comidas diarias" campo="num_comidas" valor={String(jugador.num_comidas || '5')} jugadorId={jugador.id} tipo="select" opciones={NUM_COMIDAS} readOnly={readOnly} />
            <CampoEditable label="Objetivo nutricional" campo="objetivo" valor={jugador.objetivo || ''} jugadorId={jugador.id} tipo="text" readOnly={readOnly} />
            <CampoEditable label="Gustos y preferencias" campo="gustos_preferencias" valor={jugador.gustos_preferencias || ''} jugadorId={jugador.id} readOnly={readOnly} />
            <CampoEditable label="Aversiones" campo="aversiones" valor={jugador.aversiones || ''} jugadorId={jugador.id} readOnly={readOnly} />
            <CampoEditable label="Intolerancias" campo="intolerancias" valor={jugador.intolerancias || ''} jugadorId={jugador.id} readOnly={readOnly} />
            <CampoEditable label="Alergias" campo="alergias" valor={jugador.alergias || ''} jugadorId={jugador.id} readOnly={readOnly} />
            <CampoEditable label="Contexto clínico" campo="contexto_clinico" valor={jugador.contexto_clinico || ''} jugadorId={jugador.id} readOnly={readOnly} />
          </SimpleGrid>
        </Stack>
      </Box>
    </Stack>
  );
}
