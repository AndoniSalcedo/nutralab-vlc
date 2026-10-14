/**
 * Errores pensados para el usuario que deben llegar al cliente.
 *
 * En producción React/Next ocultan el mensaje de cualquier error lanzado en una
 * server action (el cliente recibe un texto genérico en inglés) y solo conservan
 * el `digest`. ActionError guarda su mensaje en el digest y `errorMessage()` lo
 * recupera en el cliente. Los errores inesperados (BD, red...) siguen ocultos.
 */
const PREFIX = 'nl-msg:';
const GENERIC_MESSAGE_RE = /omitted in production|Server Components render/i;
const DEFAULT_ERROR_MESSAGE = 'Ha ocurrido un error. Inténtalo de nuevo.';

export class ActionError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ActionError';
    if (statusCode) this.statusCode = statusCode;
    this.digest = `${PREFIX}${encodeURIComponent(String(message)).slice(0, 1800)}`;
  }
}

/** Mensaje legible de un error capturado en el cliente (o `fallback` si no lo hay). */
export function errorMessage(error, fallback = DEFAULT_ERROR_MESSAGE) {
  const digest = error?.digest;
  if (typeof digest === 'string' && digest.startsWith(PREFIX)) {
    try {
      return decodeURIComponent(digest.slice(PREFIX.length));
    } catch {
      // digest truncado: se cae al mensaje
    }
  }
  const message = typeof error === 'string' ? error : error?.message;
  if (!message || GENERIC_MESSAGE_RE.test(message)) return fallback;
  return message;
}
