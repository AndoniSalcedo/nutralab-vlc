import { Box, Group, Text, ThemeIcon, Paper, Stack } from '@mantine/core';

export function BentoCard({ title, icon: Icon, color = 'blue', children, ...props }) {
  return (
    <Paper
      radius="lg"
      p="md"
      shadow="sm"
      withBorder
      h="100%"
      className="bento-card-hover"
      {...props}
    >
      <Group mb="md" gap="xs">
        <ThemeIcon color={color} variant="light" radius="md" size="md">
          <Icon size={16} stroke={1.5} />
        </ThemeIcon>
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

export function InfoRow({ label, children, border = true }) {
  return (
    <Group
      justify="space-between"
      align="start"
      wrap="nowrap"
      style={{
        borderBottom: border ? '1px dashed var(--mantine-color-gray-2)' : 'none',
        paddingBottom: border ? 8 : 0,
      }}
    >
      <Text size="xs" c="dimmed" fw={500} style={{ flex: '0 0 40%' }}>
        {label}
      </Text>
      <Box style={{ flex: 1, textAlign: 'right' }}>{children}</Box>
    </Group>
  );
}
