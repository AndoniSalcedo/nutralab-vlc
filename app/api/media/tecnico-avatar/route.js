import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { forbidden, getOwnerId } from '@/lib/auth/team-access';
import {
  getTecnicoById,
  getNutricionistaTecnicoLink,
  updateTecnicoAvatar,
  removeTecnicoAvatar,
} from '@/repositories/tecnicoRepository';

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

    const supabase = getSupabaseAdmin();
    const tecnico = await getTecnicoById(supabase, id);

    if (!tecnico || !tecnico.avatar) {
      return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 });
    }

    let buffer;
    if (typeof tecnico.avatar === 'string') {
      const hex = tecnico.avatar.startsWith('\\x') ? tecnico.avatar.slice(2) : tecnico.avatar;
      buffer = Buffer.from(hex, 'hex');
    } else if (Buffer.isBuffer(tecnico.avatar)) {
      buffer = tecnico.avatar;
    } else if (tecnico.avatar instanceof Uint8Array) {
      buffer = Buffer.from(tecnico.avatar);
    } else {
      buffer = Buffer.from(tecnico.avatar);
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': tecnico.avatar_mime || 'image/webp',
        'Content-Length': String(tecnico.avatar_size ?? buffer.length),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (e) {
    console.error('Error in media/tecnico-avatar GET:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const formData = await req.formData();
    let id = formData.get('id');
    const remove = formData.get('remove') === 'true';
    const avatarFile = formData.get('avatar');

    if (!id && user.role === 'tecnico') {
      id = user.id;
    }
    if (!id) return NextResponse.json({ error: 'Falta id del técnico' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    if (user.role === 'tecnico') {
      if (String(user.id) !== String(id)) {
        return forbidden('No tienes acceso a este técnico');
      }
    } else {
      const ownerId = getOwnerId(user);
      if (!ownerId) return forbidden('No autorizado');

      const link = await getNutricionistaTecnicoLink(supabase, ownerId, id);
      if (!link) return forbidden('No tienes acceso a este técnico');
    }

    if (remove) {
      await removeTecnicoAvatar(supabase, id);
      return NextResponse.json({ success: true, removed: true });
    }

    if (!avatarFile || !(avatarFile instanceof File)) {
      return NextResponse.json({ error: 'Falta archivo de avatar' }, { status: 400 });
    }

    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    const payload = {
      avatar: `\\x${buffer.toString('hex')}`,
      avatar_mime: avatarFile.type || 'image/webp',
      avatar_size: avatarFile.size,
    };

    await updateTecnicoAvatar(supabase, id, payload);

    return NextResponse.json({
      success: true,
      avatar_mime: payload.avatar_mime,
      avatar_size: payload.avatar_size,
    });
  } catch (e) {
    console.error('Error in media/tecnico-avatar POST:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
