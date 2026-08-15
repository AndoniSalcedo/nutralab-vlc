import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer, getAccessiblePlayer } from '@/lib/team-access';
import { getPlayerAvatar, updatePlayer } from '@/repositories/playerRepository';

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

    let buffer;
    if (typeof player.avatar === 'string') {
      const hex = player.avatar.startsWith('\\x') ? player.avatar.slice(2) : player.avatar;
      buffer = Buffer.from(hex, 'hex');
    } else if (Buffer.isBuffer(player.avatar)) {
      buffer = player.avatar;
    } else if (player.avatar instanceof Uint8Array) {
      buffer = Buffer.from(player.avatar);
    } else {
      buffer = Buffer.from(player.avatar);
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': player.avatar_mime || 'image/webp',
        'Content-Length': String(player.avatar_size ?? buffer.length),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (e) {
    console.error('Error in players/avatar GET:', e);
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
      const owned = await getOwnedPlayer(supabase, user, id);
      if (!owned) return forbidden('No tienes acceso a este jugador');
    }

    if (remove) {
      await updatePlayer(supabase, id, {
        avatar: null,
        avatar_mime: null,
        avatar_size: null,
        updated_at: new Date().toISOString(),
      });
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
      updated_at: new Date().toISOString(),
    };

    await updatePlayer(supabase, id, payload);

    return NextResponse.json({
      success: true,
      avatar_mime: payload.avatar_mime,
      avatar_size: payload.avatar_size,
    });
  } catch (e) {
    console.error('Error in players/avatar POST:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
