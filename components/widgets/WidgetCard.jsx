'use client';

import { Box, Group, Paper, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';

// Armazón común de los widgets del Perfil: mismo lenguaje que BentoCard
// (borde, icono 3D + etiqueta en mayúsculas) para que encajen con el resto de pestañas.
export default function WidgetCard({
  id,
  icon,
  title,
  aside,
  footer,
  footerAction,
  onFooterAction,
  onClick,
  children,
  style,
  ...props
}) {
  return (
    <Paper
      id={id}
      radius="lg"
      p={{ base: 'sm', sm: 'md' }}
      shadow="sm"
      withBorder
      bg="white"
      h="100%"
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', cursor: onClick ? 'pointer' : undefined, ...style }}
      {...props}
    >
      {(title || aside) && (
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
            {icon && <Icon3D name={icon} size={28} style={{ flexShrink: 0 }} />}
            <Text fw={700} c="dimmed" size="xs" tt="uppercase" lts={0.5} truncate>
              {title}
            </Text>
          </Group>
          {aside && <Box style={{ flexShrink: 0 }}>{aside}</Box>}
        </Group>
      )}

      <Box style={{ flex: 1 }}>{children}</Box>

      {(footer || footerAction) && (
        <Group
          justify="space-between"
          align="center"
          wrap="nowrap"
          mt="sm"
          pt="xs"
          style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
        >
          <Text fz="xs" c="dimmed" fw={500} truncate style={{ fontVariantNumeric: 'tabular-nums' }}>
            {footer}
          </Text>
          {footerAction && (
            <Text
              fz="xs"
              fw={600}
              c="nutralabColor.8"
              style={{ flexShrink: 0, cursor: onFooterAction || onClick ? 'pointer' : undefined }}
              onClick={onFooterAction ? (e) => { e.stopPropagation(); onFooterAction(); } : undefined}
            >
              {footerAction} →
            </Text>
          )}
        </Group>
      )}
    </Paper>
  );
}

// Etiqueta de estado para la esquina derecha de la cabecera (tipo de día, "Sin datos", contadores…)
export function WidgetAside({ children, color = 'gray', dot = false }) {
  return (
    <Group
      gap={5}
      wrap="nowrap"
      px={8}
      py={2}
      style={{ borderRadius: 20, backgroundColor: `var(--mantine-color-${color}-0)` }}
    >
      {dot && <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: `var(--mantine-color-${color}-6)` }} />}
      <Text fz={11} fw={600} c={`${color}.8`} style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {children}
      </Text>
    </Group>
  );
}
