'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Group, Menu, Modal, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconKey, IconRefresh, IconShieldCheck } from '@tabler/icons-react';

import { updatePlayerCredentials } from '@/services/player';

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
    const base = `${jugador.nombre || ''}.${jugador.apellidos || ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
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

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group gap="xs">
            {hasCredentials ? <IconShieldCheck size={20} style={{ color: 'var(--mantine-color-green-6)' }} /> : <IconKey size={20} style={{ color: 'var(--mantine-color-yellow-6)' }} />}
            <Text fw={700}>{buttonLabel}</Text>
          </Group>
        }
        size="md"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Stack gap="md">
          {savedPassword && (
            <Alert color="green" icon={<IconShieldCheck size={16} />} radius="md" title="Credenciales listas">
              <Stack gap={2}>
                <Text size="xs"><strong>Correo:</strong> {email}</Text>
                <Text size="xs"><strong>Contraseña:</strong> {savedPassword}</Text>
              </Stack>
            </Alert>
          )}

          <TextInput
            label="Correo de acceso"
            placeholder={suggestedEmail || 'jugador@club.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            label="Contraseña"
            description="Déjala vacía para autogenerarla al guardar."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Group justify="space-between">
            <Button size="xs" radius="xl" variant="light" color="gray" leftSection={<IconRefresh size={14} />} onClick={() => setPassword(generatePassword())}>
              Autogenerar
            </Button>
            <Group gap="xs">
              <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={() => setOpened(false)} disabled={saving}>
                Cerrar
              </Button>
              <Button size="xs" radius="xl" leftSection={<IconCheck size={14} />} onClick={saveCredentials} loading={saving} disabled={!email.trim()}>
                Guardar acceso
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
