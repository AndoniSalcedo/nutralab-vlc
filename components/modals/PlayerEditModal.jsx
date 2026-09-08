import React from 'react';
import { Modal, Group, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import PlayerForm from '@/components/forms/PlayerForm';

export default function PlayerEditModal({
  opened,
  onClose,
  player,
  team,
  title = 'Editar jugador'
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon3D name="edit" size={26} />
          <Text fw={700}>{title}</Text>
        </Group>
      }
      size="xl"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      {player && <PlayerForm initial={player} team={team} />}
    </Modal>
  );
}
