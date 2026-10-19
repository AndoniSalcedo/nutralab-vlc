'use server';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/config/env';
import { buildSessionValue, COOKIE_NAME, getUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/prisma';
import { verifyAuthPassword } from '@/lib/auth/auth-users';
import { getPlayerByAuthUserIdSingle } from '@/repositories/playerRepository';
import { getTecnicoByAuthUserId } from '@/repositories/tecnicoRepository';
import { getNutritionistForLogin } from '@/lib/db/nutralab';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { ActionError } from '@/lib/actionError';

// Hash válido de una contraseña inexistente: iguala el tiempo de respuesta cuando el email no existe.
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.tSuYQ1p0lbq0OeLYXhNnE6xk3c3e';
const NUTRITIONIST_SESSION_TTL = 60 * 60 * 12;

// Los nutricionistas viven en public."Nutritionist" (nutralab), con la contraseña en bcrypt.
async function loginNutritionist(cleanEmail, password) {
  let nutri;
  try {
    nutri = await getNutritionistForLogin(cleanEmail);
  } catch (error) {
    console.error('Login nutritionist error:', error?.message);
    throw new ActionError('El inicio de sesión no está disponible temporalmente. Inténtalo más tarde.');
  }

  const valid = await bcrypt.compare(password, nutri?.password || DUMMY_HASH);
  if (!nutri || !valid) throw new ActionError('Email o contraseña incorrectos');

  // Misma sesión que crea /api/auth-jump
  const sessionObj = {
    external_admin_id: nutri.id,
    id: nutri.id,
    name: nutri.name || '',
    email: nutri.email || cleanEmail,
    role: 'admin',
    avatar: nutri.avatarSize ? `/api/media/nutritionist-avatar?id=${nutri.id}` : null,
  };

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, buildSessionValue(sessionObj, NUTRITIONIST_SESSION_TTL), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: NUTRITIONIST_SESSION_TTL,
  });

  return { ok: true, user: sessionObj };
}

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
    throw new ActionError('Email y contraseña son obligatorios');
  }
  if (typeof password !== 'string' || password.length > 256 || cleanEmail.length > 254) {
    throw new ActionError('Email o contraseña incorrectos');
  }

  // Frena la fuerza bruta: por IP+email y, más laxo, por IP.
  await enforceRateLimit('login', cleanEmail, { limit: 8, windowMs: 15 * 60 * 1000 });
  await enforceRateLimit('login-ip', '', { limit: 40, windowMs: 15 * 60 * 1000 });

  if (expectedRole === 'nutritionist') {
    return loginNutritionist(cleanEmail, password);
  }

  // La contraseña se comprueba contra auth.users (hash bcrypt de Supabase Auth) por la
  // conexión directa a la BD, sin depender de la API de Supabase.
  let supabaseUser = null;
  try {
    supabaseUser = await verifyAuthPassword(cleanEmail, password);
  } catch (authError) {
    console.error('Login auth error:', authError?.message);
    throw new ActionError('El inicio de sesión no está disponible temporalmente. Inténtalo más tarde.');
  }

  if (!supabaseUser) {
    throw new ActionError('Email o contraseña incorrectos');
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

    throw new ActionError(errorMsg);
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

/**
 * URL para saltar a nutralab con un token de un solo propósito y 60 s de vida.
 * Es el camino inverso de /api/auth-jump (nutralab → VLC).
 */
export async function createAuthJumpUrl(targetPath) {
  const user = await getUser();
  if (user?.role !== 'admin') throw new ActionError('No autorizado');
  const id = user.external_admin_id || user.id;

  const token = jwt.sign({ id, role: 'nutritionist', purpose: 'jump-nutralab' }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '60s',
  });
  const params = new URLSearchParams({ token });
  if (typeof targetPath === 'string' && targetPath.startsWith('/') && !targetPath.startsWith('//') && !targetPath.includes('\\')) {
    params.set('url', targetPath);
  }
  return `${env.NEXT_PUBLIC_FRONTEND_URL.replace(/\/+$/, '')}/api/auth-jump?${params.toString()}`;
}

export async function logout() {
  const user = await getUser();

  const redirectUrl = user?.role === 'admin' ? '/login/nutritionist' : '/login';

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
