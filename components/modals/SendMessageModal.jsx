import React from 'react';
import { Group, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import MessageComposerForm from '@/components/forms/MessageComposerForm';
import ResponsiveModal from './ResponsiveModal';

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
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon3D name="chat" size={26} />
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
    </ResponsiveModal>
  );
}
