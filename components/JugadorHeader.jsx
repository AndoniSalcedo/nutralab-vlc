'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Box,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertTriangle, IconChevronLeft, IconEdit } from '@tabler/icons-react';
import PlayerForm from './PlayerForm';
import PlayerCredentialsButton from './PlayerCredentialsButton';
import PlayerPasswordButton from './PlayerPasswordButton';

function BackButton() {
  return (
    <Tooltip label="Volver al listado" position="right" withArrow>
      <Anchor href="/dashboard" style={{ textDecoration: 'none' }}>
        <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
          <IconChevronLeft size={24} />
        </ActionIcon>
      </Anchor>
    </Tooltip>
  );
}

function CredentialsWarning({ show }) {
  if (!show) return null;

  return (
    <Badge variant="light" color="yellow" size="sm" radius="sm" leftSection={<IconAlertTriangle size={12} />}>
      Sin credenciales
    </Badge>
  );
}

function HeaderActions({ jugador, isAdmin, isPlayer, onEdit, fullWidth = false }) {
  if (!isAdmin && !isPlayer) return null;

  return (
    <Group gap="xs" justify={fullWidth ? 'center' : undefined} wrap="wrap" w={fullWidth ? '100%' : undefined}>
      {isPlayer && <PlayerPasswordButton />}
      {isAdmin && (
        <>
          <PlayerCredentialsButton jugador={jugador} />
          <Button
            variant="default"
            radius="xl"
            size="xs"
            leftSection={<IconEdit size={16} />}
            onClick={onEdit}
          >
            Editar Ficha
          </Button>
        </>
      )}
    </Group>
  );
}

function PlayerIdentity({ jugador, isAdmin, hasCredentials, avatarSize = 84, titleSize = 26, centered = false }) {
  return (
    <>
      <Avatar size={avatarSize} radius="xl" color="blue">
        {jugador.nombre?.[0]}{jugador.apellidos?.[0]}
      </Avatar>

      <Stack gap={4} align={centered ? 'center' : undefined} style={{ minWidth: 0 }}>
        <Title order={2} c="dark.4" lh={1.1} fz={titleSize} lineClamp={2}>
          {jugador.nombre} {jugador.apellidos}
        </Title>

        <Group gap="xs" align="center" justify={centered ? 'center' : undefined}>
          <Text c="dimmed" size="sm" truncate>
            {jugador.posicion || 'Sin posición'}
          </Text>
          {jugador.club && (
            <>
              <Text c="dimmed" size="xs">•</Text>
              <Text c="dimmed" size="sm" truncate>{jugador.club}</Text>
            </>
          )}
        </Group>
        <CredentialsWarning show={!hasCredentials && isAdmin} />
      </Stack>
    </>
  );
}

function JugadorHeaderDesktop({ jugador, isAdmin, isPlayer, hasCredentials, onEdit }) {
  return (
    <Paper
      radius="lg"
      p="lg"
      withBorder
      shadow="sm"
      bg="white"
      mb="md"
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="md">
          {isAdmin && <BackButton />}
          <PlayerIdentity jugador={jugador} isAdmin={isAdmin} hasCredentials={hasCredentials} />
        </Group>

        <HeaderActions jugador={jugador} isAdmin={isAdmin} isPlayer={isPlayer} onEdit={onEdit} />
      </Group>
    </Paper>
  );
}

function JugadorHeaderMobile({ jugador, isAdmin, isPlayer, hasCredentials, onEdit }) {
  return (
    <Paper
      radius={0}
      p="sm"
      withBorder
      shadow="xs"
      bg="white"
      mb="xs"
    >
      <Stack gap="sm" align="center">
        {isAdmin && (
          <Box w="100%">
            <BackButton />
          </Box>
        )}

        <PlayerIdentity
          jugador={jugador}
          isAdmin={isAdmin}
          hasCredentials={hasCredentials}
          avatarSize={96}
          titleSize={24}
          centered
        />

        <HeaderActions jugador={jugador} isAdmin={isAdmin} isPlayer={isPlayer} onEdit={onEdit} fullWidth />
      </Stack>
    </Paper>
  );
}

export default function JugadorHeader({ jugador, user }) {
  const [opened, setOpened] = useState(false);
  const isMobile = useMediaQuery('(max-width: 48em)');
  const isAdmin = user?.role === 'admin';
  const isPlayer = user?.role === 'jugador';
  const hasCredentials = Boolean(jugador.auth_user_id);

  return (
    <>
      {isMobile ? (
        <JugadorHeaderMobile
          jugador={jugador}
          isAdmin={isAdmin}
          isPlayer={isPlayer}
          hasCredentials={hasCredentials}
          onEdit={() => setOpened(true)}
        />
      ) : (
        <JugadorHeaderDesktop
          jugador={jugador}
          isAdmin={isAdmin}
          isPlayer={isPlayer}
          hasCredentials={hasCredentials}
          onEdit={() => setOpened(true)}
        />
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title="Editar Ficha de Jugador" size="xl">
        <PlayerForm initial={jugador} />
      </Modal>
    </>
  );
}
