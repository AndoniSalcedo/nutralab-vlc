import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { buildSessionValue, COOKIE_NAME } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 });
    }

    // Este endpoint corre en servidor, así que usamos la service key para no depender
    // de la publishable/anon key del cliente.
    const supabaseAuth = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !authData?.user) {
      console.error('Player login auth error:', authError?.message);
      return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
    }

    const supabaseUser = authData.user;

    // Buscar al jugador en la tabla jugadores por su auth UUID
    const supabaseAdmin = getSupabaseAdmin();

    const { data: jugador } = await supabaseAdmin
      .from('jugadores')
      .select('id, nombre, apellidos')
      .eq('auth_user_id', supabaseUser.id)
      .single();

    if (!jugador) {
      return NextResponse.json(
        { error: 'No se ha encontrado un perfil de jugador asociado a este email. Contacta con tu nutricionista.' },
        { status: 403 }
      );
    }

    // Crear la cookie de sesión con el rol de jugador
    const sessionObj = {
      id: jugador.id,
      name: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      role: 'jugador',
      supabase_uid: supabaseUser.id,
    };

    const response = NextResponse.json({ ok: true });

    response.cookies.set(COOKIE_NAME, buildSessionValue(sessionObj), {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días para jugadores
    });

    return response;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
