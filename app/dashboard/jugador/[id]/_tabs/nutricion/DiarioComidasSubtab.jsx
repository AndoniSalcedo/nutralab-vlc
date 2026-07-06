'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Group,
  Image,
  Modal,
  Stack,
  Text,
  Box,
  Button,
  Select,
  SimpleGrid,
  Title,
  Paper,
  Skeleton
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import { IconX, IconPlus, IconPhoto, IconCalendar } from '@tabler/icons-react';

import NothingFound from '@/components/NothingFound/NothingFound';
import { deletePlayerMeal, listPlayerMeals } from '@/services/meal';
import MealCard from './MealCard';
import MealForm from './MealForm';

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

export default function DiarioComidasSubtab({ jugador, readOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  
  const [viewer, setViewer] = useState({ open: false, src: '', caption: '' });
  const [mealType, setMealType] = useState('');
  const [day, setDay] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMeal, setEditorMeal] = useState(null);
  const [deleteMeal, setDeleteMeal] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
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
      
      {/* 1. CONTROLES Y FILTROS */}
      <Paper p="md" bg="white" shadow="xs" radius={0} style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 10, position: 'relative' }}>
        <Stack gap="sm">
            <Group justify="space-between" align="center">
                <Title order={3} fw={800} c="dark.4">Diario de Comidas</Title>
                {!readOnly && (
                  <Button 
                      id='btn-add-meal'
                      size="sm" 
                      radius="xl" 
                      leftSection={<IconPlus size={16} />} 
                      onClick={openNewMeal}
                      color="dark"
                  >
                      Registrar
                  </Button>
                )}
            </Group>

            {/* Grid de Filtros */}
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
      <Stack p="md" gap="lg">
        {loading ? (
           <Stack gap="md">
             <Skeleton h={120} radius="xl" animate /> 
             <Skeleton h={120} radius="xl" animate />
             <Skeleton h={120} radius="xl" animate />
           </Stack>
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
              
              <Stack gap="md">
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
              </Stack>
            </Stack>
          ))
        )}
      </Stack>

      {/* 3. MODALES */}
      
      {/* Visor */}
      <Modal
        opened={viewer.open}
        onClose={() => setViewer({ open: false, src: '', caption: '' })}
        size="lg"
        centered
        withCloseButton={false}
        padding={0}
        radius="lg"
        styles={{ body: { padding: 0, backgroundColor: 'black' } }}
      >
        <Stack gap={0} bg="black" style={{ position: 'relative' }}>
          <Box style={{ position: 'relative' }}>
             {viewer.src ? (
                <Image src={viewer.src} alt="" fit="contain" h="auto" w="100%" style={{ maxHeight: '80vh' }} />
             ) : (
                <Box h={300} c="dimmed" display="flex" style={{alignItems: 'center', justifyContent: 'center'}}>Sin imagen</Box>
             )}
             
             <ActionIcon 
                variant="filled" 
                color="dark" 
                radius="xl" 
                size="lg" 
                onClick={() => setViewer({ open: false, src: '', caption: '' })}
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
             >
                <IconX size={20} />
             </ActionIcon>
          </Box>
          
          {viewer.caption && (
            <Paper p="md" bg="dark.7" radius={0}>
                <Text c="white" size="sm" ta="center">{viewer.caption}</Text>
            </Paper>
          )}
        </Stack>
      </Modal>

      {/* Editor */}
      {!readOnly && (
        <Modal
          opened={editorOpen}
          onClose={closeEditor}
          size="lg"
          centered
          title={<Text fw={700}>{editorMeal ? 'Editar Comida' : 'Registrar Comida'}</Text>}
          radius="lg"
          padding="lg"
        >
          <MealForm 
            jugadorId={jugador.id}
            meal={editorMeal}
            onSuccess={() => {
              closeEditor();
              setReload(prev => prev + 1);
            }}
            onCancel={closeEditor}
          />
        </Modal>
      )}

      {/* Eliminar */}
      {!readOnly && (
        <Modal
          opened={Boolean(deleteMeal)}
          onClose={() => setDeleteMeal(null)}
          centered
          title={<Text fw={700}>Eliminar ingesta</Text>}
          radius="lg"
          padding="lg"
        >
          <Stack gap="md">
            <Text>
              Vas a eliminar esta ingesta de forma definitiva. Esta acción no se puede deshacer.
            </Text>
            <Group justify="flex-end">
              <Button variant="subtle" color="gray" radius="xl" onClick={() => setDeleteMeal(null)}>
                Cancelar
              </Button>
              <Button color="red" radius="xl" onClick={handleConfirmDelete}>
                Eliminar
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Box>
  );
}
