import crypto from 'crypto';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { COOKIE_NAME } from '@/config/auth';

export { COOKIE_NAME };

function sign(value) {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(value).digest('hex');
}

export function buildSessionValue(userObj) {
  const payload = Buffer.from(JSON.stringify({ ...userObj, ts: Date.now() })).toString('base64');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export async function getUser() {
  if (process.env.BONEYARD_MODE === 'true') {
    return {
      id: 'boneyard-mock-user',
      email: 'boneyard@nutralab.com',
      role: 'admin',
      name: 'Boneyard Crawler',
      isBoneyardBypass: true,
    };
  }

  if (process.env.NODE_ENV === 'development') {
    const store = await cookies();
    if (store.get('boneyard_bypass')?.value === 'true') {
      return {
        id: 'boneyard-mock-user',
        email: 'boneyard@nutralab.com',
        role: 'admin',
        name: 'Boneyard Crawler',
        isBoneyardBypass: true,
      };
    }
  }

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (sign(payload) !== signature) return null;

  try {
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const user = JSON.parse(decoded);

    if (user && user.role === 'admin' && (!user.name || user.name === 'N') && user.external_admin_id) {
      try {
        const { getSupabaseAdmin } = await import('@/lib/supabase/server');
        const supabase = getSupabaseAdmin();
        const { data: nutri } = await supabase
          .from('Nutritionist')
          .select('name, email, avatar, avatarSize')
          .eq('id', user.external_admin_id)
          .maybeSingle();

        if (nutri) {
          if (nutri.name) user.name = nutri.name;
          if (nutri.email) user.email = nutri.email;
          if (nutri.avatar && (nutri.avatarSize || nutri.avatar.length > 0)) {
            user.avatar = `/api/media/nutritionist-avatar?id=${user.external_admin_id}`;
          }
        }
      } catch {
        // ignore fallback error
      }
    }

    return user;
  } catch {
    return null;
  }
}
