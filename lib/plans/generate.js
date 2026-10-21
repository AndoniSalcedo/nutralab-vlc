import { generarDatosPlan } from '@/lib/engine';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';
import { insertAiPlan, getLatestAiPlanByPlayerId } from '@/repositories/aiPlanRepository';
import { trackUsageEvent } from '@/lib/billing/client';
import { PLAN_MODES } from '@/config/plan-modes';

// Antigüedad máxima del plan semanal anterior que se tiene en cuenta para la variedad de la semana nueva.
const PREVIOUS_PLAN_MAX_AGE_DAYS = 14;

// Último plan semanal guardado del jugador, si es reciente: la semana nueva continúa su variedad.
async function getPreviousWeekPlan(db, jugadorId) {
  const plan = await getLatestAiPlanByPlayerId(db, jugadorId, { modo: PLAN_MODES.SEMANA });
  if (!plan?.datos || !plan.created_at) return null;
  const ageDays = (Date.now() - new Date(plan.created_at).getTime()) / 86_400_000;
  return ageDays <= PREVIOUS_PLAN_MAX_AGE_DAYS ? plan.datos : null;
}

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

async function reportPlanGenerated({ user, jugador, equipoId, equipoNombre, nombre, menu, semana, modo, origen }) {
  const jugadorNombre = `${jugador.nombre || ''} ${jugador.apellidos || ''}`.trim();
  const isTypePlan = modo === PLAN_MODES.TIPOS;

  try {
    await trackUsageEvent({
      app: 'nutralab-vlc',
      tenantId: equipoId || jugador.id,
      tenantName: equipoNombre || 'Valencia C.F.',
      userId: user?.id,
      eventType: isTypePlan ? 'GENERACION_PLAN_TIPOS' : 'GENERACION_PLAN',
      description: isTypePlan
        ? `Plan nutricional por tipos de día (${jugadorNombre || 'Jugador'} - ${nombre})`
        : `Plan nutricional (${jugadorNombre || 'Jugador'} - ${nombre})`,
      metadata: {
        jugadorId: jugador.id,
        jugadorNombre,
        equipoId,
        semana,
        modo,
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
  { jugador, nombre, menu, calendario, preMatchConfig, teamConfig, modo, tiposDia, equipoId, equipoNombre, semana = null, user, origen }
) {
  const planAnterior = modo === PLAN_MODES.TIPOS ? null : await getPreviousWeekPlan(db, jugador.id);
  const datos = await generarDatosPlan({ jugador, nombre, menu, calendario, preMatchConfig, teamConfig, modo, tiposDia, planAnterior });
  await reportPlanGenerated({ user, jugador, equipoId, equipoNombre, nombre, menu: datos.meta.modo === PLAN_MODES.TIPOS ? null : menu, semana, modo: datos.meta.modo, origen });
  return datos;
}

/** Guarda un plan nuevo. El modo de la columna es el de la ficha (datos.meta.modo); un plan legado sin ficha es semanal. */
export async function savePlan(db, { jugadorId, nombre, datos, contenido = '' }) {
  const now = new Date().toISOString();
  return insertAiPlan(db, {
    jugador_id: jugadorId,
    nombre,
    modo: datos?.meta?.modo || PLAN_MODES.SEMANA,
    contexto: null,
    contexto_adicional: null,
    contenido,
    datos,
    created_at: now,
    updated_at: now,
  });
}
