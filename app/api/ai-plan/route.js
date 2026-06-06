import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import { buildBasePlanData, mergeAiPlanData, planDataToLegacyContent, sanitizePlanData } from '@/lib/nutrition-plan-card';
import { withLatestMeasurement } from '@/lib/player-metrics';

const client = new Anthropic();

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
  const parsed = Number(process.env.AI_PLAN_MAX_TOKENS);
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

async function latestMenu(supabase) {
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

function buildPrompt({ jugador, contexto, contextoAdicional, menu, baseData, retry = false }) {
  return [
    'Eres Carlos Ferrando, nutricionista del Valencia CF.',
    'Completa una ficha nutricional breve. Devuelve SOLO JSON válido, sin Markdown ni texto alrededor.',
    retry ? 'Respuesta anterior inválida o incompleta. Hazla más corta y estrictamente JSON.' : '',
    '',
    'Formato exacto:',
    '{"tiposDia":{"entreno":{"ingestas":[{"nombre":"Desayuno","detalle":"..."},{"nombre":"Batido post","detalle":"..."},{"nombre":"Comida","detalle":"..."},{"nombre":"Merienda","detalle":"..."},{"nombre":"Cena","detalle":"..."}]},"descanso":{"ingestas":[{"nombre":"Desayuno","detalle":"..."},{"nombre":"Media mañana","detalle":"..."},{"nombre":"Comida","detalle":"..."},{"nombre":"Merienda","detalle":"..."},{"nombre":"Cena","detalle":"..."}]},"partido":{"ingestas":[{"nombre":"Desayuno","detalle":"..."},{"nombre":"Comida pre","detalle":"..."},{"nombre":"-60 min","detalle":"..."},{"nombre":"Durante","detalle":"..."},{"nombre":"Post","detalle":"..."}]}},"notas":["...","...","...","..."]}',
    '',
    'Reglas:',
    '- Cada detalle debe ser una frase corta con cantidades aproximadas.',
    '- Comida y cena deben usar como base el menú de ciudad deportiva cuando exista.',
    '- Evita estrictamente alergias, intolerancias y aversiones.',
    '- No cambies nombres de tipos de día.',
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
    'Macros ya calculados por la app, no los cambies:',
    JSON.stringify(baseData.tiposDia),
  ].filter(Boolean).join('\n');
}

async function requestAiJson(prompt) {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: maxTokens(),
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content.find((item) => item.type === 'text')?.text || '';
  if (message.stop_reason === 'max_tokens') {
    throw new Error('La generación se cortó por límite de tokens');
  }

  return extractJson(text);
}

async function generarDatosPlan({ jugador, nombre, contexto, contextoAdicional }) {
  const supabase = getSupabaseAdmin();
  const menu = await latestMenu(supabase);
  const baseData = buildBasePlanData({ jugador, nombre, contexto, contextoAdicional, menu });

  try {
    const aiData = await requestAiJson(buildPrompt({ jugador, contexto, contextoAdicional, menu, baseData }));
    return mergeAiPlanData(baseData, aiData);
  } catch (firstError) {
    try {
      const aiData = await requestAiJson(buildPrompt({ jugador, contexto, contextoAdicional, menu, baseData, retry: true }));
      return mergeAiPlanData(baseData, aiData);
    } catch (secondError) {
      console.warn('AI plan JSON fallback:', firstError.message, secondError.message);
      return baseData;
    }
  }
}

async function loadPlayerWithLatestMetrics(supabase, jugadorId) {
  const [{ data: jugador, error: jugadorError }, { data: evoluciones, error: evolucionesError }] = await Promise.all([
    supabase.from('jugadores').select('*').eq('id', jugadorId).single(),
    supabase.from('evoluciones').select('*').eq('jugador_id', jugadorId).order('fecha', { ascending: true }),
  ]);

  if (jugadorError) throw jugadorError;
  if (evolucionesError) throw evolucionesError;
  return withLatestMeasurement(jugador, evoluciones || []);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jugadorId = searchParams.get('jugador_id');
    if (!jugadorId) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (user.role === 'jugador' && String(user.id) !== String(jugadorId)) return forbidden();
    if (user.role !== 'jugador') {
      const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
      if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    }

    const { data, error } = await supabase
      .from('planes_ia')
      .select('id,jugador_id,nombre,contexto,contexto_adicional,contenido,datos,created_at,updated_at')
      .eq('jugador_id', jugadorId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ planes: data || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { jugador, nombre, contexto, contextoAdicional, contenido, datos, draftOnly = false } = await req.json();
    const planNombre = String(nombre || '').trim();
    if (!jugador?.id) return NextResponse.json({ error: 'Falta jugador' }, { status: 400 });
    if (!planNombre) return NextResponse.json({ error: 'El nombre del plan es obligatorio' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador.id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    const jugadorConMetricas = await loadPlayerWithLatestMetrics(supabase, jugador.id);

    const generatedDatos = draftOnly || (!datos && contenido === undefined)
      ? await generarDatosPlan({ jugador: jugadorConMetricas, nombre: planNombre, contexto, contextoAdicional })
      : sanitizePlanData(datos);

    if (draftOnly) {
      return NextResponse.json({ datos: generatedDatos });
    }

    const finalContenido = generatedDatos ? planDataToLegacyContent(generatedDatos) : String(contenido || '');
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('planes_ia')
      .insert({
        jugador_id: jugador.id,
        nombre: planNombre,
        contexto,
        contexto_adicional: contextoAdicional || '',
        contenido: finalContenido,
        datos: generatedDatos,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, nombre, contenido, datos, contexto, contextoAdicional } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta id del plan' }, { status: 400 });
    const planNombre = String(nombre || '').trim();
    if (!planNombre) return NextResponse.json({ error: 'El nombre del plan es obligatorio' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

    const { data: currentPlan, error: currentPlanError } = await supabase
      .from('planes_ia')
      .select('jugador_id')
      .eq('id', id)
      .single();

    if (currentPlanError) throw currentPlanError;
    const ownedPlayer = await getOwnedPlayer(supabase, user, currentPlan.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const sanitizedDatos = sanitizePlanData(datos);
    const finalContenido = sanitizedDatos ? planDataToLegacyContent(sanitizedDatos) : String(contenido || '');

    const { data, error } = await supabase
      .from('planes_ia')
      .update({
        nombre: planNombre,
        contenido: finalContenido,
        datos: sanitizedDatos,
        contexto,
        contexto_adicional: contextoAdicional || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
