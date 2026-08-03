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
import { login } from '@/services/auth';
import { env } from '@/config/env';
import { useMediaQuery } from '@mantine/hooks';

const highlights = [
  { icon: IconSalad, label: 'Plan nutricional', value: 'seguimiento diario' },
  { icon: IconDroplet, label: 'Hidratación', value: 'pautas de partido' },
  { icon: IconActivityHeartbeat, label: 'Métricas', value: 'evolución visible' },
];

export default function LoginForm() {
  const isMobile = useMediaQuery('(max-width: 62em)');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const frontendUrl = env.NEXT_PUBLIC_FRONTEND_URL;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);

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
          shadow={{ base: 'none', md: 'xl' }}
          radius={{ base: 0, md: 28 }}
          p={{ base: 0, md: 26 }}
          bg={{ base: 'transparent', md: 'rgba(255,255,255,0.82)' }}
          bd={{ base: 'none', md: '1px solid rgba(108,112,90,0.18)' }}
          style={{
            overflow: 'hidden',
            backdropFilter: isMobile ? 'none' : 'blur(18px)',
          }}
        >
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="0">
            <Box
              visibleFrom="md"
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
              p={{ base: 0, md: 34 }}
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Paper
                withBorder={!isMobile}
                radius={{ base: 0, md: 20 }}
                p={{ base: 0, sm: 30 }}
                w="100%"
                maw={450}
                mx="auto"
                bg={{ base: 'transparent', md: 'white' }}
                style={{
                  borderColor: 'rgba(108,112,90,0.2)',
                  boxShadow: isMobile ? 'none' : '0 18px 60px rgba(36,41,31,0.12)',
                }}
              >
                {/* Cabecera móvil */}
                <Stack align="center" gap="xs" mb="lg" hiddenFrom="md">
                  <Image
                    src="/logo.png"
                    alt="Nutralab"
                    w={170}
                    fit="contain"
                    mb="xs"
                  />
                  <Badge
                    variant="light"
                    color="nutralabColor"
                    radius="sm"
                    leftSection={<IconShieldCheck size={14} />}
                    mb="xs"
                  >
                    Acceso privado
                  </Badge>
                  <Title order={2} fw={850} c="#24291f" ta="center">
                    Portal del jugador
                  </Title>
                  <Text c="dimmed" size="sm" ta="center" px="xs" mb="sm">
                    Entra con las credenciales de tu nutricionista para revisar tu seguimiento.
                  </Text>
                </Stack>

                {/* Cabecera desktop */}
                <Group justify="space-between" align="flex-start" mb="xl" visibleFrom="md">
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

                <Stack gap="xs">
                  <Text size="sm" c="dimmed" ta={{ base: 'center', sm: 'left' }}>
                    ¿Eres técnico?{' '}
                    <Anchor href="/login/tecnico" fw={700} c="#5c6049">
                      Accede al portal de técnicos
                    </Anchor>
                  </Text>

                  <Text size="sm" c="dimmed" ta={{ base: 'center', sm: 'left' }}>
                    ¿Eres nutricionista?{' '}
                    <Anchor href={`${frontendUrl}/login`} fw={700} c="#5c6049">
                      Accede al portal principal
                    </Anchor>
                  </Text>
                </Stack>
              </Paper>
            </Box>
          </SimpleGrid>
        </Paper>
      </Container>
    </Box>
  );
}
