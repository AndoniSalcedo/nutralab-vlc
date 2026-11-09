'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ActionIcon, Box, Button, Group, Menu, Popover, SimpleGrid, Text, UnstyledButton, useMatches } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import Icon3D from '@/components/Icon3D';
import AnimatedNumber from '@/components/motion/AnimatedNumber';
import { formatInteger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Paleta sobre la foto (fondo oscuro)
// ---------------------------------------------------------------------------
const WHITE = '#FFFFFF';
const MUTED = 'rgba(248, 247, 244, 0.68)';
const FAINT = 'rgba(248, 247, 244, 0.45)';
const LIMA = 'var(--nutra-lima, #C1F080)';
const ARCILLA = '#E08B6B';
const TRACK = 'rgba(255, 255, 255, 0.16)';
const GLASS = {
  backgroundColor: 'rgba(255, 255, 255, 0.12)',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
};

// ---------------------------------------------------------------------------
// Foto y icono según el tipo de día. Cada equipo puede crear los suyos, así que se busca por palabras
// clave en la clave y en el nombre (sin acentos), en orden de prioridad: «Entreno Hyrox (carrera…)» cae en
// carrera y «Competición Hyrox» en partido. Cada tema tiene varias fotos y cada día rota la que sale.
// Fotos en /public/assets/perfil (origen y licencias en CREDITOS.md). Encuadre: [móvil, escritorio].
// ---------------------------------------------------------------------------
const P = (name, mobile = 'center', desktop = 'center') => ({ name, mobile, desktop });

const PHOTOS = {
  partido: [P('partido-1'), P('partido-2', 'center 60%', 'center 60%'), P('partido-3', 'center 40%', 'center 45%'), P('partido-4', '35% 60%', 'center 60%'), P('partido-5')],
  entreno: [P('entreno-1'), P('entreno-2', '65% 60%', 'center 60%'), P('entreno-3'), P('entreno-4', 'center 60%', 'center 60%'), P('entreno-5', 'center 60%', 'center 60%')],
  doble: [P('doble-1', 'center 35%', 'center 40%'), P('doble-2', '30% 60%', 'center 62%'), P('doble-3')],
  carrera: [P('carrera-1'), P('carrera-2'), P('carrera-3', '40% 60%', 'center 60%'), P('carrera-4')],
  velocidad: [P('velocidad-1', 'center 60%', 'center 60%'), P('velocidad-2', '60% center', 'center')],
  fuerza: [P('fuerza-1', '30% 70%', 'center 68%'), P('fuerza-2'), P('fuerza-3'), P('fuerza-4', 'center 60%', 'center 60%'), P('fuerza-5')],
  recuperacion: [P('recuperacion-1', '70% center', 'center'), P('recuperacion-2')],
  descanso: [P('descanso-1'), P('descanso-2', '30% 50%', 'center'), P('descanso-3'), P('descanso-4', 'center 78%', 'center 72%'), P('descanso-5')],
  viaje: [P('viaje-1', '25% 50%', 'center'), P('viaje-2'), P('viaje-3', '40% center', 'center'), P('viaje-4')],
  natacion: [P('natacion-1', 'center 60%', 'center 60%'), P('natacion-2'), P('natacion-3')],
  ciclismo: [P('ciclismo-1'), P('ciclismo-2', 'center 65%', 'center 65%'), P('ciclismo-3', 'center 60%', 'center 60%')],
  montana: [P('montana-1', 'center 60%', 'center 60%')],
};

const DAY_THEMES = [
  { words: ['partido', 'match', 'competici', 'torneo', 'liga', 'copa', 'final', 'amistoso'], photos: PHOTOS.partido, icon: 'stadium' },
  { words: ['viaje', 'travel', 'desplaz', 'vuelo', 'concentraci'], photos: PHOTOS.viaje, icon: 'compass' },
  { words: ['natacion', 'piscina', 'agua', 'swim', 'acuatic'], photos: PHOTOS.natacion, icon: 'droplet' },
  { words: ['ciclismo', 'bici', 'bike', 'spinning', 'rodillo'], photos: PHOTOS.ciclismo, icon: 'running_shoe' },
  { words: ['montana', 'trail', 'sender', 'monte', 'aire libre', 'outdoor'], photos: PHOTOS.montana, icon: 'compass' },
  { words: ['recupera', 'movilidad', 'yoga', 'estira', 'regenera', 'zona 2', 'fisio'], photos: PHOTOS.recuperacion, icon: 'battery' },
  { words: ['descanso', 'libre', 'rest', 'off'], photos: PHOTOS.descanso, icon: 'bed' },
  { words: ['doble', 'hibrid', 'double'], photos: PHOTOS.doble, icon: 'gym' },
  { words: ['test', 'evaluaci', 'control', 'medici', 'valoraci'], photos: PHOTOS.velocidad, icon: 'stopwatch' },
  { words: ['hyrox', 'carrera', 'running', 'cardio', 'engine', 'aerobic', 'resistencia', 'rodaje', 'fondo'], photos: PHOTOS.carrera, icon: 'running_shoe' },
  { words: ['sprint', 'velocidad', 'potencia', 'explosiv', 'pliometr', 'intens', 'alta carga', 'carga alta', 'exigente'], photos: PHOTOS.velocidad, icon: 'bolt' },
  { words: ['fuerza', 'gimnasio', 'gym', 'pesas', 'strength', 'muscula', 'crossfit'], photos: PHOTOS.fuerza, icon: 'gym' },
  { words: ['ligero', 'suave', 'baja carga', 'activacion'], photos: [...PHOTOS.entreno, ...PHOTOS.doble], icon: 'running' },
  { words: ['entreno', 'entrenamiento', 'training', 'sesion', 'tecnic', 'tactic', 'pretemporada'], photos: PHOTOS.entreno, icon: 'running' },
];

// Tipos de día que no encajan con ninguno: fotos de toda la colección deportiva
const FALLBACK_PHOTOS = [...PHOTOS.entreno, ...PHOTOS.doble, ...PHOTOS.carrera, ...PHOTOS.fuerza, ...PHOTOS.partido];

const normalize = (text) => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/_/g, ' ');
const hash = (text) => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

