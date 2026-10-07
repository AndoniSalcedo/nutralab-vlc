'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ActionIcon,
  Avatar,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowLeft,
} from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';
import { initials } from '@/lib/utils/avatar';
import { useTeamHeaderSlot } from '@/components/TeamHeaderContext';
import TeamSidebar, { TEAM_TABS } from '@/components/TeamSidebar';

const MOBILE_LABELS = {
  plantilla: 'Plantilla',
  evolucion: 'Evolución',
  analiticas: 'Analíticas',
  intrapartido: 'Partidos',
  suplementacion: 'Suplem.',
  menu: 'Menú',
  configuracion: 'Ajustes',
};

export default function TeamHeaderTabs({
  team,
  user,
  readOnly = false,
  children,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const slotContext = useTeamHeaderSlot();
  const teamId = team?.id;

  const currentTab = useMemo(() => {
    if (!pathname) return 'plantilla';
    if (pathname.includes('/evolucion')) return 'evolucion';
    if (pathname.includes('/analiticas')) return 'analiticas';
    if (pathname.includes('/intrapartido')) return 'intrapartido';
    if (pathname.includes('/suplementacion')) return 'suplementacion';
    if (pathname.includes('/menu')) return 'menu';
    if (pathname.includes('/configuracion')) return 'configuracion';
    return 'plantilla';
  }, [pathname]);

  const [optimisticTab, setOptimisticTab] = useState(null);

  useEffect(() => {
    setOptimisticTab(null);
  }, [pathname]);

  const tabValue = optimisticTab || currentTab;

  const currentTabConfig = useMemo(() => {
    return TEAM_TABS.find((t) => t.value === tabValue) || TEAM_TABS[0];
  }, [tabValue]);

  // Prefetch tabs for instant navigation between sections
  useEffect(() => {
    if (!teamId) return;
    TEAM_TABS.forEach((tab) => {
      router.prefetch(tab.href(teamId));
    });
  }, [teamId, router]);

  const handleTabChange = (val) => {
    if (!val || val === tabValue || !teamId) return;
    const target = TEAM_TABS.find((t) => t.value === val);
    if (target) {
      setOptimisticTab(val);
      router.push(target.href(teamId));
    }
  };

  const hasDesktopHeaderContent = Boolean(
    slotContext?.hasDesktopRightSection || slotContext?.hasDesktopFilters
  );

  return (
    <Box style={{ width: '100%', minWidth: 0 }}>
      {/* Layout en Escritorio: Sidebar Lateral + Contenido Principal */}
      <Box
        style={{
          display: 'flex',
          gap: 20,
          alignItems: 'flex-start',
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* Sidebar lateral en escritorio con escudo ampliado, datos y tabs estilo Apple Settings */}
        <Box
          visibleFrom="sm"
          style={{
            width: 280,
            minWidth: 280,
            maxWidth: 280,
            position: 'sticky',
            top: 16,
            alignSelf: 'flex-start',
            zIndex: 40,
          }}
        >
          <TeamSidebar
            team={team}
            user={user}
            activeTab={tabValue}
            onTabChange={handleTabChange}
            readOnly={readOnly}
          />
        </Box>

        {/* Área de Contenido Principal a la derecha */}
        <Box
          style={{
            flex: 1,
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {/* Header Compacto solo para Móvil */}
          <Box hiddenFrom="sm">
            <Paper
              radius={20}
              p="xs"
              bg="white"
              mb="xs"
              style={{
                boxShadow: '0 0 2px 0 rgba(0,0,0,0.1)',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                  <Tooltip label="Volver a equipos" position="right" withArrow>
                    <ActionIcon
                      component={Link}
                      href="/dashboard"
                      variant="subtle"
                      color="gray"
                      size={36}
                      radius="xl"
                      style={{ textDecoration: 'none', flexShrink: 0 }}
                    >
                      <IconArrowLeft size={20} />
                    </ActionIcon>
                  </Tooltip>

                  <Avatar
                    src={teamId ? `/api/media/team-avatar?id=${teamId}&t=${team?.updated_at || ''}` : undefined}
                    size={40}
                    radius="xl"
                    color="bosque"
                    imageProps={{
                      style: { objectFit: 'contain', backgroundColor: '#ffffff', padding: '2px' },
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    {initials(team?.nombre || 'Equipo')}
                  </Avatar>

                  <Stack gap={1} style={{ minWidth: 0, flex: 1 }}>
                    <Title order={4} fw={700} c="dark.5" truncate="end" fz={15}>
                      {team?.nombre || 'Equipo'}
                    </Title>
                    {team?.temporada && (
                      <Text c="dimmed" size="11px" truncate="end" fw={500}>
                        {team.temporada.toLowerCase().includes('temporada')
                          ? team.temporada
                          : `Temporada ${team.temporada}`}
                      </Text>
                    )}
                  </Stack>
                </Group>

                <Box ref={slotContext?.setMobileRightSlotEl} style={{ flexShrink: 0 }} />
              </Group>

              <Box
                ref={slotContext?.setMobileFiltersSlotEl}
                style={{
                  width: '100%',
                  minWidth: 0,
                  display: slotContext?.hasMobileFilters ? 'block' : 'none',
                  marginTop: 8,
                }}
              />
            </Paper>
          </Box>

          {/* Barra de Herramientas y Filtros en Escritorio */}
          <Box visibleFrom="sm">
            <Paper
              radius={24}
              p={hasDesktopHeaderContent ? 'md' : 0}
              bg={hasDesktopHeaderContent ? 'white' : 'transparent'}
              mb={hasDesktopHeaderContent ? 'md' : 0}
              style={{
                boxShadow: hasDesktopHeaderContent ? '0 0 2px 0 rgba(0,0,0,0.1)' : 'none',
                display: hasDesktopHeaderContent ? 'block' : 'none',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap" mb={slotContext?.hasDesktopFilters ? 'xs' : 0}>
                <Group gap={8} align="center">
                  <Icon3D name={currentTabConfig?.icon3d || 'plantilla'} size={22} />
                  <Title order={3} fz={18} fw={700} c="var(--nutra-bosque, #1F2A24)">
                    {currentTabConfig?.label || 'Plantilla'}
                  </Title>
                </Group>
                <Box ref={slotContext?.setDesktopRightSlotEl} style={{ flexShrink: 0 }} />
              </Group>

              <Box
                ref={slotContext?.setDesktopFiltersSlotEl}
                style={{
                  width: '100%',
                  minWidth: 0,
                  display: slotContext?.hasDesktopFilters ? 'block' : 'none',
                }}
              />
            </Paper>
          </Box>

          {/* Ref invisible para fallback de compatibilidad */}
          <Box ref={slotContext?.setRightSlotEl} style={{ display: 'none' }} />

          {/* Contenido Principal de la Sección */}
          {children}
        </Box>
      </Box>

      {/* BARRA DE NAVEGACIÓN INFERIOR FIJA PARA MÓVILES */}
      <Box
        hiddenFrom="sm"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(108, 112, 90, 0.18)',
          boxShadow: '0 -4px 20px rgba(31, 42, 36, 0.05)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 2px)',
        }}
      >
        <Group justify="space-around" align="center" gap={0} wrap="nowrap" h={58} px={4}>
          {TEAM_TABS.map((tab) => {
            const href = teamId ? tab.href(teamId) : '#';
            const isActive = tab.value === tabValue;
            const mobileLabel = MOBILE_LABELS[tab.value] || tab.label;

            return (
              <Box
                key={tab.value}
                component={Link}
                href={href}
                onClick={() => setOptimisticTab(tab.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  height: '100%',
                  textDecoration: 'none',
                  color: isActive ? 'var(--nutra-bosque, #1F2A24)' : 'var(--nutra-salvia, #6C705A)',
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
                      backgroundColor: 'var(--nutra-lima, #C1F080)',
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
                  style={{
                    color: isActive ? 'var(--nutra-bosque, #1F2A24)' : 'var(--nutra-salvia, #6C705A)',
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
    </Box>
  );
}
