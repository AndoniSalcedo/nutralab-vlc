'use client';

import { useEffect, useMemo, useState } from 'react';
import { Anchor, Group, Paper, SimpleGrid, Stack, Text, Title, ThemeIcon, Box, Table, ScrollArea, Avatar, Badge, ActionIcon, Menu, Modal, Tooltip, TextInput, Select, Pagination } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCalendarEvent, IconDots, IconFlame, IconMail, IconSearch, IconTrash, IconUsers, IconUserPlus, IconPencil } from '@tabler/icons-react';
import DashboardActions from '@/components/DashboardActions';
import TeamEvolutionChart from '@/components/TeamEvolutionChart';
import NothingFound from '@/components/NothingFound/NothingFound';
import PlayerCredentialsButton from '@/components/PlayerCredentialsButton';
import PlayerForm from '@/components/PlayerForm';
import { cunninghamPlan } from '@/lib/calculations';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 8;

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('');
}

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

function DashboardStat({ title, icon: Icon, color = 'blue', value, description, href }) {
  const content = (
    <Box
      px={{ base: 'sm', sm: 'md' }}
      py="xs"
      style={{
        height: '100%',
        minHeight: 62,
        borderRadius: 14,
        background: 'rgba(248,249,245,0.82)',
        border: '1px solid rgba(222,226,230,0.9)',
        transition: 'border-color 120ms ease, transform 120ms ease',
      }}
    >
      <Group gap="sm" wrap="nowrap" align="center">
        <ThemeIcon color={color} variant="light" radius="md" size={34} style={{ flex: '0 0 auto' }}>
          <Icon size={18} stroke={1.6} />
        </ThemeIcon>
        <Box style={{ minWidth: 0 }}>
          <Text fw={750} c="dimmed" size="xs" tt="uppercase" lts={0.5} truncate>
            {title}
          </Text>
          <Group gap={8} align="baseline" wrap="nowrap">
            <Text fw={800} size="lg" c="#24291f" lh={1.1} truncate>
              {value}
            </Text>
            <Text size="xs" c="dimmed" truncate visibleFrom="xs">
              {description}
            </Text>
          </Group>
        </Box>
      </Group>
    </Box>
  );

  if (!href) return content;

  return (
    <Anchor href={href} underline="never" c="inherit">
      {content}
    </Anchor>
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
  const router = useRouter();
  const [playersState, setPlayersState] = useState(players);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({ name: '', email: '', position: '' });
  const [page, setPage] = useState(1);
  const totalPlayers = playersState.length;
  const playersWithPlan = playersState.map((player) => ({ ...player, plan: getPlayerPlan(player) }));
  const positionOptions = useMemo(() => {
    const positions = Array.from(new Set(playersState.map((player) => player.posicion).filter(Boolean))).sort();
    return [
      { value: '', label: 'Todas' },
      ...positions.map((position) => ({ value: position, label: position })),
    ];
  }, [playersState]);
  const filteredPlayers = useMemo(() => {
    const name = normalize(filters.name);
    const email = normalize(filters.email);
    const position = filters.position;

    return playersWithPlan.filter((player) => {
      const fullName = normalize(`${player.nombre || ''} ${player.apellidos || ''}`);
      const playerEmail = normalize(player.auth_email);
      const playerPosition = player.posicion || '';

      return (
        (!name || fullName.includes(name)) &&
        (!email || playerEmail.includes(email)) &&
        (!position || playerPosition === position)
      );
    });
  }, [filters.email, filters.name, filters.position, playersWithPlan]);
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));
  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPlayers.slice(start, start + PAGE_SIZE);
  }, [filteredPlayers, page]);
  const kcalValues = playersWithPlan.map((player) => player.plan.kcal).filter(Boolean);
  const avgKcal = kcalValues.length ? Math.round(kcalValues.reduce((a, kcal) => a + kcal, 0) / kcalValues.length) : 0;

  useEffect(() => {
    setPage(1);
  }, [filters.email, filters.name, filters.position]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

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
      {/* 1. RESUMEN / ACCIONES */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative'
        }}
      >
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm">
              <ThemeIcon color="dark" variant="light" radius="xl" size={42}>
                <IconUsers size={21} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={850} c="#24291f" lh={1.1}>
                  Gestión de equipos
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  Control de plantilla, cálculos y cargas nutricionales.
                </Text>
              </Box>
            </Group>

            <DashboardActions players={playersState} />
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
            <DashboardStat
              title="Jugadores activos"
              icon={IconUsers}
              color="blue"
              value={totalPlayers}
              description="Plantilla en seguimiento"
            />
            <DashboardStat
              title="Kcal medio equipo"
              icon={IconFlame}
              color="orange"
              value={avgKcal || '—'}
              description="Promedio diario estimado"
            />
            <DashboardStat
              title="Menú esta semana"
              icon={IconCalendarEvent}
              color="teal"
              value="Ver menú →"
              description="Sube foto o PDF del comedor"
              href="/dashboard/menu"
            />
          </SimpleGrid>

          <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <TextInput
                placeholder="Buscar por nombre"
                leftSection={<IconSearch size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                value={filters.name}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setFilters((current) => ({ ...current, name: value }));
                }}
                style={{ flex: 2, minWidth: 190 }}
              />
              <TextInput
                placeholder="Buscar por email"
                leftSection={<IconMail size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                value={filters.email}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setFilters((current) => ({ ...current, email: value }));
                }}
                style={{ flex: 2, minWidth: 190 }}
              />
              <Select
                placeholder="Posición"
                leftSection={<IconUsers size={16} style={{ opacity: 0.7 }} />}
                data={positionOptions}
                value={filters.position}
                onChange={(value) => setFilters((current) => ({ ...current, position: value || '' }))}
                variant="filled"
                radius="xl"
                size="sm"
                allowDeselect={false}
                style={{ flex: 1, minWidth: 150 }}
              />
            </Group>
          </Paper>
        </Stack>
      </Paper>

      {/* 2. GRÁFICO EVOLUTIVO DEL EQUIPO */}
      {teamEvolutions.length > 0 && (
        <TeamEvolutionChart teamEvolutions={teamEvolutions} />
      )}

      {/* 3. LISTADO DE JUGADORES (TABLA) */}
      <Box>
        {filteredPlayers.length > 0 ? (
          <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
            <ScrollArea>
              <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ paddingLeft: 24 }}>Jugador</Table.Th>
                    <Table.Th visibleFrom="xs">Métricas</Table.Th>
                    <Table.Th visibleFrom="sm">Plan</Table.Th>
                    <Table.Th>Posición</Table.Th>
                    <Table.Th w={70} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedPlayers.map((player) => (
                    <Table.Tr
                      h={75}
                      key={player.id}
                      onClick={() => router.push(`/dashboard/jugador/${player.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* COLUMNA 1: JUGADOR */}
                      <Table.Td style={{ paddingLeft: 24 }}>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar size={42} radius="xl" color="initials">
                            {initials(`${player.nombre} ${player.apellidos || ''}`)}
                          </Avatar>
                          <Box style={{ minWidth: 0 }}>
                            <Group gap={6} wrap="nowrap">
                              <Text fz="sm" fw={600} c="dark.4" truncate>
                                {player.nombre} {player.apellidos}
                              </Text>
                              {!player.auth_user_id && (
                                <Tooltip label="El usuario no tiene credenciales para entrar" withArrow>
                                  <ThemeIcon color="yellow" variant="light" radius="xl" size="sm" style={{ flex: '0 0 auto' }}>
                                    <IconAlertTriangle size={14} />
                                  </ThemeIcon>
                                </Tooltip>
                              )}
                            </Group>
                            <Text c="dimmed" fz="xs" style={{ lineHeight: 1 }} truncate>
                              {player.auth_email || 'Sin credenciales de acceso'}
                            </Text>
                          </Box>
                        </Group>
                      </Table.Td>

                      {/* COLUMNA 2: MÉTRICAS */}
                      <Table.Td visibleFrom="xs">
                        {player.peso_kg || player.porcentaje_grasa ? (
                          <>
                            <Text fz="sm" fw={500} c="dark.4">
                              {player.peso_kg ? `${player.peso_kg} kg` : '—'}
                              {player.porcentaje_grasa ? ` · ${player.porcentaje_grasa}% GC` : ''}
                            </Text>
                            <Text fz="xs" c="dimmed">Composición</Text>
                          </>
                        ) : (
                          <Text fz="sm" c="dimmed">—</Text>
                        )}
                      </Table.Td>

                      {/* COLUMNA 3: KCAL OBJETIVO */}
                      <Table.Td visibleFrom="sm">
                        {player.plan.kcal ? (
                          <Group gap={6} wrap="nowrap">
                            <IconFlame size={14} style={{ opacity: 0.5 }} color="var(--mantine-color-orange-6)" />
                            <Box>
                              <Text fz="sm" fw={500} c="dark.4" lh={1.2}>
                                {player.plan.kcal} kcal
                              </Text>
                              <Text fz="xs" c="dimmed">
                                {player.plan.calculated ? 'Estimado' : 'Objetivo'}
                              </Text>
                            </Box>
                          </Group>
                        ) : (
                          <Text fz="sm" c="dimmed">—</Text>
                        )}
                      </Table.Td>

                      {/* COLUMNA 4: POSICIÓN */}
                      <Table.Td>
                        <Badge variant="light" color="gray" radius="sm">
                          {player.posicion || 'Sin posición'}
                        </Badge>
                      </Table.Td>

                      {/* COLUMNA 5: ACCIONES */}
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <Menu shadow="md" width={220} position="bottom-end" withArrow radius="md">
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                radius="xl"
                                loading={deletingId === player.id}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <IconDots size={18} stroke={1.5} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown onClick={(event) => event.stopPropagation()}>
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

            <Group justify="center" p="md" bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                radius="xl"
              />
            </Group>
          </Paper>
        ) : (
          <NothingFound
            withPaper
            icon={IconUserPlus}
            title={playersState.length ? 'Sin resultados' : 'Sin jugadores'}
            description={playersState.length ? 'No hay jugadores que coincidan con los filtros.' : 'Importa un Excel o añade un jugador manualmente para empezar.'}
          />
        )}
      </Box>

      <Modal opened={!!editingPlayer} onClose={() => setEditingPlayer(null)} title="Editar jugador" size="xl">
        {editingPlayer && <PlayerForm initial={editingPlayer} />}
      </Modal>
    </Stack>
  );
}
