import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { forbidden, getAccessiblePlayer } from '@/lib/auth/team-access';
import { getPlayerAvatar } from '@/repositories/playerRepository';
import { imageResponse } from '@/lib/security/media';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    if (!id && user.role === 'jugador') {
      id = user.id;
    }
    if (!id) return NextResponse.json({ error: 'Falta id del jugador' }, { status: 400 });

    const db = getDb();

    if (user.role === 'jugador') {
      if (String(user.id) !== String(id)) {
        return forbidden('No tienes acceso a este jugador');
      }
    } else {
      const accessible = await getAccessiblePlayer(db, user, id);
      if (!accessible) return forbidden('No tienes acceso a este jugador');
    }

    const player = await getPlayerAvatar(db, id);
    if (!player || !player.avatar) {
      return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 });
    }

    return imageResponse(player.avatar, player.avatar_mime);
  } catch (e) {
    console.error('Error in media/player-avatar GET:', e);
    return NextResponse.json({ error: 'Error al cargar la imagen' }, { status: 500 });
  }
}
