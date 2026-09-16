'use client';

import { Box, Button, Container, Group, Paper, Text } from '@mantine/core';
import { IconArrowLeft, IconCookie, IconFileText, IconShieldCheck } from '@/components/icons3d';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LegalLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Política de Cookies',
      href: '/legal/cookies',
      icon: <IconCookie size={16} stroke={1.7} />,
    },
    {
      label: 'Política de Privacidad',
      href: '/legal/privacidad',
      icon: <IconShieldCheck size={16} stroke={1.7} />,
    },
    {
      label: 'Aviso Legal y Condiciones',
      href: '/legal/aviso-legal',
      icon: <IconFileText size={16} stroke={1.7} />,
    },
  ];

  const handleOpenCookieModal = () => {
    window.dispatchEvent(new CustomEvent('nutralab_open_cookie_preferences'));
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: '#faf7f2',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cabecera Legal */}
      <Box
        component="header"
        style={{
          borderBottom: '1px solid rgba(141, 145, 122, 0.18)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg" py="sm">
          <Group justify="space-between" align="center">
            <Group gap="md">
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                radius="xl"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/login');
                  }
                }}
                style={{
                  color: '#5c6049',
                }}
              >
                Volver
              </Button>
              <Logo href="/dashboard" width={140} />
            </Group>

            <Text size="xs" fw={600} c="#7a7d68">
              Centro Legal y Privacidad
            </Text>
          </Group>
        </Container>
      </Box>

      {/* Navegación por pestañas legales */}
      <Box
        style={{
          borderBottom: '1px solid rgba(141, 145, 122, 0.12)',
          backgroundColor: '#fff',
        }}
      >
        <Container size="lg" py="xs">
          <Group gap="xs" wrap="wrap">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  variant={active ? 'filled' : 'subtle'}
                  size="xs"
                  radius="xl"
                  leftSection={item.icon}
                  style={{
                    backgroundColor: active ? '#5c6049' : 'transparent',
                    color: active ? '#fff' : '#5c6049',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Group>
        </Container>
      </Box>

      {/* Contenido principal */}
      <Container size="lg" py={{ base: 'md', sm: 'xl' }} style={{ flex: 1 }}>
        <Paper
          radius={20}
          p={{ base: 'md', sm: 'xl' }}
          bg="#ffffff"
          style={{
            border: '1px solid rgba(141, 145, 122, 0.18)',
            boxShadow: '0 8px 30px rgba(45, 48, 35, 0.04)',
          }}
        >
          {children}
        </Paper>
      </Container>

      {/* Pie de página legal */}
      <Box
        component="footer"
        py="lg"
        style={{
          borderTop: '1px solid rgba(141, 145, 122, 0.15)',
          backgroundColor: '#f1ede3',
          marginTop: 'auto',
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Text size="xs" c="#7a7d68">
              © {new Date().getFullYear()} Nutralab VLC. Plataforma de monitorización y nutrición deportiva. Todos los derechos reservados.
            </Text>

            <Group gap="md">
              <Button
                variant="subtle"
                size="compact-xs"
                c="#5c6049"
                onClick={handleOpenCookieModal}
                style={{ fontSize: 12 }}
              >
                Configuración de cookies
              </Button>
              <Text size="xs" c="#c2c5b6">
                •
              </Text>
              <Text size="xs" c="#7a7d68">
                RGPD (UE 2016/679) & LSSI-CE
              </Text>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
