'use client';

import { useMemo } from 'react';
import { Box, Button, Group, Paper, Stack, Text, Collapse, ActionIcon } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconInbox, IconPlus, IconChevronDown } from '@/components/icons3d';
import SendMessageModal from '@/components/modals/SendMessageModal';
import SubtabHeader from '../SubtabHeader';
import classes from '../SubtabSectionHeader.module.css';
import NothingFound from '@/components/NothingFound';
import WidgetCard, { WidgetAside } from '@/components/widgets/WidgetCard';

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

export default function MensajesSubtab({ jugador, messages = [], readOnly = false }) {
  const isMobile = useMediaQuery('(max-width: 48em)', true);
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(false);
  const [opened, { open, close }] = useDisclosure(false);
  const playerOption = useMemo(() => [jugador], [jugador]);

  return (
    <Stack gap={0}>
      <Paper
        className={classes.mobileSticky}
        p={{ base: 'sm', sm: 'md' }}
        radius="lg"
        withBorder
        bg="white"
        shadow="xs"
        style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
            <Group gap="xs" style={{ flex: 1 }}>
              <SubtabHeader tab="resumen" subtab="mensajes" />
            </Group>

            {!readOnly && !isMobile && (
              <Button
                radius="xl"
                size="xs"
                color="blue"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={open}
              >
                Nuevo
              </Button>
            )}

            {isMobile && (
              <ActionIcon variant="light" color="gray" onClick={toggleExpanded} size="lg" radius="md" aria-label={expanded ? 'Ocultar opciones' : 'Mostrar opciones'}>
                <IconChevronDown size={20} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '200ms' }} />
              </ActionIcon>
            )}
          </Group>

          <Collapse expanded={!isMobile || expanded} transitionDuration={isMobile ? 200 : 0}>
            {!readOnly && isMobile && (
              <Button
                radius="xl"
                size="xs"
                color="blue"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={open}
                fullWidth
              >
                Nuevo
              </Button>
            )}
          </Collapse>
        </Stack>
      </Paper>

      <SendMessageModal
        opened={opened && !readOnly}
        onClose={close}
        players={playerOption}
        defaultRecipientIds={[jugador.id]}
        forceRecipients
        team={{ id: jugador.equipo_id }}
        onSent={close}
      />

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        {messages.length > 0 ? (
          <Stack gap="sm">
            {messages.map((message) => (
              <WidgetCard
                key={message.id}
                icon="chat"
                title={message.titulo}
                color="indigo"
                aside={
                  <WidgetAside color={message.jugador_id ? 'gray' : 'teal'}>
                    {message.jugador_id ? formatDate(message.created_at) : `Equipo · ${formatDate(message.created_at)}`}
                  </WidgetAside>
                }
                footer={message.created_by_name ? `De ${message.created_by_name}` : undefined}
                style={{ height: 'auto' }}
              >
                <Text size="sm" c="dark.4" lh={1.5} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {message.contenido}
                </Text>
              </WidgetCard>
            ))}
          </Stack>
        ) : (
          <NothingFound
            icon={IconInbox}
            title="Sin mensajes"
            icon3d="speech"
            description="Cuando el nutricionista envíe comunicaciones aparecerán aquí."
          />
        )}
      </Box>
    </Stack>
  );
}
