'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  FileButton,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCamera,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUserCheck,
  IconUserPlus,
  IconUsersGroup,
} from '@tabler/icons-react';
import {
  createTecnico,
  deleteTecnico,
  assignTeams,
  getTecnicos,
  uploadTecnicoAvatar,
} from '@/services/tecnico';
import { compressAvatar, initials } from '@/lib/avatar';
import ConfirmModal from '@/components/modals/ConfirmModal';


export default function TecnicosManager({ teams = [] }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [assigningTecnico, setAssigningTecnico] = useState(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [form, setForm] = useState({
    email: '',
  });
  const [deletingTecnico, setDeletingTecnico] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredTeamsGrouped = useMemo(() => {
    const needle = assignSearch.toLowerCase().trim();
    const filtered = teams.filter(
      (t) =>
        !needle ||
        `${t.nombre} ${t.temporada}`.toLowerCase().includes(needle)
    );

    const groups = {};
    for (const team of filtered) {
      const season = team.temporada || 'Otros';
      if (!groups[season]) groups[season] = [];
      groups[season].push(team);
    }
    return groups;
  }, [teams, assignSearch]);


  async function loadTecnicos() {
    setLoading(true);
    try {
      const data = await getTecnicos();
      setTecnicos(data);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTecnicos();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const linkedTecnico = await createTecnico(form);
      notifications.show({
        color: 'green',
        title: 'Éxito',
        message: `Técnico ${linkedTecnico.nombre} vinculado con éxito.`,
      });
      setModalOpened(false);
      setForm({ email: '' });
      loadTecnicos();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al vincular',
        message: err.message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadAvatar(tecnicoId, file) {
    if (!file) return;
    try {
      const compressed = await compressAvatar(file);
      await uploadTecnicoAvatar(tecnicoId, compressed);
      notifications.show({
        color: 'green',
        title: 'Foto actualizada',
        message: 'La foto del técnico se ha guardado correctamente.',
      });
      loadTecnicos();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al subir foto',
        message: err.message,
      });
    }
  }

  function handleDelete(tecnico) {
    setDeletingTecnico(tecnico);
  }

  async function executeDelete() {
    if (!deletingTecnico) return;
    setDeleting(true);
    try {
      await deleteTecnico(deletingTecnico.id);
      notifications.show({
        color: 'green',
        title: 'Técnico eliminado',
        message: `${deletingTecnico.nombre} ha sido eliminado.`,
      });
      loadTecnicos();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err.message,
      });
    } finally {
      setDeleting(false);
      setDeletingTecnico(null);
    }
  }

  async function handleAssignTeams(tecnicoId, teamIds) {
    try {
      await assignTeams(tecnicoId, teamIds);
      notifications.show({
        color: 'green',
        title: 'Equipos asignados',
        message: 'Asignación de equipos actualizada con éxito.',
      });
      // Actualizar estado local
      setTecnicos((current) =>
        current.map((t) =>
          String(t.id) === String(tecnicoId)
            ? { ...t, team_ids: teamIds }
            : t
        )
      );
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al asignar',
        message: err.message,
      });
    }
  }

  function openAssignModal(tecnico) {
    setAssigningTecnico(tecnico);
    setSelectedTeamIds(tecnico.team_ids || []);
    setAssignSearch('');
  }

  return (
    <Stack gap="lg">
      <Paper p={{ base: 'sm', sm: 'md' }} shadow="xs" radius={24} bg="white">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm">
            <ThemeIcon color="dark" variant="light" radius="md" size={42}>
              <IconUserCheck size={21} />
            </ThemeIcon>
            <Box>
              <Title order={3} fw={850} c="#24291f" lh={1.1}>
                Cuerpo Técnico
              </Title>
              <Text size="xs" c="dimmed" mt={2}>
                Vincula técnicos registrados ingresando su correo y asígnales tus equipos.
              </Text>
            </Box>
          </Group>
          <Button
            radius="xl"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => setModalOpened(true)}
          >
            Vincular técnico
          </Button>
        </Group>
      </Paper>

      <Paper p="md" shadow="sm" radius="lg" withBorder bg="white">
        {loading ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            Cargando técnicos...
          </Text>
        ) : tecnicos.length > 0 ? (
          <Box style={{ overflowX: 'auto' }}>
            <Table verticalSpacing="md" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '25%' }}>Nombre</Table.Th>
                  <Table.Th style={{ width: '25%' }}>Email</Table.Th>
                  <Table.Th style={{ width: '40%' }}>Equipos Asignados</Table.Th>
                  <Table.Th style={{ width: '10%', textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tecnicos.map((tecnico) => (
                  <Table.Tr key={tecnico.id}>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Box style={{ position: 'relative', display: 'inline-block' }}>
                          <Avatar
                            src={tecnico.avatar_size ? `/api/tecnicos/avatar?id=${tecnico.id}&t=${tecnico.updated_at || Date.now()}` : undefined}
                            size={38}
                            radius="xl"
                            color="blue"
                            style={{
                              border: '2px solid white',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                              fontWeight: 700,
                            }}
                          >
                            {initials(`${tecnico.nombre || ''} ${tecnico.apellidos || ''}`)}
                          </Avatar>
                          <FileButton onChange={(file) => handleUploadAvatar(tecnico.id, file)} accept="image/*">
                            {(props) => (
                              <Tooltip label="Cambiar foto" position="top" withArrow>
                                <ActionIcon
                                  {...props}
                                  variant="filled"
                                  color="dark"
                                  radius="xl"
                                  size={18}
                                  style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    border: '1.5px solid white',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <IconCamera size={10} stroke={2} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </FileButton>
                        </Box>
                        <Box>
                          <Text fw={650} size="sm" c="#24291f" lh={1.2}>
                            {tecnico.nombre} {tecnico.apellidos || ''}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Técnico
                          </Text>
                        </Box>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {tecnico.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {tecnico.team_ids && tecnico.team_ids.length > 0 ? (
                        <Group gap={6}>
                          {tecnico.team_ids.slice(0, 3).map((teamId) => {
                            const foundTeam = teams.find(t => String(t.id) === String(teamId));
                            return (
                              <Badge key={teamId} variant="light" color="blue" size="sm">
                                {foundTeam ? `${foundTeam.nombre} (${foundTeam.temporada})` : `Equipo #${teamId}`}
                              </Badge>
                            );
                          })}
                          {tecnico.team_ids.length > 3 && (
                            <Badge variant="filled" color="gray" size="sm">
                              +{tecnico.team_ids.length - 3} más
                            </Badge>
                          )}
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">
                          Sin equipos asignados
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Asignar equipos" position="top" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            radius="xl"
                            onClick={() => openAssignModal(tecnico)}
                          >
                            <IconUsersGroup size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar técnico" position="top" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            radius="xl"
                            onClick={() => handleDelete(tecnico)}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        ) : (
          <Stack align="center" gap="sm" py="xl">
            <ThemeIcon color="gray" variant="light" radius="xl" size={48}>
              <IconUsersGroup size={24} />
            </ThemeIcon>
            <Text fw={600} size="sm" c="dimmed">
              No tienes ningún técnico vinculado todavía.
            </Text>
            <Text size="xs" c="dimmed" ta="center" maw={320}>
              Haz clic en &quot;Vincular técnico&quot; e ingresa su correo para asociarlo a tus equipos.
            </Text>
          </Stack>
        )}
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <IconUserPlus size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>Vincular Técnico</Text>
          </Group>
        }
        size="sm"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <Text size="xs" c="dimmed">
              Ingresa el correo del técnico que deseas asociar. El técnico debe estar registrado previamente.
            </Text>
            <TextInput
              label="Email del técnico"
              required
              type="email"
              placeholder="tecnico@ejemplo.com"
              value={form.email}
              onChange={(e) => setForm({ email: e.target.value })}
              radius="md"
            />
            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                color="gray"
                radius="xl"
                onClick={() => setModalOpened(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" radius="xl" loading={saving}>
                Vincular
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={!!assigningTecnico}
        onClose={() => setAssigningTecnico(null)}
        title={
          <Group gap="xs">
            <IconUsersGroup size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>
              Asignar Equipos a {assigningTecnico?.nombre} {assigningTecnico?.apellidos || ''}
            </Text>
          </Group>
        }
        size="lg"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Stack gap="md">
          <TextInput
            placeholder="Buscar por nombre de equipo o temporada"
            leftSection={<IconSearch size={16} />}
            value={assignSearch}
            onChange={(e) => setAssignSearch(e.target.value)}
            radius="md"
          />

          <ScrollArea h={320} offsetScrollbars>
            <Stack gap="md">
              {Object.keys(filteredTeamsGrouped).length > 0 ? (
                Object.keys(filteredTeamsGrouped).map((season) => (
                  <Box key={season}>
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5} mb={6}>
                      Temporada {season}
                    </Text>
                    <Paper withBorder radius="md" p={0} overflow="hidden">
                      <Stack gap={0}>
                        {filteredTeamsGrouped[season].map((team, idx) => {
                          const isSelected = selectedTeamIds.map(String).includes(String(team.id));
                          return (
                            <Box
                              key={team.id}
                              px="md"
                              py="xs"
                              style={{
                                cursor: 'pointer',
                                backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                                borderBottom: idx === filteredTeamsGrouped[season].length - 1 ? 'none' : '1px solid var(--mantine-color-gray-2)',
                              }}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTeamIds(prev => prev.filter(id => String(id) !== String(team.id)));
                                } else {
                                  setSelectedTeamIds(prev => [...prev, team.id]);
                                }
                              }}
                            >
                              <Group justify="space-between" align="center">
                                <Box>
                                  <Text fw={600} size="sm" c={isSelected ? 'blue' : '#24291f'}>
                                    {team.nombre}
                                  </Text>
                                  {team.descripcion && (
                                    <Text size="xs" c="dimmed">
                                      {team.descripcion}
                                    </Text>
                                  )}
                                </Box>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => {}} // handled by row click
                                />
                              </Group>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Paper>
                  </Box>
                ))
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No se encontraron equipos que coincidan con la búsqueda.
                </Text>
              )}
            </Stack>
          </ScrollArea>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" radius="xl" onClick={() => setAssigningTecnico(null)}>
              Cancelar
            </Button>
            <Button
              radius="xl"
              onClick={async () => {
                setSaving(true);
                try {
                  await handleAssignTeams(assigningTecnico.id, selectedTeamIds);
                  setAssigningTecnico(null);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Guardar asignaciones
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmModal
        opened={deletingTecnico !== null}
        onClose={() => setDeletingTecnico(null)}
        onConfirm={executeDelete}
        title="Eliminar técnico"
        message={`¿Estás seguro de que deseas eliminar al técnico ${deletingTecnico?.nombre || ''} ${deletingTecnico?.apellidos || ''}? Se eliminará su acceso por completo.`}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </Stack>
  );
}
