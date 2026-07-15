import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import { updatePlayer } from '@/repositories/playerRepository';

const CAMPOS_PERMITIDOS = [
  'notas_hidratacion', 'notas_suplementacion', 'notas_protocolos',
  'gustos_preferencias', 'aversiones', 'intolerancias', 'alergias',
  'contexto_clinico', 'objetivo', 'posicion', 'num_comidas', 'postentreno', 'recomendaciones_defecto',
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, field, value } = body;
    if (!id || !field || !CAMPOS_PERMITIDOS.includes(field)) {
      return NextResponse.json({ error: 'Campo no permitido: ' + field }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    await updatePlayer(supabase, id, { [field]: value });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

