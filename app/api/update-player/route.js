import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const CAMPOS_PERMITIDOS = [
  'notas_hidratacion', 'notas_suplementacion', 'notas_protocolos',
  'gustos_preferencias', 'aversiones', 'intolerancias', 'alergias',
  'contexto_clinico', 'objetivo', 'posicion', 'num_comidas',
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, field, value } = body;
    if (!id || !field || !CAMPOS_PERMITIDOS.includes(field)) {
      return NextResponse.json({ error: 'Campo no permitido: ' + field }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('jugadores').update({ [field]: value }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}