'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { buildSessionValue, COOKIE_NAME, getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getPlayerByAuthUserIdSingle } from '@/repositories/playerRepository';
import { getTecnicoByAuthUserId } from '@/repositories/tecnicoRepository';

export async function login(emailOrPayload, passwordParam, expectedRoleParam) {
  let email, password, expectedRole;
  if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
    email = emailOrPayload.email;
    password = emailOrPayload.password;
    expectedRole = emailOrPayload.expectedRole || null;
  } else {
    email = emailOrPayload;
    password = passwordParam;
    expectedRole = expectedRoleParam || null;
  }

  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error('Email y contraseña son obligatorios');
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
    console.error('Login auth error:', authError?.message);
    throw new Error('Email o contraseña incorrectos');
  }

  const supabaseUser = authData.user;
  const supabaseAdmin = getSupabaseAdmin();
  let jugador = null;
  let tecnico = null;

  // Si esperamos rol jugador (o no se especifica rol), buscamos en la tabla jugadores
  if (expectedRole === 'jugador' || !expectedRole) {
    jugador = await getPlayerByAuthUserIdSingle(supabaseAdmin, supabaseUser.id);
  }

  // Si esperamos rol técnico (o no se especifica rol y no era jugador), buscamos en tecnicos
  if (!jugador && (expectedRole === 'tecnico' || !expectedRole)) {
    tecnico = await getTecnicoByAuthUserId(supabaseAdmin, supabaseUser.id);
  }

  if (!jugador && !tecnico) {
    const errorMsg =
      expectedRole === 'tecnico'
        ? 'No se ha encontrado un perfil de técnico asociado a este email.'
        : expectedRole === 'jugador'
          ? 'No se ha encontrado un perfil de jugador asociado a este email. Contacta con tu nutricionista.'
          : 'No se ha encontrado un perfil asociado a este email. Contacta con tu nutricionista.';

    throw new Error(errorMsg);
  }

  let sessionObj;
  let maxAge;

  if (tecnico) {
    sessionObj = {
      id: tecnico.id,
      name: `${tecnico.nombre} ${tecnico.apellidos || ''}`.trim(),
      role: 'tecnico',
      supabase_uid: supabaseUser.id,
    };
    maxAge = 60 * 60 * 24 * 7; // 7 días para técnicos
  } else {
    sessionObj = {
      id: jugador.id,
      name: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      role: 'jugador',
      supabase_uid: supabaseUser.id,
    };
    maxAge = 60 * 60 * 24 * 7; // 7 días para jugadores
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, buildSessionValue(sessionObj), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return { ok: true, user: sessionObj };
}

export async function logout() {
  const user = await getUser();
  const frontendUrl = env.NEXT_PUBLIC_FRONTEND_URL;

  let redirectUrl = '/login';
  if (user?.role === 'admin') {
    redirectUrl = `${frontendUrl}/login/nutritionist`;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  redirect(redirectUrl);
}
