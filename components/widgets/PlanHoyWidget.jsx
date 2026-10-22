'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionIcon, Box, Button, Group, Text, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import Icon3D from '@/components/Icon3D';
import MealEditorModal from '@/components/modals/MealEditorModal';
import { ParticleBurst } from '@/components/motion/Celebration';
import WidgetCard, { WidgetAside } from './WidgetCard';
import { sanitizePlanData } from '@/lib/engine';
import { calculateMealBudgets } from '@/lib/engine/day-balance';
import { getDayTypeLabel } from '@/config/nutrition-days';
import { formatInteger as formatInt } from '@/lib/utils';
import { toDateKey } from '@/lib/dates';

const BOSQUE = 'var(--nutra-bosque, #1F2A24)';
const SALVIA = 'var(--nutra-salvia, #6C705A)';
const ARCILLA = 'var(--nutra-arcilla, #B8674A)';
const LIMA = 'var(--nutra-lima, #C1F080)';
const LIMA_DARK = 'var(--nutra-lima-dark, #4a6813)';
const HAIRLINE = 'var(--mantine-color-hueso-3)';

// Mismos colores de macros que el Balance nutricional
const MACROS = [
  { key: 'p', label: 'P', color: 'var(--mantine-color-bosque-6)' },
  { key: 'hc', label: 'HC', color: 'var(--mantine-color-lima-6)' },
  { key: 'g', label: 'G', color: 'var(--mantine-color-hueso-7)' },
];

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Icono, hora aproximada de fin y tipo del diario de cada ingesta: sirve para saber cuál toca ahora
// y para cruzarla con lo registrado. `time` es la hora por defecto al registrarla otro día.
const MEAL_SLOTS = [
  { match: 'desayuno', icon: 'coffee', until: 10.5, type: 'breakfast', time: '08:30' },
  { match: 'almuerzo', icon: 'sandwich', until: 12.5, type: 'midMorning', time: '11:30' },
  { match: 'media manana', icon: 'sandwich', until: 12.5, type: 'midMorning', time: '11:30' },
  { match: 'comida', icon: 'plate', until: 15.5, type: 'lunch', time: '14:00' },
  { match: 'merienda', icon: 'apple', until: 19, type: 'snack', time: '17:30' },
  { match: 're-cena', icon: 'moon', until: null, type: 'lateSnack', time: '23:00' },
  { match: 'cena', icon: 'bowl', until: 23.5, type: 'dinner', time: '21:00' },
  { match: 'post', icon: 'bottle', until: null },
  { match: 'pre', icon: 'bolt', until: null },
];

const STATUS = {
  logged: { label: 'Registrada', color: LIMA_DARK, bg: 'var(--nutra-lima-glow, rgba(193, 240, 128, 0.22))' },
  now: { label: 'Ahora toca', color: BOSQUE, bg: LIMA },
  missed: { label: 'Sin registrar', color: ARCILLA, bg: 'var(--nutra-arcilla-soft, rgba(184, 103, 74, 0.12))' },
  later: { label: 'Más tarde', color: SALVIA, bg: 'rgba(108, 112, 90, 0.12)' },
};

const MAX_FOODS = 5;
const tabular = { fontVariantNumeric: 'tabular-nums' };
const disabledArrow = { backgroundColor: 'transparent', opacity: 0.3 };

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const formatTime = (d) => new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function getMealSlot(name) {
  const n = normalize(name);
  return MEAL_SLOTS.find((slot) => n.includes(slot.match)) || { icon: 'fork_and_knife', until: null };
}

function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

// El detalle del plan es texto ("Arroz basmati 120g, Pechuga de pollo 180g" o "80 g de avena con leche, 1 plátano"):
// se trocea en alimentos y se separa la cantidad para poder alinearla a la derecha.
const UNIT = '(?:g|gr|ml|kg|l|cl|uds?\\.?|unidad(?:es)?|piezas?|rebanadas?|cucharadas?|cucharaditas?|vasos?|lonchas?)';
const TRAILING_QTY = new RegExp(`^(.+?)\\s+(\\d+(?:[.,]\\d+)?\\s?${UNIT})$`, 'i');
const LEADING_QTY = new RegExp(`^(\\d+(?:[.,]\\d+)?\\s?${UNIT})\\s+(?:de\\s+)?(.+)$`, 'i');
const INNER_QTY = /\s*\((\d+(?:[.,]\d+)?\s?(?:g|ml|kg|l))\)\s*/i;

