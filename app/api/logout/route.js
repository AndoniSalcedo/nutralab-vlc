import { NextResponse } from 'next/server';
import { COOKIE_NAME, getUser } from '@/lib/auth';

export async function POST(request) {
  const user = await getUser();
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'; // fallback
  
  let redirectUrl = new URL('/login', request.url);
  if (user?.role === 'admin') {
    redirectUrl = new URL('/login', frontendUrl);
  }

  const response = NextResponse.redirect(redirectUrl, 303);

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
