'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { calculateByObjective } from '@/lib/metrics/anthropometry';
import { getDayTypeLabel, getTeamNutritionDayTypes, PLAYER_OBJECTIVES } from '@/config/nutrition-days';
import { CLINICAL_TAGS } from '@/config/clinical-tags';
import { CampoEditable, ComidasEditable, PrepartidoEditable } from '../editable';
import { latestMetricValue } from '@/lib/metrics/player';
import { listPlayerMeals } from '@/actions/mealActions';
import { getFoods } from '@/actions/foodActions';
import { consumedFromMeals } from '@/lib/nutrition/mealDishes';
import { sanitizePlanData } from '@/lib/engine';
import { getSubtabHeader } from '../subtab-config';
import { JugadorHeaderCompactMobile } from '@/components/JugadorHeader';
import PushPromptCard from '@/components/notifications/PushPromptCard';
import PlayerEditModal from '@/components/modals/PlayerEditModal';
import { usePlayerDashboard } from '../PlayerDashboardContext';
import { toDateKey } from '@/lib/dates';
import Reveal from '@/components/motion/Reveal';
import headerClasses from '../SubtabSectionHeader.module.css';
import {
  PhysicalMetricWidget,
  SweatMetricWidget,
  HydrationWidget,
  StaffMessagesWidget,
  SuplementacionWidget,
  EstrategiaWidget,
  WellnessHexagonWidget,
  PlanHoyWidget,
  MatchDayWidget,
  TeamChallengeWidget,
} from '@/components/widgets';
import PerfilHero from '@/components/widgets/PerfilHero';
import { hasStrategyFor } from '@/components/widgets/EstrategiaWidget';

dayjs.locale('es');


function formatMetricNumber(val, decimals = 1, fallback = '-') {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (!Number.isFinite(num)) return String(val);
  return num.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];


