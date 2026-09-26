import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '@/config/env';
import { generarDatosPlan } from '@/lib/engine';
import { trackUsageEvent } from '@/lib/billing/client';
import {
  hybridPlanRequestSchema,
  normalizeNumComidas,
  normalizeStringList,
} from '@/validations/hybridPlanSchema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

function validateHybridToken(req) {
  const expectedToken = env.EXTERNAL_API_KEY || '';

  if (!expectedToken) {
    console.error('[Hybrid API Security] EXTERNAL_API_KEY no está configurada en el servidor.');
    return {
      valid: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'Configuración de seguridad incompleta en el servidor (EXTERNAL_API_KEY no definida)',
        },
        { status: 500, headers: CORS_HEADERS }
      ),
    };
  }

  const authHeader = req.headers.get('authorization') || '';
  const apiKeyHeader = req.headers.get('x-api-key') || '';

  let incomingToken = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    incomingToken = authHeader.slice(7).trim();
  } else if (authHeader) {
    incomingToken = authHeader.trim();
  } else if (apiKeyHeader) {
    incomingToken = apiKeyHeader.trim();
  }

  if (!incomingToken) {
    return {
      valid: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'No autorizado: Token de API no proporcionado. Incluye Authorization: Bearer <token> o x-api-key.',
        },
        { status: 401, headers: CORS_HEADERS }
      ),
    };
  }

  const expectedBuffer = Buffer.from(expectedToken);
  const incomingBuffer = Buffer.from(incomingToken);

  if (
    expectedBuffer.length !== incomingBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, incomingBuffer)
  ) {
    return {
      valid: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'No autorizado: Token de API inválido',
        },
        { status: 401, headers: CORS_HEADERS }
      ),
    };
  }

  return { valid: true };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req) {
  const auth = validateHybridToken(req);
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

  const parsed = hybridPlanRequestSchema.safeParse(rawBody);
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
    nombre: 'Usuario Hybrid',
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
      nombre: 'Plan Nutricional Hybrid',
      calendario,
      menu: null,
      teamConfig: null,
      preMatchConfig: null,
      suplementacion: [],
    });

    try {
      await trackUsageEvent({
        app: 'nutralab-vlc',
        tenantId: 'hybrid',
        tenantName: 'Hybrid',
        userId: 'hybrid-api',
        eventType: 'API_HYBRID',
        description: `Generación de plan vía API Externa (Hybrid · ${peso_kg}kg · ${objetivo})`,
        metadata: {
          origen: 'api_hybrid',
          tieneMenu: false,
          ingestasPersonalizadas: false,
          peso_kg,
          objetivo,
          num_comidas: normalizedNumComidas,
          postentreno: Boolean(postentreno),
          intolerancias: normalizedIntolerancias,
          aversiones: normalizedAversiones,
          emisor: {
            tipo: 'cliente',
            nombre: 'Usuario Hybrid',
            id: 'hybrid',
          },
          cliente: {
            tipo: 'cliente',
            nombre: 'Hybrid',
            id: 'hybrid',
          },
        },
      });
    } catch (billingErr) {
      console.warn('[Hybrid Plan API] Error al registrar evento en billing:', billingErr.message);
    }

    return NextResponse.json(
      {
        ok: true,
        plan,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('[Hybrid Plan API] Error generando el plan:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Error interno al generar el plan nutricional',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
