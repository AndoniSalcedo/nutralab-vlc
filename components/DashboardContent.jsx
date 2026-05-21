'use client';

import { useState } from 'react';
import { Anchor, Group, Paper, SimpleGrid, Stack, Text, Title, ThemeIcon, Box, Table, ScrollArea, Avatar, Badge, ActionIcon, Menu, Modal, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCalendarEvent, IconDotsVertical, IconFlame, IconTrash, IconUsers, IconUserPlus, IconPencil, IconChartPie } from '@tabler/icons-react';
import DashboardActions from '@/components/DashboardActions';
import TeamEvolutionChart from '@/components/TeamEvolutionChart';
import NothingFound from '@/components/NothingFound/NothingFound';
import PlayerCredentialsButton from '@/components/PlayerCredentialsButton';
import PlayerForm from '@/components/PlayerForm';
import { cunninghamPlan } from '@/lib/calculations';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('');
}

function BentoCard({ title, icon: Icon, color = 'blue', children }) {
  return (
    <Paper radius="lg" p="md" shadow="sm" withBorder h="100%">
      <Group mb="md" gap="xs">
        <ThemeIcon color={color} variant="light" radius="md" size="md">
          <Icon size={16} stroke={1.5} />
        </ThemeIcon>
        <Text fw={700} c="dimmed" size="xs" tt="uppercase" lts={0.5}>
          {title}
        </Text>
      </Group>
      <Stack gap="sm">
        {children}
      </Stack>
    </Paper>
  );
}

function getPlayerPlan(player) {
  if (player.kcal_objetivo) {
    return { kcal: Number(player.kcal_objetivo), calculated: false };
  }

  const weightKg = Number(player.peso_kg || 0);
  if (!weightKg) return { kcal: null, calculated: false };

  const calc = cunninghamPlan({
    weightKg,
    bodyFatPct: player.porcentaje_grasa ? Number(player.porcentaje_grasa) : null,
    leanMassKg: player.masa_magra_kg ? Number(player.masa_magra_kg) : null,
    activityFactor: Number(player.factor_actividad || 1.6),
  });

  return { kcal: calc.kcal, calculated: true };
}

