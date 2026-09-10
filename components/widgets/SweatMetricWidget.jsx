'use client';

import { useRouter } from 'next/navigation';
import { Box, Paper, Stack, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';

export default function SweatMetricWidget({
  jugadorId,
  latestSweat = null,
  formatMetricNumber = (val) => val ?? '-',
}) {
  const router = useRouter();

  const val = latestSweat?.valor;
  const hasValue = val !== null && val !== undefined && val !== '';
  const unit = latestSweat?.unidad || 'mg/L';
  const numVal = Number(val);

  let statusColor = 'orange.7';
  let statusLabel = 'Moderado';

  if (hasValue && Number.isFinite(numVal)) {
    if (numVal > 1100) {
      statusColor = 'red.6';
      statusLabel = 'Sodio Alto';
    } else if (numVal < 650) {
      statusColor = 'teal.7';
      statusLabel = 'Sodio Bajo';
    } else {
      statusColor = 'orange.7';
      statusLabel = 'Sodio Medio';
    }
  } else if (latestSweat?.estado) {
    statusLabel = latestSweat.estado;
  }

  return (
    <Paper
      id="widget-sudor"
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
        <Icon3D name="running" size={44} style={{ marginBottom: 2 }} />

        <Box style={{ width: '100%' }}>
          <Text fz={{ base: 13, sm: 17 }} fw={700} c="dark.5" lh={1.1} truncate="end">
            {hasValue ? `${formatMetricNumber(numVal, 0)} ${unit}` : 'Sin datos'}
          </Text>
          <Text fz={{ base: 11, sm: 'xs' }} fw={600} c={hasValue ? statusColor : 'dimmed'} mt={2} style={{ whiteSpace: 'nowrap' }}>
            {hasValue ? statusLabel : 'Sodio en sudor'}
          </Text>
        </Box>

        <Text fz="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
          Sudoración
        </Text>
      </Stack>
    </Paper>
  );
}