function parseFoods(text) {
  return String(text || '')
    .split(/\s*[;\n]\s*|,\s+|\.\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((raw) => {
      let m = raw.match(TRAILING_QTY);
      if (m) return { name: m[1], qty: m[2] };
      m = raw.match(LEADING_QTY);
      if (m) return { name: m[2], qty: m[1] };
      m = raw.match(INNER_QTY);
      if (m) return { name: raw.replace(INNER_QTY, ' ').trim(), qty: m[1] };
      return { name: raw, qty: null };
    })
    .map(({ name, qty }) => ({ name: capitalize(name), qty: qty ? qty.replace(/(\d)\s?([a-z])/i, '$1 $2') : null }));
}

// Macros de la toma: lo calculado por el generador, si no su objetivo y, si el plan no trae ninguno, el reparto del día
function mealMacros(meal, budget) {
  const src = meal.macrosReales || meal.objetivo;
  if (src) return { kcal: src.kcal, p: src.proteina, hc: src.hidratos, g: src.grasa };
  return budget || null;
}

// Hora con la que se precarga el registro: ahora si la toma aún no ha pasado, si no su hora habitual
function draftTakenAt(date, slot, isToday) {
  const [h, m] = (slot.time || '13:00').split(':').map(Number);
  const draft = new Date(date);
  draft.setHours(h, m, 0, 0);
  if (isToday && (!slot.time || draft > new Date())) return new Date();
  return draft;
}

// Registro precargado con lo que dice el plan: el jugador solo confirma o corrige
function draftFromPlan(item, date, isToday) {
  return {
    takenAt: draftTakenAt(date, item.slot, isToday),
    mealType: item.slot.type || '',
    dishName: `${item.nombre} del plan`,
    calories: item.macros?.kcal ?? null,
    ingredients: item.foods.map((f) => {
      if (!f.qty) return f.name;
      return /\bg$/i.test(f.qty) ? `${f.name} (${f.qty.replace(/\s/g, '')})` : `${f.name} ${f.qty}`;
    }),
  };
}

function StatusChip({ status }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <Text
      fz={9}
      fw={800}
      tt="uppercase"
      lts={0.5}
      px={7}
      py={2}
      style={{ borderRadius: 10, color: s.color, backgroundColor: s.bg, whiteSpace: 'nowrap', flexShrink: 0 }}
    >
      {s.label}
    </Text>
  );
}

function MacroLine({ macros }) {
  return (
    <Group gap={10} mt={5} wrap="wrap" style={{ rowGap: 2 }}>
      <Text fz={12} fw={800} c={BOSQUE} style={{ ...tabular, whiteSpace: 'nowrap' }}>
        {formatInt(macros.kcal)}
        <Text span fz={10} fw={600} c={SALVIA} ml={2}>
          kcal
        </Text>
      </Text>
      {MACROS.map((m) => (
        <Group key={m.key} gap={4} wrap="nowrap">
          <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: m.color }} />
          <Text fz={11} fw={600} c={SALVIA} style={{ ...tabular, whiteSpace: 'nowrap' }}>
            {m.label}{' '}
            <Text span inherit fw={800} c={BOSQUE}>
              {formatInt(macros[m.key])}
            </Text>
          </Text>
        </Group>
      ))}
    </Group>
  );
}

function FoodList({ foods, onMore }) {
  if (foods.length === 0) {
    return (
      <Text fz="xs" c={SALVIA} mt={12}>
        Sin detalle en el plan
      </Text>
    );
  }
  const shown = foods.slice(0, MAX_FOODS);
  const hidden = foods.length - shown.length;

  return (
    <>
      <Box className="nl-plan-foods" mt={10}>
        {shown.map((f, i) => (
          <Group key={`${f.name}-${i}`} justify="space-between" wrap="nowrap" gap={10} py={6} style={{ borderTop: `1px solid ${HAIRLINE}` }}>
            <Text fz={13} fw={600} c={BOSQUE} lh={1.3} style={{ minWidth: 0 }}>
              {f.name}
            </Text>
            {f.qty && (
              <Text fz={12} fw={700} c={SALVIA} style={{ ...tabular, whiteSpace: 'nowrap' }}>
                {f.qty}
              </Text>
            )}
          </Group>
        ))}
      </Box>
      {hidden > 0 && (
        <UnstyledButton onClick={onMore} mt={2}>
          <Text fz={11} fw={700} c={SALVIA}>
            +{hidden} más en el plan
          </Text>
        </UnstyledButton>
      )}
    </>
  );
}

