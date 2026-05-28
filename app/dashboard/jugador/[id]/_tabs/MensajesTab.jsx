'use client';

import { useMemo } from 'react';
import { Badge, Box, Button, Group, Modal, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconInbox, IconMail, IconPlus } from '@tabler/icons-react';
import MessageComposer from '@/components/MessageComposer';
import NothingFound from '@/components/NothingFound/NothingFound';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function MensajesTab({ jugador, messages = [], readOnly = false }) {
  const [opened, { open, close }] = useDisclosure(false);
  const playerOption = useMemo(() => [jugador], [jugador]);

  return (
    <Stack gap={0}>
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        radius="lg"
        withBorder
        bg="white"
        shadow="xs"
        style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
              <IconMail size={20} />
            </ThemeIcon>
            <Box>
              <Title order={3} fw={800} c="dark.4">Mensajes</Title>
              <Text size="sm" c="dimmed">
                Comunicaciones del nutricionista para el jugador.
              </Text>
            </Box>
          </Group>

          {!readOnly && (
            <Button
              radius="xl"
              size="xs"
              color="blue"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={open}
            >
              Nuevo mensaje
            </Button>
          )}
        </Group>
      </Paper>

      <Modal opened={opened && !readOnly} onClose={close} title="Nuevo mensaje" size="lg">
        <MessageComposer
          players={playerOption}
          defaultRecipientIds={[jugador.id]}
          forceRecipients
          team={{ id: jugador.equipo_id }}
          onSent={close}
        />
      </Modal>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        {messages.length > 0 ? (
          <Stack gap="sm">
            {messages.map((message) => (
              <Paper key={message.id} p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder bg="white" shadow="xs">
                <Group justify="space-between" align="flex-start" gap="sm" mb="xs">
                  <Box style={{ minWidth: 0 }}>
                    <Group gap="xs" wrap="nowrap">
                      <Title order={4} size="h5" fw={800} c="dark.4" style={{ overflowWrap: 'anywhere' }}>
                        {message.titulo}
                      </Title>
                      {!message.jugador_id && (
                        <Badge color="teal" variant="light" radius="sm">
                          Equipo
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {formatDate(message.created_at)}
                      {message.created_by_name ? ` · ${message.created_by_name}` : ''}
                    </Text>
                  </Box>
                </Group>
                <Text size="sm" c="dark.4" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {message.contenido}
                </Text>
              </Paper>
            ))}
          </Stack>
        ) : (
          <NothingFound
            icon={IconInbox}
            title="Sin mensajes"
            description="Cuando el nutricionista envíe comunicaciones aparecerán aquí."
          />
        )}
      </Box>
    </Stack>
  );
}
