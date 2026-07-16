'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Badge,
  ActionIcon,
  RingProgress,
  Progress,
  Button,
  Center,
  Loader
} from '@mantine/core';

import {
  IconClipboardList,
  IconTargetArrow,
  IconUser,
  IconChevronLeft,
  IconChevronRight,
  IconFlame,
  IconCheck,
  IconPlus
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { calculateByObjective, getTeamNutritionDayTypes, PLAYER_OBJECTIVES, getObjectiveLabel } from '@/lib/calculations';
import { CampoEditable, ComidasEditable } from '../editable';
import { latestMetricValue } from '@/lib/player-metrics';
import { listPlayerMeals } from '@/services/meal';
import foods from '@/data/foods';

const calcNutrient = (food, grams, key) => {
  const value = Number(food?.[key]);
  const qty = Number(grams);
  if (!Number.isFinite(value) || !Number.isFinite(qty)) return 0;
  return (value * qty) / 100;
};

const roundMacro = (value) => Math.round(value * 10) / 10;

function calculateConsumedStats(meals) {
  let kcal = 0;
  let cho = 0;
  let pro = 0;
  let fat = 0;

  meals.forEach((meal) => {
    // 1. Calories - sum up explicit meal.calories if present
    if (meal.calories != null && Number.isFinite(Number(meal.calories))) {
      kcal += Number(meal.calories);
    }

    // 2. Parse ingredients to get macros (and calories if meal.calories is not set)
    if (Array.isArray(meal.ingredients)) {
      let tempKcal = 0;
      meal.ingredients.forEach((ingredientStr) => {
        const match = ingredientStr.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*g\)$/i);
        if (match) {
          const foodName = match[1].trim();
          const grams = parseFloat(match[2]);
          const foundFood = foods.find(f => f.name.toLowerCase() === foodName.toLowerCase());
          if (foundFood && !isNaN(grams)) {
            tempKcal += calcNutrient(foundFood, grams, 'kcal');
            cho += calcNutrient(foundFood, grams, 'cho');
            pro += calcNutrient(foundFood, grams, 'pro');
            fat += calcNutrient(foundFood, grams, 'fat');
          }
        }
      });
      
      // If the meal had no explicit calories, we sum up the parsed ingredients' calories
      if (meal.calories == null || !Number.isFinite(Number(meal.calories))) {
        kcal += tempKcal;
      }
    }
  });

  return {
    kcal: Math.round(kcal),
    cho: roundMacro(cho),
    pro: roundMacro(pro),
    fat: roundMacro(fat),
  };
}

function StatCard({ label, value, order = 2, subtext }) {
  return (
    <Paper p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder shadow="sm" bg="white">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
      <Title order={order} mt={5} c="dark.4">{value || '-'}</Title>
      {subtext && <Text size="xs" c="dimmed" mt={4}>{subtext}</Text>}
    </Paper>
  );
}

