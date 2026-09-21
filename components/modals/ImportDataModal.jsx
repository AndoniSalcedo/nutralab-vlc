import React from 'react';
import { Modal, Group, Text, Tabs } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import PlayerExcelImporter from '@/components/PlayerExcelImporter';
import TeamOsmolarityImporter from '@/components/TeamOsmolarityImporter';

export default function ImportDataModal({ opened, onClose, team }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon3D name="inbox" size={26} />
          <Text fw={700}>Importar datos</Text>
        </Group>
      }
      size="1200px"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Tabs defaultValue="metrics" variant="outline" radius="md">
        <Tabs.List grow mb="md">
          <Tabs.Tab value="metrics" leftSection={<Icon3D name="document" size={20} />}>
            Métricas (Excel de jugadores)
          </Tabs.Tab>
          <Tabs.Tab value="osmolarity" leftSection={<Icon3D name="droplet" size={20} />}>
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
