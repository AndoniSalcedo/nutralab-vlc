import { calculateByObjective } from '@/lib/metrics/anthropometry';
import { getUserMealsForDay, DEFAULT_OBJECTIVE_KEY, getTeamNutritionDayTypes } from '@/config/nutrition-days';
import { PLAN_MODES, WEEK_DAY_KEYS, WEEK_DAY_LABELS, MAX_TYPE_PLAN_DAYS, getPlanDayKeys } from '@/config/plan-modes';
import { cleanText, numberOrNull } from '@/lib/utils';


function calculateMacros(metricas, config, objectiveKey, teamConfig) {
  const result = calculateByObjective({
    weightKg: metricas?.peso,
    objectiveKey,
    dayTypeKey: config?.key,
    teamConfig,
  });

  return {
    kcal: result?.kcal ?? null,
    proteina: result?.protein ?? null,
    hidratos: result?.cho ?? null,
    grasa: result?.fat ?? null,
  };
}

function resolveDayTypeConfig(tipoDia, teamConfig) {
  const types = getTeamNutritionDayTypes(teamConfig);
  return types.find((t) => t.key === tipoDia) || types[0];
}

export function getDefaultCalendar() {
  return {
    lunes: 'entreno',
    martes: 'entreno',
    miercoles: 'descanso',
    jueves: 'entreno',
    viernes: 'entreno',
    sabado: 'descanso',
    domingo: 'descanso',
  };
}

const MATCH_SCHEDULES = ['manana', 'tarde', 'noche'];
const MATCH_SCHEDULE_LABELS = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

/** Días del plan semanal: lunes a domingo con el tipo de día de su calendario. */
function buildWeekDays(calendario) {
  if (!calendario || typeof calendario !== 'object') {
    throw new Error('El calendario de tipos de día es obligatorio para generar el plan. Debes asignar el tipo de día (entreno, descanso, etc.) para cada día de la semana.');
  }
  for (const dayKey of WEEK_DAY_KEYS) {
    if (!calendario[dayKey]) {
      throw new Error(`Falta configurar el tipo de día para el ${dayKey} en el calendario de la semana.`);
    }
  }
  return WEEK_DAY_KEYS.map((dayKey) => ({ dayKey, label: WEEK_DAY_LABELS[dayKey], tipoDia: calendario[dayKey] }));
}

/** Filas válidas de un plan por tipos: [{ tipoDia, cantidad, horario }] (horario solo en partido). */
export function sanitizeTypePlanRows(tiposDia, teamConfig) {
  const validTypes = new Set(getTeamNutritionDayTypes(teamConfig).map((t) => t.key));
  return (Array.isArray(tiposDia) ? tiposDia : [])
    .map((row) => ({
      tipoDia: row?.tipoDia,
      cantidad: Math.trunc(Number(row?.cantidad) || 0),
      horario: row?.tipoDia === 'partido' ? (MATCH_SCHEDULES.includes(row?.horario) ? row.horario : 'tarde') : null,
    }))
    .filter((row) => validTypes.has(row.tipoDia) && row.cantidad > 0);
}

/**
 * Días del plan por tipos: cada fila genera `cantidad` opciones de su tipo (partido_1, partido_2, descanso_1...).
 * El horario de cada partido viaja en preMatchConfig.partidos[dayKey], como en el plan semanal.
 */
function buildTypeDays(tiposDia, teamConfig) {
  const rows = sanitizeTypePlanRows(tiposDia, teamConfig);
  const total = rows.reduce((n, row) => n + row.cantidad, 0);
  if (total === 0) {
    throw new Error('Indica al menos un tipo de día con su número de opciones para generar el plan.');
  }
  if (total > MAX_TYPE_PLAN_DAYS) {
    throw new Error(`Un plan por tipos admite como máximo ${MAX_TYPE_PLAN_DAYS} opciones (has pedido ${total}).`);
  }

  const types = getTeamNutritionDayTypes(teamConfig);
  const countByType = {};
  const days = [];
  const partidos = {};
  for (const row of rows) {
    const typeLabel = types.find((t) => t.key === row.tipoDia)?.label || row.tipoDia;
    for (let i = 0; i < row.cantidad; i++) {
      countByType[row.tipoDia] = (countByType[row.tipoDia] || 0) + 1;
      const dayKey = `${row.tipoDia}_${countByType[row.tipoDia]}`;
      const scheduleSuffix = row.horario ? ` · ${MATCH_SCHEDULE_LABELS[row.horario]}` : '';
      days.push({ dayKey, label: `${typeLabel} ${countByType[row.tipoDia]}${scheduleSuffix}`, tipoDia: row.tipoDia });
      if (row.horario) partidos[dayKey] = { horario: row.horario };
    }
  }
  return { rows, days, preMatchConfig: { partidos } };
}

