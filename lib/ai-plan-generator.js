import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { buildBasePlanData, mergeAiPlanData } from '@/lib/nutrition-plan-card';
import { env } from '@/lib/env';
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


function menuToPrompt(menu) {
  if (!menu?.dias?.length) return 'No hay menú semanal cargado en la ciudad deportiva.';

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

function playerContextToPrompt(jugador) {
  return [
    `Nombre: ${jugador.nombre || ''} ${jugador.apellidos || ''}`,
    `Posición: ${jugador.posicion || 'No especificada'}`,
    `Peso: ${jugador.peso_kg || '?'} kg | Grasa: ${jugador.porcentaje_grasa || '?'}% | Masa magra: ${jugador.masa_magra_kg || '?'} kg`,
    `Objetivo: ${getObjectiveLabel(jugador.objetivo) || jugador.objetivo || 'Rendimiento deportivo óptimo'}`,
    `Gustos/preferencias: ${jugador.gustos_preferencias || 'No especificados'}`,
    `Contexto clínico: ${jugador.contexto_clinico || 'Sin particularidades'}`,
    restrictionsToPrompt(jugador),
  ].join('\n');
}

function planFormatExample() {
  const dias = {};
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

  daysOfWeek.forEach((dayKey) => {
    dias[dayKey] = {
      dayKey,
      label: dayLabels[dayKey],
      tipoDia: 'entreno',
      ingestas: [
        { nombre: 'Desayuno', detalle: '...' },
        { nombre: 'Comida', detalle: '...' },
        { nombre: 'Cena', detalle: '...' }
      ]
    };
  });

  return JSON.stringify({
    dias,
    notes: ['...', '...', '...', '...'],
  });
}

function recommendationsToPrompt(recs) {
  if (!recs || typeof recs !== 'object') return '';
  const entries = Object.entries(recs).filter((entry) => entry[1] && entry[1].trim() !== '');
  if (entries.length === 0) return '';
  return entries.map(([meal, rec]) => `- Para ${meal}: ${rec}`).join('\n');
}

function preMatchToPrompt(preMatchConfig, planOrBaseData) {
  if (!preMatchConfig || !preMatchConfig.enabled) {
    return '';
  }

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

  // Find all match days configured in the week
  let matchDayKeys = [];
  if (planOrBaseData && planOrBaseData.dias) {
    matchDayKeys = daysOfWeek.filter((key) => planOrBaseData.dias[key]?.tipoDia === 'partido');
  }
  if (matchDayKeys.length === 0 && preMatchConfig.partidos) {
    matchDayKeys = Object.keys(preMatchConfig.partidos);
  }
  if (matchDayKeys.length === 0 && preMatchConfig.diaPartido) {
    matchDayKeys = [preMatchConfig.diaPartido.toLowerCase()];
  }
  if (matchDayKeys.length === 0) {
    matchDayKeys = ['sabado'];
  }

  const parts = [];

  for (const matchDayKey of matchDayKeys) {
    const matchDayConfig = preMatchConfig.partidos?.[matchDayKey] || {
      horario: preMatchConfig.horario || 'tarde',
      texto: preMatchConfig.texto || '',
    };

    const text = matchDayConfig.texto ? matchDayConfig.texto.trim() : '';
    if (!text) continue;

    const matchDayIndex = daysOfWeek.indexOf(matchDayKey);
    const prevDayKey = matchDayIndex !== -1 ? daysOfWeek[(matchDayIndex - 1 + 7) % 7] : 'viernes';
    const matchDayLabel = dayLabels[matchDayKey] || matchDayKey;
    const prevDayLabel = dayLabels[prevDayKey] || prevDayKey;
    const isTarde = matchDayConfig.horario !== 'manana';

    const affectedMeals = isTarde
      ? `* En ${prevDayLabel} (día anterior): afecta a la Cena (y Merienda si existe en la ficha del jugador).\n* En ${matchDayLabel} (día de partido): afecta al Desayuno, Almuerzo y Comida pre-partido.`
      : `* En ${prevDayLabel} (día anterior): afecta a la Comida, Merienda y Cena.\n* En ${matchDayLabel} (día de partido): afecta al Desayuno (pre-partido).`;

    parts.push(
      `--- PAUTA PRE-PARTIDO 24H PARA EL PARTIDO DEL ${matchDayLabel.toUpperCase()} (HORARIO: ${isTarde ? 'TARDE/NOCHE' : 'MAÑANA'}) ---\n` +
      `Ventana de 24h previas:\n${affectedMeals}\n` +
      `MENÚ / INDICACIONES PRE-PARTIDO DE 24H:\n"${text}"`
    );
  }

  if (parts.length === 0) return '';

  return [
    `=== PAUTAS OBLIGATORIAS 24 HORAS PRE-PARTIDO ===`,
    parts.join('\n\n'),
    ``,
    `REGLAS DE APLICACIÓN DE LAS 24H PRE-PARTIDO:`,
    `1. SOBREESCRITURA DE MENÚ: Para las comidas de las 24h previas a cada partido indicadas arriba, OMITIR el menú del comedor/buffet y usar EXCLUSIVAMENTE las indicaciones del texto de 24h pre-partido.`,
    `2. ADAPTACIÓN A LAS INGESTAS DEL JUGADOR:`,
    `   - Si en el texto pre-partido se menciona una ingesta (ej: Merienda) pero el jugador NO TIENE esa ingesta en su perfil (num_comidas/ingestas), OMITIRLA por completo. No agregues comidas que el jugador no realice.`,
    `   - Si el jugador SÍ tiene esa ingesta en su perfil, diseña la comida basada en el texto pre-partido adaptando las cantidades en gramos (en crudo) para cumplir con sus Kcal y macronutrientes del día.`,
    `3. TIMING SEGÚN HORARIO: Si el partido es a la tarde, la Cena del día anterior a dicho partido pertenece a las 24h previas, y la Comida del propio día de partido es la comida pre-partido.`,
  ].join('\n');
}

function buildPrompt({ jugador, contextoAdicional, menu, baseData, retry = false, recomendacionesIngestas, preMatchConfig }) {
  const recsPrompt = recommendationsToPrompt(recomendacionesIngestas);
  const preMatchPrompt = preMatchToPrompt(preMatchConfig, baseData);

  return [
    'Eres Carlos Ferrando, nutricionista del Valencia CF.',
    'Completa una ficha nutricional breve para cada día de la semana (Lunes a Domingo). Devuelve SOLO JSON válido, sin Markdown ni texto alrededor.',
    retry ? 'Respuesta anterior inválida o incompleta. Hazla más corta y strictly JSON.' : '',
    '',
    'Formato exacto:',
    planFormatExample(),
    '',
    'Reglas:',
    '- Cada detalle debe ser una frase corta con cantidades aproximadas.',
    '- Comida y cena deben usar como base el menú de ciudad deportiva cuando exista, sirviendo como referencia (salvo en las 24h pre-partido si están configuradas, en cuyo caso prevalece la pauta pre-partido).',
    '- El menú de la ciudad deportiva es un BUFFET de opciones disponibles. NUNCA propongas que el jugador coma todos los platos/proteínas/carbohidratos listados en el menú a la vez. Debes ELEGIR una combinación lógica y equilibrada (por ejemplo, una sola fuente de proteína como pavo o pollo, y una sola fuente de carbohidratos como patata o arroz), y ajustar sus cantidades en gramos para cumplir con las calorías y macros del día.',
    '- Si el nutricionista ha definido una recomendación específica para una ingesta, debes dar prioridad absoluta a esa recomendación y diseñar el plato en base a ella, calculando las cantidades para cumplir con los macros del día.',
    '- Evita strictly alergias, intolerancias y aversiones.',
    '- Para cada día, rellena los detalles de las ingestas correspondientes ya proporcionadas en la estructura base (las cuales están personalizadas para el jugador).',
    '- Si existe una ingesta llamada "Post-entreno", su contenido debe ser EXCLUSIVAMENTE un batido de proteínas. Adapta los gramos según los macros y el tipo de proteína (ej. vegana) a las alergias/preferencias, pero NUNCA incluyas creatina, carbohidratos extra u otros suplementos.',
    '- Si especificas cantidades en gramos (para arroz, pasta, carne, pescado, etc.), indícalas siempre en peso EN CRUDO (nunca cocinado).',
    '- Tono y persona: Dirígete al jugador SIEMPRE en segunda persona del singular ("tú"). NUNCA te refieras a él/ella en tercera persona ("el jugador", "él/ella", "su", "sus") ni uses su nombre propio. Toda indicación o detalle debe sonar directo, personal y cercano, como si le estuvieras hablando directamente. Por ejemplo, escribe "según tus preferencias" en lugar de "según las preferencias del jugador", o "vienes de readaptación" en lugar de "Juan viene de readaptación".',
    '- Indicaciones de la semana (notes): En el array "notes", proporciona 3-4 indicaciones de la semana que sigan estrictamente esta regla del tono en segunda persona (tú). Por ejemplo: "Desayuno fijo según tus preferencias" o "Vienes de readaptación y ya estás en forma".',
    '- No incluyas explicación larga.',
    '',
    'Jugador:',
    playerContextToPrompt(jugador),
    '',
    preMatchPrompt ? `${preMatchPrompt}\n` : '',
    recsPrompt ? `Recomendaciones específicas del nutricionista por ingesta (prioridad sobre el menú si difieren):\n${recsPrompt}` : '',
    '',
    contextoAdicional ? `Contexto adicional/Pautas globales: ${contextoAdicional}` : '',
    '',
    'Menú ciudad deportiva (referencia base):',
    menuToPrompt(menu),
    '',
    'Macros y tipos de día ya calculados por la app, no los cambies en la respuesta, pero rellena las ingestas para cada día:',
    JSON.stringify(baseData.dias),
  ].filter(Boolean).join('\n');
}

function buildReviewPrompt({ jugador, contextoAdicional, menu, planData, recomendacionesIngestas, preMatchConfig }) {
  const recsPrompt = recommendationsToPrompt(recomendacionesIngestas);
  const preMatchPrompt = preMatchToPrompt(preMatchConfig, planData);

  return [
    'Eres Carlos Ferrando, nutricionista del Valencia CF.',
    'Revisa esta ficha nutricional ya generada y corrige SOLO las ingestas que entren en conflicto con alergias, intolerancias, aversiones, contexto clínico, pauta de 24h pre-partido o las recomendaciones del nutricionista.',
    'Devuelve SOLO JSON válido, sin Markdown ni texto alrededor.',
    '',
    'Formato exacto de respuesta:',
    planFormatExample(),
    '',
    'Reglas de revisión y sustitución:',
    '- Las alergias, intolerancias, aversiones, pauta 24h pre-partido y recomendaciones específicas de ingestas tienen prioridad absoluta sobre el menú.',
    '- Si se configuró la pauta 24h pre-partido, asegúrate de que las comidas de las 24h previas la respeten estrictamente y se adapten a las ingestas del jugador.',
    '- Si una ingesta no cumple con la recomendación específica provista, corrígela para que la respete.',
    '- Si una ingesta (comida/cena) que usa el menú contiene una lista masiva de todos los alimentos proteicos o carbohidratos disponibles en el buffet, debes corregirla para que sea una comida lógica y apetecible: selecciona una sola fuente de proteína principal y una sola fuente de carbohidrato principal, ajustando las cantidades.',
    '- Si un plato del menú o una ingesta contiene un alimento prohibido, sustitúyelo automáticamente por una alternativa segura.',
    '- La alternativa debe ser lo más parecida posible al plato original y mantener su función nutricional: proteína por proteína, hidrato por hidrato, grasa por grasa, verdura/fibra por verdura/fibra, postre/fruta por postre/fruta.',
    '- Mantén textura y digestibilidad similares cuando sea relevante, especialmente en día de partido o comida pre.',
    '- No menciones el alimento prohibido en el detalle final; escribe solo la alternativa segura.',
    '- Respeta gustos/preferencias cuando no contradigan seguridad ni objetivo nutricional.',
    '- Tono y persona: Asegúrate de que tanto las ingestas como las notas/indicaciones del array "notes" se dirijan siempre al jugador en segunda persona del singular ("tú") de forma cercana y directa.',
    '- No cambies kcal, proteína, hidratos, grasa, tipoDia, dayKey ni label. Solo puedes cambiar detalle/nombre de ingestas y notas.',
    '- Si modificas o especificas cantidades en gramos, indícalas siempre en peso EN CRUDO (nunca cocinado).',
    '- No hagas cambios globales si solo existe conflicto en una ingesta.',
    '- Si no hay conflicto, devuelve las ingestas tal como están.',
    '',
    'Jugador:',
    playerContextToPrompt(jugador),
    '',
    preMatchPrompt ? `${preMatchPrompt}\n` : '',
    recsPrompt ? `Recomendaciones específicas del nutricionista por ingesta:\n${recsPrompt}` : '',
    '',
    contextoAdicional ? `Contexto adicional/Pautas globales: ${contextoAdicional}` : '',
    '',
    'Menú ciudad deportiva usado como referencia:',
    menuToPrompt(menu),
    '',
    'Ficha generada a revisar:',
    JSON.stringify(planData),
  ].filter(Boolean).join('\n');
}

async function requestAiJson(prompt) {
  const message = await client.messages.create({
    model: env.CHAT_MODEL,
    max_tokens: maxTokens(),
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content.find((item) => item.type === 'text')?.text || '';
  if (message.stop_reason === 'max_tokens') {
    throw new Error('La generación se cortó por límite de tokens');
  }

  return extractJson(text);
}

export async function reviewAndRepairPlanData({ jugador, contextoAdicional, menu, planData, teamConfig, recomendacionesIngestas, preMatchConfig }) {
  try {
    const repairedData = await requestAiJson(buildReviewPrompt({ jugador, contextoAdicional, menu, planData, recomendacionesIngestas, preMatchConfig }));
    return mergeAiPlanData(planData, repairedData, teamConfig);
  } catch (error) {
    console.warn('AI plan review fallback:', error.message);
    return planData;
  }
}

export async function generarDatosPlan({ jugador, nombre, contexto, contextoAdicional, calendario, menu, teamConfig, recomendacionesIngestas, preMatchConfig }) {
  const supabase = getSupabaseAdmin();
  const resolvedMenu = menu !== undefined ? menu : await latestMenu(supabase, jugador?.equipo_id);
  const baseData = buildBasePlanData({ jugador, nombre, contexto: contexto || 'semana_normal', contextoAdicional, menu: resolvedMenu, calendario, preMatchConfig, teamConfig });
  let generatedPlan = baseData;

  try {
    const aiData = await requestAiJson(buildPrompt({ jugador, contextoAdicional, menu: resolvedMenu, baseData, recomendacionesIngestas, preMatchConfig }));
    generatedPlan = mergeAiPlanData(baseData, aiData, teamConfig);
  } catch (firstError) {
    try {
      const aiData = await requestAiJson(buildPrompt({ jugador, contextoAdicional, menu: resolvedMenu, baseData, retry: true, recomendacionesIngestas, preMatchConfig }));
      generatedPlan = mergeAiPlanData(baseData, aiData, teamConfig);
    } catch (secondError) {
      console.warn('AI plan JSON fallback:', firstError.message, secondError.message);
    }
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
    }
  };
}
