'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
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
import { createTeam, deleteTeam, updateTeam, uploadTeamPhoto, removeTeamPhoto } from '@/services/team';
import { compressAvatar, initials } from '@/lib/avatar';
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
    setForm({ nombre: '', temporada: season || nextSeasonLabel(), descripcion: '', fotoFile: null, fotoPreview: '', removeFoto: false });
    setModal({ type: 'create', team: null });
  }

  function openCopy(team) {
    setIsCreateImporting(false);
    setSelectedPlayerIds((team.players || []).map((player) => String(player.id)));
    setForm({
      nombre: team.nombre,
      temporada: nextSeasonLabel(),
      descripcion: team.descripcion || '',
      fotoFile: null,
      fotoPreview: team.foto_size ? `/api/teams/avatar?id=${team.id}&t=${team.updated_at || Date.now()}` : '',
      removeFoto: false,
    });
    setModal({ type: 'copy', team });
  }

  function openEdit(team) {
    setIsCreateImporting(false);
    setSelectedPlayerIds([]);
    setForm({
      nombre: team.nombre,
      temporada: team.temporada,
      descripcion: team.descripcion || '',
      fotoFile: null,
      fotoPreview: team.foto_size ? `/api/teams/avatar?id=${team.id}&t=${team.updated_at || Date.now()}` : '',
      removeFoto: false,
    });
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
        await updateTeam(modal.team.id, {
          nombre: form.nombre,
          temporada: form.temporada,
          descripcion: form.descripcion,
        });

        if (form.removeFoto) {
          await removeTeamPhoto(modal.team.id);
        } else if (form.fotoFile instanceof File) {
          const compressed = await compressAvatar(form.fotoFile);
          await uploadTeamPhoto(modal.team.id, compressed);
        }

        setTeamsState((current) =>
          current.map((item) =>
            String(item.id) === String(modal.team.id)
              ? {
                  ...item,
                  nombre: form.nombre,
                  temporada: form.temporada,
                  descripcion: form.descripcion,
                  foto_size: form.removeFoto ? null : form.fotoFile ? 1 : item.foto_size,
                  updated_at: new Date().toISOString(),
                }
              : item
          )
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
          nombre: form.nombre,
          temporada: form.temporada,
          descripcion: form.descripcion,
        };

        if (shouldCopyPlayers) {
          payload.player_ids = selectedPlayerIds;
        }

        const data = await createTeam(payload);

        if (data.equipo?.id && form.fotoFile instanceof File) {
          try {
            const compressed = await compressAvatar(form.fotoFile);
            await uploadTeamPhoto(data.equipo.id, compressed);
            data.equipo.foto_size = 1;
          } catch (e) {
            console.error('Error subiendo foto al crear equipo:', e);
          }
        }

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
                shadow="xs"
                bg="white"
                style={{
                  cursor: 'pointer',
                  transition: 'transform 120ms ease, box-shadow 120ms ease',
                }}
                onClick={() => router.push(`/dashboard/equipo/${team.id}`)}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                      <Avatar
                        src={team.foto_size ? `/api/teams/avatar?id=${team.id}&t=${team.updated_at || ''}` : undefined}
                        size={46}
                        radius="md"
                        color="blue"
                        style={{
                          border: '1.5px solid rgba(222, 226, 230, 0.7)',
                          fontWeight: 700,
                          backgroundColor: 'var(--mantine-color-blue-0)',
                          color: 'var(--mantine-color-blue-8)',
                          flexShrink: 0,
                        }}
                      >
                        {initials(team.nombre)}
                      </Avatar>

                      <Box style={{ minWidth: 0, flex: 1 }}>
                        <Group gap={6} wrap="nowrap" align="center">
                          <Title order={4} fw={800} c="dark.4" lh={1.2} lineClamp={1}>
                            {team.nombre}
                          </Title>
                          <Text size="xs" fw={600} c="dimmed" style={{ flexShrink: 0 }}>
                            · {team.temporada}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                          {team.descripcion || 'Sin descripción'}
                        </Text>
                      </Box>
                    </Group>

                    {!readOnly && (
                      <Menu shadow="md" width={240} position="bottom-end" withArrow radius="md">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            radius="xl"
                            size="md"
                            loading={saving}
                            onClick={(event) => event.stopPropagation()}
                            style={{ flexShrink: 0 }}
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

                  <Group justify="space-between" align="center" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}>
                    <Text size="xs" c="dimmed">
                      {team.players_count || 0} jugador{Number(team.players_count || 0) === 1 ? '' : 'es'}
                    </Text>
                    <Text size="xs" fw={700} c="blue.7">
                      Abrir dashboard →
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
