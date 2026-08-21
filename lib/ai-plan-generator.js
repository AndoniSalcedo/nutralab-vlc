import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { buildBasePlanData } from '@/lib/nutrition-plan-card';
import { env } from '@/config/env';
import { getObjectiveLabel } from '@/lib/calculations';
import { getLatestMenu } from '@/repositories/menuRepository';

const client = new Anthropic({ apiKey: env.AI_API_KEY });

function maxTokens() {
  const parsed = env.AI_PLAN_MAX_TOKENS;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 8192;
}

function extractJson(text) {
  const value = String(text || '').replace(/```json|```/g, '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('La IA no devolvió un JSON válido');
  }
  return JSON.parse(value.slice(start, end + 1));
}

export function sanitizeMealDetail(detalle) {
  if (!detalle || typeof detalle !== 'string') return '';
  let clean = detalle
    .replace(/\s*\(?\s*Total(\s+aprox)?(\s*:\s*|\s*=\s*)[^)]*?\)?\s*$/i, '')
    .replace(/\s*[-–—•]?\s*Total(\s+aprox)?(\s*:\s*|\s*=\s*).*$/i, '')
    .replace(/\s*\.?\s*Total(\s+aprox)?:\s*~?\d+\s*kcal.*$/i, '')
    .trim();
  clean = clean.replace(/[-–—•\s]+$/, '').trim();
  return clean;
}

export async function latestMenu(supabase, equipoId = null) {
  return getLatestMenu(supabase, equipoId);
}

function _menuToPrompt(menu, dayKey = null) {
  if (!menu?.dias?.length) return 'No hay menú semanal cargado en la ciudad deportiva.';

  if (dayKey) {
    const normKey = String(dayKey).toLowerCase();
    const dayMenu = menu.dias.find(d => String(d.dia).toLowerCase() === normKey);
    if (dayMenu) {
      const comida = dayMenu.comida
        ? [dayMenu.comida.primero, dayMenu.comida.segundo, dayMenu.comida.postre].filter(Boolean).join(' + ')
        : 'Sin comida';
      const cena = dayMenu.cena
        ? [dayMenu.cena.primero, dayMenu.cena.segundo, dayMenu.cena.postre].filter(Boolean).join(' + ')
        : 'Sin cena';
      return `Menú Ciudad Deportiva hoy: Comida (${comida}) | Cena (${cena})`;
    }
  }

  return menu.dias.map((dia) => {
    const comida = dia.comida
      ? [dia.comida.primero, dia.comida.segundo, dia.comida.postre].filter(Boolean).join(' + ')
      : 'Sin comida';
    const cena = dia.cena
      ? [dia.cena.primero, dia.cena.segundo, dia.cena.postre].filter(Boolean).join(' + ')
      : 'Sin cena';

    return `${dia.dia}: comida (${comida}); cena (${cena})`;
  }).join('\n');
}

function restrictionsToPrompt(jugador) {
  return [
    jugador.alergias ? `Alergias obligatorias a evitar: ${jugador.alergias}` : null,
    jugador.intolerancias ? `Intolerancias obligatorias a evitar: ${jugador.intolerancias}` : null,
    jugador.aversiones ? `Aversiones a evitar: ${jugador.aversiones}` : null,
  ].filter(Boolean).join('\n') || 'Sin restricciones registradas.';
}

