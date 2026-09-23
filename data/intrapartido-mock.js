/**
 * Catálogo oficial de productos, momentos de partido y utilidades de cálculo
 * para el módulo de Hidratación y Nutrición Intrapartido.
 * Datos extraídos de las hojas 'Timing' y 'Composición' de Intrapartido.xlsx.
 */

export const INTRAPARTIDO_TIMINGS = [
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
 * Genera una sesión de demostración inicial realista para que Carlos
 * vea la interfaz viva desde el primer momento.
 */
export function generateInitialMockSession(players = []) {
  const samplePlayerIds = players.slice(0, 16).map((p) => String(p.id));
  const starterIds = new Set(samplePlayerIds.slice(0, 11));

  // Mapa de tomas: playerId -> { timingId: { productId: cantidad } }
  const intakes = {};

  samplePlayerIds.forEach((pId) => {
    intakes[pId] = {
      llegada: {},
      calentamiento: {},
      salida: {},
      pausa1: {},
      descanso: {},
      pausa2: {},
      final: {},
    };
  });

  return {
    matchInfo: {
      rival: 'Villarreal CF',
      competicion: 'LaLiga EA Sports',
      lugar: 'Mestalla',
      fecha: new Date().toISOString().split('T')[0],
    },
    activeRosterIds: samplePlayerIds,
    starterIds: Array.from(starterIds),
    intakes,
  };
}


