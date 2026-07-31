import { Group, ThemeIcon, Title, Text, Box } from '@mantine/core';
import { getSubtabHeader } from './subtab-config';

/**
 * Renders the standard section header banner for a subtab.
 * Pulls icon, color, title and subtitle from the shared subtab-config.
 *
 * Usage:
 *   <SubtabHeader tab="resumen" subtab="perfil" />
 *   <SubtabHeader tab="resumen" subtab="perfil" readOnly />
 */
export default function SubtabHeader({ tab, subtab, readOnly = false }) {
  const config = getSubtabHeader(tab, subtab);
  if (!config) return null;

  const HeaderIcon = config.icon;
  const subtitle = readOnly && config.subtitleReadOnly
    ? config.subtitleReadOnly
    : config.subtitle;

  return (
    <Group gap="xs">
      <ThemeIcon color={config.iconColor} variant="light" radius="xl" size="lg">
        <HeaderIcon size={20} />
      </ThemeIcon>
      <Box>
        <Title order={3} fw={800} c="dark.4">{config.title}</Title>
        <Text size="sm" c="dimmed">{subtitle}</Text>
      </Box>
    </Group>
  );
}
