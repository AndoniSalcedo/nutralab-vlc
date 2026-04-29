import crypto from 'crypto';
import { cookies } from 'next/headers';
import { env } from './env';

export const COOKIE_NAME = 'vcf_staff_session';

function sign(value) {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(value).digest('hex');
}

export function buildSessionValue(username) {
  const payload = `${username}:${Date.now()}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export async function isAuthenticated() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const parts = raw.split('.');
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  return sign(payload) === signature;
}
