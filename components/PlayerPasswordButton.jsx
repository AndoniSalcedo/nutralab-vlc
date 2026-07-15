'use client';

import { useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLock } from '@tabler/icons-react';
import { updatePlayerPassword } from '@/services/player';
import PlayerPasswordModal from '@/components/modals/PlayerPasswordModal';

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

      <PlayerPasswordModal
        opened={opened}
        onClose={() => setOpened(false)}
        password={password}
        setPassword={setPassword}
        confirm={confirm}
        setConfirm={setConfirm}
        savePassword={savePassword}
        saving={saving}
      />
    </>
  );
}
