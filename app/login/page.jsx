'use client';

import { useState } from 'react';
import { Container, Paper, Title, Text, TextInput, PasswordInput, Button, Stack, Center, Box, ThemeIcon, Alert, Anchor } from '@mantine/core';
import { IconLock, IconMail, IconShieldCheck, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales incorrectas');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container size={440}>
        <Center mb="xl">
          <ThemeIcon size={72} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 135 }}>
            <IconShieldCheck size={36} stroke={1.5} />
          </ThemeIcon>
        </Center>
        <Title ta="center" order={2} fw={800} c="dark.7">
          Portal del Jugador
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
          Accede con las credenciales que te ha facilitado tu nutricionista
        </Text>

        <Paper withBorder shadow="lg" p={32} radius="lg" bg="white">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && (
                <Alert color="red" icon={<IconAlertCircle size={16} />} radius="md">
                  {error}
                </Alert>
              )}

              <TextInput
                label="Email"
                name="email"
                placeholder="tu.email@ejemplo.com"
                required
                autoComplete="email"
                leftSection={<IconMail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="xs"
                radius="md"
              />
              <PasswordInput
                label="Contraseña"
                name="password"
                placeholder="Tu contraseña"
                required
                autoComplete="current-password"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="md"
                radius="md"
              />
              <Button
                fullWidth
                mt="lg"
                type="submit"
                size="xs"
                radius="xl"
                loading={loading}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan', deg: 135 }}
              >
                Entrar
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text ta="center" size="xs" c="dimmed" mt="xl">
          ¿Eres nutricionista?{' '}
          <Anchor href={`${frontendUrl}/login`} fw={600} inherit>
            Accede al portal de Nutralab principal
          </Anchor>
        </Text>
      </Container>
    </Box>
  );
}
