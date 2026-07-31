import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { buildSessionValue, COOKIE_NAME } from '@/lib/auth';
import { env } from '@/lib/env';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const url = searchParams.get('url') || '/dashboard';
  console.log(url)

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }

  try {
    // Verify the JWT token from the backend
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // The decoded token will have nutritionist details: { id, name, email, role, ... }
    const sessionObj = {
      external_admin_id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: 'admin'
    };

    const response = NextResponse.redirect(new URL(url, request.url), 303);

    response.cookies.set(COOKIE_NAME, buildSessionValue(sessionObj), {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (err) {
    console.error('Invalid token for auth-jump', err);
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }
}
