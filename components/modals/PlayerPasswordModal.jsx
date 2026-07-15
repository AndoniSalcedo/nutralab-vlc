import React from 'react';
import { Modal, Stack, PasswordInput, Group, Button, Text } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

export default function PlayerPasswordModal({
  opened,
  onClose,
  password,
  setPassword,
  confirm,
  setConfirm,
  savePassword,
  saving
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconLock size={20} style={{ color: 'var(--mantine-color-gray-6)' }} />
          <Text fw={700}>Cambiar contraseña</Text>
        </Group>
      }
      size="sm"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <PasswordInput label="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordInput label="Repetir contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        <Group justify="flex-end">
          <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={onClose} disabled={saving}>
            Cerrar
          </Button>
          <Button size="xs" radius="xl" onClick={savePassword} loading={saving}>
            Guardar contraseña
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
