export const PLAN_DAY_TYPES = [
  {
    key: 'entreno',
    label: 'Día entreno',
    shortLabel: 'Entreno',
    kcalLabel: 'Día entreno',
    proteinGkg: 2.1,
    carbsGkg: 2.6,
    fatGkg: 0.7,
    meals: ['Desayuno', 'Batido post', 'Comida', 'Merienda', 'Cena'],
  },
  {
    key: 'descanso',
    label: 'Día descanso',
    shortLabel: 'Descanso',
    kcalLabel: 'Día descanso',
    proteinGkg: 2.1,
    carbsGkg: 1.6,
    fatGkg: 0.8,
    meals: ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'],
  },
  {
    key: 'partido',
    label: 'Día partido',
    shortLabel: 'Partido',
    kcalLabel: 'Día partido',
    proteinGkg: 1.9,
    carbsGkg: 5,
    fatGkg: 0.65,
    meals: ['Desayuno', 'Comida pre', '-60 min', 'Durante', 'Post'],
  },
];

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

function calculateMacros(weightKg, config) {
  const weight = numberOrNull(weightKg, 1);
  if (!weight) {
    return {
      kcal: null,
      proteina: null,
      hidratos: null,
      grasa: null,
    };
  }

  const proteina = roundMacro(weight * config.proteinGkg);
  const hidratos = roundMacro(weight * config.carbsGkg);
  const grasa = roundMacro(weight * config.fatGkg);
  const kcal = roundMacro(proteina * 4 + hidratos * 4 + grasa * 9);

  return { kcal, proteina, hidratos, grasa };
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

  const defaults = {
    entreno: {
      Desayuno: 'Yogur proteico + avena + fruta',
      'Batido post': 'Whey 30 g + plátano + creatina 3-5 g',
      Comida: 'Plato principal del comedor + ración de hidrato + verdura',
      Merienda: 'Yogur proteico + tortitas de arroz + fruta',
      Cena: 'Proteína magra + hidrato según carga + verdura',
    },
    descanso: {
      Desayuno: 'Huevos o yogur proteico + fruta',
      'Media mañana': 'Fruta + frutos secos o infusión',
      Comida: 'Plato del comedor priorizando proteína y verdura',
      Merienda: 'Yogur proteico o queso fresco + fruta',
      Cena: 'Pescado/huevos/carne magra + verdura',
    },
    partido: {
      Desayuno: 'Pan/arroz con mermelada + fruta + proteína ligera',
      'Comida pre': 'Hidrato principal + proteína baja en grasa + verdura cocida',
      '-60 min': 'Bebida isotónica + plátano o dátiles + cafeína si está pautada',
      Durante: 'Isotónica cada 15 min; gel si procede',
      Post: 'Whey 30 g + hidratos rápidos + electrolitos',
    },
  };

  return defaults[dayKey]?.[mealName] || '';
}

export function buildBasePlanData({ jugador, nombre, contexto, contextoAdicional, menu }) {
  const weightKg = numberOrNull(jugador?.peso_kg, 1);
  const fullName = cleanText(`${jugador?.nombre || ''} ${jugador?.apellidos || ''}`) || 'Jugador';

  const tiposDia = {};
  PLAN_DAY_TYPES.forEach((dayType) => {
    const macros = calculateMacros(weightKg, dayType);
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
      peso: numberOrNull(jugador?.peso_kg, 1),
      grasa: numberOrNull(jugador?.porcentaje_grasa, 1),
      masaMagra: numberOrNull(jugador?.masa_magra_kg, 1),
      pesoObjetivo: numberOrNull(jugador?.peso_deseable, 1),
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

  const baseTypes = {};
  PLAN_DAY_TYPES.forEach((dayType) => {
    const incoming = data.tiposDia?.[dayType.key] || {};
    baseTypes[dayType.key] = {
      key: dayType.key,
      label: cleanText(incoming.label) || dayType.label,
      shortLabel: cleanText(incoming.shortLabel) || dayType.shortLabel,
      kcalLabel: cleanText(incoming.kcalLabel) || dayType.kcalLabel,
      kcal: numberOrNull(incoming.kcal, 0),
      proteina: numberOrNull(incoming.proteina, 0),
      hidratos: numberOrNull(incoming.hidratos, 0),
      grasa: numberOrNull(incoming.grasa, 0),
      ingestas: normalizeMealList(incoming.ingestas, dayType.meals.map((name) => ({ nombre: name, detalle: '' }))),
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
      peso: numberOrNull(data.metricas?.peso, 1),
      grasa: numberOrNull(data.metricas?.grasa, 1),
      masaMagra: numberOrNull(data.metricas?.masaMagra, 1),
      pesoObjetivo: numberOrNull(data.metricas?.pesoObjetivo, 1),
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
