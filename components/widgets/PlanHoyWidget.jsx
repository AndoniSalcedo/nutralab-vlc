'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Group, Paper, Skeleton, Text, UnstyledButton } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import { IconCheck } from '@tabler/icons-react';
import WidgetCard, { WidgetAside } from './WidgetCard';
import { getAiPlans } from '@/actions/planActions';
import { sanitizePlanData } from '@/lib/engine';
import { getDayTypeColor, getDayTypeLabel } from '@/config/nutrition-days';
import { formatInteger as formatInt } from '@/lib/utils';

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Icono y hora aproximada de fin de cada ingesta, para saber cuál toca ahora
const MEAL_SLOTS = [
  { match: 'desayuno', icon: 'coffee', until: 10.5 },
  { match: 'almuerzo', icon: 'sandwich', until: 12.5 },
  { match: 'media manana', icon: 'sandwich', until: 12.5 },
  { match: 'comida', icon: 'plate', until: 15.5 },
  { match: 'merienda', icon: 'apple', until: 19 },
  { match: 'cena', icon: 'bowl', until: 23.5 },
  { match: 'post', icon: 'bottle', until: null },
  { match: 'pre', icon: 'bolt', until: null },
];

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function getMealSlot(name) {
  const n = normalize(name);
  return MEAL_SLOTS.find((slot) => n.includes(slot.match)) || { icon: 'fork_and_knife', until: null };
}

function isSameDay(a, b) {
  const fmt = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
  return fmt(a) === fmt(b);
}

function PlanHoySkeleton() {
  return (
    <Paper shadow="sm" radius="lg" p={{ base: 'sm', sm: 'md' }} bg="white" withBorder>
      <Group justify="space-between" mb="sm">
        <Skeleton height={28} width="40%" radius="md" />
        <Skeleton height={14} width={90} radius="xl" />
      </Group>
      <Skeleton height={76} radius="md" mb="sm" />
      <Skeleton height={48} radius="md" />
    </Paper>
  );
}

