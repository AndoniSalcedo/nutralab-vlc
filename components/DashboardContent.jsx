'use client';

import { Anchor, Group, Paper, SimpleGrid, Stack, Text, Title, ThemeIcon, Box, Table, ScrollArea, Avatar, Badge, ActionIcon } from '@mantine/core';
import { IconCalendarEvent, IconFlame, IconUsers, IconUserPlus, IconChevronRight, IconPencil, IconChartPie } from '@tabler/icons-react';
import DashboardActions from '@/components/DashboardActions';

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

export default function DashboardContent({ players = [] }) {
  const totalPlayers = players.length;
  const avgKcal = players.length ? Math.round(players.reduce((a, p) => a + Number(p.kcal_objetivo || 0), 0) / players.length) : 0;

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

      {/* 3. LISTADO DE JUGADORES (TABLA) */}
      <Box>
        {players.length > 0 ? (
          <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
            <ScrollArea>
              <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ paddingLeft: 24 }}>Jugador</Table.Th>
                    <Table.Th visibleFrom="xs">Métricas Base</Table.Th>
                    <Table.Th visibleFrom="sm">Kcal Objetivo</Table.Th>
                    <Table.Th>Posición</Table.Th>
                    <Table.Th w={120} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {players.map((player) => (
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
                              <Text fz="sm" fw={600} c="dark.4">
                                {player.nombre} {player.apellidos}
                              </Text>
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
                          {player.kcal_objetivo ? (
                            <Group gap={6}>
                              <IconFlame size={14} style={{ opacity: 0.5 }} color="var(--mantine-color-orange-6)" />
                              <Text fz="sm" fw={500} c="dark.4">
                                {player.kcal_objetivo} kcal
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
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            radius="xl"
                            component="a"
                            href={`/dashboard/jugador/${player.id}`}
                          >
                            <IconPencil size={18} stroke={1.5} />
                          </ActionIcon>
                          <IconChevronRight size={16} style={{ opacity: 0.3, marginLeft: 8 }} />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        ) : (
          <Box mt="xl" py="xl" ta="center">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mb="md">
              <IconUserPlus size={32} />
            </ThemeIcon>
            <Text fw={600} size="lg" mb={4}>Sin jugadores</Text>
            <Text size="sm" c="dimmed">Importa un Excel o añade un jugador manualmente para empezar.</Text>
          </Box>
        )}
      </Box>
    </Stack>
  );
}
