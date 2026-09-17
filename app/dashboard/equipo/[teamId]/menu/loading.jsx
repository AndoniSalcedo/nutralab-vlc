'use client';

import { Box, Group, Select, ActionIcon, Button } from '@mantine/core';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import { TeamHeaderFilters, TeamHeaderRightSection } from '@/components/TeamHeaderContext';
import { IconCalendar, IconPlus } from '@/components/icons3d';

export default function TeamMenuLoading() {
  return (
    <>
      <TeamHeaderRightSection>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            visibleFrom="sm"
            size="xs"
            radius="xl"
            color="nutralabColor.8"
            leftSection={<IconPlus size={14} />}
            disabled
          >
            Nuevo menú
          </Button>
        </Group>
      </TeamHeaderRightSection>

      <TeamHeaderFilters>
        <Box w="100%" style={{ minWidth: 0 }}>
          <Group justify="space-between" align="center" w="100%" wrap="wrap" gap="sm">
            <Select
              placeholder="Cargando semana..."
              leftSection={<IconCalendar size={16} style={{ opacity: 0.7 }} />}
              data={[]}
              variant="filled"
              radius="xl"
              size="sm"
              readOnly
              style={{ flex: '1 1 220px', maxWidth: 320, minWidth: 180 }}
            />
            <Group
              gap={4}
              p={3}
              bg="gray.1"
              style={{
                borderRadius: 'var(--mantine-radius-xl)',
                border: '1px solid var(--mantine-color-gray-2)',
                flexShrink: 0,
              }}
            >
              <ActionIcon variant="filled" color="dark" radius="xl" size="md" style={{ width: 32, height: 32 }} />
              <ActionIcon variant="transparent" color="gray" radius="xl" size="md" style={{ width: 32, height: 32 }} />
            </Group>
          </Group>
        </Box>
      </TeamHeaderFilters>
      <BoneyardSkeleton name="team-menu" loading={true} />
    </>
  );
}

