import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer, getAccessiblePlayer } from '@/lib/team-access';
import {
  getEvolutionsByPlayerId,
  getEvolutionById,
  updateEvolution,
  upsertEvolution,
  deleteEvolution
} from '@/repositories/evolutionRepository';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jugadorId = searchParams.get('jugador_id');
  if (!jugadorId) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.role === 'jugador' && String(user.id) !== String(jugadorId)) return forbidden();
  if (user.role !== 'jugador') {
    const accessiblePlayer = await getAccessiblePlayer(supabase, user, jugadorId);
    if (!accessiblePlayer) return forbidden('No tienes acceso a este jugador');
  }

  try {
    const data = await getEvolutionsByPlayerId(supabase, jugadorId);
    return NextResponse.json({ evoluciones: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const EVOLUTION_FIELDS = [
  'fecha',
  'altura_cm',
  'peso_kg',
  'porcentaje_grasa',
  'masa_magra_kg',
  'pliegue_biceps',
  'pliegue_triceps',
  'pliegue_subescapular',
  'pliegue_cresta_iliaca',
  'pliegue_supraeliaco',
  'pliegue_abdominal',
  'pliegue_pantorrilla',
  'pliegue_muslo',
  'suma_6_pliegues',
  'suma_8_pliegues',
  'porcentaje_grasa_faulkner',
  'porcentaje_grasa_yuhasz',
  'peso_oseo',
  'peso_residual',
  'peso_graso',
  'peso_muscular',
  'peso_magro',
  'peso_deseable',
  'endomorfia',
  'mesomorfia',
  'ectomorfia',
  'perimetro_brazo_contraido',
  'perimetro_pantorrilla_derecha',
  'perimetro_pantorrilla_izquierda',
  'perimetro_muslo_derecho',
  'perimetro_muslo_izquierdo',
  'perimetro_pantorrilla',
  'perimetro_muslo',
  'notas'
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, jugador_id, fecha } = body;
    if (!jugador_id || !fecha) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador' || user.role === 'tecnico') return forbidden('No autorizado');
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const payload = {};
    for (const key of EVOLUTION_FIELDS) {
      if (body[key] !== undefined) {
        payload[key] = body[key];
      }
    }

    let data;
    if (id) {
      data = await updateEvolution(supabase, id, payload);
    } else {
      data = await upsertEvolution(supabase, {
        jugador_id,
        ...payload
      });
    }

    return NextResponse.json({ ok: true, evolucion: data });
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

    const evolucion = await getEvolutionById(supabase, id);
    if (!evolucion) return NextResponse.json({ error: 'Medición no encontrada' }, { status: 404 });

    const ownedPlayer = await getOwnedPlayer(supabase, user, evolucion.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    await deleteEvolution(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

