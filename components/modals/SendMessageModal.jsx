'use client';

import React, { useMemo } from 'react';
import { Group, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import MessageComposerForm from '@/components/forms/MessageComposerForm';
import ResponsiveModal from './ResponsiveModal';

export default function SendMessageModal({
  opened,
  onClose,
  players = [],
  team,
  onSent,
  defaultRecipientIds = [],
  forceRecipients = false,
}) {
  const recipientName = useMemo(() => {
    if (forceRecipients && defaultRecipientIds.length === 1) {
      const p = players.find((item) => String(item.id) === String(defaultRecipientIds[0]));
      if (p) return `${p.nombre || ''} ${p.apellidos || ''}`.trim();
    }
    return null;
  }, [forceRecipients, defaultRecipientIds, players]);

  const modalTitle = (
    <Group justify="space-between" align="center" w="100%" pr={{ base: 2, sm: 16 }} wrap="nowrap">
      <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
        <Icon3D name="chat" size={22} />
        <Text fw={700} fz={{ base: 'sm', sm: 'md' }} c="dark.6" truncate>
          Enviar Mensaje
        </Text>
      </Group>
      <Group gap={4} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
        <Text size="8px" c="#16a34a">●</Text>
        <Text fz="xs" fw={600} c="dark.5" truncate>
          {recipientName || team?.nombre || 'Plantilla'}
        </Text>
      </Group>
    </Group>
  );

  return (
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      padding={{ base: 'xs', sm: 'md' }}
      radius="xl"
    >
      <MessageComposerForm
        players={players}
        team={team}
        onSent={onSent}
        onClose={onClose}
        defaultRecipientIds={defaultRecipientIds}
        forceRecipients={forceRecipients}
      />
    </ResponsiveModal>
  );
}

