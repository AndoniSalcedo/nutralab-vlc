'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Anchor,
  Box,
  Button,
  Container,
  Image,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconLock, IconMail, IconArrowRight } from '@/components/icons3d';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { login } from '@/services/auth';
import { env } from '@/config/env';
import MascotAvatar from '@/components/mascot/MascotAvatar';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] = useState('idle');
  const router = useRouter();

  const typingTimerRef = useRef(null);
  const resetTimerRef = useRef(null);
  const frontendUrl = env.NEXT_PUBLIC_FRONTEND_URL;

  // Limpieza de temporizadores
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Foco en email: la mascota gira la mirada atentamente
  const handleEmailFocus = () => {
    if (loading) return;
    setMascotState('focus_email');
  };

  // Escritura en email: mueve las manitas mientras se teclea
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);

    if (loading) return;
    setMascotState('typing');

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setMascotState('focus_email');
    }, 750);
  };

  // Foco en contraseña: se tapa los ojos por privacidad 🙈
  const handlePasswordFocus = () => {
    if (loading) return;
    setMascotState('password');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (loading) return;
    setMascotState('password');
  };

  // Blur: vuelve a idle si se sale de los campos
  const handleBlur = (e) => {
    const related = e.relatedTarget;
    if (related && (related.name === 'email' || related.name === 'password')) {
      return;
    }
    if (!loading && mascotState !== 'success') {
      setMascotState('idle');
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMascotState('loading');

    try {
      await login(email, password, 'jugador');

      // Celebración exitosa
      setMascotState('success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      const isPasswordError =
        err?.message?.toLowerCase().includes('contraseña') ||
        err?.message?.toLowerCase().includes('password') ||
        err?.message?.toLowerCase().includes('credenciales');

      setMascotState(isPasswordError ? 'embarrassed' : 'confused');

      notifications.show({
        color: 'red',
        title: 'No se pudo iniciar sesión',
        message: err.message,
      });

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setMascotState('idle');
      }, 3000);
    } finally {
      setLoading(false);
    }
  }

  const getDynamicMessage = () => {
    if (mascotState === 'typing' || mascotState === 'focus_email') {
      const username = email.split('@')[0].trim();
      if (username.length > 0) {
        const capitalized = username.charAt(0).toUpperCase() + username.slice(1);
        const shortName = capitalized.length > 15 ? `${capitalized.slice(0, 14)}…` : capitalized;
        return `¡Encantado, ${shortName}! ✍️`;
      }
      return mascotState === 'typing' ? 'Escribiendo tu correo... ✍️' : 'Mirando tu correo... 👀';
    }
    if (mascotState === 'password') {
      return '¡Tranquilo, no miro tu contraseña! 🙈';
    }
    if (mascotState === 'loading') {
      return 'Comprobando acceso... ⏳';
    }
    if (mascotState === 'success') {
      return '¡Acceso correcto, bienvenido! 🎉';
    }
    if (mascotState === 'embarrassed') {
      return 'Ups... ¿revisamos la contraseña? 🥺';
    }
    if (mascotState === 'confused') {
      return '¿Algo no coincide? Vamos a revisarlo 🤔';
    }
    return '¡Hola! Soy Nutra, estoy aquí para acompañarte 🥑';
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at 50% 15%, #ffffff 0%, #faf7f2 55%, #f1ede3 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <Container size={410} w="100%" p={0}>
        {/* Tarjeta de login centrada con el logo dentro */}
        <Paper
          radius={24}
          p={{ base: 22, sm: 28 }}
          bg="rgba(255, 255, 255, 0.94)"
          style={{
            border: '1px solid rgba(141, 145, 122, 0.18)',
            boxShadow:
              '0 12px 40px rgba(60, 58, 48, 0.06), 0 2px 8px rgba(60, 58, 48, 0.03)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* 1. Logotipo dentro del recuadro */}
          <Box mb="xs" style={{ display: 'flex', justifyContent: 'center' }}>
            <Image src="/logo.png" alt="Nutralab" w={140} fit="contain" />
          </Box>

          {/* 2. Escenario de la Mascota Centrada */}
          <Box mb={6} style={{ display: 'flex', justifyContent: 'center' }}>
            <MascotAvatar
              state={mascotState}
              size={175}
              showSpeech={true}
              customMessage={getDynamicMessage()}
            />
          </Box>

          {/* 3. Título de acceso limpio */}
          <Box mb="md" ta="center">
            <Title order={2} fw={700} c="#373a2e" fz={20} lh={1.2}>
              Portal del jugador
            </Title>
          </Box>

          {/* 4. Formulario */}
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                name="email"
                placeholder="nombre@email.es"
                required
                autoComplete="email"
                leftSection={<IconMail size={16} />}
                value={email}
                onFocus={handleEmailFocus}
                onChange={handleEmailChange}
                onBlur={handleBlur}
                size="sm"
                radius="md"
                styles={{
                  label: {
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#5c6049',
                    marginBottom: 4,
                  },
                  input: {
                    backgroundColor: '#fcfcfb',
                    borderColor: 'rgba(141, 145, 122, 0.22)',
                    fontSize: 14,
                    '&:focus': {
                      borderColor: '#7a7d68',
                    },
                  },
                }}
              />

              <PasswordInput
                label="Contraseña"
                name="password"
                placeholder="Tu contraseña secreta"
                required
                autoComplete="current-password"
                leftSection={<IconLock size={16} />}
                value={password}
                onFocus={handlePasswordFocus}
                onChange={handlePasswordChange}
                onBlur={handleBlur}
                size="sm"
                radius="md"
                styles={{
                  label: {
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#5c6049',
                    marginBottom: 4,
                  },
                  input: {
                    backgroundColor: '#fcfcfb',
                    borderColor: 'rgba(141, 145, 122, 0.22)',
                    fontSize: 14,
                    '&:focus': {
                      borderColor: '#7a7d68',
                    },
                  },
                }}
              />

              <Button
                fullWidth
                mt={8}
                type="submit"
                size="sm"
                radius="xl"
                loading={loading}
                rightSection={<IconArrowRight size={16} />}
                style={{
                  backgroundColor: '#5c6049',
                  height: 42,
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(92, 96, 73, 0.2)',
                  transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                }}
              >
                Entrar
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Enlaces secundarios discretos y elegantes */}
        <Stack gap={5} mt="md" align="center">
          <Text size="xs" c="#7a7d68">
            ¿Eres técnico?{' '}
            <Anchor href="/login/tecnico" fw={600} c="#5c6049" underline="hover">
              Portal de técnicos
            </Anchor>
          </Text>

          <Text size="xs" c="#7a7d68">
            ¿Eres nutricionista?{' '}
            <Anchor href={`${frontendUrl}/login/nutritionist`} fw={600} c="#5c6049" underline="hover">
              Portal principal
            </Anchor>
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
