import { getSupabaseAdmin } from '@/lib/supabase-server';
import TeamsDashboard from '@/components/TeamsDashboard';
import { getUser } from '@/lib/auth';
import { getOwnerId } from '@/lib/team-access';
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

  const ownerId = getOwnerId(user);
  if (!ownerId) redirect('/login');

  let teams = [];
  try {
    const [resEquipos, resJugadores] = await Promise.all([
      supabase
        .from('equipos')
        .select('*')
        .eq('owner_id', ownerId)
        .order('temporada', { ascending: false })
        .order('nombre'),
      supabase
        .from('jugadores')
        .select('id,equipo_id,equipos!inner(owner_id)')
        .eq('equipos.owner_id', ownerId)
    ]);

    if (resEquipos.error) throw resEquipos.error;
    if (resJugadores.error) throw resJugadores.error;

    const counts = new Map();
    for (const player of resJugadores.data || []) {
      counts.set(String(player.equipo_id), (counts.get(String(player.equipo_id)) || 0) + 1);
    }

    teams = (resEquipos.data || []).map((team) => ({
      ...team,
      players_count: counts.get(String(team.id)) || 0,
    }));
  } catch (err) {
    console.error('Error fetching teams:', err);
  }

  return <TeamsDashboard teams={teams} />;
}
