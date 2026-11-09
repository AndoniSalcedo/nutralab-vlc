'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Group, Text, Timeline } from '@mantine/core';
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

// Protocolo del equipo (o la versión personalizada del jugador) asignado al tipo de día
function findActiveProtocol(jugador, activeDayType) {
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
}

/** ¿Hay pautas que enseñar para este tipo de día? Sin ellas el perfil no muestra la tarjeta. */
export function hasStrategyFor(jugador, activeDayType) {
  const protocol = findActiveProtocol(jugador, activeDayType);
  return Array.isArray(protocol?.timeline) && protocol.timeline.length > 0;
}

export default function EstrategiaWidget({
  jugador,
  activeDayType = 'entreno',
  activeDayLabel = 'Día activo',
}) {
  const router = useRouter();

  const activeProtocol = useMemo(() => findActiveProtocol(jugador, activeDayType), [jugador, activeDayType]);

  if (!activeProtocol || !hasStrategyFor(jugador, activeDayType)) return null;

  return (
    <WidgetCard
      id="widget-estrategia"
      color="salvia"
      icon="target"
      title={`Estrategia: ${activeProtocol.name}`}
      aside={<WidgetAside color="salvia" dot>{activeDayLabel}</WidgetAside>}
      footer="Pautas y timing de competición"
      footerAction="Ver protocolos"
      onClick={() => router.push(`/dashboard/jugador/${jugador?.id}/nutricion/protocolos`)}
    >
      <Timeline bulletSize={26} lineWidth={2} color="bosque" pl={4}>
        {activeProtocol.timeline.map((item, idx) => {
          const IconComp = AVAILABLE_ICONS[item.icon] || IconFlag;
          return (
            <Timeline.Item
              key={item.id || idx}
              bullet={<IconComp size={13} />}
              title={
                <Group gap={8} align="center" wrap="nowrap">
                  <Text fz="xs" fw={600} style={{ color: 'var(--nutra-salvia, #6C705A)', minWidth: 36, flexShrink: 0 }}>
                    {item.timeLabel}
                  </Text>
                  <Text fz="xs" fw={600} c="var(--nutra-bosque, #1F2A24)" truncate>
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
                      <Text fz={11} fw={700} c="var(--nutra-bosque, #1F2A24)">{supp.nombre}</Text>
                      <Text fz={11} fw={600} c="var(--nutra-salvia, #6C705A)">· {supp.dosis}</Text>
                    </Box>
                  ))}
                </Group>
              )}
            </Timeline.Item>
          );
        })}
      </Timeline>
    </WidgetCard>
  );
}
