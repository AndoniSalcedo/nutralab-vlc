/**
 * Cliente de facturación para nutralab-vlc.
 * Envía eventos de consumo a la app independiente de Billing en segundo plano.
 * Nunca bloquea la interfaz de usuario ni interrumpe las operaciones principales.
 */
const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3005';

export function trackUsageEvent({
  app = 'nutralab-vlc',
  tenantId,
  tenantName = 'Valencia CF',
  userId = null,
  eventType,
  description = '',
  metadata = {},
}) {
  if (!tenantId || !eventType) return;

  const apiKey = process.env.BILLING_API_KEY || process.env.BILLING_TOKEN;

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
    fetch(`${BILLING_SERVICE_URL}/api/track`, {
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
    }).catch(() => {
      // Falla en silencio para garantizar la resiliencia de la aplicación
    });
  } catch {
    // Silencio
  }
}
