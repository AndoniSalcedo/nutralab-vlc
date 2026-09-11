'use client';

import { useState } from "react";
import {
  IconChevronDown,
  IconLogout,
  IconReceipt,
  IconSettings,
  IconUserCog,
  IconUsersGroup,
  IconUserStar,
  IconBook,
  IconApple,
} from "@tabler/icons-react";
import {
  Avatar,
  Box,
  Container,
  Group,
  Menu,
  UnstyledButton,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { initials } from "@/lib/utils";
import { env } from "@/config/env";

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
      ? `/api/tecnicos/avatar?id=${user.id}`
      : user?.role === "jugador"
        ? `/api/players/avatar?id=${user.id}`
        : undefined);

  const handleLogout = () => {
    const form = document.getElementById("logout-form");
    if (form && "requestSubmit" in form) {
      form.requestSubmit();
    }
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
            <Logo href="/dashboard" width={180} />

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

                    <Menu.Item
                      leftSection={<IconReceipt size={16} stroke={1.5} />}
                      component="a"
                      href={`${frontendUrl}/dashboard/recipes`}
                      onClick={() => setOpened(false)}
                    >
                      Recetario
                    </Menu.Item>

                    <Menu.Item
                      leftSection={<IconBook size={16} stroke={1.5} />}
                      component="a"
                      href={`${frontendUrl}/dashboard/catalogs`}
                      onClick={() => setOpened(false)}
                    >
                      Catálogos
                    </Menu.Item>

                    <Menu.Item
                      leftSection={<IconApple size={16} stroke={1.5} />}
                      component="a"
                      href={`${frontendUrl}/dashboard/foods`}
                      onClick={() => setOpened(false)}
                    >
                      Alimentos
                    </Menu.Item>

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

                {isTecnico && <Menu.Divider />}

                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} stroke={1.5} />}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Container>
      </Box>

      <form id="logout-form" method="post" action="/api/logout" />

      <Container size="xl" px={{ base: 0, sm: "md" }} pt={{ base: 0, sm: "md" }} pb="xl">
        {children}
      </Container>
    </Box>
  );
}
