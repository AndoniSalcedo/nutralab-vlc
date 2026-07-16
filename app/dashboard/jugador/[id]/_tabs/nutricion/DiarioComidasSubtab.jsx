'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Group,
  Stack,
  Text,
  Box,
  Button,
  Select,
  SimpleGrid,
  Title,
  Paper,
  ThemeIcon
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconPhoto, IconCalendar } from '@tabler/icons-react';

import NothingFound from '@/components/NothingFound/NothingFound';
import { deletePlayerMeal, listPlayerMeals } from '@/services/meal';
import MealCard from './MealCard';
import ImageViewerModal from '@/components/modals/ImageViewerModal';
import MealEditorModal from '@/components/modals/MealEditorModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

function groupByDate(items) {
  const map = new Map();

  for (const it of items) {
    const d = new Date(it.takenAt);
    if (Number.isNaN(+d)) continue;

    const iso = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
    
    const parts = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Europe/Madrid'
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
    
    // Capitalize weekday
    const weekday = get('weekday');
    const capitalizedWeekday = weekday ? weekday.charAt(0).toUpperCase() + weekday.slice(1) : '';
    const label = `${capitalizedWeekday}, ${get('day')} de ${get('month')}`;

    if (!map.has(iso)) map.set(iso, { iso, label, items: [] });
    map.get(iso).items.push(it);
  }
  return Array.from(map.values()).sort((a, b) => (a.iso < b.iso ? 1 : -1));
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'midMorning', label: 'Almuerzo' },
  { value: 'lunch', label: 'Comida' },
  { value: 'snack', label: 'Merienda' },
  { value: 'dinner', label: 'Cena' },
  { value: 'lateSnack', label: 'Re-cena' },
];

export default function DiarioComidasSubtab({ jugador, readOnly = false, initialMeals }) {
  const [loading, setLoading] = useState(initialMeals ? false : true);
  const [meals, setMeals] = useState(initialMeals || []);
  
  const [viewer, setViewer] = useState({ open: false, src: '', caption: '' });
  const [mealType, setMealType] = useState('');
  const [day, setDay] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMeal, setEditorMeal] = useState(null);
  const [deleteMeal, setDeleteMeal] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (initialMeals && reload === 0) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const data = await listPlayerMeals(jugador.id, {
          mealType: mealType || undefined,
          day: day ? day.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }) : undefined,
        });
        if (!alive) return;
        setMeals(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        if (alive) {
          notifications.show({
            title: 'Error al cargar diario',
            message: 'No se pudieron recuperar las ingestas del jugador.',
            color: 'red',
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [jugador.id, mealType, day, reload]);

  const grouped = useMemo(() => groupByDate(meals), [meals]);

  const openNewMeal = () => {
    setEditorMeal(null);
    setEditorOpen(true);
  };

  const openEditMeal = (meal) => {
    setEditorMeal(meal);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditorMeal(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteMeal) return;

    try {
      await deletePlayerMeal(deleteMeal.id);
      notifications.show({
        title: 'Ingesta eliminada',
        message: 'La comida se borró correctamente.',
        color: 'green',
      });
      setDeleteMeal(null);
      setReload((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'No se pudo eliminar',
        message: 'Inténtalo de nuevo en unos segundos.',
        color: 'red',
      });
    }
  };

  return (
    <Box w="100%" p={0} bg="gray.0" mih="100%" style={{ overflowX: 'hidden' }}>
      <Stack gap={0}>
        {/* Tab Header Banner */}
        <Paper
          p={{ base: 'sm', sm: 'md' }}
          bg="white"
          shadow="xs"
          radius="lg"
          withBorder
          style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        >
          <Group justify="space-between" align="center" gap="sm" wrap="wrap">
            <Group gap="xs">
              <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
                <IconCalendar size={20} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={800} c="dark.4">Diario de Comidas</Title>
                <Text size="sm" c="dimmed">
                  Registro diario de ingestas y comidas del jugador.
                </Text>
              </Box>
            </Group>

            {!readOnly && (
              <Button 
                  id='btn-add-meal'
                  size="md" 
                  radius="xl" 
                  leftSection={<IconPlus size={18} />} 
                  onClick={openNewMeal}
                  color="blue"
              >
                  Registrar
              </Button>
            )}
          </Group>
        </Paper>

        {/* Content wrapper */}
        <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
          <Stack gap="md">
            {/* 1. CONTROLES Y FILTROS */}
            <Paper p="md" bg="white" shadow="xs" radius="lg" withBorder>
              <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">Filtrar ingestas</Text>
                <SimpleGrid cols={2} spacing="xs">
                    <DatePickerInput
                        placeholder="Fecha"
                        leftSection={<IconCalendar size={16} />}
                        value={day}
                        onChange={setDay}
                        clearable
                        radius="md"
                        variant="filled"
                    />
                    <Select
                        placeholder="Tipo de comida"
                        value={mealType}
                        onChange={setMealType}
                        data={[{ value: '', label: 'Todas' }, ...MEAL_TYPES]}
                        radius="md"
                        variant="filled"
                        allowDeselect={false}
                    />
                </SimpleGrid>
              </Stack>
            </Paper>

            {/* 2. LISTA DE COMIDAS */}
            <Stack gap="lg">
              {loading ? (
                <BoneyardSkeleton name="diario-comidas" loading={true} />
              ) : meals.length === 0 ? (
                <Box mt="xl">
                  <NothingFound
                      title="Diario vacío"
                      description="No hay comidas registradas con estos filtros."
                      icon={IconPhoto}
                  />
                </Box>
              ) : (
                grouped.map((g) => (
                  <Stack key={g.iso} gap="sm">
                    <Text 
                      c="dimmed" 
                      size="sm" 
                      fw={700} 
                      tt="uppercase" 
                      style={{ paddingLeft: 4, letterSpacing: 0.5 }}
                    >
                      {g.label}
                    </Text>
                    
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                      {g.items.map((m) => (
                        <MealCard
                          key={m.id}
                          m={m}
                          onEdit={!readOnly ? () => openEditMeal(m) : undefined}
                          onDelete={!readOnly ? () => setDeleteMeal(m) : undefined}
                          onOpen={() =>
                            m.photoUrl &&
                            setViewer({
                              open: true,
                              src: m.photoUrl,
                              caption: `${new Date(m.takenAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} · ${Number.isFinite(m.calories) ? `${m.calories} kcal` : ''}`,
                            })
                          }
                        />
                      ))}
                    </SimpleGrid>
                  </Stack>
                ))
              )}
            </Stack>
          </Stack>
        </Box>
      </Stack>

      {/* 3. MODALES */}
      
      {/* Visor */}
      <ImageViewerModal
        opened={viewer.open}
        onClose={() => setViewer({ open: false, src: '', caption: '' })}
        viewer={viewer}
      />

      <MealEditorModal
        opened={editorOpen && !readOnly}
        onClose={closeEditor}
        jugadorId={jugador.id}
        meal={editorMeal}
        onSuccess={() => {
          closeEditor();
          setReload(prev => prev + 1);
        }}
        onCancel={closeEditor}
      />

      <ConfirmModal
        opened={Boolean(deleteMeal) && !readOnly}
        onClose={() => setDeleteMeal(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar ingesta"
        message="Vas a eliminar esta ingesta de forma definitiva. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </Box>
  );
}
