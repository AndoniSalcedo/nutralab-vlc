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
          detalle: 'Alimentos y gramos exactos en crudo de forma concisa.',
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
    tabla_composicion_alimentos_100g: {
      cereales_y_derivados_en_crudo: {
        arroz_blanco: { hc_g: 78, p_g: 8, g_g: 1, kcal: 355 },
        arroz_integral: { hc_g: 74, p_g: 8, g_g: 2.5, kcal: 350 },
        pasta_trigo: { hc_g: 75, p_g: 12, g_g: 1.5, kcal: 360 },
        copos_avena: { hc_g: 60, p_g: 13, g_g: 7, kcal: 370 },
        quinoa: { hc_g: 64, p_g: 14, g_g: 6, kcal: 368 },
        pan_blanco: { hc_g: 52, p_g: 8, g_g: 1.5, kcal: 260 },
        pan_integral: { hc_g: 45, p_g: 9, g_g: 2, kcal: 245 },
        tortas_arroz: { hc_g: 80, p_g: 8, g_g: 2.5, kcal: 380 },
        tortas_maiz: { hc_g: 78, p_g: 8, g_g: 3, kcal: 370 }
      },
      tuberculos: {
        patata: { hc_g: 18, p_g: 2, g_g: 0.1, kcal: 80 },
        boniato: { hc_g: 21, p_g: 1.6, g_g: 0.1, kcal: 90 },
        yuca: { hc_g: 38, p_g: 1.4, g_g: 0.3, kcal: 160 }
      },
      legumbres_en_crudo: {
        lentejas: { hc_g: 54, p_g: 25, g_g: 1.5, kcal: 330 },
        garbanzos: { hc_g: 55, p_g: 20, g_g: 6, kcal: 355 },
        alubias: { hc_g: 54, p_g: 22, g_g: 1.5, kcal: 320 }
      },
      frutas_y_miel: {
        platano: { hc_g: 21, p_g: 1.2, g_g: 0.2, kcal: 90 },
        manzana_pera: { hc_g: 13, p_g: 0.3, g_g: 0.2, kcal: 54 },
        naranja_kiwi: { hc_g: 10, p_g: 1, g_g: 0.2, kcal: 45 },
        fresas_frutos_rojos: { hc_g: 7, p_g: 0.7, g_g: 0.3, kcal: 35 },
        pina_mango: { hc_g: 14, p_g: 0.5, g_g: 0.1, kcal: 58 },
        datil: { hc_g: 70, p_g: 2, g_g: 0.2, kcal: 290 },
        miel: { hc_g: 82, p_g: 0.3, g_g: 0, kcal: 330 }
      },
      carnes_y_aves_en_crudo: {
        pechuga_pollo_pavo: { hc_g: 0, p_g: 23, g_g: 2, kcal: 110 },
        solomillo_ternera_magra: { hc_g: 0, p_g: 22, g_g: 4, kcal: 125 },
        lomo_cerdo_magro: { hc_g: 0, p_g: 22, g_g: 5, kcal: 135 },
        hamburguesa_ternera_magra: { hc_g: 0, p_g: 21, g_g: 6, kcal: 140 }
      },
      pescados_y_mariscos_en_crudo: {
        pescado_blanco_merluza_bacalao_lubina: { hc_g: 0, p_g: 18, g_g: 1, kcal: 82 },
        salmon_fresco: { hc_g: 0, p_g: 20, g_g: 12, kcal: 190 },
        atun_fresco: { hc_g: 0, p_g: 23, g_g: 5, kcal: 140 },
        atun_lata_al_natural: { hc_g: 0, p_g: 24, g_g: 0.8, kcal: 105 },
        gambas_langostinos: { hc_g: 0, p_g: 21, g_g: 1, kcal: 95 }
      },
      huevos_y_lacteos: {
        huevo_entero_unidad_50g: { hc_g: 0.3, p_g: 6.5, g_g: 5, kcal: 75 },
        claras_huevo_100g: { hc_g: 0.7, p_g: 11, g_g: 0.1, kcal: 48 },
        queso_fresco_batido_0: { hc_g: 4, p_g: 9, g_g: 0.1, kcal: 52 },
        yogur_griego_natural: { hc_g: 4, p_g: 9, g_g: 5, kcal: 97 },
        yogur_proteico_0: { hc_g: 4, p_g: 10, g_g: 0.1, kcal: 57 },
        yogur_natural_sin_lactosa: { hc_g: 4.5, p_g: 4, g_g: 3, kcal: 60 },
        yogur_proteico_sin_lactosa: { hc_g: 4, p_g: 10, g_g: 0.1, kcal: 57 },
        requeson_desnatado: { hc_g: 3.5, p_g: 12, g_g: 0.5, kcal: 68 },
        leche_desnatada_100ml: { hc_g: 5, p_g: 3.4, g_g: 0.2, kcal: 35 },
        bebida_avena_soja_100ml: { hc_g: 6, p_g: 1.5, g_g: 1, kcal: 40 }
      },
      grasas_y_frutos_secos: {
        aceite_oliva_virgen_extra_aove: { hc_g: 0, p_g: 0, g_g: 100, kcal: 900 },
        aguacate: { hc_g: 2, p_g: 2, g_g: 15, kcal: 160 },
        nueces_almendras_avellanas: { hc_g: 10, p_g: 20, g_g: 55, kcal: 610 },
        crema_cacahuete_100: { hc_g: 15, p_g: 28, g_g: 50, kcal: 620 }
      },
      suplementacion_deportiva: {
        aislado_proteina_suero_30g_scoop: { hc_g: 1, p_g: 26, g_g: 0.5, kcal: 115 },
        ensure_nutricion_entera_unidad: { hc_g: 32, p_g: 9, g_g: 8, kcal: 250 }
      }
    },
    reglas_calidad_nutricional: [
      'CUADRE MATEMATICO EXACTO: Utiliza los valores nutricionales de la tabla de composicion por 100g para calcular con precision las cantidades de cada alimento de modo que la suma de macronutrientes coincida con el "objetivo" de la ingesta (tolerancia maxima ±5%).',
      'TABLA DE REFERENCIA Y VARIEDAD: La tabla de composicion por 100g adjunta es una referencia de calculo para los alimentos mas frecuentes. Tienes total libertad para incluir cualquier otro alimento saludable, del menu de comedor o acorde a los gustos del jugador (ej: dorada, lubina, bacalao, pavo, lomo, cuscus, legumbres, esparragos, frutos rojos, etc.) aplicando con precision sus valores nutricionales estandar de la nutricion deportiva en crudo.',
      'CALCULO DE PROTEINA OBLIGATORIO Y COMPLEMENTOS: En tu proceso de razonamiento interno, calcula primero los gramos de proteina pura que aporta el alimento principal (ej: 100g de pollo = 23g P, 100g de merluza = 18g P). Si la carne/pescado no alcanza por si sola el objetivo de proteina_g de la ingesta, aumenta los gramos de carne/pescado (en futbol de elite raciones de 250g-320g son normales) o anade OBLIGATORIAMENTE un complemento proteico (yogur proteico/griego/sin lactosa, claras de huevo, queso fresco batido, huevo cocido, lata de atun al natural) para que la suma total de proteina del plato cumpla exactamente el numero fijado en el objetivo.',
      'SOLO INGREDIENTES Y GRAMAJES (SIN METODOS DE COCINADO NI "EN CRUDO"): Nombra unicamente los alimentos y sus gramos exactos. PROHIBIDO anadir formas de preparacion ("hervido", "a la plancha", "al horno", "salteado", "asado", "cocido", "marcado") y PROHIBIDO escribir "(en crudo)" (los pesos siempre se entienden en crudo). Ejemplo: "Arroz blanco 220g, solomillo de ternera 220g, calabacin y zanahoria 150g, AOVE 15g, platano 150g".',
      'FORMATO LIMPIO Y DIRECTO: Enumera los alimentos y sus cantidades de forma fluida, separando con comas y conectores sencillos ("con", "y de postre").',
      'PROHIBIDO RELLENO NARRATIVO: Sin introducciones, verbos ni rodeos ("Prepara...", "Disfruta de...", "Marca...", "Sírvelo con..."). Directo a los alimentos y gramajes.',
      'PROHIBIDO RESUMENES NUMERICOS: NUNCA anadas al final "Total aprox:", "Total:", "kcal", "P:", "HC:", "G:" ni balances matematicos.',
      'PROHIBIDO LISTAS CON SIGNOS MAS (+): Usa comas o conectores naturales ("y", "con").',
      'VERDURAS CONCRETAS: Nombra siempre verduras especificas (calabacin, zanahoria, espinacas, judias verdes).'
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
    '      "detalle": "Lista limpia y concisa de alimentos y gramos exactos, sin métodos de cocinado ni menciones a crudo/cocido."',
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
    detalle: ing.detalle,
  }));

  return {
    dayKey,
    ingestas: sanitizedIngestas,
  };
}

