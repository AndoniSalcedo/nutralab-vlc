'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createTeam, deleteTeam, updateTeam } from '@/services/team';
import {
  IconCalendarStats,
  IconCopy,
  IconDots,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsersGroup,
  IconPencil,
  IconChartLine,
  IconReportMedical,
  IconBottle,
  IconCalendarEvent,
  IconSettings,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import NothingFound from './NothingFound';
import ConfirmModal from '@/components/modals/ConfirmModal';
import TeamFormModal from '@/components/modals/TeamFormModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

function nextSeasonLabel() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}/${String(year + 1).slice(-2)}`;
}


function playerCountLabel(count) {
  return `${count} jugador${Number(count) === 1 ? '' : 'es'}`;
}

export default function TeamsDashboard({ teams = [], readOnly = false }) {
  const router = useRouter();
  const [teamsState, setTeamsState] = useState(teams);
  const [season, setSeason] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ type: null, team: null });
  const [saving, setSaving] = useState(false);
  const [deleteTeamData, setDeleteTeamData] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    temporada: '',
    descripcion: '',
  });
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [isCreateImporting, setIsCreateImporting] = useState(false);

  const sourceTeam = modal.type === 'copy' ? modal.team : null;
  const isImportingPlayers = modal.type === 'copy' || (modal.type === 'create' && isCreateImporting);
  const selectedCount = selectedPlayerIds.length;

  const allPlayers = useMemo(() => {
    const result = [];
    for (const t of teamsState) {
      for (const p of t.players || []) {
        result.push({
          ...p,
          teamId: String(t.id),
          teamNombre: t.nombre,
          teamTemporada: t.temporada,
        });
      }
    }
    return result;
  }, [teamsState]);

  const seasons = useMemo(() => {
    const values = Array.from(new Set(teamsState.map((team) => team.temporada).filter(Boolean))).sort().reverse();
    return [{ value: '', label: 'Todas las temporadas' }, ...values.map((value) => ({ value, label: value }))];
  }, [teamsState]);

  const filteredTeams = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return teamsState.filter((team) => {
      const matchesSeason = !season || team.temporada === season;
      const matchesSearch = !needle || `${team.nombre} ${team.descripcion || ''}`.toLowerCase().includes(needle);
      return matchesSeason && matchesSearch;
    });
  }, [search, season, teamsState]);

  const sourceTeamOptions = useMemo(
    () => teamsState.map((team) => ({
      value: String(team.id),
      label: `${team.nombre} · ${team.temporada} (${playerCountLabel(team.players_count || 0)})`,
    })),
    [teamsState]
  );

  function openCreate() {
    setSelectedPlayerIds([]);
    setIsCreateImporting(false);
    setForm({ nombre: '', temporada: season || nextSeasonLabel(), descripcion: '' });
    setModal({ type: 'create', team: null });
  }

  function openCopy(team) {
    setIsCreateImporting(false);
    setSelectedPlayerIds((team.players || []).map((player) => String(player.id)));
    setForm({ nombre: team.nombre, temporada: nextSeasonLabel(), descripcion: team.descripcion || '' });
    setModal({ type: 'copy', team });
  }

  function openEdit(team) {
    setIsCreateImporting(false);
    setSelectedPlayerIds([]);
    setForm({ nombre: team.nombre, temporada: team.temporada, descripcion: team.descripcion || '' });
    setModal({ type: 'edit', team });
  }

  function closeModal() {
    if (!saving) {
      setSelectedPlayerIds([]);
      setIsCreateImporting(false);
      setModal({ type: null, team: null });
    }
  }

  function toggleCreateImport(checked) {
    setIsCreateImporting(checked);
    if (!checked) {
      setSelectedPlayerIds([]);
    }
  }

  function toggleCopyPlayer(playerId, checked) {
    const id = String(playerId);
    setSelectedPlayerIds((current) => {
      if (!checked) return current.filter((item) => item !== id);
      return Array.from(new Set([...current, id]));
    });
  }

  async function submitTeam(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal.type === 'edit') {
        const data = await updateTeam(modal.team.id, form);
        setTeamsState((current) =>
          current.map((item) => (String(item.id) === String(modal.team.id) ? { ...item, ...form } : item))
        );
        notifications.show({
          color: 'green',
          title: 'Equipo actualizado',
          message: `${form.nombre} guardado correctamente.`,
        });
      } else {
        const isCopy = modal.type === 'copy';
        const sourceTeamId = isCopy ? modal.team?.id : null;
        const shouldCopyPlayers = isImportingPlayers && selectedPlayerIds.length > 0;
        const payload = {
          action: shouldCopyPlayers ? 'copy_season' : 'create',
          team_id: sourceTeamId,
          ...form,
        };

        if (shouldCopyPlayers) {
          payload.player_ids = selectedPlayerIds;
        }

        const data = await createTeam(payload);

        const copiedPlayers = Number(data.copiedPlayers || 0);
        const newTeam = {
          ...data.equipo,
          players_count: shouldCopyPlayers ? copiedPlayers : 0,
          players: data.players || [],
        };

        setTeamsState((current) => [newTeam, ...current]);
        notifications.show({
          color: 'green',
          title: shouldCopyPlayers ? 'Equipo creado con plantilla e historial' : 'Equipo creado',
          message: shouldCopyPlayers
            ? `${playerCountLabel(copiedPlayers)} y todo su historial importados a ${data.equipo.temporada}.`
            : `${data.equipo.nombre} está listo.`,
        });
      }
      setSelectedPlayerIds([]);
      setIsCreateImporting(false);
      setModal({ type: null, team: null });
      router.refresh();
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo guardar', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTeam(team) {
    setDeleteTeamData(team);
  }

  async function confirmDeleteTeam() {
    if (!deleteTeamData) return;
    setSaving(true);
    try {
      await deleteTeam(deleteTeamData.id);
      setTeamsState((current) => current.filter((item) => String(item.id) !== String(deleteTeamData.id)));
      notifications.show({ color: 'green', title: 'Equipo eliminado', message: deleteTeamData.nombre });
      router.refresh();
      setDeleteTeamData(null);
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo eliminar', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <BoneyardSkeleton name="teams-list" loading={false}>
      <Stack gap="lg">
        <Paper p={{ base: 'sm', sm: 'md' }} shadow="xs" radius={24} bg="white">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm">
              <ThemeIcon color="dark" variant="light" radius="md" size={42}>
                <IconUsersGroup size={21} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={850} c="#24291f" lh={1.1}>
                  Equipos
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  Selecciona un equipo para abrir su dashboard.
                </Text>
              </Box>
            </Group>
            {!readOnly && (
              <Button radius="xl" size="xs" leftSection={<IconPlus size={14} />} onClick={openCreate}>
                Nuevo equipo
              </Button>
            )}
          </Group>

          <Group gap="xs" mt="md" wrap="wrap">
            <TextInput
              placeholder="Buscar equipo"
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              radius="xl"
              variant="filled"
              style={{ flex: 2, minWidth: 220 }}
            />
            <Select
              placeholder="Temporada"
              data={seasons}
              value={season}
              onChange={(value) => setSeason(value || '')}
              leftSection={<IconCalendarStats size={16} />}
              radius="xl"
              variant="filled"
              allowDeselect={false}
              style={{ flex: 1, minWidth: 190 }}
            />
          </Group>
        </Paper>

        {filteredTeams.length ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {filteredTeams.map((team) => (
              <Paper
                key={team.id}
                p="md"
                radius="lg"
                withBorder
                shadow="sm"
                bg="white"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/dashboard/equipo/${team.id}`)}
              >
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <ThemeIcon color="blue" variant="light" radius="md" size={40}>
                      <IconUsersGroup size={20} />
                    </ThemeIcon>
                    {!readOnly && (
                      <Menu shadow="md" width={240} position="bottom-end" withArrow radius="md">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            radius="xl"
                            loading={saving}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <IconDots size={18} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown onClick={(event) => event.stopPropagation()}>
                          <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => openEdit(team)}>
                            Editar equipo
                          </Menu.Item>
                          <Menu.Item leftSection={<IconCopy size={14} />} onClick={() => openCopy(team)}>
                            Copiar a temporada
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Label>Accesos rápidos</Menu.Label>
                          <Menu.Item leftSection={<IconChartLine size={14} />} onClick={() => router.push(`/dashboard/equipo/${team.id}/evolucion`)}>
                            Evolución equipo
                          </Menu.Item>
                          <Menu.Item leftSection={<IconReportMedical size={14} />} onClick={() => router.push(`/dashboard/equipo/${team.id}/analiticas`)}>
                            Analíticas equipo
                          </Menu.Item>
                          <Menu.Item leftSection={<IconBottle size={14} />} onClick={() => router.push(`/dashboard/equipo/${team.id}/suplementacion`)}>
                            Suplementación
                          </Menu.Item>
                          <Menu.Item leftSection={<IconCalendarEvent size={14} />} onClick={() => router.push(`/dashboard/equipo/${team.id}/menu`)}>
                            Menú semanal
                          </Menu.Item>
                          <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => router.push(`/dashboard/equipo/${team.id}/configuracion`)}>
                            Configuración
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDeleteTeam(team)}>
                            Eliminar
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>

                  <Box>
                    <Group gap="xs" mb={6}>
                      <Title order={4} fw={800} c="dark.4" lh={1.1}>
                        {team.nombre}
                      </Title>
                      <Badge variant="light" color="gray" radius="sm">
                        {team.temporada}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {team.descripcion || 'Sin descripción'}
                    </Text>
                  </Box>

                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      {team.players_count || 0} jugador{Number(team.players_count || 0) === 1 ? '' : 'es'}
                    </Text>
                    <Text size="xs" fw={700} c="blue.7">
                      Abrir dashboard
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <NothingFound
            withPaper
            icon={IconUsersGroup}
            title={teamsState.length ? 'Sin equipos en esta búsqueda' : 'Sin equipos'}
            description={teamsState.length ? 'Cambia los filtros para ver otros equipos.' : 'Crea tu primer equipo para empezar.'}
          />
        )}

        <TeamFormModal
          opened={!!modal.type}
          onClose={closeModal}
          modal={modal}
          submitTeam={submitTeam}
          form={form}
          setForm={setForm}
          sourceTeamOptions={sourceTeamOptions}
          toggleCreateImport={toggleCreateImport}
          isImportingPlayers={isImportingPlayers}
          sourceTeam={sourceTeam}
          selectedCount={selectedCount}
          selectedPlayerIds={selectedPlayerIds}
          onChangeSelectedPlayerIds={setSelectedPlayerIds}
          toggleCopyPlayer={toggleCopyPlayer}
          saving={saving}
          playerCountLabel={playerCountLabel}
          allPlayers={allPlayers}
        />
        <ConfirmModal
          opened={!!deleteTeamData}
          onClose={() => setDeleteTeamData(null)}
          onConfirm={confirmDeleteTeam}
          title="Eliminar equipo"
          message={deleteTeamData ? `¿Eliminar ${deleteTeamData.nombre} (${deleteTeamData.temporada}) y todos sus jugadores?` : ''}
          confirmLabel="Eliminar"
          loading={saving}
        />
      </Stack>
    </BoneyardSkeleton>
  );
}
