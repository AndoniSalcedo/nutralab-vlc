/**
 * Catálogo oficial de productos, momentos de partido y utilidades de cálculo
 * para el módulo de Hidratación y Nutrición Intrapartido.
 * Datos extraídos de las hojas 'Timing' y 'Composición' de Intrapartido.xlsx.
 * Los ids de momento y de producto son los que se persisten en base de datos.
 */

import { todayKey } from '@/lib/dates';

// Fases por defecto del partido; cada equipo puede personalizarlas (ver resolveTeamPhases)
const INTRAPARTIDO_TIMINGS = [
  { id: 'llegada', label: 'Llegada a campo', short: 'Llegada', icon: 'flag' },
  { id: 'calentamiento', label: 'Calentamiento', short: 'Calentamiento', icon: 'gym' },
  { id: 'salida', label: 'Salida al campo', short: 'Salida', icon: 'boxing_glove' },
  { id: 'pausa1', label: 'Pausa hidratación (1ªP)', short: 'Pausa 1ªP', icon: 'droplet' },
  { id: 'descanso', label: 'Descanso (MT)', short: 'Descanso', icon: 'alarmclock' },
  { id: 'pausa2', label: 'Pausa hidratación (2ªP)', short: 'Pausa 2ªP', icon: 'droplet' },
  { id: 'final', label: 'Final del partido', short: 'Final', icon: 'check' },
];


