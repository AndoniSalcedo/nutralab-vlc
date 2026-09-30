'use client';

import { useRouter } from 'next/navigation';
import { Box, Text } from '@mantine/core';
import WidgetCard, { WidgetAside } from './WidgetCard';

export default function StaffMessagesWidget({
  jugadorId,
  messages = [],
}) {
  const router = useRouter();
  const count = Array.isArray(messages) ? messages.length : 0;
  const hasMessages = count > 0;

  return (
    <WidgetCard
      id="widget-mensajes"
      icon="chat"
      title="Mensajes"
      onClick={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/mensajes`)}
    >
      <Text fz={24} fw={800} c="dark.6" lh={1.1} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {count}
        <Text span fz="xs" fw={600} c="dimmed"> {count === 1 ? 'mensaje' : 'mensajes'}</Text>
      </Text>
      <Box mt={6} w="fit-content">
        {hasMessages ? <WidgetAside color="pink" dot>Por leer</WidgetAside> : <WidgetAside color="teal">Al día</WidgetAside>}
      </Box>
    </WidgetCard>
  );
}
