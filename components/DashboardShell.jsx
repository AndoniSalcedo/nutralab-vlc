'use client';

import { useState } from 'react';
import { initials } from '@/lib/utils';
import { env } from '@/config/env';
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
  Container,
  Group,
  Menu,
  UnstyledButton,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import cx from 'clsx';

import classes from './DashboardShell.module.css';
import Logo from './Logo';


export default function DashboardShell({ children, user }) {
  const [opened, setOpened] = useState(false);
  const router = useRouter();
  const frontendUrl = env.NEXT_PUBLIC_FRONTEND_URL;


  const userAvatarSrc =
    user?.avatar_url ||
    (user?.role === 'tecnico'
      ? `/api/tecnicos/avatar?id=${user.id}`
      : user?.role === 'jugador'
        ? `/api/players/avatar?id=${user.id}`
        : undefined);

  return (
    <div className={classes.header}>
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
                className={cx(classes.user, { [classes.userActive]: opened })}
              >
                <Group gap={2}>
                  <Avatar
                    src={userAvatarSrc}
                    alt={user?.name}
                    radius="xl"
                    size={42} 
                  >
                    {initials(user?.name || user?.username || user?.email)}
                  </Avatar>
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

              {user?.role === 'admin' && (
                <>
                  <Menu.Item
                    leftSection={<IconUserCog size={16} stroke={1.5} />}
                    onClick={() => {
                      router.push('/dashboard/tecnicos');
                      setOpened(false);
                    }}
                  >
                    Gestión de técnicos
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconUserStar size={16} stroke={1.5} />}
                    component="a"
                    href={`${frontendUrl}/admin/nutritionists`}
                    onClick={() => setOpened(false)}
                  >
                    Gestionar nutricionistas
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconUserCog size={16} stroke={1.5} />}
                    component="a"
                    href={`${frontendUrl}/users`}
                    onClick={() => setOpened(false)}
                  >
                    Gestionar usuarios
                  </Menu.Item>
                </>
              )}

              {user?.role !== 'tecnico' && (
                <>
                  <Menu.Item
                    leftSection={<IconReceipt size={16} stroke={1.5} />}
                    component="a"
                    href={`${frontendUrl}/recipes`}
                    onClick={() => setOpened(false)}
                  >
                    Recetario
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconBook size={16} stroke={1.5} />}
                    component="a"
                    href={`${frontendUrl}/catalogs`}
                    onClick={() => setOpened(false)}
                  >
                    Catálogos
                  </Menu.Item>
                </>
              )}

              <Menu.Divider />
              {user?.role !== 'tecnico' && (
                <Menu.Item
                  leftSection={<IconSettings size={16} stroke={1.5} />}
                  component="a"
                  href={`${frontendUrl}/settings`}
                  onClick={() => setOpened(false)}
                >
                  Configuración
                </Menu.Item>
              )}
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
    </div>
  );
}
