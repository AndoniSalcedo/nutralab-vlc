import { calculateByObjective } from './calculations.js';
import { PLAN_DAY_TYPES, getUserMealsForDay } from './nutrition-day-types.js';
import { cleanText, numberOrNull, normalizeKey } from './utils.js';

export { PLAN_DAY_TYPES };

export const PLAN_THEME_PRESETS = [
  {
    id: 'midnight_dark',
    name: 'Midnight Dark (Defecto)',
    description: 'Azul noche profundo con toques ámbar y teal',
    colors: {
      cardTopBg: '#254d5c',
      cardTopText: '#cad6df',
      cardBodyBg: '#101229',
      cardBodyText: '#ffffff',
      boxBg: '#151932',
      boxBorder: '#1f2444',
      itemBg: '#1d1f46',
      accentText: '#ffa94d',
      itemText: '#dee2e6',
    },
    swatches: ['#101229', '#254d5c', '#ffa94d', '#151932']
  },
  {
    id: 'obsidian_orange',
    name: 'Obsidian & Orange',
    description: 'Negro antracita mate y naranja vibrante de alto contraste',
    colors: {
      cardTopBg: '#18181b',
      cardTopText: '#fdba74',
      cardBodyBg: '#09090b',
      cardBodyText: '#ffffff',
      boxBg: '#141416',
      boxBorder: '#222226',
      itemBg: '#1e1e22',
      accentText: '#f97316',
      itemText: '#e4e4e7',
    },
    swatches: ['#09090b', '#18181b', '#f97316', '#141416']
  },
  {
    id: 'emerald_health',
    name: 'Emerald Health',
    description: 'Verde bosque y menta clínica para nutrición y rendimiento',
    colors: {
      cardTopBg: '#064e3b',
      cardTopText: '#a7f3d0',
      cardBodyBg: '#062420',
      cardBodyText: '#ecfdf5',
      boxBg: '#0b3832',
      boxBorder: '#0d473d',
      itemBg: '#0f4941',
      accentText: '#34d399',
      itemText: '#d1fae5',
    },
    swatches: ['#062420', '#064e3b', '#34d399', '#0b3832']
  },
  {
    id: 'ocean_blue',
    name: 'Ocean Blue Pro',
    description: 'Azul marino con acentos cian y tipografía limpia',
    colors: {
      cardTopBg: '#0c4a6e',
      cardTopText: '#bae6fd',
      cardBodyBg: '#03182b',
      cardBodyText: '#f0f9ff',
      boxBg: '#082f49',
      boxBorder: '#0b3c5d',
      itemBg: '#0c4a6e',
      accentText: '#38bdf8',
      itemText: '#e0f2fe',
    },
    swatches: ['#03182b', '#0c4a6e', '#38bdf8', '#082f49']
  },
  {
    id: 'clean_light',
    name: 'Clean Light / Papel',
    description: 'Modo claro minimalista para lectura diurna o impresión',
    colors: {
      cardTopBg: '#e2e8f0',
      cardTopText: '#0f172a',
      cardBodyBg: '#f8fafc',
      cardBodyText: '#0f172a',
      boxBg: '#ffffff',
      boxBorder: '#e2e8f0',
      itemBg: '#f1f5f9',
      accentText: '#ea580c',
      itemText: '#334155',
    },
    swatches: ['#f8fafc', '#e2e8f0', '#ea580c', '#ffffff']
  },
  {
    id: 'cyber_violet',
    name: 'Cyber Violet',
    description: 'Púrpura y fucsia vibrante de alto rendimiento',
    colors: {
      cardTopBg: '#4c1d95',
      cardTopText: '#e9d5ff',
      cardBodyBg: '#130924',
      cardBodyText: '#faf5ff',
      boxBg: '#1e1138',
      boxBorder: '#29184b',
      itemBg: '#2a184e',
      accentText: '#c084fc',
      itemText: '#f3e8ff',
    },
    swatches: ['#130924', '#4c1d95', '#c084fc', '#1e1138']
  }
];


function roundMacro(value) {
  return numberOrNull(value, 0);
}