const slide = {
  enter: (dir) => ({ x: dir * 28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir * -28, opacity: 0 }),
};

export default function PlanHoyWidget({
  jugador,
  plan: latestPlan = null,
  selectedDate = new Date(),
  loggedMeals = [],
  canLog = false,
  onMealLogged,
}) {
  const router = useRouter();
  const [pickedIdx, setPickedIdx] = useState(null);
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState(null);
  const [burst, setBurst] = useState(0);
  // La hora actual se lee tras montar: el servidor y el navegador no comparten reloj ni zona horaria
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  // Al cambiar de día se vuelve a la ingesta que toca
  const dateKey = toDateKey(selectedDate);
  useEffect(() => {
    setPickedIdx(null);
  }, [dateKey]);

  const teamConfig = jugador?.equipos?.configuracion_nutricional;
  const plan = useMemo(() => sanitizePlanData(latestPlan?.datos, teamConfig), [latestPlan, teamConfig]);

  const date = new Date(selectedDate);
  const day = plan?.dias?.[DAY_KEYS[date.getDay()]] || null;
  const isToday = isSameDay(date, new Date());
  const meals = useMemo(() => (day?.ingestas || []).filter((m) => m?.nombre), [day]);

  // Ingestas con su tipo, macros, alimentos y el registro del diario que le corresponde (cada registro cuenta una vez)
  const repartoIngestas = jugador?.reparto_ingestas;
  const items = useMemo(() => {
    let budgets = [];
    try {
      budgets = calculateMealBudgets(day, { mealDistribution: repartoIngestas });
    } catch {
      // Plan sin kcal o macros del día: la toma se muestra sin cifras
    }
    const pendingLogs = [...loggedMeals];
    return meals.map((meal) => {
      const slot = getMealSlot(meal.nombre);
      const budget = budgets.find((b) => b.nombre === meal.nombre)?.target;
      const logIdx = slot.type ? pendingLogs.findIndex((l) => l.mealType === slot.type) : -1;
      const log = logIdx === -1 ? null : pendingLogs.splice(logIdx, 1)[0];
      return { ...meal, slot, macros: mealMacros(meal, budget), foods: parseFoods(meal.detalle), log };
    });
  }, [meals, day, repartoIngestas, loggedMeals]);

  // Ingesta que toca ahora: -1 si no es hoy; meals.length si ya han pasado todas
  const currentIdx = useMemo(() => {
    if (!now || !isToday || items.length === 0) return -1;
    const hour = now.getHours() + now.getMinutes() / 60;
    const idx = items.findIndex((m) => m.slot.until != null && hour < m.slot.until);
    return idx === -1 ? items.length : idx;
  }, [items, isToday, now]);

  const statusOf = (item, idx) => {
    if (item.log) return 'logged';
    if (isToday) {
      if (currentIdx === -1) return null;
      if (idx === currentIdx) return 'now';
      if (idx > currentIdx) return 'later';
    }
    // Una toma pasada sin registrar solo se señala si se puede cruzar con el diario
    return item.slot.type ? 'missed' : null;
  };

  const goToPlan = () => router.push(`/dashboard/jugador/${jugador.id}/nutricion/plan`);
  const hasPlan = Boolean(day && items.length > 0);
  const title = isToday ? 'Plan de hoy' : `Plan del ${date.toLocaleDateString('es-ES', { weekday: 'long' })}`;

  const defaultIdx = currentIdx === -1 ? 0 : Math.min(currentIdx, items.length - 1);
  const activeIdx = Math.min(pickedIdx ?? defaultIdx, Math.max(0, items.length - 1));
  const active = items[activeIdx];
  const activeStatus = active ? statusOf(active, activeIdx) : null;

  const pick = (idx) => {
    if (idx < 0 || idx >= items.length || idx === activeIdx) return;
    setDir(idx > activeIdx ? 1 : -1);
    setPickedIdx(idx);
  };

  return (
    <WidgetCard
      id="widget-plan-hoy"
      color="salvia"
      icon="tear_off_calendar"
      title={title}
      aside={
        hasPlan ? (
          <WidgetAside color="salvia" dot>
            {getDayTypeLabel(day.tipoDia)}
          </WidgetAside>
        ) : null
      }
      footer={
        hasPlan
          ? `${formatInt(day.kcal)} kcal · P ${formatInt(day.proteina)} · HC ${formatInt(day.hidratos)} · G ${formatInt(day.grasa)}`
          : 'Supervisado por nutrición'
      }
      footerAction={hasPlan ? 'Plan completo' : null}
      onFooterAction={hasPlan ? goToPlan : undefined}
    >
      <style>{`
        @media (min-width: 62em) {
          .nl-plan-foods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 28px; }
        }
      `}</style>

      {!hasPlan ? (
        <Box p="md" ta="center" style={{ borderRadius: 18, backgroundColor: 'var(--mantine-color-hueso-1)' }}>
          <Box mx="auto" mb={6} w="fit-content">
            <Icon3D name="calendar" size={32} />
          </Box>
          <Text fz="xs" fw={700} c={BOSQUE}>Sin planificación nutricional</Text>
          <Text fz="xs" c={SALVIA} mt={2}>Aún no se ha publicado ningún plan para este jugador</Text>
        </Box>
      ) : (
        <>
          {/* Ingesta destacada: se cambia deslizando o con las flechas */}
          <Box style={{ position: 'relative', borderRadius: 18, backgroundColor: 'var(--mantine-color-hueso-1)', overflow: 'hidden' }}>
            <ParticleBurst burstKey={burst} top={40} left={40} />
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={activeIdx}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                drag={items.length > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragSnapToOrigin
                onDragEnd={(e, info) => {
                  if (info.offset.x < -48) pick(activeIdx + 1);
                  else if (info.offset.x > 48) pick(activeIdx - 1);
                }}
                style={{ padding: 14, touchAction: 'pan-y' }}
              >
                <Group gap={12} align="flex-start" wrap="nowrap">
                  <Box
                    style={{
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      borderRadius: 16,
                      display: 'grid',
                      placeItems: 'center',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px rgba(21, 21, 19, 0.06)',
                    }}
                  >
                    <Icon3D name={active.slot.icon} size={34} />
                  </Box>
                  <Box style={{ minWidth: 0, flex: 1 }}>
                    <Group gap={8} align="center" wrap="nowrap">
                      <Text fz={17} fw={800} c={BOSQUE} lh={1.2} truncate>
                        {active.nombre}
                      </Text>
                      <StatusChip status={activeStatus} />
                    </Group>
                    {active.macros && <MacroLine macros={active.macros} />}
                  </Box>
                </Group>

                <FoodList foods={active.foods} onMore={goToPlan} />

                <Group justify="space-between" align="center" wrap="nowrap" mt={10} gap="xs">
                  {active.log ? (
                    <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Box style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', backgroundColor: LIMA }}>
                        <IconCheck size={11} stroke={3.4} color={BOSQUE} />
                      </Box>
                      <Text fz={12} fw={600} c={BOSQUE} truncate style={tabular}>
                        {formatTime(active.log.takenAt)}
                        {Number(active.log.calories) > 0 ? ` · ${formatInt(active.log.calories)} kcal en el diario` : ''}
                      </Text>
                    </Group>
                  ) : canLog ? (
                    <Button
                      size="compact-sm"
                      color="lima"
                      leftSection={<IconPlus size={14} stroke={2.6} />}
                      onClick={() => setDraft(draftFromPlan(active, date, isToday))}
                    >
                      Registrar
                    </Button>
                  ) : (
                    <span />
                  )}

                  {items.length > 1 && (
                    <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
                      <ActionIcon variant="subtle" color="salvia" size={28} disabled={activeIdx === 0} onClick={() => pick(activeIdx - 1)} aria-label="Ingesta anterior" style={activeIdx === 0 ? disabledArrow : undefined}>
                        <IconChevronLeft size={16} stroke={2.4} />
                      </ActionIcon>
                      <Text fz={11} fw={700} c={SALVIA} style={tabular}>
                        {activeIdx + 1}/{items.length}
                      </Text>
                      <ActionIcon variant="subtle" color="salvia" size={28} disabled={activeIdx === items.length - 1} onClick={() => pick(activeIdx + 1)} aria-label="Ingesta siguiente" style={activeIdx === items.length - 1 ? disabledArrow : undefined}>
                        <IconChevronRight size={16} stroke={2.4} />
                      </ActionIcon>
                    </Group>
                  )}
                </Group>
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Recorrido del día: la línea avanza con la hora y cada toma marca si está en el diario */}
          <Box mt="sm" pt={4} style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
            <Box style={{ position: 'relative', display: 'flex', minWidth: items.length * 58 }}>
              <Box
                style={{
                  position: 'absolute',
                  top: 16,
                  left: `calc(100% / ${items.length * 2})`,
                  right: `calc(100% / ${items.length * 2})`,
                  height: 2,
                  backgroundColor: HAIRLINE,
                }}
              />
              {currentIdx > 0 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: `calc(100% / ${items.length * 2})`,
                    width: `${(Math.min(currentIdx, items.length - 1) / items.length) * 100}%`,
                    height: 2,
                    transformOrigin: 'left',
                    backgroundColor: 'var(--mantine-color-salvia-3)',
                  }}
                />
              )}
              {items.map((item, idx) => {
                const isActive = idx === activeIdx;
                const status = statusOf(item, idx);
                const isLogged = status === 'logged';
                return (
                  <UnstyledButton
                    key={`${item.nombre}-${idx}`}
                    onClick={() => pick(idx)}
                    aria-label={`Ver ${item.nombre}${STATUS[status] ? `, ${STATUS[status].label.toLowerCase()}` : ''}`}
                    aria-pressed={isActive}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}
                  >
                    {/* La toma que toca ahora late suavemente */}
                    {status === 'now' && (
                      <motion.span
                        aria-hidden
                        animate={{ scale: [1, 1.55], opacity: [0.55, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                        style={{ position: 'absolute', top: 0, width: 34, height: 34, borderRadius: '50%', background: LIMA, pointerEvents: 'none' }}
                      />
                    )}
                    <Box
                      style={{
                        position: 'relative',
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isLogged ? LIMA : 'white',
                        border: `2px solid ${isActive ? BOSQUE : isLogged ? LIMA_DARK : 'rgba(108, 112, 90, 0.2)'}`,
                        boxShadow: isActive ? '0 0 0 3px var(--nutra-lima-glow)' : 'none',
                        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {isLogged ? (
                        <IconCheck size={16} stroke={3} color={BOSQUE} />
                      ) : (
                        <Box style={{ opacity: status === 'missed' ? 0.55 : 1, display: 'grid' }}>
                          <Icon3D name={item.slot.icon} size={18} />
                        </Box>
                      )}
                      {status === 'missed' && (
                        <Box
                          aria-hidden
                          style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', backgroundColor: ARCILLA, border: '2px solid white' }}
                        />
                      )}
                    </Box>
                    <Text fz={10} fw={isActive ? 700 : 500} c={isActive ? BOSQUE : SALVIA} ta="center" lh={1.1} truncate maw="100%">
                      {item.nombre}
                    </Text>
                    <Text fz={9} fw={600} c={isLogged ? LIMA_DARK : 'transparent'} lh={1} style={tabular} aria-hidden={!isLogged}>
                      {isLogged ? formatTime(item.log.takenAt) : '·'}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Box>
          </Box>
        </>
      )}

      <MealEditorModal
        opened={Boolean(draft)}
        onClose={() => setDraft(null)}
        jugadorId={jugador?.id}
        meal={draft}
        onSuccess={() => {
          setDraft(null);
          setBurst(Date.now());
          onMealLogged?.();
        }}
        onCancel={() => setDraft(null)}
      />
    </WidgetCard>
  );
}
