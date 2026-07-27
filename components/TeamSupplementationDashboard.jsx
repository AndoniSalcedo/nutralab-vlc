'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { initials } from '@/lib/utils';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconArrowLeft, IconBottle, IconHistory, IconUsers, IconPill, IconList } from '@tabler/icons-react';
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
      <Stack gap="lg">
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm">
            <Tooltip label="Volver a equipo" withArrow>
              <ActionIcon component={Anchor} href={`/dashboard/equipo/${team?.id}`} variant="light" color="gray" radius="xl" size={42}>
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Tooltip>
            <ThemeIcon color="grape" variant="light" radius="xl" size={42}>
              <IconBottle size={21} />
            </ThemeIcon>
            <Box>
              <Title order={3} fw={850} c="#24291f" lh={1.1}>
                Suplementación
              </Title>
              <Text size="xs" c="dimmed" mt={2}>
                {team?.nombre || 'Equipo'}
              </Text>
            </Box>
          </Group>
          {!readOnly && (
            <Group>
              <Button size="xs" radius="xl" variant="light" color="grape" onClick={() => setManagerModal('assign')} leftSection={<IconUsers size={14} />}>Asignar fases</Button>
              <Button size="xs" radius="xl" variant="light" color="grape" onClick={() => setManagerModal('catalogs')} leftSection={<IconList size={14} />}>Catálogos</Button>
              <Button size="xs" radius="xl" variant="light" color="grape" onClick={() => setManagerModal('supplements')} leftSection={<IconPill size={14} />}>Suplementos</Button>
            </Group>
          )}
        </Group>
      </Paper>

      <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 600 }}>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                <Table.Th style={{ paddingLeft: 24 }}>Jugador</Table.Th>
                <Table.Th>Catálogo Activo (Fase)</Table.Th>
                <Table.Th>Extras</Table.Th>
                <Table.Th w={120} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {players.map((player) => {
                const assignment = assignmentsByPlayer.get(String(player.id));
                const catalog = assignment ? catalogsById.get(String(assignment.lista_id)) : null;
                const extrasCount = extrasByPlayer.get(String(player.id))?.length || 0;

                return (
                  <Table.Tr key={player.id} h={70}>
                    <Table.Td style={{ paddingLeft: 24 }}>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar size={42} radius="xl" color="initials">
                          {initials(`${player.nombre} ${player.apellidos || ''}`)}
                        </Avatar>
                        <Box style={{ minWidth: 0 }}>
                          <Text fz="sm" fw={600} c="dark.4" truncate>
                            {player.nombre} {player.apellidos}
                          </Text>
                          <Text c="dimmed" fz="xs" style={{ lineHeight: 1 }} truncate>
                            {player.posicion || 'Sin posición'}
                          </Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
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
                    <Table.Td>
                      {extrasCount > 0 ? (
                        <Badge variant="light" color="blue" radius="sm">
                          {extrasCount} suplementos
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        leftSection={<IconHistory size={14} />}
                        onClick={() => openHistory(player)}
                      >
                        Historial
                      </Button>
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
