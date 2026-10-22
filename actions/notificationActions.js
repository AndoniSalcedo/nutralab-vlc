'use server';

import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { env } from '@/config/env';
import { ActionError } from '@/lib/actionError';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { NOTIFICATION_KEYS, resolveNotificationPrefs } from '@/config/notifications';
import { isPushConfigured, sendPushToPlayer } from '@/lib/push';
import {
  upsertPushSubscription,
  deletePushSubscription,
  countPushSubscriptions,
  getNotificationPrefs,
  saveNotificationPrefs,
} from '@/repositories/notificationsRepository';

// Los avisos son del jugador: el staff no se suscribe (de momento)
async function requirePlayer() {
  const user = await getUser();
  if (!user || user.role !== 'jugador') throw new ActionError('No autorizado');
  return user;
}

export async function getNotificationSettings() {
  const user = await requirePlayer();
  const db = getDb();
  const [prefs, devices] = await Promise.all([
    getNotificationPrefs(db, user.id),
    countPushSubscriptions(db, user.id),
  ]);
  return {
    available: isPushConfigured(),
    publicKey: env.VAPID_PUBLIC_KEY,
    prefs: resolveNotificationPrefs(prefs),
    devices,
  };
}

/** Guarda la suscripción del navegador (PushSubscription.toJSON()). */
export async function savePushSubscription(subscription, userAgent = null) {
  const user = await requirePlayer();
  const endpoint = String(subscription?.endpoint || '');
  const p256dh = String(subscription?.keys?.p256dh || '');
  const auth = String(subscription?.keys?.auth || '');

  let url;
  try { url = new URL(endpoint); } catch { url = null; }
  if (!url || url.protocol !== 'https:' || endpoint.length > 1000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) {
    throw new ActionError('Suscripción no válida');
  }

  await upsertPushSubscription(getDb(), user.id, {
    endpoint,
    p256dh,
    auth,
    userAgent: userAgent ? String(userAgent).slice(0, 300) : null,
  });
  return { ok: true };
}

export async function removePushSubscription(endpoint) {
  const user = await requirePlayer();
  if (endpoint) await deletePushSubscription(getDb(), user.id, String(endpoint));
  return { ok: true };
}

export async function updateNotificationPrefs(prefs = {}) {
  const user = await requirePlayer();
  const clean = Object.fromEntries(NOTIFICATION_KEYS.map((key) => [key, prefs?.[key] !== false]));
  const saved = await saveNotificationPrefs(getDb(), user.id, clean);
  return resolveNotificationPrefs(saved.prefs);
}

export async function sendTestNotification() {
  const user = await requirePlayer();
  await enforceRateLimit('push-test', String(user.id), { limit: 5, windowMs: 60 * 60 * 1000 });
  const delivered = await sendPushToPlayer(user.id, {
    title: 'Avisos activados ✅',
    body: 'Así te llegarán los recordatorios de nutrición.',
    url: '/dashboard',
    tag: 'test',
  });
  return { delivered };
}
