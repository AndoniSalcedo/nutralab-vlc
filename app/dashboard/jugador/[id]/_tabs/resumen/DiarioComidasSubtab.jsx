'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronLeft, IconChevronRight, IconPlus as IconPlusPlain } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { IconPlus, IconFlame, IconTrash } from '@/components/icons3d';

import { deletePlayerMeal, listPlayerMeals } from '@/actions/mealActions';
import ImageViewerModal from '@/components/modals/ImageViewerModal';
import MealEditorModal from '@/components/modals/MealEditorModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import SubtabHeader from '../SubtabHeader';
import classes from '../SubtabSectionHeader.module.css';

const TZ = 'Europe/Madrid';

// Tomas del día en orden cronológico; `optional` se oculta si está vacía
const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Desayuno', color: 'salvia', time: '08:30' },
  { key: 'midMorning', label: 'Almuerzo', color: 'salvia', time: '11:30' },
  { key: 'lunch', label: 'Comida', color: 'bosque', time: '14:00' },
  { key: 'snack', label: 'Merienda', color: 'salvia', time: '17:30' },
  { key: 'dinner', label: 'Cena', color: 'bosque', time: '21:00' },
  { key: 'lateSnack', label: 'Re-cena', color: 'salvia', time: '23:00', optional: true },
];
const SLOT_BY_KEY = Object.fromEntries(MEAL_SLOTS.map((s) => [s.key, s]));
const OTHER_SLOT = { key: 'other', label: 'Otros', color: 'salvia' };
const WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

const slotColor = (key, shade = 5) => `var(--mantine-color-${(SLOT_BY_KEY[key] || OTHER_SLOT).color}-${shade})`;
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const formatTime = (date) =>
  new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const formatKcal = (n) => Math.round(n).toLocaleString('es-ES');
const toDateKey = (date = new Date()) => new Date(date).toLocaleDateString('sv-SE', { timeZone: TZ });
const shiftDateKey = (key, days) => dayjs(key).add(days, 'day').format('YYYY-MM-DD');
const windowStartOf = (endKey) => shiftDateKey(endKey, -6);
const mealKcal = (meals) => meals.reduce((a, m) => a + (Number(m.calories) || 0), 0);

function computeStreak(activityByDay, todayKey) {
  // Si hoy aún no hay registros, la racha sigue viva desde ayer
  let cursor = activityByDay[todayKey] ? todayKey : shiftDateKey(todayKey, -1);
  let streak = 0;
  while (activityByDay[cursor]) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

// Hora sugerida para una toma nueva: la habitual del slot, sin pasar de "ahora" si es hoy
function draftTakenAt(dateKey, slot, todayKey) {
  const [h, m] = (slot?.time || '13:00').split(':').map(Number);
  const date = dayjs(dateKey).hour(h).minute(m).second(0).toDate();
  if (dateKey === todayKey && (!slot || date > new Date())) return new Date();
  return date;
}

/* ---------------------- Ventana de 7 días (hasta hoy) ---------------------- */
function WeekNavigator({ weekStart, selectedKey, onSelect, onShiftWeek, todayKey, earliestKey, activityByDay }) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDateKey(weekStart, i));
  const canGoBack = weekStart > earliestKey;
  const canGoForward = days[6] < todayKey;
  const first = dayjs(days[0]).locale('es');
  const last = dayjs(days[6]).locale('es');
  const rangeLabel =
    first.month() === last.month()
      ? `${first.format('D')} – ${last.format('D [de] MMMM')}`
      : `${first.format('D MMM')} – ${last.format('D MMM')}`;

  return (
    <Stack gap={8}>
      <Group justify="space-between" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          onClick={() => onShiftWeek(-7)}
          disabled={!canGoBack}
          aria-label="Semana anterior"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text fw={700} fz="sm" c="dark.4">
          {days[6] === todayKey ? 'Últimos 7 días' : capitalize(rangeLabel)}
        </Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          onClick={() => onShiftWeek(7)}
          disabled={!canGoForward}
          aria-label="Semana siguiente"
        >
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>

      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((key) => {
          const isFuture = key > todayKey;
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const activity = activityByDay[key];

          return (
            <UnstyledButton
              key={key}
              disabled={isFuture}
              onClick={() => onSelect(key)}
              aria-label={dayjs(key).locale('es').format('dddd D [de] MMMM')}
              aria-pressed={isSelected}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 0',
                borderRadius: 'var(--mantine-radius-lg)',
                cursor: isFuture ? 'not-allowed' : 'pointer',
                opacity: isFuture ? 0.35 : 1,
                background: isSelected ? 'var(--mantine-color-gray-1)' : 'transparent',
                transition: 'background 120ms ease',
              }}
            >
              <Text fz={11} fw={600} c="dimmed" lh={1}>
                {isToday ? 'Hoy' : WEEKDAYS[dayjs(key).day()]}
              </Text>
              <Box
                w={34}
                h={34}
                style={{
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'var(--mantine-primary-color-filled)' : 'transparent',
                  border: isToday && !isSelected ? '2px solid var(--mantine-primary-color-filled)' : '2px solid transparent',
                }}
              >
                <Text fz="sm" fw={800} c={isSelected ? 'white' : 'dark.5'} lh={1}>
                  {dayjs(key).date()}
                </Text>
              </Box>
              {/* Un punto por toma registrada, del color de la toma */}
              <Group gap={2} h={6} justify="center" wrap="nowrap">
                {(activity?.types || []).slice(0, 6).map((t, idx) => (
                  <Box key={idx} w={5} h={5} style={{ borderRadius: '50%', background: slotColor(t) }} />
                ))}
              </Group>
              <Text visibleFrom="sm" fz={10} fw={600} c="dimmed" h={12} lh="12px">
                {activity?.kcal > 0 ? `${formatKcal(activity.kcal)} kcal` : ''}
              </Text>
            </UnstyledButton>
          );
        })}
      </Box>
    </Stack>
  );
}

