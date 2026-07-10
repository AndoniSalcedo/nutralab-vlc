'use client';

import { useState, useEffect } from 'react';
import {
  ActionIcon,
  Paper,
  Stack,
  Group,
  Title,
  Text,
  Button,
  FileButton,
  TextInput,
  ThemeIcon,
  Tooltip,
  Box,
  Select,
  Modal,
  Divider,
  Grid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCalendar,
  IconChefHat,
  IconUpload,
  IconList,
  IconTrash,
  IconEdit,
  IconCheck,
  IconX,
  IconPlus,
} from '@tabler/icons-react';
import MenuSemanal, { formatWeek, WEEKDAY_ORDER } from '@/components/MenuSemanal';
import { uploadWeeklyMenu, deleteWeeklyMenu, updateWeeklyMenu } from '@/services/menu';
import Link from 'next/link';
import ConfirmModal from './ConfirmModal';

export default function TeamMenuDashboard({ initialMenus = [], teamId }) {
  const [menus, setMenus] = useState(initialMenus);
  const [selectedMenu, setSelectedMenu] = useState(initialMenus[0] || null);
  const [viewMode, setViewMode] = useState('diaria'); // 'diaria' or 'semanal'
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteMenuId, setDeleteMenuId] = useState(null);
  const [weekDate, setWeekDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedDias, setEditedDias] = useState([]);
  const [saving, setSaving] = useState(false);
  const [creatingEmpty, setCreatingEmpty] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  function handleStartEdit() {
    if (!selectedMenu) return;
    const existingDias = selectedMenu.dias || [];
    const fullDias = WEEKDAY_ORDER.map(diaName => {
      const match = existingDias.find(d => d.dia === diaName);
      if (match) {
        return JSON.parse(JSON.stringify(match));
      }
      return {
        dia: diaName,
        comida: { primero: '', segundo: '', postre: '' },
        cena: { primero: '', segundo: '', postre: '' }
      };
    });
    setEditedDias(fullDias);
    setIsEditing(true);
    setViewMode('diaria');
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  const handleUpdateDayData = (dayName, mealType, field, value) => {
    setEditedDias((prev) =>
      prev.map((d) => {
        if (d.dia === dayName) {
          return {
            ...d,
            [mealType]: {
              ...d[mealType],
              [field]: value,
            },
          };
        }
        return d;
      })
    );
  };

  async function handleSaveMenu() {
    if (!selectedMenu) return;
    setSaving(true);
    try {
      const data = await updateWeeklyMenu(selectedMenu.id, editedDias);
      setMenus((prev) => prev.map((m) => (m.id === selectedMenu.id ? data.menu : m)));
      setSelectedMenu(data.menu);
      setIsEditing(false);
      notifications.show({
        color: 'green',
        title: 'Menú guardado',
        message: 'El menú se ha guardado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al guardar menú',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateEmptyMenu() {
    if (!weekDate || !teamId) return;
    setCreatingEmpty(true);
    try {
      const defaultDias = WEEKDAY_ORDER.map((dia) => ({
        dia,
        comida: { primero: '', segundo: '', postre: '' },
        cena: { primero: '', segundo: '', postre: '' },
      }));

      const res = await fetch('/api/menu-semanal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semana: weekDate,
          equipo_id: teamId,
          dias: defaultDias,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el menú');

      setMenus((prev) => {
        const filtered = prev.filter((m) => m.semana !== data.menu.semana);
        const sorted = [data.menu, ...filtered].sort((a, b) => b.semana.localeCompare(a.semana));
        return sorted;
      });
      setSelectedMenu(data.menu);
      setEditedDias(defaultDias);
      setIsEditing(true);
      setViewMode('diaria');

      notifications.show({
        color: 'green',
        title: 'Menú creado',
        message: 'Se ha creado un menú vacío para la semana seleccionada. Ahora puedes rellenarlo.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al crear menú',
        message: e.message,
      });
    } finally {
      setCreatingEmpty(false);
    }
  }

  useEffect(() => {
    setSelectedMenu((prev) => {
      if (!prev) return menus[0] || null;
      const match = menus.find((m) => m.semana === prev.semana);
      return match || menus[0] || null;
    });
  }, [menus]);

  const weekOptions = menus.map((menu) => ({
    value: menu.semana,
    label: `Semana del ${formatWeek(menu.semana)}`,
  }));

  async function handleUploadFile(file) {
    if (!file) return;
    setUploading(true);
    const notificationId = 'menu-semanal-upload';
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'IA procesando',
      message: 'La IA está leyendo e indexando el menú.',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });

    try {
      const data = await uploadWeeklyMenu(file, weekDate, teamId);

      setMenus(prev => {
        const filtered = prev.filter(m => m.semana !== data.menu.semana);
        const sorted = [data.menu, ...filtered].sort((a, b) => b.semana.localeCompare(a.semana));
        return sorted;
      });

      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Menú actualizado',
        message: 'El menú semanal se ha procesado correctamente.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'Error al subir menú',
        message: e.message,
        loading: false,
        autoClose: 5000,
        withCloseButton: true,
      });
    } finally {
      setUploading(false);
    }
  }

  function handleDeleteMenu(id) {
    if (!id) return;
    setDeleteMenuId(id);
  }

  async function confirmDeleteMenu() {
    if (!deleteMenuId) return;
    setDeleting(true);
    try {
      await deleteWeeklyMenu(deleteMenuId);
      notifications.show({
        color: 'green',
        title: 'Menú eliminado',
        message: 'El menú comedor se ha eliminado correctamente.',
      });
      setMenus((prev) => {
        const filtered = prev.filter((m) => m.id !== deleteMenuId);
        if (selectedMenu?.id === deleteMenuId) {
          setSelectedMenu(filtered[0] || null);
        }
        return filtered;
      });
      setDeleteMenuId(null);
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al eliminar menú',
        message: e.message,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Stack gap={0}>
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative',
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm" wrap="nowrap">
              <Tooltip label="Volver al panel" withArrow>
                <ActionIcon
                  component={Link}
                  href={teamId ? `/dashboard/equipo/${teamId}` : '/dashboard'}
                  variant="light"
                  color="gray"
                  radius="xl"
                  size={42}
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
              </Tooltip>
              <ThemeIcon color="teal" variant="light" radius="xl" size="lg">
                <IconChefHat size={20} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={3} fw={800} c="dark.4">Menú comedor</Title>
                <Text size="sm" c="dimmed">
                  Comedor del equipo, comida y cena.
                </Text>
              </Stack>
            </Group>

            <Group align="center" gap="xs">
              {isEditing ? (
                <Group gap="xs">
                  <Button
                    color="green"
                    radius="xl"
                    size="sm"
                    onClick={handleSaveMenu}
                    loading={saving}
                    leftSection={<IconCheck size={16} />}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="light"
                    color="gray"
                    radius="xl"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    leftSection={<IconX size={16} />}
                  >
                    Cancelar
                  </Button>
                </Group>
              ) : (
                /* Premium Micro-segmented Pill Switcher */
                <Group gap={4} p={3} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-xl)', border: '1px solid var(--mantine-color-gray-2)' }}>
                  <Tooltip label="Día a Día (Vista diaria)" withArrow>
                    <ActionIcon
                      onClick={() => setViewMode('diaria')}
                      variant={viewMode === 'diaria' ? 'filled' : 'transparent'}
                      color={viewMode === 'diaria' ? 'dark' : 'gray'}
                      radius="xl"
                      size="md"
                      style={{ width: 32, height: 32 }}
                    >
                      <IconCalendar size={16} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label="Semana completa (Vista general)" withArrow>
                    <ActionIcon
                      onClick={() => setViewMode('semanal')}
                      variant={viewMode === 'semanal' ? 'filled' : 'transparent'}
                      color={viewMode === 'semanal' ? 'dark' : 'gray'}
                      radius="xl"
                      size="md"
                      style={{ width: 32, height: 32 }}
                    >
                      <IconList size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}
            </Group>
          </Group>

          {!isEditing && (
            <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
              <Group gap={8} w="100%" wrap="wrap" align="center">
                <Select
                  placeholder="Selecciona una semana"
                  leftSection={<IconCalendar size={16} style={{ opacity: 0.7 }} />}
                  data={weekOptions}
                  value={selectedMenu?.semana || null}
                  onChange={(value) => {
                    const next = menus.find((menu) => menu.semana === value);
                    if (next) setSelectedMenu(next);
                  }}
                  disabled={menus.length === 0}
                  variant="filled"
                  radius="xl"
                  size="sm"
                  allowDeselect={false}
                  style={{ flex: 1, minWidth: 260 }}
                />

                <Group gap={8}>
                  <Button
                    color="blue"
                    radius="xl"
                    size="sm"
                    onClick={() => setCreateModalOpen(true)}
                    leftSection={<IconPlus size={16} />}
                  >
                    Nuevo Menú
                  </Button>

                  {selectedMenu && (
                    <>
                      <Button
                        variant="light"
                        color="teal"
                        radius="xl"
                        size="sm"
                        onClick={handleStartEdit}
                        leftSection={<IconEdit size={16} />}
                      >
                        Editar Menú
                      </Button>

                      <Button
                        variant="light"
                        color="red"
                        radius="xl"
                        size="sm"
                        onClick={() => handleDeleteMenu(selectedMenu.id)}
                        loading={deleting}
                        leftSection={<IconTrash size={16} />}
                      >
                        Eliminar Menú
                      </Button>
                    </>
                  )}
                </Group>
              </Group>
            </Paper>
          )}
        </Stack>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }}>
        <Stack gap="md">
          {/* Core MenuSemanal viewer */}
          <MenuSemanal
            selectedMenu={selectedMenu}
            viewMode={viewMode}
            isEditing={isEditing}
            editedDias={editedDias}
            onChangeDayData={handleUpdateDayData}
          />
        </Stack>
      </Box>

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={
          <Text fw={850} size="lg" c="dark.4">
            Nuevo Menú Semanal
          </Text>
        }
        centered
        radius="lg"
        size="lg"
        styles={{
          header: {
            borderBottom: '1px solid var(--mantine-color-gray-1)',
            paddingBottom: 'var(--mantine-spacing-sm)',
            marginBottom: 'var(--mantine-spacing-md)',
          }
        }}
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed" lh={1.3}>
            Selecciona la fecha del lunes de la semana correspondiente. Después, puedes subir una imagen/PDF para que la IA extraiga los platos, o bien crear una plantilla vacía.
          </Text>

          <TextInput
            label="Lunes de la semana"
            type="date"
            value={weekDate}
            onChange={(e) => setWeekDate(e.target.value)}
            leftSection={<IconCalendar size={14} style={{ opacity: 0.7 }} />}
            radius="xl"
            size="sm"
            variant="filled"
          />

          <Divider my="xs" label="Elige el método de creación" labelPosition="center" />

          <Grid gutter="md" align="stretch">
            <Grid.Col span={{ base: 12, xs: 6 }}>
              <Paper
                p="md"
                radius="md"
                bg="gray.0"
                withBorder
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--mantine-spacing-sm)',
                }}
              >
                <Stack gap={4} style={{ flexGrow: 1 }}>
                  <ThemeIcon color="blue" variant="light" radius="md">
                    <IconUpload size={16} />
                  </ThemeIcon>
                  <Text fw={700} size="sm" mt="xs">
                    Subir con IA
                  </Text>
                  <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                    Sube un PDF o imagen del menú semanal. La IA leerá e indexará los platos automáticamente.
                  </Text>
                </Stack>
                <FileButton
                  onChange={(file) => {
                    setCreateModalOpen(false);
                    handleUploadFile(file);
                  }}
                  accept="image/*,.pdf"
                  disabled={uploading}
                >
                  {(props) => (
                    <Button
                      {...props}
                      loading={uploading}
                      radius="xl"
                      size="xs"
                      color="blue"
                      fullWidth
                    >
                      Subir Archivo
                    </Button>
                  )}
                </FileButton>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, xs: 6 }}>
              <Paper
                p="md"
                radius="md"
                bg="gray.0"
                withBorder
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--mantine-spacing-sm)',
                }}
              >
                <Stack gap={4} style={{ flexGrow: 1 }}>
                  <ThemeIcon color="teal" variant="light" radius="md">
                    <IconEdit size={16} />
                  </ThemeIcon>
                  <Text fw={700} size="sm" mt="xs">
                    Crear Vacío
                  </Text>
                  <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                    Inicializa una plantilla vacía y rellenala de manera manual día a día.
                  </Text>
                </Stack>
                <Button
                  onClick={() => {
                    setCreateModalOpen(false);
                    handleCreateEmptyMenu();
                  }}
                  loading={creatingEmpty}
                  radius="xl"
                  size="xs"
                  color="teal"
                  variant="light"
                  fullWidth
                >
                  Crear Manual
                </Button>
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      </Modal>
      <ConfirmModal
        opened={!!deleteMenuId}
        onClose={() => setDeleteMenuId(null)}
        onConfirm={confirmDeleteMenu}
        title="Eliminar menú"
        message="¿Estás seguro de que deseas eliminar este menú comedor? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </Stack>
  );
}
