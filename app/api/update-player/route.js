import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import { updatePlayer } from '@/repositories/playerRepository';

const CAMPOS_PERMITIDOS = [
  'notas_hidratacion', 'notas_suplementacion', 'notas_protocolos',
  'gustos_preferencias', 'aversiones', 'intolerancias', 'alergias',
  'contexto_clinico', 'objetivo', 'posicion', 'num_comidas', 'preentreno', 'postentreno', 'recomendaciones_defecto', 'config_prepartido',
  'porcentaje_grasa_objetivo', 'protocolos_custom',
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
    if (!user || user.role === 'jugador' || user.role === 'tecnico') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    let parsedValue = value;
    if (field === 'porcentaje_grasa_objetivo') {
      parsedValue = Number(value) || 10;
    } else if (field === 'protocolos_custom') {
      parsedValue = typeof value === 'object' && value !== null ? value : {};
    }
    await updatePlayer(supabase, id, { [field]: parsedValue });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

