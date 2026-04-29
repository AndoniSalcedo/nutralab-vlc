import { getSupabaseAdmin } from '@/lib/supabase-server';
import DashboardContent from '@/components/DashboardContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  const supabase = getSupabaseAdmin();
  let players = [];
  let error = null;

  try {
    const { data, error: sbError } = await supabase
      .from('jugadores')
      .select('id,nombre,apellidos,posicion,kcal_objetivo,peso_kg,porcentaje_grasa,masa_magra_kg')
      .order('nombre');

    if (sbError) throw sbError;
    players = data || [];
  } catch (err) {
    console.error('Error fetching players:', err);
    error = err;
    players = [];
  }

  return <DashboardContent players={players} />;
}