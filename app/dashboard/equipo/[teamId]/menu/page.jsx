'use client';

import { useState, useEffect } from 'react';
import {
  ActionIcon,
  Anchor,
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCalendar,
  IconChefHat,
  IconUpload,
  IconList,
  IconTrash,
} from '@tabler/icons-react';
import MenuSemanal, { formatWeek } from '@/components/MenuSemanal';
import { getWeeklyMenus, uploadWeeklyMenu, deleteWeeklyMenu } from '@/services/menu';

export default function MenuPage({ params }) {
  const teamId = params?.teamId;
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [viewMode, setViewMode] = useState('diaria'); // 'diaria' or 'semanal'
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [weekDate, setWeekDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });

  useEffect(() => {
    let active = true;
    if (!teamId) return;
    getWeeklyMenus(teamId)
      .then((data) => {
        if (active) {
          const list = data.menus || [];
          setMenus(list);
          setSelectedMenu(list[0] || null);
        }
      })
      .catch((err) => console.error('Error fetching menus:', err));
    return () => {
      active = false;
    };
  }, [teamId]);

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

  async function handleDeleteMenu(id) {
    if (!id) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este menú comedor? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await deleteWeeklyMenu(id);
      notifications.show({
        color: 'green',
        title: 'Menú eliminado',
        message: 'El menú comedor se ha eliminado correctamente.',
      });
      setMenus((prev) => prev.filter((m) => m.id !== id));
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
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <Group gap="sm" wrap="nowrap">
              <Tooltip label="Volver al panel" withArrow>
                <ActionIcon
                  component={Anchor}
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
                  Comedor del primer equipo, comida y cena.
                </Text>
              </Stack>
            </Group>

            <Group align="center" gap="xs" wrap="wrap">
              <Select
                placeholder="Selecciona una semana"
                leftSection={<IconCalendar size={14} style={{ opacity: 0.7 }} />}
                data={weekOptions}
                value={selectedMenu?.semana || null}
                onChange={(value) => {
                  const next = menus.find((menu) => menu.semana === value);
                  if (next) setSelectedMenu(next);
                }}
                disabled={menus.length === 0}
                variant="filled"
                radius="xl"
                size="xs"
                allowDeselect={false}
                style={{ width: 180 }}
              />

              {selectedMenu && (
                <Tooltip label="Eliminar menú seleccionado" withArrow>
                  <ActionIcon
                    onClick={() => handleDeleteMenu(selectedMenu.id)}
                    variant="light"
                    color="red"
                    radius="xl"
                    size="md"
                    loading={deleting}
                    style={{ width: 30, height: 30 }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              )}

              {/* Premium Micro-segmented Pill Switcher */}
              <Group gap={4} p={3} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-xl)', border: '1px solid var(--mantine-color-gray-2)' }}>
                <Tooltip label="Día a Día (Vista diaria)" withArrow>
                  <ActionIcon
                    onClick={() => setViewMode('diaria')}
                    variant={viewMode === 'diaria' ? 'filled' : 'transparent'}
                    color={viewMode === 'diaria' ? 'dark' : 'gray'}
                    radius="xl"
                    size="sm"
                    style={{ width: 28, height: 28 }}
                  >
                    <IconCalendar size={14} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Semana completa (Vista general)" withArrow>
                  <ActionIcon
                    onClick={() => setViewMode('semanal')}
                    variant={viewMode === 'semanal' ? 'filled' : 'transparent'}
                    color={viewMode === 'semanal' ? 'dark' : 'gray'}
                    radius="xl"
                    size="sm"
                    style={{ width: 28, height: 28 }}
                  >
                    <IconList size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Group>
        </Stack>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }}>
        <Stack gap="md">
          {/* Admin Coach Upload Bar */}
          <Paper p="sm" radius="md" bg="gray.0" withBorder style={{ borderStyle: 'dashed' }}>
            <Group justify="space-between" align="center" gap="xs" wrap="wrap">
              <Text size="xs" fw={700} c="dimmed">
                SUBIR O ACTUALIZAR PLANIFICACIÓN DE MENÚ:
              </Text>
              <Group gap="xs">
                <TextInput
                  type="date"
                  value={weekDate}
                  onChange={(e) => setWeekDate(e.target.value)}
                  leftSection={<IconCalendar size={14} />}
                  size="xs"
                  radius="xl"
                  variant="filled"
                  style={{ width: 135 }}
                />
                <FileButton onChange={handleUploadFile} accept="image/*,.pdf" disabled={uploading}>
                  {(props) => (
                    <Button
                      {...props}
                      loading={uploading}
                      radius="xl"
                      leftSection={<IconUpload size={12} />}
                      color="blue"
                      size="xs"
                    >
                      Subir PDF / Imagen
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Group>
          </Paper>

          {/* Core MenuSemanal viewer */}
          <MenuSemanal selectedMenu={selectedMenu} viewMode={viewMode} />
        </Stack>
      </Box>
    </Stack>
  );
}
