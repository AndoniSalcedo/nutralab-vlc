'use client';

import { Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconChartBar, IconClipboardList, IconTargetArrow, IconUser } from '@tabler/icons-react';
import { BentoCard } from '@/components/Bento/BentoItem';
import { cunninghamPlan } from '@/lib/calculations';
import { CampoEditable } from '../editable';
import { latestEvolution } from '@/lib/player-metrics';

const NUM_COMIDAS = [
  { value: '3', label: '3 comidas' },
  { value: '4', label: '4 comidas' },
  { value: '5', label: '5 comidas' },
  { value: '6', label: '6 comidas' },
  { value: '7', label: '7 comidas' },
];

function StatCard({ label, value, order = 2 }) {
  return (
    <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm" bg="white">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
      <Title order={order} mt={5} c="dark.4">{value || '-'}</Title>
    </Paper>
  );
}

function metricValue(jugador, latest, key) {
  return latest?.[key] ?? jugador?.[key] ?? null;
}

export default function PerfilSubtab({ jugador, evoluciones = [], readOnly = false }) {
  const latest = latestEvolution(evoluciones);
  const pesoActual = metricValue(jugador, latest, 'peso_kg');
  const grasaActual = metricValue(jugador, latest, 'porcentaje_grasa');
  const masaMagraActual = metricValue(jugador, latest, 'masa_magra_kg');
  const fechaUltimaMedicion = latest?.fecha || jugador.fecha_ultima_medicion;
  const weightKg = Number(pesoActual || 0);
  const calc = weightKg ? cunninghamPlan({
    weightKg,
    bodyFatPct: grasaActual ? Number(grasaActual) : null,
    leanMassKg: masaMagraActual ? Number(masaMagraActual) : null,
    activityFactor: Number(jugador.factor_actividad || 1.6),
  }) : null;
  const kcal = jugador.kcal_objetivo || calc?.kcal;
  const protein = jugador.proteina_objetivo_g || calc?.protein;
  const cho = jugador.cho_objetivo_g || calc?.cho;
  const fat = jugador.grasa_objetivo_g || calc?.fat;
  const hasSomatotype = jugador.endomorfia || jugador.mesomorfia || jugador.ectomorfia;

  return (
    <Stack gap={0}>
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        bg="white"
        shadow="xs"
        radius="lg"
        withBorder
        style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        <Group gap="xs">
          <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
            <IconUser size={20} />
          </ThemeIcon>
          <Box>
            <Title order={3} fw={800} c="dark.4">Perfil del jugador</Title>
            <Text size="sm" c="dimmed">
              Datos físicos, objetivos y ajustes individuales.
            </Text>
          </Box>
        </Group>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <StatCard label="Altura" value={jugador.altura_cm ? `${jugador.altura_cm} cm` : '-'} />
            <StatCard label="Peso actual" value={pesoActual ? `${pesoActual} kg` : '-'} />
            <StatCard label="% Grasa" value={grasaActual ? `${grasaActual}%` : '-'} />
            <StatCard label="Masa magra" value={masaMagraActual ? `${masaMagraActual} kg` : '-'} />
            <StatCard label="Última medición" value={fechaUltimaMedicion || '-'} order={3} />
            <StatCard label="Posición" value={jugador.posicion || '-'} order={3} />
          </SimpleGrid>

          <Paper p={{ base: 'md', sm: 'lg' }} bg="white" shadow="xs" radius="lg" withBorder>
            <Group gap="xs" mb="md">
              <ThemeIcon color="green" variant="light" radius="xl" size="lg">
                <IconTargetArrow size={20} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={800} c="dark.4">Objetivos nutricionales</Title>
                <Text size="sm" c="dimmed">
                  Referencias calculadas o fijadas manualmente.
                </Text>
              </Box>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              <StatCard label="Kcal objetivo" value={kcal ?? '-'} />
              <StatCard label="Proteína" value={protein ? `${protein}g` : '-'} />
              <StatCard label="CHO" value={cho ? `${cho}g` : '-'} />
              <StatCard label="Grasa" value={fat ? `${fat}g` : '-'} />
            </SimpleGrid>
          </Paper>

          {hasSomatotype && (
            <BentoCard title="Somatotipo" icon={IconChartBar} color="violet">
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
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

          <Paper p={{ base: 'md', sm: 'lg' }} bg="white" shadow="xs" radius="lg" withBorder>
            <Group gap="xs" mb="md">
              <ThemeIcon color="teal" variant="light" radius="xl" size="lg">
                <IconClipboardList size={20} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={800} c="dark.4">Preferencias y contexto</Title>
                <Text size="sm" c="dimmed">
                  Información que condiciona el plan nutricional.
                </Text>
              </Box>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <CampoEditable label="Número de comidas diarias" campo="num_comidas" valor={String(jugador.num_comidas || '5')} jugadorId={jugador.id} tipo="select" opciones={NUM_COMIDAS} readOnly={readOnly} />
              <CampoEditable label="Objetivo nutricional" campo="objetivo" valor={jugador.objetivo || ''} jugadorId={jugador.id} tipo="text" readOnly={readOnly} />
              <CampoEditable label="Gustos y preferencias" campo="gustos_preferencias" valor={jugador.gustos_preferencias || ''} jugadorId={jugador.id} readOnly={readOnly} />
              <CampoEditable label="Aversiones" campo="aversiones" valor={jugador.aversiones || ''} jugadorId={jugador.id} readOnly={readOnly} />
              <CampoEditable label="Intolerancias" campo="intolerancias" valor={jugador.intolerancias || ''} jugadorId={jugador.id} readOnly={readOnly} />
              <CampoEditable label="Alergias" campo="alergias" valor={jugador.alergias || ''} jugadorId={jugador.id} readOnly={readOnly} />
              <CampoEditable label="Contexto clínico" campo="contexto_clinico" valor={jugador.contexto_clinico || ''} jugadorId={jugador.id} readOnly={readOnly} />
            </SimpleGrid>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}