function _playerContextToPrompt(jugador) {
  if (!jugador.nombre) throw new Error('Falta el nombre del jugador');
  if (!jugador.peso_kg) throw new Error(`Falta el peso del jugador ${jugador.nombre}`);
  if (!jugador.num_comidas) throw new Error(`Falta la configuración de comidas del jugador ${jugador.nombre}`);

  return [
    `Nombre: ${jugador.nombre} ${jugador.apellidos || ''}`,
    `Posición: ${jugador.posicion || 'No especificada'}`,
    `Número de comidas configuradas: ${jugador.num_comidas}${jugador.postentreno ? ' (+ Post-entreno en días de entreno/partido)' : ''}`,
    `Peso: ${jugador.peso_kg} kg | Grasa: ${jugador.porcentaje_grasa || '?'}% | Masa magra: ${jugador.masa_magra_kg || '?'} kg`,
    `Objetivo: ${getObjectiveLabel(jugador.objetivo) || jugador.objetivo || 'No especificado'}`,
    jugador.gustos_preferencias ? `Gustos/preferencias: ${jugador.gustos_preferencias}` : null,
    jugador.contexto_clinico ? `Contexto clínico: ${jugador.contexto_clinico}` : null,
    restrictionsToPrompt(jugador),
  ].filter(Boolean).join('\n');
}

export function calculateMealBudgets(day) {
  const { kcal, proteina, hidratos, grasa, ingestas } = day;
  if (!ingestas || ingestas.length === 0) return [];

  const mealNames = ingestas.map(i => i.nombre);
  const hasPost = mealNames.some(n => n.toLowerCase().includes('post'));
  const hasMerienda = mealNames.some(n => n.toLowerCase().includes('merienda'));

  if (!kcal || !proteina || !hidratos || !grasa) {
    throw new Error(`Datos nutricionales incompletos para el dia: kcal=${kcal}, proteina=${proteina}, hidratos=${hidratos}, grasa=${grasa}`);
  }

  let remKcal = kcal;
  let remP = proteina;
  let remHC = hidratos;
  let remG = grasa;

  const budgets = {};

  // 1. Post-entreno (batido de proteína aislado en agua)
  if (hasPost) {
    const postP = Math.min(30, Math.round(remP * 0.20));
    const postKcal = Math.round(postP * 4);
    budgets['Post-entreno'] = { kcal: postKcal, p: postP, hc: 0, g: 0 };
    remKcal -= postKcal;
    remP -= postP;
  }

  // 2. Merienda (si está configurada)
  if (hasMerienda) {
    const meriendaHC = Math.round(remHC * 0.16);
    const meriendaP = Math.round(remP * 0.10);
    const meriendaG = Math.round(remG * 0.08);
    const meriendaKcal = Math.round(meriendaP * 4 + meriendaHC * 4 + meriendaG * 9);
    budgets['Merienda'] = { kcal: meriendaKcal, p: meriendaP, hc: meriendaHC, g: meriendaG };
    remKcal -= meriendaKcal;
    remP -= meriendaP;
    remHC -= meriendaHC;
    remG -= meriendaG;
  }

  // 3. Reparto de comidas principales
  const mainMeals = mealNames.filter(n => !n.toLowerCase().includes('post') && !n.toLowerCase().includes('merienda'));
  const nMain = mainMeals.length;

  if (nMain === 1) {
    budgets[mainMeals[0]] = { kcal: remKcal, p: remP, hc: remHC, g: remG };
  } else if (nMain === 2) {
    // Comida & Cena (52% / 48%)
    const m1Kcal = Math.round(remKcal * 0.52);
    const m2Kcal = remKcal - m1Kcal;
    const m1P = Math.round(remP * 0.52);
    const m2P = remP - m1P;
    const m1HC = Math.round(remHC * 0.52);
    const m2HC = remHC - m1HC;
    const m1G = Math.round(remG * 0.50);
    const m2G = remG - m1G;

    budgets[mainMeals[0]] = { kcal: m1Kcal, p: m1P, hc: m1HC, g: m1G };
    budgets[mainMeals[1]] = { kcal: m2Kcal, p: m2P, hc: m2HC, g: m2G };
  } else if (nMain === 3) {
    // Desayuno (25%), Comida (40%), Cena (35%)
    const desKcal = Math.round(remKcal * 0.25);
    const comKcal = Math.round(remKcal * 0.40);
    const cenKcal = remKcal - desKcal - comKcal;

    const desP = Math.round(remP * 0.25);
    const comP = Math.round(remP * 0.40);
    const cenP = remP - desP - comP;

    const desHC = Math.round(remHC * 0.28);
    const comHC = Math.round(remHC * 0.42);
    const cenHC = remHC - desHC - comHC;

    const desG = Math.round(remG * 0.25);
    const comG = Math.round(remG * 0.40);
    const cenG = remG - desG - comG;

    budgets[mainMeals[0]] = { kcal: desKcal, p: desP, hc: desHC, g: desG };
    budgets[mainMeals[1]] = { kcal: comKcal, p: comP, hc: comHC, g: comG };
    budgets[mainMeals[2]] = { kcal: cenKcal, p: cenP, hc: cenHC, g: cenG };
  } else {
    mainMeals.forEach(name => {
      const share = 1 / nMain;
      budgets[name] = {
        kcal: Math.round(remKcal * share),
        p: Math.round(remP * share),
        hc: Math.round(remHC * share),
        g: Math.round(remG * share)
      };
    });
  }

  return ingestas.map(ing => ({
    nombre: ing.nombre,
    target: budgets[ing.nombre] || {
      kcal: Math.round(remKcal / ingestas.length),
      p: Math.round(remP / ingestas.length),
      hc: Math.round(remHC / ingestas.length),
      g: Math.round(remG / ingestas.length)
    }
  }));
}

