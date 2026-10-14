// Fechas de calendario ('YYYY-MM-DD') en la zona horaria del club.
// Evita `toISOString().split('T')[0]`, que convierte a UTC y entre las 00:00 y
// las 02:00 de Madrid devuelve el día anterior.

export const APP_TZ = 'Europe/Madrid';

/** 'YYYY-MM-DD' del instante dado, visto en Europe/Madrid. */
export const toDateKey = (date = new Date()) =>
  new Date(date).toLocaleDateString('sv-SE', { timeZone: APP_TZ });

export const todayKey = () => toDateKey();

/** Suma (o resta) días a una clave 'YYYY-MM-DD' sin depender de la zona horaria. */
export function shiftDateKey(dateKey, days) {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Lunes (ISO, la semana empieza en lunes) de la semana que contiene `dateKey`. */
export function mondayKeyOf(dateKey = todayKey()) {
  const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay(); // 0 = domingo
  return shiftDateKey(dateKey, weekday === 0 ? -6 : 1 - weekday);
}
