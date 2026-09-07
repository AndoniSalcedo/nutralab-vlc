'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ActionIcon,
  Avatar,
  Box,
  Divider,
  FileButton,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBottle,
  IconCalendarEvent,
  IconCamera,
  IconChartLine,
  IconReportMedical,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';
import { initials } from '@/lib/utils/avatar';
import { useTeamHeaderSlot } from '@/components/TeamHeaderContext';

const TABS = [
  { value: 'plantilla', label: 'Plantilla', href: (id) => `/dashboard/equipo/${id}`, icon: IconUsers },
  { value: 'evolucion', label: 'Evolución', href: (id) => `/dashboard/equipo/${id}/evolucion`, icon: IconChartLine },
  { value: 'analiticas', label: 'Analíticas', href: (id) => `/dashboard/equipo/${id}/analiticas`, icon: IconReportMedical },
  { value: 'suplementacion', label: 'Suplementación', href: (id) => `/dashboard/equipo/${id}/suplementacion`, icon: IconBottle },
  { value: 'menu', label: 'Menú semanal', href: (id) => `/dashboard/equipo/${id}/menu`, icon: IconCalendarEvent },
  { value: 'configuracion', label: 'Configuración', href: (id) => `/dashboard/equipo/${id}/configuracion`, icon: IconSettings },
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
  totalPlayers,
  subtitle,
  avatarSlot,
  rightSection,
  children,
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
        p={{ base: 'md', sm: 'lg' }}
        shadow="xs"
        radius={24}
        bg="white"
        withBorder
        style={{
          borderColor: 'rgba(222,226,230,0.85)',
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <Stack gap="md" style={{ width: '100%', minWidth: 0 }}>
          {/* FILA 1: Identidad del equipo y acciones principales */}
          <Group justify="space-between" align="center" wrap="wrap" gap="md" style={{ width: '100%', minWidth: 0 }}>
            <Group gap="sm" align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
              <Tooltip label="Volver a equipos" withArrow>
                <ActionIcon
                  component={Link}
                  href="/dashboard"
                  variant="light"
                  color="gray"
                  radius="xl"
                  size={42}
                  style={{ flexShrink: 0 }}
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
              </Tooltip>

              {avatarSlot ? (
                avatarSlot
              ) : (
                <Box style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                  <Avatar
                    src={teamId ? `/api/teams/avatar?id=${teamId}&t=${teamPhotoVersion || team?.updated_at || ''}` : undefined}
                    size={52}
                    radius="lg"
                    color="dark"
                    style={{
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      backgroundColor: 'var(--mantine-color-nutralabColor-1)',
                      color: 'var(--mantine-color-nutralabColor-9)',
                      fontWeight: 700,
                      fontSize: '18px',
                    }}
                  >
                    {initials(team?.nombre || 'Equipo')}
                  </Avatar>
                  {!readOnly && teamId && onSelectTeamPhoto && (
                    <FileButton onChange={onSelectTeamPhoto} accept="image/*">
                      {(props) => (
                        <Tooltip label="Cambiar escudo o foto" position="top" withArrow>
                          <ActionIcon
                            {...props}
                            variant="filled"
                            color="dark"
                            radius="xl"
                            size={20}
                            style={{
                              position: 'absolute',
                              bottom: -3,
                              right: -3,
                              border: '1.5px solid white',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              cursor: 'pointer',
                            }}
                          >
                            <IconCamera size={11} stroke={2} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </FileButton>
                  )}
                </Box>
              )}

              <Box style={{ minWidth: 0, flex: 1 }}>
                <Group gap={8} align="center" wrap="wrap">
                  <Title order={3} fw={850} c="#24291f" lh={1.1}>
                    {team?.nombre || 'Equipo'}
                  </Title>
                  {team?.temporada && (
                    <Text
                      fz="xs"
                      fw={700}
                      c="dimmed"
                      style={{
                        backgroundColor: 'var(--mantine-color-gray-1)',
                        padding: '2px 8px',
                        borderRadius: 12,
                        border: '1px solid var(--mantine-color-gray-2)',
                      }}
                    >
                      {team.temporada}
                    </Text>
                  )}
                </Group>
                <Text size="xs" c="dimmed" mt={3} lineClamp={1}>
                  {subtitle || (totalPlayers !== undefined
                    ? `${totalPlayers} ${totalPlayers === 1 ? 'jugador registrado' : 'jugadores registrados'} · Panel del equipo`
                    : 'Panel nutricional y gestión del equipo')}
                </Text>
              </Box>
            </Group>

            {rightSection ? (
              <Box w={{ base: '100%', sm: 'auto' }} style={{ flexShrink: 0 }}>
                {rightSection}
              </Box>
            ) : (
              <Box
                ref={slotContext?.setRightSlotEl}
                w={{ base: '100%', sm: 'auto' }}
                style={{
                  flexShrink: 0,
                  display: slotContext?.hasRightSection ? undefined : 'none',
                }}
              />
            )}
          </Group>

          {/* FILA 2: Pestañas para Escritorio y Tablets (visibleFrom="sm") */}
          <Divider color="gray.2" visibleFrom="sm" />

          <Box visibleFrom="sm" style={{ width: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
            <ScrollArea
              type="hover"
              offsetScrollbars={false}
              scrollbarSize={4}
              styles={{
                viewport: { WebkitOverflowScrolling: 'touch' },
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="pills"
                radius="xl"
                color="dark"
                styles={{
                  list: { flexWrap: 'nowrap', gap: 6, width: 'max-content' },
                  tab: {
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '7px 16px',
                    whiteSpace: 'nowrap',
                    transition: 'all 140ms ease',
                  },
                }}
              >
                <Tabs.List>
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const href = teamId ? tab.href(teamId) : '#';

                    return (
                      <Tabs.Tab
                        key={tab.value}
                        value={tab.value}
                        component={Link}
                        href={href}
                        leftSection={<Icon size={15} />}
                      >
                        {tab.label}
                      </Tabs.Tab>
                    );
                  })}
                </Tabs.List>
              </Tabs>
            </ScrollArea>
          </Box>

          {/* FILA 3 (Opcional): Filtros, selectores u otras herramientas específicas de sección */}
          {children ? (
            children
          ) : (
            <Box
              ref={slotContext?.setFiltersSlotEl}
              style={{
                width: '100%',
                minWidth: 0,
                display: slotContext?.hasFilters ? undefined : 'none',
              }}
            />
          )}
        </Stack>
      </Paper>

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
            const Icon = tab.icon;
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
                <Icon
                  size={20}
                  stroke={isActive ? 2.4 : 1.6}
                  style={{
                    color: isActive ? '#24291f' : 'inherit',
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
