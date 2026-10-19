'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Box, Group, Stack, Text, ActionIcon, Button } from '@mantine/core';
import { IconMinus } from '@tabler/icons-react';
import WidgetCard, { WidgetAside, WidgetValue } from './WidgetCard';
import { calculateHydration } from '@/lib/metrics/anthropometry';
import { notifications } from '@mantine/notifications';
import { FloatingLabels, ParticleBurst } from '@/components/motion/Celebration';
import { getDailyRecord, saveDailyRecord } from '@/actions/dailyRecordActions';

// Claves antiguas del navegador: solo se leen una vez para subir a BD el día en curso
function takeLegacyTodayLiters(jugadorId) {
  const storageKey = `nutrilab_water_log_${jugadorId}`;
  const legacyKey = `hydration_${jugadorId}_${new Date().toISOString().split('T')[0]}`;
  let liters = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    const old = JSON.parse(localStorage.getItem(legacyKey) || 'null');
    if (saved?.date === new Date().toDateString()) liters = Number(saved.amount || 0);
    else if (old?.consumed) liters = parseFloat((old.consumed / 1000).toFixed(2));
    localStorage.removeItem(storageKey);
    localStorage.removeItem(legacyKey);
  } catch { }
  return Number.isFinite(liters) ? liters : 0;
}

