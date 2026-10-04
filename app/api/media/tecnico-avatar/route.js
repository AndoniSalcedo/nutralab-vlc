import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { forbidden, getOwnerId } from '@/lib/auth/team-access';
import { getTecnicoById, getNutricionistaTecnicoLink } from '@/repositories/tecnicoRepository';
import { imageResponse } from '@/lib/security/media';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    if (!id && user.role === 'tecnico') {
      id = user.id;
    }
    if (!id) return NextResponse.json({ error: 'Falta id del técnico' }, { status: 400 });

    const db = getDb();

    // Un técnico solo ve su propio avatar; un nutricionista, el de sus técnicos vinculados.
    if (user.role === 'tecnico') {
      if (String(user.id) !== String(id)) return forbidden('No tienes acceso a este técnico');
    } else if (user.role === 'admin') {
      const ownerId = getOwnerId(user);
      const link = ownerId ? await getNutricionistaTecnicoLink(db, ownerId, id) : null;
      if (!link) return forbidden('No tienes acceso a este técnico');
    } else {
      return forbidden('No tienes acceso a este técnico');
    }

    const tecnico = await getTecnicoById(db, id);
    if (!tecnico || !tecnico.avatar) {
      return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 });
    }

    return imageResponse(tecnico.avatar, tecnico.avatar_mime);
  } catch (e) {
    console.error('Error in media/tecnico-avatar GET:', e);
    return NextResponse.json({ error: 'Error al cargar la imagen' }, { status: 500 });
  }
}
