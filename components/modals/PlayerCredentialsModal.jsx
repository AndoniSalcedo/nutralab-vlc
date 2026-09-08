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
import Icon3D from '@/components/Icon3D';

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
            <Icon3D name="shield" size={26} />
          ) : (
            <Icon3D name="key" size={26} />
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
          <Alert color="green" icon={<Icon3D name="shield" size={20} />} radius="md" title="Credenciales listas">
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
            leftSection={<Icon3D name="refresh" size={18} />}
            onClick={() => setPassword(generatePassword())}
          >
            Autogenerar
          </Button>
          <Group gap="xs">
            <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={onClose} disabled={saving}>
              Cerrar
            </Button>
            <Button size="xs" radius="xl" leftSection={<Icon3D name="check" size={18} />} onClick={saveCredentials} loading={saving} disabled={!email.trim()}>
              Guardar acceso
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
