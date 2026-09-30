import { Group, Text, ThemeIcon, Paper, Stack } from '@mantine/core';
import Icon3D, { USE_3D_ICONS } from '@/components/Icon3D';

// Misma tesela que components/widgets/WidgetCard: blanca, sin borde, esquinas amplias y el
// título con el color de su categoría. Se mantiene aquí porque lo usan las pestañas de
// Métricas, Nutrición, Preferencias y los catálogos.
export function BentoCard({ title, icon: Icon, icon3d, color = 'gray', children, style, ...props }) {
  return (
    <Paper
      radius={24}
      p={{ base: 'sm', sm: 'md' }}
      bg="white"
      h="100%"
      className="bento-card-hover"
      style={{ boxShadow: '0 1px 2px rgba(21, 21, 19, 0.05)', ...style }}
      {...props}
    >
      <Group mb={{ base: 'sm', sm: 'md' }} gap={6} wrap="nowrap" align="center">
        {USE_3D_ICONS ? (
          icon3d ? (
            <Icon3D name={icon3d} size={20} style={{ flexShrink: 0 }} />
          ) : Icon ? (
            <Icon size={20} style={{ flexShrink: 0 }} />
          ) : null
        ) : Icon || icon3d ? (
          <ThemeIcon color={color} variant="light" radius="md" size="md">
            {Icon ? <Icon size={16} stroke={1.5} /> : <Icon3D name={icon3d} size={16} />}
          </ThemeIcon>
        ) : null}
        <Text fz={13} fw={700} c="dark.5" lh={1.25}>
          {title}
        </Text>
      </Group>
      <Stack gap="sm">
        {children}
      </Stack>
    </Paper>
  );
}
