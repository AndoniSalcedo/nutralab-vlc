import React from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  PasswordInput,
  Group,
  Button,
  Alert
} from '@mantine/core';
import { IconShieldCheck, IconKey, IconRefresh, IconCheck } from '@tabler/icons-react';

export default function PlayerCredentialsModal({
  opened,
  onClose,
  email,
  setEmail,
  password,
  setPassword,
  savedPassword,
  saving,
  suggestedEmail,
  generatePassword,
  saveCredentials,
  hasCredentials,
  buttonLabel
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          {hasCredentials ? (
            <IconShieldCheck size={20} style={{ color: 'var(--mantine-color-green-6)' }} />
          ) : (
            <IconKey size={20} style={{ color: 'var(--mantine-color-yellow-6)' }} />
          )}
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
          <Button
            size="xs"
            radius="xl"
            variant="light"
            color="gray"
            leftSection={<IconRefresh size={14} />}
            onClick={() => setPassword(generatePassword())}
          >
            Autogenerar
          </Button>
          <Group gap="xs">
            <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={onClose} disabled={saving}>
              Cerrar
            </Button>
            <Button size="xs" radius="xl" leftSection={<IconCheck size={14} />} onClick={saveCredentials} loading={saving} disabled={!email.trim()}>
              Guardar acceso
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
