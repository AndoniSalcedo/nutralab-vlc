'use client';

import { Box, Group, TextInput, Select } from '@mantine/core';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import { TeamHeaderFilters } from '@/components/TeamHeaderContext';
import Icon3D from '@/components/Icon3D';

export default function TeamDashboardLoading() {
  return (
    <>
      <TeamHeaderFilters>
        <Box w="100%" style={{ minWidth: 0 }}>
          <Group gap={8} wrap="wrap" align="center" w="100%">
            <TextInput
              placeholder="Buscar jugador por nombre..."
              leftSection={<Icon3D name="search" size={18} />}
              variant="filled"
              radius="xl"
              size="sm"
              readOnly
              style={{ flex: '2 1 180px', minWidth: 0 }}
            />
            <Select
              placeholder="Filtrar por posición"
              leftSection={<Icon3D name="soccer" size={18} />}
              data={[]}
              variant="filled"
              radius="xl"
              size="sm"
              readOnly
              style={{ flex: '1 1 140px', minWidth: 0 }}
            />
            <TextInput
              placeholder="Buscar por email..."
              leftSection={<Icon3D name="envelope" size={18} />}
              variant="filled"
              radius="xl"
              size="sm"
              readOnly
              style={{ flex: '1.5 1 160px', minWidth: 0 }}
            />
          </Group>
        </Box>
      </TeamHeaderFilters>
      <BoneyardSkeleton name="team-dashboard" loading={true} />
    </>
  );
}

