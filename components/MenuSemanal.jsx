'use client';

import { useState, useEffect } from 'react';
import { normalizeKey } from '@/lib/utils';
import {
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Box,
  Divider,
  ThemeIcon,
  Grid,
  Textarea,
} from '@mantine/core';
import {
  IconFlame,
  IconToolsKitchen,
} from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound';
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

export function getDayDate(weekStr, dayName) {
  if (!weekStr) return null;
  try {
    const date = new Date(`${weekStr}T00:00:00`);
    const offset = WEEKDAY_ORDER.indexOf(dayName);
    if (offset === -1) return null;
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch (e) {
    return null;
  }
}

function isToday(dayName) {
  try {
    const todayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date());
    return normalizeKey(dayName) === normalizeKey(todayName);
  } catch (e) {
    return false;
  }
}

function getTodayIndex() {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  return day === 0 ? 6 : day - 1; // Map Lunes to 0, Domingo to 6
}

function AgendaDishLine({ label, value }) {
  if (!value || value.toLowerCase() === 'sin registrar') return null;
  const options = value.split(/\s*\/\s*/);
  return (
    <Group gap={6} align="flex-start" wrap="nowrap">
      <Text size="xs" c="dimmed" fw={850} style={{ flex: '0 0 16px', fontSize: '9px', paddingTop: '2px' }}>
        {label}
      </Text>
      <Stack gap={2} style={{ flex: 1 }}>
        {options.map((opt, idx) => (
          <Text key={idx} size="xs" fw={600} c="dark.4" style={{ lineHeight: 1.3 }}>
            {opt}
          </Text>
        ))}
      </Stack>
    </Group>
  );
}

