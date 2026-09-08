'use client';

import { useState, useEffect } from 'react';
import {
  ActionIcon,
  Stack,
  Group,
  Button,
  Tooltip,
  Box,
  Select,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconEdit, IconCheck, IconCalendar, IconList, IconPlus, IconX } from '@tabler/icons-react';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import MenuSemanal, { formatWeek, WEEKDAY_ORDER } from '@/components/MenuSemanal';
import { uploadWeeklyMenu, deleteWeeklyMenu, updateWeeklyMenu } from '@/services/menu';
import ConfirmModal from '@/components/modals/ConfirmModal';
import CreateMenuModal from '@/components/modals/CreateMenuModal';
import { TeamHeaderRightSection, TeamHeaderFilters } from '@/components/TeamHeaderContext';

export default function TeamMenuDashboard({ initialMenus = [], teamId, team: _team, readOnly = false }) {
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
      setSelectedMenu(data.menu);

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
    <BoneyardSkeleton name="team-menu" loading={false}>
      {/* 1. CONTROLES Y ACCIONES INTEGRADOS EN LA CABECERA */}
      <TeamHeaderRightSection>
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
            /* Micro-segmented Pill Switcher (sin nombre, solo iconos a la altura del nombre del equipo) */
            <Group gap={4} p={3} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-xl)', border: '1px solid var(--mantine-color-gray-2)' }}>
              <Tooltip label="Día a Día (Vista diaria)" withArrow>
                <ActionIcon
                  onClick={() => setViewMode('diaria')}
                  variant={viewMode === 'diaria' ? 'filled' : 'transparent'}
                  color={viewMode === 'diaria' ? 'dark' : 'gray'}
                  radius="xl"
                  size="md"
                  style={{ width: 32, height: 32 }}
                  aria-label="Vista diaria"
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
                  aria-label="Vista semanal"
                >
                  <IconList size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>
      </TeamHeaderRightSection>

      {/* 2. SELECTOR DE SEMANA Y ACCIONES DE MENÚ INTEGRADOS EN LA CABECERA */}
      <TeamHeaderFilters>
        {!isEditing && (
          <Box w="100%" style={{ minWidth: 0 }}>
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <Select
                placeholder="Selecciona una semana"
                leftSection={<IconCalendar size={16} style={{ opacity: 0.7 }} />}
                data={weekOptions || []}
                value={selectedMenu?.semana || null}
                onChange={(value) => {
                  const next = menus.find((menu) => menu.semana === value);
                  if (next) setSelectedMenu(next);
                }}
                disabled={!menus || menus.length === 0}
                variant="filled"
                radius="xl"
                size="sm"
                allowDeselect={false}
                style={{ flex: '1 1 200px', minWidth: 0 }}
              />

              {!readOnly && (
                <Group gap={6} wrap="nowrap" w={{ base: '100%', sm: 'auto' }} style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <Button
                    color="nutralabColor.8"
                    radius="xl"
                    size="sm"
                    onClick={() => setCreateModalOpen(true)}
                    leftSection={<IconPlus size={15} />}
                    style={{ flex: 1, minWidth: 0 }}
                    px={{ base: 6, sm: 12 }}
                  >
                    <Text span truncate fz="xs" fw={600}>
                      <Text span hiddenFrom="xs">Crear</Text>
                      <Text span visibleFrom="xs">Nuevo Menú</Text>
                    </Text>
                  </Button>

                  {selectedMenu && (
                    <>
                      <Button
                        variant="light"
                        color="teal"
                        radius="xl"
                        size="sm"
                        onClick={handleStartEdit}
                        leftSection={<IconEdit size={15} />}
                        style={{ flex: 1, minWidth: 0 }}
                        px={{ base: 6, sm: 12 }}
                      >
                        <Text span truncate fz="xs" fw={600}>
                          <Text span hiddenFrom="xs">Editar</Text>
                          <Text span visibleFrom="xs">Editar Menú</Text>
                        </Text>
                      </Button>

                      <Button
                        variant="light"
                        color="red"
                        radius="xl"
                        size="sm"
                        onClick={() => handleDeleteMenu(selectedMenu.id)}
                        loading={deleting}
                        leftSection={<IconTrash size={15} />}
                        style={{ flex: 1, minWidth: 0 }}
                        px={{ base: 6, sm: 12 }}
                      >
                        <Text span truncate fz="xs" fw={600}>
                          <Text span hiddenFrom="xs">Eliminar</Text>
                          <Text span visibleFrom="xs">Eliminar Menú</Text>
                        </Text>
                      </Button>
                    </>
                  )}
                </Group>
              )}
            </Group>
          </Box>
        )}
      </TeamHeaderFilters>

      <Stack gap="lg" style={{ width: '100%', minWidth: 0 }}>

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

        <CreateMenuModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          weekDate={weekDate}
          setWeekDate={setWeekDate}
          handleUploadFile={handleUploadFile}
          handleCreateEmptyMenu={handleCreateEmptyMenu}
          uploading={uploading}
          creatingEmpty={creatingEmpty}
        />
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
    </BoneyardSkeleton>
  );
}