export function preMatchForDay(preMatchConfig, dayKey, planOrBaseData, jugador) {
  if (!preMatchConfig || !preMatchConfig.enabled) return '';
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const dayLabels = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };

  let matchDayKeys = [];
  if (planOrBaseData?.dias) {
    matchDayKeys = daysOfWeek.filter((key) => planOrBaseData.dias[key]?.tipoDia === 'partido');
  }
  if (matchDayKeys.length === 0 && preMatchConfig.partidos) {
    matchDayKeys = Object.keys(preMatchConfig.partidos);
  }

  const parts = [];
  for (const matchDayKey of matchDayKeys) {
    const matchIndex = daysOfWeek.indexOf(matchDayKey);
    const prevDayKey = matchIndex !== -1 ? daysOfWeek[(matchIndex - 1 + 7) % 7] : 'viernes';

    if (dayKey === matchDayKey || dayKey === prevDayKey) {
      const matchDayConfig = preMatchConfig.partidos?.[matchDayKey] || { horario: preMatchConfig.horario || 'tarde', texto: preMatchConfig.texto || '' };
      const horario = matchDayConfig.horario || 'tarde';
      const playerConfig = jugador?.config_prepartido?.[horario] || {};

      if (dayKey === matchDayKey) {
        const recs = playerConfig.recomendaciones || {};
        const recsList = Object.entries(recs).filter(e => e[1]?.trim());
        let str = `DÍA DE PARTIDO (${dayLabels[matchDayKey]} - Horario: ${horario.toUpperCase()}):\n`;
        if (recsList.length > 0) {
          str += recsList.map(([m, r]) => `  - ${m}: ${r}`).join('\n');
        }
        if (matchDayConfig.texto) str += `\n  - Indicaciones equipo: ${matchDayConfig.texto}`;
        parts.push(str);
      } else if (dayKey === prevDayKey) {
        let str = `DÍA PREVIO AL PARTIDO DEL ${dayLabels[matchDayKey].toUpperCase()} (Ventana de 24h previas):\n`;
        if (playerConfig.dia_anterior) str += `  - Pauta 24h previas (aplicar exclusivamente en la Cena del día previo como cena de carga pre-partido): "${playerConfig.dia_anterior}"\n`;
        str += `  - Carga óptima de carbohidratos en las comidas principales para llenar depósitos de glucógeno.`;
        parts.push(str);
      }
    }
  }

  return parts.join('\n\n');
}

