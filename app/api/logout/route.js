import { NextResponse } from 'next/server';
import { COOKIE_NAME, getUser } from '@/lib/auth';
import { env } from '@/config/env';

export async function POST(request) {
  const user = await getUser();
  const frontendUrl = env.NEXT_PUBLIC_FRONTEND_URL;
  
  let redirectUrl = new URL('/login', request.url);
  if (user?.role === 'admin') {
    redirectUrl = new URL('/login', frontendUrl);
  }

  const response = NextResponse.redirect(redirectUrl, 303);

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
