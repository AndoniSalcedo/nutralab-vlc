import { generarDatosPlan } from '@/lib/engine';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';
import { insertAiPlan } from '@/repositories/aiPlanRepository';
import { trackUsageEvent } from '@/lib/billing/client';

// Campos de la portada del PDF que viajan dentro de cada plan (datos.meta.informe).
const REPORT_META_FIELDS = ['title', 'subtitle', 'team', 'author', 'handle', 'microcycle', 'rules', 'buffet'];

function pickReportMeta(meta = {}) {
  return Object.fromEntries(REPORT_META_FIELDS.map((key) => [key, meta?.[key] ?? '']));
}

export function withReportMeta(datos, reportMeta) {
  return { ...datos, meta: { ...(datos?.meta || {}), informe: pickReportMeta(reportMeta) } };
}

// Solo se genera con menú si se indica explícitamente una semana de menú; cualquier otro valor ('none', vacío) => sin menú.
export async function resolvePlanMenu(db, { semanaMenu, equipoId }) {
  if (!semanaMenu || semanaMenu === 'none') return null;
  return getMenuByWeekAndTeam(db, semanaMenu, equipoId);
}

async function reportPlanGenerated({ user, jugador, equipoId, equipoNombre, nombre, menu, semana, origen }) {
  const jugadorNombre = `${jugador.nombre || ''} ${jugador.apellidos || ''}`.trim();

  try {
    await trackUsageEvent({
      app: 'nutralab-vlc',
      tenantId: equipoId || jugador.id,
      tenantName: equipoNombre || 'Valencia C.F.',
      userId: user?.id,
      eventType: 'GENERACION_PLAN',
      description: `Plan nutricional (${jugadorNombre || 'Jugador'} - ${nombre})`,
      metadata: {
        jugadorId: jugador.id,
        jugadorNombre,
        equipoId,
        semana,
        tieneMenu: Boolean(menu),
        emisor: { tipo: 'nutricionista', nombre: user?.name || 'Técnico / Nutricionista Valencia FC', id: user?.id },
        cliente: { tipo: 'cliente', nombre: jugadorNombre || 'Jugador', id: jugador.id },
        origen,
      },
    });
  } catch (error) {
    console.warn(`[plans] Error al reportar a billing para ${jugador.nombre || jugador.id}:`, error.message);
  }
}

/**
 * Genera el borrador de un plan para un jugador (sin guardar) y reporta el uso a billing.
 * Es el núcleo común del flujo individual y del informe de plantilla.
 */
export async function generatePlanDraft(
  db,
  { jugador, nombre, menu, calendario, preMatchConfig, teamConfig, equipoId, equipoNombre, semana = null, user, origen }
) {
  const datos = await generarDatosPlan({ jugador, nombre, menu, calendario, preMatchConfig, teamConfig });
  await reportPlanGenerated({ user, jugador, equipoId, equipoNombre, nombre, menu, semana, origen });
  return datos;
}

export async function savePlan(db, { jugadorId, nombre, datos, contenido = '' }) {
  const now = new Date().toISOString();
  return insertAiPlan(db, {
    jugador_id: jugadorId,
    nombre,
    contexto: null,
    contexto_adicional: null,
    contenido,
    datos,
    created_at: now,
    updated_at: now,
  });
}
