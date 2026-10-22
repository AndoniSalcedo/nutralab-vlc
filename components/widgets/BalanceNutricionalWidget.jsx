'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ActionIcon, Box, Group, Popover, Text, UnstyledButton } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCheck, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Icon3D from '@/components/Icon3D';
import AnimatedNumber from '@/components/motion/AnimatedNumber';
import WidgetCard, { WidgetValue } from './WidgetCard';
import { formatInteger } from '@/lib/utils';

const BOSQUE = 'var(--nutra-bosque, #1F2A24)';
const SALVIA = 'var(--nutra-salvia, #6C705A)';
const ARCILLA = 'var(--nutra-arcilla, #B8674A)';
const LIMA = 'var(--nutra-lima, #C1F080)';
const LIMA_DARK = 'var(--nutra-lima-dark, #4a6813)';
const TRACK = 'var(--mantine-color-hueso-3)';
const MAIN_MEAL = 'var(--mantine-color-bosque-6)';
const LIGHT_MEAL = 'var(--mantine-color-salvia-4)';
const UNKNOWN_KCAL = 'var(--mantine-color-salvia-2)';

// Macros dentro de la gama de la app: el arcilla queda reservado para pasarse del objetivo
const MACROS = [
  { key: 'pro', targetKey: 'protein', label: 'Proteína', color: 'var(--mantine-color-bosque-6)', kcalPerG: 4 },
  { key: 'cho', targetKey: 'cho', label: 'Hidratos', color: 'var(--mantine-color-lima-6)', kcalPerG: 4 },
  { key: 'fat', targetKey: 'fat', label: 'Grasa', color: 'var(--mantine-color-hueso-7)', kcalPerG: 9 },
];

// Tomas del diario: las principales en bosque y las ligeras en salvia, como en el diario de comidas
const MEAL_TYPES = {
  breakfast: { label: 'Desayuno', icon: 'coffee', main: false },
  midMorning: { label: 'Almuerzo', icon: 'sandwich', main: false },
  lunch: { label: 'Comida', icon: 'plate', main: true },
  snack: { label: 'Merienda', icon: 'apple', main: false },
  dinner: { label: 'Cena', icon: 'bowl', main: true },
  lateSnack: { label: 'Re-cena', icon: 'moon', main: false },
};
const OTHER_MEAL = { label: 'Toma', icon: 'fork_and_knife', main: false };

// Margen alrededor del objetivo que se considera "en objetivo"
const ON_TARGET_LOW = 0.9;
const ON_TARGET_HIGH = 1.1;

// Anillo de energía (viewBox cuadrado; el tamaño real lo fija el CSS)
const RING = 140;
const STROKE = 14;
const R = (RING - STROKE) / 2 - 4;
const C = RING / 2;
const GAP_DEG = 2.5;

// Franja horaria del día que se dibuja en la línea de tomas
const DAY_START = 6;
const DAY_END = 24;
const HOUR_MARKS = [8, 12, 16, 20];

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const fmt = (v) => (toNum(v) > 0 ? formatInteger(v) : '0');
const tabular = { fontVariantNumeric: 'tabular-nums' };
const formatTime = (d) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const hourOf = (d) => d.getHours() + d.getMinutes() / 60;
const dayPct = (h) => (Math.min(DAY_END, Math.max(DAY_START, h)) - DAY_START) / (DAY_END - DAY_START) * 100;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getTone(consumed, target) {
  if (!target) return 'none';
  const ratio = consumed / target;
  if (ratio > ON_TARGET_HIGH) return 'over';
  if (ratio >= ON_TARGET_LOW) return 'ok';
  return 'under';
}

function formatDayLabel(date) {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Comidas del día en orden cronológico, con su tipo y sus kcal
function buildEntries(meals) {
  return meals
    .map((m, i) => {
      const time = new Date(m.takenAt || m.taken_at);
      const type = MEAL_TYPES[m.mealType || m.meal_type] || OTHER_MEAL;
      return {
        id: String(m.id ?? i),
        name: m.dishName || m.dish_name || type.label,
        type,
        color: type.main ? MAIN_MEAL : LIGHT_MEAL,
        kcal: toNum(m.calories),
        time: Number.isNaN(time.getTime()) ? null : time,
      };
    })
    .sort((a, b) => (a.time?.getTime() ?? 0) - (b.time?.getTime() ?? 0));
}

function polar(deg, radius = R) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + radius * Math.cos(a), C + radius * Math.sin(a)];
}

