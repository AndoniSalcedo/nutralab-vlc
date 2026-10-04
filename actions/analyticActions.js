'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/prisma';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer } from '@/lib/auth/team-access';
import { readDocumentUpload } from '@/lib/security/uploads';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { aiClient as client } from '@/lib/ai/client';
import { env } from '@/config/env';
import { trackUsageEvent } from '@/lib/billing/client';
import {
  insertAnalytics,
  getAnalyticsById,
  deleteAnalytics,
  updateAnalyticsVisibility
} from '@/repositories/analyticsRepository';

const ANALITICA_TOOL_NAME = 'guardar_analitica';
const ANALITICA_MAX_TOKENS = env.ANALITICA_MAX_TOKENS;

function extractAnalitica(message) {
  if (message.stop_reason === 'max_tokens') {
    throw new Error('La extracción se cortó por límite de tokens. Prueba con un PDF más corto o vuelve a intentarlo.');
  }

  const toolUse = message.content?.find((item) => item.type === 'tool_use' && item.name === ANALITICA_TOOL_NAME);
  let parametros = toolUse?.input?.parametros;
  if (typeof parametros === 'string') {
    try {
      const parsed = JSON.parse(parametros);
      parametros = Array.isArray(parsed) ? parsed : (parsed?.parametros || parsed);
    } catch {
      // ignore
    }
  }
  if (!Array.isArray(parametros)) {
    throw new Error('No se pudieron extraer parámetros válidos de la analítica.');
  }

  return parametros;
}

export async function uploadAnalitica(fileOrFormData, jugadorIdParam, fechaParam) {
  let archivo, jugadorId, fechaExtraccion;
  if (fileOrFormData instanceof FormData) {
    archivo = fileOrFormData.get('file');
    jugadorId = fileOrFormData.get('jugador_id');
    fechaExtraccion = fileOrFormData.get('fecha_extraccion');
  } else {
    archivo = fileOrFormData;
    jugadorId = jugadorIdParam;
    fechaExtraccion = fechaParam;
  }
  if (!archivo || !jugadorId) throw new Error('Faltan datos');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }
  const ownedPlayer = await getOwnedPlayer(db, user, jugadorId);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  // Solo PDF reales y de tamaño acotado (se envían a un servicio de IA de pago).
  const upload = await readDocumentUpload(archivo);
  await enforceRateLimit('ai-analitica', String(user.id), { limit: 15, windowMs: 60 * 60 * 1000 });
  const base64 = upload.buffer.toString('base64');

  const message = await client.messages.create({
    model: env.AI_MODEL,
    max_tokens: ANALITICA_MAX_TOKENS,
    thinking: { type: 'disabled' },
    tool_choice: { type: 'tool', name: ANALITICA_TOOL_NAME },
    tools: [{
      name: ANALITICA_TOOL_NAME,
      description: 'Guarda los parámetros extraídos de una analítica de sangre en un formato estructurado.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          parametros: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                nombre: { type: 'string', description: 'Nombre exacto del parámetro en el PDF.' },
                valor: { type: 'number', description: 'Valor numérico del parámetro.' },
                unidad: { type: 'string', description: 'Unidad de medida. Usa una cadena vacía si no aparece.' },
                rango_min: { type: ['number', 'null'], description: 'Límite inferior de referencia, o null si no aparece.' },
                rango_max: { type: ['number', 'null'], description: 'Límite superior de referencia, o null si no aparece.' },
                fuera_rango: { type: 'boolean', description: 'true si el PDF marca el valor fuera de rango o está en negrita.' },
              },
              required: ['nombre', 'valor', 'unidad', 'rango_min', 'rango_max', 'fuera_rango'],
            },
          },
        },
        required: ['parametros'],
      },
    }],
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: `Extrae TODOS los parámetros de este análisis de sangre y llama a la herramienta ${ANALITICA_TOOL_NAME}.
        Para cada parámetro incluye: nombre exacto del PDF, valor numérico, unidad, rango mínimo y máximo de referencia, y si está fuera de rango. Si el valor está en negrita en el PDF, fuera_rango es true. Si un rango de referencia no aparece, usa null.` }
      ]
    }]
  });

  const parametros = extractAnalitica(message);

  const data = await insertAnalytics(db, {
    jugador_id: parseInt(jugadorId),
    fecha_extraccion: fechaExtraccion && !Number.isNaN(Date.parse(String(fechaExtraccion))) ? fechaExtraccion : null,
    parametros,
    pdf_nombre: String(archivo.name || '').slice(0, 200),
  });

  try {
    await trackUsageEvent({
      app: 'nutralab-vlc',
      tenantId: ownedPlayer.equipo_id || ownedPlayer.id,
      userId: user.id,
      eventType: 'ANALITICA_SANGRE',
      description: `Analítica de sangre extraída (${String(archivo.name || 'PDF').slice(0, 100)})`,
      metadata: {
        jugadorId: ownedPlayer.id,
        analiticaId: data?.id,
        emisor: { tipo: 'nutricionista', nombre: user.name || 'Técnico / Nutricionista Valencia FC', id: user.id },
        cliente: { tipo: 'cliente', nombre: 'Jugador', id: ownedPlayer.id },
      },
    });
  } catch (billingErr) {
    console.warn('[analyticActions] Error al reportar evento a billing:', billingErr.message);
  }

  revalidatePath(`/dashboard/jugador/${jugadorId}`);
  return { ok: true, analitica: data };
}

export async function deleteAnalitica(id) {
  if (!id) throw new Error('Falta id');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const analitica = await getAnalyticsById(db, id);
  if (!analitica) throw new Error('Analítica no encontrada');

  const ownedPlayer = await getOwnedPlayer(db, user, analitica.jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  await deleteAnalytics(db, id);
  revalidatePath(`/dashboard/jugador/${analitica.jugador_id}`);
  return { ok: true };
}

export async function toggleAnaliticaVisibility(id, visible_para_jugador) {
  if (!id || typeof visible_para_jugador !== 'boolean') {
    throw new Error('Faltan datos');
  }

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const analitica = await getAnalyticsById(db, id);
  if (!analitica) throw new Error('Analítica no encontrada');

  const ownedPlayer = await getOwnedPlayer(db, user, analitica.jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  const data = await updateAnalyticsVisibility(db, id, visible_para_jugador);
  revalidatePath(`/dashboard/jugador/${analitica.jugador_id}`);
  return { ok: true, analitica: data };
}
