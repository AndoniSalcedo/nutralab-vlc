import React from 'react';
import { Modal, Group, Text } from '@mantine/core';
import { IconBottle } from '@tabler/icons-react';
import SupplementCatalogManager from '@/components/SupplementCatalogManager';

export default function SupplementManagerModal({
  opened,
  onClose,
  players,
  team,
  activeTab,
  onTabChange,
  initialSelectedPlayerIds
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconBottle size={20} style={{ color: 'var(--mantine-color-grape-6)' }} />
          <Text fw={700}>Gestión de suplementación</Text>
        </Group>
      }
      size="xl"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      closeOnClickOutside={false}
      closeOnEscape={false}
      trapFocus={false}
    >
      <SupplementCatalogManager
        players={players}
        team={team}
        activeTab={activeTab}
        onTabChange={onTabChange}
        initialSelectedPlayerIds={initialSelectedPlayerIds}
      />
    </Modal>
  );
}
