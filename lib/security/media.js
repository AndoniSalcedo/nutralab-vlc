import { NextResponse } from 'next/server';

const SAFE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/** Convierte lo que devuelve PostgREST para un bytea (hex '\x..', Buffer, Uint8Array) en Buffer. */
function decodeBinary(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') {
    const hex = value.startsWith('\\x') ? value.slice(2) : value;
    return Buffer.from(hex, 'hex');
  }
  return Buffer.from(value);
}

/**
 * Respuesta de imagen protegida: MIME en lista blanca, sin sniffing, sandbox CSP
 * y caché privada (el contenido es de acceso autenticado).
 */
export function imageResponse(value, mime, { maxAge = 86400, immutable = false } = {}) {
  const buffer = decodeBinary(value);
  const contentType = SAFE_MIMES.has(mime) ? mime : 'application/octet-stream';
  const cache = immutable
    ? `private, max-age=${maxAge}, immutable`
    : `private, max-age=${maxAge}, stale-while-revalidate=${maxAge * 7}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition': 'inline',
      Vary: 'Cookie',
    },
  });
}
