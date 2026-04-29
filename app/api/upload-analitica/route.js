import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('file');
    const jugadorId = formData.get('jugador_id');
    const fechaExtraccion = formData.get('fecha_extraccion');
    if (!archivo || !jugadorId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const base64 = buffer.toString('base64');

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: `Extrae TODOS los parámetros de este análisis de sangre y devuelve SOLO un JSON con este formato exacto, sin texto adicional:
          {
            "parametros": [
              { "nombre": "San-Hemoglobina", "valor": 15.2, "unidad": "g/dl", "rango_min": 13, "rango_max": 18, "fuera_rango": false },
              ...
            ]
          }
          Para cada parámetro incluye: nombre exacto del PDF, valor numérico, unidad, rango mínimo y máximo de referencia, y si está fuera de rango (true/false). Si el valor está en negrita en el PDF, fuera_rango es true.` }
        ]
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('analiticas').insert({
      jugador_id: parseInt(jugadorId),
      fecha_extraccion: fechaExtraccion || null,
      parametros: parsed.parametros,
      pdf_nombre: archivo.name,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, analitica: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}