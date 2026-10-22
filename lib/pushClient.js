'use client';

// Suscripción Web Push desde el navegador (iOS solo la permite con la app instalada en inicio).

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

/** Qué permite este navegador: { supported, needsInstall, permission } */
export function getPushSupport() {
  if (typeof window === 'undefined') return { supported: false, needsInstall: false, permission: 'default' };
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true;
  const hasApis = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  return {
    supported: hasApis,
    // En iPhone/iPad Safari no expone PushManager hasta instalar la app en la pantalla de inicio
    needsInstall: isIOS && !standalone,
    permission: hasApis ? Notification.permission : 'denied',
  };
}

// En desarrollo Providers desregistra el SW; aquí se registra bajo demanda para poder suscribirse
async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
}

export async function getCurrentSubscription() {
  if (!getPushSupport().supported) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

/** Pide permiso y suscribe el navegador. Devuelve la suscripción serializada o null si se deniega. */
export async function subscribeToPush(publicKey) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await getRegistration();
  const current = await registration.pushManager.getSubscription();
  const subscription = current || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  return subscription.toJSON();
}

/** Da de baja este navegador. Devuelve el endpoint que tenía (para borrarlo en el servidor). */
export async function unsubscribeFromPush() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return null;
  const { endpoint } = subscription;
  await subscription.unsubscribe().catch(() => {});
  return endpoint;
}