export const INTRAPARTIDO_PRODUCTS = [
  {
    id: 'agua-100',
    nombre: 'Agua 100ml',
    categoria: 'bebidas',
    short: 'Agua 100ml',
    color: '#0284c7',
    quick: false,
    nutrientes: {
      aguaMl: 100,
      carbsG: 0,
      sodioMg: 0,
      potasioMg: 0,
      cafeinaMg: 0,
      kcal: 0,
    },
  },
  {
    id: 'agua-250',
    nombre: 'Agua 250ml',
    categoria: 'bebidas',
    short: 'Agua 250ml',
    color: '#0284c7',
    quick: true,
    nutrientes: {
      aguaMl: 250,
      carbsG: 0,
      sodioMg: 0,
      potasioMg: 0,
      cafeinaMg: 0,
      kcal: 0,
    },
  },
  {
    id: 'isotonico-500',
    nombre: 'Isotónico 500ml',
    categoria: 'bebidas',
    short: 'Iso 500ml',
    color: '#d97706',
    quick: false,
    nutrientes: {
      aguaMl: 500,
      carbsG: 27,
      sodioMg: 264,
      potasioMg: 134,
      cafeinaMg: 0,
      kcal: 107,
    },
  },
  {
    id: 'isotonico-250',
    nombre: 'Isotónico 250ml',
    categoria: 'bebidas',
    short: 'Iso 250ml',
    color: '#d97706',
    quick: true,
    nutrientes: {
      aguaMl: 250,
      carbsG: 13.5,
      sodioMg: 132,
      potasioMg: 67,
      cafeinaMg: 0,
      kcal: 52.5,
    },
  },
  {
    id: 'isotonico-100',
    nombre: 'Isotónico 100ml',
    categoria: 'bebidas',
    short: 'Iso 100ml',
    color: '#d97706',
    quick: false,
    nutrientes: {
      aguaMl: 100,
      carbsG: 5.4,
      sodioMg: 52.8,
      potasioMg: 26.8,
      cafeinaMg: 0,
      kcal: 21.4,
    },
  },
  {
    id: 'suero-500',
    nombre: 'Suero 500ml',
    categoria: 'bebidas',
    short: 'Suero 500ml',
    color: '#2563eb',
    quick: false,
    nutrientes: {
      aguaMl: 500,
      carbsG: 20,
      sodioMg: 1376,
      potasioMg: 786,
      cafeinaMg: 0,
      kcal: 80,
    },
  },
  {
    id: 'suero-250',
    nombre: 'Suero 250ml',
    categoria: 'bebidas',
    short: 'Suero 250ml',
    color: '#2563eb',
    quick: false,
    nutrientes: {
      aguaMl: 250,
      carbsG: 10,
      sodioMg: 688,
      potasioMg: 396,
      cafeinaMg: 0,
      kcal: 40,
    },
  },
  {
    id: 'gel-30',
    nombre: 'Gel 30g',
    categoria: 'geles',
    short: 'Gel 30g',
    color: '#7c3aed',
    quick: true,
    nutrientes: {
      aguaMl: 60,
      carbsG: 30,
      sodioMg: 195,
      potasioMg: 0,
      cafeinaMg: 0,
      kcal: 120,
    },
  },
  {
    id: 'gel-45',
    nombre: 'Gel 45g',
    categoria: 'geles',
    short: 'Gel 45g',
    color: '#7c3aed',
    quick: false,
    nutrientes: {
      aguaMl: 60,
      carbsG: 45,
      sodioMg: 195,
      potasioMg: 0,
      cafeinaMg: 0,
      kcal: 175,
    },
  },
  {
    id: 'gel-cafeina-180',
    nombre: 'Gel cafeína 180mg',
    categoria: 'geles',
    short: 'Gel Caf. 180mg',
    color: '#9333ea',
    quick: false,
    nutrientes: {
      aguaMl: 65,
      carbsG: 40,
      sodioMg: 160,
      potasioMg: 0,
      cafeinaMg: 180,
      kcal: 159,
    },
  },
  {
    id: 'gominola-18',
    nombre: 'Gominola 18g',
    categoria: 'solidos',
    short: 'Gominola 18g',
    color: '#db2777',
    quick: false,
    nutrientes: {
      aguaMl: 0,
      carbsG: 18,
      sodioMg: 36,
      potasioMg: 0,
      cafeinaMg: 0,
      kcal: 88,
    },
  },
  {
    id: 'gominola-25',
    nombre: 'Gominola 25g',
    categoria: 'solidos',
    short: 'Gominola 25g',
    color: '#db2777',
    quick: false,
    nutrientes: {
      aguaMl: 0,
      carbsG: 23,
      sodioMg: 125,
      potasioMg: 0,
      cafeinaMg: 0,
      kcal: 94,
    },
  },
  {
    id: 'platano',
    nombre: 'Plátano',
    categoria: 'solidos',
    short: 'Plátano',
    color: '#eab308',
    quick: false,
    nutrientes: {
      aguaMl: 0,
      carbsG: 22,
      sodioMg: 0,
      potasioMg: 350,
      cafeinaMg: 0,
      kcal: 90,
    },
  },
  {
    id: 'platano-medio',
    nombre: 'Plátano 1/2',
    categoria: 'solidos',
    short: '1/2 Plátano',
    color: '#eab308',
    quick: true,
    nutrientes: {
      aguaMl: 0,
      carbsG: 11,
      sodioMg: 0,
      potasioMg: 175,
      cafeinaMg: 0,
      kcal: 45,
    },
  },
  {
    id: 'datil',
    nombre: 'Dátil',
    categoria: 'solidos',
    short: 'Dátil',
    color: '#854d0e',
    quick: false,
    nutrientes: {
      aguaMl: 0,
      carbsG: 6,
      sodioMg: 0,
      potasioMg: 50,
      cafeinaMg: 0,
      kcal: 23,
    },
  },
  {
    id: 'agua-mar-25',
    nombre: 'Agua de mar 25ml',
    categoria: 'bebidas',
    short: 'Agua mar 25ml',
    color: '#0891b2',
    quick: false,
    nutrientes: {
      aguaMl: 20,
      carbsG: 0,
      sodioMg: 240,
      potasioMg: 0,
      cafeinaMg: 0,
      kcal: 0,
    },
  },
  {
    id: 'no-cramp',
    nombre: 'No cramp',
    categoria: 'geles',
    short: 'No cramp',
    color: '#475569',
    quick: false,
    nutrientes: {
      aguaMl: 0,
      carbsG: 0,
      sodioMg: 0,
      potasioMg: 0,
      cafeinaMg: 0,
      kcal: 0,
    },
  },
  {
    id: 'cafeina-200',
    nombre: 'Cafeína 200mg',
    categoria: 'geles',
    short: 'Cafeína 200mg',
    color: '#b91c1c',
    quick: false,
    nutrientes: {
      aguaMl: 0,
      carbsG: 0,
      sodioMg: 0,
      potasioMg: 0,
      cafeinaMg: 200,
      kcal: 0,
    },
  },
];

