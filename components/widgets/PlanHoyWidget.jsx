'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Group, Text, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronDown, IconPlus } from '@tabler/icons-react';
import Icon3D from '@/components/Icon3D';
import MealEditorModal from '@/components/modals/MealEditorModal';
import { ParticleBurst } from '@/components/motion/Celebration';
import WidgetCard, { WidgetAside } from './WidgetCard';
import { sanitizePlanData } from '@/lib/engine';
import { calculateMealBudgets } from '@/lib/engine/day-balance';
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
    protein: item.macros?.p ?? null,
    carbs: item.macros?.hc ?? null,
    fat: item.macros?.g ?? null,
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

// Baldosa de cada toma sobre la línea del día: el icono de la toma y su estado (lima con check si está
// registrada, borde bosque que late si toca ahora, apagada con punto arcilla si pasó sin registrar)
function MealThumb({ slot, status, open }) {
  const logged = status === 'logged';
  const now = status === 'now';
  const bg = logged ? 'var(--nutra-lima-glow, rgba(193, 240, 128, 0.22))' : now || open ? 'white' : 'var(--mantine-color-hueso-1)';
  const ring = logged ? LIMA : now ? BOSQUE : open ? 'rgba(108, 112, 90, 0.35)' : 'transparent';
  return (
    <Box pos="relative" w={48} h={48} style={{ flexShrink: 0 }}>
      {now && (
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, borderRadius: 16, background: LIMA, pointerEvents: 'none' }}
        />
      )}
      <Box
        style={{
          position: 'relative',
          width: 48,
          height: 48,
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          backgroundColor: bg,
          boxShadow: `0 0 0 2px ${ring}${now || open ? ', 0 6px 14px -8px rgba(31, 42, 36, 0.45)' : ''}`,
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <Box style={{ display: 'grid', filter: status === 'missed' ? 'grayscale(0.9)' : 'none', opacity: status === 'missed' ? 0.6 : 1 }}>
          <Icon3D name={slot.icon} size={28} force3d />
        </Box>
      </Box>
      {logged && (
        <Box
          aria-hidden
          style={{ position: 'absolute', right: -5, bottom: -5, width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: LIMA, border: '2px solid white' }}
        >
          <IconCheck size={11} stroke={3.4} color={BOSQUE} />
        </Box>
      )}
      {status === 'missed' && (
        <Box
          aria-hidden
          style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', backgroundColor: ARCILLA, border: '2px solid white' }}
        />
      )}
    </Box>
  );
}

// Cabecera del detalle: kcal de la toma, sus macros y el reparto de energía entre ellos
const KCAL_PER_G = { p: 4, hc: 4, g: 9 };

