'use client';

import { Box, Stack, Group, Select, TextInput, Button } from '@mantine/core';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import { TeamHeaderFilters, TeamHeaderRightSection } from '@/components/TeamHeaderContext';
import PlayerSubtabControl from '@/app/dashboard/jugador/[id]/_tabs/PlayerSubtabControl';
import { tabLabel } from '@/app/dashboard/jugador/[id]/_tabs/tab-label';
import { IconChartLine, IconCalendarStats, IconFilter, IconUsers, IconDownload } from '@/components/icons3d';

export default function TeamEvolutionLoading() {
  return (
    <>
      <TeamHeaderRightSection>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            visibleFrom="sm"
            radius="xl"
            size="xs"
            variant="default"
            leftSection={<IconDownload size={14} />}
            disabled
          >
            CSV
          </Button>
        </Group>
      </TeamHeaderRightSection>

      <TeamHeaderFilters>
        <Box w="100%" style={{ minWidth: 0 }}>
          <Stack gap="xs" style={{ width: '100%', minWidth: 0 }}>
            <PlayerSubtabControl
              value="trends"
              data={[
                { value: 'trends', label: tabLabel(IconChartLine, 'Histórico') },
                { value: 'day', label: tabLabel(IconCalendarStats, 'Jornada') },
                { value: 'ranking', label: tabLabel(IconFilter, 'Filtros') },
              ]}
              readOnly
            />

            <Group gap={8} wrap="wrap" align="center" w="100%" style={{ minWidth: 0 }}>
              <Select
                placeholder="Posición"
                leftSection={<IconUsers size={16} style={{ opacity: 0.7 }} />}
                data={[]}
                variant="filled"
                radius="xl"
                size="sm"
                readOnly
                style={{ flex: '1 1 130px', minWidth: 0 }}
              />

              <Select
                placeholder="Temporada"
                leftSection={<IconCalendarStats size={16} style={{ opacity: 0.7 }} />}
                data={[]}
                variant="filled"
                radius="xl"
                size="sm"
                readOnly
                style={{ flex: '1 1 130px', minWidth: 0 }}
              />

              <TextInput
                placeholder="Fecha de inicio"
                leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                readOnly
                style={{ flex: '1 1 130px', minWidth: 0 }}
              />

              <TextInput
                placeholder="Fecha de fin"
                leftSection={<IconFilter size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                readOnly
                style={{ flex: '1 1 130px', minWidth: 0 }}
              />
            </Group>
          </Stack>
        </Box>
      </TeamHeaderFilters>

      <BoneyardSkeleton name="team-evolution" loading={true} />
    </>
  );
}