export default function HydrationWidget({
  jugadorId: propJugadorId,
  jugador,
  pesoActual,
  activeDayType = 'entreno',
  latestHydration,
  formatMetricNumber = (val) => val ?? '-',
  readOnly = false,
}) {
  const router = useRouter();
  const jugadorId = jugador?.id || propJugadorId;
  const [drunk, setDrunk] = useState(0);
  // Feedback al registrar agua: "+250 ml" que sube, gota que cae y celebración al llegar al objetivo
  const [floats, setFloats] = useState([]);
  const [dropKey, setDropKey] = useState(0);
  const [goalBurst, setGoalBurst] = useState(0);
  const floatId = useRef(0);

  // Cálculo fisiológico de agua según peso del jugador y tipo de día activo
  const peso = Number(pesoActual || jugador?.peso_kg || 75);
  const targetMl = useMemo(() => calculateHydration(peso, activeDayType), [peso, activeDayType]);
  const targetL = Number((targetMl / 1000).toFixed(2));

  const percent = targetL > 0 ? Math.min(100, Math.round((drunk / targetL) * 100)) : 0;
  const isGoalReached = percent >= 100;

  const [loaded, setLoaded] = useState(false);
  // Guardados en cola: así el último valor pulsado es siempre el que queda en BD
  const saveQueue = useRef(Promise.resolve());

  const saveWater = (newDrunk) => {
    saveQueue.current = saveQueue.current
      .then(() => saveDailyRecord({ jugador_id: jugadorId, agua_ml: Math.round(newDrunk * 1000) }))
      .catch(() => {
        notifications.show({ color: 'red', title: 'Agua', message: 'No se pudo guardar el agua. Inténtalo de nuevo.' });
      });
  };

  // Cargar el agua de hoy desde BD (antes vivía en localStorage: se sube una vez si hay dato de hoy)
  useEffect(() => {
    if (!jugadorId) return undefined;
    let cancelled = false;
    getDailyRecord(jugadorId)
      .then((data) => {
        if (cancelled) return;
        const legacy = !readOnly && !data?.exists ? takeLegacyTodayLiters(jugadorId) : 0;
        if (legacy > 0) saveWater(legacy);
        setDrunk(legacy > 0 ? legacy : (data?.agua_ml || 0) / 1000);
      })
      .catch((e) => console.error('Error cargando agua consumida:', e))
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jugadorId, readOnly]);

  const handleUpdateWater = (amount) => {
    if (readOnly || !loaded) return;
    const newValue = Math.max(0, parseFloat((drunk + amount).toFixed(2)));
    setDrunk(newValue);
    saveWater(newValue);
    if (amount > 0) {
      const id = ++floatId.current;
      setFloats((list) => [...list, { id, text: `+${Math.round(amount * 1000)} ml` }]);
      setTimeout(() => setFloats((list) => list.filter((f) => f.id !== id)), 1200);
      setDropKey(id);
      const reached = targetL > 0 && newValue >= targetL && drunk < targetL;
      if (reached) setGoalBurst(id);
    }
  };

  // Métrica clínica de osmolaridad
  const value = latestHydration?.valor;
  const numValue = Number(value);

  let statusColor = 'blue.6';
  let statusLabel = 'Óptimo';

  if (Number.isFinite(numValue) && numValue > 0) {
    if (numValue > 900) {
      statusColor = 'arcilla.6';
      statusLabel = 'Alerta';
    } else if (numValue >= 700) {
      statusColor = 'salvia.7';
      statusLabel = 'Límite';
    } else {
      statusColor = 'blue.6';
      statusLabel = 'Óptimo';
    }
  } else if (latestHydration?.estado) {
    statusLabel = latestHydration.estado;
  }

  const goToAnalytics = () => router.push(`/dashboard/jugador/${jugadorId}/metricas/hidratacion`);

  return (
    <WidgetCard
      id="widget-water"
      icon="droplet"
      title="Agua"
      color="blue"
      fillPercent={percent}
      fillColor="blue.0"
      fillWaveColor="blue.1"
      aside={<WidgetAside color={isGoalReached ? 'blue' : 'salvia'}>{percent}%</WidgetAside>}
      style={{ minHeight: 216 }}
    >
      <Stack gap="sm" justify="space-between" h="100%">
        <Box style={{ position: 'relative' }}>
          <FloatingLabels items={floats} style={{ top: 4, left: 110 }} />
          <ParticleBurst burstKey={goalBurst} top={16} left={60} colors={['#7cc6f2', '#C1F080', '#38a0e6']} count={18} />
          <WidgetValue
            value={drunk.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            unit={`/ ${targetL.toFixed(1).replace('.', ',')} L`}
            color={isGoalReached ? 'var(--nutra-lima-dark, #4a6813)' : 'var(--nutra-bosque, #1F2A24)'}
            size={32}
          />
          <Text
            fz="xs"
            c="dimmed"
            mt={6}
            lh={1.35}
            style={{ cursor: 'pointer' }}
            onClick={goToAnalytics}
          >
            Osmolaridad{' '}
            <Text span inherit fw={700} c={statusColor}>
              {value ? `${formatMetricNumber(value, 0)} mOsm` : '—'}
            </Text>{' '}
            · {statusLabel}
          </Text>
        </Box>

        {!readOnly && (
          <Group gap={6} wrap="nowrap">
            <ActionIcon
              size={44}
              variant="default"
              radius="xl"
              disabled={!loaded || drunk <= 0}
              onClick={() => handleUpdateWater(-0.25)}
              aria-label="Restar 250 ml"
            >
              <IconMinus size={18} stroke={2.5} />
            </ActionIcon>
            <Box style={{ flex: 1, position: 'relative' }}>
              {/* Gota que cae desde el botón hacia el vaso */}
              {dropKey > 0 && (
                <motion.span
                  key={dropKey}
                  aria-hidden
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -70, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ position: 'absolute', left: '50%', top: 0, width: 12, height: 15, marginLeft: -6, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: 'var(--mantine-color-blue-4)', pointerEvents: 'none', zIndex: 2 }}
                />
              )}
              <motion.div whileTap={{ scale: 0.94 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }}>
                <Button
                  fullWidth
                  h={44}
                  radius="xl"
                  color="blue"
                  px={6}
                  disabled={!loaded}
                  onClick={() => handleUpdateWater(0.25)}
                  aria-label="Sumar 250 ml"
                >
                  + 250 ml
                </Button>
              </motion.div>
            </Box>
          </Group>
        )}
      </Stack>
    </WidgetCard>
  );
}
