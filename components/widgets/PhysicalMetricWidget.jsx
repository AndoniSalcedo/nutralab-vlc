'use client';

import { useRouter } from 'next/navigation';
import { Box, Stack, Text, Tooltip, Divider, Group } from '@mantine/core';
import WidgetCard, { WidgetAside } from './WidgetCard';

const STATUS_COLORS = { verde: 'teal', amarillo: 'yellow', rojo: 'red' };

const statusConfigMap = {
  verde: {
    color: '#2e7d32',
    title: 'Óptimo',
  },
  amarillo: {
    color: '#b45309',
    title: 'Precaución',
  },
  rojo: {
    color: '#c92a2a',
    title: 'Alerta',
  },
};

export default function PhysicalMetricWidget({
  jugadorId,
  pesoActual,
  porcentajeGrasa,
  semaforo,
  formatMetricNumber = (val) => val ?? '-',
}) {
  const router = useRouter();

  const hasSemaforo = semaforo?.hasPesajes && semaforo?.hasReference;
  const status = semaforo?.status || 'verde';
  const cfg = statusConfigMap[status] || statusConfigMap.verde;

  const diff = semaforo?.diff;
  const hasDiff = diff !== null && diff !== undefined && Number.isFinite(diff);
  const formattedDiff = hasDiff
    ? (diff > 0 ? `+${diff.toFixed(2)} kg` : `${diff.toFixed(2)} kg`)
    : null;

  const tooltipContent = hasSemaforo ? (
    <Stack gap={4} p={4}>
      <Group justify="space-between" align="center">
        <Text size="xs" fw={700} c={cfg.color}>
          ● {semaforo.label}
        </Text>
        <Text size="xs" fw={700} c={cfg.color} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {status}
        </Text>
      </Group>
      <Divider my={2} style={{ opacity: 0.2 }} />
      <Group justify="space-between">
        <Text size="xs" c="dimmed">Peso Actual:</Text>
        <Text size="xs" fw={700}>{semaforo.pesoActual} kg</Text>
      </Group>
      <Group justify="space-between">
        <Text size="xs" c="dimmed">Peso Ref ({semaforo.porcentajeGrasaObjetivo || 10}% gr):</Text>
        <Text size="xs" fw={700}>{semaforo.pesoReferencia} kg</Text>
      </Group>
      {semaforo.masaMagra && (
        <Group justify="space-between">
          <Text size="xs" c="dimmed">Masa Magra:</Text>
          <Text size="xs" fw={700}>{semaforo.masaMagra} kg</Text>
        </Group>
      )}
      <Group justify="space-between">
        <Text size="xs" c="dimmed">Variación:</Text>
        <Text size="xs" fw={700} c={cfg.color}>
          {formattedDiff}
        </Text>
      </Group>
      <Text size="10px" c="dimmed" mt={2} style={{ fontStyle: 'italic' }}>
        Margen verde (±0,50 kg) · Amarillo (±1,00 kg)
      </Text>
    </Stack>
  ) : null;

  return (
    <Tooltip
      label={tooltipContent}
      disabled={!hasSemaforo}
      position="top"
      withArrow
      radius="md"
      w={240}
      multiline
    >
      <Box h="100%">
        <WidgetCard
          id="widget-fisico"
          color="green"
          icon="gym"
          title="Físico"
          onClick={() => router.push(`/dashboard/jugador/${jugadorId}/metricas/pesos`)}
        >
          <Text fz={24} fw={800} c="dark.6" lh={1.1} style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {pesoActual ? formatMetricNumber(pesoActual, 1) : '—'}
            <Text span fz="xs" fw={600} c="dimmed"> kg</Text>
          </Text>
          <Box mt={6} w="fit-content">
            {hasSemaforo ? (
              <WidgetAside color={STATUS_COLORS[status] || 'teal'} dot>
                {formattedDiff ? `${formattedDiff} · ${cfg.title}` : cfg.title}
              </WidgetAside>
            ) : (
              <WidgetAside color="teal">
                {porcentajeGrasa ? `${formatMetricNumber(porcentajeGrasa, 1)}% grasa` : 'Al día'}
              </WidgetAside>
            )}
          </Box>
        </WidgetCard>
      </Box>
    </Tooltip>
  );
}

