'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Group,
  Paper,
  Popover,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCalendar } from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';

function CompactMacroLine({ label, color, consumed = 0, target = 0 }) {
  const targetNum = target && Number(target) > 0 ? Number(target) : 0;
  const pct = targetNum > 0 ? Math.min(100, Math.round((consumed / targetNum) * 100)) : 0;

  return (
    <Stack gap={1}>
      <Group justify="space-between" align="baseline" wrap="nowrap">
        <Text fz="xs" fw={600} c="dark.5" truncate>
          {label}
        </Text>
        <Text fz="xs" fw={500} c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <Text span fw={600} c="dark.5">
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
  consumed = { kcal: 0, pro: 0, cho: 0, fat: 0 },
  target = { kcal: '-', protein: null, cho: null, fat: null },
  mealsCount = 0,
}) {
  const router = useRouter();
  const [popoverOpened, setPopoverOpened] = useState(false);

  const targetKcal = target.kcal && Number(target.kcal) > 0 ? Number(target.kcal) : 0;
  const kcalPct = targetKcal > 0 ? Math.min(100, Math.round((consumed.kcal / targetKcal) * 100)) : 0;
  const isKcalReached = targetKcal > 0 && consumed.kcal >= targetKcal;

  // Formato amigable corto para la fecha
  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Paper shadow="xs" radius="lg" p={{ base: 'xs', sm: 'sm' }} bg="white" withBorder>
      {/* Cabecera: Título con icono unificado + Indicador de fecha y tipo de día */}
      <Group justify="space-between" align="center" mb={6}>
        <Group gap="xs" align="center">
          <Icon3D name="fire" size={28} />
          <Text fw={700} fz="sm" c="dark.5">
            Balance Nutricional
          </Text>
        </Group>

        {/* Selector de fecha */}
        <Group gap={4} align="center">
          <Text fz="xs" fw={600} c="dimmed">
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
                variant="subtle"
                color="gray"
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

      {/* Misma fila en 2 columnas (móvil y desktop): Columna 1 Ring de Calorías, Columna 2 Macros */}
      <SimpleGrid cols={2} spacing={{ base: 'xs', sm: 'md' }} my={4} style={{ alignItems: 'center' }}>
        {/* Columna 1: Ring de calorías centrado */}
        <Stack align="center" justify="center" gap={0}>
          <RingProgress
            size={98}
            thickness={9}
            roundCaps
            sections={[
              {
                value: kcalPct,
                color: isKcalReached ? 'teal.5' : 'orange.5',
              },
            ]}
            label={
              <Stack gap={0} align="center" justify="center" ta="center">
                <Text fz="10px" c="dimmed" fw={600} tt="uppercase" lts={0.5}>
                  Kcal
                </Text>
                <Text fz="sm" fw={700} lh={1.1} c="dark.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {consumed.kcal}
                </Text>
                <Text fz="10px" c="dimmed" fw={500} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  / {target.kcal || '-'}
                </Text>
              </Stack>
            }
          />
        </Stack>

        {/* Columna 2: Proteínas, Carbohidratos y Grasas */}
        <Stack gap={5}>
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
        mt={6}
        pt={6}
        style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}
      >
        <Text fz="xs" c="dimmed" fw={500}>
          {mealsCount} comida(s) registrada(s)
        </Text>
        <Text
          fz="xs"
          fw={600}
          c="dark.4"
          style={{ cursor: 'pointer' }}
          onClick={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/diario`)}
        >
          Ver diario →
        </Text>
      </Group>
    </Paper>
  );
}
