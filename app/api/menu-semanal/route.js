import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';
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

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

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
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          contentItem,
          { type: 'text', text: `Extrae el menú de comedor de este documento y devuelve SOLO un JSON con este formato exacto, sin texto adicional:
          {
            "dias": [
              {
                "dia": "Lunes",
                "comida": { "primero": "...", "segundo": "...", "postre": "..." },
                "cena": { "primero": "...", "segundo": "...", "postre": "..." }
              }
            ]
          }
          Incluye todos los días que aparezcan (Lunes a Domingo). Si no hay postre, pon null. Si un plato no está claro, escribe lo que veas.` }
        ]
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const data = await upsertMenu(supabase, { semana, equipo_id: equipoId, dias: parsed.dias, updated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, menu: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

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