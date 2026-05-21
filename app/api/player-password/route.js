import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const user = await getUser();
    if (user?.role !== 'jugador' || !user?.supabase_uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { password } = await request.json();
    const cleanPassword = String(password || '');
    if (cleanPassword.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.admin.updateUserById(user.supabase_uid, {
      password: cleanPassword,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Error actualizando contraseña' }, { status: 500 });
  }
}
