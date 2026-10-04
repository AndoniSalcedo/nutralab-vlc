import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { forbidden, getAccessiblePlayer } from '@/lib/auth/team-access';
import { getMealPhotoWithMeta } from '@/repositories/mealsRepository';
import { imageResponse } from '@/lib/security/media';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const db = getDb();
    const meal = await getMealPhotoWithMeta(db, id);
    if (!meal) return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });

    if (user.role === 'jugador') {
      if (String(user.id) !== String(meal.jugador_id)) {
        return forbidden('No tienes acceso a este jugador');
      }
    } else {
      const accessiblePlayer = await getAccessiblePlayer(db, user, meal.jugador_id);
      if (!accessiblePlayer) return forbidden('No tienes acceso a este jugador');
    }

    if (!meal.photo) {
      return NextResponse.json({ error: 'Comida sin foto' }, { status: 404 });
    }

    // Datos de salud: caché solo privada (nunca compartida por CDN/proxies).
    return imageResponse(meal.photo, meal.photo_mime, { maxAge: 86400, immutable: true });
  } catch (e) {
    console.error('Error in media/meal-photo GET:', e);
    return NextResponse.json({ error: 'Error al cargar la imagen' }, { status: 500 });
  }
}