export const PRODUCTS_MAP = new Map(INTRAPARTIDO_PRODUCTS.map((p) => [p.id, p]));

export const INTRAPARTIDO_PRODUCT_CATEGORIES = [
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'geles', label: 'Geles y Estimulantes' },
  { id: 'solidos', label: 'Alimentos Sólidos' },
];

// Máximo de botones de toma rápida por jugador (el cuarto hueco es el menú «Más»)
export const MAX_QUICK_BUTTONS = 3;
export const MAX_PHASES = 15;
export const PHASE_LABEL_MAX = 40;
export const PHASE_SHORT_MAX = 16;
// Mismo patrón que el check de partido_tomas.momento en la BD
const PHASE_ID_RE = /^[a-z0-9_-]{1,40}$/;

// Iconos que se pueden elegir para una fase
export const PHASE_ICONS = [
  'flag', 'gym', 'boxing_glove', 'droplet', 'alarmclock', 'stopwatch', 'timer_clock',
  'running', 'soccer', 'water_bottle', 'bolt', 'banana', 'stadium', 'check',
];

// Productos por defecto de cada fase: botones de toma individual y menú «Repartir» en lote.
export const DEFAULT_PHASE_PRODUCTS = {
  botones: ['agua-250', 'isotonico-250', 'gel-30'],
  reparto: ['agua-250', 'isotonico-250', 'gel-30', 'platano-medio'],
};

function sanitizeProductIds(ids, fallback, max = Infinity) {
  if (!Array.isArray(ids)) return [...fallback];
  return [...new Set(ids.map(String))].filter((id) => PRODUCTS_MAP.has(id)).slice(0, max);
}

/** Fases por defecto (las 7 del Excel original) con sus productos rápidos. */
export function getDefaultPhases() {
  return INTRAPARTIDO_TIMINGS.map((t) => ({
    ...t,
    botones: [...DEFAULT_PHASE_PRODUCTS.botones],
    reparto: [...DEFAULT_PHASE_PRODUCTS.reparto],
  }));
}

