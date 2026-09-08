'use client';

import { useRouter } from 'next/navigation';
import { Box, Paper, Stack, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';

export default function PhysicalMetricWidget({
  jugadorId,
  pesoActual,
  porcentajeGrasa,
  semaforo,
  formatMetricNumber = (val) => val ?? '-',
}) {
  const router = useRouter();

  const weightDiff = semaforo?.diff;
  const hasDiff = weightDiff !== null && weightDiff !== undefined && Number.isFinite(weightDiff);
  const formattedDiff = hasDiff
    ? (weightDiff > 0 ? `+${weightDiff.toFixed(2)} kg` : `${weightDiff.toFixed(2)} kg`)
    : null;

  return (
    <Paper
      shadow="xs"
      radius="lg"
      p={{ base: 'xs', sm: 'sm' }}
      bg="white"
      withBorder
      h="100%"
      onClick={() => router.push(`/dashboard/jugador/${jugadorId}/metricas/mediciones`)}
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

        <Box>
          <Text fz={{ base: 14, sm: 18 }} fw={700} c="dark.5" lh={1.1}>
            {pesoActual ? `${formatMetricNumber(pesoActual, 1)} kg` : '-'}
          </Text>
          <Text fz="xs" fw={600} c="teal.7" mt={2}>
            {porcentajeGrasa ? `${formatMetricNumber(porcentajeGrasa, 1)}% gr` : (formattedDiff || '-')}
          </Text>
        </Box>

        <Text fz="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
          Físico
        </Text>
      </Stack>
    </Paper>
  );
}

