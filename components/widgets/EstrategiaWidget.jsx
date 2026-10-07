'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Group, Paper, Text, Timeline } from '@mantine/core';
import WidgetCard, { WidgetAside } from './WidgetCard';
import {
  IconActivity,
  IconApple,
  IconBatteryCharging,
  IconBed,
  IconClipboardList,
  IconCoffee,
  IconDroplet,
  IconFlag,
  IconMeat,
  IconPill,
  IconRun,
} from '@/components/icons3d';

const AVAILABLE_ICONS = {
  IconApple,
  IconRun,
  IconCoffee,
  IconDroplet,
  IconBatteryCharging,
  IconFlag,
  IconBed,
  IconActivity,
  IconMeat,
  IconPill,
  IconClipboardList,
};

export default function EstrategiaWidget({
  jugador,
  activeDayType = 'entreno',
  activeDayLabel = 'Día activo',
}) {
  const router = useRouter();

  // Detección automática del protocolo asignado para este día
  const activeProtocol = useMemo(() => {
    const teamProtocols = jugador?.equipos?.configuracion_nutricional?.protocols || [];
    const customProtocols = jugador?.protocolos_custom || {};

    if (!Array.isArray(teamProtocols) || teamProtocols.length === 0) return null;

    let match = teamProtocols.find((p) => p.dayTypeKey === activeDayType);

    if (!match && (activeDayType?.includes('partido') || activeDayType?.includes('match'))) {
      match = teamProtocols.find(
        (p) => p.dayTypeKey?.toLowerCase().includes('partido') || p.dayTypeKey?.toLowerCase().includes('match')
      );
    }

    if (!match) return null;
    return customProtocols[match.id] || match;
  }, [jugador, activeDayType]);

  const hasTimeline = activeProtocol && Array.isArray(activeProtocol.timeline) && activeProtocol.timeline.length > 0;

  return (
    <WidgetCard
      id="widget-estrategia"
      color="grape"
      icon="target"
      title={activeProtocol ? `Estrategia: ${activeProtocol.name}` : 'Estrategia del día'}
      aside={<WidgetAside color="nutralabColor" dot>{activeDayLabel}</WidgetAside>}
      footer="Pautas y timing de competición"
      footerAction="Ver protocolos"
      onClick={() => router.push(`/dashboard/jugador/${jugador?.id}/nutricion/protocolos`)}
    >
      {hasTimeline ? (
        <Timeline bulletSize={26} lineWidth={2} color="nutralabColor" pl={4}>
          {activeProtocol.timeline.map((item, idx) => {
            const IconComp = AVAILABLE_ICONS[item.icon] || IconFlag;
            return (
              <Timeline.Item
                key={item.id || idx}
                bullet={<IconComp size={13} />}
                title={
                  <Group gap={8} align="center" wrap="nowrap">
                    <Text fz="xs" fw={600} c="nutralabColor.8" style={{ minWidth: 36, flexShrink: 0 }}>
                      {item.timeLabel}
                    </Text>
                    <Text fz="xs" fw={600} c="dark.5" truncate>
                      {item.title}
                    </Text>
                  </Group>
                }
              >
                {item.description && (
                  <Text fz="xs" c="dimmed" lh={1.3} mt={2}>
                    {item.description}
                  </Text>
                )}
                {item.suplementos?.length > 0 && (
                  <Group gap={6} mt={6} wrap="wrap">
                    {item.suplementos.map((supp, sIdx) => (
                      <Box
                        key={sIdx}
                        px={7}
                        py={3}
                        style={{
                          borderRadius: 6,
                          backgroundColor: 'var(--mantine-color-gray-1)',
                          border: '1px solid var(--mantine-color-gray-3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <IconPill size={11} style={{ opacity: 0.7 }} />
                        <Text fz={11} fw={700} c="dark.5">{supp.nombre}</Text>
                        <Text fz={11} fw={600} c="grape.7">· {supp.dosis}</Text>
                      </Box>
                    ))}
                  </Group>
                )}
              </Timeline.Item>
            );
          })}
        </Timeline>
      ) : (
        <Paper p="md" radius="md" bg="gray.0" withBorder ta="center" style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
          <Box mx="auto" mb={6}>
            <IconClipboardList size={32} />
          </Box>
          <Text fz="xs" fw={700} c="dark.5">
            Sin protocolo para {activeDayLabel}
          </Text>
          <Text fz="xs" c="dimmed" mt={2}>
            No hay pautas específicas de partido o viaje configuradas para este tipo de día.
          </Text>
        </Paper>
      )}

    </WidgetCard>
  );
}
