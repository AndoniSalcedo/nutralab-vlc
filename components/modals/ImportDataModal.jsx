'use client';

import React, { useState } from 'react';
import {
  Button,
  Divider,
  Group,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,

} from '@mantine/core';

import Icon3D from '@/components/Icon3D';
import PlayerExcelImporter from '@/components/PlayerExcelImporter';
import TeamOsmolarityImporter from '@/components/TeamOsmolarityImporter';
import ResponsiveModal from './ResponsiveModal';

export default function ImportDataModal({ opened, onClose, team }) {
  const [activeTab, setActiveTab] = useState('metrics');

  const modalTitle = (
    <Group justify="space-between" align="center" w="100%" pr={{ base: 2, sm: 16 }} wrap="nowrap">
      <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
        <Icon3D name="inbox" size={22} />
        <Text fw={700} fz={{ base: 'sm', sm: 'md' }} c="dark.6" truncate>
          Importar Datos
        </Text>
      </Group>
      {team?.nombre && (
        <Group gap={4} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Text size="8px" c="#2563eb">●</Text>
          <Text fz="xs" fw={600} c="dark.5" truncate>
            {team.nombre}
          </Text>
        </Group>
      )}
    </Group>
  );

  return (
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={modalTitle}
      size="1100px"
      padding={{ base: 'xs', sm: 'md' }}
      radius="xl"
    >
      <Stack gap="xs" style={{ width: '100%', minWidth: 0, height: '100%' }}>
        {/* Selector de tipo de importación con SegmentedControl */}
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          data={[
            {
              value: 'metrics',
              label: (
                <Group gap={6} justify="center" wrap="nowrap">
                  <Text fz="xs" fw={600}>Métricas</Text>
                </Group>
              ),
            },
            {
              value: 'osmolarity',
              label: (
                <Group gap={6} justify="center" wrap="nowrap">
                  <Text fz="xs" fw={600}>Osmolaridad</Text>
                </Group>
              ),
            },
          ]}
          fullWidth
          radius="xl"
          size="xs"
          color="dark"
        />

        {/* Área scrolleable ajustada para móvil (100dvh) y escritorio */}
        <ScrollArea.Autosize mah={{ base: 'calc(100dvh - 170px)', sm: 620 }} type="auto">
          {activeTab === 'metrics' ? (
            <PlayerExcelImporter team={team} />
          ) : (
            <TeamOsmolarityImporter team={team} />
          )}
        </ScrollArea.Autosize>


        {/* Barra inferior consistente */}
        <Divider mt="auto" />
        <Group justify="flex-end" align="center" wrap="nowrap" gap="xs">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            radius="xl"
            style={{ flex: { base: 1, sm: 'none' } }}
            onClick={onClose}
          >
            Cerrar
          </Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );
}

