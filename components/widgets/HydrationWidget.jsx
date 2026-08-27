'use client';

import { useRouter } from 'next/navigation';
import { Box, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconDroplet } from '@tabler/icons-react';

export default function HydrationWidget({
  jugadorId,
  latestHydration,
  formatMetricNumber = (val) => val ?? '-',
}) {
  const router = useRouter();

  const value = latestHydration?.valor;
  const numValue = Number(value);

  // Determinar estado de hidratación dinámico
  let statusColor = 'teal.6';
  let statusLabel = '● Óptimo';

  if (Number.isFinite(numValue) && numValue > 0) {
    if (numValue > 900) {
      statusColor = 'red.6';
      statusLabel = '● Alerta';
    } else if (numValue >= 700) {
      statusColor = 'yellow.7';
      statusLabel = '● Límite';
    } else {
      statusColor = 'teal.6';
      statusLabel = '● Óptimo';
    }
  } else if (latestHydration?.estado) {
    statusLabel = `● ${latestHydration.estado}`;
  }

  return (
    <Paper
      shadow="xs"
      radius="lg"
      p={{ base: 'xs', sm: 'sm' }}
      bg="white"
      withBorder
      h="100%"
      onClick={() => router.push(`/dashboard/jugador/${jugadorId}/metricas/hidratacion`)}
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
        <ThemeIcon color="teal" variant="light" size={28} radius="md">
          <IconDroplet size={16} />
        </ThemeIcon>

        <Box>
          <Text fz={{ base: 14, sm: 18 }} fw={900} c="dark.6" lh={1.1}>
            {value ? formatMetricNumber(value, 0) : '620'}
          </Text>
          <Text fz="10px" fw={700} c={statusColor} mt={2}>
            {statusLabel}
          </Text>
        </Box>

        <Text fz="9px" fw={800} c="dimmed" tt="uppercase" lts={0.5}>
          Hidratación
        </Text>
      </Stack>
    </Paper>
  );
}
