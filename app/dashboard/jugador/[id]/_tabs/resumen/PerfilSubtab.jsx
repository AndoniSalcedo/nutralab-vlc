'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  SegmentedControl,
  Badge
} from '@mantine/core';

import { IconClipboardList, IconTargetArrow, IconUser, IconInfoCircle } from '@tabler/icons-react';
import { cunninghamPlan, NUTRITION_DAY_TYPES, resolveNutritionDayType } from '@/lib/calculations';
import { CampoEditable } from '../editable';
import { latestMetricValue } from '@/lib/player-metrics';

function StatCard({ label, value, order = 2, subtext }) {
  return (
    <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm" bg="white">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
      <Title order={order} mt={5} c="dark.4">{value || '-'}</Title>
      {subtext && <Text size="xs" c="dimmed" mt={4}>{subtext}</Text>}
    </Paper>
  );
}

const NUM_COMIDAS = [
  { value: '3', label: '3 comidas' },
  { value: '4', label: '4 comidas' },
  { value: '5', label: '5 comidas' },
  { value: '6', label: '6 comidas' },
  { value: '7', label: '7 comidas' },
];

const DAY_TYPES = NUTRITION_DAY_TYPES.map((dayType) => ({
  value: dayType.key,
  label: dayType.label,
  factor: dayType.factor,
  proteinGkg: dayType.proteinGkg,
  carbsGkg: dayType.carbsGkg,
  fatGkg: dayType.fatGkg,
  color: dayType.color,
}));

export default function PerfilSubtab({ jugador, evoluciones = [], readOnly = false }) {
  const pesoActual = latestMetricValue(evoluciones, 'peso_kg', jugador?.peso_kg);
  const grasaActual = latestMetricValue(evoluciones, 'porcentaje_grasa', jugador?.porcentaje_grasa);
  const masaMagraActual = latestMetricValue(evoluciones, 'masa_magra_kg', jugador?.masa_magra_kg);
  const weightKg = Number(pesoActual || 0);

  // Map configured factor_actividad to nearest dayType segment
  const defaultDiaType = useMemo(() => {
    return resolveNutritionDayType(jugador.factor_actividad || 1.55).key;
  }, [jugador.factor_actividad]);

  const [activeDayType, setActiveDayType] = useState(defaultDiaType);

  // Pre-calculate plans for all day types using Cunningham formula
  const plans = useMemo(() => {
    const out = {};
    DAY_TYPES.forEach(dt => {
      out[dt.value] = weightKg ? cunninghamPlan({
        weightKg,
        bodyFatPct: grasaActual ? Number(grasaActual) : null,
        leanMassKg: masaMagraActual ? Number(masaMagraActual) : null,
        activityFactor: dt.factor,
        proteinGkg: dt.proteinGkg,
        carbsGkg: dt.carbsGkg,
        fatGkg: dt.fatGkg,
      }) : null;
    });
    return out;
  }, [weightKg, grasaActual, masaMagraActual]);

  const currentPlan = plans[activeDayType];
  const isDefaultFactorType = activeDayType === defaultDiaType;

  // Use manual override if it exists and we are looking at the default factor day type
  const hasManualOverride = Boolean(
    isDefaultFactorType &&
    (jugador.kcal_objetivo || jugador.proteina_objetivo_g || jugador.cho_objetivo_g || jugador.grasa_objetivo_g)
  );

  const kcal = (isDefaultFactorType && jugador.kcal_objetivo) || currentPlan?.kcal || '-';
  const protein = (isDefaultFactorType && jugador.proteina_objetivo_g) || currentPlan?.protein || null;
  const cho = (isDefaultFactorType && jugador.cho_objetivo_g) || currentPlan?.cho || null;
  const fat = (isDefaultFactorType && jugador.grasa_objetivo_g) || currentPlan?.fat || null;

  return (
    <Stack gap={0}>
      {/* Tab Header Banner */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        bg="white"
        shadow="xs"
        radius="lg"
        withBorder
        style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
              <IconUser size={20} />
            </ThemeIcon>
            <Box>
              <Title order={3} fw={800} c="dark.4">Perfil del jugador</Title>
              <Text size="sm" c="dimmed">
                {readOnly ? 'Objetivos y pautas semanales.' : 'Objetivos, preferencias y ajustes individuales.'}
              </Text>
            </Box>
          </Group>
        </Group>
      </Paper>

      {/* Content wrapper */}
      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <Stack gap="md">
          {/* Nutritional Objectives Card */}
          <Paper p={{ base: 'md', sm: 'lg' }} bg="white" shadow="xs" radius="lg" withBorder>
            <Group justify="space-between" align="flex-start" wrap="wrap" mb="md" gap="md">
              <Group gap="xs">
                <ThemeIcon color="green" variant="light" radius="xl" size="lg">
                  <IconTargetArrow size={20} />
                </ThemeIcon>
                <Box>
                  <Title order={3} fw={800} c="dark.4">Objetivos nutricionales</Title>
                  <Text size="sm" c="dimmed">
                    Cálculo dinámico de requerimientos de acuerdo a la exigencia de cada día.
                  </Text>
                </Box>
              </Group>

              {hasManualOverride && (
                <Badge color="yellow" variant="light" size="md" leftSection={<IconInfoCircle size={14} />}>
                  Objetivo manual activo para este día
                </Badge>
              )}
            </Group>

            {/* Day Type selector Segmented Control */}
            <Box mb="md" bg="gray.0" p="xs" style={{ borderRadius: '12px' }}>
              <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">Tipo de Día (Factor de actividad)</Text>
              <SegmentedControl
                value={activeDayType}
                onChange={setActiveDayType}
                data={DAY_TYPES.map(dt => ({
                  value: dt.value,
                  label: `${dt.label} (${dt.factor})`
                }))}
                fullWidth
                radius="md"
                color="blue"
                styles={{
                  root: { backgroundColor: 'var(--mantine-color-gray-1)' }
                }}
              />
            </Box>

            {/* Macro Objectives Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              <StatCard
                label="Kcal objetivo"
                value={kcal ? `${kcal} kcal` : '-'}
                subtext={hasManualOverride ? 'Fijado manualmente' : 'Fórmula Cunningham'}
              />
              <StatCard
                label="Proteína"
                value={protein ? `${protein}g` : '-'}
                subtext={hasManualOverride ? 'Fijado manualmente' : 'Fórmula Cunningham'}
              />
              <StatCard
                label="Carbohidratos (CHO)"
                value={cho ? `${cho}g` : '-'}
                subtext={hasManualOverride ? 'Fijado manualmente' : 'Fórmula Cunningham'}
              />
              <StatCard
                label="Grasa"
                value={fat ? `${fat}g` : '-'}
                subtext={hasManualOverride ? 'Fijado manualmente' : 'Fórmula Cunningham'}
              />
            </SimpleGrid>
          </Paper>

          {/* Preferences and Context card (Only visible to professionals, unless player is readOnly) */}
          {!readOnly && (
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
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
