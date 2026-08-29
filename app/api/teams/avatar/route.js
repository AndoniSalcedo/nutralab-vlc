import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedTeam } from '@/lib/team-access';
import { getTeamPhoto, updateTeam } from '@/repositories/teamRepository';

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
    console.error('Error in teams/avatar GET:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user || user.role === 'jugador' || user.role === 'tecnico') return forbidden('No autorizado');

    const formData = await req.formData();
    const id = formData.get('id');
    const remove = formData.get('remove') === 'true';
    const fotoFile = formData.get('foto') || formData.get('avatar');

    if (!id) return NextResponse.json({ error: 'Falta id del equipo' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const ownedTeam = await getOwnedTeam(supabase, user, id);
    if (!ownedTeam) return forbidden('No tienes acceso a este equipo');

    if (remove) {
      await updateTeam(supabase, id, {
        foto: null,
        foto_mime: null,
        foto_size: null,
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, removed: true });
    }

    if (!fotoFile || !(fotoFile instanceof File)) {
      return NextResponse.json({ error: 'Falta archivo de imagen' }, { status: 400 });
    }

    const buffer = Buffer.from(await fotoFile.arrayBuffer());
    const payload = {
      foto: `\\x${buffer.toString('hex')}`,
      foto_mime: fotoFile.type || 'image/webp',
      foto_size: fotoFile.size,
      updated_at: new Date().toISOString(),
    };

    await updateTeam(supabase, id, payload);

    return NextResponse.json({
      success: true,
      foto_mime: payload.foto_mime,
      foto_size: payload.foto_size,
    });
  } catch (e) {
    console.error('Error in teams/avatar POST:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
