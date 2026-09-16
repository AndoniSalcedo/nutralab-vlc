'use server';

import { env } from '@/config/env';
import { getUser } from '@/lib/auth/session';

export async function getFoodsAction() {
  const user = await getUser();
  if (!user) throw new Error('No autorizado');
  if (!env.VLC_FOODS_API_KEY) {
    throw new Error('No está configurada la integración de alimentos.');
  }

  const backendUrl = `${env.NUTRALAB_BACKEND_URL.replace(/\/$/, '')}/integrations/vlc/foods`;
  const response = await fetch(backendUrl, {
    headers: { 'x-nutralab-integration-key': env.VLC_FOODS_API_KEY },
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'No se pudieron obtener los alimentos.');
  }
  return payload;
}