export default function PlanHoyWidget({ jugador, selectedDate = new Date() }) {
  const router = useRouter();
  const [latestPlan, setLatestPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickedIdx, setPickedIdx] = useState(null);

  useEffect(() => {
    if (!jugador?.id) return;
    let active = true;
    setLoading(true);

    // Sin filtro de semana: vienen ordenados por created_at desc, el primero es el último plan
    getAiPlans(jugador.id)
      .then(({ planes }) => {
        if (active) setLatestPlan(planes?.[0] || null);
      })
      .catch((err) => {
        console.error('Error fetching latest plan:', err);
        if (active) setLatestPlan(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jugador?.id]);

  // Al cambiar de día se vuelve a la ingesta que toca
  useEffect(() => {
    setPickedIdx(null);
  }, [selectedDate]);

  const teamConfig = jugador?.equipos?.configuracion_nutricional;
  const plan = useMemo(() => sanitizePlanData(latestPlan?.datos, teamConfig), [latestPlan, teamConfig]);

  const date = new Date(selectedDate);
  const day = plan?.dias?.[DAY_KEYS[date.getDay()]] || null;
  const isToday = isSameDay(date, new Date());
  const meals = useMemo(() => (day?.ingestas || []).filter((m) => m?.nombre), [day]);

  // Ingesta que toca ahora: -1 si no es hoy; meals.length si ya han pasado todas
  const currentIdx = useMemo(() => {
    if (!isToday || meals.length === 0) return -1;
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const idx = meals.findIndex((m) => {
      const { until } = getMealSlot(m.nombre);
      return until != null && hour < until;
    });
    return idx === -1 ? meals.length : idx;
  }, [meals, isToday]);

  if (loading) return <PlanHoySkeleton />;

  const goToPlan = () => router.push(`/dashboard/jugador/${jugador.id}/nutricion/plan`);
  const hasPlan = Boolean(day && meals.length > 0);
  const title = isToday ? 'Plan de hoy' : `Plan del ${date.toLocaleDateString('es-ES', { weekday: 'long' })}`;

  const defaultIdx = currentIdx === -1 ? 0 : Math.min(currentIdx, meals.length - 1);
  const activeIdx = pickedIdx ?? defaultIdx;
  const activeMeal = meals[activeIdx];

  let heroLabel = 'Ingesta';
  if (currentIdx >= meals.length && activeIdx === meals.length - 1) heroLabel = 'Última del día';
  else if (activeIdx === currentIdx) heroLabel = 'Ahora toca';
  else if (currentIdx !== -1) heroLabel = activeIdx < currentIdx ? 'Hecha' : 'Más tarde';

  return (
    <WidgetCard
      id="widget-plan-hoy"
      icon="calendar"
      title={title}
      aside={
        hasPlan ? (
          <WidgetAside color={getDayTypeColor(day.tipoDia)} dot>
            {getDayTypeLabel(day.tipoDia)}
          </WidgetAside>
        ) : null
      }
      footer={
        hasPlan
          ? `${formatInt(day.kcal)} kcal · P ${formatInt(day.proteina)} · HC ${formatInt(day.hidratos)} · G ${formatInt(day.grasa)}`
          : 'Supervisado por nutrición'
      }
      footerAction={hasPlan ? 'Plan completo' : null}
      onClick={hasPlan ? goToPlan : undefined}
    >
      {!hasPlan ? (
        <Paper p="md" radius="md" bg="gray.0" withBorder ta="center" style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
          <Box mx="auto" mb={6} w="fit-content">
            <Icon3D name="calendar" size={32} />
          </Box>
          <Text fz="xs" fw={700} c="dark.5">Sin planificación nutricional</Text>
          <Text fz="xs" c="dimmed" mt={2}>Aún no se ha publicado ningún plan para este jugador</Text>
        </Paper>
      ) : (
        <>
          {/* Ingesta destacada */}
          <Paper p="sm" radius="md" bg="gray.0" mt="xs" withBorder style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
            <Group gap="sm" align="center" wrap="nowrap">
              <Box style={{ flexShrink: 0 }}>
                <Icon3D name={getMealSlot(activeMeal.nombre).icon} size={44} />
              </Box>
              <Box style={{ minWidth: 0, flex: 1 }}>
                <Group gap={6} align="baseline" wrap="nowrap">
                  <Text fz="md" fw={700} c="dark.5" lh={1.2} truncate>
                    {activeMeal.nombre}
                  </Text>
                  <Text fz={10} fw={700} c="nutralabColor.8" tt="uppercase" lts={0.5} style={{ flexShrink: 0 }}>
                    {heroLabel}
                  </Text>
                </Group>
                <Text fz="xs" c="dimmed" lh={1.4} mt={2} lineClamp={3}>
                  {activeMeal.detalle || 'Sin detalle en el plan'}
                </Text>
              </Box>
            </Group>
          </Paper>

          {/* Recorrido del día */}
          <Box mt="sm" pt={4} style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
            <Box style={{ position: 'relative', display: 'flex', minWidth: meals.length * 58 }}>
              <Box
                style={{
                  position: 'absolute',
                  top: 15,
                  left: `calc(100% / ${meals.length * 2})`,
                  right: `calc(100% / ${meals.length * 2})`,
                  height: 2,
                  backgroundColor: 'var(--mantine-color-gray-2)',
                }}
              />
              {meals.map((meal, idx) => {
                const isActive = idx === activeIdx;
                const isDone = currentIdx !== -1 && idx < currentIdx;
                return (
                  <UnstyledButton
                    key={`${meal.nombre}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPickedIdx(idx);
                    }}
                    aria-label={`Ver ${meal.nombre}`}
                    aria-pressed={isActive}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}
                  >
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDone && !isActive ? 'var(--mantine-color-nutralabColor-6)' : 'white',
                        border: `2px solid ${isActive || isDone ? 'var(--mantine-color-nutralabColor-6)' : 'var(--mantine-color-gray-3)'}`,
                        boxShadow: isActive ? '0 0 0 3px var(--mantine-color-nutralabColor-1)' : 'none',
                        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {isDone && !isActive ? (
                        <IconCheck size={16} stroke={3} color="white" />
                      ) : (
                        <Icon3D name={getMealSlot(meal.nombre).icon} size={18} />
                      )}
                    </Box>
                    <Text fz={10} fw={isActive ? 700 : 500} c={isActive ? 'dark.5' : 'dimmed'} ta="center" lh={1.1} truncate maw="100%">
                      {meal.nombre}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Box>
          </Box>
        </>
      )}

    </WidgetCard>
  );
}
