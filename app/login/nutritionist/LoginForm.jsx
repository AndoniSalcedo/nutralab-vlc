'use client';

import { useState } from 'react';
import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
  Text,
  Box,
  Center,
  Container,
  Divider,
  Group,
} from '@mantine/core';
import { login } from '@/actions/authActions';
import { notifications } from '@mantine/notifications';
import { IconAt, IconLock } from '@tabler/icons-react';
import Logo from '@/components/Logo';
import { errorMessage } from '@/lib/actionError';

export default function NutritionistLoginPage() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  /* ---------- login ---------- */
  const submit = async (e) => {
    e?.preventDefault();
    if (!values.email || !values.password) {
      notifications.show({
        title: 'Campos requeridos',
        message: 'Por favor, introduce tu email y contraseña.',
        color: 'yellow',
      });
      return;
    }

    setLoading(true);
    try {
      await login(values.email, values.password, 'nutritionist');
      window.location.href = '/dashboard';
    } catch (err) {
      setLoading(false);
      const msg = errorMessage(err, 'Error inesperado. Inténtalo de nuevo.');

      notifications.show({
        id: 'login-error',
        title: 'Error de acceso',
        message: msg,
        color: 'red',
        autoClose: 4000,
        withCloseButton: true,
      });
    }
  };

  return (
    <Box
      bg="gray.0"
      mih="100vh"
      py={40}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <Container size="xs" w="100%">
        <Paper
          shadow="xl"
          p={40}
          radius={24}
          bg="white"
          withBorder
          style={{ borderColor: 'var(--mantine-color-gray-2)' }}
        >
          {/* Cabecera visual */}
          <Stack align="center" mb="xl" gap="xs">
            <Logo />
            <Title order={2} ta="center" fw={800} c="dark.4">
              Portal Profesional
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Inicia sesión para acceder a la gestión de equipos
            </Text>
          </Stack>

          <form onSubmit={submit}>
            <Stack gap="lg">
              <TextInput
                label="Email"
                placeholder="nutricionista@nutralab.es"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.currentTarget.value })}
                variant="filled"
                radius="md"
                size="md"
                leftSection={<IconAt size={16} />}
                required
              />

              <PasswordInput
                label="Contraseña"
                placeholder="••••••"
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.currentTarget.value })}
                variant="filled"
                radius="md"
                size="md"
                leftSection={<IconLock size={16} />}
                required
              />

              <Button
                type="submit"
                fullWidth
                loading={loading}
                size="md"
                radius="xl"
                color="dark"
                mt="sm"
              >
                Entrar al panel
              </Button>
            </Stack>
          </form>

          <Divider my="xl" />

          <Stack gap="xs">
            <Text size="sm" c="dimmed" ta={{ base: 'center', sm: 'left' }}>
              ¿Eres técnico?{' '}
              <Anchor href="/login/tecnico" fw={700} c="dark.4">
                Accede al portal de técnicos
              </Anchor>
            </Text>

            <Text size="sm" c="dimmed" ta={{ base: 'center', sm: 'left' }}>
              ¿Eres jugador de equipo?{' '}
              <Anchor href="/login" fw={700} c="dark.4">
                Accede al portal de jugadores
              </Anchor>
            </Text>
          </Stack>
        </Paper>

        {/* Enlaces legales discretos */}
        <Group justify="center" gap="xs" mt="lg">
          <Anchor href="/legal/aviso-legal" size="xs" c="#8d917a" underline="hover">
            Aviso Legal
          </Anchor>
          <Text size="xs" c="#c2c5b6">
            ·
          </Text>
          <Anchor href="/legal/privacidad" size="xs" c="#8d917a" underline="hover">
            Privacidad
          </Anchor>
          <Text size="xs" c="#c2c5b6">
            ·
          </Text>
          <Anchor href="/legal/cookies" size="xs" c="#8d917a" underline="hover">
            Cookies
          </Anchor>
        </Group>

        {/* Footer simple fuera de la tarjeta */}
        <Center mt="md">
          <Text size="xs" c="dimmed">
            © Nutralab
          </Text>
        </Center>
      </Container>
    </Box>
  );
}
