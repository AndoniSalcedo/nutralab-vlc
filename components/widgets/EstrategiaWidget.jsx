'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Paper, Text, ThemeIcon, Timeline } from '@mantine/core';
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
} from '@tabler/icons-react';

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
    <Paper
      shadow="xs"
      radius="lg"
      p="md"
      bg="white"
      withBorder
      mt="md"
      onClick={() => router.push(`/dashboard/jugador/${jugador?.id}/nutricion/protocolos`)}
      style={{ cursor: 'pointer' }}
    >
      <Group justify="space-between" align="center" mb="sm">
        <Group gap="xs" align="center">
          <ThemeIcon color="indigo" variant="light" size="sm" radius="md">
            <IconClipboardList size={14} />
          </ThemeIcon>
          <Text fw={700} fz="sm" c="dark.5">
            {activeProtocol ? `Estrategia: ${activeProtocol.name}` : 'Estrategia del día'}
          </Text>
        </Group>
        <Text fz="xs" fw={700} c="indigo.7">
          ● {activeDayLabel}
        </Text>
      </Group>

      {hasTimeline ? (
        <Timeline bulletSize={26} lineWidth={2} color="indigo" pl={4} my="xs">
          {activeProtocol.timeline.map((item, idx) => {
            const IconComp = AVAILABLE_ICONS[item.icon] || IconFlag;
            return (
              <Timeline.Item
                key={item.id || idx}
                bullet={<IconComp size={13} />}
                title={
                  <Group gap={8} align="center" wrap="nowrap">
                    <Text fz="xs" fw={800} c="indigo.8" style={{ minWidth: 36, flexShrink: 0 }}>
                      {item.timeLabel}
                    </Text>
                    <Text fz="xs" fw={700} c="dark.6" truncate>
                      {item.title}
                    </Text>
                  </Group>
                }
              >
                {item.description && (
                  <Text fz="11px" c="dimmed" lh={1.3} mt={2}>
                    {item.description}
                  </Text>
                )}
              </Timeline.Item>
            );
          })}
        </Timeline>
      ) : (
        <Paper p="md" radius="md" bg="gray.0" withBorder mt="xs" ta="center">
          <ThemeIcon color="indigo" variant="light" size={30} radius="md" mx="auto" mb={6}>
            <IconClipboardList size={16} />
          </ThemeIcon>
          <Text fz="xs" fw={700} c="dark.5">
            Sin protocolo para {activeDayLabel}
          </Text>
          <Text fz="10px" c="dimmed" mt={2}>
            No hay pautas específicas de partido o viaje configuradas para este tipo de día.
          </Text>
        </Paper>
      )}

      {/* Pie de tarjeta idéntico al de Suplementación y Comedor */}
      <Group
        justify="space-between"
        align="center"
        mt="xs"
        pt="xs"
        style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}
      >
        <Text fz="10px" c="dimmed" fw={500}>
          Pautas y timing de competición
        </Text>
        <Text fz="10px" fw={700} c="indigo.7">
          Ver protocolos →
        </Text>
      </Group>
    </Paper>
  );
}
