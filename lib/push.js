import webpush from 'web-push';
import { after } from 'next/server';
import { env } from '@/config/env';
import { getDb } from '@/lib/db/prisma';
import { resolveNotificationPrefs } from '@/config/notifications';
import {
  listPushSubscriptions,
  deletePushSubscriptionByEndpoint,
  getNotificationPrefs,
  claimNotification,
  releaseNotification,
} from '@/repositories/notificationsRepository';

const ICON = '/favico_nutralab-192x192.png';
const BADGE = '/favico_nutralab-32x32.png';

let configured = false;

/** true si hay claves VAPID: sin ellas los avisos se omiten en silencio. */
export function isPushConfigured() {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

/**
 * Envía el aviso a todos los dispositivos del jugador; borra las suscripciones caducadas (404/410).
 * @param {{ title: string, body: string, url?: string, tag?: string }} payload
 * @returns {Promise<number>} dispositivos a los que llegó
 */
export async function sendPushToPlayer(jugadorId, payload) {
  if (!isPushConfigured()) return 0;
  const db = getDb();
  const subscriptions = await listPushSubscriptions(db, jugadorId);
  if (!subscriptions.length) return 0;

  const body = JSON.stringify({ icon: ICON, badge: BADGE, url: '/dashboard', ...payload });
  const results = await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
        { TTL: 60 * 60 * 6, urgency: 'normal' }
      );
      return true;
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await deletePushSubscriptionByEndpoint(db, sub.endpoint).catch(() => {});
      } else {
        console.error('[push] Error enviando aviso:', error?.statusCode || '', error?.body || error?.message);
      }
      return false;
    }
  }));
  return results.filter(Boolean).length;
}

/**
 * Aviso de un tipo de preferencia con clave de deduplicación: una vez por (jugador, tipo, clave)
 * y solo si el jugador no lo ha desactivado. Si no llega a ningún dispositivo se libera la clave.
 */
export async function notifyPlayerOnce(jugadorId, tipo, clave, payload, prefs = undefined) {
  if (!isPushConfigured()) return false;
  const db = getDb();
  const resolved = resolveNotificationPrefs(prefs === undefined ? await getNotificationPrefs(db, jugadorId) : prefs);
  if (!resolved[tipo]) return false;
  if (!(await claimNotification(db, jugadorId, tipo, clave))) return false;

  const delivered = await sendPushToPlayer(jugadorId, { tag: `${tipo}-${clave}`, ...payload });
  if (!delivered) await releaseNotification(db, jugadorId, tipo, clave).catch(() => {});
  return delivered > 0;
}

/**
 * Lanza avisos tras responder (after de Next) para no retrasar la acción que los provoca.
 * Fuera de una petición (scripts) se lanzan en segundo plano sin esperar.
 */
export function notifyPlayersLater(jugadorIds, tipo, clave, payload) {
  const ids = [...new Set((jugadorIds || []).map(String))].filter(Boolean);
  if (!ids.length || !isPushConfigured()) return;
  const task = () => Promise.all(ids.map((id) => notifyPlayerOnce(id, tipo, clave, payload)
    .catch((error) => console.error(`[push] Aviso ${tipo}:`, error?.message || error))));
  try {
    after(task);
  } catch {
    task();
  }
}
