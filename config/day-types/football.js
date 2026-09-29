// Tipos de día y multiplicadores (g/kg) de fútbol. Los usa la app por defecto.
// Solo datos: la lógica que los consume está en config/nutrition-days.js.

import { macros } from '@/config/day-types/macros';

export const FOOTBALL_DAY_TYPES = [
  {
    key: 'descanso',
    label: 'Descanso',
    planLabel: 'Día descanso',
    color: 'blue',
    tienePostentreno: false,
    tienePreentreno: false,
  },
  {
    key: 'recuperacion',
    label: 'Recuperación',
    planLabel: 'Día recuperación',
    color: 'teal',
    tienePostentreno: false,
    tienePreentreno: false,
  },
  {
    key: 'entreno',
    label: 'Entrenamiento',
    planLabel: 'Día entrenamiento',
    color: 'green',
    tienePostentreno: true,
    tienePreentreno: true,
  },
  {
    key: 'doble',
    label: 'Doble sesión',
    planLabel: 'Día doble sesión',
    color: 'orange',
    tienePostentreno: true,
    tienePreentreno: true,
  },
  {
    key: 'partido',
    label: 'Partido',
    planLabel: 'Día partido',
    color: 'red',
    tienePostentreno: true,
    tienePreentreno: true,
  },
];

export const FOOTBALL_OBJECTIVE_MACROS = {
  perdida_grasa: {
    descanso:      macros(2.2, 2.15, 0.925),
    entreno:       macros(2.1, 3.0, 0.825),
    doble:         macros(2.1, 4.0, 0.75),
    recuperacion:  macros(2.3, 2.5, 0.85),
    partido:       macros(1.9, 6.5, 0.75),
  },
  perdida_peso: {
    descanso:      macros(2.0, 2.4, 0.925),
    entreno:       macros(1.9, 3.1, 0.875),
    doble:         macros(1.9, 4.3, 0.8),
    recuperacion:  macros(2.1, 2.7, 0.85),
    partido:       macros(1.9, 6.25, 0.8),
  },
  ganancia_musculo: {
    descanso:      macros(2.3, 3.5, 1.05),
    entreno:       macros(2.1, 5.0, 1.0),
    doble:         macros(2.1, 6.0, 0.95),
    recuperacion:  macros(2.4, 4.0, 1.0),
    partido:       macros(2.0, 7.0, 0.9),
  },
  mejora_condicion: {
    descanso:      macros(2.4, 3.0, 0.9),
    entreno:       macros(2.3, 4.0, 0.85),
    doble:         macros(2.3, 5.0, 0.8),
    recuperacion:  macros(2.5, 3.5, 0.85),
    partido:       macros(2.1, 6.5, 0.8),
  },
  mejora_rendimiento: {
    descanso:      macros(2.0, 3.5, 0.95),
    entreno:       macros(1.9, 4.5, 0.9),
    doble:         macros(1.9, 6.0, 0.85),
    recuperacion:  macros(2.1, 4.0, 0.9),
    partido:       macros(1.85, 6.9, 0.9),
  },
};
