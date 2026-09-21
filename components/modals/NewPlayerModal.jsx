import React from 'react';
import { Modal, Group, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import PlayerForm from '@/components/forms/PlayerForm';

export default function NewPlayerModal({ opened, onClose, team }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon3D name="user" size={26} />
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
