'use client';

import { Box, Group, Text, UnstyledButton } from '@mantine/core';

/**
 * Tira de 7 días (diseño del diario de comidas): inicial del día o "Hoy", número en círculo (relleno si está
 * seleccionado, con aro si es hoy), puntos de color con lo que tiene el día y, en escritorio, un pie opcional.
 * Cada día es `{ key, label, number, isToday?, disabled?, dots?: string[], caption?, ariaLabel? }`.
 */
export default function WeekDayStrip({ days, selectedKey, onSelect }) {
  return (
    <Box style={{ display: 'grid', gridTemplateColumns: `repeat(${days.length || 7}, 1fr)`, gap: 4 }}>
      {days.map(({ key, label, number, isToday = false, disabled = false, dots = [], caption = '', ariaLabel }) => {
        const isSelected = key === selectedKey;
        return (
          <UnstyledButton
            key={key}
            disabled={disabled}
            onClick={() => onSelect(key)}
            aria-label={ariaLabel}
            aria-pressed={isSelected}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 0',
              borderRadius: 'var(--mantine-radius-lg)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.35 : 1,
              background: isSelected ? 'var(--mantine-color-gray-1)' : 'transparent',
              transition: 'background 120ms ease',
            }}
          >
            <Text fz={11} fw={600} c="dimmed" lh={1}>
              {isToday ? 'Hoy' : label}
            </Text>
            <Box
              w={34}
              h={34}
              style={{
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isSelected ? 'var(--mantine-primary-color-filled)' : 'transparent',
                border: isToday && !isSelected ? '2px solid var(--mantine-primary-color-filled)' : '2px solid transparent',
              }}
            >
              <Text fz="sm" fw={800} c={isSelected ? 'white' : 'dark.5'} lh={1}>
                {number}
              </Text>
            </Box>
            <Group gap={2} h={6} justify="center" wrap="nowrap">
              {dots.slice(0, 6).map((color, idx) => (
                <Box key={idx} w={5} h={5} style={{ borderRadius: '50%', background: color }} />
              ))}
            </Group>
            <Text visibleFrom="sm" fz={10} fw={600} c="dimmed" h={12} lh="12px" truncate="end" maw="100%" px={2}>
              {caption}
            </Text>
          </UnstyledButton>
        );
      })}
    </Box>
  );
}
