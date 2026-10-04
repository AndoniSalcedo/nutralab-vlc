'use server';

import { revalidatePath } from 'next/cache';
import { aiClient as client } from '@/lib/ai/client';
import { env } from '@/config/env';
import { getUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/prisma';
import { getOwnedTeam, getAccessibleTeam } from '@/lib/auth/team-access';
import { readDocumentUpload } from '@/lib/security/uploads';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import {
  upsertMenu,
  getMenuById,
  updateMenu,
  deleteMenu,
  getMenusByTeamLimit
} from '@/repositories/menuRepository';
import { getPlayerById } from '@/repositories/playerRepository';
import { enrichMenuWithDecomposedDishes, decomposeDishesToAst, toDishNode } from '@/lib/ai/menu-decomposer';
import { validateAstValue, astNodeSchema } from '@/validations/mealAstSchema';
import { trackUsageEvent } from '@/lib/billing/client';

const MENU_TOOL_NAME = 'extraer_menu_semanal';
const MENU_MAX_TOKENS = 8192;

/**
 * Valida los AST de servicio (comida/cena) de cada día contra el contrato único y el árbol.
 * Devuelve los días normalizados o el primer error encontrado.
 */
function validateMenuDias(dias) {
  const normalized = [];
  for (const day of dias || []) {
    const next = { ...day };
    for (const service of ['comida', 'cena']) {
      const tree = day?.[service]?.tree;
      if (!tree) continue;
      const validation = validateAstValue(astNodeSchema, tree, { label: `Menú (${day.dia} · ${service})` });
      if (!validation.success) return { success: false, error: validation.error };
      next[service] = { ...day[service], tree: validation.data };
    }
    normalized.push(next);
  }
  return { success: true, data: normalized };
}

function parseDias(input) {
  if (!input) return null;
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parseDias(parsed);
    } catch {
      return null;
    }
  }
  if (typeof input === 'object') {
    if (Array.isArray(input.dias)) return input.dias;
    if (input.dias) return parseDias(input.dias);
  }
  return null;
}

function extractSemanaInicio(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return extractSemanaInicio(parsed);
    } catch {
      return null;
    }
  }
  if (typeof input === 'object') {
    if (input.semana_inicio && typeof input.semana_inicio === 'string') {
      return input.semana_inicio.trim();
    }
    if (input.semana && typeof input.semana === 'string') {
      return input.semana.trim();
    }
    if (input.dias && typeof input.dias === 'object' && !Array.isArray(input.dias)) {
      return extractSemanaInicio(input.dias);
    }
  }
  return null;
}

function extractMenuData(message) {
  if (message.stop_reason === 'max_tokens') {
    throw new Error('La extracción del menú se cortó por límite de tokens. Prueba a intentarlo de nuevo o usa un documento más conciso.');
  }

  const toolUse = message.content?.find((item) => item.type === 'tool_use' && item.name === MENU_TOOL_NAME);
  if (toolUse?.input) {
    const input = toolUse.input;
    const dias = parseDias(input.dias || input);
    const semanaInicio = extractSemanaInicio(input);
    if (dias && Array.isArray(dias) && dias.length > 0) {
      return { dias, semanaInicio };
    }
  }

  const textBlock = message.content?.find((item) => item.type === 'text');
  if (textBlock?.text) {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const dias = parseDias(parsed);
        const semanaInicio = extractSemanaInicio(parsed);
        if (dias && Array.isArray(dias) && dias.length > 0) {
          return { dias, semanaInicio };
        }
      } catch {
        // Fallthrough to error
      }
    }
  }

  throw new Error('No se pudo extraer una estructura válida del menú desde el documento.');
}

export async function getWeeklyMenus(teamId, semana = null) {
  if (!teamId) throw new Error('Falta equipo_id');

  const user = await getUser();
  if (!user) throw new Error('No autenticado');

  const db = getDb();
  if (user.role === 'jugador') {
    const player = await getPlayerById(db, user.id);
    if (String(player?.equipo_id) !== String(teamId)) throw new Error('No autorizado');
  } else {
    const team = await getAccessibleTeam(db, user, teamId);
    if (!team) throw new Error('No tienes acceso a este equipo');
  }

  const data = await getMenusByTeamLimit(db, teamId, semana, 10);
  return { menus: data || [] };
}

export async function createWeeklyMenu({ semana, equipo_id, dias }) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }
  if (!semana || !equipo_id) throw new Error('Faltan datos');

  const db = getDb();
  const team = await getOwnedTeam(db, user, equipo_id);
  if (!team) throw new Error('No tienes acceso a este equipo');

  const data = await upsertMenu(db, { semana, equipo_id, dias: dias || [], updated_at: new Date().toISOString() });
  revalidatePath(`/dashboard/equipo/${equipo_id}/menu`);
  return { ok: true, menu: data };
}

