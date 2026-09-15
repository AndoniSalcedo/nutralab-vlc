import { Group, Text, ThemeIcon, Paper, Stack } from '@mantine/core';
import Icon3D, { USE_3D_ICONS } from '@/components/Icon3D';

export function BentoCard({ title, icon: Icon, icon3d, color = 'blue', children, ...props }) {
  return (
    <Paper
      radius="lg"
      p={{ base: 'sm', sm: 'md' }}
      shadow="sm"
      withBorder
      h="100%"
      className="bento-card-hover"
      {...props}
    >
      <Group mb={{ base: 'sm', sm: 'md' }} gap="xs">
        {USE_3D_ICONS ? (
          icon3d ? (
            <Icon3D name={icon3d} size={28} style={{ flexShrink: 0 }} />
          ) : Icon ? (
            <Icon size={28} style={{ flexShrink: 0 }} />
          ) : null
        ) : Icon || icon3d ? (
          <ThemeIcon color={color} variant="light" radius="md" size="md">
            {Icon ? <Icon size={16} stroke={1.5} /> : <Icon3D name={icon3d} size={16} />}
          </ThemeIcon>
        ) : null}
        <Text fw={700} c="dimmed" size="xs" tt="uppercase" lts={0.5}>
          {title}
        </Text>
      </Group>
      <Stack gap="sm">
        {children}
      </Stack>
    </Paper>
  );
}
