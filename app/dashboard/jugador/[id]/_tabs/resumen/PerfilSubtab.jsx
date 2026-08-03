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
  Flex,
  Popover,
  UnstyledButton
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import {
  IconClipboardList,
  IconChevronLeft,
  IconChevronRight,
  IconFlame,
  IconEgg,
  IconApple,
  IconDroplet,
  IconCalendar,
  IconChevronDown,
} from '@tabler/icons-react';

dayjs.locale('es');

function formatFriendlyDate(date) {
  if (!date) return '';
  const d = dayjs(date);
  const today = dayjs();

  if (d.isSame(today, 'day')) {
    return `Hoy, ${d.format('D [de] MMMM')}`;
  }
  const yesterday = today.subtract(1, 'day');
  if (d.isSame(yesterday, 'day')) {
    return `Ayer, ${d.format('D [de] MMMM')}`;
  }
  const tomorrow = today.add(1, 'day');
  if (d.isSame(tomorrow, 'day')) {
    return `Mañana, ${d.format('D [de] MMMM')}`;
  }
  if (d.year() === today.year()) {
    const str = d.format('ddd, D [de] MMMM');
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return d.format('D [de] MMMM, YYYY');
}
import { calculateByObjective, getTeamNutritionDayTypes, PLAYER_OBJECTIVES } from '@/lib/calculations';
import { CampoEditable, ComidasEditable, PrepartidoEditable } from '../editable';
import { latestMetricValue } from '@/lib/player-metrics';
import { listPlayerMeals } from '@/services/meal';
import { getAiPlans } from '@/services/plan';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import { getSubtabHeader } from '../subtab-config';
import { useFoods } from '@/lib/use-foods';
import JugadorHeader from '@/components/JugadorHeader';
import { usePlayerDashboard } from '../PlayerDashboardContext';
import classes from '../SubtabSectionHeader.module.css';

const calcNutrient = (food, grams, key) => {
  const value = Number(food?.[key]);
  const qty = Number(grams);
  if (!Number.isFinite(value) || !Number.isFinite(qty)) return 0;
  return (value * qty) / 100;
};

const roundMacro = (value) => Math.round(value * 10) / 10;

function calculateConsumedStats(meals, foods) {
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

function getDayInfo(date) {
  const temp = new Date(date);
  const day = temp.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(temp.setDate(diff));
  const mondayStr = monday.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

  const keys = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const dayKey = keys[day];

  return { mondayStr, dayKey };
}

function PremiumMacroBar({ label, color, consumed, target, icon: IconComponent }) {
  const targetNum = target && Number(target) > 0 ? Number(target) : 0;
  const pct = targetNum > 0 ? Math.min(100, Math.round((consumed / targetNum) * 100)) : 0;

  return (
    <Box
      style={{
        padding: '8px 12px',
        borderRadius: '12px',
        cursor: 'default'
      }}
    >
      <Group justify="space-between" mb={6}>
        <Group gap="xs">
          <ThemeIcon color={color} variant="light" size="sm" radius="md">
            <IconComponent size={14} />
          </ThemeIcon>
          <Text fw={700} size="sm" c="dark.4">{label}</Text>
        </Group>
        <Group gap={4} align="baseline">
          <Text fw={700} size="sm" c="dark.5">{consumed}g</Text>
          <Text fw={500} size="xs" c="dimmed">/ {target || '-'}g</Text>
        </Group>
      </Group>
      <Progress
        value={pct}
        color={color}
        size="sm"
        radius="xl"
        bg="gray.1"
      />
      <Group justify="space-between" mt={4}>
        <Text size="10px" fw={600} c="dimmed">{pct}% completado</Text>
        {targetNum > 0 && consumed >= targetNum && (
          <Text size="10px" fw={700} c="green.6">¡Meta alcanzada!</Text>
        )}
      </Group>
    </Box>
  );
}

export default function PerfilSubtab({ jugador, evoluciones = [], readOnly = false }) {
  const { foods } = useFoods();
  const { user } = usePlayerDashboard();
  const [meals, setMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [popoverOpened, setPopoverOpened] = useState(false);

  useEffect(() => {
    if (!jugador?.id) return;
    let active = true;
    setLoadingMeals(true);

    const { mondayStr, dayKey } = getDayInfo(selectedDate);
    const dateStr = new Date(selectedDate).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

    Promise.all([
      listPlayerMeals(jugador.id, { day: dateStr }),
      getAiPlans(jugador.id, mondayStr).catch((err) => {
        console.error('Error fetching plan for week:', err);
        return { planes: [] };
      })
    ]).then(([mealsData, plansData]) => {
      if (!active) return;

      setMeals(mealsData || []);
      setLoadingMeals(false);

      const matchingPlan = plansData.planes?.[0] || null;

      if (matchingPlan) {
        const planDayType = matchingPlan.datos?.dias?.[dayKey]?.tipoDia;
        if (planDayType) {
          setActiveDayType(planDayType);
        }
      } else {
        setActiveDayType('entreno');
      }
    }).catch((err) => {
      console.error('Error in Resumen tab load:', err);
      if (active) {
        setMeals([]);
        setLoadingMeals(false);
        setActiveDayType('entreno');
      }
    });

    return () => {
      active = false;
    };
  }, [jugador?.id, selectedDate]);

  const consumed = useMemo(() => calculateConsumedStats(meals, foods), [meals, foods]);

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

  const headerConfig = getSubtabHeader('resumen', 'perfil');
  const HeaderIcon = headerConfig.icon;

  return (
    <Stack gap={0}>
      {/* Tab Header Banner */}
      <Paper
        className={classes.mobileSticky}
        p={{ base: 'sm', sm: 'md' }}
        bg="white"
        shadow="xs"
        radius="lg"
        withBorder
        style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap="xs">
              <ThemeIcon color={headerConfig.iconColor} variant="light" radius="xl" size="lg">
                <HeaderIcon size={20} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={800} c="dark.4">{headerConfig.title}</Title>
                <Text size="sm" c="dimmed">
                  {readOnly ? (headerConfig.subtitleReadOnly || headerConfig.subtitle) : headerConfig.subtitle}
                </Text>
              </Box>
            </Group>
          </Group>

          <Box hiddenFrom="sm">
            <JugadorHeader jugador={jugador} user={user} forceMobile embedded />
          </Box>
        </Stack>
      </Paper>

      {/* Content wrapper */}
      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <Stack gap="md">
          {/* Daily Tracker / Consumo de Hoy (Unified Premium Dashboard) */}
          <Paper p={{ base: 'md', sm: 'lg' }} bg="white" shadow="xs" radius="lg" withBorder>
            <Box style={{ position: 'relative', zIndex: 1 }}>
              <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="sm">
                <Group gap="xs">
                  <ThemeIcon color="red" variant="light" radius="xl" size="lg">
                    <IconFlame size={24} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Title order={3} fw={800} c="dark.4">Balance Nutricional</Title>
                    <Text size="sm" c="dimmed">Historial y registro diario</Text>
                  </Stack>
                </Group>

                {/* Interactive Date Selector Pill with Chevrons */}
                <Paper
                  withBorder
                  radius="xl"
                  p={4}
                  bg="gray.0"
                  w={{ base: '100%', sm: 'auto' }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    size="md"
                    onClick={() => {
                      const prev = new Date(selectedDate);
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDate(prev);
                    }}
                    style={{ transition: 'transform 0.1s ease' }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <IconChevronLeft size={18} stroke={2} />
                  </ActionIcon>

                  <Popover
                    opened={popoverOpened}
                    onChange={setPopoverOpened}
                    position="bottom"
                    withArrow
                    shadow="md"
                    radius="md"
                  >
                    <Popover.Target>
                      <UnstyledButton
                        onClick={() => setPopoverOpened((o) => !o)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 12px',
                          borderRadius: '16px',
                          backgroundColor: 'var(--mantine-color-white)',
                          border: '1px solid var(--mantine-color-gray-3)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <IconCalendar size={15} style={{ color: 'var(--mantine-color-red-6)' }} />
                        <Text fw={700} size="xs" c="dark.6" style={{ whiteSpace: 'nowrap' }}>
                          {formatFriendlyDate(selectedDate)}
                        </Text>
                        <IconChevronDown size={13} style={{ color: 'var(--mantine-color-gray-5)' }} />
                      </UnstyledButton>
                    </Popover.Target>
                    <Popover.Dropdown p="xs">
                      <DatePicker
                        value={new Date(selectedDate)}
                        onChange={(val) => {
                          if (val) {
                            setSelectedDate(val);
                            setPopoverOpened(false);
                          }
                        }}
                        maxDate={new Date()}
                        size="sm"
                      />
                    </Popover.Dropdown>
                  </Popover>

                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    size="md"
                    disabled={new Date(selectedDate).toDateString() === new Date().toDateString()}
                    onClick={() => {
                      const next = new Date(selectedDate);
                      next.setDate(next.getDate() + 1);
                      setSelectedDate(next);
                    }}
                    style={{ transition: 'transform 0.1s ease' }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <IconChevronRight size={18} stroke={2} />
                  </ActionIcon>
                </Paper>
              </Group>
              <Box mb="lg">
                {/* Selector interactivo integrado de Tipo de Día */}
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

              <BoneyardSkeleton name="balance-nutricional" loading={loadingMeals}>
                <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 0, md: 40 }} align="center">
                  <Box style={{ flexShrink: 0 }} px={{ base: 0, md: 'lg' }}>
                    <RingProgress
                      size={240}
                      thickness={20}
                      roundCaps
                      sections={[{
                        value: kcal && Number(kcal) > 0 ? Math.min(100, Math.round((consumed.kcal / Number(kcal)) * 100)) : 0,
                        color: consumed.kcal >= (Number(kcal) || 0) && Number(kcal) > 0 ? 'teal.5' : 'orange.5'
                      }]}
                      label={
                        <Stack gap={0} align="center" style={{ transform: 'translateY(-2px)' }}>
                          <Text size="xs" c="dimmed" fw={700}>Calorías</Text>
                          <Text size="32px" fw={850} lh={1.1} c="dark.6" style={{ letterSpacing: '-0.5px' }}>{consumed.kcal}</Text>
                          <Text size="xs" c="dimmed" fw={600}>/ {kcal || '-'} kcal</Text>
                        </Stack>
                      }
                    />
                  </Box>

                  <Box style={{ flexGrow: 1, width: '100%' }}>
                    <Stack gap="sm">
                      {/* Proteínas */}
                      <PremiumMacroBar
                        label="Proteínas"
                        color="red"
                        consumed={consumed.pro}
                        target={protein}
                        icon={IconEgg}
                      />
                      {/* Carbohidratos */}
                      <PremiumMacroBar
                        label="Carbohidratos"
                        color="yellow"
                        consumed={consumed.cho}
                        target={cho}
                        icon={IconApple}
                      />
                      {/* Grasas */}
                      <PremiumMacroBar
                        label="Grasas"
                        color="blue"
                        consumed={consumed.fat}
                        target={fat}
                        icon={IconDroplet}
                      />
                    </Stack>
                  </Box>
                </Flex>
              </BoneyardSkeleton>
            </Box>
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
                <PrepartidoEditable label="Rutinas pre-partido" configPrepartido={jugador.config_prepartido} numComidas={jugador.num_comidas} postentreno={jugador.postentreno} jugadorId={jugador.id} readOnly={readOnly} />
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
