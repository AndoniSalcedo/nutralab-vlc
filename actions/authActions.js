'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/config/env';
import { buildSessionValue, COOKIE_NAME, getUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/prisma';
import { verifyAuthPassword } from '@/lib/auth/auth-users';
import { getPlayerByAuthUserIdSingle } from '@/repositories/playerRepository';
import { getTecnicoByAuthUserId } from '@/repositories/tecnicoRepository';
import { enforceRateLimit } from '@/lib/security/rate-limit';

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
  if (typeof password !== 'string' || password.length > 256 || cleanEmail.length > 254) {
    throw new Error('Email o contraseña incorrectos');
  }

  // Frena la fuerza bruta: por IP+email y, más laxo, por IP.
  await enforceRateLimit('login', cleanEmail, { limit: 8, windowMs: 15 * 60 * 1000 });
  await enforceRateLimit('login-ip', '', { limit: 40, windowMs: 15 * 60 * 1000 });

  // La contraseña se comprueba contra auth.users (hash bcrypt de Supabase Auth) por la
  // conexión directa a la BD, sin depender de la API de Supabase.
  let supabaseUser = null;
  try {
    supabaseUser = await verifyAuthPassword(cleanEmail, password);
  } catch (authError) {
    console.error('Login auth error:', authError?.message);
    throw new Error('El inicio de sesión no está disponible temporalmente. Inténtalo más tarde.');
  }

  if (!supabaseUser) {
    throw new Error('Email o contraseña incorrectos');
  }

  const db = getDb();
  let jugador = null;
  let tecnico = null;

  // Si esperamos rol jugador (o no se especifica rol), buscamos en la tabla jugadores
  if (expectedRole === 'jugador' || !expectedRole) {
    jugador = await getPlayerByAuthUserIdSingle(db, supabaseUser.id);
  }

  // Si esperamos rol técnico (o no se especifica rol y no era jugador), buscamos en tecnicos
  if (!jugador && (expectedRole === 'tecnico' || !expectedRole)) {
    tecnico = await getTecnicoByAuthUserId(db, supabaseUser.id);
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
  cookieStore.set(COOKIE_NAME, buildSessionValue(sessionObj, maxAge), {
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
