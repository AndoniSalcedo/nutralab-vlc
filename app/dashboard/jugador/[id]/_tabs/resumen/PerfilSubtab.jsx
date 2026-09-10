'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Group,
  Menu,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { IconClipboardList, IconChevronDown, IconCheck } from '@/components/icons3d';

import { calculateByObjective, getTeamNutritionDayTypes, PLAYER_OBJECTIVES } from '@/lib/metrics/anthropometry';
import { CLINICAL_TAGS } from '@/config/clinical-tags';
import { CampoEditable, ComidasEditable, PrepartidoEditable } from '../editable';
import { latestMetricValue } from '@/lib/metrics/player';
import { listPlayerMeals } from '@/services/meal';
import { getAiPlans } from '@/services/plan';
import { getSubtabHeader } from '../subtab-config';
import { useFoods } from '@/hooks/use-foods';
import { JugadorHeaderCompactMobile } from '@/components/JugadorHeader';
import PlayerEditModal from '@/components/modals/PlayerEditModal';
import { usePlayerDashboard } from '../PlayerDashboardContext';
import headerClasses from '../SubtabSectionHeader.module.css';
import {
  PhysicalMetricWidget,
  SweatMetricWidget,
  HydrationWidget,
  StaffMessagesWidget,
  SuplementacionWidget,
  ComedorWidget,
  EstrategiaWidget,
  BalanceNutricionalWidget,
} from '@/components/widgets';

dayjs.locale('es');


const calcNutrient = (food, grams, key) => {
  const value = Number(food?.[key]);
  const qty = Number(grams);
  if (!Number.isFinite(value) || !Number.isFinite(qty)) return 0;
  return (value * qty) / 100;
};

const roundMacro = (value) => Math.round(value * 10) / 10;

function formatMetricNumber(val, decimals = 1, fallback = '-') {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (!Number.isFinite(num)) return String(val);
  return num.toFixed(decimals);
}