/* --------------------------- Cabecera del día --------------------------- */
function DayHeader({ dayKey, todayKey, meals }) {
  const d = dayjs(dayKey).locale('es');
  const relative = dayKey === todayKey ? 'Hoy' : dayKey === shiftDateKey(todayKey, -1) ? 'Ayer' : null;
  const total = mealKcal(meals);

  return (
    <Group justify="space-between" align="flex-end" wrap="nowrap" mb="md">
      <Box style={{ minWidth: 0 }}>
        <Text fz="xs" fw={700} c="dimmed" tt="uppercase" lh={1.4}>
          {relative || d.format('dddd')}
        </Text>
        <Text fw={800} fz="lg" c="dark.5" lh={1.2}>
          {capitalize(relative ? d.format('dddd, D [de] MMMM') : d.format('D [de] MMMM'))}
        </Text>
      </Box>
      <Box ta="right" style={{ flexShrink: 0 }}>
        <Text fw={800} fz="lg" c="dark.5" lh={1.2}>
          {total > 0 ? formatKcal(total) : '—'}
          <Text span fz="xs" fw={600} c="dimmed">
            {' '}
            kcal
          </Text>
        </Text>
        <Text fz="xs" c="dimmed" lh={1.4}>
          {meals.length} {meals.length === 1 ? 'toma' : 'tomas'}
        </Text>
      </Box>
    </Group>
  );
}

