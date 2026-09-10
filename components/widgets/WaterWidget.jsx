'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Group,
  Stack,
  Text,
  ActionIcon,
  Button,
  Box,
  SimpleGrid,
  Tooltip,
} from '@mantine/core';
import {
  IconBottle,
  IconPlus,
  IconMinus,
  IconRefresh,
  IconDroplet,
  IconChevronRight,
} from '@tabler/icons-react';
import FillableIcon from '@/components/FillableIcon';
import { calculateHydration, getTeamNutritionDayTypes } from '@/lib/metrics/anthropometry';

export default function WaterWidget({
  jugador,
  jugadorId: propJugadorId,
  latestHydration = null,
  activeDayType = 'descanso',
  formatMetricNumber = (val) => val ?? '-',
}) {
  const router = useRouter();
  const jugadorId = jugador?.id || propJugadorId;
  const [isClient, setIsClient] = useState(false);
  const [drunk, setDrunk] = useState(0);
  const [selectedDayType, setSelectedDayType] = useState(activeDayType);

  const teamConfig = jugador?.equipos?.configuracion_nutricional;
  const dayTypes = useMemo(() => getTeamNutritionDayTypes(teamConfig), [teamConfig]);

  // Sincronizar selectedDayType con activeDayType si cambia externamente
  useEffect(() => {
    if (activeDayType && dayTypes.some((d) => d.key === activeDayType)) {
      setSelectedDayType(activeDayType);
    }
  }, [activeDayType, dayTypes]);

  const peso = Number(jugador?.peso_kg || 75);

  // Cálculo fisiológico de objetivos según peso del jugador
  const targets = useMemo(() => {
    const out = {};
    dayTypes.forEach((d) => {
      out[d.key] = calculateHydration(peso, d.key);
    });
    return out;
  }, [peso, dayTypes]);

  const currentTargetMl = targets[selectedDayType] || 3000;
  const targetL = Number((currentTargetMl / 1000).toFixed(2));
  const percent = targetL > 0 ? Math.min(100, Math.round((drunk / targetL) * 100)) : 0;
  const isGoalReached = percent >= 100;

  const storageKey = jugadorId ? `nutrilab_water_log_${jugadorId}` : 'nutrilab_water_log';
  const legacyKey = jugadorId ? `hydration_${jugadorId}_${new Date().toISOString().split('T')[0]}` : null;

  // Cargar agua consumida desde localStorage
  useEffect(() => {
    setIsClient(true);
    const todayKey = new Date().toDateString();

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayKey) {
          setDrunk(Number(parsed.amount || 0));
          if (parsed.targetType) setSelectedDayType(parsed.targetType);
          return;
        } else {
          localStorage.removeItem(storageKey);
        }
      }

      if (legacyKey) {
        const legacySaved = localStorage.getItem(legacyKey);
        if (legacySaved) {
          const parsed = JSON.parse(legacySaved);
          if (parsed.consumed) {
            setDrunk(parseFloat((parsed.consumed / 1000).toFixed(2)));
          }
          if (parsed.targetType) setSelectedDayType(parsed.targetType);
        }
      }
    } catch (e) {
      console.error('Error cargando consumo de agua:', e);
    }
  }, [storageKey, legacyKey]);

  // Guardar en localStorage
  const saveWater = (newDrunk, newTargetType) => {
    try {
      const todayKey = new Date().toDateString();
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          date: todayKey,
          amount: newDrunk,
          targetType: newTargetType,
        })
      );

      if (legacyKey) {
        localStorage.setItem(
          legacyKey,
          JSON.stringify({
            consumed: Math.round(newDrunk * 1000),
            targetType: newTargetType,
          })
        );
      }

      // Notificar a otros componentes en la misma pestaña
      window.dispatchEvent(new Event('nutrilab_water_updated'));
    } catch (e) {
      console.error('Error guardando agua:', e);
    }
  };

  const handleUpdateWater = (amount) => {
    const newValue = Math.max(0, parseFloat((drunk + amount).toFixed(2)));
    setDrunk(newValue);
    saveWater(newValue, selectedDayType);
  };

  const handleSelectDayType = (typeKey) => {
    setSelectedDayType(typeKey);
    saveWater(drunk, typeKey);
  };

  const handleReset = () => {
    setDrunk(0);
    saveWater(0, selectedDayType);
  };

  // Métrica clínica de osmolaridad integrada del widget existente
  const osmValue = latestHydration?.valor;
  const numOsm = Number(osmValue);
  let statusColor = 'teal.6';
  let statusLabel = 'Óptimo';

  if (Number.isFinite(numOsm) && numOsm > 0) {
    if (numOsm > 900) {
      statusColor = 'red.6';
      statusLabel = 'Alerta';
    } else if (numOsm >= 700) {
      statusColor = 'yellow.7';
      statusLabel = 'Límite';
    } else {
      statusColor = 'teal.6';
      statusLabel = 'Óptimo';
    }
  } else if (latestHydration?.estado) {
    statusLabel = latestHydration.estado;
  }

  if (!isClient) return null;

  return (
    <Paper
      id="widget-water"
      radius="lg"
      p={{ base: 'md', sm: 'lg' }}
      bg="white"
      shadow="xs"
      withBorder
    >
      <Stack gap="md">
        {/* Cabecera: Título + Integración del estado clínico de osmolaridad */}
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap={8}>
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                backgroundColor: 'var(--mantine-color-blue-0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mantine-color-blue-6)',
              }}
            >
              <IconDroplet size={20} stroke={2} />
            </Box>
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.8}>
                Hidratación y Consumo de Agua
              </Text>
              <Text size="sm" fw={700} c="dark.5">
                Objetivo calculado para {peso} kg
              </Text>
            </Box>
          </Group>

          {/* Integración con analítica clínica de hidratación existente */}
          {jugadorId && (
            <Group
              gap={6}
              align="center"
              onClick={() => router.push(`/dashboard/jugador/${jugadorId}/metricas/hidratacion`)}
              style={{
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: 'var(--mantine-color-gray-0)',
                border: '1px solid var(--mantine-color-gray-2)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <span style={{ fontSize: '8px', color: `var(--mantine-color-${statusColor})` }}>●</span>
              <Text size="xs" fw={600} c="dark.5">
                Osmolaridad:{' '}
                <Text span fw={700}>
                  {osmValue ? formatMetricNumber(osmValue, 0) : '620'} mOsm
                </Text>{' '}
                ({statusLabel})
              </Text>
              <IconChevronRight size={14} color="var(--mantine-color-dimmed)" />
            </Group>
          )}
        </Group>

        {/* Selector de días para cálculo de hidratación (sin <Badge>, con indicadores tipográficos) */}
        <Group gap={6} wrap="wrap">
          {dayTypes.map((dt) => {
            const isActive = dt.key === selectedDayType;
            const dayLiters = ((targets[dt.key] || 3000) / 1000).toFixed(2);
            const colorName = dt.color || 'blue';

            return (
              <Box
                key={dt.key}
                onClick={() => handleSelectDayType(dt.key)}
                style={{
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: isActive
                    ? `var(--mantine-color-${colorName}-0)`
                    : 'var(--mantine-color-gray-0)',
                  border: `1px solid ${
                    isActive
                      ? `var(--mantine-color-${colorName}-4)`
                      : 'var(--mantine-color-gray-2)'
                  }`,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '8px',
                    color: `var(--mantine-color-${colorName}-${isActive ? '6' : '4'})`,
                  }}
                >
                  ●
                </span>
                <Text
                  size="xs"
                  fw={isActive ? 700 : 500}
                  c={isActive ? `var(--mantine-color-${colorName}-8)` : 'dimmed'}
                >
                  {dt.label} · {dayLiters} L
                </Text>
              </Box>
            );
          })}
        </Group>

        {/* Fila principal: Métricas y Botella interactiva animada */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" align="center">
          {/* LADO IZQUIERDO: Progreso y textos */}
          <Stack gap={4}>
            <Group align="flex-end" gap={6}>
              <Text fz={{ base: 36, sm: 42 }} fw={800} c="dark.5" lh={1}>
                {drunk.toFixed(2)}
                <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 2 }}>L</span>
              </Text>
              <Text size="md" c="dimmed" mb={4} fw={600}>
                / {targetL.toFixed(2)} L
              </Text>
            </Group>

            <Group gap="xs" align="center" mt={2}>
              <span
                style={{
                  fontSize: '9px',
                  color: isGoalReached
                    ? 'var(--mantine-color-teal-6)'
                    : 'var(--mantine-color-cyan-6)',
                }}
              >
                ●
              </span>
              <Text
                size="xs"
                fw={700}
                c={isGoalReached ? 'teal.7' : 'cyan.8'}
                tt="uppercase"
                lts={0.5}
              >
                {isGoalReached ? 'Objetivo cumplido (100%)' : `${percent}% del objetivo diario`}
              </Text>
            </Group>

            {/* Barra de progreso */}
            <Box
              mt={6}
              style={{
                width: '100%',
                maxWidth: 320,
                height: 6,
                backgroundColor: 'var(--mantine-color-gray-1)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  height: '100%',
                  width: `${percent}%`,
                  backgroundColor: isGoalReached
                    ? 'var(--mantine-color-teal-5)'
                    : 'var(--mantine-color-cyan-5)',
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }}
              />
            </Box>

            <Text size="xs" c="dimmed" mt={4}>
              Base: 40 ml/kg en descanso · +6 ml/kg en entreno · +10 ml/kg en partido.
            </Text>
          </Stack>

          {/* LADO DERECHO: Controles de botella interactiva adaptados de nutralab-mobile */}
          <Stack gap="sm" align={{ base: 'center', sm: 'flex-end' }}>
            <Group gap="md" align="center">
              {/* Botón Restar */}
              <Tooltip label="Restar 250 ml (-0.25 L)" withArrow position="top">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  size="xl"
                  onClick={() => handleUpdateWater(-0.25)}
                  disabled={drunk <= 0}
                  aria-label="Restar agua"
                  style={{ transition: 'transform 0.1s ease' }}
                >
                  <IconMinus size={20} stroke={2.5} />
                </ActionIcon>
              </Tooltip>

              {/* Botella que se llena dinámicamente con FillableIcon */}
              <Tooltip
                label={`${drunk.toFixed(2)} L consumidos de ${targetL.toFixed(2)} L`}
                withArrow
                position="top"
              >
                <Box style={{ cursor: 'pointer' }} onClick={() => handleUpdateWater(0.25)}>
                  <FillableIcon
                    Icon={IconBottle}
                    percent={percent}
                    size={74}
                    colorVar={isGoalReached ? 'teal-4' : 'cyan-4'}
                    iconColor={
                      isGoalReached
                        ? 'var(--mantine-color-teal-8)'
                        : 'var(--mantine-color-cyan-8)'
                    }
                    bgIconColor="var(--mantine-color-gray-3)"
                  />
                </Box>
              </Tooltip>

              {/* Botón Sumar */}
              <Tooltip label="Añadir 250 ml (+0.25 L)" withArrow position="top">
                <ActionIcon
                  variant="light"
                  color={isGoalReached ? 'teal' : 'blue'}
                  radius="xl"
                  size="xl"
                  onClick={() => handleUpdateWater(0.25)}
                  aria-label="Sumar agua"
                  style={{ transition: 'transform 0.1s ease' }}
                >
                  <IconPlus size={22} stroke={2.5} />
                </ActionIcon>
              </Tooltip>
            </Group>

            {/* Botones de incremento rápido y reseteo */}
            <Group gap={6} align="center">
              <Button
                variant="subtle"
                color="blue"
                size="compact-xs"
                radius="xl"
                onClick={() => handleUpdateWater(0.25)}
              >
                +250 ml
              </Button>
              <Button
                variant="subtle"
                color="blue"
                size="compact-xs"
                radius="xl"
                onClick={() => handleUpdateWater(0.5)}
              >
                +500 ml
              </Button>
              <Button
                variant="subtle"
                color="blue"
                size="compact-xs"
                radius="xl"
                onClick={() => handleUpdateWater(1.0)}
              >
                +1 L
              </Button>

              <Tooltip label="Reiniciar contador diario" withArrow position="top">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  size="sm"
                  onClick={handleReset}
                  aria-label="Reiniciar contador"
                >
                  <IconRefresh size={15} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
