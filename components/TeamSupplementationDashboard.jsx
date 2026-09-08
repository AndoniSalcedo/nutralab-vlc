'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { initials } from '@/lib/utils';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { TeamHeaderRightSection } from '@/components/TeamHeaderContext';
import { IconBottle, IconHistory, IconUsers, IconPill, IconList } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import SupplementManagerModal from '@/components/modals/SupplementManagerModal';
import SupplementHistoryModal from '@/components/modals/SupplementHistoryModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

dayjs.locale('es');


export default function TeamSupplementationDashboard({
  players = [],
  team,
  initialAssignments = [],
  initialExtras = [],
  history = [],
  catalogs = [],
  readOnly = false,
  initialSelectedPlayerIds = null
}) {
  const router = useRouter();
  const [historyModal, setHistoryModal] = useState({ opened: false, player: null, historyEvents: [] });
  const [managerModal, setManagerModal] = useState(null); // 'assign', 'catalogs', 'supplements' or null

  const catalogsById = new Map(catalogs.map((cat) => [String(cat.id), cat]));
  const assignmentsByPlayer = new Map(initialAssignments.map((a) => [String(a.jugador_id), a]));
  const extrasByPlayer = new Map();
  initialExtras.forEach((extra) => {
    const key = String(extra.jugador_id);
    if (!extrasByPlayer.has(key)) extrasByPlayer.set(key, []);
    extrasByPlayer.get(key).push(extra);
  });

  function openHistory(player) {
    const playerHistory = history.filter((h) => String(h.jugador_id) === String(player.id));
    setHistoryModal({ opened: true, player, historyEvents: playerHistory });
  }

  return (
    <BoneyardSkeleton name="team-supplementation" loading={false}>
      {/* Botones de acción integrados en la cabecera */}
      <TeamHeaderRightSection>
        {!readOnly && (
          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Móvil: botón pastilla (💊) compacto con menú desplegable */}
            <Box hiddenFrom="sm">
              <Menu shadow="md" width={200} position="bottom-end" withArrow radius="md">
                <Menu.Target>
                  <ActionIcon
                    size={36}
                    radius="xl"
                    variant="light"
                    color="grape"
                    aria-label="Gestión de suplementación"
                  >
                    <IconPill size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Gestión de suplementación</Menu.Label>
                  <Menu.Item
                    leftSection={<IconUsers size={16} color="var(--mantine-color-grape-6)" />}
                    onClick={() => setManagerModal('assign')}
                  >
                    Asignar fases
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconList size={16} color="var(--mantine-color-grape-6)" />}
                    onClick={() => setManagerModal('catalogs')}
                  >
                    Catálogos
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconPill size={16} color="var(--mantine-color-grape-6)" />}
                    onClick={() => setManagerModal('supplements')}
                  >
                    Suplementos
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Box>

            {/* Escritorio: Los 3 botones completos */}
            <Group visibleFrom="sm" gap="xs" wrap="nowrap">
              <Button
                size="xs"
                radius="xl"
                variant="light"
                color="grape"
                onClick={() => setManagerModal('assign')}
                leftSection={<IconUsers size={14} />}
              >
                Asignar fases
              </Button>
              <Button
                size="xs"
                radius="xl"
                variant="light"
                color="grape"
                onClick={() => setManagerModal('catalogs')}
                leftSection={<IconList size={14} />}
              >
                Catálogos
              </Button>
              <Button
                size="xs"
                radius="xl"
                variant="light"
                color="grape"
                onClick={() => setManagerModal('supplements')}
                leftSection={<IconPill size={14} />}
              >
                Suplementos
              </Button>
            </Group>
          </Group>
        )}
      </TeamHeaderRightSection>

      <Stack gap="lg" style={{ width: '100%', minWidth: 0 }}>

      <Paper radius="xl" p={0} bg="white" shadow="xs" withBorder style={{ overflow: 'hidden', borderColor: 'rgba(222,226,230,0.8)', width: '100%', minWidth: 0, maxWidth: '100%' }}>
        <ScrollArea style={{ width: '100%', minWidth: 0 }}>
          <Table verticalSpacing="sm" highlightOnHover w="100%" miw={{ base: '100%', sm: 600 }}>
            <Table.Thead bg="rgba(248, 249, 250, 0.95)">
              <Table.Tr>
                <Table.Th style={{ paddingLeft: 16, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-gray-6)' }}>Jugador</Table.Th>
                <Table.Th visibleFrom="sm" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-gray-6)' }}>Catálogo Activo (Fase)</Table.Th>
                <Table.Th visibleFrom="sm" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-gray-6)' }}>Extras</Table.Th>
                <Table.Th w={{ base: 50, sm: 110 }} style={{ textAlign: 'right', paddingRight: 16 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {players.map((player) => {
                const assignment = assignmentsByPlayer.get(String(player.id));
                const catalog = assignment ? catalogsById.get(String(assignment.lista_id)) : null;
                const extrasCount = extrasByPlayer.get(String(player.id))?.length || 0;

                return (
                  <Table.Tr key={player.id} h={{ base: 64, sm: 70 }} style={{ transition: 'background-color 120ms ease' }}>
                    <Table.Td style={{ paddingLeft: 16 }}>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar
                          src={player.avatar_url || (player.avatar_size ? `/api/players/avatar?id=${player.id}` : undefined)}
                          size={42}
                          radius="xl"
                          color="initials"
                          style={{ border: '1.5px solid rgba(222, 226, 230, 0.7)', flexShrink: 0 }}
                        >
                          {initials(`${player.nombre} ${player.apellidos || ''}`)}
                        </Avatar>

                        <Box style={{ minWidth: 0, flex: 1 }}>
                          <Text fz="sm" fw={600} c="dark.5" truncate>
                            {player.nombre} {player.apellidos}
                          </Text>
                          <Text c="dimmed" fz="xs" style={{ lineHeight: 1.2 }} truncate>
                            {player.posicion || 'Sin posición'}
                          </Text>

                          {/* Resumen para móvil (fase + extras) bajo el nombre */}
                          <Group gap={6} align="center" wrap="wrap" hiddenFrom="sm" mt={3}>
                            {catalog ? (
                              <Group gap={4} align="center">
                                <ThemeIcon size={16} radius="xl" color="grape" variant="light">
                                  <IconBottle size={10} />
                                </ThemeIcon>
                                <Text size="11px" fw={600} c="grape.8">{catalog.nombre}</Text>
                              </Group>
                            ) : (
                              <Text size="11px" c="dimmed">Sin fase</Text>
                            )}
                            {extrasCount > 0 && (
                              <Group gap={4} align="center">
                                <Text size="8px" c="grape.6">●</Text>
                                <Text size="11px" fw={600} c="dark.3">
                                  {extrasCount} {extrasCount === 1 ? 'extra' : 'extras'}
                                </Text>
                              </Group>
                            )}
                          </Group>
                        </Box>
                      </Group>
                    </Table.Td>

                    <Table.Td visibleFrom="sm">
                      {catalog ? (
                        <Group gap={6}>
                          <ThemeIcon size="sm" radius="xl" color="grape" variant="light">
                            <IconBottle size={12} />
                          </ThemeIcon>
                          <Text size="sm" fw={500}>{catalog.nombre}</Text>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>

                    <Table.Td visibleFrom="sm">
                      {extrasCount > 0 ? (
                        <Group gap={6} align="center" wrap="nowrap">
                          <Text size="8px" c="grape.6">●</Text>
                          <Text size="sm" fw={600} c="dark.4">
                            {extrasCount} <Text component="span" c="dimmed" fw={400} size="xs">{extrasCount === 1 ? 'suplemento' : 'suplementos'}</Text>
                          </Text>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        radius="xl"
                        leftSection={<IconHistory size={14} />}
                        onClick={() => openHistory(player)}
                        visibleFrom="sm"
                      >
                        Historial
                      </Button>
                      <Tooltip label="Historial de suplementación" position="left" withArrow>
                        <ActionIcon
                          variant="light"
                          color="gray"
                          radius="xl"
                          size={34}
                          onClick={() => openHistory(player)}
                          hiddenFrom="sm"
                          aria-label="Ver historial"
                        >
                          <IconHistory size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>

      <SupplementManagerModal
        opened={!!managerModal}
        onClose={() => {
          setManagerModal(null);
          router.refresh();
        }}
        players={players}
        team={team}
        activeTab={managerModal || 'assign'}
        onTabChange={setManagerModal}
        initialSelectedPlayerIds={initialSelectedPlayerIds}
      />

      <SupplementHistoryModal
        opened={historyModal.opened}
        onClose={() => setHistoryModal({ opened: false, player: null, historyEvents: [] })}
        historyModal={historyModal}
        catalogsById={catalogsById}
      />
      </Stack>
    </BoneyardSkeleton>
  );
}
