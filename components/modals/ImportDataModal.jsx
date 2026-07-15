import React from 'react';
import { Modal, Group, Text, Tabs } from '@mantine/core';
import { IconFileSpreadsheet, IconDroplet } from '@tabler/icons-react';
import PlayerExcelImporter from '@/components/PlayerExcelImporter';
import TeamOsmolarityImporter from '@/components/TeamOsmolarityImporter';

export default function ImportDataModal({ opened, onClose, team }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconFileSpreadsheet size={20} style={{ color: 'var(--mantine-color-teal-6)' }} />
          <Text fw={700}>Importar datos</Text>
        </Group>
      }
      size="1200px"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Tabs defaultValue="metrics" variant="outline" radius="md">
        <Tabs.List grow mb="md">
          <Tabs.Tab value="metrics" leftSection={<IconFileSpreadsheet size={16} />}>
            Métricas (Excel de jugadores)
          </Tabs.Tab>
          <Tabs.Tab value="osmolarity" leftSection={<IconDroplet size={16} />}>
            Osmolaridad (CSV de equipo)
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="metrics">
          <PlayerExcelImporter team={team} />
        </Tabs.Panel>

        <Tabs.Panel value="osmolarity">
          <TeamOsmolarityImporter team={team} />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
