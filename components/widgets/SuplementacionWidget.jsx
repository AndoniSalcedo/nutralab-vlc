'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import WidgetCard from './WidgetCard';
import { ParticleBurst } from '@/components/motion/Celebration';
import { notifications } from '@mantine/notifications';
import { getPlayerSupplementation } from '@/actions/supplementActions';
import { getDailyRecord, saveDailyRecord } from '@/actions/dailyRecordActions';

// Los items del widget usan ids `s-<suplemento_id>`; en BD se guarda el suplemento_id
const toChecks = (ids = []) => Object.fromEntries(ids.map((id) => [`s-${id}`, true]));
const toSupplementIds = (checks) => Object.keys(checks)
  .filter((key) => checks[key] && key.startsWith('s-'))
  .map((key) => Number(key.slice(2)));

// Clave antigua del navegador: solo se lee una vez para subir a BD el día en curso
function takeLegacyTodayChecks(jugadorId) {
  const key = `vlc_supp_checklist_${jugadorId}`;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    localStorage.removeItem(key);
    if (parsed?.date === new Date().toDateString() && parsed.checks) return parsed.checks;
  } catch { }
  return {};
}

// Lista diaria real del jugador: catálogo asignado + suplementos extra (con sus ajustes de dosis)
function buildDailyList(data) {
  if (!data) return [];
  const byId = new Map((data.suplementos || []).map((s) => [Number(s.id), s]));
  const extrasBySupp = new Map((data.extras || []).map((e) => [Number(e.suplemento_id), e]));
  const listaId = Number(data.asignacion?.lista_id || 0);
  const used = new Set();
  const toItem = (supp, extra) => ({
    id: `s-${supp.id}`,
    name: supp.nombre,
    dose: extra?.dose_override || supp.dose_text || supp.pauta || '',
  });
  const base = (data.items || [])
    .filter((item) => Number(item.lista_id) === listaId)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
    .map((item) => {
      const supp = byId.get(Number(item.suplemento_id));
      if (!supp) return null;
      used.add(Number(item.suplemento_id));
      return toItem(supp, extrasBySupp.get(Number(item.suplemento_id)));
    })
    .filter(Boolean);
  const extras = (data.extras || [])
    .filter((e) => !used.has(Number(e.suplemento_id)))
    .map((e) => (byId.get(Number(e.suplemento_id)) ? toItem(byId.get(Number(e.suplemento_id)), e) : null))
    .filter(Boolean);
  return [...base, ...extras];
}

export default function SuplementacionWidget({
  jugadorId,
  supplementList,
  readOnly = false,
}) {
  const router = useRouter();
  // Antes mostraba una lista de ejemplo si no se pasaba ninguna: ahora carga la pauta real del jugador
  const [loadedList, setLoadedList] = useState(null);
  const list = useMemo(() => supplementList || loadedList || [], [supplementList, loadedList]);
  const [suppChecks, setSuppChecks] = useState({});
  const [burst, setBurst] = useState(0);
  const prevDone = useRef(false);

  useEffect(() => {
    if (supplementList || !jugadorId) return undefined;
    let cancelled = false;
    getPlayerSupplementation(jugadorId)
      .then((data) => { if (!cancelled) setLoadedList(buildDailyList(data)); })
      .catch(() => { if (!cancelled) setLoadedList([]); });
    return () => { cancelled = true; };
  }, [jugadorId, supplementList]);

  // Guardados en cola: así el último estado marcado es siempre el que queda en BD
  const saveQueue = useRef(Promise.resolve());

  const persist = (checks) => {
    saveQueue.current = saveQueue.current
      .then(() => saveDailyRecord({ jugador_id: jugadorId, suplementos_tomados: toSupplementIds(checks) }))
      .catch(() => {
        notifications.show({ color: 'red', title: 'Suplementos', message: 'No se pudo guardar la toma. Inténtalo de nuevo.' });
      });
  };

  // Tomas de hoy desde BD (antes vivían en localStorage: se suben una vez si hay dato de hoy)
  useEffect(() => {
    if (!jugadorId) return undefined;
    let cancelled = false;
    getDailyRecord(jugadorId)
      .then((data) => {
        if (cancelled) return;
        const legacy = !readOnly && !data?.exists ? takeLegacyTodayChecks(jugadorId) : {};
        if (toSupplementIds(legacy).length) {
          setSuppChecks(legacy);
          persist(legacy);
        } else {
          setSuppChecks(toChecks(data?.suplementos_tomados));
        }
      })
      .catch((e) => console.error('Error cargando suplementos tomados:', e));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jugadorId, readOnly]);

  const handleToggle = (id) => {
    if (readOnly) return;
    const next = { ...suppChecks, [id]: !suppChecks[id] };
    setSuppChecks(next);
    persist(next);
  };

  const completedCount = useMemo(() => {
    return list.filter((s) => Boolean(suppChecks[s.id])).length;
  }, [suppChecks, list]);

  const totalCount = list.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  // Celebración al marcar el último
  useEffect(() => {
    if (isAllDone && !prevDone.current) setBurst(Date.now());
    prevDone.current = isAllDone;
  }, [isAllDone]);

  return (
    <WidgetCard
      id="widget-suplementacion"
      color="salvia"
      icon="suplementacion"
      title="Suplementos diarios"
      footer={totalCount === 0 ? null : isAllDone ? '¡Todo tomado!' : `${completedCount}/${totalCount} tomas`}
      footerAction="Suplementación"
      onFooterAction={() => router.push(`/dashboard/jugador/${jugadorId}/nutricion/suplementacion`)}
    >
      <ParticleBurst burstKey={burst} top="40%" left="50%" />
      {totalCount === 0 && loadedList !== null && (
        <Text fz="xs" c="dimmed" py="sm">Tu nutricionista aún no te ha asignado suplementos diarios.</Text>
      )}
      {/* Lista de tomas interactivas */}
      <Stack gap={6}>
        {list.map((item) => {
          const isChecked = Boolean(suppChecks[item.id]);
          return (
            <UnstyledButton
              key={item.id}
              onClick={() => handleToggle(item.id)}
              disabled={readOnly}
              px={4}
              py={6}
              style={{
                borderRadius: '8px',
                backgroundColor: isChecked ? 'rgba(108, 112, 90, 0.08)' : 'transparent',
                transition: 'background-color 0.15s ease',
                display: 'block',
                width: '100%',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                  <motion.div
                    animate={{ scale: isChecked ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.35 }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '6px',
                      border: `1.5px solid ${
                        isChecked ? 'var(--nutra-lima-dark, #4a6813)' : 'rgba(108, 112, 90, 0.25)'
                      }`,
                      backgroundColor: isChecked ? 'var(--nutra-lima, #C1F080)' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--nutra-bosque, #1F2A24)',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isChecked && (
                      <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }} style={{ display: 'flex' }}>
                        <IconCheck size={13} stroke={3} />
                      </motion.span>
                    )}
                  </motion.div>
                  <Box style={{ minWidth: 0, flex: 1 }}>
                    <Text
                      fz="xs"
                      fw={600}
                      c={isChecked ? 'dimmed' : 'dark.5'}
                      td={isChecked ? 'line-through' : undefined}
                      truncate
                    >
                      {item.name}
                    </Text>
                    <Text fz={11} c="dimmed" truncate>
                      {item.dose}
                    </Text>
                  </Box>
                </Group>

              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>

    </WidgetCard>
  );
}
