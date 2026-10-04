import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { forbidden, getAccessibleTeam } from '@/lib/auth/team-access';
import { getTeamPhoto } from '@/repositories/teamRepository';
import { getPlayerById } from '@/repositories/playerRepository';
import { imageResponse } from '@/lib/security/media';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Falta id del equipo' }, { status: 400 });

    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const db = getDb();

    // Solo el staff con acceso al equipo, o los jugadores de ese equipo.
    if (user.role === 'jugador') {
      const player = await getPlayerById(db, user.id);
      if (!player || String(player.equipo_id) !== String(id)) {
        return forbidden('No tienes acceso a este equipo');
      }
    } else {
      const accessible = await getAccessibleTeam(db, user, id);
      if (!accessible) return forbidden('No tienes acceso a este equipo');
    }

    const team = await getTeamPhoto(db, id);
    if (!team || !team.foto) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
    }

    return imageResponse(team.foto, team.foto_mime);
  } catch (e) {
    console.error('Error in media/team-avatar GET:', e);
    return NextResponse.json({ error: 'Error al cargar la imagen' }, { status: 500 });
  }
}
