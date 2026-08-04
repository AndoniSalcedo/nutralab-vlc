'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconTrash,
  IconUser,
  IconUserCheck,
  IconUserPlus,
  IconUsersGroup,
} from '@tabler/icons-react';
import {
  assignTeams,
  createTecnico,
  getTecnicos,
} from '@/services/tecnico';
import ConfirmModal from '@/components/modals/ConfirmModal';

export default function TeamTecnicosConfig({ team, readOnly = false }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  // Form states in modal
  const [addMode, setAddMode] = useState('existing'); // 'existing' | 'new'
  const [selectedTecnicoId, setSelectedTecnicoId] = useState(null);
  const [emailForm, setEmailForm] = useState('');
  const [unassigningTecnico, setUnassigningTecnico] = useState(null);
  const [unassigning, setUnassigning] = useState(false);

  async function loadTecnicos() {
    setLoading(true);
    try {
      const data = await getTecnicos();
      setTecnicos(data || []);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al cargar técnicos',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTecnicos();
  }, []);

  // Filter assigned vs available
  const assignedTecnicos = useMemo(() => {
    return tecnicos.filter((t) =>
      (t.team_ids || []).some((id) => String(id) === String(team.id))
    );
  }, [tecnicos, team.id]);

  const availableTecnicos = useMemo(() => {
    return tecnicos.filter(
      (t) => !(t.team_ids || []).some((id) => String(id) === String(team.id))
    );
  }, [tecnicos, team.id]);

  const selectOptions = useMemo(() => {
    return availableTecnicos.map((t) => ({
      value: String(t.id),
      label: `${t.nombre} ${t.apellidos || ''} (${t.email})`.trim(),
    }));
  }, [availableTecnicos]);

  async function handleAddExisting() {
    if (!selectedTecnicoId) return;
    setSaving(true);
    try {
      const target = tecnicos.find((t) => String(t.id) === String(selectedTecnicoId));
      if (!target) return;
      const currentTeamIds = target.team_ids || [];
      const newTeamIds = Array.from(new Set([...currentTeamIds, team.id]));

      await assignTeams(target.id, newTeamIds);

      notifications.show({
        color: 'green',
        title: 'Técnico asignado',
        message: `${target.nombre} asignado a ${team.nombre} con éxito.`,
      });

      setModalOpened(false);
      setSelectedTecnicoId(null);
      await loadTecnicos();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al asignar',
        message: err.message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAndAssign(e) {
    e.preventDefault();
    if (!emailForm) return;
    setSaving(true);
    try {
      // 1. Link new tecnico by email
      const linkedTecnico = await createTecnico({ email: emailForm });

      // 2. Assign current team
      const currentTeamIds = linkedTecnico.team_ids || [];
      const newTeamIds = Array.from(new Set([...currentTeamIds, team.id]));
      await assignTeams(linkedTecnico.id, newTeamIds);

      notifications.show({
        color: 'green',
        title: 'Técnico vinculado y asignado',
        message: `Técnico ${linkedTecnico.nombre} asignado a ${team.nombre}.`,
      });

      setModalOpened(false);
      setEmailForm('');
      await loadTecnicos();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al vincular técnico',
        message: err.message,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleUnassign(tecnico) {
    setUnassigningTecnico(tecnico);
  }

  async function executeUnassign() {
    if (!unassigningTecnico) return;
    setUnassigning(true);
    try {
      const newTeamIds = (unassigningTecnico.team_ids || []).filter(
        (id) => String(id) !== String(team.id)
      );
      await assignTeams(unassigningTecnico.id, newTeamIds);

      notifications.show({
        color: 'green',
        title: 'Técnico desvinculado',
        message: `${unassigningTecnico.nombre} ya no tiene acceso a este equipo.`,
      });

      await loadTecnicos();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err.message,
      });
    } finally {
      setUnassigning(false);
      setUnassigningTecnico(null);
    }
  }

  return (
    <Paper p="md" radius="lg" shadow="sm" withBorder bg="white">
      <Group justify="space-between" align="center" wrap="wrap" gap="md" mb="lg">
        <Group gap="sm">
          <ThemeIcon size="md" radius="xl" variant="light" color="blue">
            <IconUserCheck size={18} />
          </ThemeIcon>
          <Box>
            <Title order={4} c="dark.4">
              Cuerpo Técnico del Equipo
            </Title>
            <Text size="xs" c="dimmed">
              Gestiona los técnicos que tienen acceso a visualizar este equipo.
            </Text>
          </Box>
        </Group>

        {!readOnly && (
          <Button
            leftSection={<IconPlus size={14} />}
            size="sm"
            radius="xl"
            variant="light"
            color="blue"
            onClick={() => {
              setAddMode(availableTecnicos.length > 0 ? 'existing' : 'new');
              setSelectedTecnicoId(null);
              setEmailForm('');
              setModalOpened(true);
            }}
          >
            Añadir Técnico
          </Button>
        )}
      </Group>

      {loading ? (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          Cargando técnicos del equipo...
        </Text>
      ) : assignedTecnicos.length > 0 ? (
        <Table
          verticalSpacing="md"
          horizontalSpacing="md"
          striped
          highlightOnHover
          style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Técnico</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Rol</Table.Th>
              {!readOnly && <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {assignedTecnicos.map((tecnico) => (
              <Table.Tr key={tecnico.id}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon color="blue" variant="light" radius="xl" size={32}>
                      <IconUser size={16} />
                    </ThemeIcon>
                    <Text fw={650} size="sm" c="#24291f">
                      {tecnico.nombre} {tecnico.apellidos || ''}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {tecnico.email}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="blue" size="sm">
                    Técnico
                  </Badge>
                </Table.Td>
                {!readOnly && (
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Tooltip label="Desvincular del equipo" position="top" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        radius="xl"
                        onClick={() => handleUnassign(tecnico)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Stack align="center" gap="xs" py="xl">
          <ThemeIcon color="gray" variant="light" radius="xl" size={42}>
            <IconUsersGroup size={20} />
          </ThemeIcon>
          <Text fw={600} size="sm" c="dimmed">
            No hay ningún técnico asignado a este equipo.
          </Text>
          {!readOnly && (
            <Text size="xs" c="dimmed" ta="center" maw={320}>
              Haz clic en &quot;Añadir Técnico&quot; para asignarle acceso a este equipo.
            </Text>
          )}
        </Stack>
      )}

      {/* Modal Añadir Técnico */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <IconUserPlus size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>Añadir Técnico a {team.nombre}</Text>
          </Group>
        }
        size="md"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Tabs value={addMode} onChange={setAddMode} variant="outline" radius="md" mb="md">
          <Tabs.List grow>
            <Tabs.Tab value="existing" disabled={availableTecnicos.length === 0}>
              Técnicos vinculados ({availableTecnicos.length})
            </Tabs.Tab>
            <Tabs.Tab value="new">Vincular por email</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="existing" pt="md">
            <Stack gap="md">
              <Text size="xs" c="dimmed">
                Selecciona un técnico que ya tengas vinculado en tu cuenta para añadirlo a este equipo.
              </Text>

              <Select
                label="Seleccionar técnico"
                placeholder="Elige un técnico..."
                data={selectOptions}
                value={selectedTecnicoId}
                onChange={setSelectedTecnicoId}
                searchable
                nothingFoundMessage="No se encontraron técnicos disponibles"
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
                <Button
                  radius="xl"
                  disabled={!selectedTecnicoId}
                  loading={saving}
                  onClick={handleAddExisting}
                >
                  Asignar a equipo
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="new" pt="md">
            <form onSubmit={handleCreateAndAssign}>
              <Stack gap="md">
                <Text size="xs" c="dimmed">
                  Ingresa el correo del técnico para vincularlo a tu cuenta y asignarlo automáticamente a este equipo. El técnico debe estar registrado previamente.
                </Text>
                <TextInput
                  label="Email del técnico"
                  required
                  type="email"
                  placeholder="tecnico@ejemplo.com"
                  value={emailForm}
                  onChange={(e) => setEmailForm(e.target.value)}
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
                    Vincular y Asignar
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Modal>

      <ConfirmModal
        opened={unassigningTecnico !== null}
        onClose={() => setUnassigningTecnico(null)}
        onConfirm={executeUnassign}
        title="Desvincular técnico"
        message={`¿Estás seguro de que deseas desvincular a ${unassigningTecnico?.nombre || ''} ${unassigningTecnico?.apellidos || ''} de este equipo?`}
        confirmLabel="Desvincular"
        loading={unassigning}
      />
    </Paper>
  );
}
