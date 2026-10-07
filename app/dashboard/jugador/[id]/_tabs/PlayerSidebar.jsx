'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ActionIcon,
  Avatar,
  Box,
  Divider,
  FileButton,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconChevronRight,
  IconClipboardList,
  IconChartBar,
  IconSalad,
  IconLogout,
} from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';
import { compressAvatar, initials } from '@/lib/utils/avatar';
import { uploadPlayerAvatar } from '@/actions/playerActions';
import { logout } from '@/actions/authActions';
import ImageCropModal from '@/components/modals/ImageCropModal';
import PlayerEditModal from '@/components/modals/PlayerEditModal';
import PlayerCredentialsButton from '@/components/PlayerCredentialsButton';
import PlayerPasswordButton from '@/components/PlayerPasswordButton';

const DEFAULT_SUBTABS = {
  resumen: 'perfil',
  metricas: 'mediciones',
  nutricion: 'plan',
};

const TABS = [
  {
    value: 'resumen',
    label: 'Resumen',
    icon: IconClipboardList,
  },
  {
    value: 'metricas',
    label: 'Métricas',
    icon: IconChartBar,
  },
  {
    value: 'nutricion',
    label: 'Nutrición',
    icon: IconSalad,
  },
];

export default function PlayerSidebar({
  jugador,
  user,
  activeTab = 'resumen',
  onTabChange,
  readOnly = false,
  isPlayer = false,
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [tempFileName, setTempFileName] = useState('');

  const isAdmin = user?.role === 'admin';
  const hasCredentials = Boolean(jugador?.auth_user_id);
  const canEditPhoto = (isAdmin || isPlayer) && !readOnly;
  const teamName = jugador?.equipos?.nombre || jugador?.club;
  const backUrl = jugador?.equipo_id ? `/dashboard/equipo/${jugador.equipo_id}` : '/dashboard';

  const [avatarSrc, setAvatarSrc] = useState(() => {
    if (jugador?.avatar_url) return jugador.avatar_url;
    if (jugador?.avatar_size) return `/api/media/player-avatar?id=${jugador.id}&t=${jugador.updated_at || ''}`;
    if (typeof jugador?.avatar === 'string' && jugador.avatar.startsWith('data:')) return jugador.avatar;
    return '';
  });

  useEffect(() => {
    if (jugador?.avatar_url) {
      setAvatarSrc(jugador.avatar_url);
    } else if (jugador?.avatar_size) {
      setAvatarSrc(`/api/media/player-avatar?id=${jugador.id}&t=${jugador.updated_at || ''}`);
    } else if (typeof jugador?.avatar === 'string' && jugador.avatar.startsWith('data:')) {
      setAvatarSrc(jugador.avatar);
    }
  }, [jugador?.id, jugador?.avatar_size, jugador?.avatar_url, jugador?.updated_at, jugador?.avatar]);

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
    setUploadLoading(true);
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
      setUploadLoading(false);
    }
  }

  const handleLogout = async () => {
    try { navigator.serviceWorker?.controller?.postMessage('CLEAR_CACHES'); } catch {}
    await logout();
  };

  return (
    <>
      <Paper
        className="nutra-sidebar"
        radius={24}
        p="md"
        style={{
          width: '100%',
        }}
      >
        {/* Cabecera superior con botón volver y acciones */}
        <Group justify="space-between" align="center" mb="xs" wrap="nowrap">
          {!isPlayer ? (
            <Tooltip label={teamName ? `Volver a ${teamName}` : 'Volver al equipo'} position="right" withArrow>
              <ActionIcon
                component={Link}
                href={backUrl}
                variant="subtle"
                color="gray"
                size={36}
                radius="xl"
                style={{ textDecoration: 'none', color: 'var(--nutra-hueso)' }}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Box style={{ width: 36, height: 36 }} />
          )}

          <Group gap={6} align="center" wrap="nowrap">
            {isAdmin && (
              <>
                <PlayerCredentialsButton jugador={jugador} />
                <Tooltip label="Editar ficha" position="bottom" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size={36}
                    radius="xl"
                    style={{ color: 'var(--nutra-hueso)' }}
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Icon3D name="configuracion" size={20} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}

            {isPlayer && (
              <>
                <PlayerPasswordButton />
                <Tooltip label="Cerrar sesión" position="bottom" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="arcilla"
                    size={36}
                    radius="xl"
                    onClick={handleLogout}
                  >
                    <IconLogout size={18} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Group>
        </Group>

        {/* Ficha e identidad del jugador: Foto ampliada y equipo */}
        <Stack align="center" gap={4} my="sm">
          <Box style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={avatarSrc || undefined}
              size={100}
              radius="xl"
              color="bosque"
              style={{
                width: 100,
                height: 100,
                minWidth: 100,
                minHeight: 100,
                border: '3px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--nutra-hueso)',
                fontWeight: 700,
                fontSize: '28px',
              }}
            >
              {initials(`${jugador?.nombre || ''} ${jugador?.apellidos || ''}`)}
            </Avatar>

            {canEditPhoto && (
              <FileButton onChange={handleFileSelected} accept="image/*">
                {(props) => (
                  <Tooltip label="Cambiar foto de perfil" position="bottom" withArrow>
                    <UnstyledButton
                      {...props}
                      disabled={uploadLoading}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        cursor: uploadLoading ? 'not-allowed' : 'pointer',
                        opacity: uploadLoading ? 0.6 : 1,
                        zIndex: 4,
                        lineHeight: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 150ms ease, opacity 150ms ease',
                      }}
                    >
                      <Icon3D name="camera" size={28} />
                    </UnstyledButton>
                  </Tooltip>
                )}
              </FileButton>
            )}
          </Box>

          <Title order={3} fw={700} c="var(--nutra-hueso)" fz={18} ta="center" lh={1.2} mt="xs" lineClamp={2}>
            {jugador?.nombre} {jugador?.apellidos}
          </Title>

          <Text size="xs" fw={500} c="var(--nutra-salvia-light)" ta="center">
            {jugador?.posicion || 'Sin posición'}
          </Text>

          {teamName && (
            <Box
              component={jugador?.equipo_id ? Link : 'div'}
              href={jugador?.equipo_id ? `/dashboard/equipo/${jugador.equipo_id}` : undefined}
              mt={6}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                textDecoration: 'none',
                transition: 'all 150ms ease',
                cursor: jugador?.equipo_id ? 'pointer' : 'default',
                maxWidth: '100%',
              }}
            >
              {jugador?.equipo_id && (
                <Avatar
                  src={`/api/media/team-avatar?id=${jugador.equipo_id}`}
                  size={18}
                  radius="xl"
                  imageProps={{ style: { objectFit: 'contain' } }}
                >
                  {initials(teamName)}
                </Avatar>
              )}
              <Text size="xs" fw={600} c="var(--nutra-hueso)" truncate="end" maw={180}>
                {teamName}
              </Text>
            </Box>
          )}

          {!hasCredentials && isAdmin && (
            <Group gap={6} align="center" mt={4}>
              <Icon3D name="warning" size={14} />
              <Text size="xs" c="var(--nutra-arcilla)" fw={600}>
                Sin credenciales
              </Text>
            </Group>
          )}
        </Stack>

        <Divider my="md" color="rgba(255, 255, 255, 0.1)" />

        {/* Tabs de navegación estilo Apple Settings */}
        <Box>
          <Text size="11px" fw={700} c="var(--nutra-salvia-light)" tt="uppercase" lts={0.8} px={6} mb={8}>
            Secciones
          </Text>

          <Stack gap={4}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              const href = `/dashboard/jugador/${jugador?.id}/${tab.value}/${DEFAULT_SUBTABS[tab.value]}`;

              return (
                <UnstyledButton
                  key={tab.value}
                  id={`tab-nav-${tab.value}`}
                  component={Link}
                  href={href}
                  onClick={() => onTabChange && onTabChange(tab.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? 'var(--nutra-sidebar-active-bg)' : 'transparent',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(193, 240, 128, 0.28)' : 'none',
                    transition: 'all 140ms ease',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Group gap={12} align="center" wrap="nowrap">
                    <Box
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isActive ? 'var(--nutra-lima, #C1F080)' : 'rgba(255, 255, 255, 0.08)',
                        boxShadow: isActive ? '0 2px 8px var(--nutra-lima-glow)' : 'none',
                        border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                        flexShrink: 0,
                      }}
                    >
                      <tab.icon size={16} color={isActive ? '#1F2A24' : '#d7e2da'} stroke={2.2} />
                    </Box>
                    <Text
                      size="sm"
                      fw={isActive ? 700 : 500}
                      c={isActive ? 'var(--nutra-lima)' : '#d7e2da'}
                    >
                      {tab.label}
                    </Text>
                  </Group>

                  <IconChevronRight
                    size={14}
                    stroke={2}
                    style={{
                      color: isActive ? 'var(--nutra-lima)' : 'rgba(255, 255, 255, 0.35)',
                      transform: isActive ? 'translateX(2px)' : 'none',
                      transition: 'transform 140ms ease',
                    }}
                  />
                </UnstyledButton>
              );
            })}
          </Stack>
        </Box>
      </Paper>

      <PlayerEditModal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        player={jugador}
        title="Editar Ficha de Jugador"
      />

      <ImageCropModal
        opened={cropModalOpen}
        onClose={handleCloseCropModal}
        imageSrc={tempImageSrc}
        fileName={tempFileName}
        cropShape="round"
        title="Ajustar foto de jugador"
        onCropConfirmed={handleCropConfirmed}
      />
    </>
  );
}
