'use client';

import { useState } from "react";
import {
  IconChevronDown,
  IconLogout,
  IconSettings,
  IconUserCog,
  IconUsersGroup,
  IconUserStar,
  IconShieldCheck,
} from "@/components/icons3d";
import {
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Menu,
  UnstyledButton,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { initials } from "@/lib/utils";
import { env } from "@/config/env";
import { logout } from "@/actions/authActions";

export default function DashboardShell({ children, user }) {
  const [opened, setOpened] = useState(false);
  const router = useRouter();
  const frontendUrl = env.NEXT_PUBLIC_FRONTEND_URL;
  const isAdmin = user?.role === "admin";
  const isTecnico = user?.role === "tecnico";

  const userAvatarSrc =
    user?.avatar_url ||
    user?.avatar ||
    (user?.role === "tecnico"
      ? `/api/media/tecnico-avatar?id=${user.id}`
      : user?.role === "jugador"
        ? `/api/media/player-avatar?id=${user.id}`
        : user?.role === "admin" && (user?.external_admin_id || user?.id)
          ? user?.avatar || undefined
          : undefined);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--mantine-color-gray-0)",
      }}
    >
      <Box
        component="header"
        style={{
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          backgroundColor: "var(--mantine-color-white)",
          paddingTop: "var(--mantine-spacing-xs)",
          paddingBottom: "var(--mantine-spacing-xs)",
        }}
      >
        <Container size="xl">
          <Group justify="space-between" align="center">
            <Logo href={user ? "/dashboard" : "/login"} width={180} />

            {user ? (
              <Menu
              width={240}
              position="bottom-end"
              withinPortal
              transitionProps={{ transition: "pop-top-right" }}
              opened={opened}
              onClose={() => setOpened(false)}
              onOpen={() => setOpened(true)}
            >
              <Menu.Target>
                <UnstyledButton
                  style={{
                    padding: "4px 8px",
                    borderRadius: "var(--mantine-radius-xl)",
                    transition: "background-color 150ms ease",
                    backgroundColor: opened ? "var(--mantine-color-gray-1)" : "transparent",
                  }}
                >
                  <Group gap={6}>
                    <Avatar
                      src={userAvatarSrc}
                      alt={user?.name}
                      radius="xl"
                      size={40}
                      color="nutralabColor"
                    >
                      {initials(user?.name || user?.username || user?.email || "N")}
                    </Avatar>
                    <IconChevronDown size={16} stroke={1.5} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconUsersGroup size={16} stroke={1.5} />}
                  onClick={() => {
                    router.push("/dashboard");
                    setOpened(false);
                  }}
                >
                  Gestión de equipos
                </Menu.Item>

                {isAdmin && (
                  <Menu.Item
                    leftSection={<IconUserCog size={16} stroke={1.5} />}
                    onClick={() => {
                      router.push("/dashboard/tecnicos");
                      setOpened(false);
                    }}
                  >
                    Gestión de técnicos
                  </Menu.Item>
                )}

                {!isTecnico && (
                  <>
                    <Menu.Item
                      leftSection={<IconUserCog size={16} stroke={1.5} />}
                      component="a"
                      href={`${frontendUrl}/dashboard/users`}
                      onClick={() => setOpened(false)}
                    >
                      Gestionar usuarios
                    </Menu.Item>

                    {isAdmin && (
                      <Menu.Item
                        leftSection={<IconUserStar size={16} stroke={1.5} />}
                        component="a"
                        href={`${frontendUrl}/dashboard/nutritionists`}
                        onClick={() => setOpened(false)}
                      >
                        Gestionar nutricionistas
                      </Menu.Item>
                    )}

                    <Menu.Divider />

                    <Menu.Item
                      leftSection={<IconSettings size={16} stroke={1.5} />}
                      component="a"
                      href={`${frontendUrl}/dashboard/settings`}
                      onClick={() => setOpened(false)}
                    >
                      Configuración
                    </Menu.Item>
                  </>
                )}

                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconShieldCheck size={16} stroke={1.5} />}
                  onClick={() => {
                    router.push('/legal');
                    setOpened(false);
                  }}
                >
                  Legal y Privacidad
                </Menu.Item>

                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} stroke={1.5} />}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            ) : (
              <Button
                component="a"
                href="/login"
                variant="light"
                color="nutralabColor"
                size="xs"
                radius="xl"
              >
                Iniciar sesión
              </Button>
            )}
          </Group>
        </Container>
      </Box>


      <Container size="xl" px={{ base: 0, sm: "md" }} pt={{ base: 0, sm: "md" }} pb="xl">
        {children}
      </Container>
    </Box>
  );
}
