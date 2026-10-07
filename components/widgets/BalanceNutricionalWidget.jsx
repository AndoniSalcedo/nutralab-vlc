'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionIcon, Box, Group, Popover, Text, UnstyledButton } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCheck, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import WidgetCard, { WidgetValue } from './WidgetCard';
import { formatInteger } from '@/lib/utils';

const MACROS = [
  { key: 'pro', targetKey: 'protein', label: 'Proteína', color: 'red', kcalPerG: 4 },
  { key: 'cho', targetKey: 'cho', label: 'Hidratos', color: 'yellow', kcalPerG: 4 },
  { key: 'fat', targetKey: 'fat', label: 'Grasa', color: 'blue', kcalPerG: 9 },
];

// Margen alrededor del objetivo que se considera "en objetivo"
const ON_TARGET_LOW = 0.9;
const ON_TARGET_HIGH = 1.1;


const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const fmt = (v) => (toNum(v) > 0 ? formatInteger(v) : '0');

const tabular = { fontVariantNumeric: 'tabular-nums' };
const cssColor = (c) => `var(--mantine-color-${c.replace('.', '-')})`;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getStatus(consumed, target) {
  if (!target) return { tone: 'none' };
  const ratio = consumed / target;
  if (ratio > ON_TARGET_HIGH) return { tone: 'over', diff: consumed - target };
  if (ratio >= ON_TARGET_LOW) return { tone: 'ok' };
  return { tone: 'under', diff: target - consumed };
}

