'use client';

import React from 'react';
import { Box } from '@mantine/core';

export default function FillableIcon({
  Icon,
  percent = 0,
  size = 64,
  colorVar = 'cyan-3',
  iconColor = 'var(--mantine-color-cyan-9)',
  bgIconColor = 'var(--mantine-color-gray-3)',
  stroke = 1.5,
}) {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const resolvedFill = colorVar.startsWith('var(') || colorVar.startsWith('#') || colorVar.startsWith('rgb')
    ? colorVar
    : `var(--mantine-color-${colorVar})`;

  return (
    <Box style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* 1. Fondo (Grisáceo y semitransparente) */}
      <Icon
        size={size}
        color={bgIconColor}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
        stroke={stroke}
      />

      {/* 2. Frente (Color sólido recortado dinámico) */}
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: size,
          height: `${p}%`,
          overflow: 'hidden',
          transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1,
        }}
      >
        <Icon
          size={size}
          color={iconColor}
          fill={resolvedFill}
          style={{ position: 'absolute', bottom: 0, left: 0 }}
          stroke={stroke}
        />
      </Box>
    </Box>
  );
}
