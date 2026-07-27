import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getAccessiblePlayer } from '@/lib/team-access';
import { getMealPhotoWithMeta } from '@/repositories/mealsRepository';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    
    // Check permission - any logged in user with team/player access should be able to load the photo
    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const meal = await getMealPhotoWithMeta(supabase, id);
    if (!meal) return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });

    const isPlayer = user.role === 'jugador';
    if (!isPlayer) {
      const accessiblePlayer = await getAccessiblePlayer(supabase, user, meal.jugador_id);
      if (!accessiblePlayer) return forbidden('No tienes acceso a este jugador');
    } else {
      if (String(user.id) !== String(meal.jugador_id)) {
        return forbidden('No tienes acceso a este jugador');
      }
    }

    if (!meal.photo) {
      return NextResponse.json({ error: 'Comida sin foto' }, { status: 404 });
    }

    // Convert bytea hex string or binary to Node Buffer
    let buffer;
    if (typeof meal.photo === 'string') {
      const hex = meal.photo.startsWith('\\x') ? meal.photo.slice(2) : meal.photo;
      buffer = Buffer.from(hex, 'hex');
    } else if (Buffer.isBuffer(meal.photo)) {
      buffer = meal.photo;
    } else if (meal.photo instanceof Uint8Array) {
      buffer = Buffer.from(meal.photo);
    } else {
      buffer = Buffer.from(meal.photo);
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': meal.photo_mime || 'image/webp',
        'Content-Length': String(meal.photo_size ?? buffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error('Error in comidas/photo GET:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

