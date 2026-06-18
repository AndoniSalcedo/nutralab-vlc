import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { generarDatosPlan } from '@/lib/ai-plan-generator';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const teamId = Number(searchParams.get('teamId'));
  
  const supabase = getSupabaseAdmin();
  const { data: jug } = await supabase.from('jugadores').select('*').eq('equipo_id', teamId).limit(1);
  if (!jug || !jug.length) return NextResponse.json({ error: 'No players found' });
  
  const rawPlayer = jug[0];
  const { data: evo } = await supabase.from('evoluciones').select('*').eq('jugador_id', rawPlayer.id).order('fecha', { ascending: true });
  const player = withLatestMeasurement(rawPlayer, evo || []);
  
  try {
    const baseData = await generarDatosPlan({
      jugador: player,
      nombre: 'Test Plan',
      contexto: 'semana_normal',
    });
    return NextResponse.json({
      player: player.nombre,
      peso: player.peso_kg,
      ingestas: baseData.dias?.lunes?.ingestas
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