export default function PerfilSubtab({
  jugador,
  evoluciones = [],
  messages = [],
  registrosHidratacion = [],
  latestPlan = null,
  readOnly = false,
}) {
  const { user } = usePlayerDashboard();
  const [meals, setMeals] = useState([]);
  // Se incrementa al registrar una comida desde "Plan de hoy" para recargar el día
  const [mealsReload, setMealsReload] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [editModalOpen, setEditModalOpen] = useState(false);

  const defaultDiaType = 'entreno';
  const [activeDayType, setActiveDayType] = useState(defaultDiaType);

  useEffect(() => {
    if (!jugador?.id) return;
    let active = true;

    const dateStr = toDateKey(selectedDate);

    listPlayerMeals(jugador.id, { day: dateStr })
      .then((mealsData) => {
        if (active) setMeals(mealsData || []);
      })
      .catch((err) => {
        console.error('Error in Resumen tab load:', err);
        if (active) setMeals([]);
      });

    return () => {
      active = false;
    };
  }, [jugador?.id, selectedDate, mealsReload]);

  // Mismo plan y misma lectura que "Plan de hoy": el tipo de día sale de latestPlan, no de una consulta aparte
  useEffect(() => {
    const plan = sanitizePlanData(latestPlan?.datos, jugador?.equipos?.configuracion_nutricional);
    const dayKey = DAY_KEYS[new Date(selectedDate).getDay()];
    setActiveDayType(plan?.dias?.[dayKey]?.tipoDia || defaultDiaType);
  }, [latestPlan, selectedDate, jugador?.equipos?.configuracion_nutricional]);

  // Sin la biblioteca de alimentos los macros de los registros antiguos salían siempre a cero
  const [foods, setFoods] = useState([]);
  useEffect(() => {
    let active = true;
    getFoods()
      .then((items) => {
        if (active) setFoods(items || []);
      })
      .catch((err) => console.error('Error cargando alimentos:', err));
    return () => {
      active = false;
    };
  }, []);

  const consumed = useMemo(() => consumedFromMeals(meals, foods), [meals, foods]);

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

  // Objetivo del día: el del plan publicado para esa fecha (el mismo que enseña «Plan de hoy») si el tipo de día
  // coincide; si no hay plan o se mira otro tipo de día, el calculado por peso y objetivo
  const planDay = useMemo(() => {
    const plan = sanitizePlanData(latestPlan?.datos, teamConfig);
    return plan?.dias?.[DAY_KEYS[new Date(selectedDate).getDay()]] || null;
  }, [latestPlan, teamConfig, selectedDate]);
  const usePlanTarget = planDay?.tipoDia === activeDayType && Number(planDay?.kcal) > 0;
  const currentPlan = usePlanTarget
    ? { kcal: planDay.kcal, protein: planDay.proteina, cho: planDay.hidratos, fat: planDay.grasa }
    : plans[activeDayType];

  const kcal = currentPlan?.kcal || '-';
  const protein = currentPlan?.protein || null;
  const cho = currentPlan?.cho || null;
  const fat = currentPlan?.fat || null;

  // Si el plan usa un tipo de día que no está en la configuración del equipo se muestra su nombre, no el primero de la lista
  const activeDay = DAY_TYPES.find((d) => d.value === activeDayType) || { value: activeDayType, label: getDayTypeLabel(activeDayType) };

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
  const isPlayer = user?.role === 'jugador';

  const showStrategy = hasStrategyFor(jugador, activeDayType);
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
                <Title order={3} fw={700} c="var(--nutra-bosque, #1F2A24)" fz={{ base: 16, sm: 18 }} lineClamp={1}>{headerConfig.title}</Title>
                <Text size="sm" c="var(--nutra-salvia, #6C705A)" lineClamp={1}>
                  {readOnly ? (headerConfig.subtitleReadOnly || headerConfig.subtitle) : headerConfig.subtitle}
                </Text>
              </Box>
            </Group>

          </Group>
        </Box>

        {/* Mobile Compact Header */}
        <Box hiddenFrom="sm" py={2}>
          <JugadorHeaderCompactMobile
            jugador={jugador}
            user={user}
            onEdit={() => setEditModalOpen(true)}
            // El staff ya ve foto, nombre y «volver» en la barra superior (JugadorStaffBarMobile)
            leading={user?.role !== 'jugador' ? (
              <Group gap="sm" align="center" wrap="nowrap">
                <HeaderIcon size={22} />
                <Title order={3} fw={700} c="var(--nutra-bosque, #1F2A24)" fz={16} lineClamp={1} style={{ minWidth: 0 }}>{headerConfig.title}</Title>
              </Group>
            ) : null}
          />
        </Box>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }}>
        {/* Foto del tipo de día con el balance del día encima */}
        <PerfilHero
          jugadorId={jugador.id}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          dayTypes={DAY_TYPES}
          activeDayType={activeDayType}
          activeDayLabel={activeDay.label}
          onDayTypeChange={setActiveDayType}
          consumed={consumed}
          target={{ kcal, protein, cho, fat }}
          meals={meals}
          canLog={isPlayer}
        />

        <Stack gap="md" mt="md">
          {isPlayer && <PushPromptCard />}
          {/* Bento: teselas de 1 o 2 columnas; lo urgente arriba, las constantes en pares y el detalle debajo */}
          <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {/* Solo aparece el día del partido */}
            <MatchDayWidget jugadorId={jugador.id} style={{ gridColumn: 'span 2' }} />
            <Reveal index={0} style={{ gridColumn: 'span 2' }}>
              <PlanHoyWidget
                jugador={jugador}
                plan={latestPlan}
                selectedDate={selectedDate}
                loggedMeals={meals}
                canLog={user?.role === 'jugador'}
                onMealLogged={() => setMealsReload((n) => n + 1)}
              />
            </Reveal>

            <Reveal index={2}>
              <PhysicalMetricWidget
                jugadorId={jugador.id}
                pesoActual={pesoActual}
                porcentajeGrasa={porcentajeGrasa}
                semaforo={semaforo}
              />
            </Reveal>
            <Reveal index={3}>
              <StaffMessagesWidget
                jugadorId={jugador.id}
                messages={messages}
              />
            </Reveal>

            {/* Agua y suplementos siempre juntos: así la fila no salta mientras carga la pauta */}
            <Reveal index={4}>
              <HydrationWidget
                jugadorId={jugador.id}
                jugador={jugador}
                pesoActual={pesoActual}
                activeDayType={activeDayType}
                latestHydration={latestHydration}
                formatMetricNumber={formatMetricNumber}
                readOnly={user?.role !== 'jugador'}
              />
            </Reveal>
            <Reveal index={5}>
              <SuplementacionWidget jugadorId={jugador.id} readOnly={user?.role !== 'jugador'} />
            </Reveal>

            <Reveal index={6} style={{ gridColumn: 'span 2' }}>
              <WellnessHexagonWidget
                jugadorId={jugador.id}
                canEdit={user?.role !== 'tecnico'}
              />
            </Reveal>

            <Reveal index={7} style={{ gridColumn: 'span 2' }}>
              <TeamChallengeWidget jugadorId={jugador.id} />
            </Reveal>

            {latestSweat && (
              <Reveal index={8} style={{ gridColumn: 'span 2' }}>
                <SweatMetricWidget
                  jugadorId={jugador.id}
                  latestSweat={latestSweat}
                  formatMetricNumber={formatMetricNumber}
                />
              </Reveal>
            )}

            {showStrategy && (
              <Reveal index={10} style={{ gridColumn: 'span 2' }}>
                <EstrategiaWidget
                  jugador={jugador}
                  activeDayType={activeDayType}
                  activeDayLabel={activeDay.label || 'Día activo'}
                />
              </Reveal>
            )}
          </Box>

          {/* =========================================================================
              3. TERCERO: PREFERENCIAS Y CONTEXTO CLÍNICO (Solo visible a técnicos/nutris)
             ========================================================================= */}
          {!readOnly && (
            <Box mt="md">
              {/* Encabezado de sección sobre el fondo, como en el Diario: evita tarjetas dentro de tarjetas */}
              <Text fz="sm" fw={700} c="dimmed" tt="uppercase" lts={0.5}>
                Preferencias y contexto
              </Text>
              <Text fz="xs" c="dimmed" mb="sm">
                Información que condiciona el plan nutricional.
              </Text>

              <Stack gap="md">
                <ComidasEditable label="Comidas diarias" numComidas={jugador.num_comidas} postentreno={jugador.postentreno} preentreno={jugador.preentreno} jugadorId={jugador.id} recomendacionesDefecto={jugador.recomendaciones_defecto} repartoIngestas={jugador.reparto_ingestas} jugador={jugador} readOnly={readOnly} />
                <PrepartidoEditable label="Rutinas pre-partido" configPrepartido={jugador.config_prepartido} numComidas={jugador.num_comidas} postentreno={jugador.postentreno} jugadorId={jugador.id} jugador={jugador} readOnly={readOnly} />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <CampoEditable icon3d="goal_net" label="Objetivo nutricional" campo="objetivo" valor={jugador.objetivo || ''} jugadorId={jugador.id} tipo="select" opciones={PLAYER_OBJECTIVES} readOnly={readOnly} />
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
                  <CampoEditable icon3d="strawberry" label="Gustos y preferencias" campo="gustos_preferencias" valor={jugador.gustos_preferencias || ''} jugadorId={jugador.id} readOnly={readOnly} />
                  <CampoEditable icon3d="warning" label="Aversiones" campo="aversiones" valor={jugador.aversiones || ''} jugadorId={jugador.id} readOnly={readOnly} />
                  <CampoEditable
                    icon3d="shield"
                    label="Restricciones Clínicas / Intolerancias"
                    campo="intolerancias"
                    valor={jugador.intolerancias || ''}
                    jugadorId={jugador.id}
                    tipo="multiselect"
                    opciones={CLINICAL_TAGS.map((t) => ({ value: t.value, label: t.label }))}
                    readOnly={readOnly}
                  />
                  <CampoEditable icon3d="stethoscope" label="Contexto clínico / Notas médicas" campo="contexto_clinico" valor={jugador.contexto_clinico || ''} jugadorId={jugador.id} readOnly={readOnly} />
                </SimpleGrid>
              </Stack>
            </Box>
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