function calculateConsumedStats(meals, foods) {
  let kcal = 0;
  let cho = 0;
  let pro = 0;
  let fat = 0;

  meals.forEach((meal) => {
    if (meal.calories != null && Number.isFinite(Number(meal.calories))) {
      kcal += Number(meal.calories);
    }

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
  const day = temp.getDay();
  const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(temp.setDate(diff));
  const mondayStr = monday.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

  const keys = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const dayKey = keys[day];

  return { mondayStr, dayKey };
}


export default function PerfilSubtab({
  jugador,
  evoluciones = [],
  messages = [],
  registrosHidratacion = [],
  menus = [],
  readOnly = false,
}) {
  const { foods } = useFoods();
  const { user } = usePlayerDashboard();
  const [meals, setMeals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [editModalOpen, setEditModalOpen] = useState(false);

  const defaultDiaType = 'entreno';
  const [activeDayType, setActiveDayType] = useState(defaultDiaType);

  useEffect(() => {
    if (!jugador?.id) return;
    let active = true;

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

  const playerObjective = jugador?.objetivo || 'mejora_rendimiento';

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

  // Métricas antropométricas con redondeo a 1 decimal para evitar overflow
  const porcentajeGrasa = latestMetricValue(evoluciones, 'porcentaje_grasa', jugador?.porcentaje_grasa);

  const latestSweat = useMemo(() => {
    if (!registrosHidratacion || registrosHidratacion.length === 0) return null;
    const sweats = registrosHidratacion.filter((r) => r?.fecha && String(r?.tipo || '').toLowerCase().trim() === 'sweat');
    if (sweats.length === 0) return null;
    return [...sweats].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).at(-1);
  }, [registrosHidratacion]);

  const latestHydration = useMemo(() => {
    if (!registrosHidratacion || registrosHidratacion.length === 0) return null;
    const osm = registrosHidratacion.filter((r) => r?.fecha && String(r?.tipo || '').toLowerCase().trim() !== 'sweat');
    if (osm.length === 0) return null;
    return [...osm].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).at(-1);
  }, [registrosHidratacion]);

  const semaforo = jugador?.semaforo;
  return (
    <Stack gap={0}>
      {/* Header Banner: En escritorio conserva la cabecera original; en móvil se muestra la barra compacta de una línea */}
      <Paper
        className={headerClasses.mobileSticky}
        p={{ base: 'xs', sm: 'md' }}
        bg="white"
        shadow="xs"
        radius="lg"
        withBorder
        style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        {/* Desktop Header */}
        <Box visibleFrom="sm">
          <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
            <Group gap="sm" align="center" wrap="nowrap">
              <HeaderIcon size={28} />
              <Box style={{ minWidth: 0 }}>
                <Title order={3} fw={700} c="dark.5" fz={{ base: 16, sm: 18 }} lineClamp={1}>{headerConfig.title}</Title>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {readOnly ? (headerConfig.subtitleReadOnly || headerConfig.subtitle) : headerConfig.subtitle}
                </Text>
              </Box>
            </Group>

            {/* Selector sutil de Tipo de Día (Desktop) */}
            <Menu shadow="sm" width={160} position="bottom-end" radius="md">
              <Menu.Target>
                <UnstyledButton
                  aria-label="Seleccionar tipo de día"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 20,
                    backgroundColor: 'var(--mantine-color-gray-1)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '7px', color: `var(--mantine-color-${activeDay.color || 'blue'}-6)` }}>●</span>
                  <Text size="xs" fw={500} c="dark.4">{activeDay.label || 'Día'}</Text>
                  <IconChevronDown size={12} stroke={2} style={{ color: 'var(--mantine-color-gray-5)' }} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Tipo de día</Menu.Label>
                {DAY_TYPES.map((dt) => (
                  <Menu.Item
                    key={dt.value}
                    leftSection={
                      <span style={{ fontSize: '8px', color: `var(--mantine-color-${dt.color || 'blue'}-6)` }}>●</span>
                    }
                    rightSection={dt.value === activeDayType ? <IconCheck size={14} color="var(--mantine-color-blue-6)" /> : null}
                    onClick={() => setActiveDayType(dt.value)}
                    style={{ fontWeight: dt.value === activeDayType ? 600 : 400 }}
                  >
                    {dt.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Box>

        {/* Mobile Compact Header */}
        <Box hiddenFrom="sm" py={2}>
          <JugadorHeaderCompactMobile
            jugador={jugador}
            user={user}
            onEdit={() => setEditModalOpen(true)}
            activeDayType={activeDayType}
            onDayTypeChange={setActiveDayType}
            dayTypes={DAY_TYPES}
          />
        </Box>
      </Paper>

      {/* Main Content wrapper: Con padding lateral adecuado en móvil (12px) y escritorio (16px) */}
      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 12, sm: 'md' }}>
        <Stack >
          {/* =========================================================================
              1. PRIMERO: PANEL DE RENDIMIENTO FLOTANTE (Sustituye a Bento Grid)
             ========================================================================= */}

          <BalanceNutricionalWidget
            jugadorId={jugador.id}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            activeDayType={activeDayType}
            onDayTypeChange={setActiveDayType}
            dayTypes={DAY_TYPES}
            consumed={consumed}
            target={{ kcal, protein, cho, fat }}
            mealsCount={meals.length}
          />

          {/* Cabecera superior: 3 accesos rápidos perfectamente equilibrados */}
          <SimpleGrid cols={{ base: 3, sm: 3 }} spacing={{ base: 'xs', sm: 'md' }}>
            <PhysicalMetricWidget
              jugadorId={jugador.id}
              pesoActual={pesoActual}
              porcentajeGrasa={porcentajeGrasa}
              semaforo={semaforo}
              formatMetricNumber={formatMetricNumber}
            />
            <SweatMetricWidget
              jugadorId={jugador.id}
              latestSweat={latestSweat}
              formatMetricNumber={formatMetricNumber}
            />
            <StaffMessagesWidget
              jugadorId={jugador.id}
              messages={messages}
            />
          </SimpleGrid>

          {/* Línea completa de Hidratación: básica, chula y sin sobrecarga */}
          <HydrationWidget
            jugadorId={jugador.id}
            jugador={jugador}
            pesoActual={pesoActual}
            activeDayType={activeDayType}
            latestHydration={latestHydration}
            formatMetricNumber={formatMetricNumber}
          />

          {/* Fila intermedia: Comedor primero y Suplementación debajo */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <ComedorWidget
              jugadorId={jugador.id}
              menus={menus}
              selectedDate={selectedDate}
            />
            <SuplementacionWidget
              jugadorId={jugador.id}
            />
          </SimpleGrid>

          {/* Fila inferior: Estrategia del día */}
          <EstrategiaWidget
            jugador={jugador}
            activeDayType={activeDayType}
            activeDayLabel={activeDay?.label || 'Día activo'}
          />

          {/* =========================================================================
              3. TERCERO: PREFERENCIAS Y CONTEXTO CLÍNICO (Solo visible a técnicos/nutris)
             ========================================================================= */}
          {!readOnly && (
            <Paper p={{ base: 'md', sm: 'lg' }} bg="white" shadow="xs" radius="lg" withBorder>
              <Group gap="sm" align="center" mb="md" wrap="nowrap">
                <IconClipboardList size={28} />
                <Box style={{ minWidth: 0 }}>
                  <Title order={3} fw={700} c="dark.5" fz={{ base: 16, sm: 18 }} lineClamp={1}>Preferencias y contexto</Title>
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    Información que condiciona el plan nutricional.
                  </Text>
                </Box>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <ComidasEditable label="Comidas diarias" numComidas={jugador.num_comidas} postentreno={jugador.postentreno} preentreno={jugador.preentreno} jugadorId={jugador.id} recomendacionesDefecto={jugador.recomendaciones_defecto} readOnly={readOnly} />
                <PrepartidoEditable label="Rutinas pre-partido" configPrepartido={jugador.config_prepartido} numComidas={jugador.num_comidas} postentreno={jugador.postentreno} jugadorId={jugador.id} readOnly={readOnly} />
                <CampoEditable icon3d="target" label="Objetivo nutricional" campo="objetivo" valor={jugador.objetivo || ''} jugadorId={jugador.id} tipo="select" opciones={PLAYER_OBJECTIVES} readOnly={readOnly} />
                <CampoEditable
                  icon3d="scale"
                  label="% Grasa Objetivo (Semáforo)"
                  campo="porcentaje_grasa_objetivo"
                  valor={jugador.porcentaje_grasa_objetivo !== null && jugador.porcentaje_grasa_objetivo !== undefined ? Number(jugador.porcentaje_grasa_objetivo) : 10}
                  jugadorId={jugador.id}
                  tipo="number"
                  min={3}
                  max={35}
                  step={0.1}
                  decimalScale={2}
                  suffix=" %"
                  readOnly={readOnly}
                />
                <CampoEditable icon3d="apple" label="Gustos y preferencias" campo="gustos_preferencias" valor={jugador.gustos_preferencias || ''} jugadorId={jugador.id} readOnly={readOnly} />
                <CampoEditable icon3d="warning" label="Aversiones" campo="aversiones" valor={jugador.aversiones || ''} jugadorId={jugador.id} readOnly={readOnly} />
                <CampoEditable
                  icon3d="shield"
                  label="Restricciones Clínicas / Alergias / Intolerancias"
                  campo="intolerancias"
                  valor={jugador.intolerancias || ''}
                  jugadorId={jugador.id}
                  tipo="multiselect"
                  opciones={CLINICAL_TAGS.map((t) => ({ value: t.value, label: t.label }))}
                  readOnly={readOnly}
                />
                <CampoEditable icon3d="stethoscope" label="Contexto clínico / Notas médicas" campo="contexto_clinico" valor={jugador.contexto_clinico || ''} jugadorId={jugador.id} readOnly={readOnly} />
              </SimpleGrid>
            </Paper>
          )}

        </Stack>
      </Box >

      {/* Modal para editar ficha de jugador desde cabecera móvil */}
      < PlayerEditModal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)
        }
        player={jugador}
        title="Editar Ficha de Jugador"
      />
    </Stack >
  );
}
