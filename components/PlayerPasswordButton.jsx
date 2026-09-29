'use client';

import { useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Icon3D from '@/components/Icon3D';
import { updatePlayerPassword } from '@/actions/playerActions';
import PlayerPasswordModal from '@/components/modals/PlayerPasswordModal';

export default function PlayerPasswordButton({ compact = false, menuItem = false }) {
  const [opened, setOpened] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function savePassword() {
    if (!currentPassword) {
      notifications.show({ color: 'red', title: 'Contraseña inválida', message: 'Introduce tu contraseña actual' });
      return;
    }
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
      await updatePlayerPassword(password, currentPassword);
      notifications.show({ color: 'green', title: 'Contraseña actualizada', message: 'Tu contraseña se ha cambiado correctamente.' });
      setCurrentPassword('');
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
        <Menu.Item leftSection={<Icon3D name="lock" size={18} />} onClick={() => setOpened(true)}>
          Cambiar contraseña
        </Menu.Item>
      ) : (
        <Button size="xs" radius="xl" variant="light" color="gray" leftSection={<Icon3D name="lock" size={18} />} onClick={() => setOpened(true)}>
          {compact ? 'Clave' : 'Cambiar contraseña'}
        </Button>
      )}

      <PlayerPasswordModal
        opened={opened}
        onClose={() => setOpened(false)}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
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
