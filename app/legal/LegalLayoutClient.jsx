'use client';

import { Box, Button, Group, Paper, Text } from '@mantine/core';
import { IconArrowLeft, IconCookie, IconFileText, IconShieldCheck } from '@/components/icons3d';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function LegalLayoutClient({ children }) {
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
    <Box style={{ width: '100%' }}>
      {/* Navegación por pestañas legales y botón volver */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <Group gap="xs" wrap="wrap">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant={active ? 'filled' : 'default'}
                size="xs"
                radius="xl"
                leftSection={item.icon}
                style={{
                  backgroundColor: active ? '#5c6049' : undefined,
                  color: active ? '#fff' : undefined,
                  fontWeight: active ? 600 : 500,
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Group>

        <Button
          variant="subtle"
          color="gray"
          size="xs"
          radius="xl"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/dashboard');
            }
          }}
        >
          Volver
        </Button>
      </Group>

      {/* Contenido principal */}
      <Paper
        radius={18}
        p={{ base: 'md', sm: 'xl' }}
        bg="#ffffff"
        style={{
          border: '1px solid var(--mantine-color-gray-2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        {children}
      </Paper>

      {/* Pie de página legal discreto */}
      <Box mt="xl" pt="md" pb="xl">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text size="xs" c="dimmed">
            © {new Date().getFullYear()} Nutralab VLC. Plataforma de monitorización y nutrición deportiva. Todos los derechos reservados.
          </Text>

          <Group gap="md">
            <Button
              variant="subtle"
              size="compact-xs"
              color="gray"
              onClick={handleOpenCookieModal}
              style={{ fontSize: 12 }}
            >
              Configuración de cookies
            </Button>
            <Text size="xs" c="dimmed">
              •
            </Text>
            <Text size="xs" c="dimmed">
              RGPD (UE 2016/679) & LSSI-CE
            </Text>
          </Group>
        </Group>
      </Box>
    </Box>
  );
}
