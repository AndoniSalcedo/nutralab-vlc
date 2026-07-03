'use client';

import { useState } from 'react';
import { Button, Group, Menu, Modal, PasswordInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLock } from '@tabler/icons-react';
import { updatePlayerPassword } from '@/services/player';

export default function PlayerPasswordButton({ compact = false, menuItem = false }) {
  const [opened, setOpened] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function savePassword() {
    if (password.length < 8) {
      notifications.show({ color: 'red', title: 'Contraseña inválida', message: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }
    if (password !== confirm) {
      notifications.show({ color: 'red', title: 'Contraseña inválida', message: 'Las contraseñas no coinciden' });
      return;
    }

    setSaving(true);
    try {
      await updatePlayerPassword(password);
      notifications.show({ color: 'green', title: 'Contraseña actualizada', message: 'Tu contraseña se ha cambiado correctamente.' });
      setPassword('');
      setConfirm('');
      setOpened(false);
    } catch (e) {
      notifications.show({ color: 'red', title: 'No se pudo actualizar', message: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {menuItem ? (
        <Menu.Item leftSection={<IconLock size={14} />} onClick={() => setOpened(true)}>
          Cambiar contraseña
        </Menu.Item>
      ) : (
        <Button size="xs" radius="xl" variant="light" color="gray" leftSection={<IconLock size={14} />} onClick={() => setOpened(true)}>
          {compact ? 'Clave' : 'Cambiar contraseña'}
        </Button>
      )}

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
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
            <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={() => setOpened(false)} disabled={saving}>
              Cerrar
            </Button>
            <Button size="xs" radius="xl" onClick={savePassword} loading={saving}>
              Guardar contraseña
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