export default function DashboardContent({ players = [], teamEvolutions = [] }) {
  const [playersState, setPlayersState] = useState(players);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const totalPlayers = playersState.length;
  const playersWithPlan = playersState.map((player) => ({ ...player, plan: getPlayerPlan(player) }));
  const kcalValues = playersWithPlan.map((player) => player.plan.kcal).filter(Boolean);
  const avgKcal = kcalValues.length ? Math.round(kcalValues.reduce((a, kcal) => a + kcal, 0) / kcalValues.length) : 0;

  function updateCredentials(jugadorId, credentials) {
    setPlayersState((prev) => prev.map((player) => (
      String(player.id) === String(jugadorId)
        ? { ...player, ...credentials }
        : player
    )));
  }

  async function deletePlayer(player) {
    const ok = window.confirm(`¿Eliminar a ${player.nombre} ${player.apellidos || ''}?`);
    if (!ok) return;

    setDeletingId(player.id);
    try {
      const formData = new FormData();
      formData.append('id', player.id);
      const res = await fetch('/api/players?delete=1', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Error eliminando jugador');
      setPlayersState((prev) => prev.filter((item) => String(item.id) !== String(player.id)));
      notifications.show({
        color: 'green',
        title: 'Jugador eliminado',
        message: `${player.nombre} ${player.apellidos || ''}`.trim(),
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo eliminar',
        message: e.message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Stack gap="lg">
      {/* 1. HEADER FLOTANTE BENTO */}
      <Paper
        p="md"
        bg="white"
        shadow="xs"
        radius={24}
        style={{
          zIndex: 10,
          position: 'relative'
        }}
        mb="lg"
      >
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon color="dark" variant="light" radius="xl" size="lg">
              <IconUsers size={20} />
            </ThemeIcon>
            <Title order={3} fw={800} c="dark.4">
              Gestión de equipos
            </Title>
          </Group>

          <DashboardActions />
        </Group>
      </Paper>

      {/* 2. KPI CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        <BentoCard title="Jugadores activos" icon={IconUsers} color="blue">
          <Text fw={700} size="xl">{totalPlayers}</Text>
          <Text size="xs" c="dimmed">Plantilla en seguimiento</Text>
        </BentoCard>
        <BentoCard title="Kcal medio equipo" icon={IconFlame} color="orange">
          <Text fw={700} size="xl">{avgKcal || '—'}</Text>
          <Text size="xs" c="dimmed">Promedio diario estimado</Text>
        </BentoCard>
        <BentoCard title="Menú esta semana" icon={IconCalendarEvent} color="teal">
          <Anchor href="/dashboard/menu" fw={600} style={{ width: 'fit-content' }}>
            Ver menú →
          </Anchor>
          <Text size="xs" c="dimmed">Sube foto o PDF del comedor</Text>
        </BentoCard>
      </SimpleGrid>

      {/* 3. GRÁFICO EVOLUTIVO DEL EQUIPO */}
      {teamEvolutions.length > 0 && (
        <TeamEvolutionChart teamEvolutions={teamEvolutions} />
      )}

      {/* 4. LISTADO DE JUGADORES (TABLA) */}
      <Box mt="md">
        <Title order={4} mb="md">Plantilla</Title>
        {playersState.length > 0 ? (
          <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
            <ScrollArea>
              <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ paddingLeft: 24 }}>Jugador</Table.Th>
                    <Table.Th visibleFrom="xs">Métricas Base</Table.Th>
                    <Table.Th visibleFrom="sm">Kcal Objetivo</Table.Th>
                    <Table.Th>Posición</Table.Th>
                    <Table.Th w={70} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {playersWithPlan.map((player) => (
                    <Table.Tr
                      h={75}
                      key={player.id}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* COLUMNA 1: JUGADOR */}
                      <Table.Td style={{ paddingLeft: 24 }}>
                        <Anchor href={`/dashboard/jugador/${player.id}`} underline="never" c="inherit">
                          <Group gap="sm" wrap="nowrap">
                            <Avatar size={42} radius="xl" color="initials">
                              {initials(`${player.nombre} ${player.apellidos || ''}`)}
                            </Avatar>
                            <div>
                              <Group gap={6} wrap="nowrap">
                                <Text fz="sm" fw={600} c="dark.4">
                                  {player.nombre} {player.apellidos}
                                </Text>
                                {!player.auth_user_id && (
                                  <Tooltip label="El usuario no tiene credenciales para entrar" withArrow>
                                    <ThemeIcon color="yellow" variant="light" radius="xl" size="sm">
                                      <IconAlertTriangle size={14} />
                                    </ThemeIcon>
                                  </Tooltip>
                                )}
                              </Group>
                            </div>
                          </Group>
                        </Anchor>
                      </Table.Td>

                      {/* COLUMNA 2: MÉTRICAS */}
                      <Table.Td visibleFrom="xs">
                        <Anchor href={`/dashboard/jugador/${player.id}`} underline="never" c="inherit">
                          <Group gap={6}>
                            <IconChartPie size={14} style={{ opacity: 0.5 }} />
                            <Text fz="sm" fw={500} c="dark.4">
                              {player.peso_kg ? `${player.peso_kg} kg` : '—'}
                              {player.porcentaje_grasa ? ` · ${player.porcentaje_grasa}% GC` : ''}
                            </Text>
                          </Group>
                        </Anchor>
                      </Table.Td>

                      {/* COLUMNA 3: KCAL OBJETIVO */}
                      <Table.Td visibleFrom="sm">
                        <Anchor href={`/dashboard/jugador/${player.id}`} underline="never" c="inherit">
                          {player.plan.kcal ? (
                            <Group gap={6}>
                              <IconFlame size={14} style={{ opacity: 0.5 }} color="var(--mantine-color-orange-6)" />
                              <Text fz="sm" fw={500} c="dark.4">
                                {player.plan.kcal} kcal
                                {player.plan.calculated ? ' · estimado' : ''}
                              </Text>
                            </Group>
                          ) : (
                            <Text fz="sm" c="dimmed">—</Text>
                          )}
                        </Anchor>
                      </Table.Td>

                      {/* COLUMNA 4: POSICIÓN */}
                      <Table.Td>
                        <Anchor href={`/dashboard/jugador/${player.id}`} underline="never" c="inherit">
                          <Badge variant="light" color="gray" radius="sm">
                            {player.posicion || 'Sin posición'}
                          </Badge>
                        </Anchor>
                      </Table.Td>

                      {/* COLUMNA 5: ACCIONES */}
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <Menu shadow="md" width={220} position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray" radius="xl" loading={deletingId === player.id}>
                                <IconDotsVertical size={18} stroke={1.5} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item leftSection={<IconPencil size={14} />} component="a" href={`/dashboard/jugador/${player.id}`}>
                                Ver ficha
                              </Menu.Item>
                              <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => setEditingPlayer(player)}>
                                Editar
                              </Menu.Item>
                              <PlayerCredentialsButton
                                jugador={player}
                                menuItem
                                onSaved={(credentials) => updateCredentials(player.id, credentials)}
                              />
                              <Menu.Divider />
                              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => deletePlayer(player)}>
                                Eliminar
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        ) : (
          <NothingFound
            withPaper
            icon={IconUserPlus}
            title="Sin jugadores"
            description="Importa un Excel o añade un jugador manualmente para empezar."
          />
        )}
      </Box>

      <Modal opened={!!editingPlayer} onClose={() => setEditingPlayer(null)} title="Editar jugador" size="xl">
        {editingPlayer && <PlayerForm initial={editingPlayer} />}
      </Modal>
    </Stack>
  );
}