/* --------------------------- Tarjeta de comida --------------------------- */
function DiaryMealCard({ meal, stacked = false, onClick, onOpenPhoto, onDelete }) {
  const slot = SLOT_BY_KEY[meal.mealType] || OTHER_SLOT;
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients.filter(Boolean) : [];
  const calories = Number(meal.calories);

  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick()) : undefined}
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        gap: stacked ? 8 : 12,
        width: '100%',
        padding: meal.photoUrl ? 10 : '10px 12px',
        borderRadius: 'var(--mantine-radius-lg)',
        background: 'white',
        border: '1px solid var(--mantine-color-gray-2)',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {meal.photoUrl && (
        <Image
          src={meal.photoUrl}
          alt={meal.dishName || slot.label}
          w={stacked ? '100%' : 76}
          h={stacked ? 120 : 76}
          radius="md"
          fit="cover"
          style={{ flexShrink: 0, cursor: onOpenPhoto ? 'zoom-in' : undefined }}
          onClick={
            onOpenPhoto
              ? (e) => {
                  e.stopPropagation();
                  onOpenPhoto();
                }
              : undefined
          }
        />
      )}

      <Box style={{ flex: 1, minWidth: 0 }}>
        <Group justify="space-between" align="flex-start" gap={8} wrap="nowrap">
          <Text fw={700} fz="sm" c="dark.5" lineClamp={2} lh={1.3}>
            {meal.dishName || slot.label}
          </Text>
          {calories > 0 && (
            <Text fz="sm" fw={800} c="orange.7" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
              {formatKcal(calories)}
              <Text span fz={10} fw={600} c="dimmed">
                {' '}
                kcal
              </Text>
            </Text>
          )}
        </Group>
        <Group justify="space-between" align="center" gap={8} wrap="nowrap" mt={2}>
          <Text fz="xs" c="dimmed">
            {formatTime(meal.takenAt)}
          </Text>
          {onDelete && (
            <Tooltip label="Eliminar" withArrow>
              <ActionIcon
                variant="subtle"
                color="red"
                radius="xl"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                aria-label="Eliminar comida"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        {ingredients.length > 0 && (
          <Text fz="xs" c="dark.3" mt={4} lineClamp={stacked ? 3 : 1}>
            {ingredients.join(' · ')}
          </Text>
        )}
        {meal.notes && (
          <Text
            fz="xs"
            c="dark.4"
            fs="italic"
            mt={6}
            px={8}
            py={4}
            lineClamp={2}
            style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 8 }}
          >
            “{meal.notes}”
          </Text>
        )}
      </Box>
    </Box>
  );
}

// Tomas a mostrar: las principales siempre, las opcionales/otros solo si tienen registros
function groupBySlot(meals) {
  const bySlot = {};
  for (const m of meals) (bySlot[SLOT_BY_KEY[m.mealType] ? m.mealType : 'other'] ||= []).push(m);
  const rows = [...MEAL_SLOTS, OTHER_SLOT].filter(
    (s) => bySlot[s.key]?.length || (s !== OTHER_SLOT && !s.optional)
  );
  return { bySlot, rows };
}

function AddSlotButton({ slot, onAdd, fill = false }) {
  return (
    <UnstyledButton
      onClick={() => onAdd(slot)}
      style={{
        width: '100%',
        flex: fill ? 1 : undefined,
        minHeight: fill ? 72 : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: fill ? 'center' : 'space-between',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px dashed var(--mantine-color-gray-3)',
        color: 'var(--mantine-color-gray-6)',
      }}
    >
      {!fill && (
        <Text fz="sm" fw={600} c="dimmed">
          {slot.label}
        </Text>
      )}
      <Group gap={4} wrap="nowrap">
        <IconPlusPlain size={14} />
        <Text fz="xs" fw={600}>
          Añadir
        </Text>
      </Group>
    </UnstyledButton>
  );
}

