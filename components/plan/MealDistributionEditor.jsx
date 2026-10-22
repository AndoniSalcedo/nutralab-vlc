'use client';

import { useState } from 'react';
import { ActionIcon, Badge, Box, Button, Group, NumberInput, Slider, Stack, Text, Tooltip } from '@mantine/core';
import { IconLock, IconLockOpen, IconMinus, IconPlus, IconRefresh } from '@tabler/icons-react';

// Color de cada toma (paleta de la marca): fondo del tramo y color del texto encima.
const MEAL_COLORS = {
  Desayuno: { color: 'lima', shade: 4, text: 'var(--mantine-color-bosque-8)' },
  Almuerzo: { color: 'lima', shade: 6, text: 'var(--mantine-color-bosque-8)' },
  Comida: { color: 'bosque', shade: 6, text: '#fff' },
  Merienda: { color: 'salvia', shade: 4, text: 'var(--mantine-color-bosque-8)' },
  Cena: { color: 'bosque', shade: 8, text: '#fff' },
};
const OTHER_MEAL_COLOR = { color: 'salvia', shade: 6, text: '#fff' };

const mealColor = (meal) => MEAL_COLORS[meal] || OTHER_MEAL_COLOR;
const cssColor = (meal) => {
  const { color, shade } = mealColor(meal);
  return `var(--mantine-color-${color}-${shade})`;
};

/** Reparte `total` en enteros proporcionales a `weights` (resto mayor); con pesos a cero, a partes iguales. */
function distributeWhole(weights, total) {
  const entries = Object.entries(weights);
  if (entries.length === 0) return {};
  const sum = entries.reduce((acc, [, w]) => acc + w, 0);
  const raw = entries.map(([name, w]) => ({ name, value: sum > 0 ? (w / sum) * total : total / entries.length }));
  const result = Object.fromEntries(raw.map(({ name, value }) => [name, Math.floor(value)]));
  let missing = total - Object.values(result).reduce((acc, v) => acc + v, 0);
  [...raw]
    .sort((a, b) => (b.value - Math.floor(b.value)) - (a.value - Math.floor(a.value)))
    .forEach(({ name }) => {
      if (missing > 0) {
        result[name] += 1;
        missing -= 1;
      }
    });
  return result;
}

