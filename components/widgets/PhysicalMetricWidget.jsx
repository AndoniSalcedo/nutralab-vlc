'use client';

import { useRouter } from 'next/navigation';
import { Box, Paper, Stack, Text, Tooltip, Divider, Group } from '@mantine/core';
import Icon3D from '@/components/Icon3D';

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
      <Paper
        id="widget-fisico"
        shadow="xs"
        radius="lg"
        p={{ base: 'xs', sm: 'sm' }}
        bg="white"
        withBorder
        h="100%"
        onClick={() => router.push(`/dashboard/jugador/${jugadorId}/metricas/pesos`)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <Stack align="center" justify="center" gap={4} w="100%" ta="center">
          <Icon3D name="gym" size={44} style={{ marginBottom: 2 }} />

          <Box style={{ width: '100%' }}>
            <Text fz={{ base: 13, sm: 17 }} fw={700} c="dark.5" lh={1.1} truncate="end">
              {pesoActual ? `${formatMetricNumber(pesoActual, 1)} kg` : '-'}
            </Text>
            {hasSemaforo ? (
              <Text fz={{ base: 11, sm: 'xs' }} fw={600} style={{ color: cfg.color, whiteSpace: 'nowrap' }} mt={2}>
                {formattedDiff ? `${formattedDiff} ${cfg.title}` : cfg.title}
              </Text>
            ) : (
              <Text fz={{ base: 11, sm: 'xs' }} fw={600} c="teal.7" mt={2} style={{ whiteSpace: 'nowrap' }}>
                {porcentajeGrasa ? `${formatMetricNumber(porcentajeGrasa, 1)}% gr` : (formattedDiff || 'Al día')}
              </Text>
            )}
          </Box>

          <Text fz="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
            Físico
          </Text>
        </Stack>
      </Paper>
    </Tooltip>
  );
}

