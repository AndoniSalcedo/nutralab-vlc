import React from 'react';
import { Modal, Text, Group, Button, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export default function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  color = 'red'
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color={color} variant="light" size="md" radius="md">
            <IconAlertTriangle size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">{title}</Text>
        </Group>
      }
      size="sm"
      centered
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      zIndex={2000}
      withCloseButton={false}
    >
      <Stack gap="md" onClick={(e) => e.stopPropagation()}>
        <Text size="sm">{message}</Text>
        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            size="xs"
            radius="xl"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            color={color}
            size="xs"
            radius="xl"
            loading={loading}
            onClick={async () => {
              await onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
