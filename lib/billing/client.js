import { env } from '@/config/env';

/**
 * Cliente de facturación para nutralab-vlc.
 * Envía eventos de consumo a la app independiente de Billing en segundo plano.
 * Nunca bloquea la interfaz de usuario ni interrumpe las operaciones principales.
 */
const BILLING_SERVICE_URL = env?.BILLING_SERVICE_URL || process.env.BILLING_SERVICE_URL || 'http://localhost:3005';

export async function trackUsageEvent({
  app = 'nutralab-vlc',
  tenantId,
  tenantName = 'Valencia FC',
  userId = null,
  eventType,
  description = '',
  metadata = {},
}) {
  if (!tenantId || !eventType) return null;

  const apiKey = env?.BILLING_API_KEY || process.env.BILLING_API_KEY || process.env.BILLING_TOKEN;

  if (!apiKey && process.env.NODE_ENV !== 'production') {
    console.warn('[Billing Client] BILLING_API_KEY no está configurada en las variables de entorno.');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['x-billing-token'] = apiKey;
  }

  try {
    const res = await fetch(`${BILLING_SERVICE_URL}/api/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        app,
        tenantId: String(tenantId),
        tenantName: String(tenantName),
        userId: userId ? String(userId) : null,
        eventType,
        description,
        metadata,
      }),
    });
    return res;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Billing Client] Error enviando evento a billing:', err.message);
    }
    return null;
  }
}
