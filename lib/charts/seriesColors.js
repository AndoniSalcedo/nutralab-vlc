'use client';

import { useState } from 'react';

// Paleta categórica validada (daltonismo incluido) para una línea por jugador.
// Orden fijo y sin ciclar: más de 8 series no se pintan como líneas sueltas.
const SERIES_PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
export const MAX_SERIES = SERIES_PALETTE.length;
const FALLBACK = '#8C9273';

function assignSlots(previous, keys) {
  const slots = {};
  keys.forEach((key) => {
    if (previous[key] !== undefined) slots[key] = previous[key];
  });
  keys.forEach((key) => {
    if (slots[key] !== undefined) return;
    const used = new Set(Object.values(slots));
    const free = SERIES_PALETTE.findIndex((_, i) => !used.has(i));
    if (free !== -1) slots[key] = free;
  });
  return slots;
}

// El color sigue al jugador, no a su posición en la lista: al quitar uno, los demás
// conservan el suyo y el que entra ocupa el primer hueco libre.
export function useStableSeriesColors(keys) {
  const signature = keys.join('|');
  const [state, setState] = useState({ signature: '', slots: {} });

  let slots = state.slots;
  if (state.signature !== signature) {
    slots = assignSlots(state.slots, keys);
    setState({ signature, slots });
  }

  return Object.fromEntries(keys.map((key) => [key, slots[key] !== undefined ? SERIES_PALETTE[slots[key]] : FALLBACK]));
}
