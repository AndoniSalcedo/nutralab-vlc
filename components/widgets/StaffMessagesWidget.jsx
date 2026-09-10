'use client';

import { useRouter } from 'next/navigation';
import { Box, Paper, Stack, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';

export default function StaffMessagesWidget({
  jugadorId,
  messages = [],
}) {
  const router = useRouter();
  const count = Array.isArray(messages) ? messages.length : 0;
  const hasMessages = count > 0;

  return (
    <Paper
      id="widget-mensajes"
      shadow="xs"
      radius="lg"
      p={{ base: 'xs', sm: 'sm' }}
      bg={hasMessages ? 'pink.0' : 'white'}
      withBorder
      h="100%"
      onClick={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/mensajes`)}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: hasMessages ? 'var(--mantine-color-pink-2)' : undefined,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <Stack align="center" justify="center" gap={4} w="100%" ta="center">
        <Icon3D name="chat" size={44} style={{ marginBottom: 2 }} />

        <Box>
          <Text fz={{ base: 14, sm: 18 }} fw={700} c="dark.5" lh={1.1}>
            {hasMessages ? `${count} msgs` : '0 msgs'}
          </Text>
          <Text fz="xs" fw={600} c={hasMessages ? 'pink.7' : 'dimmed'} mt={2}>
            {hasMessages ? '● Por leer' : 'Al día'}
          </Text>
        </Box>

        <Text fz="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
          Mensajes
        </Text>
      </Stack>
    </Paper>
  );
}

