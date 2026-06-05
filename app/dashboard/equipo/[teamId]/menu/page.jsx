import { getSupabaseAdmin } from '@/lib/supabase-server';
import MenuSemanal from '@/components/MenuSemanal';

export const dynamic = 'force-dynamic';

export default async function MenuPage({ params }) {
  const supabase = getSupabaseAdmin();
  let menus = [];
  const teamId = params?.teamId;

  try {
    const { data, error } = await supabase
      .from('menu_semanal')
      .select('*')
      .order('semana', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    menus = data || [];
  } catch (err) {
    console.error('Error fetching menus:', err);
    menus = [];
  }

  return (
    <MenuSemanal menusIniciales={menus || []} teamId={teamId} />
  );
}