function formatDayLabel(date) {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function DateNav({ date, onDateChange }) {
  const [opened, setOpened] = useState(false);
  const isToday = startOfDay(date).getTime() === startOfDay(new Date()).getTime();

  const shift = (days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    onDateChange?.(next);
  };

  return (
    <Group gap={0} wrap="nowrap" style={{ borderRadius: 20, backgroundColor: 'var(--mantine-color-gray-0)' }}>
      <ActionIcon variant="subtle" color="gray" size={26} onClick={() => shift(-1)} aria-label="Día anterior">
        <IconChevronLeft size={14} stroke={2.2} />
      </ActionIcon>
      <Popover opened={opened} onChange={setOpened} position="bottom-end" withArrow shadow="md" radius="md">
        <Popover.Target>
          <UnstyledButton onClick={() => setOpened((o) => !o)} px={2} aria-label="Elegir fecha">
            <Text fz={11} fw={700} c="dark.4" tt="capitalize" style={{ whiteSpace: 'nowrap' }}>
              {formatDayLabel(date)}
            </Text>
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown p="xs">
          <DatePicker
            value={date}
            onChange={(val) => {
              if (val) {
                onDateChange?.(new Date(val));
                setOpened(false);
              }
            }}
            maxDate={new Date()}
            size="sm"
          />
        </Popover.Dropdown>
      </Popover>
      <ActionIcon
        variant="subtle"
        color="gray"
        size={26}
        disabled={isToday}
        onClick={() => shift(1)}
        aria-label="Día siguiente"
        style={isToday ? { backgroundColor: 'transparent', opacity: 0.3 } : undefined}
      >
        <IconChevronRight size={14} stroke={2.2} />
      </ActionIcon>
    </Group>
  );
}

const WAVE_PATH = 'M0 6 C 12 0, 38 12, 50 6 C 62 0, 88 12, 100 6 L100 12 L0 12 Z';

// Tubo de ensayo graduado: lleno hasta arriba = objetivo del día cumplido
function Tube({ macro, consumed, target }) {
  const value = toNum(consumed);
  const goal = toNum(target);
  const ratio = goal > 0 ? value / goal : 0;
  const level = Math.min(100, ratio * 100);
  const status = getStatus(value, goal);
  const liquid = macro.color;
  const showWave = level > 0 && level < 100;

  return (
    <Box className="nl-tube-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Sello de estado sobre la boca del tubo */}
      <Box h={18} mb={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
        {status.tone === 'ok' && (
          <Box
            w={18}
            h={18}
            style={{ borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: 'var(--nutra-lima, #C1F080)' }}
          >
            <IconCheck size={11} stroke={3.4} color="var(--nutra-bosque, #1F2A24)" />
          </Box>
        )}
        {status.tone === 'over' && (
          <Text
            fz={10}
            fw={800}
            c="var(--nutra-arcilla, #B8674A)"
            px={6}
            lh="18px"
            style={{ ...tabular, borderRadius: 9, backgroundColor: 'var(--nutra-arcilla-soft, rgba(184, 103, 74, 0.12))', whiteSpace: 'nowrap' }}
          >
            +{fmt(status.diff)}
          </Text>
        )}
      </Box>

      {/* Borde de la boca */}
      <Box
        h={4}
        style={{
          width: 'calc(var(--tube-w) + 8px)',
          borderRadius: 3,
          backgroundColor: status.tone === 'over' ? 'var(--nutra-arcilla, #B8674A)' : 'var(--mantine-color-gray-2)',
        }}
      />

      <Box
        role="img"
        aria-label={`${macro.label}: ${fmt(value)} de ${fmt(goal)} gramos`}
        style={{
          position: 'relative',
          width: 'var(--tube-w)',
          height: 'var(--tube-h)',
          borderRadius: '0 0 999px 999px',
          backgroundColor: 'var(--mantine-color-gray-0)',
          boxShadow: 'inset 0 0 0 1.5px var(--mantine-color-gray-2)',
          overflow: 'hidden',
        }}
      >
        {/* Líquido */}
        <Box
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: `${level}%`,
            transition: 'height 1.1s cubic-bezier(0.34, 1.35, 0.5, 1)',
          }}
        >
          {showWave && (
            <svg
              className="nl-tube-wave"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              style={{ position: 'absolute', bottom: '100%', left: 0, width: '200%', height: 7, marginBottom: -1 }}
            >
              <path d={WAVE_PATH} fill={cssColor(`${liquid}.3`)} />
            </svg>
          )}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${cssColor(`${liquid}.3`)} 0%, ${cssColor(`${liquid}.4`)} 100%)`,
            }}
          />
        </Box>

        {/* Graduación al 25 / 50 / 75 % */}
        {[25, 50, 75].map((t) => (
          <Box
            key={t}
            aria-hidden
            style={{
              position: 'absolute',
              right: 0,
              bottom: `${t}%`,
              width: t === 50 ? 10 : 6,
              height: 1.5,
              backgroundColor: 'rgba(21, 21, 19, 0.14)',
            }}
          />
        ))}

        {/* Brillo del cristal */}
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            top: 6,
            bottom: 14,
            left: 6,
            width: 4,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.55)',
          }}
        />

        {goal > 0 && (
          <Text
            fz={10}
            fw={800}
            c={level > 18 ? 'dark.6' : 'dimmed'}
            ta="center"
            style={{ ...tabular, position: 'absolute', left: 0, right: 0, bottom: 8 }}
          >
            {Math.round(ratio * 100)}%
          </Text>
        )}
      </Box>

      <Text fz={14} fw={800} c="dark.6" lh={1} mt={8} style={{ ...tabular, whiteSpace: 'nowrap' }}>
        {fmt(value)}
        <Text span fz={10} fw={600} c="dimmed" ml={1}>
          g
        </Text>
      </Text>
      <Text fz={10} fw={600} c="dimmed" mt={3} style={{ ...tabular, whiteSpace: 'nowrap' }}>
        {goal > 0 ? `de ${fmt(goal)}` : '—'}
      </Text>
      <Text fz={10} fw={700} c="dark.4" mt={4} style={{ whiteSpace: 'nowrap' }}>
        {macro.label}
      </Text>
    </Box>
  );
}

// Barra de energía: cada tramo es la energía que aporta un macro. Si se supera el objetivo
// la escala se estira y una muesca marca dónde estaba el 100 %.
function EnergyBar({ consumed, consumedKcal, targetKcal }) {
  const parts = MACROS.map((m) => ({ ...m, kcal: toNum(consumed[m.key]) * m.kcalPerG }));
  const macroKcal = parts.reduce((sum, p) => sum + p.kcal, 0);
  // Las kcal registradas sin desglose de macros van en gris
  const otherKcal = Math.max(0, consumedKcal - macroKcal);
  const total = Math.max(consumedKcal, macroKcal);
  const scale = Math.max(targetKcal, total) || 1;
  const markerPct = targetKcal > 0 && total > targetKcal ? (targetKcal / scale) * 100 : null;
  const segments = [...parts.map((p) => ({ key: p.key, kcal: p.kcal, color: `${p.color}.4` })), { key: 'other', kcal: otherKcal, color: 'gray.4' }]
    .filter((p) => p.kcal > 0);

  return (
    <Box pos="relative">
      <Box style={{ display: 'flex', gap: 2, height: 10, borderRadius: 6, overflow: 'hidden', backgroundColor: 'var(--mantine-color-gray-1)' }}>
        {segments.map((p) => (
          <Box
            key={p.key}
            style={{ width: `${(p.kcal / scale) * 100}%`, backgroundColor: cssColor(p.color), transition: 'width 0.8s ease' }}
          />
        ))}
      </Box>
      {markerPct != null && (
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            top: -3,
            bottom: -3,
            left: `calc(${markerPct}% - 1px)`,
            width: 2,
            borderRadius: 2,
            backgroundColor: 'var(--mantine-color-dark-6)',
          }}
        />
      )}
    </Box>
  );
}

// Pista de una línea para el jugador: qué macro debe priorizar en lo que queda de día
function getHint({ isEmpty, kcalTone, consumed, target }) {
  if (isEmpty) return { text: 'Aún no hay comidas registradas este día.' };
  if (kcalTone === 'over') return { text: 'Por hoy ya has cubierto la energía del plan.' };

  const macros = MACROS.map((m) => {
    const goal = toNum(target[m.targetKey]);
    const value = toNum(consumed[m.key]);
    return { ...m, ratio: goal > 0 ? value / goal : 1, missing: goal - value };
  });

  if (kcalTone === 'ok') {
    const over = macros.filter((m) => m.ratio > ON_TARGET_HIGH).sort((a, b) => b.ratio - a.ratio)[0];
    if (!over) return { text: 'Día bien cuadrado con el plan.' };
    return { text: `Energía en objetivo; vas alto de ${over.label.toLowerCase()} (+${fmt(-over.missing)} g)`, color: over.color };
  }

  const pending = macros.filter((m) => m.ratio < ON_TARGET_LOW).sort((a, b) => a.ratio - b.ratio);

  if (pending.length === 0) return null;
  const top = pending[0];
  return { text: `Falta sobre todo ${top.label.toLowerCase()} · ${fmt(top.missing)} g`, color: top.color };
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
  const date = new Date(selectedDate);

  const consumedKcal = toNum(consumed.kcal);
  const targetKcal = toNum(target.kcal);
  const kcalStatus = getStatus(consumedKcal, targetKcal);
  const kcalPct = targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0;
  const isEmpty = mealsCount === 0 && consumedKcal === 0;

  // La cifra protagonista es lo que aún le queda por comer: es lo que el jugador necesita saber
  let hero = { label: 'Consumidas', value: fmt(consumedKcal), color: 'dark.6' };
  if (isEmpty && targetKcal > 0) hero = { label: 'Objetivo del día', value: fmt(targetKcal), color: 'dark.6' };
  else if (kcalStatus.tone === 'under') hero = { label: 'Te quedan', value: fmt(kcalStatus.diff), color: 'dark.6' };
  else if (kcalStatus.tone === 'ok') hero = { label: 'Objetivo cumplido', value: fmt(consumedKcal), color: 'teal.8' };
  else if (kcalStatus.tone === 'over') hero = { label: 'Por encima', value: `+${fmt(kcalStatus.diff)}`, color: 'orange.8' };

  const hint = getHint({ isEmpty, kcalTone: kcalStatus.tone, consumed, target });
  const pctColor = kcalStatus.tone === 'over' ? 'var(--nutra-arcilla, #B8674A)' : kcalStatus.tone === 'ok' ? 'var(--nutra-lima-dark, #4a6813)' : 'var(--nutra-bosque, #1F2A24)';

  return (
    <WidgetCard
      id="widget-balance-nutricional"
      color="salvia"
      icon="fire"
      title="Balance nutricional"
      aside={<DateNav date={date} onDateChange={onDateChange} />}
      footer={`${mealsCount} ${mealsCount === 1 ? 'comida registrada' : 'comidas registradas'}`}
      footerAction={isEmpty ? 'Registrar comida' : 'Ver diario'}
      onFooterAction={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/diario`)}
    >
      <style>{`
        @keyframes nl-tube-wave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .nl-tube-wave { animation: nl-tube-wave 2.8s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .nl-tube-wave { animation: none; } }
        .nl-tubes { --tube-w: 34px; --tube-h: 108px; gap: 6px; }
        .nl-tube-col { width: 50px; }
        @media (min-width: 48em) {
          .nl-tubes { --tube-w: 40px; --tube-h: 120px; gap: 14px; }
          .nl-tube-col { width: 58px; }
        }
      `}</style>

      <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 12, alignItems: 'stretch' }}>
        {/* Energía del día */}
        <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, paddingTop: 22 }}>
          <Box>
            <Text fz={11} fw={600} c="dimmed" mb={6}>
              {hero.label}
            </Text>
            <WidgetValue value={hero.value} unit="kcal" color={hero.color} size={32} />
            {hint && (
              <Group gap={6} wrap="nowrap" align="flex-start" mt={10}>
                {hint.color && (
                  <Box
                    mt={4}
                    style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, backgroundColor: cssColor(`${hint.color}.5`) }}
                  />
                )}
                <Text fz={11} fw={500} c="dark.3" lh={1.4} style={tabular}>
                  {hint.text}
                </Text>
              </Group>
            )}
          </Box>

          {targetKcal > 0 && (
            <Box>
              <Group justify="space-between" align="baseline" wrap="nowrap" mb={6} gap={6}>
                <Text fz={11} fw={600} c="dimmed" truncate style={tabular}>
                  <Text span inherit fw={800} c="dark.5">
                    {fmt(consumedKcal)}
                  </Text>{' '}
                  de {fmt(targetKcal)}
                </Text>
                <Text fz={11} fw={800} c={pctColor} style={tabular}>
                  {kcalPct}%
                </Text>
              </Group>
              <EnergyBar consumed={consumed} consumedKcal={consumedKcal} targetKcal={targetKcal} />
            </Box>
          )}
        </Box>

        {/* Macros */}
        <Box className="nl-tubes" style={{ display: 'flex', alignItems: 'flex-start' }}>
          {MACROS.map((m) => (
            <Tube key={m.key} macro={m} consumed={consumed[m.key]} target={target[m.targetKey]} />
          ))}
        </Box>
      </Box>
    </WidgetCard>
  );
}
