'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getNotificationSettings,
  savePushSubscription,
  removePushSubscription,
  updateNotificationPrefs,
} from '@/actions/notificationActions';
import { getPushSupport, getCurrentSubscription, subscribeToPush, unsubscribeFromPush } from '@/lib/pushClient';

// Avisa a las demás instancias del hook (tarjeta del inicio y panel de ajustes) de un cambio
const CHANGE_EVENT = 'nutralab-vlc:push-changed';
const announceChange = () => window.dispatchEvent(new Event(CHANGE_EVENT));

/**
 * Estado de los avisos push del paciente en este navegador.
 * `enable()` devuelve 'granted' | 'denied' | 'unavailable'.
 */
export function usePushSubscription({ enabled = true } = {}) {
  const [settings, setSettings] = useState(null);
  const [support, setSupport] = useState({ supported: false, needsInstall: false, permission: 'default' });
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onChange = () => setVersion((n) => n + 1);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const browser = getPushSupport();
    setSupport(browser);
    (async () => {
      try {
        const [server, current] = await Promise.all([
          getNotificationSettings(),
          browser.supported ? getCurrentSubscription() : null,
        ]);
        if (!alive) return;
        setSettings(server);
        setSubscribed(Boolean(current));
        // El navegador sigue suscrito pero el servidor lo perdió (p. ej. claves rotadas): se vuelve a guardar
        if (current && server.devices === 0) {
          savePushSubscription(current.toJSON(), navigator.userAgent).catch(() => {});
        }
      } catch (error) {
        console.error('Error cargando avisos:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [enabled, version]);

  const enable = useCallback(async () => {
    if (!settings?.available || !settings.publicKey || !support.supported) return 'unavailable';
    setBusy(true);
    try {
      const json = await subscribeToPush(settings.publicKey);
      setSupport(getPushSupport());
      if (!json) return 'denied';
      await savePushSubscription(json, navigator.userAgent);
      setSubscribed(true);
      announceChange();
      return 'granted';
    } finally {
      setBusy(false);
    }
  }, [settings, support.supported]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) await removePushSubscription(endpoint);
      setSubscribed(false);
      announceChange();
    } finally {
      setBusy(false);
    }
  }, []);

  const setPref = useCallback(async (key, value) => {
    const previous = settings?.prefs;
    setSettings((s) => (s ? { ...s, prefs: { ...s.prefs, [key]: value } } : s));
    try {
      const prefs = await updateNotificationPrefs({ ...previous, [key]: value });
      setSettings((s) => (s ? { ...s, prefs } : s));
    } catch (error) {
      setSettings((s) => (s ? { ...s, prefs: previous } : s));
      throw error;
    }
  }, [settings]);

  return { settings, support, subscribed, loading, busy, enable, disable, setPref };
}
