import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { generarDatosPlan } from '@/lib/ai-plan-generator';
import { getPlayersByTeam } from '@/repositories/playerRepository';
import { getTeamById } from '@/repositories/teamRepository';
import { getEvolutionsByPlayerIdOrdered } from '@/repositories/evolutionRepository';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const teamId = Number(searchParams.get('teamId'));
  
  const supabase = getSupabaseAdmin();
  const players = await getPlayersByTeam(supabase, teamId);
  if (!players || !players.length) return NextResponse.json({ error: 'No players found' });
  
  const rawPlayer = players[0];
  const team = await getTeamById(supabase, teamId);
  const teamConfig = team?.configuracion_nutricional;

  const evo = await getEvolutionsByPlayerIdOrdered(supabase, rawPlayer.id);
  const player = withLatestMeasurement(rawPlayer, evo || []);
  
  try {
    const baseData = await generarDatosPlan({
      jugador: player,
      nombre: 'Test Plan',
      contexto: 'semana_normal',
      teamConfig
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

