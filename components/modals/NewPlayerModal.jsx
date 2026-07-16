import React from 'react';
import { Modal, Group, Text } from '@mantine/core';
import { IconUserPlus } from '@tabler/icons-react';
import PlayerForm from '@/components/forms/PlayerForm';

export default function NewPlayerModal({ opened, onClose, team }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconUserPlus size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>Añadir jugador</Text>
        </Group>
      }
      size="xl"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <PlayerForm initial={null} team={team} />
    </Modal>
  );
}
