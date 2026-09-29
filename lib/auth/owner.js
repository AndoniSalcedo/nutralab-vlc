/**
 * Identificador del "dueño" (nutricionista) de un usuario de staff.
 * Jugadores y técnicos nunca son dueños de equipos.
 * Vive en un módulo hoja para poder importarlo desde repositorios sin ciclos.
 */
export function getOwnerId(user) {
  if (!user || user.role === 'jugador' || user.role === 'tecnico') return null;
  return String(user.external_admin_id || user.id || user.email || user.username || '').trim() || null;
}