/** Id para una fase nueva creada por el equipo. */
export function createPhaseId() {
  return `f-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Normaliza una lista de fases: { id, label, short, icon, botones, reparto }.
 * Descarta ids repetidos o no válidos y productos desconocidos; sin fases válidas
 * devuelve las de por defecto.
 */
export function sanitizePhases(list) {
  if (!Array.isArray(list)) return getDefaultPhases();
  const seen = new Set();
  const phases = [];
  list.forEach((raw) => {
    if (!raw || typeof raw !== 'object' || phases.length >= MAX_PHASES) return;
    const id = String(raw.id || '');
    if (!PHASE_ID_RE.test(id) || seen.has(id)) return;
    const label = String(raw.label || '').trim().slice(0, PHASE_LABEL_MAX) || 'Fase sin nombre';
    seen.add(id);
    phases.push({
      id,
      label,
      short: String(raw.short || '').trim().slice(0, PHASE_SHORT_MAX) || label.slice(0, PHASE_SHORT_MAX),
      icon: PHASE_ICONS.includes(raw.icon) ? raw.icon : 'droplet',
      botones: sanitizeProductIds(raw.botones, DEFAULT_PHASE_PRODUCTS.botones, MAX_QUICK_BUTTONS),
      reparto: sanitizeProductIds(raw.reparto, DEFAULT_PHASE_PRODUCTS.reparto),
    });
  });
  return phases.length ? phases : getDefaultPhases();
}

/** Fases configuradas por el equipo (configuracion_nutricional.intrapartido.fases). */
export function resolveTeamPhases(teamConfig) {
  return sanitizePhases(teamConfig?.intrapartido?.fases);
}

/**
 * Calcula los aportes acumulados dado un mapa o array de tomas
 * @param {Array<{ productId: string, cantidad: number }>} intakes
 */
export function calculateNutrientTotals(intakes = []) {
  const totals = {
    aguaMl: 0,
    carbsG: 0,
    sodioMg: 0,
    potasioMg: 0,
    cafeinaMg: 0,
    kcal: 0,
    totalItems: 0,
  };

  intakes.forEach(({ productId, cantidad }) => {
    const prod = PRODUCTS_MAP.get(productId);
    if (!prod || !cantidad || cantidad <= 0) return;
    const n = prod.nutrientes;
    totals.aguaMl += (n.aguaMl || 0) * cantidad;
    totals.carbsG += (n.carbsG || 0) * cantidad;
    totals.sodioMg += (n.sodioMg || 0) * cantidad;
    totals.potasioMg += (n.potasioMg || 0) * cantidad;
    totals.cafeinaMg += (n.cafeinaMg || 0) * cantidad;
    totals.kcal += (n.kcal || 0) * cantidad;
    totals.totalItems += cantidad;
  });

  return totals;
}

/**
 * Sesión vacía de un partido nuevo (sin convocatoria ni tomas). Las fases se copian
 * en el partido para que cambios posteriores en la configuración no lo alteren.
 */
export function createEmptySession(fases = getDefaultPhases()) {
  return {
    id: null,
    fases,
    matchInfo: {
      rival: '',
      competicion: 'LaLiga EA Sports',
      lugar: 'Mestalla',
      fecha: todayKey(),
    },
    activeRosterIds: [],
    starterIds: [],
    intakes: {},
    estado: 'borrador',
    paso: 'alineacion',
    faseActual: 0,
  };
}

/**
 * Convierte las filas de la BD de un partido (cabecera, convocados y tomas)
 * en la sesión que usa la interfaz. Los partidos anteriores a las fases
 * personalizadas (match.fases nulo) usan las fases por defecto.
 */
export function buildSessionFromRows(match, convocados = [], tomas = []) {
  const fases = sanitizePhases(match.fases);
  // Tomas de un momento que no está en la lista: se muestran igualmente para no perderlas
  const phaseIds = new Set(fases.map((f) => f.id));
  tomas.forEach((t) => {
    if (phaseIds.has(t.momento)) return;
    phaseIds.add(t.momento);
    fases.push({ id: t.momento, label: t.momento, short: t.momento.slice(0, PHASE_SHORT_MAX), icon: 'droplet', botones: [], reparto: [] });
  });

  const intakes = {};
  convocados.forEach((c) => {
    intakes[String(c.jugador_id)] = {};
  });
  tomas.forEach((t) => {
    const pId = String(t.jugador_id);
    if (!intakes[pId]) return;
    intakes[pId][t.momento] = { ...(intakes[pId][t.momento] || {}), [t.producto_id]: t.cantidad };
  });

  return {
    id: String(match.id),
    fases,
    matchInfo: {
      rival: match.rival,
      competicion: match.competicion,
      lugar: match.lugar,
      fecha: match.fecha,
    },
    activeRosterIds: convocados.map((c) => String(c.jugador_id)),
    starterIds: convocados.filter((c) => c.titular).map((c) => String(c.jugador_id)),
    intakes,
    estado: match.estado || 'finalizado',
    paso: match.paso || 'alineacion',
    faseActual: Math.min(Math.max(Number(match.fase_actual) || 0, 0), fases.length - 1),
  };
}

/**
 * Totales nutricionales de las tomas de un jugador: { momento: { productoId: cantidad } }
 */
export function calculatePlayerTotals(playerIntakes = {}) {
  const list = [];
  Object.values(playerIntakes).forEach((productsMap) => {
    Object.entries(productsMap).forEach(([productId, cantidad]) => {
      list.push({ productId, cantidad });
    });
  });
  return calculateNutrientTotals(list);
}
