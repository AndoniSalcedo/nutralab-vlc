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
      color="salvia"
      icon="chat"
      title="Mensajes"
      onClick={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/mensajes`)}
    >
      <Text fz={24} fw={800} c="var(--nutra-bosque, #1F2A24)" lh={1.1} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {count}
        <Text span fz="xs" fw={600} style={{ color: 'var(--nutra-salvia, #6C705A)' }}> {count === 1 ? 'mensaje' : 'mensajes'}</Text>
      </Text>
      <Box mt={6} w="fit-content">
        {hasMessages ? <WidgetAside color="arcilla" dot>Por leer</WidgetAside> : <WidgetAside color="lima">Al día</WidgetAside>}
      </Box>
    </WidgetCard>
  );
}
