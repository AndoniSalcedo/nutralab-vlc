import { Group, Title, Text, Box } from '@mantine/core';
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
    <Group gap="sm" align="center" wrap="nowrap">
      <HeaderIcon size={28} />
      <Box style={{ minWidth: 0 }}>
        <Title order={3} fw={700} c="dark.5" fz={{ base: 16, sm: 18 }} lineClamp={1}>{config.title}</Title>
        <Text size="sm" c="dimmed" lineClamp={1}>{subtitle}</Text>
      </Box>
    </Group>
  );
}
