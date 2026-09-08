'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Box,
  FileButton,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowLeft,
} from '@/components/icons3d';

import { initials } from '@/lib/utils/avatar';
import { useTeamHeaderSlot } from '@/components/TeamHeaderContext';
import Icon3D from '@/components/Icon3D';

const TABS = [
  { value: 'plantilla', label: 'Plantilla', href: (id) => `/dashboard/equipo/${id}`, icon3d: 'plantilla' },
  { value: 'evolucion', label: 'Evolución', href: (id) => `/dashboard/equipo/${id}/evolucion`, icon3d: 'evolucion' },
  { value: 'analiticas', label: 'Analíticas', href: (id) => `/dashboard/equipo/${id}/analiticas`, icon3d: 'stethoscope' },
  { value: 'suplementacion', label: 'Suplementación', href: (id) => `/dashboard/equipo/${id}/suplementacion`, icon3d: 'suplementacion' },
  { value: 'menu', label: 'Menú semanal', href: (id) => `/dashboard/equipo/${id}/menu`, icon3d: 'fork_and_knife' },
  { value: 'configuracion', label: 'Configuración', href: (id) => `/dashboard/equipo/${id}/configuracion`, icon3d: 'configuracion' },
];

const MOBILE_LABELS = {
  plantilla: 'Plantilla',
  evolucion: 'Evolución',
  analiticas: 'Analíticas',
  suplementacion: 'Suplem.',
  menu: 'Menú',
  configuracion: 'Ajustes',
};

