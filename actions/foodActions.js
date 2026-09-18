'use server';

import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function getFoods() {
  const user = await getUser();
  if (!user) throw new Error('No autorizado');

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .schema('public')
    .from('Food')
    .select('id, name, kcal, cho, pro, fat, sortOrder')
    .order('sortOrder', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching foods directly from public.Food:', error);
    throw new Error('No se pudieron obtener los alimentos.');
  }

  return data || [];
}
