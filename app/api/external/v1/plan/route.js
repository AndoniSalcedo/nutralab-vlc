import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { generarDatosPlan } from '@/lib/engine';
import { trackUsageEvent } from '@/lib/billing/client';
import {
  externalPlanRequestSchema,
  normalizeNumComidas,
  normalizeStringList,
} from '@/validations/externalPlanSchema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function resolveTenantAuth(req) {
  const authHeader = req.headers.get('authorization') || '';

  let incomingToken = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    incomingToken = authHeader.slice(7).trim();
  } else if (authHeader) {
    incomingToken = authHeader.trim();
  }

  if (!incomingToken) {
    return {
      valid: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'No autorizado: Token de API no proporcionado. Incluye la cabecera Authorization: Bearer <token>.',
        },
        { status: 401, headers: CORS_HEADERS }
      ),
    };
  }

  const incomingBuf = Buffer.from(incomingToken);

  // 1. Tokens específicos por tenant en variables de entorno (ej. EXTERNAL_API_KEY_HYBRID, EXTERNAL_API_KEY_ACME...)
  for (const [envKey, envVal] of Object.entries(process.env)) {
    if (envKey.startsWith('EXTERNAL_API_KEY_') && envVal) {
      const expectedBuf = Buffer.from(String(envVal).trim());
      if (expectedBuf.length === incomingBuf.length && crypto.timingSafeEqual(expectedBuf, incomingBuf)) {
        const tenantId = envKey.replace('EXTERNAL_API_KEY_', '').toLowerCase();
        const tenantName = tenantId.charAt(0).toUpperCase() + tenantId.slice(1);
        return {
          valid: true,
          tenant: {
            tenantId,
            tenantName,
            eventType: 'API_EXTERNAL',
            userId: `${tenantId}-api`,
          },
        };
      }
    }
  }

  // 2. Mapa de tokens en JSON mediante variable EXTERNAL_API_KEYS (requiere tenantId explícito)
  if (process.env.EXTERNAL_API_KEYS) {
    try {
      const keysMap = JSON.parse(process.env.EXTERNAL_API_KEYS);
      if (keysMap && typeof keysMap === 'object') {
        for (const [configuredToken, info] of Object.entries(keysMap)) {
          const cfgBuf = Buffer.from(String(configuredToken).trim());
          if (cfgBuf.length === incomingBuf.length && crypto.timingSafeEqual(cfgBuf, incomingBuf)) {
            const tenantId = info.tenantId ? String(info.tenantId).trim().toLowerCase() : null;
            if (!tenantId) {
              console.error('[External API Security] Token configurado en EXTERNAL_API_KEYS sin tenantId explícito.');
              continue;
            }
            const tenantName = info.tenantName || (tenantId.charAt(0).toUpperCase() + tenantId.slice(1));
            return {
              valid: true,
              tenant: {
                tenantId,
                tenantName,
                eventType: 'API_EXTERNAL',
                userId: info.userId || `${tenantId}-api`,
              },
            };
          }
        }
      }
    } catch (err) {
      console.error('[External API Security] Error parseando EXTERNAL_API_KEYS:', err.message);
    }
  }

  // 3. Variable EXTERNAL_API_KEY con tenant explícito en EXTERNAL_API_TENANT_ID (sin fallback por defecto)
  const defaultToken = process.env.EXTERNAL_API_KEY || '';
  const explicitTenantId = (process.env.EXTERNAL_API_TENANT_ID || '').trim().toLowerCase();

  if (defaultToken && explicitTenantId) {
    const expectedBuffer = Buffer.from(defaultToken.trim());
    if (
      expectedBuffer.length === incomingBuf.length &&
      crypto.timingSafeEqual(expectedBuffer, incomingBuf)
    ) {
      const tenantName = process.env.EXTERNAL_API_TENANT_NAME || (explicitTenantId.charAt(0).toUpperCase() + explicitTenantId.slice(1));
      return {
        valid: true,
        tenant: {
          tenantId: explicitTenantId,
          tenantName,
          eventType: 'API_EXTERNAL',
          userId: `${explicitTenantId}-api`,
        },
      };
    }
  }

  return {
    valid: false,
    response: NextResponse.json(
      {
        ok: false,
        error: 'No autorizado: Token de API inválido o no reconocido',
      },
      { status: 401, headers: CORS_HEADERS }
    ),
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function formatExternalPlan(rawPlan, { peso_kg, objetivo, normalizedNumComidas, postentreno }) {
  const formattedDias = {};
  const dayKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  for (const dayKey of dayKeys) {
    const d = rawPlan.dias?.[dayKey];
    if (!d) continue;

    formattedDias[dayKey] = {
      label: d.label,
      tipoDia: d.tipoDia,
      kcal: d.kcal,
      proteina: d.proteina,
      hidratos: d.hidratos,
      grasa: d.grasa,
      macrosTotales: d.macrosReales || {
        kcal: d.kcal,
        proteina: d.proteina,
        hidratos: d.hidratos,
        grasa: d.grasa,
      },
      ingestas: (d.ingestas || []).map((ing) => ({
        nombre: ing.nombre,
        detalle: ing.detalle,
        macros: ing.macrosReales || null,
      })),
    };
  }

  return {
    nombre: rawPlan.meta?.nombre || 'Plan Nutricional',
    fecha: rawPlan.meta?.fecha || new Date().toISOString(),
    usuario: {
      peso_kg,
      objetivo,
      num_comidas: normalizedNumComidas,
      postentreno: Boolean(postentreno),
    },
    dias: formattedDias,
    notas: rawPlan.notas || [],
  };
}

export async function POST(req) {
  const auth = resolveTenantAuth(req);
  if (!auth.valid) {
    return auth.response;
  }

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'El cuerpo de la petición (body) debe ser un JSON válido',
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const parsed = externalPlanRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    return NextResponse.json(
      {
        ok: false,
        error: 'Parámetros de entrada inválidos',
        details,
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const {
    peso_kg,
    objetivo,
    num_comidas,
    calendario,
    postentreno,
    intolerancias,
    aversiones,
  } = parsed.data;

  const normalizedNumComidas = normalizeNumComidas(num_comidas);
  const normalizedIntolerancias = normalizeStringList(intolerancias);
  const normalizedAversiones = normalizeStringList(aversiones);

  const jugador = {
    id: null,
    nombre: 'Usuario',
    apellidos: '',
    posicion: 'Deportista',
    peso_kg,
    objetivo,
    num_comidas: normalizedNumComidas,
    postentreno: Boolean(postentreno),
    preentreno: false,
    intolerancias: normalizedIntolerancias.join(', '),
    clinical_tags: normalizedIntolerancias,
    aversiones: normalizedAversiones.join(', '),
    recomendaciones_defecto: {},
    config_prepartido: {},
  };

  try {
    const plan = await generarDatosPlan({
      jugador,
      nombre: 'Plan Nutricional',
      calendario,
      menu: null,
      teamConfig: null,
      preMatchConfig: null,
      suplementacion: [],
    });

    try {
      await trackUsageEvent({
        app: 'nutralab-vlc',
        tenantId: auth.tenant.tenantId,
        tenantName: auth.tenant.tenantName,
        userId: auth.tenant.userId,
        eventType: auth.tenant.eventType,
        description: `Generación de plan vía API Externa (${auth.tenant.tenantName} · ${peso_kg}kg · ${objetivo})`,
        metadata: {
          origen: 'api_external',
          peso_kg,
          objetivo,
          num_comidas: normalizedNumComidas,
          postentreno: Boolean(postentreno),
          intolerancias: normalizedIntolerancias,
          aversiones: normalizedAversiones,
          emisor: {
            tipo: 'cliente',
            nombre: `Usuario ${auth.tenant.tenantName}`,
            id: auth.tenant.tenantId,
          },
          cliente: {
            tipo: 'cliente',
            nombre: auth.tenant.tenantName,
            id: auth.tenant.tenantId,
          },
        },
      });
    } catch (billingErr) {
      console.warn('[External Plan API] Error al registrar evento en billing:', billingErr.message);
    }

    return NextResponse.json(
      {
        ok: true,
        plan: formatExternalPlan(plan, {
          peso_kg,
          objetivo,
          normalizedNumComidas,
          postentreno,
        }),
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('[External Plan API] Error generando el plan:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Error interno al generar el plan nutricional',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