/* ------------------ Tablero por tomas (escritorio) ------------------ */
function DayBoard({ meals, canAdd, onAdd, renderCard }) {
  const { bySlot, rows } = groupBySlot(meals);

  return (
    <Box style={{ display: 'grid', gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`, gap: 12 }}>
      {rows.map((slot) => {
        const slotMeals = bySlot[slot.key] || [];
        const kcal = mealKcal(slotMeals);
        return (
          <Stack key={slot.key} gap={8}>
            <Group
              justify="space-between"
              wrap="nowrap"
              pb={6}
              style={{ borderBottom: `2px solid ${slotMeals.length ? slotColor(slot.key, 4) : 'var(--mantine-color-gray-2)'}` }}
            >
              <Text fz="xs" fw={800} tt="uppercase" c={slotMeals.length ? `${slot.color}.7` : 'gray.5'} style={{ letterSpacing: 0.4 }}>
                {slot.label}
              </Text>
              {kcal > 0 && (
                <Text fz="xs" fw={700} c="dimmed">
                  {formatKcal(kcal)} kcal
                </Text>
              )}
            </Group>
            {slotMeals.map((m) => renderCard(m, true))}
            {slotMeals.length === 0 &&
              (canAdd ? (
                <AddSlotButton slot={slot} onAdd={onAdd} fill />
              ) : (
                <Text fz="xs" c="gray.5" ta="center" py="md">
                  Sin registro
                </Text>
              ))}
          </Stack>
        );
      })}
    </Box>
  );
}

/* ------------------------ Timeline de tomas del día ------------------------ */
function DayTimeline({ meals, canAdd, onAdd, renderCard }) {
  const { bySlot, rows } = groupBySlot(meals);

  return (
    <Stack gap={0}>
      {rows.map((slot, idx) => {
        const slotMeals = bySlot[slot.key] || [];
        const isEmpty = slotMeals.length === 0;
        const isLast = idx === rows.length - 1;

        return (
          <Group key={slot.key} align="stretch" gap="sm" wrap="nowrap">
            {/* Raíl */}
            <Stack gap={0} align="center" w={28} style={{ flexShrink: 0 }}>
              <Box
                mt={isEmpty ? 10 : 4}
                w={12}
                h={12}
                style={{
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: isEmpty ? 'white' : slotColor(slot.key),
                  border: `2px solid ${isEmpty ? 'var(--mantine-color-gray-3)' : slotColor(slot.key)}`,
                  boxShadow: isEmpty ? 'none' : `0 0 0 4px ${slotColor(slot.key, 1)}`,
                }}
              />
              {!isLast && <Box style={{ flex: 1, width: 2, background: 'var(--mantine-color-gray-2)', marginTop: 4 }} />}
            </Stack>

            <Box style={{ flex: 1, minWidth: 0 }} pb={isLast ? 0 : 'md'}>
              {isEmpty ? (
                canAdd ? (
                  <AddSlotButton slot={slot} onAdd={onAdd} />
                ) : (
                  <Text fz="sm" fw={600} c="gray.5" py={6}>
                    {slot.label}{' '}
                    <Text span fz="xs" fw={400}>
                      · sin registro
                    </Text>
                  </Text>
                )
              ) : (
                <Stack gap={8}>
                  <Text fz="xs" fw={800} tt="uppercase" c={`${slot.color}.7`} style={{ letterSpacing: 0.4 }}>
                    {slot.label}
                  </Text>
                  {slotMeals.map((m) => renderCard(m, false))}
                </Stack>
              )}
            </Box>
          </Group>
        );
      })}
    </Stack>
  );
}

function StatPill({ icon, value, label }) {
  return (
    <Group gap={4} wrap="nowrap">
      {icon}
      <Text fz="xs" fw={800} c="dark.4" lh={1}>
        {value}
      </Text>
      <Text fz="xs" c="dimmed" lh={1}>
        {label}
      </Text>
    </Group>
  );
}

export default function DiarioComidasSubtab({ jugador, readOnly = false }) {
  const isMobile = useMediaQuery('(max-width: 48em)', true);
  const todayKey = useMemo(() => toDateKey(), []);

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [weekStart, setWeekStart] = useState(() => windowStartOf(todayKey));

  const [viewer, setViewer] = useState({ open: false, src: '', caption: '' });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMeal, setEditorMeal] = useState(null);
  const [deleteMeal, setDeleteMeal] = useState(null);
  const [reload, setReload] = useState(0);

  // Todo el diario de una vez: las fotos se sirven por URL, así que la lista es ligera
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listPlayerMeals(jugador.id);
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
    return () => {
      alive = false;
    };
  }, [jugador.id, reload]);

  const mealsWithKey = useMemo(
    () =>
      meals
        .map((m) => ({ ...m, dateKey: toDateKey(m.takenAt) }))
        .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt)),
    [meals]
  );

  // Puntos del calendario, racha y media diaria
  const activityByDay = useMemo(() => {
    const map = {};
    for (const m of mealsWithKey) {
      const day = (map[m.dateKey] ||= { dateKey: m.dateKey, types: [], kcal: 0 });
      day.types.push(m.mealType);
      day.kcal += Number(m.calories) || 0;
    }
    return map;
  }, [mealsWithKey]);

  const stats = useMemo(() => {
    const withKcal = Object.values(activityByDay).filter((d) => d.kcal > 0);
    const avgKcal = withKcal.length ? withKcal.reduce((a, d) => a + d.kcal, 0) / withKcal.length : 0;
    return { avgKcal, streak: computeStreak(activityByDay, todayKey) };
  }, [activityByDay, todayKey]);

  // No hay límite de historial: se puede retroceder hasta la primera comida registrada
  const earliestKey = useMemo(() => {
    const oldest = mealsWithKey[0]?.dateKey;
    const floor = windowStartOf(todayKey);
    return oldest && oldest < floor ? oldest : floor;
  }, [mealsWithKey, todayKey]);

  const dayMeals = useMemo(() => mealsWithKey.filter((m) => m.dateKey === selectedKey), [mealsWithKey, selectedKey]);

  const canAdd = !readOnly && selectedKey <= todayKey;

  const openDraft = (slot) => {
    setEditorMeal({ takenAt: draftTakenAt(selectedKey, slot, todayKey), mealType: slot?.key || '' });
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

  const openPhoto = (m) =>
    setViewer({
      open: true,
      src: m.photoUrl,
      caption: `${formatTime(m.takenAt)}${Number.isFinite(m.calories) ? ` · ${m.calories} kcal` : ''}`,
    });

  const shiftWeek = (delta) => {
    // La ventana nunca pasa de hoy
    let nextStart = shiftDateKey(weekStart, delta);
    if (shiftDateKey(nextStart, 6) > todayKey) nextStart = windowStartOf(todayKey);
    setWeekStart(nextStart);
    // Mantenemos el mismo día de la semana, acotado a la ventana visible
    let next = shiftDateKey(selectedKey, delta);
    if (next > shiftDateKey(nextStart, 6)) next = shiftDateKey(nextStart, 6);
    if (next > todayKey) next = todayKey;
    setSelectedKey(next);
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

  const renderCard = (m, stacked) => (
    <DiaryMealCard
      key={m.id}
      meal={m}
      stacked={stacked}
      onClick={!readOnly ? () => openEditMeal(m) : m.photoUrl ? () => openPhoto(m) : undefined}
      onOpenPhoto={m.photoUrl ? () => openPhoto(m) : undefined}
      onDelete={!readOnly ? () => setDeleteMeal(m) : undefined}
    />
  );

  return (
    <Box w="100%" p={0} bg="gray.0" mih="100%" style={{ overflowX: 'clip' }}>
      <Stack gap={0}>
        {/* Cabecera con racha y navegador de semana (no sticky: es alta en móvil) */}
        <Paper
          className={classes.mobileSticky}
          p={{ base: 'sm', sm: 'md' }}
          bg="white"
          shadow="xs"
          radius="lg"
          withBorder
          style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, position: 'static' }}
        >
          <Stack gap="sm">
            <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
              <Box style={{ minWidth: 0, flex: 1 }}>
                <SubtabHeader tab="resumen" subtab="diario" />
                <Group gap={10} wrap="nowrap" mt={6} pl={{ base: 0, sm: 40 }}>
                  <Tooltip label="Días seguidos registrando comidas" withArrow>
                    <Box>
                      <StatPill icon={<IconFlame size={13} />} value={stats.streak} label="de racha" />
                    </Box>
                  </Tooltip>
                  {stats.avgKcal > 0 && (
                    <Tooltip label="Media diaria de los días registrados" withArrow>
                      <Box>
                        <StatPill value={formatKcal(stats.avgKcal)} label="kcal/día" />
                      </Box>
                    </Tooltip>
                  )}
                </Group>
              </Box>

              {!readOnly && (
                <Button
                  id="btn-add-meal"
                  size="xs"
                  radius="xl"
                  color="lima"
                  leftSection={<IconPlus size={isMobile ? 14 : 16} />}
                  style={{ flexShrink: 0 }}
                  disabled={!canAdd}
                  onClick={() => openDraft(null)}
                >
                  Registrar
                </Button>
              )}
            </Group>

            <WeekNavigator
              weekStart={weekStart}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onShiftWeek={shiftWeek}
              todayKey={todayKey}
              earliestKey={earliestKey}
              activityByDay={activityByDay}
            />
          </Stack>
        </Paper>

        {/* Contenido del día */}
        <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
          {loading ? (
            <BoneyardSkeleton name="diario-comidas" loading={true} />
          ) : (
            <Paper radius="lg" shadow="sm" p="md" bg="white" withBorder>
              <DayHeader dayKey={selectedKey} todayKey={todayKey} meals={dayMeals} />
              <Box hiddenFrom="md">
                <DayTimeline meals={dayMeals} canAdd={canAdd} onAdd={openDraft} renderCard={renderCard} />
              </Box>
              <Box visibleFrom="md">
                <DayBoard meals={dayMeals} canAdd={canAdd} onAdd={openDraft} renderCard={renderCard} />
              </Box>
            </Paper>
          )}
        </Box>
      </Stack>

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
          setReload((prev) => prev + 1);
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