export function buildBasePlanData({ jugador, nombre, menu, calendario, preMatchConfig, teamConfig, suplementacion, protocolos, modo = PLAN_MODES.SEMANA, tiposDia }) {
  const fullName = cleanText(`${jugador?.nombre || ''} ${jugador?.apellidos || ''}`) || 'Jugador';
  const metricas = {
    peso: numberOrNull(jugador?.peso_kg, 1),
    grasa: numberOrNull(jugador?.porcentaje_grasa, 1),
    masaMagra: numberOrNull(jugador?.peso_magro ?? jugador?.masa_magra_kg, 1),
    pesoMuscular: numberOrNull(jugador?.peso_muscular_pct, 1),
  };

  const isTypePlan = modo === PLAN_MODES.TIPOS;
  const typePlan = isTypePlan ? buildTypeDays(tiposDia, teamConfig) : null;
  const planDays = isTypePlan ? typePlan.days : buildWeekDays(calendario);
  // El plan por tipos no usa menú de comedor y el horario de cada partido sale de sus filas.
  const planMenu = isTypePlan ? null : menu;
  const planPreMatchConfig = isTypePlan ? typePlan.preMatchConfig : (preMatchConfig || null);

  if (!jugador?.num_comidas) {
    throw new Error(`El jugador ${fullName} no tiene configurado el 'Número de comidas'. Por favor, configúralo en su ficha antes de generar un plan.`);
  }

  if (!metricas.peso || metricas.peso <= 0) {
    throw new Error(`El jugador ${fullName} no tiene registrado su peso corporal (peso_kg). Por favor, añade un pesaje o regístralo en su ficha antes de generar un plan.`);
  }

  const dias = {};
  const objectiveKey = jugador?.objetivo || DEFAULT_OBJECTIVE_KEY;
  planDays.forEach(({ dayKey, label, tipoDia }) => {
    const dayTypeConfig = resolveDayTypeConfig(tipoDia, teamConfig);
    const macros = calculateMacros(metricas, dayTypeConfig, objectiveKey, teamConfig);

    if (!macros.kcal || !macros.proteina || !macros.hidratos || !macros.grasa) {
      throw new Error(`No se pudieron calcular los macronutrientes para el día ${label} (${tipoDia}) de ${fullName}. Comprueba la configuración de objetivos y tipos de día del equipo.`);
    }

    dias[dayKey] = {
      dayKey,
      label,
      tipoDia,
      ...macros,
      ingestas: getUserMealsForDay(jugador, tipoDia, teamConfig, planPreMatchConfig, dayKey).map((name) => ({
        nombre: name,
        detalle: '',
      })),
    };
  });

  const teamProtocols = teamConfig?.protocols || jugador?.equipos?.configuracion_nutricional?.protocols || [];
  const customProtocols = jugador?.protocolos_custom || {};
  const activeDayTypes = new Set(planDays.map((day) => day.tipoDia));

  const resolvedProtocols = Array.isArray(protocolos) && protocolos.length > 0
    ? protocolos
    : teamProtocols
      .map((p) => customProtocols[p.id] || p)
      .filter((p) => {
        const isIncluded = p.incluirEnPlan !== false && (p.incluirEnPlan === true || p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido')));
        if (!isIncluded) return false;
        if (p.dayTypeKey && activeDayTypes.size > 0) {
          return activeDayTypes.has(p.dayTypeKey);
        }
        return true;
      });

  return {
    meta: {
      nombre: cleanText(nombre) || `Plan ${new Date().toLocaleDateString('es-ES')}`,
      modo: isTypePlan ? PLAN_MODES.TIPOS : PLAN_MODES.SEMANA,
      ...(isTypePlan ? { ordenDias: planDays.map((day) => day.dayKey), tiposDia: typePlan.rows } : {}),
      semanaMenu: planMenu?.semana || null,
      preMatchConfig: planPreMatchConfig,
      fecha: new Date().toISOString(),
    },
    jugador: {
      id: jugador?.id || null,
      nombre: fullName,
      posicion: cleanText(jugador?.posicion) || 'Sin posición',
      num_comidas: jugador?.num_comidas,
      postentreno: jugador?.postentreno,
      objetivo: jugador?.objetivo || DEFAULT_OBJECTIVE_KEY,
    },
    metricas,
    dias,
    suplementacion: Array.isArray(suplementacion) ? suplementacion : [],
    protocolos: resolvedProtocols,
    // Notas del plan: las escribe el nutricionista en el editor del plan.
    notas: [],
  };
}

function normalizeMealList(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source.slice(0, 7).map((meal, index) => ({
    nombre: cleanText(meal?.nombre) || cleanText(fallback[index]?.nombre) || `Ingesta ${index + 1}`,
    detalle: cleanText(meal?.detalle) || cleanText(fallback[index]?.detalle),
    macrosReales: sanitizeMacroTotals(meal?.macrosReales),
    objetivo: sanitizeMacroTotals(meal?.objetivo),
  }));
}

function sanitizeMacroTotals(value, { allowNegative = false } = {}) {
  if (!value || typeof value !== 'object') return null;
  const sanitize = (item) => {
    const n = Number(item);
    if (!Number.isFinite(n) || (!allowNegative && n < 0)) return null;
    return Math.round(n);
  };
  const result = {
    kcal: sanitize(value.kcal),
    proteina: sanitize(value.proteina),
    hidratos: sanitize(value.hidratos),
    grasa: sanitize(value.grasa),
  };
  return Object.values(result).some((item) => item === null) ? null : result;
}

export function sanitizePlanData(data, teamConfig) {
  if (!data || typeof data !== 'object') return null;

  const metricas = {
    peso: numberOrNull(data.metricas?.peso, 1),
    grasa: numberOrNull(data.metricas?.grasa, 1),
    masaMagra: numberOrNull(data.metricas?.masaMagra, 1),
    pesoMuscular: numberOrNull(data.metricas?.pesoMuscular, 1),
  };

  const isTypePlan = data.meta?.modo === PLAN_MODES.TIPOS;
  const dayKeys = isTypePlan
    ? getPlanDayKeys(data.meta).filter((dayKey) => data.dias?.[dayKey]).slice(0, MAX_TYPE_PLAN_DAYS)
    : WEEK_DAY_KEYS;

  const defaultCalendar = getDefaultCalendar();
  const cleanDias = {};

  const objectiveKey = data.jugador?.objetivo || DEFAULT_OBJECTIVE_KEY;
  dayKeys.forEach((dayKey) => {
    const incomingDay = (data.dias && data.dias[dayKey]) || {};
    const resolvedTipoDia = incomingDay.tipoDia || defaultCalendar[dayKey];

    const dayTypeConfig = resolveDayTypeConfig(resolvedTipoDia, teamConfig);
    const fallbackMacros = calculateMacros(metricas, dayTypeConfig, objectiveKey, teamConfig);
    const fallbackMeals = getUserMealsForDay(data.jugador, resolvedTipoDia, teamConfig);
    const mealFallback = fallbackMeals.map((name) => ({
      nombre: name,
      detalle: '',
    }));

    cleanDias[dayKey] = {
      dayKey,
      label: isTypePlan ? (cleanText(incomingDay.label) || dayKey) : WEEK_DAY_LABELS[dayKey],
      tipoDia: resolvedTipoDia,
      kcal: numberOrNull(incomingDay.kcal, 0) ?? fallbackMacros.kcal,
      proteina: numberOrNull(incomingDay.proteina, 0) ?? fallbackMacros.proteina,
      hidratos: numberOrNull(incomingDay.hidratos, 0) ?? fallbackMacros.hidratos,
      grasa: numberOrNull(incomingDay.grasa, 0) ?? fallbackMacros.grasa,
      ingestas: normalizeMealList(incomingDay.ingestas, mealFallback),
      macrosReales: sanitizeMacroTotals(incomingDay.macrosReales),
      desviacionMacros: sanitizeMacroTotals(incomingDay.desviacionMacros, { allowNegative: true }),
      cierreMacros: incomingDay.cierreMacros && typeof incomingDay.cierreMacros === 'object'
        ? {
            estado: cleanText(incomingDay.cierreMacros.estado) || 'parcial',
            ingestasCalculadas: Number.isFinite(Number(incomingDay.cierreMacros.ingestasCalculadas))
              ? Number(incomingDay.cierreMacros.ingestasCalculadas)
              : 0,
            ingestasTotales: Number.isFinite(Number(incomingDay.cierreMacros.ingestasTotales))
              ? Number(incomingDay.cierreMacros.ingestasTotales)
              : mealFallback.length,
          }
        : null,
    };
  });

  return {
    meta: {
      nombre: cleanText(data.meta?.nombre),
      modo: isTypePlan ? PLAN_MODES.TIPOS : PLAN_MODES.SEMANA,
      ...(isTypePlan ? { ordenDias: dayKeys, tiposDia: sanitizeTypePlanRows(data.meta?.tiposDia, teamConfig) } : {}),
      semanaMenu: isTypePlan ? null : (cleanText(data.meta?.semanaMenu) || null),
      preMatchConfig: data.meta?.preMatchConfig || null,
      fecha: data.meta?.fecha || new Date().toISOString(),
      planColors: data.meta?.planColors || data.planColors || null,
      informe: data.meta?.informe || null,
    },
    jugador: {
      id: data.jugador?.id || null,
      nombre: cleanText(data.jugador?.nombre) || 'Jugador',
      posicion: cleanText(data.jugador?.posicion) || 'Sin posición',
      num_comidas: data.jugador?.num_comidas,
      postentreno: data.jugador?.postentreno,
      objetivo: data.jugador?.objetivo || DEFAULT_OBJECTIVE_KEY,
    },
    metricas,
    dias: cleanDias,
    suplementacion: Array.isArray(data.suplementacion)
      ? data.suplementacion.map((s) => ({
        id: s.id,
        nombre: cleanText(s.nombre),
        categoria: cleanText(s.categoria) || 'Suplemento',
        dosis: cleanText(s.dosis),
        timing: cleanText(s.timing),
        notas: cleanText(s.notas),
      })).filter((s) => s.nombre)
      : (Array.isArray(data.suplementos)
        ? data.suplementos.map((s) => ({
          id: s.id,
          nombre: cleanText(s.nombre || s.suplemento?.nombre),
          categoria: cleanText(s.categoria || s.suplemento?.categoria) || 'Suplemento',
          dosis: cleanText(s.dosis || s.dose?.value || s.pauta),
          timing: cleanText(s.timing || s.timing_override || s.suplemento?.timing),
          notas: cleanText(s.notas || s.note_override || s.suplemento?.notas || s.suplemento?.descripcion),
        })).filter((s) => s.nombre)
        : []),
    protocolos: Array.isArray(data.protocolos)
      ? data.protocolos.map((p) => ({
        id: p.id,
        dayTypeKey: p.dayTypeKey,
        name: cleanText(p.name),
        incluirEnPlan: p.incluirEnPlan !== undefined ? Boolean(p.incluirEnPlan) : (p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido'))),
        timeline: Array.isArray(p.timeline) ? p.timeline.map((t) => ({
          id: t.id,
          timeLabel: cleanText(t.timeLabel),
          title: cleanText(t.title),
          description: cleanText(t.description),
          icon: t.icon || 'IconFlag',
        })) : [],
        checklist: Array.isArray(p.checklist) ? p.checklist.map((c) => ({
          id: c.id,
          title: cleanText(c.title),
          description: cleanText(c.description),
        })) : [],
      })).filter((p) => p.name)
      : [],
    notas: Array.isArray(data.notas)
      ? data.notas.map(cleanText).filter(Boolean).slice(0, 6)
      : typeof data.notas === 'string'
      ? data.notas.split('\n').map(cleanText).filter(Boolean).slice(0, 6)
      : [],
  };
}
