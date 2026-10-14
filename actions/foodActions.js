'use server';

import { getUser } from '@/lib/auth/session';
import { getAllFoods } from '@/lib/db/nutralab';
import { ActionError } from '@/lib/actionError';

export async function getFoods() {
  const user = await getUser();
  if (!user) throw new ActionError('No autorizado');

  try {
    return await getAllFoods();
  } catch (error) {
    console.error('Error fetching foods directly from public.Food:', error);
    throw new ActionError('No se pudieron obtener los alimentos.');
  }
}
