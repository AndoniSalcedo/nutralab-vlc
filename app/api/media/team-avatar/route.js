import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { forbidden } from '@/lib/auth/team-access';
import { getTeamPhoto } from '@/repositories/teamRepository';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Falta id del equipo' }, { status: 400 });

    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const supabase = getSupabaseAdmin();
    const team = await getTeamPhoto(supabase, id);

    if (!team || !team.foto) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
    }

    let buffer;
    if (typeof team.foto === 'string') {
      const hex = team.foto.startsWith('\\x') ? team.foto.slice(2) : team.foto;
      buffer = Buffer.from(hex, 'hex');
    } else if (Buffer.isBuffer(team.foto)) {
      buffer = team.foto;
    } else if (team.foto instanceof Uint8Array) {
      buffer = Buffer.from(team.foto);
    } else {
      buffer = Buffer.from(team.foto);
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': team.foto_mime || 'image/webp',
        'Content-Length': String(team.foto_size ?? buffer.length),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (e) {
    console.error('Error in media/team-avatar GET:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
