import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/config/env';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedTeam, getAccessibleTeam } from '@/lib/team-access';
import {
  upsertMenu,
  getMenuById,
  updateMenu,
  deleteMenu,
  getMenusByTeamLimit
} from '@/repositories/menuRepository';

const client = new Anthropic({ apiKey: env.AI_API_KEY });

const MENU_TOOL_NAME = 'extraer_menu_semanal';
const MENU_MAX_TOKENS = 8192;

function parseDias(input) {
  if (!input) return null;
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parseDias(parsed);
    } catch {
      return null;
    }
  }
  if (typeof input === 'object') {
    if (Array.isArray(input.dias)) return input.dias;
    if (input.dias) return parseDias(input.dias);
  }
  return null;
}

function extractSemanaInicio(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return extractSemanaInicio(parsed);
    } catch {
      return null;
    }
  }
  if (typeof input === 'object') {
    if (input.semana_inicio && typeof input.semana_inicio === 'string') {
      return input.semana_inicio.trim();
    }
    if (input.semana && typeof input.semana === 'string') {
      return input.semana.trim();
    }
    if (input.dias && typeof input.dias === 'object' && !Array.isArray(input.dias)) {
      return extractSemanaInicio(input.dias);
    }
  }
  return null;
}

function extractMenuData(message) {
  if (message.stop_reason === 'max_tokens') {
    throw new Error('La extracción del menú se cortó por límite de tokens. Prueba a intentarlo de nuevo o usa un documento más conciso.');
  }

  const toolUse = message.content?.find((item) => item.type === 'tool_use' && item.name === MENU_TOOL_NAME);
  if (toolUse?.input) {
    const dias = parseDias(toolUse.input);
    const semanaInicio = extractSemanaInicio(toolUse.input);
    if (dias && Array.isArray(dias) && dias.length > 0) {
      return { dias, semanaInicio };
    }
  }

  // Fallback if tool call wasn't generated or input was in text
  const textBlock = message.content?.find((item) => item.type === 'text');
  if (textBlock?.text) {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const dias = parseDias(parsed);
        const semanaInicio = extractSemanaInicio(parsed);
        if (dias && Array.isArray(dias) && dias.length > 0) {
          return { dias, semanaInicio };
        }
      } catch {
        // Fallthrough to error
      }
    }
  }

  throw new Error('No se pudo extraer una estructura válida del menú desde el documento.');
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user || user.role === 'jugador' || user.role === 'tecnico') return forbidden('No autorizado');

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { semana, equipo_id, dias } = body;
      if (!semana || !equipo_id) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

      const supabase = getSupabaseAdmin();
      const team = await getOwnedTeam(supabase, user, equipo_id);
      if (!team) return forbidden('No tienes acceso a este equipo');

      const data = await upsertMenu(supabase, { semana, equipo_id, dias: dias || [], updated_at: new Date().toISOString() });
      return NextResponse.json({ ok: true, menu: data });
    }

    // Otherwise, handle form data (uploading file via AI)
    const formData = await req.formData();
    const archivo = formData.get('file');
    const semana = formData.get('semana');
    const equipoId = formData.get('equipo_id');
    if (user.role === 'tecnico') return forbidden('No autorizado');

    const supabase = getSupabaseAdmin();
    const team = await getOwnedTeam(supabase, user, equipoId);
    if (!team) return forbidden('No tienes acceso a este equipo');

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const base64 = buffer.toString('base64');
    const esImagen = archivo.type.startsWith('image/');
    const mediaPDF = 'application/pdf';

    const contentItem = esImagen
      ? { type: 'image', source: { type: 'base64', media_type: archivo.type, data: base64 } }
      : { type: 'document', source: { type: 'base64', media_type: mediaPDF, data: base64 } };

    const message = await client.messages.create({
      model: env.CHAT_MODEL,
      max_tokens: MENU_MAX_TOKENS,
      thinking: { type: 'disabled' },
      tool_choice: { type: 'tool', name: MENU_TOOL_NAME },
      tools: [{
        name: MENU_TOOL_NAME,
        description: 'Guarda la estructura extraída del menú semanal de comedor.',
        input_schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            semana_inicio: {
              type: ['string', 'null'],
              description: 'Fecha del lunes de inicio de la semana en formato YYYY-MM-DD si figura explícitamente en el documento (ej: "2026-09-07"). Si no figura, null.',
            },
            dias: {
              type: 'array',
              description: 'Lista de días de la semana con sus menús correspondientes.',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  dia: {
                    type: 'string',
                    description: 'Nombre del día de la semana en español, exactamente uno de: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo.',
                  },
                  comida: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      primero: { type: ['string', 'null'], description: 'Primeros platos de la comida / almuerzo. Si hay varios, sepáralos con /.' },
                      segundo: { type: ['string', 'null'], description: 'Segundos platos de la comida / almuerzo. Si hay varios, sepáralos con /.' },
                      postre: { type: ['string', 'null'], description: 'Postre de la comida / almuerzo. Si no hay, usa null.' },
                    },
                    required: ['primero', 'segundo', 'postre'],
                  },
                  cena: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      primero: { type: ['string', 'null'], description: 'Primeros platos de la cena. Si hay varios, sepáralos con /.' },
                      segundo: { type: ['string', 'null'], description: 'Segundos platos de la cena. Si hay varios, sepáralos con /.' },
                      postre: { type: ['string', 'null'], description: 'Postre de la cena. Si no hay, usa null.' },
                    },
                    required: ['primero', 'segundo', 'postre'],
                  },
                },
                required: ['dia', 'comida', 'cena'],
              },
            },
          },
          required: ['dias'],
        },
      }],
      messages: [{
        role: 'user',
        content: [
          contentItem,
          {
            type: 'text',
            text: `Extrae el menú de comedor de este documento y llama a la herramienta ${MENU_TOOL_NAME}.
IMPORTANTE:
1. Extrae la fecha del lunes de inicio de la semana si figura en el documento (ej: "7 de septiembre al 13 de septiembre de 2026" -> semana_inicio: "2026-09-07"). Si no figura fecha en el documento, usa "${semana}".
2. Para el campo 'dias', devuelve un array nativo de objetos con los días de la semana (Lunes a Domingo).
3. Si en un servicio (comida o cena) hay varias opciones o platos (cremas, arroces, pastas, carnes, pescados, guarniciones, ensaladas del día), inclúyelos separados por ' / '.
4. Si el documento indica postres generales (ej: "De postre, fruta y yogures proteicos"), incluye ese postre en la comida y/o cena según corresponda. Si algún plato no figura o es descanso/partido, indica el texto correspondiente (ej: "COMIDA PREPARTIDO EN HOTEL", "PARTIDO SEVILLA - VALENCIA CF") o usa null.`
          }
        ]
      }]
    });

    const { dias: extractedDias, semanaInicio } = extractMenuData(message);

    // Sanitize and format parsed dias to ensure all days are represented cleanly
    const formattedDias = extractedDias.map((d) => ({
      dia: d.dia,
      comida: {
        primero: d.comida?.primero || null,
        segundo: d.comida?.segundo || null,
        postre: d.comida?.postre || null,
      },
      cena: {
        primero: d.cena?.primero || null,
        segundo: d.cena?.segundo || null,
        postre: d.cena?.postre || null,
      },
    }));

    const finalSemana = (semanaInicio && /^\d{4}-\d{2}-\d{2}$/.test(semanaInicio)) ? semanaInicio : semana;

    const data = await upsertMenu(supabase, { semana: finalSemana, equipo_id: equipoId, dias: formattedDias, updated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, menu: data });
  } catch (e) {
    console.error('Error en POST /api/menu-semanal:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getUser();
    if (!user || user.role === 'jugador' || user.role === 'tecnico') return forbidden('No autorizado');

    const body = await req.json();
    const { id, dias } = body;
    if (!id || !dias) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const menu = await getMenuById(supabase, id);
    if (!menu) return NextResponse.json({ error: 'Menú no encontrado' }, { status: 404 });

    const team = await getOwnedTeam(supabase, user, menu.equipo_id);
    if (!team) return forbidden('No tienes acceso a este equipo');

    const data = await updateMenu(supabase, id, { dias, updated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, menu: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const semana = searchParams.get('semana');
  const equipoId = searchParams.get('equipo_id');
  if (!equipoId) return NextResponse.json({ error: 'Falta equipo_id' }, { status: 400 });

  const user = await getUser();
  if (!user) return forbidden('No autenticado');

  const supabase = getSupabaseAdmin();
  if (user.role === 'jugador') {
    const { data: player } = await supabase.from('jugadores').select('equipo_id').eq('id', user.id).single();
    if (String(player?.equipo_id) !== String(equipoId)) return forbidden('No autorizado');
  } else {
    const team = await getAccessibleTeam(supabase, user, equipoId);
    if (!team) return forbidden('No tienes acceso a este equipo');
  }

  try {
    const data = await getMenusByTeamLimit(supabase, equipoId, semana, 10);
    return NextResponse.json({ menus: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const menu = await getMenuById(supabase, id);
    if (!menu) return NextResponse.json({ error: 'Menú no encontrado' }, { status: 404 });

    const team = await getOwnedTeam(supabase, user, menu.equipo_id);
    if (!team) return forbidden('No tienes acceso a este equipo');

    await deleteMenu(supabase, id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}