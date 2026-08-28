import { metricValue } from './measurement-metrics.js';

export function latestEvolution(evoluciones = []) {
  return [...(evoluciones || [])]
    .filter((item) => item?.fecha)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .at(-1) || null;
}

function hasMetricValue(value) {
  return value !== null && value !== undefined && value !== '';
}

export function latestMetricValue(evoluciones = [], key, fallback = null) {
  const latestWithValue = [...(evoluciones || [])]
    .filter((item) => item?.fecha && hasMetricValue(item?.[key]))
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .at(-1);

  return latestWithValue?.[key] ?? fallback;
}

export function latestPesoMuscularPct(evoluciones = [], fallback = null) {
  const sorted = [...(evoluciones || [])]
    .filter((item) => item?.fecha)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  const metricConfig = { 
    key: 'peso_muscular', 
    unit: '%', 
    excelKeys: ['%Peso Muscular Lee&cols', '% Peso Muscular Lee&cols'] 
  };

  for (let i = sorted.length - 1; i >= 0; i--) {
    const val = metricValue(sorted[i], metricConfig);
    if (val !== null && val !== undefined && val !== '') {
      return val;
    }
  }
  return fallback;
}

export function extractMasaMagra(record) {
  if (!record) return null;
  if (hasMetricValue(record.masa_magra_kg)) {
    const val = Number(record.masa_magra_kg);
    if (Number.isFinite(val) && val > 0) return Math.round(val * 100) / 100;
  }
  if (hasMetricValue(record.peso_magro)) {
    const val = Number(record.peso_magro);
    if (Number.isFinite(val) && val > 0) return Math.round(val * 100) / 100;
  }
  if (record.metricas_excel && typeof record.metricas_excel === 'object') {
    for (const k of ['Masa Magra', 'Peso Magro', 'Masa magra (kg)', 'Masa Magra (kg)', 'PESO MAGRO', 'PESO MAGRO (Kg)']) {
      if (hasMetricValue(record.metricas_excel[k])) {
        const val = Number(record.metricas_excel[k]);
        if (Number.isFinite(val) && val > 0) return Math.round(val * 100) / 100;
      }
    }
  }
  const peso = Number(record.peso_kg);
  const grasa = Number(record.porcentaje_grasa ?? record.porcentaje_grasa_faulkner ?? record.porcentaje_grasa_yuhasz);
  if (Number.isFinite(peso) && peso > 0 && Number.isFinite(grasa) && grasa > 0 && grasa < 100) {
    return Math.round(peso * (1 - grasa / 100) * 100) / 100;
  }
  return null;
}

export function getLatestMasaMagra(evoluciones = [], fallback = null) {
  const sorted = [...(evoluciones || [])]
    .filter((item) => item?.fecha)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  for (let i = sorted.length - 1; i >= 0; i--) {
    const val = extractMasaMagra(sorted[i]);
    if (val !== null) return val;
  }

  if (fallback !== null && fallback !== undefined && fallback !== '') {
    const fbVal = extractMasaMagra(typeof fallback === 'object' ? fallback : { masa_magra_kg: fallback });
    if (fbVal !== null) return fbVal;
  }
  return null;
}

