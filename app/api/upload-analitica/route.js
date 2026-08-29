import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/config/env';
import {
  insertAnalytics,
  getAnalyticsById,
  deleteAnalytics,
  updateAnalyticsVisibility
} from '@/repositories/analyticsRepository';

const client = new Anthropic({ apiKey: env.AI_API_KEY });
const ANALITICA_TOOL_NAME = 'guardar_analitica';
const ANALITICA_MAX_TOKENS = env.ANALITICA_MAX_TOKENS;

function extractAnalitica(message) {
  if (message.stop_reason === 'max_tokens') {
    throw new Error('La extracción se cortó por límite de tokens. Prueba con un PDF más corto o vuelve a intentarlo.');
  }

  const toolUse = message.content.find((item) => item.type === 'tool_use' && item.name === ANALITICA_TOOL_NAME);
  const parametros = toolUse?.input?.parametros;
  if (!Array.isArray(parametros)) {
    throw new Error('No se pudieron extraer parámetros válidos de la analítica.');
  }

  return parametros;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('file');
    const jugadorId = formData.get('jugador_id');
    const fechaExtraccion = formData.get('fecha_extraccion');
    if (!archivo || !jugadorId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador' || user.role === 'tecnico') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const base64 = buffer.toString('base64');

    const message = await client.messages.create({
      model: env.CHAT_MODEL,
      max_tokens: ANALITICA_MAX_TOKENS,
      thinking: { type: 'disabled' },
      tool_choice: { type: 'tool', name: ANALITICA_TOOL_NAME },
      tools: [{
        name: ANALITICA_TOOL_NAME,
        description: 'Guarda los parámetros extraídos de una analítica de sangre en un formato estructurado.',
        input_schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            parametros: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  nombre: { type: 'string', description: 'Nombre exacto del parámetro en el PDF.' },
                  valor: { type: 'number', description: 'Valor numérico del parámetro.' },
                  unidad: { type: 'string', description: 'Unidad de medida. Usa una cadena vacía si no aparece.' },
                  rango_min: { type: ['number', 'null'], description: 'Límite inferior de referencia, o null si no aparece.' },
                  rango_max: { type: ['number', 'null'], description: 'Límite superior de referencia, o null si no aparece.' },
                  fuera_rango: { type: 'boolean', description: 'true si el PDF marca el valor fuera de rango o está en negrita.' },
                },
                required: ['nombre', 'valor', 'unidad', 'rango_min', 'rango_max', 'fuera_rango'],
              },
            },
          },
          required: ['parametros'],
        },
      }],
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: `Extrae TODOS los parámetros de este análisis de sangre y llama a la herramienta ${ANALITICA_TOOL_NAME}.
          Para cada parámetro incluye: nombre exacto del PDF, valor numérico, unidad, rango mínimo y máximo de referencia, y si está fuera de rango. Si el valor está en negrita en el PDF, fuera_rango es true. Si un rango de referencia no aparece, usa null.` }
        ]
      }]
    });

    const parametros = extractAnalitica(message);

    const data = await insertAnalytics(supabase, {
      jugador_id: parseInt(jugadorId),
      fecha_extraccion: fechaExtraccion || null,
      parametros,
      pdf_nombre: archivo.name,
    });

    return NextResponse.json({ ok: true, analitica: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador' || user.role === 'tecnico') return forbidden('No autorizado');

    const analitica = await getAnalyticsById(supabase, id);
    if (!analitica) return NextResponse.json({ error: 'Analítica no encontrada' }, { status: 404 });

    const ownedPlayer = await getOwnedPlayer(supabase, user, analitica.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    await deleteAnalytics(supabase, id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, visible_para_jugador } = await req.json();
    if (!id || typeof visible_para_jugador !== 'boolean') {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador' || user.role === 'tecnico') return forbidden('No autorizado');

    const analitica = await getAnalyticsById(supabase, id);
    if (!analitica) return NextResponse.json({ error: 'Analítica no encontrada' }, { status: 404 });

    const ownedPlayer = await getOwnedPlayer(supabase, user, analitica.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const data = await updateAnalyticsVisibility(supabase, id, visible_para_jugador);
      
    return NextResponse.json({ ok: true, analitica: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

