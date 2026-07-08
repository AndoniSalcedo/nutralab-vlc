'use client';

import { useState } from 'react';
import { initials } from '@/lib/utils';
import { env } from '@/lib/env';
import {
  IconChevronDown,
  IconLogout,
  IconReceipt,
  IconSettings,
  IconUserCog,
  IconUserStar,
  IconBook,
  IconUsersGroup,
} from '@tabler/icons-react';
import {
  Avatar,
  Box,
  Container,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { useRouter } from 'next/navigation';

import Logo from './Logo';


export default function DashboardShell({ children, user }) {
  const [opened, setOpened] = useState(false);
  const router = useRouter();
  const frontendUrl = env.NEXT_PUBLIC_FRONTEND_URL;
  const { hovered, ref } = useHover();
  const isActive = opened || hovered;


  return (
    <Box
      minHeight="100vh"
      pt="sm"
      bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
    >
      <Container size="lg" px={{ base: 'xs', sm: 'md' }}>
        <Group justify="space-between">
          <Logo />
          <Menu
            width={220}
            position="bottom-end"
            p={0}
            withinPortal
            transitionProps={{ transition: 'pop-top-right' }}
            opened={opened}
            onClose={() => setOpened(false)}
            onOpen={() => setOpened(true)}
          >
            <Menu.Target>
              <UnstyledButton
                ref={ref}
                c="light-dark(black, dark.0)"
                px={{ base: 'xs', xs: 'sm' }}
                py="xs"
                style={{
                  borderRadius: 'var(--mantine-radius-xl)',
                  transition: 'background-color 100ms ease',
                  backgroundColor: isActive
                    ? 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-8))'
                    : undefined,
                }}
              >
                <Group gap={2}>
                  <Avatar
                    src={undefined}
                    alt={user?.name || "Avatar"}
                    radius="xl"
                    size={42} >
                    {initials(user?.name || user?.username)}
                  </Avatar>
                  <Text fw={500} size="sm" lh={1} mr={2} visibleFrom="xs">
                    {user?.name || user?.username || ""}
                  </Text>
                  <IconChevronDown size={16} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconUsersGroup size={16} stroke={1.5} />}
                onClick={() => {
                  router.push('/dashboard');
                  setOpened(false);
                }}
              >
                Gestión de equipos
              </Menu.Item>

              <Menu.Item
                leftSection={<IconUserStar size={16} stroke={1.5} />}
                onClick={() => {
                  window.location.href = `${frontendUrl}/admin/nutritionists`;
                  setOpened(false);
                }}
              >
                Gestionar nutricionistas
              </Menu.Item>

              <Menu.Item
                leftSection={<IconUserCog size={16} stroke={1.5} />}
                onClick={() => {
                  window.location.href = `${frontendUrl}/users`;
                  setOpened(false);
                }}
              >
                Gestionar usuarios
              </Menu.Item>

              <Menu.Item
                leftSection={<IconReceipt size={16} stroke={1.5} />}
                onClick={() => {
                  window.location.href = `${frontendUrl}/recipes`;
                  setOpened(false);
                }}
              >
                Recetario
              </Menu.Item>

              <Menu.Item
                leftSection={<IconBook size={16} stroke={1.5} />}
                onClick={() => {
                  window.location.href = `${frontendUrl}/catalogs`;
                  setOpened(false);
                }}
              >
                Catálogos
              </Menu.Item>

              <Menu.Divider />
              <Menu.Item
                leftSection={<IconSettings size={16} stroke={1.5} />}
                onClick={() => {
                  window.location.href = `${frontendUrl}/settings`;
                  setOpened(false);
                }}
              >
                Configuración
              </Menu.Item>
              <Menu.Item
                leftSection={<IconLogout size={16} stroke={1.5} />}
                onClick={() => {
                  const form = document.getElementById('logout-form');
                  if (form && 'requestSubmit' in form) {
                    form.requestSubmit();
                  }
                }}
              >
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Container>

      <form id="logout-form" method="post" action="/api/logout" />

      <Container size="xl" px={{ base: 0, sm: 'md' }} pt={{ base: 'xs', sm: 'md' }} pb="md">
        {children}
      </Container>
    </Box>
  );
}