function arcPath(from, to) {
  const end = Math.min(to, from + 359.9);
  const [x1, y1] = polar(from);
  const [x2, y2] = polar(end);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${end - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// Tramos del anillo: uno por comida, en orden. Lo que pasa del objetivo se corta y va en arcilla.
function buildArcs(parts, targetKcal) {
  const total = parts.reduce((sum, p) => sum + p.kcal, 0);
  const scale = Math.max(targetKcal, total);
  if (!scale) return { arcs: [], targetDeg: null };

  const pieces = [];
  let acc = 0;
  parts.forEach((p) => {
    const from = acc;
    const to = acc + p.kcal;
    acc = to;
    if (targetKcal > 0 && total > targetKcal && to > targetKcal) {
      if (from < targetKcal) pieces.push({ ...p, from, to: targetKcal });
      pieces.push({ ...p, from: Math.max(from, targetKcal), to, color: ARCILLA, over: true });
    } else {
      pieces.push({ ...p, from, to });
    }
  });

  const gap = pieces.length > 1 ? GAP_DEG : 0;
  const arcs = pieces.map((p, i) => {
    const fromDeg = (p.from / scale) * 360;
    const toDeg = (p.to / scale) * 360;
    const span = Math.max(toDeg - fromDeg - gap, 1.2);
    return { ...p, key: `${p.id}-${i}`, d: arcPath(fromDeg + gap / 2, fromDeg + gap / 2 + span) };
  });

  const targetDeg = targetKcal > 0 && total > targetKcal ? (targetKcal / scale) * 360 : null;
  return { arcs, targetDeg };
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
    <Group gap={0} wrap="nowrap" style={{ borderRadius: 20, backgroundColor: 'rgba(108, 112, 90, 0.12)' }}>
      <ActionIcon variant="subtle" color="salvia" size={26} onClick={() => shift(-1)} aria-label="Día anterior">
        <IconChevronLeft size={14} stroke={2.4} />
      </ActionIcon>
      <Popover opened={opened} onChange={setOpened} position="bottom-end" withArrow shadow="md" radius="md">
        <Popover.Target>
          <UnstyledButton onClick={() => setOpened((o) => !o)} px={2} aria-label="Elegir fecha">
            <Text fz={11} fw={700} c={BOSQUE} tt="capitalize" style={{ whiteSpace: 'nowrap' }}>
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
        color="salvia"
        size={26}
        disabled={isToday}
        onClick={() => shift(1)}
        aria-label="Día siguiente"
        style={isToday ? { backgroundColor: 'transparent', opacity: 0.3 } : undefined}
      >
        <IconChevronRight size={14} stroke={2.4} />
      </ActionIcon>
    </Group>
  );
}

// Anillo de energía: cada tramo es una comida del día, en el orden en que se tomó
function EnergyRing({ arcs, targetDeg, tone, activeId, onPick, onHover, animKey, children }) {
  const reduce = useReducedMotion();

  return (
    <Box className="nl-bal-ring" style={{ position: 'relative', aspectRatio: '1 / 1' }}>
      <svg viewBox={`0 0 ${RING} ${RING}`} width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
        {/* Halo lima cuando el día cuadra con el plan */}
        {tone === 'ok' && (
          <motion.circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={LIMA}
            strokeWidth={STROKE + 10}
            initial={{ opacity: 0 }}
            animate={reduce ? { opacity: 0.45 } : { opacity: [0.25, 0.6, 0.25] }}
            transition={reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <circle cx={C} cy={C} r={R} fill="none" stroke={TRACK} strokeWidth={STROKE} />

        {arcs.map((arc, i) => {
          const isActive = activeId === arc.id;
          const dimmed = activeId != null && !isActive;
          return (
            <motion.path
              key={`${animKey}-${arc.key}`}
              d={arc.d}
              fill="none"
              stroke={arc.color}
              strokeLinecap="butt"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1, opacity: dimmed ? 0.3 : 1, strokeWidth: isActive ? STROKE + 5 : STROKE }}
              transition={{
                pathLength: { duration: 0.5, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.2 },
                strokeWidth: { duration: 0.2 },
              }}
              style={{ cursor: arc.pickable ? 'pointer' : undefined }}
              onClick={arc.pickable ? () => onPick(arc.id) : undefined}
              onMouseEnter={arc.pickable ? () => onHover(arc.id) : undefined}
              onMouseLeave={arc.pickable ? () => onHover(null) : undefined}
            />
          );
        })}

        {/* Muesca del 100 % cuando el día se pasa del objetivo */}
        {targetDeg != null && (
          <line
            x1={polar(targetDeg, R - STROKE / 2 - 3)[0]}
            y1={polar(targetDeg, R - STROKE / 2 - 3)[1]}
            x2={polar(targetDeg, R + STROKE / 2 + 3)[0]}
            y2={polar(targetDeg, R + STROKE / 2 + 3)[1]}
            stroke={BOSQUE}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}
      </svg>

      <Box
        style={{
          position: 'absolute',
          inset: '18%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function RingCenter({ meal, tone, pct, consumedKcal, hasTarget }) {
  const pctColor = tone === 'over' ? ARCILLA : tone === 'ok' ? LIMA_DARK : BOSQUE;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={meal ? meal.id : 'total'}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.16 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {meal ? (
          <>
            <Icon3D name={meal.type.icon} size={24} />
            <Text fz={15} fw={800} c={BOSQUE} lh={1} mt={4} style={{ ...tabular, whiteSpace: 'nowrap' }}>
              {meal.kcal > 0 ? fmt(meal.kcal) : '—'}
              <Text span fz={9} fw={600} c={SALVIA} ml={2}>
                kcal
              </Text>
            </Text>
            <Text fz={10} fw={600} c={SALVIA} mt={3} style={{ ...tabular, whiteSpace: 'nowrap' }}>
              {meal.time ? formatTime(meal.time) : meal.type.label}
            </Text>
          </>
        ) : hasTarget ? (
          <>
            {tone === 'ok' && (
              <Box
                mb={4}
                style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: LIMA }}
              >
                <IconCheck size={11} stroke={3.4} color={BOSQUE} />
              </Box>
            )}
            <Text fz={pct >= 100 ? 23 : 26} fw={800} c={pctColor} lh={1} lts={-0.8} style={tabular}>
              <AnimatedNumber value={`${pct}%`} />
            </Text>
            <Text fz={10} fw={600} c={SALVIA} mt={4}>
              del objetivo
            </Text>
          </>
        ) : (
          <>
            <Text fz={20} fw={800} c={BOSQUE} lh={1} style={tabular}>
              <AnimatedNumber value={fmt(consumedKcal)} />
            </Text>
            <Text fz={10} fw={600} c={SALVIA} mt={4}>
              kcal
            </Text>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Línea del día: cuándo se ha comido y cuánto (el tamaño del punto sigue a las kcal)
function DayTimeline({ entries, activeId, onPick, onHover, now }) {
  const maxKcal = Math.max(...entries.map((e) => e.kcal), 1);
  const nowPct = now ? dayPct(hourOf(now)) : null;
  const timed = entries.filter((e) => e.time);

  return (
    <Box pos="relative" h={50} mx={8} aria-label="Comidas a lo largo del día">
      <Box style={{ position: 'absolute', left: 0, right: 0, top: 20, height: 4, borderRadius: 2, backgroundColor: TRACK }} />
      {nowPct != null && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{
            position: 'absolute',
            left: 0,
            top: 20,
            height: 4,
            width: `${nowPct}%`,
            borderRadius: 2,
            transformOrigin: 'left',
            backgroundColor: 'var(--mantine-color-salvia-2)',
          }}
        />
      )}

      {HOUR_MARKS.map((h) => (
        <Text
          key={h}
          fz={9}
          fw={600}
          c="var(--mantine-color-salvia-4)"
          style={{ position: 'absolute', top: 36, left: `${dayPct(h)}%`, transform: 'translateX(-50%)', ...tabular }}
        >
          {h}h
        </Text>
      ))}

      {nowPct != null && (
        <Box style={{ position: 'absolute', top: 22, left: `${nowPct}%`, width: 0, height: 0 }}>
          <Text
            fz={9}
            fw={800}
            c={LIMA_DARK}
            tt="uppercase"
            lts={0.4}
            style={{ position: 'absolute', bottom: 9, left: 0, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
          >
            Ahora
          </Text>
          <motion.span
            aria-hidden
            animate={{ scale: [1, 2], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            style={{ position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: '50%', background: LIMA }}
          />
          <span
            style={{ position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: '50%', background: LIMA, border: `2px solid ${BOSQUE}` }}
          />
        </Box>
      )}

      {timed.map((e, i) => {
        const size = Math.round(10 + 12 * Math.sqrt(e.kcal / maxKcal));
        const isActive = activeId === e.id;
        return (
          <UnstyledButton
            key={e.id}
            onClick={() => onPick(e.id)}
            onMouseEnter={() => onHover(e.id)}
            onMouseLeave={() => onHover(null)}
            aria-label={`${e.type.label} a las ${formatTime(e.time)}${e.kcal > 0 ? `, ${fmt(e.kcal)} kcal` : ''}`}
            aria-pressed={isActive}
            style={{
              position: 'absolute',
              top: 22,
              left: `${dayPct(hourOf(e.time))}%`,
              width: 30,
              height: 30,
              marginLeft: -15,
              marginTop: -15,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              zIndex: isActive ? 2 : 1,
            }}
          >
            {/* Aparece con un pequeño rebote; el resaltado al elegirla va aparte para que no herede el retardo */}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.3 + i * 0.08 }}
              style={{ display: 'grid', placeItems: 'center' }}
            >
              <span
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: e.color,
                  border: '2px solid white',
                  boxShadow: isActive ? '0 0 0 3px var(--nutra-lima-glow)' : '0 1px 2px rgba(21, 21, 19, 0.12)',
                  opacity: activeId != null && !isActive ? 0.4 : 1,
                  transform: isActive ? 'scale(1.3)' : 'none',
                  transition: 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
                }}
              />
            </motion.span>
          </UnstyledButton>
        );
      })}
    </Box>
  );
}

function Bar({ ratio, color, delay = 0 }) {
  return (
    <Box h={6} mt={8} style={{ borderRadius: 3, backgroundColor: TRACK, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(1, ratio) * 100}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
        style={{ height: '100%', borderRadius: 3, backgroundColor: color }}
      />
    </Box>
  );
}

function MacroLabel({ macro }) {
  return (
    <Group gap={5} wrap="nowrap">
      <Box style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, backgroundColor: macro.color }} />
      <Text fz={11} fw={700} c={BOSQUE} truncate>
        {macro.label}
      </Text>
    </Group>
  );
}

// Macros: progreso de cada uno si los registros traen desglose; si no, el reparto que pide el plan
function MacroPanel({ consumed, target, hasMacroData }) {
  const goals = MACROS.map((m) => ({ ...m, goal: toNum(target[m.targetKey]), value: toNum(consumed[m.key]) }));
  const goalKcal = goals.reduce((sum, m) => sum + m.goal * m.kcalPerG, 0);

  return (
    <Box p={12} style={{ borderRadius: 16, backgroundColor: 'var(--mantine-color-hueso-1)' }}>
      <Text fz={10} fw={700} c={SALVIA} tt="uppercase" lts={0.5} mb={10}>
        {hasMacroData ? 'Macros del día' : 'Reparto del plan'}
      </Text>

      {!hasMacroData && goalKcal > 0 && (
        <Box mb={12} style={{ display: 'flex', gap: 3, height: 8 }}>
          {goals.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: (m.goal * m.kcalPerG) / goalKcal }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.08 }}
              style={{ flexBasis: 0, borderRadius: 4, backgroundColor: m.color }}
            />
          ))}
        </Box>
      )}

      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', columnGap: 14 }}>
        {goals.map((m, i) => {
          const ratio = m.goal > 0 ? m.value / m.goal : 0;
          const isOver = ratio > ON_TARGET_HIGH;
          return (
            <Box key={m.key} style={{ minWidth: 0 }}>
              <MacroLabel macro={m} />
              {hasMacroData ? (
                <>
                  <Text fz={15} fw={800} c={isOver ? ARCILLA : BOSQUE} lh={1} mt={6} style={{ ...tabular, whiteSpace: 'nowrap' }}>
                    {fmt(m.value)}
                    <Text span fz={10} fw={600} c={SALVIA} ml={2}>
                      / {m.goal > 0 ? fmt(m.goal) : '—'} g
                    </Text>
                  </Text>
                  <Bar ratio={ratio} color={isOver ? ARCILLA : m.color} delay={0.2 + i * 0.08} />
                </>
              ) : (
                <>
                  <Text fz={15} fw={800} c={BOSQUE} lh={1} mt={6} style={{ ...tabular, whiteSpace: 'nowrap' }}>
                    {m.goal > 0 ? fmt(m.goal) : '—'}
                    <Text span fz={10} fw={600} c={SALVIA} ml={2}>
                      g
                    </Text>
                  </Text>
                  <Text fz={10} fw={600} c={SALVIA} mt={4} style={tabular}>
                    {goalKcal > 0 ? `${Math.round((m.goal * m.kcalPerG * 100) / goalKcal)} % kcal` : '—'}
                  </Text>
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// Una línea de contexto bajo la cifra: qué priorizar, o qué comida se está mirando
function getHint({ isEmpty, tone, consumed, target, hasMacroData, lastMeal }) {
  if (isEmpty) return { text: 'Sin comidas registradas' };
  if (tone === 'over') return { text: 'Energía del plan cubierta', color: ARCILLA };

  if (hasMacroData) {
    const macros = MACROS.map((m) => {
      const goal = toNum(target[m.targetKey]);
      const value = toNum(consumed[m.key]);
      return { ...m, ratio: goal > 0 ? value / goal : 1, missing: goal - value };
    });
    if (tone === 'ok') {
      const over = macros.filter((m) => m.ratio > ON_TARGET_HIGH).sort((a, b) => b.ratio - a.ratio)[0];
      if (over) return { text: `Vas alto de ${over.label.toLowerCase()} · +${fmt(-over.missing)} g`, color: ARCILLA };
    } else {
      const pending = macros.filter((m) => m.ratio < ON_TARGET_LOW).sort((a, b) => a.ratio - b.ratio)[0];
      if (pending) return { text: `Prioriza ${pending.label.toLowerCase()} · faltan ${fmt(pending.missing)} g`, color: pending.color };
    }
  }

  if (tone === 'ok') return { text: 'Día bien cuadrado con el plan', color: LIMA_DARK };
  if (lastMeal?.time) return { text: `Última: ${lastMeal.type.label.toLowerCase()} · ${formatTime(lastMeal.time)}`, color: lastMeal.color };
  return null;
}

export default function BalanceNutricionalWidget({
  jugadorId,
  selectedDate = new Date(),
  onDateChange,
  consumed = { kcal: 0, pro: 0, cho: 0, fat: 0 },
  target = { kcal: '-', protein: null, cho: null, fat: null },
  meals = [],
}) {
  const router = useRouter();
  const date = new Date(selectedDate);
  const dateKey = startOfDay(date).getTime();

  const [picked, setPicked] = useState(null);
  const [hovered, setHovered] = useState(null);
  // La hora se lee tras montar: el servidor y el navegador no comparten reloj ni zona horaria
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
  }, []);
  useEffect(() => {
    setPicked(null);
    setHovered(null);
  }, [dateKey]);

  const entries = useMemo(() => buildEntries(meals), [meals]);
  const mealsKcal = entries.reduce((sum, e) => sum + e.kcal, 0);
  const consumedKcal = Math.max(toNum(consumed.kcal), mealsKcal);
  const targetKcal = toNum(target.kcal);
  const tone = getTone(consumedKcal, targetKcal);
  const pct = targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0;
  const isEmpty = entries.length === 0 && consumedKcal === 0;
  const isToday = now != null && startOfDay(now).getTime() === dateKey;

  const hasMacroData = MACROS.some((m) => toNum(consumed[m.key]) > 0);
  const hasMacroTargets = MACROS.some((m) => toNum(target[m.targetKey]) > 0);

  const { arcs, targetDeg } = useMemo(() => {
    const parts = entries.filter((e) => e.kcal > 0).map((e) => ({ ...e, pickable: true }));
    // Kcal registradas sin comida asociada (p. ej. calculadas por ingredientes) van en un tramo neutro
    const other = consumedKcal - mealsKcal;
    if (other > 0) parts.push({ id: 'other', kcal: other, color: UNKNOWN_KCAL, pickable: false });
    return buildArcs(parts, targetKcal);
  }, [entries, consumedKcal, mealsKcal, targetKcal]);

  const activeId = hovered ?? picked;
  const activeMeal = entries.find((e) => e.id === activeId) || null;
  const togglePick = (id) => setPicked((cur) => (cur === id ? null : id));

  // La cifra protagonista es lo que aún le queda por comer: es lo que el jugador necesita saber
  let hero = { label: 'Consumidas', value: fmt(consumedKcal), color: BOSQUE };
  if (isEmpty && targetKcal > 0) hero = { label: 'Objetivo del día', value: fmt(targetKcal), color: BOSQUE };
  else if (tone === 'under') hero = { label: 'Te quedan', value: fmt(targetKcal - consumedKcal), color: BOSQUE };
  else if (tone === 'ok') hero = { label: 'Objetivo cumplido', value: fmt(consumedKcal), color: LIMA_DARK };
  else if (tone === 'over') hero = { label: 'Por encima del objetivo', value: `+${fmt(consumedKcal - targetKcal)}`, color: ARCILLA };

  const hint = activeMeal
    ? { text: activeMeal.name, color: activeMeal.color }
    : getHint({ isEmpty, tone, consumed, target, hasMacroData, lastMeal: entries[entries.length - 1] });

  return (
    <WidgetCard
      id="widget-balance-nutricional"
      color="salvia"
      icon="bento_box"
      title="Balance nutricional"
      aside={<DateNav date={date} onDateChange={onDateChange} />}
      footer={`${entries.length} ${entries.length === 1 ? 'comida registrada' : 'comidas registradas'}`}
      footerAction={isEmpty ? 'Registrar comida' : 'Ver diario'}
      onFooterAction={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/diario`)}
    >
      <style>{`
        .nl-bal { display: grid; gap: 14px 16px; grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "ring hero" "line line" "macros macros"; align-items: center; }
        .nl-bal-ring { width: 124px; }
        @media (min-width: 62em) {
          .nl-bal { grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: "ring hero macros" "ring line macros"; gap: 6px 28px; }
          .nl-bal-ring { width: 156px; }
        }
      `}</style>

      <Box className="nl-bal">
        <Box style={{ gridArea: 'ring' }}>
          <EnergyRing
            arcs={arcs}
            targetDeg={targetDeg}
            tone={tone}
            activeId={activeId}
            onPick={togglePick}
            onHover={setHovered}
            animKey={dateKey}
          >
            <RingCenter meal={activeMeal} tone={tone} pct={pct} consumedKcal={consumedKcal} hasTarget={targetKcal > 0} />
          </EnergyRing>
        </Box>

        <Box style={{ gridArea: 'hero', minWidth: 0 }}>
          <Text fz={11} fw={600} c={SALVIA} mb={6}>
            {hero.label}
          </Text>
          <WidgetValue value={hero.value} unit="kcal" color={hero.color} size={34} />
          {targetKcal > 0 && !isEmpty && (
            <Text fz={12} fw={500} c={SALVIA} mt={6} style={tabular}>
              <Text span inherit fw={800} c={BOSQUE}>
                {fmt(consumedKcal)}
              </Text>{' '}
              de {fmt(targetKcal)} kcal
            </Text>
          )}
          {hint && (
            <Group
              gap={6}
              wrap="nowrap"
              align="flex-start"
              mt={10}
              px={9}
              py={5}
              w="fit-content"
              maw="100%"
              style={{ borderRadius: 12, backgroundColor: 'var(--mantine-color-hueso-1)' }}
            >
              {hint.color && <Box mt={4} style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, backgroundColor: hint.color }} />}
              <Text fz={11} fw={600} c={BOSQUE} lh={1.35} lineClamp={2} style={tabular}>
                {hint.text}
              </Text>
            </Group>
          )}
        </Box>

        <Box style={{ gridArea: 'line', minWidth: 0 }}>
          <DayTimeline entries={entries} activeId={activeId} onPick={togglePick} onHover={setHovered} now={isToday ? now : null} />
        </Box>

        {hasMacroTargets && (
          <Box style={{ gridArea: 'macros', minWidth: 0 }}>
            <MacroPanel consumed={consumed} target={target} hasMacroData={hasMacroData} />
          </Box>
        )}
      </Box>
    </WidgetCard>
  );
}
