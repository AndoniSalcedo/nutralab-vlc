'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Group, Paper, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Icon3D from '@/components/Icon3D';
import WellnessModal from '@/components/modals/WellnessModal';
import { WELLNESS_ITEMS, WELLNESS_KEYS, wellnessScoreColor as scoreColor } from '@/config/wellness';
import { getWellnessRecords, saveWellnessRecord } from '@/actions/wellnessActions';

// Geometría del hexágono (viewBox cuadrado)
const VIEW = 300;
const CENTER = VIEW / 2;
const RADIUS = 96;
const LABEL_RADIUS = RADIUS + 30;
const RINGS = [2, 3, 4, 5];

function angleFor(i) {
  return (-90 + i * (360 / WELLNESS_ITEMS.length)) * (Math.PI / 180);
}

// centro = 1, exterior = 5
function pointFor(i, value) {
  const r = (Math.max(1, Math.min(5, value)) - 1) / 4 * RADIUS;
  const a = angleFor(i);
  return [CENTER + r * Math.cos(a), CENTER + r * Math.sin(a)];
}

function polygonPoints(values) {
  return values.map((v, i) => pointFor(i, v).map((n) => n.toFixed(1)).join(',')).join(' ');
}

// Media 1-5 → nota global 0-100 (estilo "media" FIFA)
function overallFrom(values) {
  if (!values) return null;
  const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
  return Math.round(((avg - 1) / 4) * 100);
}

function recordValues(record) {
  if (!record) return null;
  const values = WELLNESS_KEYS.map((key) => Number(record[key]));
  return values.every(Number.isFinite) ? values : null;
}

function averageValues(records) {
  if (!records.length) return null;
  return WELLNESS_KEYS.map((key) => {
    const nums = records.map((r) => Number(r[key])).filter(Number.isFinite);
    return nums.length ? nums.reduce((acc, v) => acc + v, 0) / nums.length : 1;
  });
}

