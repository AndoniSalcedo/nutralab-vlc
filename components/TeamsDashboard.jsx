'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Modal,
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

function nextSeasonLabel() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}/${String(year + 1).slice(-2)}`;
}

export default function TeamsDashboard({ teams = [] }) {
  const router = useRouter();
  const [teamsState, setTeamsState] = useState(teams);
  const [season, setSeason] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ type: null, team: null });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    temporada: '',
    descripcion: '',
  });

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

  function openCreate() {
    setForm({ nombre: '', temporada: season || nextSeasonLabel(), descripcion: '' });
    setModal({ type: 'create', team: null });
  }

  function openCopy(team) {
    setForm({ nombre: team.nombre, temporada: nextSeasonLabel(), descripcion: team.descripcion || '' });
    setModal({ type: 'copy', team });
  }

  function closeModal() {
    if (!saving) setModal({ type: null, team: null });
  }

  async function submitTeam(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const isCopy = modal.type === 'copy';
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isCopy ? 'copy_season' : 'create',
          team_id: modal.team?.id,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el equipo');

      setTeamsState((current) => [data.equipo, ...current]);
      notifications.show({
        color: 'green',
        title: isCopy ? 'Temporada creada' : 'Equipo creado',
        message: isCopy
          ? `${data.copiedPlayers || 0} jugadores copiados a ${data.equipo.temporada}.`
          : `${data.equipo.nombre} está listo.`,
      });
      setModal({ type: null, team: null });
      router.refresh();
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo guardar', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeam(team) {
    const ok = window.confirm(`¿Eliminar ${team.nombre} (${team.temporada}) y todos sus jugadores?`);
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', team_id: team.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el equipo');
      setTeamsState((current) => current.filter((item) => String(item.id) !== String(team.id)));
      notifications.show({ color: 'green', title: 'Equipo eliminado', message: team.nombre });
      router.refresh();
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo eliminar', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
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
          <Button radius="xl" size="xs" leftSection={<IconPlus size={14} />} onClick={openCreate}>
            Nuevo equipo
          </Button>
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
                      <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => deleteTeam(team)}>
                        Eliminar
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
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

      <Modal
        opened={!!modal.type}
        onClose={closeModal}
        title={modal.type === 'copy' ? 'Copiar equipo a temporada' : 'Nuevo equipo'}
        size="lg"
      >
        <form onSubmit={submitTeam}>
          <Stack gap="md">
            <TextInput
              label="Nombre"
              required
              value={form.nombre}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((current) => ({ ...current, nombre: value }));
              }}
            />
            <TextInput
              label="Temporada"
              required
              placeholder="2026/27"
              value={form.temporada}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((current) => ({ ...current, temporada: value }));
              }}
            />
            <TextInput
              label="Descripción"
              value={form.descripcion}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((current) => ({ ...current, descripcion: value }));
              }}
            />
            <Group justify="flex-end">
              <Button type="submit" radius="xl" size="xs" loading={saving}>
                {modal.type === 'copy' ? 'Crear temporada' : 'Crear equipo'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
