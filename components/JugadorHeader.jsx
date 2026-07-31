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
  Menu,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertTriangle, IconChevronLeft, IconEdit, IconLogout, IconMenu2 } from '@tabler/icons-react';
import PlayerEditModal from '@/components/modals/PlayerEditModal';
import PlayerCredentialsButton from './PlayerCredentialsButton';
import PlayerPasswordButton from './PlayerPasswordButton';

function BackButton({ size = 42, iconSize = 24, equipoId }) {
  const url = equipoId ? `/dashboard/equipo/${equipoId}` : '/dashboard';
  return (
    <Tooltip label="Volver al listado" position="right" withArrow>
      <Anchor href={url} style={{ textDecoration: 'none' }}>
        <ActionIcon variant="light" color="gray" size={size} radius="xl">
          <IconChevronLeft size={iconSize} />
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

function PlayerLogoutButton({ menuItem = false }) {
  if (menuItem) {
    return (
      <form method="post" action="/api/logout">
        <Menu.Item type="submit" color="red" leftSection={<IconLogout size={14} />}>
          Cerrar sesión
        </Menu.Item>
      </form>
    );
  }

  return (
    <form method="post" action="/api/logout">
      <Button
        type="submit"
        size="xs"
        radius="xl"
        variant="subtle"
        color="red"
        leftSection={<IconLogout size={14} />}
      >
        Cerrar sesión
      </Button>
    </form>
  );
}

function HeaderActions({ jugador, isAdmin, isPlayer, onEdit, compact = false }) {
  if (!isAdmin && !isPlayer) return null;

  if (compact) {
    return (
      <Menu shadow="md" width={230} position="bottom-end" withArrow radius="md" keepMounted>
        <Menu.Target>
          <ActionIcon variant="light" color="gray" radius="xl" size={48}>
            <IconMenu2 size={24} stroke={1.7} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          {isPlayer && (
            <>
              <PlayerPasswordButton menuItem />
              <Menu.Divider />
              <PlayerLogoutButton menuItem />
            </>
          )}
          {isAdmin && (
            <>
              <PlayerCredentialsButton jugador={jugador} menuItem />
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>
                Editar ficha
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Group gap="xs" wrap="wrap">
      {isPlayer && (
        <>
          <PlayerPasswordButton />
          <PlayerLogoutButton />
        </>
      )}
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
          {!isPlayer && <BackButton equipoId={jugador.equipo_id} />}
          <PlayerIdentity jugador={jugador} isAdmin={isAdmin} hasCredentials={hasCredentials} />
        </Group>

        <HeaderActions jugador={jugador} isAdmin={isAdmin} isPlayer={isPlayer} onEdit={onEdit} />
      </Group>
    </Paper>
  );
}

function JugadorHeaderMobile({ jugador, isAdmin, isPlayer, hasCredentials, onEdit, embedded = false }) {
  const content = (
    <>
      {!isPlayer && (
        <Box style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
          <BackButton size={50} iconSize={28} equipoId={jugador.equipo_id} />
        </Box>
      )}

      <Box style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
        <HeaderActions jugador={jugador} isAdmin={isAdmin} isPlayer={isPlayer} onEdit={onEdit} compact />
      </Box>

      <Stack gap="xs" align="center">
        <PlayerIdentity
          jugador={jugador}
          isAdmin={isAdmin}
          hasCredentials={hasCredentials}
          avatarSize={96}
          titleSize={24}
          centered
        />
      </Stack>
    </>
  );

  if (embedded) {
    return <Box style={{ position: 'relative' }}>{content}</Box>;
  }

  return (
    <Paper
      radius={0}
      p="sm"
      withBorder
      shadow="xs"
      bg="white"
      mb="xs"
      style={{ position: 'relative' }}
    >
      {content}
    </Paper>
  );
}

export default function JugadorHeader({ jugador, user, forceMobile = false, embedded = false }) {
  const [opened, setOpened] = useState(false);
  const matchesMobileViewport = useMediaQuery('(max-width: 48em)');
  const isMobile = forceMobile || matchesMobileViewport;
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
          embedded={embedded}
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

      <PlayerEditModal
        opened={opened}
        onClose={() => setOpened(false)}
        player={jugador}
        title="Editar Ficha de Jugador"
      />
    </>
  );
}