/**
 * Procesa el menú subido (IA de extracción + estructuración de platos como AST).
 * Devuelve { ok: false, error } en lugar de lanzar para que el mensaje llegue al cliente en producción.
 */
export async function uploadWeeklyMenu(fileOrFormData, weekDateParam, teamIdParam) {
  try {
    return await processWeeklyMenuUpload(fileOrFormData, weekDateParam, teamIdParam);
  } catch (err) {
    console.error('[uploadWeeklyMenu]', err);
    return { ok: false, error: err?.message || 'No se pudo procesar el menú.' };
  }
}

async function processWeeklyMenuUpload(fileOrFormData, weekDateParam, teamIdParam) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  let formData = fileOrFormData;
  if (!(fileOrFormData instanceof FormData)) {
    formData = new FormData();
    formData.append('file', fileOrFormData);
    if (weekDateParam) formData.append('semana', weekDateParam);
    if (teamIdParam) formData.append('equipo_id', teamIdParam);
  }

  const archivo = formData.get('file');
  const semana = formData.get('semana');
  const equipoId = formData.get('equipo_id');

  const db = getDb();
  const team = await getOwnedTeam(db, user, equipoId);
  if (!team) throw new Error('No tienes acceso a este equipo');

  // Tipo y tamaño se verifican sobre el contenido real, no sobre `archivo.type`.
  const upload = await readDocumentUpload(archivo, { allowImages: true });
  await enforceRateLimit('ai-menu-upload', String(user.id), { limit: 15, windowMs: 60 * 60 * 1000 });
  const base64 = upload.buffer.toString('base64');

  const contentItem = upload.mime === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: upload.mime, data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: upload.mime, data: base64 } };

  const message = await client.messages.create({
    model: env.AI_MODEL,
    max_tokens: MENU_MAX_TOKENS,
    thinking: { type: 'disabled' },
    tool_choice: { type: 'tool', name: MENU_TOOL_NAME },
    tools: [{
      name: MENU_TOOL_NAME,
      description: 'Guarda la estructura extraída del menú semanal de comedor.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          semana_inicio: {
            type: ['string', 'null'],
            description: 'Fecha del lunes de inicio de la semana en formato YYYY-MM-DD si figura explícitamente en el documento (ej: "2026-09-07"). Si no figura, null.',
          },
          dias: {
            type: 'array',
            description: 'Lista de días de la semana con sus menús correspondientes.',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                dia: {
                  type: 'string',
                  description: 'Nombre del día de la semana en español, exactamente uno de: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo.',
                },
                comida: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    primero: { type: ['string', 'null'], description: 'Primeros platos de la comida / almuerzo. Si hay varios, sepáralos con /.' },
                    segundo: { type: ['string', 'null'], description: 'Segundos platos de la comida / almuerzo. Si hay varios, sepáralos con /.' },
                    postre: { type: ['string', 'null'], description: 'Postre de la comida / almuerzo. Si no hay, usa null.' },
                  },
                  required: ['primero', 'segundo', 'postre'],
                },
                cena: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    primero: { type: ['string', 'null'], description: 'Primeros platos de la cena. Si hay varios, sepáralos con /.' },
                    segundo: { type: ['string', 'null'], description: 'Segundos platos de la cena. Si hay varios, sepáralos con /.' },
                    postre: { type: ['string', 'null'], description: 'Postre de la cena. Si no hay, usa null.' },
                  },
                  required: ['primero', 'segundo', 'postre'],
                },
              },
              required: ['dia', 'comida', 'cena'],
            },
          },
        },
        required: ['dias'],
      },
    }],
    messages: [{
      role: 'user',
      content: [
        contentItem,
        {
          type: 'text',
          text: `Extrae el menú de comedor de este documento y llama a la herramienta ${MENU_TOOL_NAME}.
IMPORTANTE:
1. Extrae la fecha del lunes de inicio de la semana si figura en el documento (ej: "7 de septiembre al 13 de septiembre de 2026" -> semana_inicio: "2026-09-07"). Si no figura fecha en el documento, usa "${semana}".
2. Para el campo 'dias', devuelve un array nativo de objetos con los días de la semana (Lunes a Domingo).
3. Si en un servicio (comida o cena) hay varias opciones o platos (cremas, arroces, pastas, carnes, pescados, guarniciones, ensaladas del día), inclúyelos separados por ' / '.
4. Si el documento indica postres generales (ej: "De postre, fruta y yogures proteicos"), incluye ese postre en la comida y/o cena según corresponda. Si algún plato no figura o es descanso/partido, indica el texto correspondiente (ej: "COMIDA PREPARTIDO EN HOTEL", "PARTIDO SEVILLA - VALENCIA CF") o usa null.`
        }
      ]
    }]
  });

  const { dias: extractedDias, semanaInicio } = extractMenuData(message);

  const formattedDias = extractedDias.map((d) => ({
    dia: d.dia,
    comida: {
      primero: d.comida?.primero || null,
      segundo: d.comida?.segundo || null,
      postre: d.comida?.postre || null,
    },
    cena: {
      primero: d.cena?.primero || null,
      segundo: d.cena?.segundo || null,
      postre: d.cena?.postre || null,
    },
  }));

  const finalSemana = (semanaInicio && /^\d{4}-\d{2}-\d{2}$/.test(semanaInicio)) ? semanaInicio : semana;
  const enrichedDias = await enrichMenuWithDecomposedDishes(formattedDias);
  const validation = validateMenuDias(enrichedDias);
  if (!validation.success) throw new Error(validation.error);

  const data = await upsertMenu(db, { semana: finalSemana, equipo_id: equipoId, dias: validation.data, updated_at: new Date().toISOString() });

  const emisor = {
    tipo: 'nutricionista',
    nombre: user?.name || 'Técnico / Nutricionista Valencia FC',
    id: user?.id,
  };
  const cliente = {
    tipo: 'cliente',
    nombre: team.nombre || 'Valencia C.F.',
    id: team.id,
  };

  trackUsageEvent({
    app: 'nutralab-vlc',
    tenantId: team.id,
    tenantName: team.nombre || 'Valencia C.F.',
    userId: user.id,
    eventType: 'MENU_SEMANAL',
    description: `Menú semanal extraído (${finalSemana})`,
    metadata: {
      semana: finalSemana,
      equipoId,
      emisor,
      cliente,
    },
  });

  revalidatePath(`/dashboard/equipo/${equipoId}/menu`);
  return { ok: true, menu: data };
}

