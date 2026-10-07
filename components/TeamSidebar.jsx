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
} from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';
import { compressAvatar, initials } from '@/lib/utils/avatar';
import { uploadTeamPhoto } from '@/actions/teamActions';
import ImageCropModal from '@/components/modals/ImageCropModal';

export const TEAM_TABS = [
  {
    value: 'plantilla',
    label: 'Plantilla',
    href: (id) => `/dashboard/equipo/${id}`,
    icon3d: 'plantilla',
  },
  {
    value: 'evolucion',
    label: 'Evolución',
    href: (id) => `/dashboard/equipo/${id}/evolucion`,
    icon3d: 'evolucion',
  },
  {
    value: 'analiticas',
    label: 'Analíticas',
    href: (id) => `/dashboard/equipo/${id}/analiticas`,
    icon3d: 'microscope',
  },
  {
    value: 'intrapartido',
    label: 'Intrapartido',
    href: (id) => `/dashboard/equipo/${id}/intrapartido`,
    icon3d: 'stadium',
  },
  {
    value: 'suplementacion',
    label: 'Suplementación',
    href: (id) => `/dashboard/equipo/${id}/suplementacion`,
    icon3d: 'suplementacion',
  },
  {
    value: 'menu',
    label: 'Menú semanal',
    href: (id) => `/dashboard/equipo/${id}/menu`,
    icon3d: 'bento_box',
  },
  {
    value: 'configuracion',
    label: 'Configuración',
    href: (id) => `/dashboard/equipo/${id}/configuracion`,
    icon3d: 'configuracion',
  },
];

export default function TeamSidebar({
  team,
  user,
  activeTab = 'plantilla',
  onTabChange,
  readOnly = false,
}) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [tempFileName, setTempFileName] = useState('');

  const canEditPhoto = !readOnly && user?.role !== 'tecnico';
  const teamId = team?.id;

  const [avatarSrc, setAvatarSrc] = useState(() => {
    if (team?.id) {
      return `/api/media/team-avatar?id=${team.id}&t=${team.updated_at || ''}`;
    }
    return '';
  });

  useEffect(() => {
    if (team?.id) {
      setAvatarSrc(`/api/media/team-avatar?id=${team.id}&t=${team.updated_at || ''}`);
    }
  }, [team?.id, team?.updated_at, team?.foto_size]);

  function handleFileSelected(file) {
    if (!file) return;
    setTempFileName(file.name || 'team-avatar.jpg');
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
    if (!teamId) return;
    setUploadLoading(true);
    try {
      const compressed = await compressAvatar(croppedFile);
      await uploadTeamPhoto(teamId, compressed);
      const localUrl = URL.createObjectURL(compressed);
      setAvatarSrc(localUrl);
      notifications.show({
        color: 'green',
        title: 'Escudo actualizado',
        message: 'La imagen del equipo se ha guardado correctamente.',
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al actualizar imagen',
        message: err.message,
      });
    } finally {
      setUploadLoading(false);
    }
  }

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
        {/* Cabecera superior con botón volver y acceso a configuración */}
        <Group justify="space-between" align="center" mb="xs" wrap="nowrap">
          <Tooltip label="Volver a equipos" position="right" withArrow>
            <ActionIcon
              component={Link}
              href="/dashboard"
              variant="subtle"
              color="gray"
              size={36}
              radius="xl"
              style={{ textDecoration: 'none', color: 'var(--nutra-hueso)' }}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
          </Tooltip>

          {!readOnly && teamId && (
            <Tooltip label="Configuración de equipo" position="bottom" withArrow>
              <ActionIcon
                component={Link}
                href={`/dashboard/equipo/${teamId}/configuracion`}
                variant="subtle"
                color="gray"
                size={36}
                radius="xl"
                style={{ textDecoration: 'none', color: 'var(--nutra-hueso)' }}
              >
                <Icon3D name="configuracion" size={20} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* Identidad del equipo: Escudo ampliado, nombre y temporada */}
        <Stack align="center" gap={4} my="sm">
          <Box style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={avatarSrc || undefined}
              size={112}
              radius="xl"
              color="bosque"
              style={{
                width: 112,
                height: 112,
                minWidth: 112,
                minHeight: 112,
                border: '4px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
                backgroundColor: '#ffffff',
                color: 'var(--nutra-bosque)',
                fontWeight: 700,
                fontSize: '32px',
              }}
              imageProps={{
                style: {
                  objectFit: 'contain',
                  backgroundColor: '#ffffff',
                  padding: '6px',
                },
              }}
            >
              {initials(team?.nombre || 'Equipo')}
            </Avatar>

            {canEditPhoto && (
              <FileButton onChange={handleFileSelected} accept="image/*">
                {(props) => (
                  <Tooltip label="Cambiar escudo o imagen" position="bottom" withArrow>
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
            {team?.nombre || 'Equipo'}
          </Title>

          <Text size="xs" fw={500} c="var(--nutra-salvia-light)" ta="center">
            {team?.temporada
              ? (team.temporada.toLowerCase().includes('temporada')
                ? team.temporada
                : `Temporada ${team.temporada}`)
              : 'Temporada actual'}
          </Text>

          {team?.descripcion && (
            <Text size="xs" c="var(--nutra-salvia-light)" ta="center" lineClamp={2} mt={2} px="xs" style={{ opacity: 0.85 }}>
              {team.descripcion}
            </Text>
          )}
        </Stack>

        <Divider my="md" color="rgba(255, 255, 255, 0.1)" />

        {/* Tabs de navegación estilo Apple Settings */}
        <Box>
          <Text size="11px" fw={700} c="var(--nutra-salvia-light)" tt="uppercase" lts={0.8} px={6} mb={8}>
            Secciones
          </Text>

          <Stack gap={4}>
            {TEAM_TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              const href = teamId ? tab.href(teamId) : '#';

              return (
                <UnstyledButton
                  key={tab.value}
                  id={`team-tab-nav-${tab.value}`}
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
                      <Icon3D name={tab.icon3d} size={18} />
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

      <ImageCropModal
        opened={cropModalOpen}
        onClose={handleCloseCropModal}
        imageSrc={tempImageSrc}
        fileName={tempFileName}
        cropShape="round"
        title="Ajustar escudo o imagen del equipo"
        onCropConfirmed={handleCropConfirmed}
      />
    </>
  );
}
