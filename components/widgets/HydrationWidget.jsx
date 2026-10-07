'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Group, Stack, Text, ActionIcon, Button } from '@mantine/core';
import { IconMinus } from '@tabler/icons-react';
import WidgetCard, { WidgetAside, WidgetValue } from './WidgetCard';
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

  let statusColor = 'blue.6';
  let statusLabel = 'Óptimo';

  if (Number.isFinite(numValue) && numValue > 0) {
    if (numValue > 900) {
      statusColor = 'arcilla.6';
      statusLabel = 'Alerta';
    } else if (numValue >= 700) {
      statusColor = 'salvia.7';
      statusLabel = 'Límite';
    } else {
      statusColor = 'blue.6';
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
      title="Agua"
      color="blue"
      fillPercent={percent}
      fillColor="blue.0"
      fillWaveColor="blue.1"
      aside={<WidgetAside color={isGoalReached ? 'blue' : 'salvia'}>{percent}%</WidgetAside>}
      style={{ minHeight: 216 }}
    >
      <Stack gap="sm" justify="space-between" h="100%">
        <Box>
          <WidgetValue
            value={drunk.toFixed(2).replace('.', ',')}
            unit={`/ ${targetL.toFixed(1).replace('.', ',')} L`}
            color={isGoalReached ? 'var(--nutra-lima-dark, #4a6813)' : 'var(--nutra-bosque, #1F2A24)'}
            size={32}
          />
          <Text
            fz="xs"
            c="dimmed"
            mt={6}
            lh={1.35}
            style={{ cursor: 'pointer' }}
            onClick={goToAnalytics}
          >
            Osmolaridad{' '}
            <Text span inherit fw={700} c={statusColor}>
              {value ? `${formatMetricNumber(value, 0)} mOsm` : '—'}
            </Text>{' '}
            · {statusLabel}
          </Text>
        </Box>

        <Group gap={6} wrap="nowrap">
          <ActionIcon
            size={44}
            variant="default"
            radius="xl"
            disabled={drunk <= 0}
            onClick={() => handleUpdateWater(-0.25)}
            aria-label="Restar 250 ml"
          >
            <IconMinus size={18} stroke={2.5} />
          </ActionIcon>
          <Button
            flex={1}
            h={44}
            radius="xl"
            color="blue"
            px={6}
            onClick={() => handleUpdateWater(0.25)}
            aria-label="Sumar 250 ml"
          >
            + 250 ml
          </Button>
        </Group>
      </Stack>
    </WidgetCard>
  );
}
