// Avisos que el jugador puede activar o desactivar. Las claves se guardan en notificaciones_preferencias.prefs.
export const NOTIFICATION_TYPES = [
  { key: 'partido', label: 'Día de partido', description: 'Cada paso de tu plan de partido: víspera, comida previa, hidratación y recuperación.', icon: 'soccer' },
  { key: 'comidas', label: 'Ingestas del plan', description: '«Te toca la merienda» a la hora de cada toma, si aún no la has registrado.', icon: 'plate' },
  { key: 'agua', label: 'Agua', description: 'A mediodía, por la tarde y por la noche si vas por detrás de tu objetivo.', icon: 'droplet' },
  { key: 'suplementos', label: 'Suplementos', description: 'Por la noche, si te queda alguno por marcar.', icon: 'pill' },
  { key: 'bienestar', label: 'Bienestar diario', description: 'Para rellenar tu hexágono de bienestar del día.', icon: 'heart' },
  { key: 'plan', label: 'Plan nuevo', description: 'Cuando nutrición publique tu plan semanal.', icon: 'calendar' },
  { key: 'mensajes', label: 'Mensajes del staff', description: 'Cuando nutrición te envíe un mensaje.', icon: 'envelope' },
];

export const NOTIFICATION_KEYS = NOTIFICATION_TYPES.map((type) => type.key);

/** Preferencias completas: lo no guardado queda activado. */
export function resolveNotificationPrefs(saved) {
  const prefs = saved && typeof saved === 'object' ? saved : {};
  return Object.fromEntries(NOTIFICATION_KEYS.map((key) => [key, prefs[key] !== false]));
}