export function getMenuMealOptions(menu, dayKey, mealName) {
  if (!menu?.dias?.length || !dayKey || !mealName) return null;
  const normDay = String(dayKey).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const dayMenu = menu.dias.find((d) => {
    const dStr = String(d.dia || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return dStr.includes(normDay) || normDay.includes(dStr);
  });
  if (!dayMenu) return null;

  const normMeal = String(mealName).toLowerCase().trim();
  let mealData = null;
  if (normMeal === 'comida' || normMeal === 'almuerzo') {
    mealData = dayMenu.comida;
  } else if (normMeal === 'cena') {
    mealData = dayMenu.cena;
  }

  if (!mealData) return null;

  const parts = [];
  if (mealData.primero && String(mealData.primero).trim()) parts.push(`Primero: ${mealData.primero.trim()}`);
  if (mealData.segundo && String(mealData.segundo).trim()) parts.push(`Segundo: ${mealData.segundo.trim()}`);
  if (mealData.postre && String(mealData.postre).trim()) parts.push(`Postre: ${mealData.postre.trim()}`);

  return parts.length > 0 ? parts.join(' | ') : null;
}

export function buildMealAssemblySpec({ jugador, dayKey, dayData, menu, preMatchConfig, _recsForDay, mealBudgets }) {
  const isMatchDay = dayData.tipoDia === 'partido';
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const matchDayKeys = Object.keys(preMatchConfig?.partidos || {}).filter((k) => preMatchConfig?.partidos?.[k]?.horario);

  const matchKeyForPrev = matchDayKeys.find((mKey) => {
    const mIdx = daysOfWeek.indexOf(mKey);
    const prevIdx = (mIdx - 1 + 7) % 7;
    return daysOfWeek[prevIdx] === dayKey;
  });
  const isPrevToMatch = Boolean(matchKeyForPrev);

  const horario = isMatchDay
    ? (preMatchConfig?.partidos?.[dayKey]?.horario || preMatchConfig?.horario || 'tarde')
    : (matchKeyForPrev ? (preMatchConfig?.partidos?.[matchKeyForPrev]?.horario || 'tarde') : 'tarde');

  const playerPreMatch = jugador?.config_prepartido?.[horario] || {};

  return mealBudgets.map((m) => {
    const mealName = m.nombre;
    const normName = mealName.toLowerCase();
    const target = m.target;

    let basePropuesta = '';

    // Prioridad 1: Protocolo pre-partido / post-partido / carga previa
    if (normName.includes('post')) {
      basePropuesta = 'Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.';
    } else if (isMatchDay && playerPreMatch.recomendaciones?.[mealName]) {
      basePropuesta = `Pauta de dia de partido: ${playerPreMatch.recomendaciones[mealName]}`;
    } else if (isPrevToMatch && normName.includes('cena') && (playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena || playerPreMatch.dia_anterior)) {
      const cenaCarga = playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena || playerPreMatch.dia_anterior;
      basePropuesta = `Pauta cena de carga pre-partido (24h previas): ${cenaCarga}`;
      if (cenaCarga.toLowerCase().includes('ensure')) {
        basePropuesta += ' (Incluye 1 batido Ensure ~250 kcal y completa los hidratos y proteinas restantes con los alimentos pautados en crudo: patata, pollo y AOVE)';
      }
    } else {
      // Prioridad 2: Menu del comedor de la ciudad deportiva
      const menuComedor = getMenuMealOptions(menu, dayKey, mealName);
      if (menuComedor) {
        basePropuesta = `Menu comedor ciudad deportiva: ${menuComedor}`;
      } else if (jugador?.recomendaciones_defecto?.[mealName]) {
        // Prioridad 3: Recomendacion por defecto del perfil del jugador
        basePropuesta = jugador.recomendaciones_defecto[mealName];
      }
      // Si no hay nada, basePropuesta queda vacía → libre para la IA
    }

    const clinicalRestrictions = [jugador?.alergias, jugador?.intolerancias, jugador?.aversiones].filter(Boolean).join(' | ');

    const item = {
      nombre: mealName,
      objetivo: {
        kcal: target.kcal,
        proteina_g: target.p,
        hidratos_g: target.hc,
        grasa_g: target.g,
      },
    };

    if (basePropuesta) {
      item.base_propuesta = basePropuesta;
    }

    if (clinicalRestrictions) {
      item.restricciones_clinicas = clinicalRestrictions;
    }
    if (jugador?.gustos_preferencias) {
      item.preferencias_jugador = jugador.gustos_preferencias;
    }

    return item;
  });
}

export function buildDayPrompt({ jugador, dayKey, dayData, menu, preMatchConfig, contextoAdicional, recsForDay }) {
  const mealBudgets = calculateMealBudgets(dayData);
  const ingestasAGenerar = buildMealAssemblySpec({
    jugador,
    dayKey,
    dayData,
    menu,
    preMatchConfig,
    recsForDay,
    mealBudgets,
  });

  const payload = {
    rol: 'Carlos Ferrando, nutricionista del Valencia CF',
    tarea: `Disenar el detalle gastronomico de cada ingesta para el ${dayData.label} (${dayData.tipoDia}) calculando los gramos exactos en crudo para cumplir las macros fijadas.`,
    formato_salida_requerido: {
      ingestas: [
        {
          nombre: 'Nombre de la ingesta',
          detalle: 'Descripcion culinaria fluida con alimentos, preparacion y gramos exactos en crudo.',
        },
      ],
    },
    jugador: {
      nombre: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      posicion: jugador.posicion || 'No especificada',
      peso_kg: jugador.peso_kg,
      objetivo: getObjectiveLabel(jugador.objetivo) || jugador.objetivo,
      ...(jugador.contexto_clinico ? { contexto_clinico: jugador.contexto_clinico } : {}),
      ...([jugador.alergias ? `Alergias: ${jugador.alergias}` : null, jugador.intolerancias ? `Intolerancias: ${jugador.intolerancias}` : null, jugador.aversiones ? `Aversiones: ${jugador.aversiones}` : null].filter(Boolean).length > 0
        ? { alergias_intolerancias: [jugador.alergias ? `Alergias: ${jugador.alergias}` : null, jugador.intolerancias ? `Intolerancias: ${jugador.intolerancias}` : null, jugador.aversiones ? `Aversiones: ${jugador.aversiones}` : null].filter(Boolean).join(' | ') }
        : {}),
      ...(jugador.gustos_preferencias ? { preferencias: jugador.gustos_preferencias } : {}),
    },
    dia: {
      nombre: dayData.label,
      tipo: dayData.tipoDia,
      objetivos_totales: {
        kcal: dayData.kcal,
        proteina_g: dayData.proteina,
        hidratos_g: dayData.hidratos,
        grasa_g: dayData.grasa,
      },
    },
    contexto_adicional: contextoAdicional || 'Ajustar a las tolerancias y gustos del jugador',
    ingestas_a_generar: ingestasAGenerar,
    referencia_densidades_crudo: {
      cereales_crudos_100g: '~78g HC, ~360 kcal',
      tuberculos_100g: '~18-20g HC, ~80 kcal',
      frutas_150g: '~20-35g HC',
      carnes_pescados_crudos_100g: '~22g Proteina, ~110-130 kcal',
      huevos_100g_2_unidades: '~13g Proteina, ~10g Grasa, ~140 kcal',
      aove_10g: '90 kcal, 10g Grasa',
    },
    reglas_calidad_nutricional: [
      'ADAPTACION A BASE Y RESTRICCIONES: Para cada comida toma su "base_propuesta", adaptala respetando siempre las restricciones clinicas (alergias/intolerancias/aversiones) y selecciona los alimentos idoneos.',
      'CUADRE MATEMATICO EXACTO: Los alimentos de cada ingesta deben sumar con precision las calorias y macronutrientes fijados en su objetivo.',
      'GRAMOS EN CRUDO: Especifica siempre el peso en gramos (g) en crudo de cada alimento (arroz, pasta, pollo, patata, fruta, AOVE).',
      'REDACCION CULINARIA LIMPIA: Redacta una descripcion gastronomica natural y apetecible en segunda persona (tu).',
      'PROHIBIDO RESUMENES NUMERICOS: NUNCA escribas al final del texto coletillas como "Total aprox:", "Total:", "kcal", "P:", "HC:", "G:" ni balances matematicos.',
      'PROHIBIDO LISTAS TELEGRAFICAS: NO uses listas unidas por el signo "+". Redacta frases completas.',
      'VERDURAS CONCRETAS: Nombra siempre verduras especificas (calabacin, zanahoria, espinacas, judias verdes). NUNCA uses nombres genericos como "vegetales bajos en FODMAP".',
    ],
  };

  const payloadJson = JSON.stringify(payload, null, 2);

  return [
    'INSTRUCCIÓN CRÍTICA:',
    'Devuelve ÚNICAMENTE un objeto JSON válido que contenga la clave "ingestas".',
    'NO incluyas texto explicativo, encabezados Markdown ni introducciones.',
    'ESTRUCTURA DE RESPUESTA OBLIGATORIA:',
    '{',
    '  "ingestas": [',
    '    {',
    '      "nombre": "Nombre de la ingesta",',
    '      "detalle": "Texto gastronómico fluido con los alimentos, preparación y gramos exactos en crudo."',
    '    }',
    '  ]',
    '}',
    '',
    'ESPECIFICACIÓN DEL PLAN EN FORMATO JSON:',
    payloadJson,
  ].join('\n');
}

export async function generateSingleDay({ jugador, dayKey, dayData, menu, preMatchConfig, contextoAdicional, recsForDay }) {
  const prompt = buildDayPrompt({
    jugador,
    dayKey,
    dayData,
    menu,
    preMatchConfig,
    contextoAdicional,
    recsForDay,
  });

  const res = await client.messages.create({
    model: env.AI_MODEL,
    max_tokens: maxTokens(),
    thinking: { type: 'adaptive' },
    output_config: { effort: env.AI_PLAN_THINKING_EFFORT || 'low' },
    messages: [{ role: 'user', content: prompt }],
  });

  const text = res.content.find((c) => c.type === 'text')?.text || '';
  let json;
  try {
    json = extractJson(text);
  } catch (e) {
    throw new Error(`Respuesta inválida en día ${dayKey}: ${e.message}`);
  }

  if (!json.ingestas || !Array.isArray(json.ingestas) || json.ingestas.length === 0) {
    throw new Error(`La IA no devolvio ingestas validas para el dia ${dayKey}`);
  }
  const rawIngestas = json.ingestas;
  const sanitizedIngestas = rawIngestas.map((ing) => ({
    ...ing,
    detalle: sanitizeMealDetail(ing.detalle),
  }));

  return {
    dayKey,
    ingestas: sanitizedIngestas,
  };
}

export async function generateWeeklyPlanParallel({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  const dayPromises = daysOfWeek.map((dayKey) => {
    const dayData = baseData.dias[dayKey];
    const recsForDay = recomendacionesIngestas ? recommendationsToPrompt(recomendacionesIngestas) : '';

    return generateSingleDay({
      jugador,
      dayKey,
      dayData,
      menu,
      preMatchConfig,
      contextoAdicional,
      recsForDay,
    });
  });

  const dayResults = await Promise.all(dayPromises);
  const dias = {};
  for (const res of dayResults) {
    dias[res.dayKey] = {
      ...baseData.dias[res.dayKey],
      ingestas: res.ingestas,
    };
  }

  return {
    ...baseData,
    dias,
  };
}

function recommendationsToPrompt(recs) {
  if (!recs || typeof recs !== 'object') return '';
  const entries = Object.entries(recs).filter((entry) => entry[1] && entry[1].trim() !== '');
  if (entries.length === 0) return '';
  return entries.map(([meal, rec]) => `- Para ${meal}: ${rec}`).join('\n');
}

function buildWeeklyNotesPrompt({ jugador, _planData, _preMatchConfig, contextoAdicional }) {
  return [
    `Eres Carlos Ferrando, nutricionista del Valencia CF.`,
    `A partir de este plan nutricional semanal generado para ${jugador.nombre} ${jugador.apellidos} (${jugador.posicion || 'Jugador'}), genera exactamente 4 indicaciones/consejos clave de la semana (notes).`,
    `Devuelve ÚNICAMENTE un objeto JSON: {"notes": ["nota 1", "nota 2", "nota 3", "nota 4"]}`,
    ``,
    `DATOS CLÍNICOS:`,
    `- Objetivo: ${getObjectiveLabel(jugador.objetivo) || jugador.objetivo}`,
    `- Contexto clínico: ${jugador.contexto_clinico || 'Sin particularidades'}`,
    `- Alergias/Intolerancias: ${jugador.alergias || ''} ${jugador.intolerancias || ''}`,
    `- Preferencias: ${jugador.gustos_preferencias || 'No especificadas'}`,
    contextoAdicional ? `- Pautas globales: ${contextoAdicional}` : '',
    ``,
    `REGLAS:`,
    `- Tono: Dirígete SIEMPRE al jugador en segunda persona del singular ("tú") de forma cercana y profesional.`,
    `- Las notas deben ser prácticas: hidratación, descanso, pauta pre-partido si aplica, digestión y adherencia a sus gramos.`
  ].filter(Boolean).join('\n');
}

export async function reviewAndRepairPlanData({ jugador, contextoAdicional, _menu, planData, _teamConfig, _recomendacionesIngestas, _preMatchConfig }) {
  try {
    const res = await client.messages.create({
      model: env.AI_MODEL || 'claude-sonnet-5',
      max_tokens: 1000,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: buildWeeklyNotesPrompt({ jugador, planData, preMatchConfig, contextoAdicional }) }],
    });

    const text = res.content.find((c) => c.type === 'text')?.text || '';
    const json = extractJson(text);
    if (Array.isArray(json.notes) && json.notes.length > 0) {
      return {
        ...planData,
        notes: json.notes,
      };
    }
  } catch (error) {
    console.warn('Weekly notes generation fallback:', error.message);
  }

  return {
    ...planData,
    notes: [
      'Ajusta la hidratación según la intensidad de la sesión y la sudoración.',
      'Respeta los gramajes en crudo indicados para cada comida.',
      'Toma el batido post-entreno en los primeros 30 minutos tras finalizar la sesión.',
      'Mantén las pautas de descanso nocturno y digestión adecuada.',
    ],
  };
}

