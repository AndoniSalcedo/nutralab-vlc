import { getSupabaseAdmin } from '@/lib/supabase-server';
import TeamEvolutionDashboard from '@/components/TeamEvolutionDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamEvolutionPage() {
  const supabase = getSupabaseAdmin();
  let players = [];
  let evolutions = [];

  try {
    const [resPlayers, resEvolutions] = await Promise.all([
      supabase
        .from('jugadores')
        .select('id,nombre,apellidos,posicion')
        .order('nombre'),
      supabase
        .from('evoluciones')
        .select('id,jugador_id,fecha,peso_kg,porcentaje_grasa,masa_magra_kg,suma_6_pliegues')
        .order('fecha', { ascending: true }),
    ]);

    if (resPlayers.error) throw resPlayers.error;
    if (resEvolutions.error) throw resEvolutions.error;

    players = resPlayers.data || [];
    evolutions = resEvolutions.data || [];
  } catch (error) {
    console.error('Error fetching team evolution:', error);
  }

  return <TeamEvolutionDashboard players={players} evolutions={evolutions} />;
}
