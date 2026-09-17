import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { forbidden } from '@/lib/auth/team-access';
import { getTecnicoById } from '@/repositories/tecnicoRepository';

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
