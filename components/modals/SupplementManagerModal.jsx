import React from 'react';
import { Group, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import SupplementCatalogManager from '@/components/SupplementCatalogManager';
import ResponsiveModal from './ResponsiveModal';

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
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon3D name="jar" size={28} />
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
    </ResponsiveModal>
  );
}
