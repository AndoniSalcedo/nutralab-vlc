'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Group, Stack, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconBottle, IconPlus, IconMinus } from '@tabler/icons-react';
import FillableIcon from '@/components/FillableIcon';
import Icon3D from '@/components/Icon3D';
import { calculateHydration } from '@/lib/metrics/anthropometry';

export default function HydrationWidget({
  jugadorId: propJugadorId,
  jugador,
  pesoActual,
  activeDayType = 'entreno',
  latestHydration,
  formatMetricNumber = (val) => val ?? '-',
}) {
  const router = useRouter();
  const jugadorId = jugador?.id || propJugadorId;
  const [drunk, setDrunk] = useState(0);

  // Cálculo fisiológico de agua según peso del jugador y tipo de día activo
  const peso = Number(pesoActual || jugador?.peso_kg || 75);
  const targetMl = useMemo(() => calculateHydration(peso, activeDayType), [peso, activeDayType]);
  const targetL = Number((targetMl / 1000).toFixed(2));

  const percent = targetL > 0 ? Math.min(100, Math.round((drunk / targetL) * 100)) : 0;
  const isGoalReached = percent >= 100;

  const storageKey = jugadorId ? `nutrilab_water_log_${jugadorId}` : 'nutrilab_water_log';
  const legacyKey = jugadorId ? `hydration_${jugadorId}_${new Date().toISOString().split('T')[0]}` : null;

  // Cargar registro de agua desde localStorage
  useEffect(() => {
    const todayKey = new Date().toDateString();

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayKey) {
          setDrunk(Number(parsed.amount || 0));
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
        }
      }
    } catch (e) {
      console.error('Error cargando agua consumida:', e);
    }
  }, [storageKey, legacyKey]);

  // Guardar en localStorage
  const saveWater = (newDrunk) => {
    try {
      const todayKey = new Date().toDateString();
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          date: todayKey,
          amount: newDrunk,
          targetType: activeDayType,
        })
      );

      if (legacyKey) {
        localStorage.setItem(
          legacyKey,
          JSON.stringify({
            consumed: Math.round(newDrunk * 1000),
            targetType: activeDayType,
          })
        );
      }
    } catch (e) {
      console.error('Error guardando agua:', e);
    }
  };

  const handleUpdateWater = (amount) => {
    const newValue = Math.max(0, parseFloat((drunk + amount).toFixed(2)));
    setDrunk(newValue);
    saveWater(newValue);
  };

  // Métrica clínica de osmolaridad
  const value = latestHydration?.valor;
  const numValue = Number(value);

  let statusColor = 'teal.6';
  let statusLabel = 'Óptimo';

  if (Number.isFinite(numValue) && numValue > 0) {
    if (numValue > 900) {
      statusColor = 'red.6';
      statusLabel = 'Alerta';
    } else if (numValue >= 700) {
      statusColor = 'yellow.7';
      statusLabel = 'Límite';
    } else {
      statusColor = 'teal.6';
      statusLabel = 'Óptimo';
    }
  } else if (latestHydration?.estado) {
    statusLabel = latestHydration.estado;
  }

  return (
    <Paper
      id="widget-water"
      radius="lg"
      p={{ base: 'sm', sm: 'md' }}
      bg="white"
      shadow="xs"
      withBorder
    >
      {/* 1. Cabecera uniforme idéntica al resto de widgets del dashboard */}
      <Group justify="space-between" align="center" mb="xs">
        <Group gap="xs" align="center">
          <Icon3D name="droplet" size={28} />
          <Text fw={700} fz="sm" c="dark.5">
            Hidratación
          </Text>
        </Group>

        {/* Litros consumidos / Objetivo diario en la cabecera */}
        <Text
          fz="sm"
          fw={700}
          c={isGoalReached ? 'teal.7' : 'dark.4'}
          style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
        >
          {drunk.toFixed(2)}L{' '}
          <Text span fz="xs" fw={500} c="dimmed">
            / {targetL.toFixed(1)}L
          </Text>
        </Text>
      </Group>

      {/* 2. Cuerpo del widget: Osmolaridad clínica destacada + Botella animada interactiva */}
      <Group justify="space-between" align="center" wrap="nowrap" gap="md" my="xs">
        {/* Lado izquierdo: Osmolaridad clínica con amplio espacio, visible y clara en móvil */}
        <Stack
          gap={4}
          style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
          onClick={() => router.push(`/dashboard/jugador/${jugadorId}/metricas/hidratacion`)}
        >
          <Group gap={6} align="center" wrap="nowrap">
            <span style={{ fontSize: '9px', color: `var(--mantine-color-${statusColor})`, flexShrink: 0 }}>●</span>
            <Text fz="xs" fw={700} c={statusColor}>
              Osmolaridad: {value ? formatMetricNumber(value, 0) : '620'} mOsm
            </Text>
          </Group>
          <Text fz="xs" fw={500} c="dimmed">
            Estado: <Text span fw={600} c="dark.4">{statusLabel}</Text> · {percent}% objetivo
          </Text>
        </Stack>

        {/* Lado derecho: Botón [-], Botella animada FillableIcon (60px), Botón [+] */}
        <Group gap="xs" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Tooltip label="Restar 250ml (-0.25 L)" withArrow position="top">
            <ActionIcon
              size="lg"
              variant="subtle"
              color="gray"
              radius="xl"
              disabled={drunk <= 0}
              onClick={() => handleUpdateWater(-0.25)}
              aria-label="Restar 250ml"
            >
              <IconMinus size={18} stroke={2.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={`${drunk.toFixed(2)} L consumidos de ${targetL.toFixed(2)} L (${percent}%)`}
            withArrow
            position="top"
          >
            <Box
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => handleUpdateWater(0.25)}
            >
              <FillableIcon
                Icon={IconBottle}
                percent={percent}
                size={60}
                colorVar={isGoalReached ? 'teal-4' : 'cyan-4'}
                iconColor={isGoalReached ? 'var(--mantine-color-teal-8)' : 'var(--mantine-color-cyan-8)'}
                bgIconColor="var(--mantine-color-gray-3)"
              />
            </Box>
          </Tooltip>

          <Tooltip label="Añadir 250ml (+0.25 L)" withArrow position="top">
            <ActionIcon
              size="lg"
              variant="light"
              color={isGoalReached ? 'teal' : 'blue'}
              radius="xl"
              onClick={() => handleUpdateWater(0.25)}
              aria-label="Sumar 250ml"
            >
              <IconPlus size={18} stroke={2.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* 3. Pie de tarjeta idéntico al resto de widgets */}
      <Group
        justify="space-between"
        align="center"
        mt="xs"
        pt="xs"
        style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}
      >
        <Text fz="xs" c="dimmed" fw={500}>
          Pauta para {activeDayType} ({targetL} L/día)
        </Text>
        <Text
          fz="xs"
          fw={600}
          c="dark.4"
          style={{ cursor: 'pointer' }}
          onClick={() => router.push(`/dashboard/jugador/${jugadorId}/metricas/hidratacion`)}
        >
          Ver analítica →
        </Text>
      </Group>
    </Paper>
  );
}
