import { getSupabaseAdmin } from '@/lib/supabase/server';
import { buildBasePlanData } from '@/lib/nutrition/plan-card';
import { env } from '@/config/env';
import { getObjectiveLabel } from '@/config/nutrition-days';
import { getLatestMenu } from '@/repositories/menuRepository';
import { calibrateMeal, FOOD_NAMES_LIST } from '@/lib/nutrition/calculator';
import { AI_NUTRITION_RULES, buildWeeklyPromptEnvelope } from '@/config/ai-prompts';
import { aiClient as client, getMaxTokens as maxTokens } from './client';

function extractJson(text) {
  const value = String(text || '').replace(/```json|```/g, '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('La IA no devolvió un JSON válido');
  }
  return JSON.parse(value.slice(start, end + 1));
}

export async function latestMenu(supabase, equipoId = null) {
  return getLatestMenu(supabase, equipoId);
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

  // 1. Post-entreno / Post-partido (batido de proteína o recovery)
  const postMealName = mealNames.find(n => n.toLowerCase().includes('post')) || 'Post-entreno';
  if (hasPost) {
    const postP = Math.min(30, Math.round(remP * 0.20));
    const postKcal = Math.round(postP * 4);
    budgets[postMealName] = { kcal: postKcal, p: postP, hc: 0, g: 0 };
    budgets['Post-entreno'] = { kcal: postKcal, p: postP, hc: 0, g: 0 };
    budgets['Post-partido'] = { kcal: postKcal, p: postP, hc: 0, g: 0 };
    remKcal -= postKcal;
    remP -= postP;
  }

  // 2. Merienda (si está configurada)
  if (hasMerienda) {
    const meriendaHC = Math.round(remHC * 0.20);
    const meriendaP = Math.round(remP * 0.15);
    const meriendaG = Math.round(remG * 0.12);
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
    // Desayuno (28%), Comida (42%), Cena (30%)
    const desKcal = Math.round(remKcal * 0.28);
    const comKcal = Math.round(remKcal * 0.42);
    const cenKcal = remKcal - desKcal - comKcal;

    const desP = Math.round(remP * 0.28);
    const comP = Math.round(remP * 0.42);
    const cenP = remP - desP - comP;

    const desHC = Math.round(remHC * 0.30);
    const comHC = Math.round(remHC * 0.42);
    const cenHC = remHC - desHC - comHC;

    const desG = Math.round(remG * 0.28);
    const comG = Math.round(remG * 0.42);
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

export function filterDishOptionsByRestrictions(dishText, jugador) {
  if (!dishText || typeof dishText !== 'string' || !jugador) {
    return { filteredText: dishText || '', hasConflict: false, allExcluded: false };
  }

  const rawRestr = `${jugador.alergias || ''} ${jugador.intolerancias || ''} ${jugador.aversiones || ''}`.toLowerCase();
  if (!rawRestr.trim() || rawRestr.includes('nada') || rawRestr.includes('ningun')) {
    return { filteredText: dishText, hasConflict: false, allExcluded: false };
  }

  const restrictions = [];
  if (rawRestr.includes('pescado') || rawRestr.includes('marisco') || rawRestr.includes('fish')) {
    restrictions.push({
      type: 'pescado',
      keywords: ['pescado', 'merluza', 'dorada', 'lubina', 'corvina', 'bacalao', 'salmon', 'salmón', 'atun', 'atún', 'emperador', 'sepia', 'calamar', 'pulpo', 'gamba', 'gambas', 'langostino', 'marisco', 'fideua de pescado', 'pez espada', 'bonito']
    });
  }
  if (rawRestr.includes('cerdo') || rawRestr.includes('pork')) {
    restrictions.push({
      type: 'cerdo',
      keywords: ['cerdo', 'secreto', 'secreto ibérico', 'secreto iberico', 'presa', 'lomo', 'jamon', 'jamón', 'bacon', 'chorizo', 'costilla', 'panceta']
    });
  }
  if (rawRestr.includes('gluten') || rawRestr.includes('celiac')) {
    restrictions.push({
      type: 'gluten',
      keywords: ['pasta', 'trigo', 'pan', 'cuscus', 'cuscús', 'lasaña', 'croqueta', 'empanado', 'ravioli']
    });
  }
  if (rawRestr.includes('lactosa') || rawRestr.includes('leche')) {
    restrictions.push({
      type: 'lactosa',
      keywords: ['queso', 'yogur', 'yogures', 'leche', 'nata', 'ricota', 'cottage', 'parmesano']
    });
  }

  if (restrictions.length === 0) {
    return { filteredText: dishText, hasConflict: false, allExcluded: false };
  }

  const options = dishText.split('/').map(s => s.trim()).filter(Boolean);
  if (options.length === 0) {
    return { filteredText: dishText, hasConflict: false, allExcluded: false };
  }

  const safeOptions = [];
  let excludedAny = false;

  for (const opt of options) {
    const optLow = opt.toLowerCase();
    let isExcluded = false;
    for (const r of restrictions) {
      if (r.keywords.some(kw => optLow.includes(kw))) {
        isExcluded = true;
        excludedAny = true;
        break;
      }
    }
    if (!isExcluded) {
      safeOptions.push(opt);
    }
  }

  if (safeOptions.length > 0) {
    return {
      filteredText: safeOptions.join(' / '),
      hasConflict: excludedAny,
      allExcluded: false,
    };
  }

  return {
    filteredText: dishText,
    hasConflict: true,
    allExcluded: true,
  };
}

export function getMenuMealOptions(menu, dayKey, mealName, jugador = null) {
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

  const rawPrimero = String(mealData.primero || '').trim();
  const rawSegundo = String(mealData.segundo || '').trim();
  const rawCombined = `${rawPrimero} ${rawSegundo}`.toLowerCase();

  if (rawCombined === 'descanso') {
    return null;
  }

  const isPreMatchMarker = rawCombined.includes('prepartido') || rawCombined.includes('pre-partido');
  if (isPreMatchMarker && !rawPrimero.includes('/') && !rawSegundo.includes('/')) {
    return {
      description: normMeal === 'cena'
        ? 'Cena de carga pre-partido del comedor: Plato alto en hidratos de carbono (pasta o arroz) con proteína magra limpia (pechuga de pollo, pavo o ternera magra) y fruta fresca de postre. PROHIBIDO Ensure o batidos no pautados.'
        : 'Comida pre-partido del comedor: Plato digestivo alto en hidratos (arroz o pasta) con proteína magra y fruta fresca.',
      hasCriticalConflict: false,
    };
  }

  const isMatchMarker = rawCombined.startsWith('partido ') || rawCombined.includes(' - valencia') || rawCombined.includes('valencia c.f');
  if (isMatchMarker && !rawPrimero.includes('/') && !rawSegundo.includes('/')) {
    return {
      description: 'Cena post-partido del comedor: Plato recuperador completo con carbohidratos de plato, proteína limpia de calidad y fruta fresca.',
      hasCriticalConflict: false,
    };
  }

  const primeroRes = filterDishOptionsByRestrictions(mealData.primero, jugador);
  const segundoRes = filterDishOptionsByRestrictions(mealData.segundo, jugador);
  const postreRes = filterDishOptionsByRestrictions(mealData.postre, jugador);

  const parts = [];
  let hasCriticalConflict = false;

  if (primeroRes.allExcluded) {
    hasCriticalConflict = true;
    parts.push(`Primero: [ATENCIÓN MÉDICA: Opción no tolerada (${mealData.primero}). Sustituir por arroz, patata o verdura apta]`);
  } else if (primeroRes.filteredText) {
    parts.push(`Primero: ${primeroRes.filteredText}`);
  }

  if (segundoRes.allExcluded) {
    hasCriticalConflict = true;
    parts.push(`Segundo: [ATENCIÓN CLÍNICA OBLIGATORIA: El comedor solo ofrece plato prohibido para el jugador ("${mealData.segundo}"). PROHIBIDO SERVIRLO. Sustituir OBLIGATORIAMENTE por proteína limpia del catálogo: pechuga de pollo, pavo, ternera magra o huevos]`);
  } else if (segundoRes.filteredText) {
    parts.push(`Segundo: ${segundoRes.filteredText}`);
  }

  if (postreRes.filteredText) {
    const isLactose = Boolean(
      jugador?.intolerancias?.toLowerCase().includes('lactosa') ||
      jugador?.alergias?.toLowerCase().includes('lactosa') ||
      jugador?.alergias?.toLowerCase().includes('leche')
    );
    if (isLactose) {
      parts.push('Postre: Fruta fresca');
    } else {
      parts.push(`Postre: ${postreRes.filteredText}`);
    }
  }

  if (parts.length === 0) return null;

  return {
    description: parts.join(' | ') + ' (las opciones separadas por "/" son alternativas de libre elección: selecciona una sola opción de hidrato principal y una de proteína, nunca combines opciones alternativas de la misma categoría)',
    hasCriticalConflict,
  };
}

export function buildMealAssemblySpec({ jugador, dayKey, dayData, allDays = {}, menu, preMatchConfig, _recsForDay, mealBudgets }) {
  const isMatchDay = dayData.tipoDia === 'partido';
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  // Detectar si el día siguiente es día de partido (tanto por tipo de día en el plan semanal como por preMatchConfig)
  const curIdx = daysOfWeek.indexOf(dayKey);
  const nextDayKey = curIdx !== -1 ? daysOfWeek[(curIdx + 1) % 7] : null;
  const matchDayKeys = Object.keys(preMatchConfig?.partidos || {}).filter((k) => preMatchConfig?.partidos?.[k]?.horario);

  const isNextDayMatch = Boolean(
    (nextDayKey && allDays?.[nextDayKey]?.tipoDia === 'partido') ||
    (nextDayKey && matchDayKeys.includes(nextDayKey))
  );

  const matchKeyForPrev = isNextDayMatch ? nextDayKey : null;
  const isPrevToMatch = Boolean(matchKeyForPrev);

  const horario = isMatchDay
    ? (preMatchConfig?.partidos?.[dayKey]?.horario || preMatchConfig?.horario || 'tarde')
    : (matchKeyForPrev ? (preMatchConfig?.partidos?.[matchKeyForPrev]?.horario || preMatchConfig?.horario || 'tarde') : 'tarde');

  // Solo se aplica protocolo pre-partido si el jugador tiene configurado ese horario específico de partido
  const playerPreMatch = jugador?.config_prepartido?.[horario] || {};

  return mealBudgets.map((m) => {
    const mealName = m.nombre;
    const normName = mealName.toLowerCase();
    const target = m.target;

    const isMainMeal = normName.includes('comida') || normName.includes('cena');
    const isBreakfast = normName.includes('desayuno');

    let basePropuesta = '';
    let esProtocoloFijo = false;

    // Prioridad 1: Protocolo pre-partido / post-partido / carga previa
    if (normName.includes('post')) {
      if (isMatchDay || normName.includes('partido')) {
        basePropuesta = 'Recovery y fruta';
      } else {
        const isSinLactosa = Boolean(
          jugador?.intolerancias?.toLowerCase().includes('lactosa') ||
          jugador?.alergias?.toLowerCase().includes('lactosa') ||
          jugador?.alergias?.toLowerCase().includes('leche')
        );
        basePropuesta = isSinLactosa
          ? 'Batido de proteína sin lactosa 30g disuelto en agua.'
          : 'Batido de proteína 30g disuelto en agua.';
      }
      esProtocoloFijo = true;
    } else if (isPrevToMatch && normName.includes('cena') && (playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena || playerPreMatch.dia_anterior)) {
      // Cena de carga pre-partido (24h previas): prioridad a recomendaciones.Cena sobre dia_anterior legado
      const cenaCarga = playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena || playerPreMatch.dia_anterior;
      basePropuesta = `Pauta fija cena de carga pre-partido (24h previas): ${cenaCarga}`;
      if (cenaCarga.toLowerCase().includes('ensure')) {
        basePropuesta += ' (Incluye 1 batido Ensure ~250 kcal y completa los hidratos y proteinas restantes con los alimentos pautados en crudo: patata, pollo y AOVE)';
      }
      esProtocoloFijo = true;
    } else if (isMatchDay && !normName.includes('cena') && playerPreMatch.recomendaciones?.[mealName]) {
      // Ingestas del propio día de partido (Desayuno, Comida, Merienda pre-partido...)
      // La Cena en el protocolo pre-partido corresponde a la cena de carga del día anterior, no a la cena post-partido
      basePropuesta = `Pauta fija dia de partido: ${playerPreMatch.recomendaciones[mealName]}`;
      esProtocoloFijo = true;
    } else {
      // Prioridad 2: Menu del comedor de la ciudad deportiva
      const menuComedorInfo = getMenuMealOptions(menu, dayKey, mealName, jugador);
      if (menuComedorInfo) {
        basePropuesta = `Menu comedor ciudad deportiva: ${menuComedorInfo.description}`;
        // Si el menú contenía un alimento prohibido para el jugador, NO es un protocolo rígido:
        // se instruye a la IA a sustituirlo por una proteína segura manteniendo los acompañamientos.
        esProtocoloFijo = !menuComedorInfo.hasCriticalConflict;
      } else if (jugador?.recomendaciones_defecto?.[mealName]) {
        // Prioridad 3: Preferencia habitual del perfil del jugador
        const recDefecto = jugador.recomendaciones_defecto[mealName];
        if (isMainMeal) {
          basePropuesta = `Preferencia habitual del jugador: "${recDefecto}". Mantén esta base de preferencias pero asegura variedad a lo largo de la semana sin repetir la misma combinación en días consecutivos.`;
        } else {
          basePropuesta = `Preferencia habitual del jugador para esta ingesta: "${recDefecto}". Debe ser una opción típica y natural para este momento del día (nunca un plato cocinado de comida o cena), variando las opciones a lo largo de la semana.`;
        }
        esProtocoloFijo = false;
      } else {
        if (isMainMeal) {
          basePropuesta = 'Propuesta libre para comida o cena: Diseñar un plato completo, variado y equilibrado, alternando fuentes de proteína de calidad, hidratos de plato y verduras a lo largo de la semana sin repetir combinaciones.';
        } else if (isBreakfast) {
          basePropuesta = 'Propuesta libre de desayuno: Diseñar una ingesta matutina típica y natural acorde a los objetivos nutricionales, variando opciones a lo largo de la semana y evitando platos principales calientes propios de comida o cena.';
        } else {
          basePropuesta = 'Propuesta libre para esta ingesta: Diseñar una opción ligera, típica y adecuada para este momento del día acorde a los objetivos nutricionales, variando opciones a lo largo de la semana y evitando totalmente platos principales calientes propios de comida o cena.';
        }
        esProtocoloFijo = false;
      }
    }

    const clinicalRestrictions = [
      jugador?.alergias ? `ALERGIAS (TOTALMENTE PROHIBIDO): ${jugador.alergias}` : null,
      jugador?.intolerancias ? `INTOLERANCIAS (TOTALMENTE PROHIBIDO): ${jugador.intolerancias}` : null,
      jugador?.aversiones ? `AVERSIONES (TOTALMENTE PROHIBIDO): ${jugador.aversiones}` : null,
      jugador?.contexto_clinico ? `CONTEXTO CLÍNICO: ${jugador.contexto_clinico}` : null,
    ].filter(Boolean).join(' | ');

    const item = {
      nombre: mealName,
      objetivo: {
        kcal: target.kcal,
        proteina_g: target.p,
        hidratos_g: target.hc,
        grasa_g: target.g,
      },
      es_protocolo_fijo: esProtocoloFijo,
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

function recommendationsToPrompt(recs) {
  if (!recs || typeof recs !== 'object') return '';
  const entries = Object.entries(recs).filter((entry) => entry[1] && entry[1].trim() !== '');
  if (entries.length === 0) return '';
  return entries.map(([meal, rec]) => `- Para ${meal}: ${rec}`).join('\n');
}

export function buildWeeklyPrompt({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasSpec = {};

  for (const dayKey of daysOfWeek) {
    const dayData = baseData.dias[dayKey];
    const mealBudgets = calculateMealBudgets(dayData);
    const ingestasAGenerar = buildMealAssemblySpec({
      jugador,
      dayKey,
      dayData,
      allDays: baseData.dias,
      menu,
      preMatchConfig,
      mealBudgets,
    });

    diasSpec[dayKey] = {
      dia: dayData.label,
      tipo_dia: dayData.tipoDia,
      objetivos_totales: {
        kcal: dayData.kcal,
        proteina_g: dayData.proteina,
        hidratos_g: dayData.hidratos,
        grasa_g: dayData.grasa,
      },
      ingestas_a_generar: ingestasAGenerar,
    };
  }

  const recsGenerales = recomendacionesIngestas ? recommendationsToPrompt(recomendacionesIngestas) : '';

  const payload = {
    rol: 'Carlos Ferrando, nutricionista del Valencia CF',
    tarea: 'Diseñar el menú gastronómico de TODA LA SEMANA (Lunes a Domingo) calculando los gramos exactos en crudo para cumplir las macros fijadas en cada ingesta, garantizando alta variedad gastronómica y respetando estrictamente protocolos fijos, restricciones clínicas y preferencias del jugador.',
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
    contexto_adicional: contextoAdicional || 'Ajustar a las tolerancias y gustos del jugador',
    ...(recsGenerales ? { pautas_especificas_nutricionista: recsGenerales } : {}),
    plan_semanal_por_dias: diasSpec,
    catalogo_alimentos_oficiales_disponibles: FOOD_NAMES_LIST,
    reglas_calidad_nutricional_y_variedad: AI_NUTRITION_RULES,
  };

  const payloadJson = JSON.stringify(payload, null, 2);

  return buildWeeklyPromptEnvelope(payloadJson);
}

export function sanitizeMealDetail(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text
    .replace(/(?:[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+)\s+0\s*g(?:,\s*|\s+y\s+|\s+con\s+)?/gi, '')
    .replace(/(?:[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+)\s+sustituido\s+por\s+/gi, '')
    .replace(/aislado(?:\s+de)?\s+prote[ií]na[a-záéíóúñ\s\d]*(?:scoop)?(?:[a-záéíóúñ\s\d]*)/gi, (match) => {
      return match.toLowerCase().includes('sin lactosa')
        ? 'Batido de proteína sin lactosa 30g disuelto en agua'
        : 'Batido de proteína 30g disuelto en agua';
    })
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,.\s]+/, '')
    .replace(/[,.\s]+$/, '')
    .trim();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

export async function generateFullWeeklyPlan({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const prompt = buildWeeklyPrompt({
    jugador,
    baseData,
    menu,
    preMatchConfig,
    contextoAdicional,
    recomendacionesIngestas,
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
    throw new Error(`Respuesta inválida de la IA en plan semanal: ${e.message}`);
  }

  if (!json.dias || typeof json.dias !== 'object') {
    throw new Error('La IA no devolvió los días de la semana válidos');
  }

  const sanitizedDias = {};
  for (const [dayKey, dayObj] of Object.entries(json.dias)) {
    sanitizedDias[dayKey] = {
      ...dayObj,
      ingestas: (dayObj.ingestas || []).map((ing) => ({
        ...ing,
        detalle: sanitizeMealDetail(ing.detalle),
      })),
    };
  }

  return {
    dias: sanitizedDias,
    notas: Array.isArray(json.notas) && json.notas.length > 0 ? json.notas : null,
  };
}

export async function generarDatosPlan({ jugador, nombre, contexto, contextoAdicional, calendario, menu, teamConfig, recomendacionesIngestas, preMatchConfig }) {
  const supabase = getSupabaseAdmin();
  const resolvedMenu = menu !== undefined ? menu : await latestMenu(supabase, jugador?.equipo_id);
  const baseData = buildBasePlanData({ jugador, nombre, contexto: contexto || 'semana_normal', contextoAdicional, menu: resolvedMenu, calendario, preMatchConfig, teamConfig });

  let weeklyResult = null;
  try {
    weeklyResult = await generateFullWeeklyPlan({
      jugador,
      baseData,
      menu: resolvedMenu,
      preMatchConfig,
      contextoAdicional,
      recomendacionesIngestas,
    });
  } catch (err) {
    console.warn(`Reintentando generación semanal: ${err.message}`);
    try {
      weeklyResult = await generateFullWeeklyPlan({
        jugador,
        baseData,
        menu: resolvedMenu,
        preMatchConfig,
        contextoAdicional,
        recomendacionesIngestas,
      });
    } catch (retryErr) {
      console.error('Error final en generación semanal:', retryErr.message);
    }
  }

  const intoleranciasStr = `${jugador?.intolerancias || ''} ${jugador?.alergias || ''} ${jugador?.alergias_intolerancias || ''} ${jugador?.aversiones || ''}`.toLowerCase();
  const isLactoseIntolerant = intoleranciasStr.includes('lactosa') || intoleranciasStr.includes('leche');
  const isGlutenIntolerant = intoleranciasStr.includes('gluten') || intoleranciasStr.includes('celiac');
  const isFishIntolerant = intoleranciasStr.includes('pescado') || intoleranciasStr.includes('marisco') || intoleranciasStr.includes('fish');
  const isPorkIntolerant = intoleranciasStr.includes('cerdo') || intoleranciasStr.includes('pork');
  const calOptions = { isLactoseIntolerant, isGlutenIntolerant, isFishIntolerant, isPorkIntolerant };

  const finalDias = { ...baseData.dias };
  if (weeklyResult?.dias) {
    const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    for (const dayKey of daysOfWeek) {
      const aiDay = weeklyResult.dias[dayKey];
      if (aiDay?.ingestas && Array.isArray(aiDay.ingestas) && aiDay.ingestas.length > 0) {
        let budgetMap = new Map();
        try {
          const budgets = calculateMealBudgets(baseData.dias[dayKey]);
          budgetMap = new Map(budgets.map(b => [b.nombre.toLowerCase().trim(), b.target]));
        } catch (bErr) {
          console.warn(`No se pudieron calcular presupuestos para calibrar ${dayKey}:`, bErr.message);
        }

        const isMatchDay = baseData.dias[dayKey]?.tipoDia === 'partido';
        const calOptionsForDay = { ...calOptions, isMatchDay };

        const calibratedIngestas = await Promise.all(
          aiDay.ingestas.map(async (ing) => {
            const sanitized = sanitizeMealDetail(ing.detalle);
            const target = budgetMap.get(ing.nombre.toLowerCase().trim());
            const calibrated = target
              ? await calibrateMeal(sanitized, target, { ...calOptionsForDay, mealName: ing.nombre })
              : sanitized;
            return {
              ...ing,
              detalle: calibrated,
            };
          })
        );

        finalDias[dayKey] = {
          ...baseData.dias[dayKey],
          ingestas: calibratedIngestas,
        };
      }
    }
  }

  const finalNotas = Array.isArray(weeklyResult?.notas) && weeklyResult.notas.length > 0
    ? weeklyResult.notas
    : [
      'Ajusta la hidratación según la intensidad de la sesión y la sudoración.',
      'Respeta los gramajes en crudo indicados para cada comida.',
      'Toma el batido post-entreno en los primeros 30 minutos tras finalizar la sesión.',
      'Mantén las pautas de descanso nocturno y digestión adecuada.',
    ];

  return {
    ...baseData,
    dias: finalDias,
    notas: finalNotas,
    meta: {
      ...baseData.meta,
      nombre,
      contexto: contexto || 'semana_normal',
      contextoAdicional,
      recomendacionesIngestas: recomendacionesIngestas || {},
      preMatchConfig: preMatchConfig || null,
    },
  };
}
