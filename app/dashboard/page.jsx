import { getSupabaseAdmin } from '@/lib/supabase-server';
import DashboardContent from '@/components/DashboardContent';
import { getUser } from '@/lib/auth';
import { withLatestMeasurement } from '@/lib/player-metrics';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  const supabase = getSupabaseAdmin();
  const user = await getUser();
  
  // Jugador flow
  if (user?.role === 'jugador') {
    const { data: jugador } = await supabase.from('jugadores').select('*').eq('id', user.id).single();
    
    if (!jugador) {
      return <p>Error: No se encontró tu perfil de jugador.</p>;
    }

    redirect(`/dashboard/jugador/${jugador.id}`);
  }

  // Admin flow
  let players = [];
  let teamEvolutions = [];
  try {
    const [resJugadores, resEvoluciones] = await Promise.all([
      supabase
        .from('jugadores')
        .select('id,nombre,apellidos,posicion,kcal_objetivo,factor_actividad,auth_user_id,auth_email,credentials_created_at')
        .order('nombre'),
      supabase
        .from('evoluciones')
        .select('jugador_id,fecha,peso_kg,porcentaje_grasa,masa_magra_kg')
    ]);

    if (resJugadores.error) throw resJugadores.error;
    if (resEvoluciones.error) throw resEvoluciones.error;
    
    const evoluciones = resEvoluciones.data || [];
    players = (resJugadores.data || []).map((player) => (
      withLatestMeasurement(player, evoluciones.filter((item) => String(item.jugador_id) === String(player.id)))
    ));
    teamEvolutions = resEvoluciones.data || [];
  } catch (err) {
    console.error('Error fetching players/evolutions:', err);
  }

  return <DashboardContent players={players} teamEvolutions={teamEvolutions} />;
}
