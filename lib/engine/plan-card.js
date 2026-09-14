import { calculateByObjective } from '@/lib/metrics/anthropometry';
import { getUserMealsForDay, DEFAULT_OBJECTIVE_KEY, getTeamNutritionDayTypes } from '@/config/nutrition-days';
import { cleanText, numberOrNull } from '@/lib/utils';

export { PLAN_THEME_PRESETS, DEFAULT_PLAN_COLORS } from '@/config/plan-themes';

function calculateMacros(metricas, config, objectiveKey, teamConfig) {
  const result = calculateByObjective({
    weightKg: metricas.peso,
    objectiveKey,
    dayTypeKey: config.key,
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

export function buildBasePlanData({ jugador, nombre, contexto, contextoAdicional, menu, calendario, preMatchConfig, teamConfig, suplementacion, protocolos }) {
  const fullName = cleanText(`${jugador?.nombre || ''} ${jugador?.apellidos || ''}`) || 'Jugador';
  const metricas = {
    peso: numberOrNull(jugador?.peso_kg, 1),
    grasa: numberOrNull(jugador?.porcentaje_grasa, 1),
    masaMagra: numberOrNull(jugador?.peso_magro ?? jugador?.masa_magra_kg, 1),
    pesoMuscular: numberOrNull(jugador?.peso_muscular_pct, 1),
  };

  if (!calendario || typeof calendario !== 'object') {
    throw new Error('El calendario de tipos de día es obligatorio para generar el plan. Debes asignar el tipo de día (entreno, descanso, etc.) para cada día de la semana.');
  }

  if (!jugador?.num_comidas) {
    throw new Error(`El jugador ${fullName} no tiene configurado el 'Número de comidas'. Por favor, configúralo en su ficha antes de generar un plan.`);
  }

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  for (const dayKey of daysOfWeek) {
    if (!calendario[dayKey]) {
      throw new Error(`Falta configurar el tipo de día para el ${dayKey} en el calendario de la semana.`);
    }
  }

  const dayLabels = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const dias = {};
  const objectiveKey = jugador?.objetivo || DEFAULT_OBJECTIVE_KEY;
  daysOfWeek.forEach((dayKey) => {
    const tipoDia = calendario[dayKey];
    const dayTypeConfig = resolveDayTypeConfig(tipoDia, teamConfig);
    const macros = calculateMacros(metricas, dayTypeConfig, objectiveKey, teamConfig);

    dias[dayKey] = {
      dayKey,
      label: dayLabels[dayKey],
      tipoDia,
      ...macros,
      ingestas: getUserMealsForDay(jugador, tipoDia, teamConfig, preMatchConfig, dayKey).map((name) => ({
        nombre: name,
        detalle: '',
      })),
    };
  });

  const teamProtocols = teamConfig?.protocols || jugador?.equipos?.configuracion_nutricional?.protocols || [];
  const customProtocols = jugador?.protocolos_custom || {};
  const activeDayTypes = new Set(Object.values(calendario || {}));

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
    version: 2,
    meta: {
      nombre: cleanText(nombre) || `Plan ${new Date().toLocaleDateString('es-ES')}`,
      contexto: contexto || 'semana_normal',
      contextoAdicional: cleanText(contextoAdicional),
      semanaMenu: menu?.semana || null,
      preMatchConfig: preMatchConfig || null,
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
    notas: [
      'Sin déficit el día de partido',
      'Mide el AOVE: 1 cucharada',
      'Mín. 3-4 pescados azules/semana',
    ],
  };
}

function normalizeMealList(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source.slice(0, 7).map((meal, index) => ({
    nombre: cleanText(meal?.nombre) || cleanText(fallback[index]?.nombre) || `Ingesta ${index + 1}`,
    detalle: cleanText(meal?.detalle) || cleanText(fallback[index]?.detalle),
  }));
}

export function sanitizePlanData(data, teamConfig) {
  if (!data || typeof data !== 'object') return null;

  const metricas = {
    peso: numberOrNull(data.metricas?.peso, 1),
    grasa: numberOrNull(data.metricas?.grasa, 1),
    masaMagra: numberOrNull(data.metricas?.masaMagra, 1),
    pesoMuscular: numberOrNull(data.metricas?.pesoMuscular, 1),
  };

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const dayLabels = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const defaultCalendar = getDefaultCalendar();
  const cleanDias = {};

  const objectiveKey = data.jugador?.objetivo || DEFAULT_OBJECTIVE_KEY;
  daysOfWeek.forEach((dayKey) => {
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
      label: dayLabels[dayKey],
      tipoDia: resolvedTipoDia,
      kcal: numberOrNull(incomingDay.kcal, 0) ?? fallbackMacros.kcal,
      proteina: numberOrNull(incomingDay.proteina, 0) ?? fallbackMacros.proteina,
      hidratos: numberOrNull(incomingDay.hidratos, 0) ?? fallbackMacros.hidratos,
      grasa: numberOrNull(incomingDay.grasa, 0) ?? fallbackMacros.grasa,
      ingestas: normalizeMealList(incomingDay.ingestas, mealFallback),
    };
  });

  return {
    version: 2,
    meta: {
      nombre: cleanText(data.meta?.nombre),
      contexto: cleanText(data.meta?.contexto) || 'semana_normal',
      contextoAdicional: cleanText(data.meta?.contextoAdicional),
      semanaMenu: cleanText(data.meta?.semanaMenu) || null,
      preMatchConfig: data.meta?.preMatchConfig || null,
      fecha: data.meta?.fecha || new Date().toISOString(),
      planColors: data.meta?.planColors || data.planColors || null,
      recomendacionesIngestas: typeof data.meta?.recomendacionesIngestas === 'object' && data.meta?.recomendacionesIngestas
        ? Object.fromEntries(
          Object.entries(data.meta.recomendacionesIngestas).map(([k, v]) => [k, cleanText(v)])
        )
        : {},
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
      : [],
  };
}
