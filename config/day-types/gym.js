// Tipos de día y multiplicadores (g/kg) de Hyrox / gimnasio. Los usa la API externa.
// Solo datos: la lógica que los consume está en config/nutrition-days.js (se pasan como teamConfig).

import { macros } from '@/config/day-types/macros';

export const GYM_DAY_TYPES = [
  {
    key: 'descanso',
    label: 'Descanso',
    planLabel: 'Día descanso',
    color: 'blue',
    tienePostentreno: false,
    tienePreentreno: false,
  },
  {
    key: 'recuperacion_activa',
    label: 'Recuperación activa (zona 2, movilidad)',
    planLabel: 'Día recuperación activa',
    color: 'teal',
    tienePostentreno: false,
    tienePreentreno: false,
  },
  {
    key: 'fuerza',
    label: 'Fuerza (gimnasio)',
    planLabel: 'Día fuerza',
    color: 'green',
    tienePostentreno: true,
    tienePreentreno: true,
  },
  {
    key: 'hyrox',
    label: 'Entreno Hyrox (carrera + estaciones)',
    planLabel: 'Día Hyrox',
    color: 'orange',
    tienePostentreno: true,
    tienePreentreno: true,
  },
  {
    key: 'hibrido',
    label: 'Doble sesión híbrida (fuerza + engine)',
    planLabel: 'Día híbrido',
    color: 'orange',
    tienePostentreno: true,
    tienePreentreno: true,
  },
  {
    key: 'competicion',
    label: 'Competición Hyrox',
    planLabel: 'Día competición',
    color: 'red',
    tienePostentreno: true,
    tienePreentreno: true,
  },
];

const GYM_OBJECTIVE_MACROS = {
  perdida_grasa: {
    descanso:            macros(2.4, 2.0, 0.9),
    recuperacion_activa: macros(2.4, 2.5, 0.85),
    fuerza:              macros(2.4, 3.0, 0.85),
    hyrox:               macros(2.2, 4.0, 0.8),
    hibrido:             macros(2.2, 5.0, 0.75),
    competicion:         macros(1.9, 7.0, 0.75),
  },
  perdida_peso: {
    descanso:            macros(2.2, 2.3, 0.9),
    recuperacion_activa: macros(2.2, 2.8, 0.85),
    fuerza:              macros(2.2, 3.3, 0.85),
    hyrox:               macros(2.0, 4.3, 0.8),
    hibrido:             macros(2.0, 5.3, 0.8),
    competicion:         macros(1.9, 7.0, 0.75),
  },
  ganancia_musculo: {
    descanso:            macros(2.2, 4.0, 1.1),
    recuperacion_activa: macros(2.2, 4.5, 1.05),
    fuerza:              macros(2.3, 5.5, 1.0),
    hyrox:               macros(2.1, 6.0, 1.0),
    hibrido:             macros(2.1, 7.0, 0.95),
    competicion:         macros(2.0, 8.0, 0.9),
  },
  mejora_condicion: {
    descanso:            macros(2.4, 2.8, 0.9),
    recuperacion_activa: macros(2.4, 3.3, 0.85),
    fuerza:              macros(2.5, 4.0, 0.85),
    hyrox:               macros(2.3, 5.0, 0.8),
    hibrido:             macros(2.3, 6.0, 0.8),
    competicion:         macros(2.0, 7.5, 0.8),
  },
  mejora_rendimiento: {
    descanso:            macros(2.0, 3.0, 1.0),
    recuperacion_activa: macros(2.0, 3.5, 0.95),
    fuerza:              macros(2.2, 4.0, 0.9),
    hyrox:               macros(1.9, 5.5, 0.85),
    hibrido:             macros(2.0, 6.5, 0.85),
    competicion:         macros(1.8, 7.5, 0.8),
  },
};

// Se pasa al motor como teamConfig: getTeamNutritionDayTypes / getTeamObjectiveDayTypeMacros lo resuelven.
export const GYM_TEAM_CONFIG = {
  dayTypes: GYM_DAY_TYPES,
  objectiveMacros: GYM_OBJECTIVE_MACROS,
};
