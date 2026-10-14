import { ActionError } from '@/lib/actionError';
/**
 * Valida JSON libre que llega del cliente y se guarda tal cual en la BD:
 * debe ser un objeto plano serializable y no superar un tamaño razonable.
 */
export function assertPlainObject(value, { maxBytes = 200_000, label = 'Datos' } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ActionError(`${label} no válidos`);
  }
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new ActionError(`${label} no válidos`);
  }
  if (serialized.length > maxBytes) {
    throw new ActionError(`${label} demasiado grandes`);
  }
  return value;
}
