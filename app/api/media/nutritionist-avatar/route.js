import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { forbidden } from '@/lib/auth/team-access';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    if (!id && user.role === 'admin') {
      id = user.external_admin_id || user.id;
    }
    if (!id) return NextResponse.json({ error: 'Falta id del nutricionista' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: nutri, error } = await supabase
      .from('Nutritionist')
      .select('id, avatar, avatarMime, avatarSize')
      .eq('id', id)
      .maybeSingle();

    if (error || !nutri || !nutri.avatar) {
      return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 });
    }

    let buffer;
    if (typeof nutri.avatar === 'string') {
      const hex = nutri.avatar.startsWith('\\x') ? nutri.avatar.slice(2) : nutri.avatar;
      buffer = Buffer.from(hex, 'hex');
    } else if (Buffer.isBuffer(nutri.avatar)) {
      buffer = nutri.avatar;
    } else if (nutri.avatar instanceof Uint8Array) {
      buffer = Buffer.from(nutri.avatar);
    } else {
      buffer = Buffer.from(nutri.avatar);
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': nutri.avatarMime || 'image/webp',
        'Content-Length': String(nutri.avatarSize ?? buffer.length),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (e) {
    console.error('Error in media/nutritionist-avatar GET:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