/** Barra apilada con el % de kcal de cada toma. */
export function MealDistributionBar({ meals, percents, height = 28, showLegend = false }) {
  return (
    <Stack gap={6}>
      <Box
        style={{
          display: 'flex',
          height,
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--mantine-color-gray-2)',
        }}
      >
        {meals.map((meal) => {
          const pct = percents[meal] || 0;
          // Con leyenda el nombre ya está debajo: en móvil "Mer 12%" no cabía en un tramo del 12 %
          const label = pct < 8 ? '' : !showLegend && pct >= 18 ? `${meal.slice(0, 3)} ${pct}%` : `${pct}%`;
          return (
            <Tooltip key={meal} label={`${meal}: ${pct} %`} withArrow>
              <Box
                style={{
                  width: `${pct}%`,
                  background: cssColor(meal),
                  color: mealColor(meal).text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  fontSize: 11,
                  fontWeight: 700,
                  transition: 'width 180ms ease',
                  borderRight: '2px solid var(--mantine-color-white)',
                }}
              >
                {label}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      {showLegend && (
        <Group gap="sm" wrap="wrap">
          {meals.map((meal) => (
            <Group key={meal} gap={5} wrap="nowrap">
              <Box w={9} h={9} style={{ borderRadius: 3, background: cssColor(meal) }} />
              <Text size="11px" c="dark.7">
                {meal} <Text span fw={700}>{percents[meal] || 0} %</Text>
              </Text>
            </Group>
          ))}
        </Group>
      )}
    </Stack>
  );
}

/**
 * Editor del reparto de kcal por toma. Siempre suma 100: al cambiar una toma, la diferencia se compensa en proporción
 * entre las tomas libres y, si no alcanza, entre las fijadas. Una toma se fija sola al editarla (para poder ir dando
 * valores exactos uno tras otro) y el candado la libera.
 */
export function MealDistributionEditor({ meals, value, defaults, onChange }) {
  const [locked, setLocked] = useState(() => new Set());
  const total = meals.reduce((sum, meal) => sum + (value[meal] || 0), 0);
  const isDefault = meals.every((meal) => value[meal] === defaults[meal]);

  function setMeal(meal, rawValue) {
    const next = Math.max(0, Math.min(100, Math.round(Number(rawValue) || 0)));
    const others = meals.filter((m) => m !== meal);
    const free = others.filter((m) => !locked.has(m));
    const fixed = others.filter((m) => locked.has(m));
    const current = (list) => Object.fromEntries(list.map((m) => [m, value[m] || 0]));
    const fixedSum = fixed.reduce((sum, m) => sum + (value[m] || 0), 0);
    const forOthers = 100 - next;
    let rest;
    if (others.length === 0) {
      rest = {};
    } else if (free.length > 0 && forOthers >= fixedSum) {
      // Las tomas libres absorben el cambio y las fijadas no se tocan.
      rest = distributeWhole(current(free), forOthers - fixedSum);
    } else if (free.length === 0) {
      rest = distributeWhole(current(fixed), forOthers);
    } else {
      // Las libres no llegan: se quedan a 0 y el resto sale de las fijadas.
      rest = { ...Object.fromEntries(free.map((m) => [m, 0])), ...distributeWhole(current(fixed), forOthers) };
    }
    setLocked(new Set([...locked, meal]));
    onChange({ ...value, ...rest, [meal]: others.length === 0 ? 100 : next });
  }

  function toggleLock(meal) {
    const next = new Set(locked);
    if (next.has(meal)) next.delete(meal);
    else next.add(meal);
    setLocked(next);
  }

  function reset() {
    setLocked(new Set());
    onChange({ ...defaults });
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center" gap="xs">
        <Group gap={6}>
          <Text size="xs" fw={600}>Reparto de kcal por ingesta</Text>
          <Badge size="sm" variant="light" color={total === 100 ? 'bosque' : 'arcilla'}>
            Total {total} %
          </Badge>
          {meals.some((meal) => !value[meal]) && (
            <Badge size="sm" variant="light" color="arcilla">Hay tomas a 0 %</Badge>
          )}
        </Group>
        {!isDefault && (
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            radius="xl"
            leftSection={<IconRefresh size={12} />}
            onClick={reset}
          >
            Por defecto
          </Button>
        )}
      </Group>

      <MealDistributionBar meals={meals} percents={value} />

      <Stack gap={4}>
        {meals.map((meal) => {
          const pct = value[meal] || 0;
          const isLocked = locked.has(meal);
          const changed = pct !== defaults[meal];
          return (
            <Group key={meal} gap="xs" wrap="nowrap" align="center">
              <Group gap={6} wrap="nowrap" w={92} style={{ flexShrink: 0 }}>
                <Box w={10} h={10} style={{ borderRadius: 3, background: cssColor(meal), flexShrink: 0 }} />
                <Text size="xs" fw={600} truncate>{meal}</Text>
              </Group>
              <Slider
                value={pct}
                onChange={(v) => setMeal(meal, v)}
                min={0}
                max={100}
                step={1}
                size="sm"
                color={mealColor(meal).color}
                label={null}
                style={{ flex: 1, minWidth: 60 }}
                marks={Number.isFinite(defaults[meal]) ? [{ value: defaults[meal] }] : []}
                styles={{
                  mark: { width: 4, height: 12, borderRadius: 2, border: 0, marginTop: -3, background: 'var(--mantine-color-gray-5)' },
                  markFilled: { background: 'var(--mantine-color-white)' },
                }}
                aria-label={`% de kcal de ${meal}`}
              />
              <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setMeal(meal, pct - 1)} aria-label={`Restar 1 % a ${meal}`}>
                  <IconMinus size={14} />
                </ActionIcon>
                <NumberInput
                  value={pct}
                  onChange={(v) => {
                    if (v !== '' && Number.isFinite(Number(v))) setMeal(meal, v);
                  }}
                  min={0}
                  max={100}
                  allowDecimal={false}
                  allowNegative={false}
                  hideControls
                  suffix=" %"
                  size="xs"
                  w={58}
                  styles={{ input: { textAlign: 'center', fontWeight: 700, color: changed ? 'var(--mantine-color-bosque-8)' : undefined } }}
                  aria-label={`% de kcal de ${meal}`}
                />
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setMeal(meal, pct + 1)} aria-label={`Sumar 1 % a ${meal}`}>
                  <IconPlus size={14} />
                </ActionIcon>
                <Tooltip label={isLocked ? 'Fijada: no se toca al ajustar otras tomas' : 'Libre: compensa los cambios de otras tomas'} withArrow>
                  <ActionIcon
                    variant={isLocked ? 'light' : 'subtle'}
                    color={isLocked ? 'bosque' : 'gray'}
                    size="sm"
                    onClick={() => toggleLock(meal)}
                    aria-label={isLocked ? `Liberar ${meal}` : `Fijar ${meal}`}
                  >
                    {isLocked ? <IconLock size={13} /> : <IconLockOpen size={13} />}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          );
        })}
      </Stack>

      <Text size="11px" c="dimmed">
        Al mover una toma, el resto se compensa entre las tomas libres (candado abierto) para que siempre sume 100 %.
        La raya del deslizador marca el valor por defecto.
      </Text>
    </Stack>
  );
}