export async function updateWeeklyMenu(id, dias) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }
  if (!id || !dias) throw new Error('Faltan datos');

  const db = getDb();
  const menu = await getMenuById(db, id);
  if (!menu) throw new Error('Menú no encontrado');

  const team = await getOwnedTeam(db, user, menu.equipo_id);
  if (!team) throw new Error('No tienes acceso a este equipo');

  // Los platos nuevos o renombrados se estructuran como AST; los ya estructurados se conservan.
  // Los errores se devuelven (no se lanzan) para que el mensaje llegue al cliente en producción.
  let enrichedDias;
  try {
    enrichedDias = await enrichMenuWithDecomposedDishes(dias);
  } catch (err) {
    console.error('[updateWeeklyMenu]', err);
    return { ok: false, error: err?.message || 'No se pudieron estructurar los platos del menú.' };
  }
  const validation = validateMenuDias(enrichedDias);
  if (!validation.success) return { ok: false, error: validation.error };

  const data = await updateMenu(db, id, { dias: validation.data, updated_at: new Date().toISOString() });
  revalidatePath(`/dashboard/equipo/${menu.equipo_id}/menu`);
  return { ok: true, menu: data };
}

export async function deleteWeeklyMenu(id) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }
  if (!id) throw new Error('Falta id');

  const db = getDb();
  const menu = await getMenuById(db, id);
  if (!menu) throw new Error('Menú no encontrado');

  const team = await getOwnedTeam(db, user, menu.equipo_id);
  if (!team) throw new Error('No tienes acceso a este equipo');

  await deleteMenu(db, id);
  revalidatePath(`/dashboard/equipo/${menu.equipo_id}/menu`);
  return { ok: true };
}

/**
 * Interpreta la descripción de un plato del comedor y devuelve su AST.
 * Devuelve { success: false, error } en lugar de lanzar para que el mensaje llegue al cliente.
 */
export async function interpretDishTree({ nombre, text } = {}) {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: 'No autenticado' };
    await enforceRateLimit('ai-dish-tree', String(user.id), { limit: 40, windowMs: 60 * 60 * 1000 });

    const dishName = String(nombre || '').trim() || 'Plato';
    const description = String(text || '').trim().slice(0, 2000);
    if (!description) return { success: false, error: 'Describe los ingredientes del plato.' };

    const trees = await decomposeDishesToAst({ [dishName]: description });
    return { success: true, tree: { ...toDishNode(trees[dishName]), label: dishName } };
  } catch (err) {
    console.error('[interpretDishTree]', err);
    return { success: false, error: err?.message || 'Error al conectar con el servicio de IA.' };
  }
}