export async function generarDatosPlan({ jugador, nombre, contexto, contextoAdicional, calendario, menu, teamConfig, recomendacionesIngestas, preMatchConfig }) {
  const supabase = getSupabaseAdmin();
  const resolvedMenu = menu !== undefined ? menu : await latestMenu(supabase, jugador?.equipo_id);
  const baseData = buildBasePlanData({ jugador, nombre, contexto: contexto || 'semana_normal', contextoAdicional, menu: resolvedMenu, calendario, preMatchConfig, teamConfig });

  let generatedPlan = baseData;

  try {
    generatedPlan = await generateWeeklyPlanParallel({
      jugador,
      baseData,
      menu: resolvedMenu,
      preMatchConfig,
      contextoAdicional,
      recomendacionesIngestas,
    });
  } catch (error) {
    console.warn('Error in parallel generation, falling back to baseData:', error.message);
  }

  const finalPlan = await reviewAndRepairPlanData({
    jugador,
    contextoAdicional,
    menu: resolvedMenu,
    planData: generatedPlan,
    teamConfig,
    recomendacionesIngestas,
    preMatchConfig,
  });

  return {
    ...finalPlan,
    meta: {
      ...finalPlan.meta,
      nombre,
      contexto: contexto || 'semana_normal',
      contextoAdicional,
      recomendacionesIngestas: recomendacionesIngestas || {},
      preMatchConfig: preMatchConfig || null,
    },
  };
}
