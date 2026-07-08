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
import { createTeam, deleteTeam } from '@/services/team';
import {
  IconCalendarStats,
  IconCopy,
  IconDots,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsersGroup,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import NothingFound from './NothingFound/NothingFound';
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
  const [createSourceTeamId, setCreateSourceTeamId] = useState('');

  const createSourceTeam = useMemo(
    () => teamsState.find((team) => String(team.id) === String(createSourceTeamId)) || null,
    [createSourceTeamId, teamsState]
  );
  const sourceTeam = modal.type === 'copy' ? modal.team : createSourceTeam;
  const isImportingPlayers = modal.type === 'copy' || Boolean(createSourceTeamId);
  const copyPlayers = isImportingPlayers ? sourceTeam?.players || [] : [];
  const selectedCount = selectedPlayerIds.length;
  const allCopyPlayersSelected = copyPlayers.length > 0 && selectedCount === copyPlayers.length;
  const someCopyPlayersSelected = selectedCount > 0 && selectedCount < copyPlayers.length;

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

  function selectCreateSourceTeam(teamId) {
    const id = String(teamId || '');
    const team = teamsState.find((item) => String(item.id) === id);
    setCreateSourceTeamId(id);
    setSelectedPlayerIds((team?.players || []).map((player) => String(player.id)));
  }

  function openCreate() {
    setSelectedPlayerIds([]);
    setCreateSourceTeamId('');
    setForm({ nombre: '', temporada: season || nextSeasonLabel(), descripcion: '' });
    setModal({ type: 'create', team: null });
  }

  function openCopy(team) {
    setCreateSourceTeamId('');
    setSelectedPlayerIds((team.players || []).map((player) => String(player.id)));
    setForm({ nombre: team.nombre, temporada: nextSeasonLabel(), descripcion: team.descripcion || '' });
    setModal({ type: 'copy', team });
  }

  function closeModal() {
    if (!saving) {
      setSelectedPlayerIds([]);
      setCreateSourceTeamId('');
      setModal({ type: null, team: null });
    }
  }

  function toggleCreateImport(checked) {
    if (!checked) {
      setCreateSourceTeamId('');
      setSelectedPlayerIds([]);
      return;
    }

    const defaultTeam = teamsState.find((team) => Number(team.players_count || 0) > 0) || teamsState[0];
    selectCreateSourceTeam(defaultTeam?.id || '');
  }

  function toggleAllCopyPlayers(checked) {
    setSelectedPlayerIds(checked ? copyPlayers.map((player) => String(player.id)) : []);
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
      const isCopy = modal.type === 'copy';
      const sourceTeamId = isCopy ? modal.team?.id : createSourceTeamId;
      const shouldCopyPlayers = Boolean(sourceTeamId);
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
        title: shouldCopyPlayers ? 'Equipo creado con plantilla' : 'Equipo creado',
        message: shouldCopyPlayers
          ? `${playerCountLabel(copiedPlayers)} importado${copiedPlayers === 1 ? '' : 's'} a ${data.equipo.temporada}.`
          : `${data.equipo.nombre} está listo.`,
      });
      setSelectedPlayerIds([]);
      setCreateSourceTeamId('');
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
        <Paper p={{ base: 'sm', sm: 'md' }} shadow="sm" radius="lg" withBorder bg="white">
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
                      <Menu shadow="md" width={220} position="bottom-end" withArrow>
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
                          <Menu.Item leftSection={<IconCopy size={14} />} onClick={() => openCopy(team)}>
                            Copiar a temporada
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
          createSourceTeamId={createSourceTeamId}
          toggleCreateImport={toggleCreateImport}
          selectCreateSourceTeam={selectCreateSourceTeam}
          isImportingPlayers={isImportingPlayers}
          sourceTeam={sourceTeam}
          selectedCount={selectedCount}
          copyPlayers={copyPlayers}
          allCopyPlayersSelected={allCopyPlayersSelected}
          someCopyPlayersSelected={someCopyPlayersSelected}
          toggleAllCopyPlayers={toggleAllCopyPlayers}
          selectedPlayerIds={selectedPlayerIds}
          toggleCopyPlayer={toggleCopyPlayer}
          saving={saving}
          playerCountLabel={playerCountLabel}
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