function HexagonChart({ today, average }) {
  const outer = polygonPoints(WELLNESS_ITEMS.map(() => 5));

  return (
    <Box
      component="svg"
      viewBox={`-50 0 ${VIEW + 100} ${VIEW}`}
      role="img"
      aria-label="Hexágono de bienestar"
      style={{ width: '100%', maxWidth: 400, display: 'block', margin: '0 auto', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="wellness-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mantine-color-dark-6)" />
          <stop offset="100%" stopColor="var(--mantine-color-dark-8)" />
        </linearGradient>
        <linearGradient id="wellness-today" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--mantine-color-teal-4)" stopOpacity="0.75" />
          <stop offset="100%" stopColor="var(--mantine-color-lime-4)" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Fondo y anillos 2-5 */}
      <polygon points={outer} fill="url(#wellness-bg)" stroke="var(--mantine-color-dark-4)" strokeWidth="1.5" />
      {RINGS.slice(0, -1).map((ring) => (
        <polygon
          key={ring}
          points={polygonPoints(WELLNESS_ITEMS.map(() => ring))}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      ))}

      {/* Ejes */}
      {WELLNESS_ITEMS.map((item, i) => {
        const [x, y] = pointFor(i, 5);
        return <line key={item.key} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
      })}

      {/* Línea media */}
      {average && (
        <polygon
          points={polygonPoints(average)}
          fill="none"
          stroke="var(--mantine-color-gray-3)"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
      )}

      {/* Línea del día */}
      {today && (
        <>
          <polygon
            points={polygonPoints(today)}
            fill="url(#wellness-today)"
            stroke="var(--mantine-color-teal-3)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
          {today.map((v, i) => {
            const [x, y] = pointFor(i, v);
            return <circle key={WELLNESS_ITEMS[i].key} cx={x} cy={y} r="3.5" fill="white" />;
          })}
        </>
      )}

      {/* Etiquetas de vértice: valor del día + nombre */}
      {WELLNESS_ITEMS.map((item, i) => {
        const a = angleFor(i);
        const x = CENTER + LABEL_RADIUS * Math.cos(a);
        const y = CENTER + LABEL_RADIUS * Math.sin(a);
        const anchor = Math.abs(Math.cos(a)) < 0.1 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        const value = today?.[i];
        return (
          <g key={item.key}>
            <text
              x={x}
              y={y - 2}
              textAnchor={anchor}
              fontSize="17"
              fontWeight="800"
              fill={`var(--mantine-color-${scoreColor(value).replace('.', '-')})`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {Number.isFinite(value) ? value : '–'}
            </text>
            <text x={x} y={y + 12} textAnchor={anchor} fontSize="10" fontWeight="700" fill="var(--mantine-color-dark-3)" letterSpacing="0.5">
              {item.short}
            </text>
          </g>
        );
      })}
    </Box>
  );
}

export default function WellnessHexagonWidget({ jugadorId, canEdit = true }) {
  const [records, setRecords] = useState([]);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!jugadorId) return;
    try {
      const res = await getWellnessRecords(jugadorId);
      setRecords(res.records || []);
      setToday(res.today);
    } catch (err) {
      console.error('Error cargando bienestar:', err);
    } finally {
      setLoading(false);
    }
  }, [jugadorId]);

  useEffect(() => { load(); }, [load]);

  const todayRecord = useMemo(
    () => records.find((r) => String(r.fecha).slice(0, 10) === today) || null,
    [records, today]
  );
  const todayValues = recordValues(todayRecord);
  const averageVals = useMemo(
    () => averageValues(records.filter((r) => String(r.fecha).slice(0, 10) < today)),
    [records, today]
  );
  const overall = overallFrom(todayValues);
  const overallAvg = overallFrom(averageVals);
  const delta = overall !== null && overallAvg !== null ? overall - overallAvg : null;

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await saveWellnessRecord({ jugador_id: jugadorId, fecha: today, ...values });
      await load();
      setModalOpen(false);
      notifications.show({ color: 'teal', title: 'Registro guardado', message: 'Tu bienestar de hoy se ha guardado.' });
    } catch (err) {
      notifications.show({ color: 'red', title: 'No se pudo guardar', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper id="widget-bienestar" shadow="sm" radius="lg" p={{ base: 'sm', sm: 'md' }} bg="white">
      {/* Cabecera: título a la izquierda, nota global a la derecha */}
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm" mb="xs">
        <Group gap="xs" align="center" wrap="nowrap">
          <Icon3D name="heart" size={28} />
          <Box>
            <Text fw={700} fz="sm" c="dark.5">Bienestar</Text>
            <Text fz="xs" c="dimmed">Cuestionario diario</Text>
          </Box>
        </Group>

        <Group gap={6} align="center" wrap="nowrap">
          {delta !== null && (
            <Text fz="xs" fw={700} c={delta >= 0 ? 'teal.7' : 'red.7'} style={{ whiteSpace: 'nowrap' }}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} vs media
            </Text>
          )}
          <Text fz={{ base: 26, sm: 30 }} fw={800} lh={1} c={overall !== null ? scoreColor(1 + (overall / 100) * 4) : 'gray.4'} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {overall ?? '--'}
          </Text>
        </Group>
      </Group>

      <HexagonChart today={todayValues} average={averageVals} />

      {/* Leyenda */}
      <Group justify="center" gap="md" mt={4}>
        <Group gap={6} wrap="nowrap">
          <Box w={14} h={4} style={{ borderRadius: 2, background: 'var(--mantine-color-teal-5)' }} />
          <Text fz="xs" c="dark.4" fw={600}>Hoy</Text>
        </Group>
        <Group gap={6} wrap="nowrap">
          <Box w={14} h={0} style={{ borderTop: '2px dashed var(--mantine-color-gray-5)' }} />
          <Text fz="xs" c="dark.4" fw={600}>Media 28 días</Text>
        </Group>
      </Group>

      {todayRecord?.molestia && (
        <Box mt="sm" p="xs" style={{ borderRadius: 10, background: 'var(--mantine-color-red-0)', border: '1px solid var(--mantine-color-red-2)' }}>
          <Text fz="xs" fw={700} c="red.8">Molestia reportada</Text>
          <Text fz="xs" c="dark.5">{todayRecord.molestia_detalle}</Text>
        </Box>
      )}

      {/* Pie de tarjeta idéntico al resto de widgets */}
      <Group
        justify="space-between"
        align="center"
        mt="xs"
        pt="xs"
        style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}
      >
        <Text fz="xs" c="dimmed" fw={500}>
          {loading ? 'Cargando…' : todayRecord ? 'Registro de hoy completado' : 'Sin registro hoy'}
        </Text>
        {canEdit && !loading && (
          <Text fz="xs" fw={600} c="dark.4" style={{ cursor: 'pointer' }} onClick={() => setModalOpen(true)}>
            {todayRecord ? 'Editar →' : 'Rellenar →'}
          </Text>
        )}
      </Group>

      {canEdit && (
        <WellnessModal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          initial={todayRecord}
          onSubmit={handleSubmit}
          saving={saving}
        />
      )}
    </Paper>
  );
}
