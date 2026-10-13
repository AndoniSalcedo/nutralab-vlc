'use client';

import { useState, useEffect } from 'react';
import { normalizeKey } from '@/lib/utils';
import {
  Paper,
  Stack,
  Group,
  Text,
  Box,
  Divider,
  ThemeIcon,
  Grid,
  Textarea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconBentoBox,
  IconCooking,
  IconEdit,
} from '@/components/icons3d';
import EditDishDecompositionModal from '@/components/modals/EditDishDecompositionModal';
import { formatAstToText } from '@/lib/engine/meal-ast';
import NothingFound from '@/components/NothingFound';
import WeekDayStrip from '@/components/WeekDayStrip';
import { BentoCard } from '@/components/BentoItem';

// Standard Spanish weekday names to match database records
export const WEEKDAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function formatWeek(value) {
  if (!value) return 'Sin semana';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

// Inicial de cada día en la tira de días (X para miércoles, como en el diario)
const WEEKDAY_INITIALS = { Lunes: 'L', Martes: 'M', 'Miércoles': 'X', Jueves: 'J', Viernes: 'V', 'Sábado': 'S', Domingo: 'D' };
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/** Fecha real de un día del menú a partir del lunes de su semana, o null si no se puede calcular. */
function getDayDateObj(weekStr, dayName) {
  if (!weekStr) return null;
  const offset = WEEKDAY_ORDER.indexOf(dayName);
  if (offset === -1) return null;
  const date = new Date(`${weekStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + offset);
  return date;
}

/** Hoy es ese día del menú: por fecha si se conoce la semana (un menú de otra semana no tiene "hoy"). */
function isToday(dayName, weekStr = null) {
  const date = getDayDateObj(weekStr, dayName);
  if (date) return date.toDateString() === new Date().toDateString();
  try {
    const todayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date());
    return normalizeKey(dayName) === normalizeKey(todayName);
  } catch {
    return false;
  }
}

/** Evento del día (partido, descanso…) si algún servicio lo indica, para destacarlo en la tira y la cabecera. */
function getDayEvent(dayData) {
  const texts = ['comida', 'cena'].flatMap((service) => ['primero', 'segundo'].map((course) => dayData?.[service]?.[course]));
  const event = texts.find((text) => text && isServiceEvent(text) && String(text).trim() !== '-' && !/sin registrar/i.test(text));
  return event ? capitalize(String(event).trim().toLowerCase()) : '';
}

const hasService = (service) => Boolean(service?.primero || service?.segundo);

function findDishAst(dishText, serviceTree, course = null) {
  if (!dishText || !serviceTree) return null;
  const normalizedDish = dishText.toLowerCase().trim();
  let match = null;
  const visit = (node, activeCourse = null) => {
    if (!node || match) return;
    const nodeCourse = node.course || activeCourse;
    if (node.type === 'allOf' && String(node.label || '').toLowerCase().trim() === normalizedDish) {
      if (course && nodeCourse && course !== nodeCourse) return;
      match = node;
      return;
    }
    (node.children || []).forEach((child) => visit(child, nodeCourse));
  };
  visit(serviceTree);
  return match;
}

function isServiceEvent(text) {
  if (!text || typeof text !== 'string') return true;
  const upper = text.toUpperCase().trim();
  return (
    upper.includes('PREPARTIDO') ||
    upper.includes('PARTIDO') ||
    upper.includes('DESCANSO') ||
    upper.includes('LIBRE') ||
    upper.includes('PICNIC') ||
    upper.includes('HOTEL') ||
    upper.includes('SIN REGISTRAR') ||
    upper === '-'
  );
}

function DishAstSummary({ dishTree, size = '11px' }) {
  const text = dishTree ? formatAstToText({ tree: dishTree }) : '';
  if (!text) return null;
  return (
    <Text size="xs" c="dark.6" fw={500} style={{ fontSize: size, marginTop: 2 }}>
      {text}
    </Text>
  );
}

function AgendaDishLine({ label, value, serviceTree = null }) {
  if (!value || value.toLowerCase() === 'sin registrar') return null;
  const options = value.split(/\s*\/\s*/);
  return (
    <Group gap={6} align="flex-start" wrap="nowrap">
      <Text size="xs" c="dimmed" fw={600} style={{ flex: '0 0 16px', paddingTop: '2px' }}>
        {label}
      </Text>
      <Stack gap={3} style={{ flex: 1 }}>
        {options.map((opt, idx) => {
          const isEvent = isServiceEvent(opt);
          const course = label === '1º' ? 'primero' : label === '2º' ? 'segundo' : label === 'P' ? 'postre' : null;
          const dishTree = !isEvent ? findDishAst(opt, serviceTree, course) : null;
          return (
            <Box key={idx}>
              <Text size="xs" fw={isEvent ? 600 : 500} c={isEvent ? 'dimmed' : 'dark.4'} style={{ lineHeight: 1.3 }}>
                {opt}
              </Text>
              <DishAstSummary dishTree={dishTree} size="10px" />
            </Box>
          );
        })}
      </Stack>
    </Group>
  );
}

function AgendaDayRow({ dayData, weekStr }) {
  const isDayToday = isToday(dayData.dia, weekStr);
  const date = getDayDateObj(weekStr, dayData.dia);
  const event = getDayEvent(dayData);

  return (
    <Paper
      p="md"
      radius="lg"
      bg="white"
      withBorder
      style={{
        borderColor: isDayToday ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-gray-2)',
        boxShadow: isDayToday ? '0 4px 14px rgba(31, 42, 36, 0.08)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <Grid gutter="md" align="flex-start">
        {/* Día: número en círculo como en la tira de días */}
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Group gap="sm" align="center" wrap="nowrap">
            <Box
              w={38}
              h={38}
              style={{
                flexShrink: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDayToday ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-gray-1)',
              }}
            >
              <Text fz="sm" fw={800} c={isDayToday ? 'white' : 'dark.5'} lh={1}>
                {date ? date.getDate() : WEEKDAY_INITIALS[dayData.dia] || dayData.dia.slice(0, 1)}
              </Text>
            </Box>
            <Box style={{ minWidth: 0 }}>
              <Text fz={10} fw={700} c="dimmed" tt="uppercase" lh={1.3}>
                {isDayToday ? 'Hoy' : date ? date.toLocaleDateString('es-ES', { month: 'short' }) : ''}
              </Text>
              <Text fw={800} size="sm" c="dark.5" lh={1.2}>
                {dayData.dia}
              </Text>
              {event && (
                <Text fz={10} fw={700} c="bosque.6" lh={1.3}>
                  {event}
                </Text>
              )}
            </Box>
          </Group>
        </Grid.Col>

        {/* Comida Column */}
        <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
          <Stack gap={4}>
            <Text fz={10} fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
              Comida
            </Text>
            <Stack gap={4}>
              {dayData.comida?.primero && <AgendaDishLine label="1º" value={dayData.comida.primero} serviceTree={dayData.comida?.tree} />}
              {dayData.comida?.segundo && <AgendaDishLine label="2º" value={dayData.comida.segundo} serviceTree={dayData.comida?.tree} />}
              {dayData.comida?.postre && <AgendaDishLine label="P" value={dayData.comida.postre} serviceTree={dayData.comida?.tree} />}
              {!dayData.comida?.primero && !dayData.comida?.segundo && (
                <Text size="xs" c="gray.4" fs="italic">Sin registrar</Text>
              )}
            </Stack>
          </Stack>
        </Grid.Col>

        {/* Cena Column */}
        <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
          <Stack gap={4}>
            <Text fz={10} fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
              Cena
            </Text>
            <Stack gap={4}>
              {dayData.cena?.primero && <AgendaDishLine label="1º" value={dayData.cena.primero} serviceTree={dayData.cena?.tree} />}
              {dayData.cena?.segundo && <AgendaDishLine label="2º" value={dayData.cena.segundo} serviceTree={dayData.cena?.tree} />}
              {dayData.cena?.postre && <AgendaDishLine label="P" value={dayData.cena.postre} serviceTree={dayData.cena?.tree} />}
              {!dayData.cena?.primero && !dayData.cena?.segundo && (
                <Text size="xs" c="gray.4" fs="italic">Sin registrar</Text>
              )}
            </Stack>
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}

function HeroDishSection({ title, label, value, color, serviceTree = null, onEditDish = null }) {
  if (!value || value.toLowerCase() === 'sin registrar') {
    return (
      <Stack gap={2}>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
          {title}
        </Text>
        <Text size="sm" c="gray.4" fs="italic" fw={400}>
          Sin registrar
        </Text>
      </Stack>
    );
  }

  const options = value.split(/\s*\/\s*/);

  return (
    <Stack gap={6}>
      <Group gap="xs" align="center">
        <ThemeIcon color={color} variant="light" size={18} radius="md">
          <Text size="xs" fw={600}>{label}</Text>
        </ThemeIcon>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
          {title}
        </Text>
      </Group>

      <Stack gap={6} pl={26}>
        {options.map((opt, idx) => {
          const isEvent = isServiceEvent(opt);
          const dishTree = !isEvent
            ? findDishAst(opt, serviceTree, title === 'Primer Plato' ? 'primero' : title === 'Segundo Plato' ? 'segundo' : 'postre')
            : null;
          return (
            <Group key={idx} justify="space-between" align="flex-start" wrap="nowrap" style={{ width: '100%' }}>
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={isEvent ? 700 : 600} c={isEvent ? 'dimmed' : 'dark.4'} style={{ overflowWrap: 'anywhere', lineHeight: 1.4 }}>
                  {opt}
                </Text>
                <DishAstSummary dishTree={dishTree} size="11px" />
              </Stack>
              {onEditDish && !isEvent && (
                <Tooltip label="Ajustar ingredientes de este plato" withArrow position="left">
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    aria-label={`Editar ${opt}`}
                    onClick={() => onEditDish({ nombre: opt, tree: dishTree })}
                    style={{ opacity: 0.7, flexShrink: 0, marginTop: 2 }}
                  >
                    <IconEdit size={13} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          );
        })}
      </Stack>
    </Stack>
  );
}

/* Cabecera del día seleccionado (mismo diseño que el diario de comidas) */
function MenuDayHeader({ dayData, weekStr }) {
  const date = getDayDateObj(weekStr, dayData.dia);
  const isDayToday = isToday(dayData.dia, weekStr);
  const event = getDayEvent(dayData);
  const longDate = date ? date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : '';

  return (
    <Group justify="space-between" align="flex-end" wrap="nowrap">
      <Box style={{ minWidth: 0 }}>
        <Text fz="xs" fw={700} c="dimmed" tt="uppercase" lh={1.4}>
          {isDayToday ? 'Hoy' : dayData.dia}
        </Text>
        <Text fw={800} fz="lg" c="dark.5" lh={1.2}>
          {isDayToday ? `${dayData.dia}${longDate ? `, ${longDate}` : ''}` : longDate || dayData.dia}
        </Text>
      </Box>
      {event && (
        <Text fz="xs" fw={700} c="bosque.7" px={10} py={4} style={{ borderRadius: 999, background: 'var(--mantine-color-lima-1)', flexShrink: 0 }}>
          {event}
        </Text>
      )}
    </Group>
  );
}

/* Rango de la semana del menú: "13 – 19 de octubre" o "29 sept – 5 oct" */
function weekRangeLabel(weekStr) {
  const first = getDayDateObj(weekStr, 'Lunes');
  const last = getDayDateObj(weekStr, 'Domingo');
  if (!first || !last) return 'Semana';
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
  }
  const short = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return `${short(first)} – ${short(last)}`;
}

export default function MenuSemanal({
  selectedMenu = null,
  viewMode = 'diaria',
  isEditing = false,
  editedDias = [],
  onChangeDayData = null,
  onSaveDishDecomposition = null,
}) {
  const [activeDay, setActiveDay] = useState('');
  const [editingDish, setEditingDish] = useState(null);

  const orderedDays = isEditing
    ? [...editedDias].sort((a, b) => WEEKDAY_ORDER.indexOf(a.dia) - WEEKDAY_ORDER.indexOf(b.dia))
    : (selectedMenu
      ? [...selectedMenu.dias].sort((a, b) => WEEKDAY_ORDER.indexOf(a.dia) - WEEKDAY_ORDER.indexOf(b.dia))
      : []);

  useEffect(() => {
    if (orderedDays.length > 0) {
      const today = orderedDays.find((d) => isToday(d.dia, selectedMenu?.semana));
      setActiveDay(today ? today.dia : orderedDays[0].dia);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenu]);

  const activeDayData = orderedDays.find((d) => d.dia === activeDay) || null;

  const handleSaveDish = (updatedDish) => {
    if (onSaveDishDecomposition) {
      onSaveDishDecomposition(updatedDish, activeDay);
    }
  };

  const renderHeroDay = (dayData) => {
    if (!dayData) return null;

    if (isEditing) {
      const comida = dayData.comida || { primero: '', segundo: '', postre: '' };
      const cena = dayData.cena || { primero: '', segundo: '', postre: '' };

      return (
        <Grid gutter="md" align="stretch" mt="xs">
          {/* Comida Bento Card */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <BentoCard title="Almuerzo / Comida" icon={IconCooking} color="orange">
              <Stack gap="sm" mt="xs">
                <Textarea
                  label="Primer Plato"
                  placeholder="Ej. Crema de calabacín"
                  value={comida.primero || ''}
                  onChange={(e) => onChangeDayData && onChangeDayData(activeDay, 'comida', 'primero', e.target.value)}
                  autosize
                  minRows={1}
                  variant="filled"
                  radius="md"
                  size="sm"
                />
                <Textarea
                  label="Segundo Plato"
                  placeholder="Ej. Pollo a la plancha con puré"
                  value={comida.segundo || ''}
                  onChange={(e) => onChangeDayData && onChangeDayData(activeDay, 'comida', 'segundo', e.target.value)}
                  autosize
                  minRows={1}
                  variant="filled"
                  radius="md"
                  size="sm"
                />
                <Textarea
                  label="Postre / Fruta"
                  placeholder="Ej. Fruta de temporada / Yogur"
                  value={comida.postre || ''}
                  onChange={(e) => onChangeDayData && onChangeDayData(activeDay, 'comida', 'postre', e.target.value)}
                  autosize
                  minRows={1}
                  variant="filled"
                  radius="md"
                  size="sm"
                />
              </Stack>
            </BentoCard>
          </Grid.Col>

          {/* Cena Bento Card */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <BentoCard title="Cena del Equipo" icon={IconBentoBox} color="blue">
              <Stack gap="sm" mt="xs">
                <Textarea
                  label="Primer Plato"
                  placeholder="Ej. Sopa de fideos"
                  value={cena.primero || ''}
                  onChange={(e) => onChangeDayData && onChangeDayData(activeDay, 'cena', 'primero', e.target.value)}
                  autosize
                  minRows={1}
                  variant="filled"
                  radius="md"
                  size="sm"
                />
                <Textarea
                  label="Segundo Plato"
                  placeholder="Ej. Pescado al horno con ensalada"
                  value={cena.segundo || ''}
                  onChange={(e) => onChangeDayData && onChangeDayData(activeDay, 'cena', 'segundo', e.target.value)}
                  autosize
                  minRows={1}
                  variant="filled"
                  radius="md"
                  size="sm"
                />
                <Textarea
                  label="Postre / Fruta"
                  placeholder="Ej. Yogur bífidus / Infusión"
                  value={cena.postre || ''}
                  onChange={(e) => onChangeDayData && onChangeDayData(activeDay, 'cena', 'postre', e.target.value)}
                  autosize
                  minRows={1}
                  variant="filled"
                  radius="md"
                  size="sm"
                />
              </Stack>
            </BentoCard>
          </Grid.Col>
        </Grid>
      );
    }

    return (
      <Grid gutter="md" align="stretch" mt="xs">
        {/* Comida Bento Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <BentoCard title="Almuerzo / Comida" icon={IconCooking} color="orange">
            <Stack gap="md" mt="xs">
              <HeroDishSection
                title="Primer Plato"
                label="1º"
                value={dayData.comida?.primero}
                color="orange"
                serviceTree={dayData.comida?.tree}
                onEditDish={onSaveDishDecomposition ? (dish) => setEditingDish(dish) : null}
              />
              <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
              <HeroDishSection
                title="Segundo Plato"
                label="2º"
                value={dayData.comida?.segundo}
                color="orange"
                serviceTree={dayData.comida?.tree}
                onEditDish={onSaveDishDecomposition ? (dish) => setEditingDish(dish) : null}
              />
              {dayData.comida?.postre && (
                <>
                  <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
                  <HeroDishSection
                    title="Postre / Fruta"
                    label="P"
                    value={dayData.comida.postre}
                    color="orange"
                    serviceTree={dayData.comida?.tree}
                    onEditDish={onSaveDishDecomposition ? (dish) => setEditingDish(dish) : null}
                  />
                </>
              )}
            </Stack>
          </BentoCard>
        </Grid.Col>

        {/* Cena Bento Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <BentoCard title="Cena del Equipo" icon={IconBentoBox} color="blue">
            <Stack gap="md" mt="xs">
              <HeroDishSection
                title="Primer Plato"
                label="1º"
                value={dayData.cena?.primero}
                color="blue"
                serviceTree={dayData.cena?.tree}
                onEditDish={onSaveDishDecomposition ? (dish) => setEditingDish(dish) : null}
              />
              <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
              <HeroDishSection
                title="Segundo Plato"
                label="2º"
                value={dayData.cena?.segundo}
                color="blue"
                serviceTree={dayData.cena?.tree}
                onEditDish={onSaveDishDecomposition ? (dish) => setEditingDish(dish) : null}
              />
              {dayData.cena?.postre && (
                <>
                  <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
                  <HeroDishSection
                    title="Postre / Fruta"
                    label="P"
                    value={dayData.cena.postre}
                    color="blue"
                    serviceTree={dayData.cena?.tree}
                    onEditDish={onSaveDishDecomposition ? (dish) => setEditingDish(dish) : null}
                  />
                </>
              )}
            </Stack>
          </BentoCard>
        </Grid.Col>
      </Grid>
    );
  };

  if (!selectedMenu) {
    return (
      <NothingFound
        withPaper
        icon={IconCooking}
        title="Sin menús"
        icon3d="bento_box"
        description="No hay menús registrados. Sube la foto o PDF del menú de esta semana para empezar."
      />
    );
  }

  return (
    <Box>
      {viewMode === 'diaria' ? (
        <Stack gap="md">
          {/* Tira de días (mismo diseño que el diario de comidas) */}
          <Paper radius="lg" p="sm" bg="white" withBorder>
            <Stack gap={8}>
              <Text fw={700} fz="sm" c="dark.4" ta="center">
                {capitalize(weekRangeLabel(selectedMenu.semana))}
              </Text>
              <WeekDayStrip
                selectedKey={activeDay}
                onSelect={setActiveDay}
                days={orderedDays.map((dia) => {
                  const date = getDayDateObj(selectedMenu.semana, dia.dia);
                  return {
                    key: dia.dia,
                    label: WEEKDAY_INITIALS[dia.dia] || dia.dia.slice(0, 1),
                    number: date ? date.getDate() : WEEKDAY_INITIALS[dia.dia] || dia.dia.slice(0, 1),
                    isToday: isToday(dia.dia, selectedMenu.semana),
                    ariaLabel: date ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : dia.dia,
                    // Un punto por servicio con menú: comida y cena
                    dots: [
                      hasService(dia.comida) && 'var(--mantine-color-bosque-5)',
                      hasService(dia.cena) && 'var(--mantine-color-salvia-5)',
                    ].filter(Boolean),
                    caption: getDayEvent(dia),
                  };
                })}
              />
            </Stack>
          </Paper>

          {/* Menú del día seleccionado */}
          {activeDayData && (
            <Box>
              <Box px={4} mb={4}>
                <MenuDayHeader dayData={activeDayData} weekStr={selectedMenu.semana} />
              </Box>
              {renderHeroDay(activeDayData)}
            </Box>
          )}
        </Stack>
      ) : (
        /* Weekly Agenda View */
        <Stack gap="sm">
          {orderedDays.map((dia) => (
            <AgendaDayRow key={dia.dia} dayData={dia} weekStr={selectedMenu.semana} />
          ))}
        </Stack>
      )}

      <EditDishDecompositionModal
        opened={Boolean(editingDish)}
        onClose={() => setEditingDish(null)}
        dish={editingDish}
        onSave={handleSaveDish}
      />
    </Box>
  );
}
