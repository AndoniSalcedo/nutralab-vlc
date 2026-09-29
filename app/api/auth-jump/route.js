import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { buildSessionValue, COOKIE_NAME } from '@/lib/auth/session';
import { env } from '@/config/env';
import { getSupabaseAdmin } from '@/lib/supabase/server';

// Solo se permiten rutas internas: evita open redirect (`//evil.com`, `https://evil.com`, `/\\evil.com`).
function safeRedirectPath(value) {
  const fallback = '/dashboard';
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}

// Nutralab firma estos tokens con `purpose: 'jump'` y 60 s de vida. Los tokens de otros
// usos (restablecer contraseña, invitación...) comparten secreto y NO deben abrir sesión aquí.
const JUMP_PURPOSE = 'jump';
const ALLOWED_ROLES = ['nutritionist', 'admin'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const url = safeRedirectPath(searchParams.get('url'));

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }

  try {
    // Verify the JWT token from the backend
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    const nutritionistId = decoded.id;
    if (!nutritionistId) throw new Error('Token sin id de nutricionista');

    // El backend firma con el mismo secreto otros tokens (reset/invitación): solo
    // vale el de propósito 'jump' emitido para un nutricionista/admin.
    if (decoded.purpose !== 'jump' || !['nutritionist', 'admin'].includes(decoded.role)) {
      throw new Error('Token con propósito o rol no válido');
    }
    if (decoded.purpose !== JUMP_PURPOSE) throw new Error('Token de otro tipo');
    if (!ALLOWED_ROLES.includes(decoded.role)) throw new Error('Rol no permitido');
    // Siempre caduca (jwt.verify ya rechaza los vencidos); uno sin `exp` no es un token de salto válido
    if (!decoded.exp) throw new Error('Token sin caducidad');

    // La cuenta debe existir de verdad en Nutralab: si la consulta falla o no hay fila, no hay sesión
    const supabase = getSupabaseAdmin();
    const { data: nutri, error: nutriError } = await supabase
      .schema('public')
      .from('Nutritionist')
      .select('id, name, email, avatar, avatarSize, avatarMime')
      .eq('id', nutritionistId)
      .maybeSingle();

    if (nutriError) throw new Error(`No se pudo comprobar el nutricionista: ${nutriError.message}`);
    if (!nutri) throw new Error('Nutricionista inexistente');

    const nutriName = nutri.name || decoded.name;
    const nutriEmail = nutri.email || decoded.email;
    const hasAvatar = Boolean(nutri.avatar && (nutri.avatarSize || nutri.avatar.length > 0));

    const sessionObj = {
      external_admin_id: nutritionistId,
      id: nutritionistId,
      name: nutriName || decoded.name || '',
      email: nutriEmail || decoded.email || '',
      role: 'admin',
      avatar: hasAvatar ? `/api/media/nutritionist-avatar?id=${nutritionistId}` : null,
    };

    const SESSION_TTL_SECONDS = 60 * 60 * 12;
    const response = NextResponse.redirect(new URL(url, request.url), 303);
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('Cache-Control', 'no-store');

    response.cookies.set(COOKIE_NAME, buildSessionValue(sessionObj, SESSION_TTL_SECONDS), {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('Invalid token for auth-jump:', err.message);
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }
}
