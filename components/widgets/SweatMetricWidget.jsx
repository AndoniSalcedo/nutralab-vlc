'use client';

import { useRouter } from 'next/navigation';
import { Box, Group, Paper, Stack, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';

// Umbrales de sodio en sudor (mg/L) según la escala del dispositivo
const SODIUM_THRESHOLDS = [750, 1100, 1450];
const SODIUM_SCALE_MIN = 400;
const SODIUM_SCALE_MAX = 1800;

const SODIUM_SEGMENTS = [
  { label: 'Bajo', status: 'Sodio bajo', bg: 'orange-1', text: 'orange.9' },
  { label: 'Moderado', status: 'Sodio moderado', bg: 'orange-3', text: 'orange.9' },
  { label: 'Alto', status: 'Sodio alto', bg: 'orange-5', text: 'white' },
  { label: 'Muy alto', status: 'Sodio muy alto', bg: 'orange-7', text: 'white' },
];

function getSegmentIndex(val) {
  const idx = SODIUM_THRESHOLDS.findIndex((t) => val < t);
  return idx === -1 ? SODIUM_THRESHOLDS.length : idx;
}

function getSegmentIndexFromEstado(estado) {
  const norm = String(estado || '').toLowerCase();
  if (!norm) return -1;
  if (norm.includes('very') || norm.includes('v.high') || norm.includes('muy')) return 3;
  if (norm.includes('high') || norm.includes('alto')) return 2;
  if (norm.includes('moderate') || norm.includes('moderado') || norm.includes('medio')) return 1;
  if (norm.includes('low') || norm.includes('bajo')) return 0;
  return -1;
}

// Posición (0-100%) del marcador: segmentos de igual ancho, interpolación lineal dentro de cada uno
function getMarkerPercent(val) {
  const bounds = [SODIUM_SCALE_MIN, ...SODIUM_THRESHOLDS, SODIUM_SCALE_MAX];
  const idx = getSegmentIndex(val);
  const lo = bounds[idx];
  const hi = bounds[idx + 1];
  const within = Math.max(0, Math.min(1, (val - lo) / (hi - lo)));
  const segWidth = 100 / SODIUM_SEGMENTS.length;
  return Math.max(1.5, Math.min(98.5, (idx + within) * segWidth));
}

function SodiumScale({ value, activeIndex }) {
  const hasMarker = Number.isFinite(value);
  const segWidth = 100 / SODIUM_SEGMENTS.length;

  return (
    <Box>
      {/* Pista con borde exterior tipo "píldora" */}
      <Box p={3} style={{ borderRadius: 999, border: '1.5px solid var(--mantine-color-gray-3)', background: 'white' }}>
        <Box style={{ position: 'relative' }}>
          <Box style={{ display: 'flex', height: 30, borderRadius: 999, overflow: 'hidden' }}>
            {SODIUM_SEGMENTS.map((seg, i) => (
              <Box
                key={seg.label}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `var(--mantine-color-${seg.bg})`,
                }}
              >
                <Text fz={{ base: 10, sm: 12 }} fw={i === activeIndex ? 800 : 700} c={seg.text} truncate="end" px={2}>
                  {seg.label}
                </Text>
              </Box>
            ))}
          </Box>

          {/* Marcador vertical del valor actual */}
          {hasMarker && (
            <Box
              aria-hidden
              style={{
                position: 'absolute',
                top: -7,
                bottom: -7,
                left: `${getMarkerPercent(value)}%`,
                width: 4,
                transform: 'translateX(-50%)',
                borderRadius: 4,
                background: 'var(--mantine-color-dark-7)',
                boxShadow: '0 0 0 1.5px white',
                transition: 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Umbrales bajo las fronteras entre segmentos */}
      <Box style={{ position: 'relative', height: 18, marginTop: 4 }}>
        {SODIUM_THRESHOLDS.map((t, i) => (
          <Text
            key={t}
            fz="xs"
            fw={700}
            c="dark.4"
            style={{
              position: 'absolute',
              left: `${(i + 1) * segWidth}%`,
              transform: 'translateX(-50%)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {t}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

function formatDate(fecha) {
  if (!fecha) return '';
  const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function SweatMetricWidget({
  jugadorId,
  latestSweat = null,
  formatMetricNumber = (val) => val ?? '-',
}) {
  const router = useRouter();

  const val = latestSweat?.valor;
  const numVal = Number(val);
  const hasValue = val !== null && val !== undefined && val !== '' && Number.isFinite(numVal);
  const unit = latestSweat?.unidad || 'mg/L';
  const segmentIndex = hasValue ? getSegmentIndex(numVal) : getSegmentIndexFromEstado(latestSweat?.estado);
  const statusSegment = segmentIndex >= 0 ? SODIUM_SEGMENTS[segmentIndex] : null;
  const lastDate = formatDate(latestSweat?.fecha);

  return (
    <Paper
      id="widget-sudor"
      shadow="sm"
      radius="lg"
      p={{ base: 'sm', sm: 'md' }}
      bg="white"
    >
      {/* Cabecera: título a la izquierda, valor y estado a la derecha */}
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm" mb="sm">
        <Group gap="xs" align="center" wrap="nowrap">
          <Icon3D name="running" size={28} />
          <Text fw={700} fz="sm" c="dark.5">
            Sudoración
          </Text>
        </Group>

        <Group gap={2} align="center" style={{ minWidth: 0 }}>
          {statusSegment && (
            <Text fz="xs" fw={700} c="orange.8" style={{ whiteSpace: 'nowrap' }} pr="xs">
              {statusSegment.status}
            </Text>
          )}
          {hasValue ? (
            <Text lh={1} style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              <Text span fz={{ base: 24, sm: 28 }} fw={800} c="orange.7">
                {formatMetricNumber(numVal, 0)}
              </Text>{' '}
              <Text span fz="xs" fw={700} c="dimmed">
                {unit}
              </Text>
            </Text>
          ) : (
            <Text fz="sm" fw={700} c="dimmed">
              Sin datos
            </Text>
          )}

        </Group>
      </Group>

      <SodiumScale value={hasValue ? numVal : null} activeIndex={segmentIndex} />

      {/* Pie de tarjeta idéntico al resto de widgets */}
      <Group
        justify="space-between"
        align="center"
        mt="xs"
        pt="xs"
        style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}
      >
        <Text fz="xs" c="dimmed" fw={500}>
          Sodio en sudor{lastDate ? ` · ${lastDate}` : ''}
        </Text>
        <Text
          fz="xs"
          fw={600}
          c="dark.4"
          style={{ cursor: 'pointer' }}
          onClick={() => router.push(`/dashboard/jugador/${jugadorId}/metricas/hidratacion`)}
        >
          Ver analítica →
        </Text>
      </Group>
    </Paper>
  );
}
