'use client';

import { Box, Group, Paper, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';

// Tesela común del bento del Perfil: fondo blanco sin borde, esquinas amplias y una
// etiqueta con el color de su categoría (agua azul, suplementos violeta…) para que
// cada dato se reconozca de un vistazo, al estilo de las apps de salud.
export default function WidgetCard({
  id,
  icon,
  title,
  color = 'gray',
  aside,
  footer,
  footerAction,
  onFooterAction,
  onClick,
  bg = 'white',
  fillPercent,
  fillColor = 'blue.0',
  fillWaveColor,
  children,
  style,
  ...props
}) {
  return (
    <Paper
      id={id}
      radius={24}
      p="md"
      bg={bg}
      h="100%"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(21, 21, 19, 0.05)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      {...props}
    >
      {fillPercent !== undefined && <WaterFill percent={fillPercent} color={fillColor} waveColor={fillWaveColor} />}

      {(title || aside) && (
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs" style={{ position: 'relative' }}>
          <Group gap={6} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
            {icon && <Icon3D name={icon} size={20} style={{ flexShrink: 0 }} />}
            <Text fz={13} fw={700} c="dark.5" lh={1.2} style={{ overflowWrap: 'anywhere' }}>
              {title}
            </Text>
          </Group>
          {aside && <Box style={{ flexShrink: 0 }}>{aside}</Box>}
        </Group>
      )}

      <Box style={{ flex: 1, position: 'relative', minWidth: 0 }}>{children}</Box>

      {(footer || footerAction) && (
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs" style={{ position: 'relative' }}>
          <Text fz="xs" c="dimmed" fw={500} truncate style={{ fontVariantNumeric: 'tabular-nums' }}>
            {footer}
          </Text>
          {footerAction && (
            <Text
              fz="xs"
              fw={700}
              c="dark.4"
              style={{ flexShrink: 0, cursor: onFooterAction || onClick ? 'pointer' : undefined }}
              onClick={onFooterAction ? (e) => { e.stopPropagation(); onFooterAction(); } : undefined}
            >
              {footerAction} →
            </Text>
          )}
        </Group>
      )}
    </Paper>
  );
}

// Relleno tipo líquido: el nivel sube con un muelle ligeramente rebotado y la superficie
// es una doble ola que se desplaza en direcciones opuestas, así no sube como un bloque plano.
const WAVE_PATH = 'M0 20 C 25 0, 75 40, 100 20 C 125 0, 175 40, 200 20 L200 40 L0 40 Z';

function WaterFill({ percent, color, waveColor = color }) {
  const level = Math.max(0, Math.min(100, percent));
  const css = `var(--mantine-color-${color.replace('.', '-')})`;
  const cssWave = `var(--mantine-color-${waveColor.replace('.', '-')})`;
  const showWave = level > 0 && level < 100;

  return (
    <Box
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: `${level}%`,
        transition: 'height 1.1s cubic-bezier(0.34, 1.35, 0.5, 1)',
      }}
    >
      <style>{`
        @keyframes nl-wave-a { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes nl-wave-b { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { .nl-wave { animation: none !important; } }
      `}</style>
      {showWave && (
        <>
          <svg
            className="nl-wave"
            viewBox="0 0 200 40"
            preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: '100%', left: 0, width: '200%', height: 26, marginBottom: -1, animation: 'nl-wave-b 5s linear infinite' }}
          >
            <path d={WAVE_PATH} fill={cssWave} />
          </svg>
          <svg
            className="nl-wave"
            viewBox="0 0 200 40"
            preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: '100%', left: 0, width: '200%', height: 20, marginBottom: -1, animation: 'nl-wave-a 3.5s linear infinite' }}
          >
            <path d={WAVE_PATH} fill={css} />
          </svg>
        </>
      )}
      <Box style={{ position: 'absolute', inset: 0, background: css }} />
    </Box>
  );
}

// Cifra protagonista de una tesela: número grande + unidad pequeña
export function WidgetValue({ value, unit, color = 'dark.6', size = 30 }) {
  return (
    <Text fz={size} fw={800} c={color} lh={1} lts={-0.8} style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {value}
      {unit && (
        <Text span fz={13} fw={600} c="dimmed" lts={0} ml={3}>
          {unit}
        </Text>
      )}
    </Text>
  );
}

// Píldora de estado para la esquina de la cabecera (tipo de día, "Sin datos", contadores…)
export function WidgetAside({ children, color = 'gray', dot = false }) {
  return (
    <Group
      gap={5}
      wrap="nowrap"
      px={8}
      py={2}
      style={{ borderRadius: 20, backgroundColor: `var(--mantine-color-${color}-0)` }}
    >
      {dot && <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: `var(--mantine-color-${color}-6)` }} />}
      <Text fz={11} fw={600} c={`${color}.8`} style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {children}
      </Text>
    </Group>
  );
}

// Tesela de estadística: icono + título de color, cifra grande y una línea de contexto
export function StatTile({ icon, title, color = 'gray', value, unit, caption, aside, valueSize = 28, valueColor = 'dark.6' }) {
  return (
    <WidgetCard icon={icon} title={title} color={color} aside={aside} style={{ height: 'auto' }}>
      <WidgetValue value={value} unit={unit} color={valueColor} size={valueSize} />
      {caption && (
        <Text fz="xs" c="dimmed" mt={6} lineClamp={2} lh={1.35}>
          {caption}
        </Text>
      )}
    </WidgetCard>
  );
}
