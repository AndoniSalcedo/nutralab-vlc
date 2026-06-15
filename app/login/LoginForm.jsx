'use client';

import { useState } from 'react';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconActivityHeartbeat,
  IconArrowRight,
  IconDroplet,
  IconLock,
  IconMail,
  IconSalad,
  IconShieldCheck,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

const highlights = [
  { icon: IconSalad, label: 'Plan nutricional', value: 'seguimiento diario' },
  { icon: IconDroplet, label: 'Hidratación', value: 'pautas de partido' },
  { icon: IconActivityHeartbeat, label: 'Métricas', value: 'evolución visible' },
];

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales incorrectas');
      }

      router.push('/dashboard');
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'No se pudo iniciar sesión',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(141,145,122,0.22), transparent 30%), linear-gradient(135deg, #f7f8f3 0%, #edf1eb 46%, #dfe8e5 100%)',
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(20px, 4vw, 56px) 0',
      }}
    >
      <Container size="lg" px={{ base: 'md', sm: 'xl' }}>
        <Paper
          shadow="xl"
          radius={28}
          p={{ base: 18, sm: 26 }}
          style={{
            overflow: 'hidden',
            border: '1px solid rgba(108,112,90,0.18)',
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
            <Box
              p={{ base: 10, sm: 22, md: 34 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 500,
              }}
            >
              <Box>
                <Image src="/logo.png" alt="Nutralab" w={190} fit="contain" mb={44} />
                <Badge
                  variant="light"
                  color="nutralabColor"
                  radius="sm"
                  leftSection={<IconShieldCheck size={14} />}
                >
                  Acceso privado
                </Badge>
                <Title order={1} mt="lg" fw={850} c="#24291f" lh={1.05}>
                  Portal del jugador
                </Title>
                <Text c="#5c6049" size="lg" mt="md" maw={430}>
                  Consulta tu plan, métricas y pautas de nutrición con las credenciales que te ha facilitado tu nutricionista.
                </Text>
              </Box>

              <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm" mt={{ base: 34, md: 0 }}>
                {highlights.map(({ icon: Icon, label, value }) => (
                  <Paper key={label} radius="md" p="md" bg="#f6f7f1" withBorder>
                    <ThemeIcon variant="light" color="nutralabColor" radius="md" size={36}>
                      <Icon size={20} stroke={1.7} />
                    </ThemeIcon>
                    <Text size="sm" fw={700} mt="sm" c="#24291f">
                      {label}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      {value}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>

            <Box
              p={{ base: 10, sm: 22, md: 34 }}
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Paper
                withBorder
                radius={20}
                p={{ base: 22, sm: 30 }}
                w="100%"
                style={{
                  borderColor: 'rgba(108,112,90,0.2)',
                  boxShadow: '0 18px 60px rgba(36,41,31,0.12)',
                }}
              >
                <Group justify="space-between" align="flex-start" mb="xl">
                  <Box>
                    <Title order={2} fw={800} c="#24291f">
                      Iniciar sesión
                    </Title>
                    <Text c="dimmed" size="sm" mt={4}>
                      Entra para revisar tu seguimiento.
                    </Text>
                  </Box>
                  <ThemeIcon size={46} radius="md" color="nutralabColor" variant="light">
                    <IconShieldCheck size={24} stroke={1.6} />
                  </ThemeIcon>
                </Group>

                <form onSubmit={handleSubmit}>
                  <Stack gap="md">
                    <TextInput
                      label="Email"
                      name="email"
                      placeholder="tu.email@ejemplo.com"
                      required
                      autoComplete="email"
                      leftSection={<IconMail size={18} />}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="md"
                      radius="md"
                    />
                    <PasswordInput
                      label="Contraseña"
                      name="password"
                      placeholder="Tu contraseña"
                      required
                      autoComplete="current-password"
                      leftSection={<IconLock size={18} />}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="md"
                      radius="md"
                    />
                    <Button
                      fullWidth
                      mt="sm"
                      type="submit"
                      size="md"
                      radius="xl"
                      loading={loading}
                      color="nutralabColor.8"
                      rightSection={<IconArrowRight size={18} />}
                    >
                      Entrar
                    </Button>
                  </Stack>
                </form>

                <Divider my="xl" />

                <Text size="sm" c="dimmed">
                  ¿Eres nutricionista?{' '}
                  <Anchor href={`${frontendUrl}/login`} fw={700} c="#5c6049">
                    Accede al portal principal
                  </Anchor>
                </Text>
              </Paper>
            </Box>
          </SimpleGrid>
        </Paper>
      </Container>
    </Box>
  );
}