function AgendaDayRow({ dayData, weekStr }) {
  const isDayToday = isToday(dayData.dia);
  const dayCalendarDate = getDayDate(weekStr, dayData.dia);

  return (
    <Paper
      p="md"
      radius="md"
      bg={isDayToday ? 'teal.0' : 'gray.0'}
      withBorder
      style={{
        borderColor: isDayToday ? 'var(--mantine-color-teal-2)' : 'var(--mantine-color-gray-2)',
        transition: 'all 0.2s ease',
      }}
    >
      <Grid gutter="md" align="flex-start">
        {/* Day Column */}
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Stack gap={2}>
            <Group gap="xs" align="center" wrap="nowrap">
              {isDayToday && (
                <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--mantine-color-teal-5)', flexShrink: 0 }} />
              )}
              <Text fw={800} size="sm" c={isDayToday ? 'teal.8' : 'dark.4'} lh={1.1}>
                {dayData.dia}
              </Text>
              {isDayToday && (
                <Badge color="teal" variant="filled" size="xs" radius="xl" ml="auto">
                  HOY
                </Badge>
              )}
            </Group>
            {dayCalendarDate && (
              <Text size="xs" c="dimmed" fw={600} pl={isDayToday ? 14 : 0}>
                {dayCalendarDate}
              </Text>
            )}
          </Stack>
        </Grid.Col>

        {/* Comida Column */}
        <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
          <Stack gap={4}>
            <Text size="xs" fw={700} c="orange.7" tt="uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
              Comida
            </Text>
            <Stack gap={4}>
              {dayData.comida?.primero && <AgendaDishLine label="1º" value={dayData.comida.primero} />}
              {dayData.comida?.segundo && <AgendaDishLine label="2º" value={dayData.comida.segundo} />}
              {dayData.comida?.postre && <AgendaDishLine label="P" value={dayData.comida.postre} />}
              {!dayData.comida?.primero && !dayData.comida?.segundo && (
                <Text size="xs" c="gray.4" fs="italic">Sin registrar</Text>
              )}
            </Stack>
          </Stack>
        </Grid.Col>

        {/* Cena Column */}
        <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
          <Stack gap={4}>
            <Text size="xs" fw={700} c="blue.7" tt="uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
              Cena
            </Text>
            <Stack gap={4}>
              {dayData.cena?.primero && <AgendaDishLine label="1º" value={dayData.cena.primero} />}
              {dayData.cena?.segundo && <AgendaDishLine label="2º" value={dayData.cena.segundo} />}
              {dayData.cena?.postre && <AgendaDishLine label="P" value={dayData.cena.postre} />}
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

function HeroDishSection({ title, label, value, color }) {
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
          <Text size="xs" fw={800} style={{ fontSize: '9px' }}>{label}</Text>
        </ThemeIcon>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px', fontSize: '9px' }}>
          {title}
        </Text>
      </Group>

      <Stack gap={4} pl={26}>
        {options.map((opt, idx) => (
          <Group key={idx} gap="xs" align="flex-start" wrap="nowrap">
            <Text size="sm" fw={600} c="dark.4" style={{ overflowWrap: 'anywhere', lineHeight: 1.4 }}>
              {opt}
            </Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}

function DaySelectorButton({ dayName, isSelected, isHoy, dateStr, onClick }) {
  return (
    <Paper
      onClick={onClick}
      radius="md"
      p="xs"
      withBorder
      style={{
        flex: 1,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
        borderColor: isSelected
          ? 'var(--mantine-color-dark-8)'
          : isHoy
            ? 'var(--mantine-color-teal-3)'
            : 'var(--mantine-color-gray-2)',
        boxShadow: isSelected ? '0 4px 10px rgba(0, 0, 0, 0.08)' : 'none',
        transform: isSelected ? 'translateY(-1px)' : 'none',
      }}
    >
      <Stack gap={2} align="center">
        {isHoy && (
          <Box style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: isSelected ? 'var(--mantine-color-teal-3)' : 'var(--mantine-color-teal-5)'
          }} />
        )}
        {!isHoy && <Box style={{ height: 4 }} />}

        <Text
          size="xs"
          fw={700}
          tt="uppercase"
          c={isSelected ? 'gray.3' : 'dimmed'}
          style={{ letterSpacing: '0.5px', fontSize: '9px' }}
        >
          {dayName.slice(0, 3)}
        </Text>
        <Text
          size="md"
          fw={900}
          lh={1.1}
          c={isSelected ? 'white' : 'dark.4'}
        >
          {dateStr ? dateStr.split(' ')[0] : ''}
        </Text>
        <Text
          size="xs"
          fw={600}
          c={isSelected ? 'gray.4' : 'dimmed'}
          style={{ fontSize: '9px' }}
        >
          {dateStr ? dateStr.split(' ')[1] : ''}
        </Text>
      </Stack>
    </Paper>
  );
}

export default function MenuSemanal({
  selectedMenu = null,
  viewMode = 'diaria',
  isEditing = false,
  editedDias = [],
  onChangeDayData = null,
}) {
  const [activeDay, setActiveDay] = useState('');

  const orderedDays = isEditing
    ? [...editedDias].sort((a, b) => WEEKDAY_ORDER.indexOf(a.dia) - WEEKDAY_ORDER.indexOf(b.dia))
    : (selectedMenu
      ? [...selectedMenu.dias].sort((a, b) => WEEKDAY_ORDER.indexOf(a.dia) - WEEKDAY_ORDER.indexOf(b.dia))
      : []);

  useEffect(() => {
    if (orderedDays.length > 0) {
      const todayIdx = getTodayIndex();
      const todayName = WEEKDAY_ORDER[todayIdx];
      const hasToday = orderedDays.some(d => d.dia === todayName);
      if (hasToday) {
        setActiveDay(todayName);
      } else {
        setActiveDay(orderedDays[0].dia);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenu]);

  const activeDayData = orderedDays.find((d) => d.dia === activeDay) || null;

  const renderHeroDay = (dayData) => {
    if (!dayData) return null;

    if (isEditing) {
      const comida = dayData.comida || { primero: '', segundo: '', postre: '' };
      const cena = dayData.cena || { primero: '', segundo: '', postre: '' };

      return (
        <Grid gutter="md" align="stretch" mt="xs">
          {/* Comida Bento Card */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <BentoCard title="Almuerzo / Comida" icon={IconToolsKitchen} color="orange">
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
            <BentoCard title="Cena del Equipo" icon={IconFlame} color="blue">
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
          <BentoCard title="Almuerzo / Comida" icon={IconToolsKitchen} color="orange">
            <Stack gap="md" mt="xs">
              <HeroDishSection title="Primer Plato" label="1º" value={dayData.comida?.primero} color="orange" />
              <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
              <HeroDishSection title="Segundo Plato" label="2º" value={dayData.comida?.segundo} color="orange" />
              {dayData.comida?.postre && (
                <>
                  <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
                  <HeroDishSection title="Postre / Fruta" label="P" value={dayData.comida.postre} color="orange" />
                </>
              )}
            </Stack>
          </BentoCard>
        </Grid.Col>

        {/* Cena Bento Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <BentoCard title="Cena del Equipo" icon={IconFlame} color="blue">
            <Stack gap="md" mt="xs">
              <HeroDishSection title="Primer Plato" label="1º" value={dayData.cena?.primero} color="blue" />
              <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
              <HeroDishSection title="Segundo Plato" label="2º" value={dayData.cena?.segundo} color="blue" />
              {dayData.cena?.postre && (
                <>
                  <Divider style={{ borderColor: 'var(--mantine-color-gray-1)', borderStyle: 'dashed' }} />
                  <HeroDishSection title="Postre / Fruta" label="P" value={dayData.cena.postre} color="blue" />
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
        icon={IconToolsKitchen}
        title="Sin menús"
        description="No hay menús registrados. Sube la foto o PDF del menú de esta semana para empezar."
      />
    );
  }

  return (
    <Box>
      {viewMode === 'diaria' ? (
        <Stack gap="md">
          {/* Day Buttons Selector */}
          <Group gap="xs" justify="stretch" wrap="nowrap" style={{ width: '100%', overflowX: 'auto' }}>
            {orderedDays.map((dia) => (
              <DaySelectorButton
                key={dia.dia}
                dayName={dia.dia}
                isSelected={activeDay === dia.dia}
                isHoy={isToday(dia.dia)}
                dateStr={getDayDate(selectedMenu.semana, dia.dia)}
                onClick={() => setActiveDay(dia.dia)}
              />
            ))}
          </Group>

          {/* Hero Active Day Menu */}
          {renderHeroDay(activeDayData)}
        </Stack>
      ) : (
        /* Weekly Agenda View */
        <Stack gap="sm">
          {orderedDays.map((dia) => (
            <AgendaDayRow key={dia.dia} dayData={dia} weekStr={selectedMenu.semana} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