function MealSummary({ macros }) {
  if (!macros) return null;
  const parts = MACROS.map((m) => ({ ...m, kcal: (Number(macros[m.key]) || 0) * KCAL_PER_G[m.key] }));
  const total = parts.reduce((sum, m) => sum + m.kcal, 0);
  return (
    <Box p={12} style={{ borderRadius: 14, backgroundColor: 'white' }}>
      <Group justify="space-between" align="flex-end" wrap="nowrap" gap="xs">
        <Text fz={26} fw={800} c={BOSQUE} lh={1} lts={-0.6} style={{ ...tabular, whiteSpace: 'nowrap' }}>
          {formatInt(macros.kcal)}
          <Text span fz={12} fw={700} c={SALVIA} ml={4} lts={0}>kcal</Text>
        </Text>
        <Group gap={10} wrap="nowrap">
          {MACROS.map((m) => (
            <Box key={m.key} ta="right">
              <Text fz={14} fw={800} c={BOSQUE} lh={1} style={tabular}>
                {formatInt(macros[m.key])}
                <Text span fz={10} fw={600} c={SALVIA} ml={1}>g</Text>
              </Text>
              <Group gap={4} justify="flex-end" wrap="nowrap" mt={4}>
                <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: m.color }} />
                <Text fz={10} fw={600} c={SALVIA}>{m.label}</Text>
              </Group>
            </Box>
          ))}
        </Group>
      </Group>
      {total > 0 && (
        <Box mt={10} style={{ display: 'flex', gap: 3, height: 6 }}>
          {parts.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: m.kcal / total }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.06 }}
              style={{ flexBasis: 0, borderRadius: 3, backgroundColor: m.color }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function PlanHoyWidget({
  jugador,
  plan: latestPlan = null,
  selectedDate = new Date(),
  loggedMeals = [],
  canLog = false,
  onMealLogged,
}) {
  const router = useRouter();
  // Toma abierta en la agenda: null = la que toca; -1 = ninguna
  const [pickedIdx, setPickedIdx] = useState(null);
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

  // Por defecto se abre la que toca ahora (o la primera si no es hoy)
  const defaultIdx = currentIdx === -1 ? 0 : Math.min(currentIdx, items.length - 1);
  const openIdx = pickedIdx ?? defaultIdx;
  const toggle = (idx) => setPickedIdx(idx === openIdx ? -1 : idx);
  const loggedCount = items.filter((i) => i.log).length;

  return (
    <WidgetCard
      id="widget-plan-hoy"
      color="salvia"
      icon="tear_off_calendar"
      title={title}
      // El tipo de día, las kcal y los macros del día ya están en la cabecera del perfil
      aside={hasPlan ? <WidgetAside color={loggedCount === items.length ? 'lima' : 'salvia'} dot>{loggedCount}/{items.length} registradas</WidgetAside> : null}
      footer={hasPlan ? null : 'Supervisado por nutrición'}
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
        // Agenda del día: todas las tomas a la vista, unidas por una línea; la que toca se abre con su detalle
        <Box>
          {items.map((item, idx) => {
            const status = statusOf(item, idx);
            const open = idx === openIdx;
            const isLast = idx === items.length - 1;
            const passed = status === 'logged' || (currentIdx !== -1 && idx < currentIdx);
            return (
              <Box key={`${item.nombre}-${idx}`} style={{ display: 'flex', gap: 12 }}>
                {/* Raíl: nodo de la toma y tramo de línea hasta la siguiente */}
                <Box w={48} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <MealThumb slot={item.slot} status={status} open={open} />
                  {!isLast && (
                    <Box
                      my={4}
                      style={{
                        flex: 1,
                        minHeight: 12,
                        width: 2,
                        borderRadius: 1,
                        backgroundColor: passed ? 'var(--mantine-color-lima-5)' : 'var(--mantine-color-hueso-3)',
                      }}
                    />
                  )}
                </Box>

                <Box style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 10 }}>
                  <UnstyledButton
                    onClick={() => toggle(idx)}
                    w="100%"
                    mih={48}
                    aria-expanded={open}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Group justify="space-between" wrap="nowrap" gap="xs" w="100%">
                      <Box style={{ minWidth: 0 }}>
                        <Text fz={15} fw={700} c={status === 'missed' ? SALVIA : BOSQUE} lh={1.2} truncate>
                          {item.nombre}
                        </Text>
                        <Text fz={12} fw={500} c={SALVIA} mt={2} style={tabular} truncate>
                          {[item.slot.time, item.macros?.kcal ? `${formatInt(item.macros.kcal)} kcal` : null].filter(Boolean).join(' · ') || 'Según el plan'}
                        </Text>
                      </Box>
                      <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                        {status === 'logged' ? (
                          <Text fz={12} fw={700} c={LIMA_DARK} style={tabular}>
                            ✓ {formatTime(item.log.takenAt)}
                          </Text>
                        ) : (
                          <StatusChip status={status === 'later' ? null : status} />
                        )}
                        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', color: SALVIA }}>
                          <IconChevronDown size={16} stroke={2.2} />
                        </motion.span>
                      </Group>
                    </Group>
                  </UnstyledButton>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <Box mt={8} p={8} pb={12} pos="relative" style={{ borderRadius: 20, backgroundColor: 'var(--mantine-color-hueso-1)' }}>
                          <ParticleBurst burstKey={burst} top={20} left={40} />
                          <MealSummary macros={item.macros} />
                          <Box px={4}>
                            <FoodList foods={item.foods} onMore={goToPlan} />
                          </Box>

                          {item.log ? (
                            <Group gap={6} wrap="nowrap" mt={10} px={4}>
                              <Box style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', backgroundColor: LIMA }}>
                                <IconCheck size={11} stroke={3.4} color={BOSQUE} />
                              </Box>
                              <Text fz={12} fw={600} c={BOSQUE} truncate style={tabular}>
                                Registrada a las {formatTime(item.log.takenAt)}
                                {Number(item.log.calories) > 0 ? ` · ${formatInt(item.log.calories)} kcal en el diario` : ''}
                              </Text>
                            </Group>
                          ) : canLog ? (
                            <motion.div whileTap={{ scale: 0.97 }} style={{ marginTop: 12, paddingInline: 4 }}>
                              <Button
                                fullWidth
                                radius="xl"
                                color="lima"
                                c={BOSQUE}
                                leftSection={<IconPlus size={16} stroke={2.6} />}
                                onClick={() => setDraft(draftFromPlan(item, date, isToday))}
                              >
                                Registrar {item.nombre.toLowerCase()}
                              </Button>
                            </motion.div>
                          ) : null}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Box>
            );
          })}
        </Box>
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