export default function PerfilSubtab({ jugador, evoluciones = [], readOnly = false }) {
  const router = useRouter();
  const [meals, setMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);

  useEffect(() => {
    if (!jugador?.id) return;
    let active = true;
    setLoadingMeals(true);

    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

    listPlayerMeals(jugador.id, { day: todayStr })
      .then((data) => {
        if (active) {
          setMeals(data || []);
          setLoadingMeals(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching today\'s meals:', err);
        if (active) {
          setLoadingMeals(false);
        }
      });

    return () => {
      active = false;
    };
  }, [jugador?.id]);

  const consumed = useMemo(() => calculateConsumedStats(meals), [meals]);

  const pesoActual = latestMetricValue(evoluciones, 'peso_kg', jugador?.peso_kg);
  const weightKg = Number(pesoActual || 0);

  const teamConfig = jugador?.equipos?.configuracion_nutricional;

  const DAY_TYPES = useMemo(() => {
    return getTeamNutritionDayTypes(teamConfig).map((dayType) => ({
      value: dayType.key,
      label: dayType.label,
      factor: dayType.factor,
      proteinGkg: dayType.proteinGkg,
      carbsGkg: dayType.carbsGkg,
      fatGkg: dayType.fatGkg,
      color: dayType.color,
    }));
  }, [teamConfig]);

  const defaultDiaType = 'entreno';
  const [activeDayType, setActiveDayType] = useState(defaultDiaType);

  const playerObjective = jugador?.objetivo || 'mejora_rendimiento';

  // Pre-calculate plans for all day types
  const plans = useMemo(() => {
    const out = {};
    DAY_TYPES.forEach(dt => {
      if (!weightKg) {
        out[dt.value] = null;
        return;
      }

      const result = calculateByObjective({ weightKg, objectiveKey: playerObjective, dayTypeKey: dt.value, teamConfig });
      if (result) {
        out[dt.value] = result;
      } else {
        out[dt.value] = null;
      }
    });
    return out;
  }, [weightKg, playerObjective, DAY_TYPES, teamConfig]);

  const currentPlan = plans[activeDayType];

  const kcal = currentPlan?.kcal || '-';
  const protein = currentPlan?.protein || null;
  const cho = currentPlan?.cho || null;
  const fat = currentPlan?.fat || null;

  const activeIdx = DAY_TYPES.findIndex(d => d.value === activeDayType);
  const activeDay = DAY_TYPES[activeIdx !== -1 ? activeIdx : 0] || {};

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
          {/* Daily Tracker / Consumo de Hoy */}
          <Paper p={{ base: 'md', sm: 'lg' }} bg="white" shadow="xs" radius="lg" withBorder>
            <Group justify="space-between" align="center" wrap="wrap" mb="md" gap="md">
              <Group gap="xs">
                <ThemeIcon color="orange" variant="light" radius="xl" size="lg">
                  <IconFlame size={20} />
                </ThemeIcon>
                <Box>
                  <Title order={3} fw={800} c="dark.4">Progreso de Hoy</Title>
                  <Text size="sm" c="dimmed">
                    Tu registro y balance nutricional acumulado para el día de hoy.
                  </Text>
                </Box>
              </Group>
              {readOnly && (
                <Button
                  variant="light"
                  color="blue"
                  size="xs"
                  radius="md"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => router.replace(`/dashboard/jugador/${jugador.id}/resumen/diario`)}
                >
                  Registrar comida
                </Button>
              )}
            </Group>

            {loadingMeals ? (
              <Center py="xl">
                <Loader size="md" color="orange" />
              </Center>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mt="md">
                {/* Calorías (Circular Progress) */}
                <Paper withBorder p="md" radius="md" bg="gray.0">
                  <Group justify="center" gap="lg" align="center" style={{ height: '100%' }} wrap="wrap">
                    <RingProgress
                      size={140}
                      thickness={12}
                      roundCaps
                      sections={[
                        {
                          value: kcal && Number(kcal) > 0 ? Math.min(100, Math.round((consumed.kcal / Number(kcal)) * 100)) : 0,
                          color: kcal && Number(kcal) > 0 && consumed.kcal >= Number(kcal) ? 'green.6' : 'orange.6'
                        }
                      ]}
                      label={
                        <Center>
                          <Stack gap={0} align="center">
                            <Text size="xl" fw={800} c="dark.4" lh={1.2}>
                              {kcal && Number(kcal) > 0 ? Math.min(100, Math.round((consumed.kcal / Number(kcal)) * 100)) : 0}%
                            </Text>
                            <Text size="10px" c="dimmed" fw={700} tt="uppercase">calorías</Text>
                          </Stack>
                        </Center>
                      }
                    />
                    <Stack gap={4} style={{ flex: 1, minWidth: '150px' }}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                        Calorías Consumidas
                      </Text>
                      <Group gap={6} align="baseline">
                        <Text size="26px" fw={900} c="dark.4" lh={1}>
                          {consumed.kcal}
                        </Text>
                        <Text size="sm" c="dimmed" fw={500}>
                          / {kcal || '-'} kcal
                        </Text>
                      </Group>
                      
                      {kcal && Number(kcal) > 0 ? (
                        consumed.kcal >= Number(kcal) ? (
                          <Badge color="green" variant="light" size="xs" leftSection={<IconCheck size={12} />}>
                            Meta alcanzada
                          </Badge>
                        ) : (
                          <Text size="xs" c="orange.7" fw={600}>
                            Faltan {Math.round(Number(kcal) - consumed.kcal)} kcal
                          </Text>
                        )
                      ) : (
                        <Text size="xs" c="dimmed">
                          Sin meta de calorías hoy
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Paper>

                {/* Macronutrientes (Barras de progreso) */}
                <Paper withBorder p="md" radius="md" bg="gray.0">
                  <Stack gap="md" justify="center" h="100%">
                    {/* Proteínas */}
                    <Box>
                      <Group justify="space-between" mb={6}>
                        <Group gap={6}>
                          <Box style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-6)' }} />
                          <Text size="xs" fw={700} c="dark.3">Proteínas</Text>
                        </Group>
                        <Group gap={4}>
                          <Text size="xs" fw={800} c="dark.4">{consumed.pro}g</Text>
                          <Text size="xs" c="dimmed">/ {protein || '-'}g</Text>
                          {protein && Number(protein) > 0 && (
                            <Badge size="xs" color="red" variant="subtle" ml={4}>
                              {Math.round((consumed.pro / Number(protein)) * 100)}%
                            </Badge>
                          )}
                        </Group>
                      </Group>
                      <Progress
                        value={protein && Number(protein) > 0 ? Math.min(100, (consumed.pro / Number(protein)) * 100) : 0}
                        color="red.6"
                        size="sm"
                        radius="xl"
                      />
                    </Box>

                    {/* Carbohidratos */}
                    <Box>
                      <Group justify="space-between" mb={6}>
                        <Group gap={6}>
                          <Box style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-yellow-6)' }} />
                          <Text size="xs" fw={700} c="dark.3">Carbohidratos</Text>
                        </Group>
                        <Group gap={4}>
                          <Text size="xs" fw={800} c="dark.4">{consumed.cho}g</Text>
                          <Text size="xs" c="dimmed">/ {cho || '-'}g</Text>
                          {cho && Number(cho) > 0 && (
                            <Badge size="xs" color="yellow" variant="subtle" ml={4}>
                              {Math.round((consumed.cho / Number(cho)) * 100)}%
                            </Badge>
                          )}
                        </Group>
                      </Group>
                      <Progress
                        value={cho && Number(cho) > 0 ? Math.min(100, (consumed.cho / Number(cho)) * 100) : 0}
                        color="yellow.6"
                        size="sm"
                        radius="xl"
                      />
                    </Box>

                    {/* Grasas */}
                    <Box>
                      <Group justify="space-between" mb={6}>
                        <Group gap={6}>
                          <Box style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-6)' }} />
                          <Text size="xs" fw={700} c="dark.3">Grasas</Text>
                        </Group>
                        <Group gap={4}>
                          <Text size="xs" fw={800} c="dark.4">{consumed.fat}g</Text>
                          <Text size="xs" c="dimmed">/ {fat || '-'}g</Text>
                          {fat && Number(fat) > 0 && (
                            <Badge size="xs" color="blue" variant="subtle" ml={4}>
                              {Math.round((consumed.fat / Number(fat)) * 100)}%
                            </Badge>
                          )}
                        </Group>
                      </Group>
                      <Progress
                        value={fat && Number(fat) > 0 ? Math.min(100, (consumed.fat / Number(fat)) * 100) : 0}
                        color="blue.6"
                        size="sm"
                        radius="xl"
                      />
                    </Box>
                  </Stack>
                </Paper>
              </SimpleGrid>
            )}
          </Paper>

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

              <Badge color="green" variant="light" size="md" leftSection={<IconTargetArrow size={14} />}>
                {getObjectiveLabel(playerObjective)}
              </Badge>
            </Group>

            {/* Day Type selector carousel switcher */}
            <Box mb="lg">
              <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                Tipo de Día
              </Text>

              <Paper withBorder p="md" radius="xl" bg="var(--mantine-color-white)">
                <Group justify="space-between" align="center" wrap="nowrap">
                  {/* Left arrow */}
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    size="lg"
                    onClick={() => {
                      const prevIdx = (activeIdx - 1 + DAY_TYPES.length) % DAY_TYPES.length;
                      setActiveDayType(DAY_TYPES[prevIdx].value);
                    }}
                    style={{ transition: 'transform 0.1s ease' }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <IconChevronLeft size={22} stroke={2} />
                  </ActionIcon>

                  {/* Active Day Type & Indicator Dots Wrapper */}
                  <Stack gap="xs" style={{ flex: 1 }} align="center">
                    <Badge
                      variant="light"
                      color={activeDay.color || 'blue'}
                      size="lg"
                      radius="xl"
                      py="md"
                      px="xl"
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        textTransform: 'none',
                      }}
                    >
                      {activeDay.label}
                    </Badge>

                    {/* Indicator Dots */}
                    <Group gap={6} justify="center" mt={4}>
                      {DAY_TYPES.map((dt, idx) => {
                        const isActive = idx === activeIdx;
                        return (
                          <Box
                            key={dt.value}
                            onClick={() => setActiveDayType(dt.value)}
                            style={{
                              width: isActive ? '20px' : '6px',
                              height: '6px',
                              borderRadius: '3px',
                              backgroundColor: isActive
                                ? `var(--mantine-color-${activeDay.color || 'blue'}-6)`
                                : 'var(--mantine-color-gray-3)',
                              cursor: 'pointer',
                              transition: 'width 0.2s ease, background-color 0.2s ease',
                            }}
                          />
                        );
                      })}
                    </Group>
                  </Stack>

                  {/* Right arrow */}
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    size="lg"
                    onClick={() => {
                      const nextIdx = (activeIdx + 1) % DAY_TYPES.length;
                      setActiveDayType(DAY_TYPES[nextIdx].value);
                    }}
                    style={{ transition: 'transform 0.1s ease' }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <IconChevronRight size={22} stroke={2} />
                  </ActionIcon>
                </Group>
              </Paper>
            </Box>

            {/* Macro Objectives Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              <StatCard
                label="Kcal objetivo"
                value={kcal ? `${kcal} kcal` : '-'}
                subtext={getObjectiveLabel(playerObjective)}
              />
              <StatCard
                label="Proteína"
                value={protein ? `${protein}g` : '-'}
                subtext={getObjectiveLabel(playerObjective)}
              />
              <StatCard
                label="Carbohidratos (CHO)"
                value={cho ? `${cho}g` : '-'}
                subtext={getObjectiveLabel(playerObjective)}
              />
              <StatCard
                label="Grasa"
                value={fat ? `${fat}g` : '-'}
                subtext={getObjectiveLabel(playerObjective)}
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
                <ComidasEditable label="Comidas diarias" numComidas={jugador.num_comidas} postentreno={jugador.postentreno} preentreno={jugador.preentreno} jugadorId={jugador.id} recomendacionesDefecto={jugador.recomendaciones_defecto} readOnly={readOnly} />
                <CampoEditable label="Objetivo nutricional" campo="objetivo" valor={jugador.objetivo || ''} jugadorId={jugador.id} tipo="select" opciones={PLAYER_OBJECTIVES} readOnly={readOnly} />
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