// Tema del tipo de día y la foto que toca ese día (estable durante el día, cambia al siguiente)
function dayTheme(key, label, date = new Date()) {
  const text = normalize(`${key} ${label}`);
  const theme = DAY_THEMES.find((t) => t.words.some((w) => text.includes(w)));
  const photos = theme?.photos || FALLBACK_PHOTOS;
  const dayNumber = Math.floor(new Date(date).getTime() / 86400000);
  const photo = photos[(dayNumber + hash(normalize(key || label))) % photos.length];
  return { icon: theme?.icon || 'soccer', src: `/assets/perfil/${photo.name}.webp`, mobile: photo.mobile, desktop: photo.desktop };
}

const MACROS = [
  { key: 'pro', targetKey: 'protein', label: 'Proteína', color: LIMA },
  { key: 'cho', targetKey: 'cho', label: 'Hidratos', color: '#F3EFE4' },
  { key: 'fat', targetKey: 'fat', label: 'Grasa', color: '#B9BD9F' },
];

// Tomas del diario: las principales en lima y las ligeras en un lima más suave
const MEAL_TYPES = {
  breakfast: { label: 'Desayuno', main: false },
  midMorning: { label: 'Almuerzo', main: false },
  lunch: { label: 'Comida', main: true },
  snack: { label: 'Merienda', main: false },
  dinner: { label: 'Cena', main: true },
  lateSnack: { label: 'Re-cena', main: false },
  extra: { label: 'Snack', main: false },
};
const OTHER_MEAL = { label: 'Toma', main: false };
const MAIN_MEAL = '#C1F080';
const LIGHT_MEAL = '#E5F8C4';
const UNKNOWN_KCAL = 'rgba(255, 255, 255, 0.45)';

