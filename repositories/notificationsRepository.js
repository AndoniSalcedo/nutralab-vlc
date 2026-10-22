/* ----------------------------- Suscripciones ----------------------------- */
// El endpoint identifica al navegador: si otro jugador inicia sesión en él, pasa a ser suyo
export async function upsertPushSubscription(db, jugadorId, { endpoint, p256dh, auth, userAgent = null }) {
  return db.push_suscripciones.upsert({
    where: { endpoint },
    update: { jugador_id: jugadorId, p256dh, auth, user_agent: userAgent, updated_at: new Date().toISOString() },
    create: { jugador_id: jugadorId, endpoint, p256dh, auth, user_agent: userAgent },
    select: { id: true },
  });
}

export async function deletePushSubscription(db, jugadorId, endpoint) {
  return db.push_suscripciones.deleteMany({ where: { jugador_id: jugadorId, endpoint } });
}

export async function deletePushSubscriptionByEndpoint(db, endpoint) {
  return db.push_suscripciones.deleteMany({ where: { endpoint } });
}

export async function listPushSubscriptions(db, jugadorId) {
  return db.push_suscripciones.findMany({
    where: { jugador_id: jugadorId },
    select: { endpoint: true, p256dh: true, auth: true },
  });
}

export async function countPushSubscriptions(db, jugadorId) {
  return db.push_suscripciones.count({ where: { jugador_id: jugadorId } });
}

/** Jugadores con al menos un dispositivo suscrito (para el cron de recordatorios). */
export async function listPlayersWithPush(db) {
  const rows = await db.push_suscripciones.findMany({ distinct: ['jugador_id'], select: { jugador_id: true } });
  return rows.map((row) => row.jugador_id);
}

/* ------------------------------ Preferencias ----------------------------- */
export async function getNotificationPrefs(db, jugadorId) {
  const row = await db.notificaciones_preferencias.findUnique({ where: { jugador_id: jugadorId }, select: { prefs: true } });
  return row?.prefs ?? null;
}

export async function getNotificationPrefsMap(db, jugadorIds) {
  if (!jugadorIds.length) return new Map();
  const rows = await db.notificaciones_preferencias.findMany({
    where: { jugador_id: { in: jugadorIds } },
    select: { jugador_id: true, prefs: true },
  });
  return new Map(rows.map((row) => [String(row.jugador_id), row.prefs]));
}

export async function saveNotificationPrefs(db, jugadorId, prefs) {
  return db.notificaciones_preferencias.upsert({
    where: { jugador_id: jugadorId },
    update: { prefs, updated_at: new Date().toISOString() },
    create: { jugador_id: jugadorId, prefs },
    select: { prefs: true },
  });
}

/* --------------------------- Registro de envíos -------------------------- */
const LOG_RETENTION_DAYS = 60;

/**
 * Reserva el aviso (tipo + clave) para el jugador. Devuelve false si ya se envió:
 * la restricción única evita duplicados aunque el cron se solape.
 */
export async function claimNotification(db, jugadorId, tipo, clave) {
  try {
    await db.notificaciones_enviadas.create({ data: { jugador_id: jugadorId, tipo, clave } });
    return true;
  } catch (error) {
    if (error?.code === 'P2002') return false;
    throw error;
  }
}

export async function releaseNotification(db, jugadorId, tipo, clave) {
  await db.notificaciones_enviadas.deleteMany({ where: { jugador_id: jugadorId, tipo, clave } });
}

export async function purgeOldNotificationLogs(db) {
  const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  return db.notificaciones_enviadas.deleteMany({ where: { created_at: { lt: cutoff.toISOString() } } });
}
