'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronLeft, IconEdit, IconLogout, IconMenu2, IconCamera, IconDotsVertical } from '@tabler/icons-react';
import { FileButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { compressAvatar, initials } from '@/lib/avatar';
import { uploadPlayerAvatar } from '@/services/player';
import ImageCropModal from '@/components/modals/ImageCropModal';
import PlayerEditModal from '@/components/modals/PlayerEditModal';
import PlayerCredentialsButton from './PlayerCredentialsButton';
import PlayerPasswordButton from './PlayerPasswordButton';

export function BackButton({ size = 42, iconSize = 24, equipoId }) {
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
    <Box>
      <Text size="xs" c="orange.7" fw={600}>
        ⚠️ Sin credenciales
      </Text>
    </Box>
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

export function HeaderActions({ jugador, isAdmin, isPlayer, onEdit, compact = false }) {
  if (!isAdmin && !isPlayer) return null;

  if (compact) {
    return (
      <Menu shadow="md" width={230} position="bottom-end" withArrow radius="md" keepMounted>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" radius="xl" size={38}>
            <IconDotsVertical size={20} stroke={1.8} />
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

export function HeaderSemaforoIndicator({ semaforo, centered = false, compact = false }) {
  if (!semaforo?.hasPesajes) return null;

  const { status, label, pesoActual, pesoReferencia, diff } = semaforo;
  const isPositive = diff > 0;
  const formattedDiff = diff !== null ? (isPositive ? `+${diff.toFixed(2)} kg` : `${diff.toFixed(2)} kg`) : '0.00 kg';

  const statusConfigMap = {
    verde: {
      color: '#2e7d32',
      dotColor: '#2e7d32',
      title: 'Óptimo',
    },
    amarillo: {
      color: '#b45309',
      dotColor: '#f59f00',
      title: 'Precaución',
    },
    rojo: {
      color: '#c92a2a',
      dotColor: '#e03131',
      title: diff < 0 ? 'Pérdida' : 'Exceso',
    },
  };

  const cfg = statusConfigMap[status] || statusConfigMap.verde;

  if (compact) {
    return (
      <Tooltip
        withArrow
        radius="md"
        label={`${label} · ${pesoActual} kg (${formattedDiff})`}
      >
        <Group gap={4} align="center" wrap="nowrap" style={{ cursor: 'pointer' }}>
          <Box
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: cfg.dotColor,
              boxShadow: `0 0 4px ${cfg.dotColor}`,
              flexShrink: 0,
            }}
          />
          <Text fz="xs" fw={700} style={{ color: cfg.color }}>
            {formattedDiff}
          </Text>
        </Group>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      withArrow
      radius="md"
      multiline
      w={240}
      label={
        <Stack gap={4} p={4}>
          <Group justify="space-between" align="center">
            <Text size="xs" fw={700} c={cfg.color}>
              ● {label}
            </Text>
            <Text size="xs" fw={700} c={cfg.color} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {status}
            </Text>
          </Group>
          <Divider my={2} style={{ opacity: 0.2 }} />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Peso Actual:</Text>
            <Text size="xs" fw={700}>{pesoActual} kg</Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Peso Ref (Media):</Text>
            <Text size="xs" fw={700}>{pesoReferencia} kg</Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Variación:</Text>
            <Text size="xs" fw={700} c={cfg.color}>
              {formattedDiff}
            </Text>
          </Group>
          <Text size="10px" c="dimmed" mt={2} style={{ fontStyle: 'italic' }}>
            Margen verde (±0,75 kg) · Amarillo (±1,50 kg)
          </Text>
        </Stack>
      }
    >
      <Group gap={6} align="center" justify={centered ? 'center' : undefined} style={{ cursor: 'pointer', marginTop: 2 }}>
        <Box
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: cfg.dotColor,
            boxShadow: `0 0 6px ${cfg.dotColor}`,
            flexShrink: 0,
          }}
        />
        <Text fz="xs" fw={700} style={{ color: cfg.color }}>
          {pesoActual} kg ({formattedDiff})
        </Text>
        <Text fz="xs" c="dimmed">
          · {cfg.title} (Media: {pesoReferencia} kg)
        </Text>
      </Group>
    </Tooltip>
  );
}

export function PlayerAvatarUploader({ jugador, isAdmin, isPlayer, size = 84 }) {
  const [loading, setLoading] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(() => {
    if (jugador?.avatar_url) return jugador.avatar_url;
    if (jugador?.avatar_size) return `/api/players/avatar?id=${jugador.id}&t=${jugador.updated_at || ''}`;
    if (typeof jugador?.avatar === 'string' && jugador.avatar.startsWith('data:')) return jugador.avatar;
    return '';
  });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [tempFileName, setTempFileName] = useState('');

  const canEditPhoto = isAdmin || isPlayer;

  function handleFileSelected(file) {
    if (!file) return;
    setTempFileName(file.name || 'player-avatar.jpg');
    const objectUrl = URL.createObjectURL(file);
    setTempImageSrc(objectUrl);
    setCropModalOpen(true);
  }

  function handleCloseCropModal() {
    setCropModalOpen(false);
    if (tempImageSrc) {
      URL.revokeObjectURL(tempImageSrc);
      setTempImageSrc('');
    }
  }

  async function handleCropConfirmed(croppedFile) {
    setLoading(true);
    try {
      const compressed = await compressAvatar(croppedFile);
      await uploadPlayerAvatar(jugador.id, compressed);
      const localUrl = URL.createObjectURL(compressed);
      setAvatarSrc(localUrl);
      notifications.show({
        color: 'green',
        title: 'Foto actualizada',
        message: 'La foto de perfil se ha guardado correctamente.',
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al actualizar foto',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const initialsText = initials(`${jugador?.nombre || ''} ${jugador?.apellidos || ''}`);

  return (
    <Box style={{ position: 'relative', display: 'inline-block' }}>
      <Avatar
        src={avatarSrc || undefined}
        size={size}
        radius="xl"
        color="blue"
        style={{
          border: size > 50 ? '3px solid white' : '2px solid white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          backgroundColor: 'var(--mantine-color-blue-1)',
          color: 'var(--mantine-color-blue-8)',
          fontWeight: 700,
          fontSize: size > 80 ? '24px' : (size <= 50 ? '14px' : '16px'),
        }}
      >
        {initialsText}
      </Avatar>

      {canEditPhoto && (
        <FileButton onChange={handleFileSelected} accept="image/*">
          {(props) => (
            <Tooltip label="Cambiar foto de perfil" position="bottom" withArrow>
              <ActionIcon
                {...props}
                variant="filled"
                color="dark"
                radius="xl"
                size={size > 80 ? 28 : (size <= 50 ? 18 : 24)}
                loading={loading}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                <IconCamera size={size > 80 ? 14 : (size <= 50 ? 10 : 12)} stroke={2} />
              </ActionIcon>
            </Tooltip>
          )}
        </FileButton>
      )}

      <ImageCropModal
        opened={cropModalOpen}
        onClose={handleCloseCropModal}
        imageSrc={tempImageSrc}
        fileName={tempFileName}
        cropShape="round"
        title="Ajustar foto de jugador"
        onCropConfirmed={handleCropConfirmed}
      />
    </Box>
  );
}

export function PlayerIdentity({ jugador, isAdmin, isPlayer, hasCredentials, avatarSize = 84, titleSize = 26, centered = false }) {
  return (
    <>
      <PlayerAvatarUploader
        jugador={jugador}
        isAdmin={isAdmin}
        isPlayer={isPlayer}
        size={avatarSize}
      />

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
        <HeaderSemaforoIndicator semaforo={jugador.semaforo} centered={centered} />
        <CredentialsWarning show={!hasCredentials && isAdmin} />
      </Stack>
    </>
  );
}

export function JugadorHeaderCompactMobile({ jugador, user, onEdit }) {
  const isAdmin = user?.role === 'admin';
  const isPlayer = user?.role === 'jugador';

  return (
    <Group justify="space-between" align="center" wrap="nowrap" gap="xs" style={{ width: '100%' }}>
      <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        {!isPlayer && (
          <BackButton size={36} iconSize={20} equipoId={jugador?.equipo_id} />
        )}
        <PlayerAvatarUploader
          jugador={jugador}
          isAdmin={isAdmin}
          isPlayer={isPlayer}
          size={44}
        />
        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
          <Title order={3} fw={800} c="dark.4" truncate>
            {jugador?.nombre} {jugador?.apellidos}
          </Title>
          <Group gap={6} align="center" wrap="nowrap">
            <Text c="dimmed" size="sm" truncate fw={500}>
              {jugador?.posicion || 'Sin posición'}
            </Text>
            {jugador?.semaforo?.hasPesajes && (
              <>
                <Text c="dimmed" size="xs" style={{ opacity: 0.4 }}>•</Text>
                <HeaderSemaforoIndicator semaforo={jugador.semaforo} compact />
              </>
            )}
          </Group>
        </Stack>
      </Group>

      <Box style={{ flexShrink: 0 }}>
        <HeaderActions jugador={jugador} isAdmin={isAdmin} isPlayer={isPlayer} onEdit={onEdit} compact />
      </Box>
    </Group>
  );
}



function JugadorHeaderDesktop({ jugador, isAdmin, isPlayer, hasCredentials, onEdit }) {
  return (
    <Paper
      radius={24}
      p="lg"
      shadow="xs"
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