export async function generateWeeklyPlanParallel({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  const dayPromises = daysOfWeek.map(async (dayKey) => {
    const dayData = baseData.dias[dayKey];
    const recsForDay = recomendacionesIngestas ? recommendationsToPrompt(recomendacionesIngestas) : '';

    try {
      return await generateSingleDay({
        jugador,
        dayKey,
        dayData,
        menu,
        preMatchConfig,
        contextoAdicional,
        recsForDay,
      });
    } catch (err) {
      console.warn(`Reintentando generación para ${dayKey}: ${err.message}`);
      try {
        return await generateSingleDay({
          jugador,
          dayKey,
          dayData,
          menu,
          preMatchConfig,
          contextoAdicional,
          recsForDay,
        });
      } catch (retryErr) {
        console.error(`Error final en día ${dayKey}:`, retryErr.message);
        return {
          dayKey,
          ingestas: dayData.ingestas,
        };
      }
    }
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

function buildWeeklyNotesPrompt({ jugador, contextoAdicional }) {
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

export async function reviewAndRepairPlanData({ jugador, contextoAdicional, planData }) {
  try {
    const res = await client.messages.create({
      model: env.AI_MODEL || 'claude-sonnet-5',
      max_tokens: 1000,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: buildWeeklyNotesPrompt({ jugador, contextoAdicional }) }],
    });

    const text = res.content.find((c) => c.type === 'text')?.text || '';
    const json = extractJson(text);
    if (Array.isArray(json.notes) && json.notes.length > 0) {
      return {
        ...planData,
        notas: json.notes,
      };
    }
  } catch (error) {
    console.warn('Weekly notes generation fallback:', error.message);
  }

  return {
    ...planData,
    notas: [
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
    planData: generatedPlan,
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
