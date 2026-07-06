import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { buildBasePlanData, mergeAiPlanData } from '@/lib/nutrition-plan-card';
import { env } from '@/lib/env';
import { PLAN_CONTEXTS } from '@/lib/nutrition-day-types';

const client = new Anthropic({ apiKey: env.AI_API_KEY });

const CONTEXTOS = Object.fromEntries(PLAN_CONTEXTS.map((c) => [c.value, c.promptDescription]));


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
  if (!equipoId) return null;

  const { data } = await supabase
    .from('menu_semanal')
    .select('*')
    .eq('equipo_id', equipoId)
    .order('semana', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data || null;
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
    `Objetivo: ${jugador.objetivo || 'Rendimiento deportivo óptimo'}`,
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

function buildPrompt({ jugador, contexto, contextoAdicional, menu, baseData, retry = false }) {
  return [
    'Eres Carlos Ferrando, nutricionista del Valencia CF.',
    'Completa una ficha nutricional breve para cada día de la semana (Lunes a Domingo). Devuelve SOLO JSON válido, sin Markdown ni texto alrededor.',
    retry ? 'Respuesta anterior inválida o incompleta. Hazla más corta y estrictamente JSON.' : '',
    '',
    'Formato exacto:',
    planFormatExample(),
    '',
    'Reglas:',
    '- Cada detalle debe ser una frase corta con cantidades aproximadas.',
    '- Comida y cena deben usar como base el menú de ciudad deportiva cuando exista.',
    '- Evita estrictamente alergias, intolerancias y aversiones.',
    '- Para cada día, rellena los detalles de las ingestas correspondientes ya proporcionadas en la estructura base (las cuales están personalizadas para el jugador).',
    '- Si especificas cantidades en gramos (para arroz, pasta, carne, pescado, etc.), indícalas siempre en peso EN CRUDO (nunca cocinado).',
    '- No incluyas explicación larga.',
    '',
    'Jugador:',
    playerContextToPrompt(jugador),
    '',
    `Contexto actual: ${CONTEXTOS[contexto] || contexto || 'semana normal'}`,
    contextoAdicional ? `Contexto adicional: ${contextoAdicional}` : '',
    '',
    'Menú ciudad deportiva:',
    menuToPrompt(menu),
    '',
    'Macros y tipos de día ya calculados por la app, no los cambies en la respuesta, pero rellena las ingestas para cada día:',
    JSON.stringify(baseData.dias),
  ].filter(Boolean).join('\n');
}

function buildReviewPrompt({ jugador, contexto, contextoAdicional, menu, planData }) {
  return [
    'Eres Carlos Ferrando, nutricionista del Valencia CF.',
    'Revisa esta ficha nutricional ya generada y corrige SOLO las ingestas que entren en conflicto con alergias, intolerancias, aversiones o contexto clínico del jugador.',
    'Devuelve SOLO JSON válido, sin Markdown ni texto alrededor.',
    '',
    'Formato exacto de respuesta:',
    planFormatExample(),
    '',
    'Reglas de revisión y sustitución:',
    '- Las alergias, intolerancias y aversiones tienen prioridad absoluta sobre el menú.',
    '- Si un plato del menú o una ingesta contiene un alimento prohibido, sustitúyelo automáticamente por una alternativa segura.',
    '- La alternativa debe ser lo más parecida posible al plato original y mantener su función nutricional: proteína por proteína, hidrato por hidrato, grasa por grasa, verdura/fibra por verdura/fibra, postre/fruta por postre/fruta.',
    '- Mantén textura y digestibilidad similares cuando sea relevante, especialmente en día de partido o comida pre.',
    '- No menciones el alimento prohibido en el detalle final; escribe solo la alternativa segura.',
    '- Respeta gustos/preferencias cuando no contradigan seguridad ni objetivo nutricional.',
    '- No cambies kcal, proteína, hidratos, grasa, tipoDia, dayKey ni label. Solo puedes cambiar detalle/nombre de ingestas y notas.',
    '- Si modificas o especificas cantidades en gramos, indícalas siempre en peso EN CRUDO (nunca cocinado).',
    '- No hagas cambios globales si solo existe conflicto en una ingesta.',
    '- Si no hay conflicto, devuelve las ingestas tal como están.',
    '',
    'Ejemplos de criterio:',
    '- Marisco/pescado conflictivo: sustituye por pollo, pavo, huevo, legumbre o tofu según restricciones y tipo de día.',
    '- Lácteo conflictivo: sustituye por opción sin lactosa o alternativa proteica segura.',
    '- Gluten conflictivo: sustituye pasta/pan por arroz, patata, maíz o versión sin gluten.',
    '- Frutos secos conflictivos: sustituye por AOVE, aguacate u otra grasa segura; evita semillas si no está claro que sean seguras.',
    '',
    'Jugador:',
    playerContextToPrompt(jugador),
    '',
    `Contexto actual: ${CONTEXTOS[contexto] || contexto || 'semana normal'}`,
    contextoAdicional ? `Contexto adicional: ${contextoAdicional}` : '',
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

export async function reviewAndRepairPlanData({ jugador, contexto, contextoAdicional, menu, planData }) {
  try {
    const repairedData = await requestAiJson(buildReviewPrompt({ jugador, contexto, contextoAdicional, menu, planData }));
    return mergeAiPlanData(planData, repairedData);
  } catch (error) {
    console.warn('AI plan review fallback:', error.message);
    return planData;
  }
}

export async function generarDatosPlan({ jugador, nombre, contexto, contextoAdicional, calendario, menu }) {
  const supabase = getSupabaseAdmin();
  const resolvedMenu = menu !== undefined ? menu : await latestMenu(supabase, jugador?.equipo_id);
  const baseData = buildBasePlanData({ jugador, nombre, contexto, contextoAdicional, menu: resolvedMenu, calendario });
  let generatedPlan = baseData;

  try {
    const aiData = await requestAiJson(buildPrompt({ jugador, contexto, contextoAdicional, menu: resolvedMenu, baseData }));
    generatedPlan = mergeAiPlanData(baseData, aiData);
  } catch (firstError) {
    try {
      const aiData = await requestAiJson(buildPrompt({ jugador, contexto, contextoAdicional, menu: resolvedMenu, baseData, retry: true }));
      generatedPlan = mergeAiPlanData(baseData, aiData);
    } catch (secondError) {
      console.warn('AI plan JSON fallback:', firstError.message, secondError.message);
    }
  }

  return reviewAndRepairPlanData({
    jugador,
    contexto,
    contextoAdicional,
    menu: resolvedMenu,
    planData: generatedPlan,
  });
}
