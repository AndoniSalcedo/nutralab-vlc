import crypto from 'crypto';
import { cookies } from 'next/headers';
import { env } from './env';

export const COOKIE_NAME = 'vcf_staff_session';

function sign(value) {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(value).digest('hex');
}

export function buildSessionValue(userObj) {
  const payload = Buffer.from(JSON.stringify({ ...userObj, ts: Date.now() })).toString('base64');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export async function getUser() {
  if (process.env.NODE_ENV === 'development') {
    const store = await cookies();
    if (store.get('boneyard_bypass')?.value === 'true') {
      return {
        id: 'boneyard-mock-user',
        email: 'boneyard@nutralab.com',
        role: 'tecnico',
        name: 'Boneyard Crawler',
        isBoneyardBypass: true
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
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  return (await getUser()) !== null;
}
