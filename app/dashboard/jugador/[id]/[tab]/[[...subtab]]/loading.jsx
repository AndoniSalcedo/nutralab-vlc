'use client';

import { useParams } from 'next/navigation';
import { Paper, SegmentedControl, Stack, Box, Group, ThemeIcon, Title, Text } from '@mantine/core';
import { tabLabel } from '@/app/dashboard/jugador/[id]/_tabs/tab-label';
import { getSubtabControlData, resolveSubtab, getSubtabHeader } from '@/app/dashboard/jugador/[id]/_tabs/subtab-config';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

export default function PlayerSubtabLoading() {
  const params = useParams();
  const tab = params?.tab || 'resumen';
  const subtab = params?.subtab?.[0];

  const activeSubtab = resolveSubtab(tab, subtab);
  const controlData = getSubtabControlData(tab, tabLabel);
  const header = getSubtabHeader(tab, activeSubtab);
  const HeaderIcon = header?.icon;
  const skeletonName = `player-dashboard-${tab}`;

  return (
    <Stack gap={0}>
      {/* Real subtab header — static, no skeleton */}
      <Paper
        p="xs"
        bg="white"
        radius={0}
        style={{
          zIndex: 99,
          position: 'sticky',
          top: 0,
          clipPath: 'inset(0 -100% 0 -100%)',
          width: '100%',
          borderBottom: 0,
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          borderRight: '1px solid var(--mantine-color-gray-3)',
          boxShadow: 'none',
        }}
      >
        <SegmentedControl
          value={activeSubtab}
          fullWidth
          radius="xl"
          size="sm"
          bg="gray.1"
          data={controlData}
          styles={{
            root: { border: 'none', width: '100%' },
            indicator: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
          }}
          readOnly
        />
      </Paper>

      {/* Static section header — matches the real subtab's banner */}
      {header && (
        <Paper
          p={{ base: 'sm', sm: 'md' }}
          bg="white"
          shadow="xs"
          radius="lg"
          withBorder
          style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap="xs">
              <ThemeIcon color={header.iconColor} variant="light" radius="xl" size="lg">
                <HeaderIcon size={20} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={800} c="dark.4">{header.title}</Title>
                <Text size="sm" c="dimmed">{header.subtitle}</Text>
              </Box>
            </Group>
          </Group>
        </Paper>
      )}

      {/* Skeleton for the dynamic content area only */}
      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        <BoneyardSkeleton name={skeletonName} loading={true} minY={300} />
      </Box>
    </Stack>
  );
}