export function calculateSemaforo(pesajes = [], currentWeightOverride = null, options = {}) {
  const opts = Array.isArray(options) ? { evoluciones: options } : (options || {});
  const playerObj = opts.jugador || (opts.id ? opts : null);
  const evolucionesList = opts.evoluciones || [];

  const validPesajes = (pesajes || [])
    .filter((p) => p && p.peso_kg !== null && p.peso_kg !== undefined && p.peso_kg !== '')
    .map((p) => ({ ...p, peso_kg: Number(p.peso_kg) }))
    .filter((p) => Number.isFinite(p.peso_kg) && p.peso_kg > 0);

  // 1. Extraer Masa Magra de la última antropometría
  let masaMagra = opts.masaMagra !== undefined && opts.masaMagra !== null && opts.masaMagra !== ''
    ? Number(opts.masaMagra)
    : null;

  if (!Number.isFinite(masaMagra) || masaMagra <= 0) {
    masaMagra = getLatestMasaMagra(evolucionesList, playerObj ? extractMasaMagra(playerObj) : null);
  }

  // 2. Extraer % de grasa objetivo (8, 9 o 10%, por defecto 10%)
  let targetFatPct = opts.porcentajeGrasaObjetivo !== undefined && opts.porcentajeGrasaObjetivo !== null && opts.porcentajeGrasaObjetivo !== ''
    ? Number(opts.porcentajeGrasaObjetivo)
    : (playerObj?.porcentaje_grasa_objetivo !== undefined && playerObj?.porcentaje_grasa_objetivo !== null && playerObj?.porcentaje_grasa_objetivo !== ''
        ? Number(playerObj.porcentaje_grasa_objetivo)
        : 10);

  if (!Number.isFinite(targetFatPct) || targetFatPct <= 0 || targetFatPct >= 100) {
    targetFatPct = 10;
  }

  // 3. Peso de referencia: calculado con Masa Magra y % grasa objetivo (o media como fallback)
  let pesoReferencia = null;
  if (masaMagra && masaMagra > 0 && (1 - targetFatPct / 100) > 0) {
    pesoReferencia = Math.round((masaMagra / (1 - targetFatPct / 100)) * 100) / 100;
  } else if (validPesajes.length > 0) {
    const sum = validPesajes.reduce((acc, item) => acc + item.peso_kg, 0);
    pesoReferencia = Math.round((sum / validPesajes.length) * 100) / 100;
  }

  // 4. Peso actual: override > último peso registrado > peso en ficha
  const sortedPesajes = [...validPesajes].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const latestPesaje = sortedPesajes[sortedPesajes.length - 1];

  let pesoActual = null;
  if (currentWeightOverride !== null && currentWeightOverride !== undefined && currentWeightOverride !== '') {
    const numOverride = Number(currentWeightOverride);
    if (Number.isFinite(numOverride) && numOverride > 0) {
      pesoActual = numOverride;
    }
  }
  if (pesoActual === null && latestPesaje?.peso_kg) {
    pesoActual = latestPesaje.peso_kg;
  }
  if (pesoActual === null && playerObj?.peso_kg) {
    const pWeight = Number(playerObj.peso_kg);
    if (Number.isFinite(pWeight) && pWeight > 0) {
      pesoActual = pWeight;
    }
  }

  if (pesoActual === null || pesoReferencia === null) {
    return {
      hasPesajes: validPesajes.length > 0,
      hasReference: pesoReferencia !== null,
      pesoReferencia,
      pesoActual,
      masaMagra: masaMagra ? Math.round(masaMagra * 100) / 100 : null,
      porcentajeGrasaObjetivo: targetFatPct,
      diff: null,
      absDiff: null,
      status: 'sin_datos',
      color: 'gray',
      label: validPesajes.length === 0 ? 'Sin pesajes' : 'Sin referencia',
      totalPesajes: validPesajes.length,
    };
  }

  const diff = Math.round((pesoActual - pesoReferencia) * 100) / 100;
  const absDiff = Math.abs(diff);

  let status = 'verde';
  let color = 'green';
  let label = 'Zona Óptima';

  // Nuevos umbrales: ±0.5 kg (verde), ±0.5/1.0 kg (amarillo), >1.0 kg (rojo)
  if (absDiff <= 0.50) {
    status = 'verde';
    color = 'green';
    label = 'Zona Óptima';
  } else if (absDiff <= 1.00) {
    status = 'amarillo';
    color = 'yellow';
    label = 'Zona de Precaución';
  } else {
    status = 'rojo';
    color = 'red';
    label = diff < 0 ? 'Alerta (Pérdida)' : 'Alerta (Exceso)';
  }

  return {
    hasPesajes: true,
    hasReference: true,
    pesoReferencia,
    pesoActual,
    diff,
    absDiff,
    status,
    color,
    label,
    masaMagra: masaMagra ? Math.round(masaMagra * 100) / 100 : null,
    porcentajeGrasaObjetivo: targetFatPct,
    totalPesajes: validPesajes.length,
  };
}

export function withLatestMeasurement(jugador, evoluciones = [], pesajes = []) {
  if (!jugador) return jugador;
  const latestEvolucion = latestEvolution(evoluciones);
  const latestPesaje = latestEvolution(pesajes);
  
  let latestDate = null;
  if (latestEvolucion?.fecha && latestPesaje?.fecha) {
    latestDate = latestEvolucion.fecha > latestPesaje.fecha ? latestEvolucion.fecha : latestPesaje.fecha;
  } else {
    latestDate = latestEvolucion?.fecha || latestPesaje?.fecha;
  }

  // Prioritize latest weigh-in from pesajes table if present
  const latestPesajeWeight = latestMetricValue(pesajes, 'peso_kg', null);
  const weightFromLogs = latestMetricValue([...(evoluciones || []), ...(pesajes || [])], 'peso_kg', jugador.peso_kg);
  const finalWeight = latestPesajeWeight !== null ? latestPesajeWeight : weightFromLogs;

  const latestMasaMagra = getLatestMasaMagra(evoluciones, jugador.masa_magra_kg);
  const targetFatPct = jugador.porcentaje_grasa_objetivo !== undefined && jugador.porcentaje_grasa_objetivo !== null && jugador.porcentaje_grasa_objetivo !== ''
    ? Number(jugador.porcentaje_grasa_objetivo)
    : 10;

  const semaforo = calculateSemaforo(pesajes, finalWeight, {
    masaMagra: latestMasaMagra,
    porcentajeGrasaObjetivo: targetFatPct,
    jugador,
    evoluciones,
  });

  return {
    ...jugador,
    fecha_ultima_medicion: latestDate,
    altura_cm: latestMetricValue(evoluciones, 'altura_cm', jugador.altura_cm),
    peso_kg: finalWeight,
    porcentaje_grasa: latestMetricValue(evoluciones, 'porcentaje_grasa', jugador.porcentaje_grasa),
    masa_magra_kg: latestMasaMagra,
    porcentaje_grasa_objetivo: targetFatPct,
    peso_muscular_pct: latestPesoMuscularPct(evoluciones, jugador.peso_muscular_pct),
    suma_6_pliegues: latestMetricValue(evoluciones, 'suma_6_pliegues', jugador.suma_6_pliegues),
    suma_8_pliegues: latestMetricValue(evoluciones, 'suma_8_pliegues', jugador.suma_8_pliegues),
    endomorfia: latestMetricValue(evoluciones, 'endomorfia', jugador.endomorfia),
    mesomorfia: latestMetricValue(evoluciones, 'mesomorfia', jugador.mesomorfia),
    ectomorfia: latestMetricValue(evoluciones, 'ectomorfia', jugador.ectomorfia),
    pesajes: pesajes || [],
    evoluciones: evoluciones || [],
    semaforo,
  };
}