function calculateMacros(metricas, config, objectiveKey, teamConfig) {
  const weight = numberOrNull(metricas?.peso, 1);
  if (!weight) {
    return {
      kcal: null,
      proteina: null,
      hidratos: null,
      grasa: null,
    };
  }

  const activeObjective = objectiveKey || 'mejora_rendimiento';

  const result = calculateByObjective({ weightKg: weight, objectiveKey: activeObjective, dayTypeKey: config.key, teamConfig });
  if (result) {
    return {
      kcal: roundMacro(result.kcal),
      proteina: roundMacro(result.protein),
      hidratos: roundMacro(result.cho),
      grasa: roundMacro(result.fat),
    };
  }

  return {
    kcal: null,
    proteina: null,
    hidratos: null,
    grasa: null,
  };
}

import { getTeamNutritionDayTypes } from './calculations.js';

function resolveDayTypeConfig(tipoDia, teamConfig) {
  const types = getTeamNutritionDayTypes(teamConfig);
  return types.find((t) => t.key === tipoDia) || types[0];
}

function findMenuForDay(dayKey, menu) {
  if (!menu || !Array.isArray(menu.dias)) return null;
  const normalizedKey = normalizeKey(dayKey);
  return menu.dias.find(d => {
    return normalizeKey(d.dia) === normalizedKey;
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

export function buildBasePlanData({ jugador, nombre, contexto, contextoAdicional, menu, calendario, preMatchConfig, teamConfig, suplementacion, protocolos }) {
  const fullName = cleanText(`${jugador?.nombre || ''} ${jugador?.apellidos || ''}`) || 'Jugador';
  const metricas = {
    peso: numberOrNull(jugador?.peso_kg, 1),
    grasa: numberOrNull(jugador?.porcentaje_grasa, 1),
    masaMagra: numberOrNull(jugador?.peso_magro ?? jugador?.masa_magra_kg, 1),
    pesoMuscular: numberOrNull(jugador?.peso_muscular_pct, 1),
  };

  if (!calendario || typeof calendario !== 'object') {
    throw new Error('El calendario de tipos de día es obligatorio para generar el plan. Debes asignar el tipo de día (entreno, descanso, etc.) para cada día de la semana.');
  }

  if (!jugador?.num_comidas) {
    throw new Error(`El jugador ${fullName} no tiene configurado el 'Número de comidas'. Por favor, configúralo en su ficha antes de generar un plan.`);
  }

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  for (const dayKey of daysOfWeek) {
    if (!calendario[dayKey]) {
      throw new Error(`Falta configurar el tipo de día para el ${dayKey} en el calendario de la semana.`);
    }
  }

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
    const tipoDia = calendario[dayKey];
    const dayTypeConfig = resolveDayTypeConfig(tipoDia, teamConfig);
    const macros = calculateMacros(metricas, dayTypeConfig, objectiveKey, teamConfig);

    dias[dayKey] = {
      dayKey,
      label: dayLabels[dayKey],
      tipoDia,
      ...macros,
      ingestas: getUserMealsForDay(jugador, tipoDia, teamConfig, preMatchConfig, dayKey).map((name) => ({
        nombre: name,
        detalle: defaultMealDetail(dayKey, tipoDia, name, menu),
      })),
    };
  });

  const teamProtocols = teamConfig?.protocols || jugador?.equipos?.configuracion_nutricional?.protocols || [];
  const customProtocols = jugador?.protocolos_custom || {};
  const activeDayTypes = new Set(Object.values(calendario || {}));

  const resolvedProtocols = Array.isArray(protocolos) && protocolos.length > 0
    ? protocolos
    : teamProtocols
        .map((p) => customProtocols[p.id] || p)
        .filter((p) => {
          const isIncluded = p.incluirEnPlan !== false && (p.incluirEnPlan === true || p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido')));
          if (!isIncluded) return false;
          if (p.dayTypeKey && activeDayTypes.size > 0) {
            return activeDayTypes.has(p.dayTypeKey);
          }
          return true;
        });

  return {
    version: 2,
    meta: {
      nombre: cleanText(nombre) || `Plan ${new Date().toLocaleDateString('es-ES')}`,
      contexto: contexto || 'semana_normal',
      contextoAdicional: cleanText(contextoAdicional),
      semanaMenu: menu?.semana || null,
      preMatchConfig: preMatchConfig || null,
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
    suplementacion: Array.isArray(suplementacion) ? suplementacion : [],
    protocolos: resolvedProtocols,
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

export function sanitizePlanData(data, teamConfig) {
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

    const dayTypeConfig = resolveDayTypeConfig(resolvedTipoDia, teamConfig);
    const fallbackMacros = calculateMacros(metricas, dayTypeConfig, objectiveKey, teamConfig);
    const fallbackMeals = getUserMealsForDay(data.jugador, resolvedTipoDia, teamConfig);
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
      preMatchConfig: data.meta?.preMatchConfig || null,
      fecha: data.meta?.fecha || new Date().toISOString(),
      planColors: data.meta?.planColors || data.planColors || null,
      recomendacionesIngestas: typeof data.meta?.recomendacionesIngestas === 'object' && data.meta?.recomendacionesIngestas
        ? Object.fromEntries(
            Object.entries(data.meta.recomendacionesIngestas).map(([k, v]) => [k, cleanText(v)])
          )
        : {},
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
    suplementacion: Array.isArray(data.suplementacion)
      ? data.suplementacion.map((s) => ({
          id: s.id,
          nombre: cleanText(s.nombre),
          categoria: cleanText(s.categoria) || 'Suplemento',
          dosis: cleanText(s.dosis),
          timing: cleanText(s.timing),
          notas: cleanText(s.notas),
        })).filter((s) => s.nombre)
      : (Array.isArray(data.suplementos)
          ? data.suplementos.map((s) => ({
              id: s.id,
              nombre: cleanText(s.nombre || s.suplemento?.nombre),
              categoria: cleanText(s.categoria || s.suplemento?.categoria) || 'Suplemento',
              dosis: cleanText(s.dosis || s.dose?.value || s.pauta),
              timing: cleanText(s.timing || s.timing_override || s.suplemento?.timing),
              notas: cleanText(s.notas || s.note_override || s.suplemento?.notas || s.suplemento?.descripcion),
            })).filter((s) => s.nombre)
          : []),
    protocolos: Array.isArray(data.protocolos)
      ? data.protocolos.map((p) => ({
          id: p.id,
          dayTypeKey: p.dayTypeKey,
          name: cleanText(p.name),
          incluirEnPlan: p.incluirEnPlan !== undefined ? Boolean(p.incluirEnPlan) : (p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido'))),
          timeline: Array.isArray(p.timeline) ? p.timeline.map((t) => ({
            id: t.id,
            timeLabel: cleanText(t.timeLabel),
            title: cleanText(t.title),
            description: cleanText(t.description),
            icon: t.icon || 'IconFlag',
          })) : [],
          checklist: Array.isArray(p.checklist) ? p.checklist.map((c) => ({
            id: c.id,
            title: cleanText(c.title),
            description: cleanText(c.description),
          })) : [],
        })).filter((p) => p.name)
      : [],
    notas: Array.isArray(data.notas)
      ? data.notas.map(cleanText).filter(Boolean).slice(0, 6)
      : [],
  };
}

export function mergeAiPlanData(baseData, aiData, teamConfig) {
  const merged = JSON.parse(JSON.stringify(baseData));

  const aiDias = aiData?.dias || aiData?.fichas || aiData;

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  daysOfWeek.forEach((dayKey) => {
    const incoming = aiDias?.[dayKey];
    if (!incoming) return;

    if (Array.isArray(incoming.ingestas)) {
      const baseIngestas = merged.dias[dayKey]?.ingestas || [];

      if (baseIngestas.length > 0) {
        merged.dias[dayKey].ingestas = baseIngestas.map((baseMeal) => {
          const baseName = cleanText(baseMeal.nombre).toLowerCase();

          let matching = incoming.ingestas.find(
            (aiMeal) => cleanText(aiMeal.nombre).toLowerCase() === baseName
          );

          if (!matching) {
            matching = incoming.ingestas.find((aiMeal) => {
              const aiName = cleanText(aiMeal.nombre).toLowerCase();
              return aiName.includes(baseName) || baseName.includes(aiName);
            });
          }

          return {
            nombre: baseMeal.nombre,
            detalle: matching ? (cleanText(matching.detalle) || '') : (cleanText(baseMeal.detalle) || ''),
          };
        });
      } else {
        merged.dias[dayKey].ingestas = incoming.ingestas.map((meal) => ({
          nombre: cleanText(meal.nombre) || 'Ingesta',
          detalle: cleanText(meal.detalle) || '',
        }));
      }
    }
  });

  if (Array.isArray(aiData?.notes)) {
    merged.notas = aiData.notes;
  } else if (Array.isArray(aiData?.notas)) {
    merged.notas = aiData.notas;
  }

  return sanitizePlanData(merged, teamConfig);
}

export function planDataToLegacyContent(data, teamConfig) {
  const clean = sanitizePlanData(data, teamConfig);
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
    const dayTypeConfig = resolveDayTypeConfig(item.tipoDia, teamConfig);
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
