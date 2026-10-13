/**
 * Reparto por defecto de las kcal del día entre las tomas (% enteros que suman 100) según la combinación de tomas y
 * si el jugador tiene post-entreno. Es el reparto que recibe un jugador al crearlo o al cambiar sus tomas; después el
 * nutricionista lo ajusta en su perfil. Cada toma recibe ese mismo % de proteína, hidratos y grasa. Con post-entreno,
 * el % se aplica a lo que queda del día tras los macros fijos del post.
 */
export const DEFAULT_MEAL_DISTRIBUTIONS = [
  {
    tomas: ['Desayuno', 'Almuerzo', 'Comida', 'Merienda', 'Cena'],
    sinPost: { Desayuno: 17, Almuerzo: 9, Comida: 38, Merienda: 10, Cena: 26 },
    conPost: { Desayuno: 14, Almuerzo: 10, Comida: 36, Merienda: 10, Cena: 30 },
  },
  {
    tomas: ['Desayuno', 'Almuerzo', 'Comida', 'Cena'],
    sinPost: { Desayuno: 19, Almuerzo: 10, Comida: 40, Cena: 31 },
    conPost: { Desayuno: 17, Almuerzo: 11, Comida: 39, Cena: 33 },
  },
  {
    tomas: ['Desayuno', 'Comida', 'Merienda', 'Cena'],
    sinPost: { Desayuno: 20, Comida: 38, Merienda: 12, Cena: 30 },
    conPost: { Desayuno: 18, Comida: 37, Merienda: 12, Cena: 33 },
  },
  {
    tomas: ['Desayuno', 'Comida', 'Cena'],
    sinPost: { Desayuno: 23, Comida: 41, Cena: 36 },
    conPost: { Desayuno: 22, Comida: 41, Cena: 37 },
  },
  {
    tomas: ['Comida', 'Merienda', 'Cena'],
    sinPost: { Comida: 43, Merienda: 15, Cena: 42 },
    conPost: { Comida: 43, Merienda: 14, Cena: 43 },
  },
  {
    tomas: ['Comida', 'Cena'],
    sinPost: { Comida: 50, Cena: 50 },
    conPost: { Comida: 50, Cena: 50 },
  },
];

// Combinaciones que no están en la tabla: peso de cada tipo de toma, renormalizado entre las tomas presentes.
// Una toma con otro nombre cuenta como toma ligera.
export const FALLBACK_MEAL_WEIGHTS = { Desayuno: 18, Almuerzo: 10, Comida: 38, Merienda: 12, Cena: 32 };
export const FALLBACK_OTHER_MEAL_WEIGHT = 10;
