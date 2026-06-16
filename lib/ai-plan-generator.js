import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { buildBasePlanData, mergeAiPlanData } from '@/lib/nutrition-plan-card';
import { env } from '@/lib/env';

const client = new Anthropic({ apiKey: env.AI_API_KEY });

const CONTEXTOS = {
  semana_normal: 'semana normal de entrenamiento (3-4 sesiones)',
  semana_partido: 'semana con partido oficial (microciclo competitivo)',
  dia_partido: 'dia de partido (ajuste maximo de timing nutricional)',
  viaje: 'viaje o desplazamiento para jugar fuera',
  lesion: 'periodo de lesion o inactividad reducida',
  vacaciones: 'periodo vacacional fuera de temporada',
  pretemporada: 'pretemporada (alta carga de trabajo)',
};

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

export async function latestMenu(supabase) {
  const { data } = await supabase
    .from('menu_semanal')
    .select('*')
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
    '- Para cada día, rellena las ingestas correspondientes según su tipoDia.',
    '- No incluyas explicación larga.',
    '',
    'Jugador:',
    `Nombre: ${jugador.nombre || ''} ${jugador.apellidos || ''}`,
    `Posición: ${jugador.posicion || 'No especificada'}`,
    `Peso: ${jugador.peso_kg || '?'} kg | Grasa: ${jugador.porcentaje_grasa || '?'}% | Masa magra: ${jugador.masa_magra_kg || '?'} kg`,
    `Objetivo: ${jugador.objetivo || 'Rendimiento deportivo óptimo'}`,
    `Gustos/preferencias: ${jugador.gustos_preferencias || 'No especificados'}`,
    `Contexto clínico: ${jugador.contexto_clinico || 'Sin particularidades'}`,
    restrictionsToPrompt(jugador),
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

export async function generarDatosPlan({ jugador, nombre, contexto, contextoAdicional, calendario, menu }) {
  const supabase = getSupabaseAdmin();
  const resolvedMenu = menu !== undefined ? menu : await latestMenu(supabase);
  const baseData = buildBasePlanData({ jugador, nombre, contexto, contextoAdicional, menu: resolvedMenu, calendario });

  try {
    const aiData = await requestAiJson(buildPrompt({ jugador, contexto, contextoAdicional, menu: resolvedMenu, baseData }));
    return mergeAiPlanData(baseData, aiData);
  } catch (firstError) {
    try {
      const aiData = await requestAiJson(buildPrompt({ jugador, contexto, contextoAdicional, menu: resolvedMenu, baseData, retry: true }));
      return mergeAiPlanData(baseData, aiData);
    } catch (secondError) {
      console.warn('AI plan JSON fallback:', firstError.message, secondError.message);
      return baseData;
    }
  }
}