const ON_TARGET_LOW = 0.9;
const ON_TARGET_HIGH = 1.1;

// Anillo (viewBox cuadrado)
const RING = 140;
const STROKE = 12;
const R = (RING - STROKE) / 2 - 4;
const C = RING / 2;
const GAP_DEG = 3;

const tabular = { fontVariantNumeric: 'tabular-nums' };
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const fmt = (v) => (toNum(v) > 0 ? formatInteger(v) : '0');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDayLabel(date) {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getTone(consumed, target) {
  if (!target) return 'none';
  const ratio = consumed / target;
  if (ratio > ON_TARGET_HIGH) return 'over';
  if (ratio >= ON_TARGET_LOW) return 'ok';
  return 'under';
}

function buildEntries(meals) {
  return meals
    .map((m, i) => {
      const time = new Date(m.takenAt || m.taken_at);
      const type = MEAL_TYPES[m.mealType || m.meal_type] || OTHER_MEAL;
      return {
        id: String(m.id ?? i),
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

// Un tramo por comida, en orden; lo que pasa del objetivo va en arcilla
function buildArcs(parts, targetKcal) {
  const total = parts.reduce((sum, p) => sum + p.kcal, 0);
  const scale = Math.max(targetKcal, total);
  if (!scale) return [];

  const pieces = [];
  let acc = 0;
  parts.forEach((p) => {
    const from = acc;
    const to = acc + p.kcal;
    acc = to;
    if (targetKcal > 0 && total > targetKcal && to > targetKcal) {
      if (from < targetKcal) pieces.push({ ...p, from, to: targetKcal });
      pieces.push({ ...p, from: Math.max(from, targetKcal), to, color: ARCILLA });
    } else {
      pieces.push({ ...p, from, to });
    }
  });

  const gap = pieces.length > 1 ? GAP_DEG : 0;
  return pieces.map((p, i) => {
    const fromDeg = (p.from / scale) * 360;
    const span = Math.max((p.to / scale) * 360 - fromDeg - gap, 1.5);
    return { ...p, key: `${p.id}-${i}`, d: arcPath(fromDeg + gap / 2, fromDeg + gap / 2 + span) };
  });
}

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------

function GlassPill({ children, ...props }) {
  return (
    <Group gap={0} wrap="nowrap" h={36} style={{ borderRadius: 999, ...GLASS }} {...props}>
      {children}
    </Group>
  );
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
    <GlassPill>
      <ActionIcon variant="transparent" c={WHITE} size={36} radius="xl" onClick={() => shift(-1)} aria-label="Día anterior">
        <IconChevronLeft size={16} stroke={2.4} />
      </ActionIcon>
      <Popover opened={opened} onChange={setOpened} position="bottom-start" withArrow shadow="md" radius="md">
        <Popover.Target>
          <UnstyledButton onClick={() => setOpened((o) => !o)} px={2} aria-label="Elegir fecha">
            <Text fz={13} fw={700} c={WHITE} tt="capitalize" style={{ whiteSpace: 'nowrap' }}>
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
        variant="transparent"
        c={WHITE}
        size={36}
        radius="xl"
        disabled={isToday}
        onClick={() => shift(1)}
        aria-label="Día siguiente"
        style={isToday ? { backgroundColor: 'transparent', opacity: 0.3 } : undefined}
      >
        <IconChevronRight size={16} stroke={2.4} />
      </ActionIcon>
    </GlassPill>
  );
}

function DayTypeMenu({ dayTypes, activeDayType, activeDayLabel, onChange }) {
  const icon = dayTheme(activeDayType, activeDayLabel).icon;
  return (
    <Menu shadow="md" width={210} position="bottom-end" radius="md">
      <Menu.Target>
        <UnstyledButton aria-label="Cambiar tipo de día">
          <GlassPill pl={6} pr={10} gap={6}>
            <Icon3D name={icon} size={22} force3d />
            <Text fz={13} fw={700} c={WHITE} style={{ whiteSpace: 'nowrap' }}>{activeDayLabel || 'Día'}</Text>
            <IconChevronDown size={14} stroke={2.4} color={WHITE} />
          </GlassPill>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Tipo de día</Menu.Label>
        {dayTypes.map((dt) => (
          <Menu.Item
            key={dt.value}
            leftSection={<Icon3D name={dayTheme(dt.value, dt.label).icon} size={18} force3d />}
            rightSection={dt.value === activeDayType ? <IconCheck size={14} /> : null}
            fw={dt.value === activeDayType ? 700 : 500}
            onClick={() => onChange?.(dt.value)}
          >
            {dt.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

function EnergyRing({ arcs, tone, pct, hasTarget, consumedKcal, animKey, size }) {
  const reduce = useReducedMotion();
  return (
    <Box pos="relative" w={size} h={size} style={{ flexShrink: 0 }}>
      <svg viewBox={`0 0 ${RING} ${RING}`} width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
        {tone === 'ok' && (
          <motion.circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={LIMA}
            strokeWidth={STROKE + 12}
            initial={{ opacity: 0 }}
            animate={reduce ? { opacity: 0.35 } : { opacity: [0.15, 0.45, 0.15] }}
            transition={reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <circle cx={C} cy={C} r={R} fill="none" stroke={TRACK} strokeWidth={STROKE} />
        {arcs.map((arc, i) => (
          <motion.path
            key={`${animKey}-${arc.key}`}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(193, 240, 128, 0.35))' }}
          />
        ))}
      </svg>
      <Box style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        {hasTarget ? (
          <Box>
            <Text fz={size > 120 ? 28 : 22} fw={800} c={tone === 'over' ? ARCILLA : WHITE} lh={1} lts={-0.8} style={tabular}>
              <AnimatedNumber value={`${pct}%`} />
            </Text>
            <Text fz={10} fw={600} c={MUTED} mt={4}>del objetivo</Text>
          </Box>
        ) : (
          <Box>
            <Text fz={22} fw={800} c={WHITE} lh={1} style={tabular}><AnimatedNumber value={fmt(consumedKcal)} /></Text>
            <Text fz={10} fw={600} c={MUTED} mt={4}>kcal</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function MacroBars({ consumed, target, hasMacroData }) {
  const goals = MACROS.map((m) => ({ ...m, goal: toNum(target[m.targetKey]), value: toNum(consumed[m.key]) }));
  return (
    <SimpleGrid cols={3} spacing={{ base: 10, sm: 'md' }} p={{ base: 12, sm: 14 }} style={{ borderRadius: 20, ...GLASS }}>
      {goals.map((m, i) => {
        const ratio = m.goal > 0 ? m.value / m.goal : 0;
        const over = ratio > ON_TARGET_HIGH;
        return (
          <Box key={m.key} style={{ minWidth: 0 }}>
            <Group gap={5} wrap="nowrap">
              <Box style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, backgroundColor: m.color }} />
              <Text fz={11} fw={600} c={MUTED} truncate>{m.label}</Text>
            </Group>
            <Text fz={{ base: 15, sm: 17 }} fw={800} c={over ? ARCILLA : WHITE} lh={1} mt={6} style={{ ...tabular, whiteSpace: 'nowrap' }}>
              {hasMacroData ? fmt(m.value) : (m.goal > 0 ? fmt(m.goal) : '—')}
              <Text span fz={10} fw={600} c={FAINT} ml={2}>
                {hasMacroData ? `/ ${m.goal > 0 ? fmt(m.goal) : '—'} g` : 'g'}
              </Text>
            </Text>
            <Box h={5} mt={8} style={{ borderRadius: 3, backgroundColor: TRACK, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(1, hasMacroData ? ratio : 0) * 100}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 + i * 0.1 }}
                style={{ height: '100%', borderRadius: 3, backgroundColor: over ? ARCILLA : m.color }}
              />
            </Box>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * Cabecera del perfil: foto a sangre del tipo de día y, encima, el balance del día
 * (fecha, tipo de día, energía que queda, anillo por comidas y macros).
 */
export default function PerfilHero({
  jugadorId,
  selectedDate = new Date(),
  onDateChange,
  dayTypes = [],
  activeDayType,
  activeDayLabel,
  onDayTypeChange,
  consumed = { kcal: 0, pro: 0, cho: 0, fat: 0 },
  target = { kcal: null, protein: null, cho: null, fat: null },
  meals = [],
  canLog = false,
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const date = new Date(selectedDate);
  const dateKey = startOfDay(date).getTime();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const entries = useMemo(() => buildEntries(meals), [meals]);
  const mealsKcal = entries.reduce((sum, e) => sum + e.kcal, 0);
  const consumedKcal = Math.max(toNum(consumed.kcal), mealsKcal);
  const targetKcal = toNum(target.kcal);
  const tone = getTone(consumedKcal, targetKcal);
  const pct = targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0;
  const isEmpty = entries.length === 0 && consumedKcal === 0;
  const hasMacroData = MACROS.some((m) => toNum(consumed[m.key]) > 0);
  const hasMacroTargets = MACROS.some((m) => toNum(target[m.targetKey]) > 0);

  const arcs = useMemo(() => {
    const parts = entries.filter((e) => e.kcal > 0);
    const other = consumedKcal - mealsKcal;
    if (other > 0) parts.push({ id: 'other', kcal: other, color: UNKNOWN_KCAL });
    return buildArcs(parts, targetKcal);
  }, [entries, consumedKcal, mealsKcal, targetKcal]);

  // La cifra protagonista es lo que aún queda por comer
  let headline = { label: 'Consumidas', value: fmt(consumedKcal), color: WHITE };
  if (isEmpty && targetKcal > 0) headline = { label: 'Objetivo del día', value: fmt(targetKcal), color: WHITE };
  else if (tone === 'under') headline = { label: 'Te quedan', value: fmt(targetKcal - consumedKcal), color: WHITE };
  else if (tone === 'ok') headline = { label: 'Objetivo cumplido', value: fmt(consumedKcal), color: LIMA };
  else if (tone === 'over') headline = { label: 'Por encima del objetivo', value: `+${fmt(consumedKcal - targetKcal)}`, color: ARCILLA };

  const photo = dayTheme(activeDayType, activeDayLabel, selectedDate);
  const isWide = useMatches({ base: false, sm: true });
  const photoPosition = isWide ? photo.desktop : photo.mobile;

  return (
    <Box
      id="widget-balance-nutricional"
      pos="relative"
      style={{
        overflow: 'hidden',
        borderRadius: 28,
        backgroundColor: '#1F2A24',
        boxShadow: '0 24px 48px -28px rgba(16, 24, 19, 0.75)',
      }}
    >
      {/* Foto a sangre: cambia con un fundido al cambiar de tipo de día y se acerca muy despacio */}
      {/* Foto: en móvil es una banda arriba (el sujeto queda a la vista y los datos van debajo, sobre bosque);
          en escritorio ocupa toda la cabecera. Cambia con un fundido y se acerca muy despacio. */}
      <Box pos="absolute" top={0} left={0} right={0} h={{ base: 330, sm: '100%' }} style={{ overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={photo.src}
            aria-hidden
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: reduce ? 1 : 1.04 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.6 }, scale: { duration: 8, ease: 'easeOut' } }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Image src={photo.src} alt="" fill priority sizes="(max-width: 768px) 100vw, 1100px" style={{ objectFit: 'cover', objectPosition: photoPosition }} />
          </motion.div>
        </AnimatePresence>
        {/* Móvil: oscurece un poco arriba (píldoras) y funde abajo en bosque */}
        <Box
          hiddenFrom="sm"
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(14, 20, 16, 0.45) 0%, rgba(14, 20, 16, 0) 28%, rgba(14, 20, 16, 0) 52%, rgba(31, 42, 36, 0.85) 82%, #1F2A24 100%)',
          }}
        />
      </Box>

      {/* Escritorio: deja ver la foto arriba y funde en verde bosque donde va la información */}
      <Box
        visibleFrom="sm"
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(14, 20, 16, 0.5) 0%, rgba(14, 20, 16, 0.05) 26%, rgba(22, 32, 26, 0.5) 50%, rgba(26, 37, 30, 0.92) 72%, #1F2A24 100%)',
        }}
      />
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          left: '-20%',
          bottom: '-30%',
          width: '80%',
          height: '70%',
          background: 'radial-gradient(closest-side, rgba(193, 240, 128, 0.16), rgba(193, 240, 128, 0))',
          pointerEvents: 'none',
        }}
      />

      <Box pos="relative" px={{ base: 'md', sm: 'xl' }} pt={{ base: 'md', sm: 'lg' }} pb={{ base: 'md', sm: 'lg' }}>
        {/* Controles: fecha y tipo de día */}
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <DateNav date={date} onDateChange={onDateChange} />
          <DayTypeMenu dayTypes={dayTypes} activeDayType={activeDayType} activeDayLabel={activeDayLabel} onChange={onDayTypeChange} />
        </Group>

        <Box h={{ base: 200, sm: 120 }} />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'md', md: 'xl' }} style={{ alignItems: 'end' }}>
          {/* Energía del día */}
          <Group justify="space-between" align="flex-end" wrap="nowrap" gap="md">
            <Box style={{ minWidth: 0 }}>
              <Text fz={11} fw={700} tt="uppercase" lts={1} c={LIMA}>
                {headline.label}
              </Text>
              <Text fz={{ base: 46, sm: 56 }} fw={800} c={headline.color} lh={0.95} lts={-2} mt={6} style={{ ...tabular, whiteSpace: 'nowrap', textShadow: '0 2px 18px rgba(0,0,0,0.25)' }}>
                {mounted ? <AnimatedNumber value={headline.value} /> : headline.value}
                <Text span fz={16} fw={700} c={MUTED} lts={0} ml={6}>kcal</Text>
              </Text>
              <Text fz="sm" fw={500} c={MUTED} mt={8} style={tabular}>
                {targetKcal > 0 && !isEmpty
                  ? <><Text span inherit fw={800} c={WHITE}>{fmt(consumedKcal)}</Text> de {fmt(targetKcal)} kcal</>
                  : `${entries.length} ${entries.length === 1 ? 'comida registrada' : 'comidas registradas'}`}
              </Text>
            </Box>
            <EnergyRing arcs={arcs} tone={tone} pct={pct} hasTarget={targetKcal > 0} consumedKcal={consumedKcal} animKey={dateKey} size={104} />
          </Group>

          {/* Macros y acceso al diario */}
          <Box>
            {hasMacroTargets && <MacroBars consumed={consumed} target={target} hasMacroData={hasMacroData} />}
            <Group justify={canLog ? 'stretch' : 'flex-end'} mt="sm" wrap="nowrap" grow={canLog}>
              {canLog ? (
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    fullWidth
                    radius="xl"
                    color="lima"
                    c="#1F2A24"
                    size="md"
                    leftSection={<IconPlus size={18} stroke={2.6} />}
                    onClick={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/diario`)}
                    style={{ boxShadow: '0 10px 24px -12px rgba(193, 240, 128, 0.7)' }}
                  >
                    Registrar comida
                  </Button>
                </motion.div>
              ) : (
                <UnstyledButton onClick={() => router.push(`/dashboard/jugador/${jugadorId}/resumen/diario`)}>
                  <Text fz="xs" fw={700} c={WHITE}>Ver diario →</Text>
                </UnstyledButton>
              )}
            </Group>
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
