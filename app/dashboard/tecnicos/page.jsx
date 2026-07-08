import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnerId } from '@/lib/team-access';
import { redirect } from 'next/navigation';
import TecnicosManager from '@/components/TecnicosManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TecnicosPage() {
  const supabase = getSupabaseAdmin();
  const user = await getUser();

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  const ownerId = getOwnerId(user);
  if (!ownerId) redirect('/login');

  let teams = [];
  try {
    const { data, error } = await supabase
      .from('equipos')
      .select('id, nombre, temporada')
      .eq('owner_id', ownerId)
      .order('temporada', { ascending: false })
      .order('nombre');

    if (error) throw error;
    teams = data || [];
  } catch (err) {
    console.error('Error fetching teams for tecnicos page:', err);
  }

  return <TecnicosManager teams={teams} />;
}
