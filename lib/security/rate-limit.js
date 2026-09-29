import { headers } from 'next/headers';

/**
 * Limitador en memoria (ventana deslizante por clave).
 * Es por instancia: en despliegues serverless con varias instancias reduce el
 * abuso pero no lo elimina; para un límite global usa Redis/Upstash.
 */
const buckets = new Map();
const MAX_KEYS = 10_000;

function prune(now) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, hits] of buckets) {
    if (!hits.length || now - hits[hits.length - 1] > 3_600_000) buckets.delete(key);
  }
}

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  prune(now);
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000));
    return { ok: false, retryAfter };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

export function getClientIp(headerList) {
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headerList.get('x-real-ip') || 'unknown';
}

/** Para server actions: lanza un error legible si se supera el límite. */
export async function enforceRateLimit(scope, extraKey, options) {
  let ip = 'unknown';
  try {
    ip = getClientIp(await headers());
  } catch {
    // fuera de contexto de request
  }
  const result = rateLimit(`${scope}:${ip}:${extraKey || ''}`, options);
  if (!result.ok) {
    throw new Error(`Demasiados intentos. Inténtalo de nuevo en ${result.retryAfter} s.`);
  }
}
