'use client';

import { useMemo, useState } from 'react';
import { slugify } from '@/lib/utils';
import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconKey, IconShieldCheck } from '@tabler/icons-react';

import { updatePlayerCredentials } from '@/services/player';
import PlayerCredentialsModal from '@/components/modals/PlayerCredentialsModal';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%';
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

export default function PlayerCredentialsButton({ jugador, compact = false, menuItem = false, onSaved }) {
  const [opened, setOpened] = useState(false);
  const [email, setEmail] = useState(jugador.auth_email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedPassword, setSavedPassword] = useState('');
  const [credentials, setCredentials] = useState(jugador);

  const hasCredentials = Boolean(credentials.auth_user_id);
  const buttonLabel = hasCredentials ? 'Actualizar acceso' : 'Crear acceso';

  const suggestedEmail = useMemo(() => {
    const base = slugify(`${jugador.nombre || ''}.${jugador.apellidos || ''}`, '.');
    return base ? `${base}@nutralab.local` : '';
  }, [jugador.apellidos, jugador.nombre]);

  function openModal() {
    setEmail(credentials.auth_email || '');
    setPassword('');
    setSavedPassword('');
    setOpened(true);
  }

  async function saveCredentials() {
    setSaving(true);
    setSavedPassword('');
    try {
      const finalPassword = password || generatePassword();
      const data = await updatePlayerCredentials(jugador.id, email, finalPassword);
      const savedEmail = data.credentials.auth_email || email.trim().toLowerCase();
      setSavedPassword(finalPassword);
      setPassword(finalPassword);
      setEmail(savedEmail);
      setCredentials(data.credentials);
      onSaved?.(data.credentials);
      notifications.show({
        color: 'green',
        title: 'Credenciales listas',
        message: `Correo: ${savedEmail} · Contraseña: ${finalPassword}`,
        autoClose: false,
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudieron guardar las credenciales',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {menuItem ? (
        <Menu.Item leftSection={hasCredentials ? <IconShieldCheck size={14} /> : <IconKey size={14} />} onClick={openModal}>
          {buttonLabel}
        </Menu.Item>
      ) : (
        <Button
          size="xs"
          radius="xl"
          variant={hasCredentials ? 'light' : 'filled'}
          color={hasCredentials ? 'gray' : 'yellow'}
          leftSection={hasCredentials ? <IconShieldCheck size={14} /> : <IconKey size={14} />}
          onClick={openModal}
        >
          {compact ? (hasCredentials ? 'Acceso' : 'Sin acceso') : buttonLabel}
        </Button>
      )}

      <PlayerCredentialsModal
        opened={opened}
        onClose={() => setOpened(false)}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        savedPassword={savedPassword}
        saving={saving}
        suggestedEmail={suggestedEmail}
        generatePassword={generatePassword}
        saveCredentials={saveCredentials}
        hasCredentials={hasCredentials}
        buttonLabel={buttonLabel}
      />
    </>
  );
}
