import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
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

    const supabase = getSupabaseAdmin();

    if (user.role === 'jugador') {
      if (String(user.id) !== String(id)) {
        return forbidden('No tienes acceso a este jugador');
      }
    } else {
      const accessible = await getAccessiblePlayer(supabase, user, id);
      if (!accessible) return forbidden('No tienes acceso a este jugador');
    }

    const player = await getPlayerAvatar(supabase, id);
    if (!player || !player.avatar) {
      return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 });
    }

    return imageResponse(player.avatar, player.avatar_mime);
  } catch (e) {
    console.error('Error in media/player-avatar GET:', e);
    return NextResponse.json({ error: 'Error al cargar la imagen' }, { status: 500 });
  }
}
