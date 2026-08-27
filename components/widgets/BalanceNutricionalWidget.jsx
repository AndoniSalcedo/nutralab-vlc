'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Popover,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCalendar, IconFlame, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

function CompactMacroLine({ label, color, consumed = 0, target = 0 }) {
  const targetNum = target && Number(target) > 0 ? Number(target) : 0;
  const pct = targetNum > 0 ? Math.min(100, Math.round((consumed / targetNum) * 100)) : 0;

  return (
    <Stack gap={2}>
      <Group justify="space-between" align="baseline" wrap="nowrap">
        <Text fz="11px" fw={700} c="dark.5" truncate>
          {label}
        </Text>
        <Text fz="10px" fw={500} c="dimmed">
          <Text span fw={750} c="dark.6">
            {consumed}g
          </Text>
          /{target || '-'}g
        </Text>
      </Group>
      <Progress value={pct} color={color} size="xs" radius="xl" bg="gray.1" />
    </Stack>
  );
}

export default function BalanceNutricionalWidget({
  jugadorId,
  selectedDate = new Date(),
  onDateChange,
  activeDayType = 'entreno',
  onDayTypeChange,
  dayTypes = [],
  consumed = { kcal: 0, pro: 0, cho: 0, fat: 0 },
  target = { kcal: '-', protein: null, cho: null, fat: null },
  mealsCount = 0,
}) {
  const router = useRouter();
  const [popoverOpened, setPopoverOpened] = useState(false);

  const targetKcal = target.kcal && Number(target.kcal) > 0 ? Number(target.kcal) : 0;
  const kcalPct = targetKcal > 0 ? Math.min(100, Math.round((consumed.kcal / targetKcal) * 100)) : 0;
  const isKcalReached = targetKcal > 0 && consumed.kcal >= targetKcal;


  const activeIdx = dayTypes.findIndex((d) => d.value === activeDayType);
  const activeDay = dayTypes[activeIdx !== -1 ? activeIdx : 0] || {};

  // Formato amigable corto para la fecha
  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Paper shadow="xs" radius="lg" p="md" bg="white" withBorder>
      {/* Cabecera: Título con icono rojo del mismo tamaño que los demás widgets + Icono de Calendario a la derecha */}
      <Group justify="space-between" align="center" mb="sm">
        <Group gap="xs" align="center">
          <ThemeIcon color="red" variant="light" size="sm" radius="md">
            <IconFlame size={14} />
          </ThemeIcon>
          <Text fw={700} fz="sm" c="dark.5">
            Balance Nutricional
          </Text>
        </Group>

        {/* Icono de Calendario para abrir el selector de fecha en Popover */}
        <Group gap={6} align="center">
          <Text fz="11px" fw={600} c="dimmed">
            {formattedDate}
          </Text>
          <Popover
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-end"
            withArrow
            shadow="md"
            radius="md"
          >
            <Popover.Target>
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                radius="md"
                onClick={() => setPopoverOpened((o) => !o)}
                aria-label="Abrir calendario"
              >
                <IconCalendar size={14} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown p="xs">
              <DatePicker
                value={new Date(selectedDate)}
                onChange={(val) => {
                  if (val) {
                    onDateChange && onDateChange(val);
                    setPopoverOpened(false);
                  }
                }}
                maxDate={new Date()}
                size="sm"
              />
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Group>

      {/* Selector interactivo integrado de Tipo de Día: Carrusel compacto adaptado a la escala del widget */}
      {dayTypes && dayTypes.length > 0 && (
        <Paper
          withBorder
          py={5}
          px="xs"
          radius="lg"
          bg="gray.0"
          mb="xs"
          style={{ borderColor: 'var(--mantine-color-gray-2)' }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            {/* Flecha izquierda compacta */}
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="md"
              size="sm"
              onClick={() => {
                const prevIdx = (activeIdx - 1 + dayTypes.length) % dayTypes.length;
                onDayTypeChange && onDayTypeChange(dayTypes[prevIdx].value);
              }}
              style={{ transition: 'transform 0.1s ease' }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <IconChevronLeft size={14} stroke={2.2} />
            </ActionIcon>

            {/* Etiqueta central de tipo de día con punto de color */}
            <Stack gap={2} style={{ flex: 1 }} align="center">
              <Group gap={6} align="center">
                <Box
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: `var(--mantine-color-${activeDay.color || 'blue'}-6)`,
                  }}
                />
                <Text fz="11px" fw={750} c="dark.6">
                  {activeDay.label || 'Entreno'}
                </Text>
              </Group>

              {/* Indicator Dots interactivos estilizados */}
              <Group gap={4} justify="center">
                {dayTypes.map((dt, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <Box
                      key={dt.value}
                      onClick={() => onDayTypeChange && onDayTypeChange(dt.value)}
                      style={{
                        width: isActive ? '12px' : '4px',
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: isActive
                          ? `var(--mantine-color-${activeDay.color || 'blue'}-6)`
                          : 'var(--mantine-color-gray-3)',
                        cursor: 'pointer',
                        transition: 'width 0.2s ease, background-color 0.2s ease',
                      }}
                    />
                  );
                })}
              </Group>
            </Stack>

            {/* Flecha derecha compacta */}
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="md"
              size="sm"
              onClick={() => {
                const nextIdx = (activeIdx + 1) % dayTypes.length;
                onDayTypeChange && onDayTypeChange(dayTypes[nextIdx].value);
              }}
              style={{ transition: 'transform 0.1s ease' }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <IconChevronRight size={14} stroke={2.2} />
            </ActionIcon>
          </Group>
        </Paper>
      )}

      {/* Misma fila en 2 columnas (móvil y desktop): Columna 1 Ring de Calorías, Columna 2 Macros */}
      <SimpleGrid cols={2} spacing={{ base: 'xs', sm: 'md' }} my="xs" style={{ alignItems: 'center' }}>
        {/* Columna 1: Ring de calorías centrado */}
        <Stack align="center" justify="center" gap={0}>
          <RingProgress
            size={120}
            thickness={11}
            roundCaps
            sections={[
              {
                value: kcalPct,
                color: isKcalReached ? 'teal.5' : 'orange.5',
              },
            ]}
            label={
              <Stack gap={0} align="center" justify="center" ta="center">
                <Text fz="9px" c="dimmed" fw={800} tt="uppercase" lts={0.5}>
                  Kcal
                </Text>
                <Text fz="17px" fw={900} lh={1.1} c="dark.6">
                  {consumed.kcal}
                </Text>
                <Text fz="10px" c="dimmed" fw={600}>
                  / {target.kcal || '-'}
                </Text>
              </Stack>
            }
          />
        </Stack>

        {/* Columna 2: Proteínas, Carbohidratos y Grasas */}
        <Stack gap={8}>
          <CompactMacroLine
            label="Proteínas"
            color="red"
            consumed={consumed.pro}
            target={target.protein}
          />
          <CompactMacroLine
            label="Carbohidratos"
            color="yellow"
            consumed={consumed.cho}
            target={target.cho}
          />
          <CompactMacroLine
            label="Grasas"
            color="blue"
            consumed={consumed.fat}
            target={target.fat}
          />
        </Stack>
      </SimpleGrid>

      {/* Pie de tarjeta idéntico al resto de widgets */}
      <Group
        justify="space-between"
        align="center"
        mt="xs"
        pt="xs"
        style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}
      >
        <Text fz="10px" c="dimmed" fw={500}>
          {mealsCount} comida(s) registrada(s)
        </Text>
        <Text
          fz="10px"
          fw={700}
          c="blue.7"
          style={{ cursor: 'pointer' }}
          onClick={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/diario`)}
        >
          Ver diario →
        </Text>
      </Group>
    </Paper>
  );
}
