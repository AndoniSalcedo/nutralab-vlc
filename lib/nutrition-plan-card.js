import { cunninghamPlan, calculateByObjective } from './calculations.js';
import { PLAN_DAY_TYPES, getUserMeals, getObjectiveMacros } from './nutrition-day-types.js';

export { PLAN_DAY_TYPES };

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function numberOrNull(value, decimals = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function roundMacro(value) {
  return numberOrNull(value, 0);
}

function calculateMacros(metricas, config, objectiveKey) {
  const weight = numberOrNull(metricas?.peso, 1);
  if (!weight) {
    return {
      kcal: null,
      proteina: null,
      hidratos: null,
      grasa: null,
    };
  }

  // Use objective-based calculation if objective is valid
  if (objectiveKey && getObjectiveMacros(objectiveKey, config.key)) {
    const result = calculateByObjective({ weightKg: weight, objectiveKey, dayTypeKey: config.key });
    if (result) {
      return {
        kcal: roundMacro(result.kcal),
        proteina: roundMacro(result.protein),
        hidratos: roundMacro(result.cho),
        grasa: roundMacro(result.fat),
      };
    }
  }

  // Fallback to Cunningham
  const plan = cunninghamPlan({
    weightKg: weight,
    bodyFatPct: metricas?.grasa,
    bodyFat: metricas?.grasa,
    leanMassKg: metricas?.masaMagra,
    activityFactor: config.factor,
    proteinGkg: config.proteinGkg,
    carbsGkg: config.carbsGkg,
    fatGkg: config.fatGkg,
  });

  return {
    kcal: roundMacro(plan.kcal),
    proteina: roundMacro(plan.protein),
    hidratos: roundMacro(plan.cho),
    grasa: roundMacro(plan.fat),
  };
}

function resolveDayTypeConfig(tipoDia) {
  return PLAN_DAY_TYPES.find((t) => t.key === tipoDia) || PLAN_DAY_TYPES[0];
}

function findMenuForDay(dayKey, menu) {
  if (!menu || !Array.isArray(menu.dias)) return null;
  const normalizedKey = dayKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return menu.dias.find(d => {
    const normDiaName = String(d.dia || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normDiaName === normalizedKey;
  }) || null;
}

function defaultMealDetail(dayKey, tipoDia, mealName, menu) {
  const dayMenu = findMenuForDay(dayKey, menu);
  const comida = dayMenu?.comida;
  const cena = dayMenu?.cena;

  if (mealName.toLowerCase().includes('comida') && comida) {
    const parts = [comida.primero, comida.segundo, comida.postre].filter(Boolean).map(cleanText);
    if (parts.length > 0) return parts.join(' + ');
  }

  if (mealName.toLowerCase() === 'cena' && cena) {
    const parts = [cena.primero, cena.segundo, cena.postre].filter(Boolean).map(cleanText);
    if (parts.length > 0) return parts.join(' + ');
  }

  return '';
}

export function getActiveDayTypes(dias) {
  if (!dias || typeof dias !== 'object') return [];
  const keys = new Set();
  Object.values(dias).forEach((d) => {
    if (d.tipoDia) keys.add(d.tipoDia);
  });
  return Array.from(keys);
}

export function getDefaultCalendar() {
  return {
    lunes: 'entreno',
    martes: 'entreno',
    miercoles: 'descanso',
    jueves: 'entreno',
    viernes: 'entreno',
    sabado: 'descanso',
    domingo: 'descanso',
  };
}

export function buildBasePlanData({ jugador, nombre, contexto, contextoAdicional, menu, calendario }) {
  const fullName = cleanText(`${jugador?.nombre || ''} ${jugador?.apellidos || ''}`) || 'Jugador';
  const metricas = {
    peso: numberOrNull(jugador?.peso_kg, 1),
    grasa: numberOrNull(jugador?.porcentaje_grasa, 1),
    masaMagra: numberOrNull(jugador?.masa_magra_kg, 1),
    pesoMuscular: numberOrNull(jugador?.peso_muscular_pct, 1),
  };

  const resolvedCalendar = calendario && typeof calendario === 'object' ? calendario : getDefaultCalendar();
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const dayLabels = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const dias = {};
  const objectiveKey = jugador?.objetivo || null;
  daysOfWeek.forEach((dayKey) => {
    const tipoDia = resolvedCalendar[dayKey] || 'entreno';
    const dayTypeConfig = resolveDayTypeConfig(tipoDia);
    const macros = calculateMacros(metricas, dayTypeConfig, objectiveKey);

    dias[dayKey] = {
      dayKey,
      label: dayLabels[dayKey],
      tipoDia,
      ...macros,
      ingestas: getUserMeals(jugador).map((name) => ({
        nombre: name,
        detalle: defaultMealDetail(dayKey, tipoDia, name, menu),
      })),
    };
  });

  return {
    version: 2,
    meta: {
      nombre: cleanText(nombre) || `Plan ${new Date().toLocaleDateString('es-ES')}`,
      contexto: contexto || 'semana_normal',
      contextoAdicional: cleanText(contextoAdicional),
      semanaMenu: menu?.semana || null,
      fecha: new Date().toISOString(),
    },
    jugador: {
      id: jugador?.id || null,
      nombre: fullName,
      posicion: cleanText(jugador?.posicion) || 'Sin posición',
      num_comidas: jugador?.num_comidas,
      postentreno: jugador?.postentreno,
      objetivo: jugador?.objetivo || null,
    },
    metricas,
    dias,
    notas: [
      'Sin déficit el día de partido',
      'Mide el AOVE: 1 cucharada',
      'Mín. 3-4 pescados azules/semana',
      'Requesón nocturno en descanso',
    ],
  };
}

function normalizeMealList(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source.slice(0, 7).map((meal, index) => ({
    nombre: cleanText(meal?.nombre) || cleanText(fallback[index]?.nombre) || `Ingesta ${index + 1}`,
    detalle: cleanText(meal?.detalle) || cleanText(fallback[index]?.detalle),
  }));
}

export function sanitizePlanData(data) {
  if (!data || typeof data !== 'object') return null;

  const metricas = {
    peso: numberOrNull(data.metricas?.peso, 1),
    grasa: numberOrNull(data.metricas?.grasa, 1),
    masaMagra: numberOrNull(data.metricas?.masaMagra, 1),
    pesoMuscular: numberOrNull(data.metricas?.pesoMuscular, 1),
  };

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const dayLabels = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const defaultCalendar = getDefaultCalendar();
  const cleanDias = {};

  const objectiveKey = data.jugador?.objetivo || null;
  daysOfWeek.forEach((dayKey) => {
    const incomingDay = (data.dias && data.dias[dayKey]) || {};
    const resolvedTipoDia = incomingDay.tipoDia || defaultCalendar[dayKey];

    const dayTypeConfig = resolveDayTypeConfig(resolvedTipoDia);
    const fallbackMacros = calculateMacros(metricas, dayTypeConfig, objectiveKey);
    const fallbackMeals = getUserMeals(data.jugador);
    const mealFallback = fallbackMeals.map((name) => ({
      nombre: name,
      detalle: '',
    }));

    cleanDias[dayKey] = {
      dayKey,
      label: dayLabels[dayKey],
      tipoDia: resolvedTipoDia,
      kcal: numberOrNull(incomingDay.kcal, 0) ?? fallbackMacros.kcal,
      proteina: numberOrNull(incomingDay.proteina, 0) ?? fallbackMacros.proteina,
      hidratos: numberOrNull(incomingDay.hidratos, 0) ?? fallbackMacros.hidratos,
      grasa: numberOrNull(incomingDay.grasa, 0) ?? fallbackMacros.grasa,
      ingestas: normalizeMealList(incomingDay.ingestas, mealFallback),
    };
  });

  return {
    version: 2,
    meta: {
      nombre: cleanText(data.meta?.nombre),
      contexto: cleanText(data.meta?.contexto) || 'semana_normal',
      contextoAdicional: cleanText(data.meta?.contextoAdicional),
      semanaMenu: cleanText(data.meta?.semanaMenu) || null,
      fecha: data.meta?.fecha || new Date().toISOString(),
    },
    jugador: {
      id: data.jugador?.id || null,
      nombre: cleanText(data.jugador?.nombre) || 'Jugador',
      posicion: cleanText(data.jugador?.posicion) || 'Sin posición',
      num_comidas: data.jugador?.num_comidas,
      postentreno: data.jugador?.postentreno,
      objetivo: data.jugador?.objetivo || null,
    },
    metricas,
    dias: cleanDias,
    notas: Array.isArray(data.notas)
      ? data.notas.map(cleanText).filter(Boolean).slice(0, 6)
      : [],
  };
}

export function mergeAiPlanData(baseData, aiData) {
  const merged = JSON.parse(JSON.stringify(baseData));

  const aiDias = aiData?.dias || aiData?.fichas || aiData;

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  daysOfWeek.forEach((dayKey) => {
    const incoming = aiDias?.[dayKey];
    if (!incoming) return;

    if (Array.isArray(incoming.ingestas)) {
      merged.dias[dayKey].ingestas = incoming.ingestas.map((meal) => ({
        nombre: cleanText(meal.nombre) || 'Ingesta',
        detalle: cleanText(meal.detalle) || '',
      }));
    }
  });

  if (Array.isArray(aiData?.notes)) {
    merged.notas = aiData.notes;
  } else if (Array.isArray(aiData?.notas)) {
    merged.notas = aiData.notas;
  }

  return sanitizePlanData(merged);
}

export function planDataToLegacyContent(data) {
  const clean = sanitizePlanData(data);
  if (!clean) return '';

  const lines = [
    `# ${clean.meta.nombre || 'Plan nutritional'}`,
    '',
    `**Jugador:** ${clean.jugador.nombre}`,
    `**Posición:** ${clean.jugador.posicion}`,
    '',
    `Peso: ${clean.metricas.peso || '-'} kg | Grasa: ${clean.metricas.grasa || '-'}% | % P. Muscular Lee&cols: ${clean.metricas.pesoMuscular || '-'}%`,
    '',
  ];

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  daysOfWeek.forEach((dayKey) => {
    const item = clean.dias[dayKey];
    const dayTypeConfig = resolveDayTypeConfig(item.tipoDia);
    lines.push(`## ${item.label} (${dayTypeConfig.shortLabel || item.tipoDia})`);
    lines.push(`${item.kcal || '-'} kcal · Proteína ${item.proteina || '-'} g · Hidratos ${item.hidratos || '-'} g · Grasas ${item.grasa || '-'} g`);
    item.ingestas.forEach((meal) => lines.push(`- **${meal.nombre}:** ${meal.detalle}`));
    lines.push('');
  });

  if (clean.notas.length) {
    lines.push('## Notas');
    clean.notas.forEach((note) => lines.push(`- ${note}`));
  }

  return lines.join('\n');
}
