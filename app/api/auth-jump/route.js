import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { buildSessionValue, COOKIE_NAME } from '@/lib/auth/session';
import { env } from '@/config/env';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const url = searchParams.get('url') || '/dashboard';

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }

  try {
    // Verify the JWT token from the backend
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const nutritionistId = decoded.id;

    let nutriName = decoded.name;
    let nutriEmail = decoded.email;
    let hasAvatar = false;

    if (nutritionistId) {
      try {
        const supabase = getSupabaseAdmin();
        const { data: nutri } = await supabase
          .schema('public')
          .from('Nutritionist')
          .select('id, name, email, avatar, avatarSize, avatarMime')
          .eq('id', nutritionistId)
          .maybeSingle();

        if (nutri) {
          if (nutri.name) nutriName = nutri.name;
          if (nutri.email) nutriEmail = nutri.email;
          if (nutri.avatar && (nutri.avatarSize || nutri.avatar.length > 0)) {
            hasAvatar = true;
          }
        }
      } catch (dbErr) {
        console.warn('Could not fetch nutritionist details for auth-jump:', dbErr.message);
      }
    }

    const sessionObj = {
      external_admin_id: nutritionistId,
      id: nutritionistId,
      name: nutriName || decoded.name || '',
      email: nutriEmail || decoded.email || '',
      role: 'admin',
      avatar: hasAvatar ? `/api/media/nutritionist-avatar?id=${nutritionistId}` : null,
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
