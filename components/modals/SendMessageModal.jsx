import React from 'react';
import { Modal, Group, Text } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import MessageComposerForm from '@/components/forms/MessageComposerForm';

export default function SendMessageModal({
  opened,
  onClose,
  players,
  team,
  onSent,
  defaultRecipientIds,
  forceRecipients
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconMail size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>Enviar mensaje</Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <MessageComposerForm
        players={players}
        team={team}
        onSent={onSent}
        defaultRecipientIds={defaultRecipientIds}
        forceRecipients={forceRecipients}
      />
    </Modal>
  );
}
