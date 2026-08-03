import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!env.VLC_FOODS_API_KEY) {
    return NextResponse.json({ error: 'No está configurada la integración de alimentos.' }, { status: 503 });
  }

  try {
    const backendUrl = `${env.NUTRALAB_BACKEND_URL.replace(/\/$/, '')}/integrations/vlc/foods`;
    const response = await fetch(backendUrl, {
      headers: { 'x-nutralab-integration-key': env.VLC_FOODS_API_KEY },
      cache: 'no-store',
    });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.message || 'No se pudieron obtener los alimentos.' }, { status: response.status });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error obteniendo alimentos desde Nutralab:', error);
    return NextResponse.json({ error: 'No se pudo conectar con el catálogo de alimentos.' }, { status: 502 });
  }
}
