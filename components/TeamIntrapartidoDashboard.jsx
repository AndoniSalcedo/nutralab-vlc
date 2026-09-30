'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconChevronDown,
  IconEdit,
  IconFileSpreadsheet,
  IconPlus,
  IconTrash,
} from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';
import NothingFound from '@/components/NothingFound';
import ConfirmModal from '@/components/modals/ConfirmModal';
import IntrapartidoModal from '@/components/modals/IntrapartidoModal';
import { TeamHeaderRightSection } from '@/components/TeamHeaderContext';
import { deleteIntrapartidoMatch } from '@/actions/intrapartidoActions';
import { calculatePlayerTotals } from '@/config/intrapartido';
import { exportIntrapartidoExcel } from '@/lib/io/intrapartido-export';
import { initials, getPlayerAvatarUrl } from '@/lib/utils';

function formatDate(dateStr) {
  if (!dateStr) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${dateStr}T00:00:00`));
}

function sumTotals(list) {
  return list.reduce(
    (acc, t) => ({
      aguaMl: acc.aguaMl + t.aguaMl,
      carbsG: acc.carbsG + t.carbsG,
      sodioMg: acc.sodioMg + t.sodioMg,
      kcal: acc.kcal + t.kcal,
    }),
    { aguaMl: 0, carbsG: 0, sodioMg: 0, kcal: 0 },
  );
}

const formatLiters = (ml) => `${(ml / 1000).toFixed(1)} L`;

function Stat({ label, value }) {
  return (
    <Box style={{ minWidth: 0 }}>
      <Text fz="10px" fw={600} c="dimmed" tt="uppercase" truncate>{label}</Text>
      <Text fz="sm" fw={700} c="dark.6" truncate>{value}</Text>
    </Box>
  );
}

export default function TeamIntrapartidoDashboard({ players = [], sessions = [], team, readOnly = false }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState({ opened: false, matchId: null });
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const playersMap = useMemo(() => new Map(players.map((p) => [String(p.id), p])), [players]);

  // Totales por jugador y por partido, calculados una sola vez
  const matches = useMemo(() => sessions.map((session) => {
    const perPlayer = session.activeRosterIds.map((pId) => ({
      pId,
      isStarter: session.starterIds.includes(pId),
      totals: calculatePlayerTotals(session.intakes[pId]),
    }));
    return { session, perPlayer, totals: sumTotals(perPlayer.map((p) => p.totals)) };
  }), [sessions]);

  // Medias por jugador y partido (solo partidos con alguna toma registrada)
  const averages = useMemo(() => {
    const withIntakes = matches.filter((m) => m.totals.aguaMl > 0 || m.totals.carbsG > 0);
    const playerMatches = withIntakes.reduce((acc, m) => acc + m.perPlayer.length, 0);
    const total = sumTotals(withIntakes.map((m) => m.totals));
    const avg = (value) => (playerMatches ? value / playerMatches : 0);
    return { aguaMl: avg(total.aguaMl), carbsG: avg(total.carbsG), sodioMg: avg(total.sodioMg) };
  }, [matches]);

  const openModal = (matchId = null) => setModal({ opened: true, matchId });
  const closeModal = () => setModal((prev) => ({ ...prev, opened: false }));

  const handleExport = async (session) => {
    try {
      await exportIntrapartidoExcel({ session, players, team });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message || 'No se pudo generar el Excel.' });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteIntrapartidoMatch(team.id, deleting.id);
      notifications.show({ color: 'teal', title: 'Partido eliminado', message: 'Se ha eliminado el registro del partido.' });
      setDeleting(null);
      router.refresh();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: err.message || 'No se pudo eliminar el partido.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Stack gap="lg" style={{ width: '100%', minWidth: 0 }}>
      {!readOnly && (
        <TeamHeaderRightSection>
          <Button
            size="sm"
            radius="xl"
            color="dark"
            leftSection={<IconPlus size={16} />}
            onClick={() => openModal(null)}
          >
            Nuevo partido
          </Button>
        </TeamHeaderRightSection>
      )}

      {matches.length === 0 ? (
        <NothingFound
          title="Sin partidos registrados"
          description={
            readOnly
              ? 'Todavía no se ha registrado ningún control intrapartido.'
              : 'Registra el primer control intrapartido con el botón "Nuevo partido".'
          }
          icon3d="droplet"
          withPaper
        />
      ) : (
        <>
          <Paper p={{ base: 10, sm: 'md' }} radius="lg" shadow="sm" bg="white">
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={{ base: 'xs', sm: 'md' }}>
              <Stat label="Partidos" value={matches.length} />
              <Stat label="Líquidos / jugador" value={`${Math.round(averages.aguaMl)} ml`} />
              <Stat label="Carbs / jugador" value={`${Math.round(averages.carbsG)} g`} />
              <Stat label="Sodio / jugador" value={`${Math.round(averages.sodioMg)} mg`} />
            </SimpleGrid>
          </Paper>

          <Stack gap="sm">
            {matches.map(({ session, perPlayer, totals }) => {
              const info = session.matchInfo;
              const expanded = expandedId === session.id;

              return (
                <Paper key={session.id} radius="lg" shadow="sm" bg="white" p={{ base: 10, sm: 'md' }}>
                  <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                    <UnstyledButton
                      onClick={() => setExpandedId(expanded ? null : session.id)}
                      style={{ flex: 1, minWidth: 0 }}
                      aria-expanded={expanded}
                    >
                      <Group gap="sm" wrap="nowrap">
                        <Icon3D name="soccer" size={28} />
                        <Box style={{ minWidth: 0 }}>
                          <Text fw={700} fz="sm" c="dark.6" truncate>
                            {info.rival || 'Sin rival'}
                          </Text>
                          <Text fz="xs" c="dimmed" truncate>
                            {formatDate(info.fecha)}
                            {info.competicion ? ` · ${info.competicion}` : ''}
                            {info.lugar ? ` · ${info.lugar}` : ''}
                          </Text>
                        </Box>
                      </Group>
                    </UnstyledButton>

                    <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                      <Tooltip label="Exportar Excel" withArrow>
                        <ActionIcon variant="subtle" color="teal" radius="xl" onClick={() => handleExport(session)} aria-label="Exportar Excel">
                          <IconFileSpreadsheet size={17} />
                        </ActionIcon>
                      </Tooltip>
                      {!readOnly && (
                        <>
                          <Tooltip label="Editar" withArrow>
                            <ActionIcon variant="subtle" color="gray" radius="xl" onClick={() => openModal(session.id)} aria-label="Editar partido">
                              <IconEdit size={17} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Eliminar" withArrow>
                            <ActionIcon variant="subtle" color="red" radius="xl" onClick={() => setDeleting({ id: session.id, rival: info.rival })} aria-label="Eliminar partido">
                              <IconTrash size={17} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      )}
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        radius="xl"
                        onClick={() => setExpandedId(expanded ? null : session.id)}
                        aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'}
                        style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}
                      >
                        <IconChevronDown size={17} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <SimpleGrid cols={{ base: 3, sm: 5 }} spacing="xs" mt="sm">
                    <Stat label="Convocados" value={`${perPlayer.length} (${session.starterIds.length} tit.)`} />
                    <Stat label="Líquidos" value={formatLiters(totals.aguaMl)} />
                    <Stat label="Carbs" value={`${Math.round(totals.carbsG)} g`} />
                    <Stat label="Sodio" value={`${Math.round(totals.sodioMg)} mg`} />
                    <Stat label="Energía" value={`${Math.round(totals.kcal)} kcal`} />
                  </SimpleGrid>

                  <Collapse in={expanded}>
                    <ScrollArea.Autosize mah={420} mt="md" type="auto" offsetScrollbars>
                      <Table verticalSpacing="xs" highlightOnHover striped miw={560}>
                        <Table.Thead bg="#f8fafc" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                          <Table.Tr>
                            <Table.Th style={{ fontSize: 11, color: 'var(--mantine-color-gray-6)' }}>JUGADOR</Table.Th>
                            <Table.Th style={{ fontSize: 11, textAlign: 'center', color: 'var(--mantine-color-gray-6)' }}>ROL</Table.Th>
                            <Table.Th style={{ fontSize: 11, textAlign: 'right', color: 'var(--mantine-color-gray-6)' }}>LÍQUIDOS</Table.Th>
                            <Table.Th style={{ fontSize: 11, textAlign: 'right', color: 'var(--mantine-color-gray-6)' }}>CARBS</Table.Th>
                            <Table.Th style={{ fontSize: 11, textAlign: 'right', color: 'var(--mantine-color-gray-6)' }}>SODIO</Table.Th>
                            <Table.Th style={{ fontSize: 11, textAlign: 'right', color: 'var(--mantine-color-gray-6)' }}>KCAL</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {perPlayer.map(({ pId, isStarter, totals: t }) => {
                            const player = playersMap.get(pId);
                            if (!player) return null;
                            return (
                              <Table.Tr key={pId}>
                                <Table.Td>
                                  <Group gap="xs" wrap="nowrap">
                                    <Avatar src={getPlayerAvatarUrl(player)} size={28} radius="xl" color="initials">
                                      {initials(`${player.nombre} ${player.apellidos || ''}`)}
                                    </Avatar>
                                    <Text fz="xs" fw={600} c="dark.6" truncate>
                                      {player.nombre} {player.apellidos}
                                    </Text>
                                  </Group>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'center' }}>
                                  <Badge size="xs" variant="light" color={isStarter ? 'green' : 'blue'}>
                                    {isStarter ? 'Titular' : 'Suplente'}
                                  </Badge>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                  <Text fz="xs" fw={700} c={t.aguaMl > 0 ? '#0284c7' : 'dimmed'}>{Math.round(t.aguaMl)} ml</Text>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                  <Text fz="xs" fw={700} c={t.carbsG > 0 ? '#d97706' : 'dimmed'}>{t.carbsG.toFixed(1)} g</Text>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                  <Text fz="xs" fw={600} c="dark.5">{Math.round(t.sodioMg)} mg</Text>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                  <Text fz="xs" fw={700} c="dark.6">{Math.round(t.kcal)}</Text>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea.Autosize>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        </>
      )}

      <IntrapartidoModal
        opened={modal.opened}
        onClose={closeModal}
        players={players}
        team={team}
        readOnly={readOnly}
        matchId={modal.matchId}
        onSaved={() => router.refresh()}
      />

      <ConfirmModal
        opened={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Eliminar partido"
        message={`¿Seguro que quieres eliminar el registro del partido${deleting?.rival ? ` contra ${deleting.rival}` : ''}? Se perderán sus tomas y no se puede deshacer.`}
        confirmLabel="Eliminar partido"
      />
    </Stack>
  );
}
