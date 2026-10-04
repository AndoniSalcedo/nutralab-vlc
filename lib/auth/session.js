import crypto from 'crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { COOKIE_NAME } from '@/config/auth';

export { COOKIE_NAME };

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Vida máxima de una sesión emitida antes de existir `exp` (cookies antiguas).
const LEGACY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function sign(value) {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(value).digest('hex');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * @param {object} userObj datos de sesión
 * @param {number} [ttlSeconds] caducidad; debe coincidir con el maxAge de la cookie
 */
export function buildSessionValue(userObj, ttlSeconds = 60 * 60 * 24 * 7) {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ ...userObj, ts: now, exp: now + ttlSeconds * 1000 })
  ).toString('base64');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function boneyardUser() {
  return {
    id: 'boneyard-mock-user',
    email: 'boneyard@nutralab.com',
    role: 'admin',
    name: 'Boneyard Crawler',
    isBoneyardBypass: true,
  };
}

/**
 * Comprueba que la cuenta de un jugador/técnico sigue existiendo, para que
 * una cookie válida no sobreviva al borrado del usuario.
 */
async function accountStillExists(user) {
  try {
    const { getDb } = await import('@/lib/db/prisma');
    const db = getDb();
    const model = user.role === 'tecnico' ? db.tecnicos : db.jugadores;
    const data = await model.findUnique({ where: { id: user.id }, select: { id: true } });
    return Boolean(data);
  } catch {
    return true;
  }
}

async function readSession() {
  // El bypass de Boneyard solo existe fuera de producción.
  if (!IS_PRODUCTION) {
    if (process.env.BONEYARD_MODE === 'true') return boneyardUser();
    if (process.env.NODE_ENV === 'development') {
      const devStore = await cookies();
      if (devStore.get('boneyard_bypass')?.value === 'true') return boneyardUser();
    }
  }

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!safeEqual(sign(payload), signature)) return null;

  let user;
  try {
    user = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch {
    return null;
  }
  if (!user || typeof user !== 'object') return null;

  const expiresAt = Number(user.exp) || (Number(user.ts) || 0) + LEGACY_MAX_AGE_MS;
  if (!expiresAt || Date.now() > expiresAt) return null;

  if ((user.role === 'jugador' || user.role === 'tecnico') && !(await accountStillExists(user))) {
    return null;
  }

  if (user.role === 'admin' && (!user.name || user.name === 'N' || user.name === 'Nutricionista') && (user.external_admin_id || user.id)) {
    try {
      const { getNutritionistProfile } = await import('@/lib/db/nutralab');
      const nutriId = user.external_admin_id || user.id;
      const nutri = await getNutritionistProfile(nutriId);

      if (nutri) {
        if (nutri.name) user.name = nutri.name;
        if (nutri.email) user.email = nutri.email;
        if (nutri.avatarSize) {
          user.avatar = `/api/media/nutritionist-avatar?id=${nutriId}`;
        }
      }
    } catch {
      // ignore fallback error
    }
  }

  return user;
}

// Se memoiza por petición: varias acciones/componentes llaman a getUser() en la
// misma request y así solo se valida la sesión (y la BD) una vez.
export const getUser = cache(readSession);
