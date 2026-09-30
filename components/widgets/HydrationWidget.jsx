'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Group, Stack, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconBottle, IconPlus, IconMinus } from '@tabler/icons-react';
import FillableIcon from '@/components/FillableIcon';
import WidgetCard, { WidgetAside } from './WidgetCard';
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

  const goToAnalytics = () => router.push(`/dashboard/jugador/${jugadorId}/metricas/hidratacion`);

  return (
    <WidgetCard
      id="widget-water"
      icon="droplet"
      title="Hidratación"
      aside={<WidgetAside color={isGoalReached ? 'teal' : 'cyan'}>{percent}% objetivo</WidgetAside>}
      footer={`Pauta para ${activeDayType} · ${targetL} L/día`}
      footerAction="Ver analítica"
      onFooterAction={goToAnalytics}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        {/* Litros del día + osmolaridad */}
        <Stack gap={6} style={{ minWidth: 0, flex: 1 }}>
          <Text lh={1} style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            <Text span fz={28} fw={800} c={isGoalReached ? 'teal.7' : 'dark.6'}>
              {drunk.toFixed(2)}
            </Text>
            <Text span fz="xs" fw={600} c="dimmed">
              {' '}/ {targetL.toFixed(1)} L
            </Text>
          </Text>
          <Group gap={6} align="center" wrap="nowrap" style={{ cursor: 'pointer' }} onClick={goToAnalytics}>
            <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: `var(--mantine-color-${statusColor.replace('.', '-')})`, flexShrink: 0 }} />
            <Text fz="xs" c="dimmed" lh={1.3}>
              Osmolaridad <Text span inherit fw={700} c={statusColor}>{value ? formatMetricNumber(value, 0) : '—'} mOsm</Text> · {statusLabel}
            </Text>
          </Group>
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
    </WidgetCard>
  );
}
