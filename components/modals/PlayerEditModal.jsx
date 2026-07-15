import React from 'react';
import { Modal, Group, Text } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import PlayerForm from '@/components/PlayerForm';

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
          <IconPencil size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
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