export default function TeamHeaderTabs({
  team,
  activeTab,
  totalPlayers: _totalPlayers,
  subtitle: _subtitle,
  avatarSlot,
  rightSection,
  teamPhotoVersion,
  onSelectTeamPhoto,
  readOnly = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const slotContext = useTeamHeaderSlot();
  const teamId = team?.id;

  const currentTab = useMemo(() => {
    if (!pathname) return 'plantilla';
    if (pathname.includes('/evolucion')) return 'evolucion';
    if (pathname.includes('/analiticas')) return 'analiticas';
    if (pathname.includes('/suplementacion')) return 'suplementacion';
    if (pathname.includes('/menu')) return 'menu';
    if (pathname.includes('/configuracion')) return 'configuracion';
    return 'plantilla';
  }, [pathname]);

  const tabValue = activeTab || currentTab;

  // Prefetch tabs for instant navigation between sections
  useEffect(() => {
    if (!teamId) return;
    TABS.forEach((tab) => {
      router.prefetch(tab.href(teamId));
    });
  }, [teamId, router]);

  const handleTabChange = (val) => {
    if (!val || val === tabValue || !teamId) return;
    const target = TABS.find((t) => t.value === val);
    if (target) {
      router.push(target.href(teamId));
    }
  };

  return (
    <>
      <Paper
        radius={24}
        p={{ base: 'xs', sm: 'lg' }}
        shadow="xs"
        bg="white"
        mb="md"
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap={{ base: 'xs', sm: 'md' }} style={{ width: '100%' }}>
          <Group gap={{ base: 'xs', sm: 'md' }} align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Tooltip label="Volver a equipos" position="right" withArrow>
              <Anchor component={Link} href="/dashboard" style={{ textDecoration: 'none', flexShrink: 0 }}>
                {/* En móvil: size 36, icono 20 */}
                <ActionIcon hiddenFrom="sm" variant="subtle" color="gray" size={36} radius="xl">
                  <IconArrowLeft size={20} />
                </ActionIcon>
                {/* En escritorio: size 42, icono 26 (idéntico al del jugador) */}
                <ActionIcon visibleFrom="sm" variant="subtle" color="gray" size={42} radius="xl" style={{ transition: 'transform 140ms ease' }}>
                  <IconArrowLeft size={26} />
                </ActionIcon>
              </Anchor>
            </Tooltip>

            {avatarSlot ? (
              avatarSlot
            ) : (
              <Box style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                {/* Escudo Móvil (44px - idéntico al jugador en móvil) */}
                <Box hiddenFrom="sm">
                  <Avatar
                    src={teamId ? `/api/teams/avatar?id=${teamId}&t=${teamPhotoVersion || team?.updated_at || ''}` : undefined}
                    size={44}
                    radius="xl"
                    color="nutralabColor"
                    style={{
                      width: 44,
                      height: 44,
                      minWidth: 44,
                      minHeight: 44,
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      backgroundColor: '#ffffff',
                      color: 'var(--mantine-color-nutralabColor-9)',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                    imageProps={{
                      style: {
                        objectFit: 'contain',
                        backgroundColor: '#ffffff',
                        padding: '2px',
                      },
                    }}
                  >
                    {initials(team?.nombre || 'Equipo')}
                  </Avatar>
                </Box>

                {/* Escudo Escritorio (84px - idéntico al jugador en escritorio) */}
                <Box visibleFrom="sm">
                  <Avatar
                    src={teamId ? `/api/teams/avatar?id=${teamId}&t=${teamPhotoVersion || team?.updated_at || ''}` : undefined}
                    size={84}
                    radius="xl"
                    color="nutralabColor"
                    style={{
                      width: 84,
                      height: 84,
                      minWidth: 84,
                      minHeight: 84,
                      border: '3px solid white',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                      backgroundColor: '#ffffff',
                      color: 'var(--mantine-color-nutralabColor-9)',
                      fontWeight: 700,
                      fontSize: '24px',
                    }}
                    imageProps={{
                      style: {
                        objectFit: 'contain',
                        backgroundColor: '#ffffff',
                        padding: '4px',
                      },
                    }}
                  >
                    {initials(team?.nombre || 'Equipo')}
                  </Avatar>
                  {!readOnly && teamId && onSelectTeamPhoto && (
                    <FileButton onChange={onSelectTeamPhoto} accept="image/*">
                      {(props) => (
                        <Tooltip label="Cambiar escudo o foto" position="bottom" withArrow>
                          <UnstyledButton
                            {...props}
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              cursor: 'pointer',
                              zIndex: 4,
                              overflow: 'visible',
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
              </Box>
            )}

            <Stack gap={{ base: 2, sm: 4 }} style={{ minWidth: 0, flex: 1 }}>
              {/* Título Móvil */}
              <Title hiddenFrom="sm" order={3} fw={700} c="dark.5" truncate="end">
                {team?.nombre || 'Equipo'}
              </Title>
              {/* Título Escritorio */}
              <Title visibleFrom="sm" order={2} c="dark.5" lh={1.1} fz={26} fw={700} lineClamp={2}>
                {team?.nombre || 'Equipo'}
              </Title>

              {team?.temporada && (
                <Text c="dimmed" size="sm" truncate="end" fw={500}>
                  {team.temporada.toLowerCase().includes('temporada')
                    ? team.temporada
                    : `Temporada ${team.temporada}`}
                </Text>
              )}
            </Stack>
          </Group>

          {rightSection ? (
            <Box style={{ flexShrink: 0 }}>
              {rightSection}
            </Box>
          ) : (
            <Box
              ref={slotContext?.setRightSlotEl}
              style={{
                flexShrink: 0,
                display: slotContext?.hasRightSection ? undefined : 'none',
              }}
            />
          )}
        </Group>

        <Box
          hiddenFrom="sm"
          ref={slotContext?.setMobileFiltersSlotEl}
          style={{
            width: '100%',
            minWidth: 0,
            display: slotContext?.hasMobileFilters ? undefined : 'none',
            marginTop: 8,
          }}
        />
      </Paper>

      {/* Header flotante de navegación y controles de la vista activa. */}
      <Box
        visibleFrom="sm"
        style={{
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="outline"
          radius="md"
          color="dark"
          style={{ width: '100%' }}
          styles={{
            list: {
              backgroundColor: 'transparent',
              borderBottomColor: 'var(--mantine-color-gray-3)',
            },
            tab: {
              fontSize: 15,
              fontWeight: 600,
              padding: '10px 16px',
            },
          }}
        >
          <Tabs.List grow visibleFrom="sm">
            {TABS.map((tab) => {
              const href = teamId ? tab.href(teamId) : '#';

              return (
                <Tabs.Tab
                  key={tab.value}
                  value={tab.value}
                  component={Link}
                  href={href}
                  leftSection={<Icon3D name={tab.icon3d} size={18} />}
                >
                  {tab.label}
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs>

        <Box
          visibleFrom="sm"
          ref={slotContext?.setDesktopFiltersSlotEl}
          style={{
            width: '100%',
            minWidth: 0,
            padding: slotContext?.hasDesktopFilters ? '12px 16px 16px' : 0,
            display: slotContext?.hasDesktopFilters ? undefined : 'none',
            backgroundColor: 'var(--mantine-color-white)',
            border: slotContext?.hasDesktopFilters ? '1px solid rgba(222,226,230,0.85)' : 'none',
            borderTop: slotContext?.hasDesktopFilters ? 'none' : undefined,
            borderRadius: slotContext?.hasDesktopFilters ? '0 0 16px 16px' : 0,
            boxShadow: slotContext?.hasDesktopFilters ? '0 2px 10px rgba(31, 35, 28, 0.08)' : 'none',
          }}
        />
      </Box>

      {/* BARRA DE NAVEGACIÓN INFERIOR FIJA PARA MÓVILES (Estilo App / Twitter / Instagram) */}
      <Box
        hiddenFrom="sm"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 300,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(222, 226, 230, 0.85)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 2px)',
        }}
      >
        <Group justify="space-around" align="center" gap={0} wrap="nowrap" h={58} px={4}>
          {TABS.map((tab) => {
            const href = teamId ? tab.href(teamId) : '#';
            const isActive = tab.value === tabValue;
            const mobileLabel = MOBILE_LABELS[tab.value] || tab.label;

            return (
              <Box
                key={tab.value}
                component={Link}
                href={href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  height: '100%',
                  textDecoration: 'none',
                  color: isActive ? '#1c1f1a' : 'var(--mantine-color-gray-6)',
                  position: 'relative',
                  paddingTop: 4,
                  transition: 'color 140ms ease, transform 100ms ease',
                }}
              >
                {isActive && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: 3,
                      width: 20,
                      height: 3,
                      borderRadius: 3,
                      backgroundColor: '#24291f',
                    }}
                  />
                )}
                <Icon3D
                  name={tab.icon3d}
                  size={22}
                  style={{
                    opacity: isActive ? 1 : 0.75,
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 140ms ease, opacity 140ms ease',
                  }}
                />
                <Text
                  fz={10}
                  fw={isActive ? 750 : 500}
                  lh={1.2}
                  mt={3}
                  c={isActive ? '#1c1f1a' : 'dimmed'}
                  style={{
                    letterSpacing: '-0.2px',
                  }}
                >
                  {mobileLabel}
                </Text>
              </Box>
            );
          })}
        </Group>
      </Box>
    </>
  );
}
