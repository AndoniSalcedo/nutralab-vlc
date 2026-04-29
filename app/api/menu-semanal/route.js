import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('file');
    const semana = formData.get('semana');
    if (!archivo || !semana) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const base64 = buffer.toString('base64');
    const esImagen = archivo.type.startsWith('image/');
    const mediaPDF = 'application/pdf';

    const contentItem = esImagen
      ? { type: 'image', source: { type: 'base64', media_type: archivo.type, data: base64 } }
      : { type: 'document', source: { type: 'base64', media_type: mediaPDF, data: base64 } };

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
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

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('menu_semanal')
      .upsert({ semana, dias: parsed.dias, updated_at: new Date().toISOString() }, { onConflict: 'semana' })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, menu: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const semana = searchParams.get('semana');
  const supabase = getSupabaseAdmin();
  const query = supabase.from('menu_semanal').select('*').order('semana', { ascending: false });
  if (semana) query.eq('semana', semana);
  const { data, error } = await query.limit(10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menus: data });
}