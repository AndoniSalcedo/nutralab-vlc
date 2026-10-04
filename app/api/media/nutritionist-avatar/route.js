import { NextResponse } from 'next/server';
import { getNutritionistAvatar } from '@/lib/db/nutralab';
import { getUser } from '@/lib/auth/session';
import { forbidden, getOwnerId } from '@/lib/auth/team-access';
import { imageResponse } from '@/lib/security/media';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedId = searchParams.get('id');

    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    // Cada nutricionista solo puede ver su propio avatar.
    if (user.role !== 'admin') return forbidden('No tienes acceso a este avatar');
    const ownId = user.external_admin_id || user.id || getOwnerId(user);
    const id = requestedId || ownId;
    if (!id) return NextResponse.json({ error: 'Falta id del nutricionista' }, { status: 400 });
    if (String(id) !== String(ownId)) return forbidden('No tienes acceso a este avatar');

    const nutri = await getNutritionistAvatar(id);

    if (!nutri || !nutri.avatar) {
      return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 });
    }

    return imageResponse(nutri.avatar, nutri.avatarMime);
  } catch (e) {
    console.error('Error in media/nutritionist-avatar GET:', e);
    return NextResponse.json({ error: 'Error al cargar la imagen' }, { status: 500 });
  }
}
