'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Group, Image, Paper, Progress, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconHome, IconRefresh } from '@tabler/icons-react';
import MascotAvatar from '@/components/mascot/MascotAvatar';

const REDIRECT_SECONDS = 10;

/**
 * Pantalla genérica para 404 y errores inesperados.
 * Muestra a Nutra, una cuenta atrás y redirige a "/" (que decide destino según sesión/rol).
 */
export default function StatusScreen({ code, title, message, mascotState = 'confused', speech, onRetry }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace('/');
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, router]);

  const goHome = () => router.replace('/');

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else goHome();
  };

  return (
    <Box
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(ellipse at 50% 15%, #ffffff 0%, #faf7f2 55%, #f1ede3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <Container size={440} w="100%" p={0}>
        <Paper
          radius={24}
          p={{ base: 22, sm: 28 }}
          bg="rgba(255, 255, 255, 0.94)"
          style={{
            border: '1px solid rgba(141, 145, 122, 0.18)',
            boxShadow: '0 12px 40px rgba(60, 58, 48, 0.06), 0 2px 8px rgba(60, 58, 48, 0.03)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Box mb="xs" style={{ display: 'flex', justifyContent: 'center' }}>
            <Image src="/logo.png" alt="Nutralab" w={120} fit="contain" />
          </Box>

          <Box mb={6} style={{ display: 'flex', justifyContent: 'center' }}>
            <MascotAvatar state={mascotState} size={160} showSpeech customMessage={speech} />
          </Box>

          <Stack gap={6} align="center" ta="center" mb="md">
            <Text
              fw={800}
              lh={1}
              style={{
                fontSize: 56,
                letterSpacing: '-0.04em',
                background: 'linear-gradient(135deg, #8d917a 0%, #5c6049 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {code}
            </Text>
            <Title order={2} fw={700} c="#373a2e" fz={20} lh={1.2}>
              {title}
            </Title>
            <Text size="sm" c="#7a7d68" maw={320}>
              {message}
            </Text>
          </Stack>

          <Stack gap="xs">
            <Button
              fullWidth
              radius="xl"
              leftSection={<IconHome size={16} />}
              onClick={goHome}
              style={{
                backgroundColor: '#5c6049',
                height: 42,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(92, 96, 73, 0.2)',
              }}
            >
              Ir al inicio
            </Button>

            <Group grow gap="xs">
              <Button variant="light" color="gray" radius="xl" leftSection={<IconArrowLeft size={16} />} onClick={goBack}>
                Volver atrás
              </Button>
              {onRetry && (
                <Button variant="light" color="gray" radius="xl" leftSection={<IconRefresh size={16} />} onClick={onRetry}>
                  Reintentar
                </Button>
              )}
            </Group>
          </Stack>

          <Stack gap={6} mt="md" pt="sm" style={{ borderTop: '1px solid rgba(141, 145, 122, 0.12)' }}>
            <Text size="xs" c="dimmed" ta="center">
              Te llevamos al inicio en <b>{Math.max(secondsLeft, 0)}s</b>
            </Text>
            <Progress
              value={((REDIRECT_SECONDS - secondsLeft) / REDIRECT_SECONDS) * 100}
              size={4}
              radius="xl"
              color="#8d917a"
              transitionDuration={1000}
            />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
