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
    gradient: 'linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)',
  },
  {
    value: 'evolucion',
    label: 'Evolución',
    href: (id) => `/dashboard/equipo/${id}/evolucion`,
    icon3d: 'evolucion',
    gradient: 'linear-gradient(135deg, #AF52DE 0%, #8E44AD 100%)',
  },
  {
    value: 'analiticas',
    label: 'Analíticas',
    href: (id) => `/dashboard/equipo/${id}/analiticas`,
    icon3d: 'microscope',
    gradient: 'linear-gradient(135deg, #FF9500 0%, #E67E22 100%)',
  },
  {
    value: 'intrapartido',
    label: 'Intrapartido',
    href: (id) => `/dashboard/equipo/${id}/intrapartido`,
    icon3d: 'stadium',
    gradient: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
  },
  {
    value: 'suplementacion',
    label: 'Suplementación',
    href: (id) => `/dashboard/equipo/${id}/suplementacion`,
    icon3d: 'suplementacion',
    gradient: 'linear-gradient(135deg, #5856D6 0%, #4B0082 100%)',
  },
  {
    value: 'menu',
    label: 'Menú semanal',
    href: (id) => `/dashboard/equipo/${id}/menu`,
    icon3d: 'bento_box',
    gradient: 'linear-gradient(135deg, #FF2D55 0%, #E0245E 100%)',
  },
  {
    value: 'configuracion',
    label: 'Configuración',
    href: (id) => `/dashboard/equipo/${id}/configuracion`,
    icon3d: 'configuracion',
    gradient: 'linear-gradient(135deg, #8E8E93 0%, #636366 100%)',
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
        radius={24}
        p="md"
        bg="white"
        style={{
          boxShadow: '0 0 2px 0 rgba(0,0,0,0.1)',
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
              style={{ textDecoration: 'none' }}
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
                style={{ textDecoration: 'none' }}
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
              color="nutralabColor"
              style={{
                width: 112,
                height: 112,
                minWidth: 112,
                minHeight: 112,
                border: '4px solid white',
                boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
                backgroundColor: '#ffffff',
                color: 'var(--mantine-color-nutralabColor-9)',
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

          <Title order={3} fw={700} c="dark.6" fz={18} ta="center" lh={1.2} mt="xs" lineClamp={2}>
            {team?.nombre || 'Equipo'}
          </Title>

          <Text size="xs" fw={500} c="dimmed" ta="center">
            {team?.temporada
              ? (team.temporada.toLowerCase().includes('temporada')
                ? team.temporada
                : `Temporada ${team.temporada}`)
              : 'Temporada actual'}
          </Text>

          {team?.descripcion && (
            <Text size="xs" c="dimmed" ta="center" lineClamp={2} mt={2} px="xs">
              {team.descripcion}
            </Text>
          )}
        </Stack>

        <Divider my="md" color="gray.2" />

        {/* Tabs de navegación estilo Apple Settings */}
        <Box>
          <Text size="11px" fw={700} c="dimmed" tt="uppercase" lts={0.8} px={6} mb={8}>
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
                    backgroundColor: isActive ? 'var(--mantine-color-gray-1)' : 'transparent',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(0, 0, 0, 0.05)' : 'none',
                    transition: 'all 140ms ease',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
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
                        background: tab.gradient,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon3D name={tab.icon3d} size={18} />
                    </Box>
                    <Text
                      size="sm"
                      fw={isActive ? 650 : 500}
                      c={isActive ? 'dark.9' : 'dark.6'}
                    >
                      {tab.label}
                    </Text>
                  </Group>

                  <IconChevronRight
                    size={14}
                    stroke={2}
                    style={{
                      color: isActive ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-4)',
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
