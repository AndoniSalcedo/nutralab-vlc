import { cunninghamPlan } from './calculations.js';
import { getDefaultNutritionMealDetail, PLAN_DAY_TYPES } from './nutrition-day-types.js';

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

function calculateMacros(metricas, config) {
  const weight = numberOrNull(metricas?.peso, 1);
  if (!weight) {
    return {
      kcal: null,
      proteina: null,
      hidratos: null,
      grasa: null,
    };
  }

  const plan = cunninghamPlan({
    weightKg: weight,
    bodyFatPct: metricas?.grasa,
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

function defaultMealDetail(dayKey, mealName, menu) {
  const latestDay = Array.isArray(menu?.dias) ? menu.dias[0] : null;
  const comida = latestDay?.comida;
  const cena = latestDay?.cena;

  if (mealName.toLowerCase().includes('comida') && comida) {
    return [comida.primero, comida.segundo, comida.postre].filter(Boolean).join(' + ');
  }

  if (mealName.toLowerCase() === 'cena' && cena) {
    return [cena.primero, cena.segundo, cena.postre].filter(Boolean).join(' + ');
  }

  return getDefaultNutritionMealDetail(dayKey, mealName);
}

export function buildBasePlanData({ jugador, nombre, contexto, contextoAdicional, menu }) {
  const fullName = cleanText(`${jugador?.nombre || ''} ${jugador?.apellidos || ''}`) || 'Jugador';
  const metricas = {
    peso: numberOrNull(jugador?.peso_kg, 1),
    grasa: numberOrNull(jugador?.porcentaje_grasa, 1),
    masaMagra: numberOrNull(jugador?.masa_magra_kg, 1),
    pesoObjetivo: numberOrNull(jugador?.peso_deseable, 1),
  };

  const tiposDia = {};
  PLAN_DAY_TYPES.forEach((dayType) => {
    const macros = calculateMacros(metricas, dayType);
    tiposDia[dayType.key] = {
      key: dayType.key,
      label: dayType.label,
      shortLabel: dayType.shortLabel,
      kcalLabel: dayType.kcalLabel,
      ...macros,
      ingestas: dayType.meals.map((name) => ({
        nombre: name,
        detalle: defaultMealDetail(dayType.key, name, menu),
      })),
    };
  });

  return {
    version: 1,
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
    },
    metricas: {
      ...metricas,
    },
    tiposDia,
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
    pesoObjetivo: numberOrNull(data.metricas?.pesoObjetivo, 1),
  };

  const baseTypes = {};
  PLAN_DAY_TYPES.forEach((dayType) => {
    const incoming = data.tiposDia?.[dayType.key] || {};
    const fallbackMacros = calculateMacros(metricas, dayType);
    const mealFallback = dayType.meals.map((name) => ({
      nombre: name,
      detalle: defaultMealDetail(dayType.key, name),
    }));
    baseTypes[dayType.key] = {
      key: dayType.key,
      label: cleanText(incoming.label) || dayType.label,
      shortLabel: cleanText(incoming.shortLabel) || dayType.shortLabel,
      kcalLabel: cleanText(incoming.kcalLabel) || dayType.kcalLabel,
      kcal: numberOrNull(incoming.kcal, 0) ?? fallbackMacros.kcal,
      proteina: numberOrNull(incoming.proteina, 0) ?? fallbackMacros.proteina,
      hidratos: numberOrNull(incoming.hidratos, 0) ?? fallbackMacros.hidratos,
      grasa: numberOrNull(incoming.grasa, 0) ?? fallbackMacros.grasa,
      ingestas: normalizeMealList(incoming.ingestas, mealFallback),
    };
  });

  return {
    version: 1,
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
    },
    metricas: {
      ...metricas,
    },
    tiposDia: baseTypes,
    notas: Array.isArray(data.notas)
      ? data.notas.map(cleanText).filter(Boolean).slice(0, 6)
      : [],
  };
}

export function mergeAiPlanData(baseData, aiData) {
  const merged = JSON.parse(JSON.stringify(baseData));

  PLAN_DAY_TYPES.forEach((dayType) => {
    const incoming = aiData?.tiposDia?.[dayType.key];
    if (!incoming) return;
    merged.tiposDia[dayType.key].ingestas = normalizeMealList(
      incoming.ingestas,
      merged.tiposDia[dayType.key].ingestas
    );
  });

  if (Array.isArray(aiData?.notas) && aiData.notas.length) {
    merged.notas = aiData.notas.map(cleanText).filter(Boolean).slice(0, 6);
  }

  return sanitizePlanData(merged);
}

export function planDataToLegacyContent(data) {
  const clean = sanitizePlanData(data);
  if (!clean) return '';

  const lines = [
    `# ${clean.meta.nombre || 'Plan nutricional'}`,
    '',
    `**Jugador:** ${clean.jugador.nombre}`,
    `**Posición:** ${clean.jugador.posicion}`,
    '',
    `Peso: ${clean.metricas.peso || '-'} kg | Grasa: ${clean.metricas.grasa || '-'}% | Masa magra: ${clean.metricas.masaMagra || '-'} kg`,
    '',
  ];

  PLAN_DAY_TYPES.forEach((dayType) => {
    const item = clean.tiposDia[dayType.key];
    lines.push(`## ${item.label}`);
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
