import { metricValue } from './measurement-metrics';

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

export function calculateSemaforo(pesajes = [], currentWeightOverride = null) {
  const validPesajes = (pesajes || [])
    .filter((p) => p && p.peso_kg !== null && p.peso_kg !== undefined && p.peso_kg !== '')
    .map((p) => ({ ...p, peso_kg: Number(p.peso_kg) }))
    .filter((p) => Number.isFinite(p.peso_kg) && p.peso_kg > 0);

  if (validPesajes.length === 0) {
    const fallbackWeight = currentWeightOverride ? Number(currentWeightOverride) : null;
    return {
      hasPesajes: false,
      pesoReferencia: null,
      pesoActual: fallbackWeight,
      diff: null,
      absDiff: null,
      status: 'sin_datos',
      color: 'gray',
      label: 'Sin pesajes',
      totalPesajes: 0,
    };
  }

  // Peso de referencia: Media del jugador con todos los pesajes
  const sum = validPesajes.reduce((acc, item) => acc + item.peso_kg, 0);
  const pesoReferencia = Math.round((sum / validPesajes.length) * 100) / 100;

  // Peso actual: último peso de pesajes por fecha
  const sortedPesajes = [...validPesajes].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const latestPesaje = sortedPesajes[sortedPesajes.length - 1];
  const pesoActual = currentWeightOverride !== null && currentWeightOverride !== undefined
    ? Number(currentWeightOverride)
    : latestPesaje.peso_kg;

  const diff = Math.round((pesoActual - pesoReferencia) * 100) / 100;
  const absDiff = Math.abs(diff);

  let status = 'verde';
  let color = 'green';
  let label = 'Zona Óptima';

  if (absDiff <= 0.75) {
    status = 'verde';
    color = 'green';
    label = 'Zona Óptima';
  } else if (absDiff <= 1.50) {
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
    pesoReferencia,
    pesoActual,
    diff,
    absDiff,
    status,
    color,
    label,
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

  const semaforo = calculateSemaforo(pesajes, finalWeight);

  return {
    ...jugador,
    fecha_ultima_medicion: latestDate,
    altura_cm: latestMetricValue(evoluciones, 'altura_cm', jugador.altura_cm),
    peso_kg: finalWeight,
    porcentaje_grasa: latestMetricValue(evoluciones, 'porcentaje_grasa', jugador.porcentaje_grasa),
    masa_magra_kg: latestMetricValue(evoluciones, 'masa_magra_kg', jugador.masa_magra_kg),
    peso_muscular_pct: latestPesoMuscularPct(evoluciones, jugador.peso_muscular_pct),
    suma_6_pliegues: latestMetricValue(evoluciones, 'suma_6_pliegues', jugador.suma_6_pliegues),
    suma_8_pliegues: latestMetricValue(evoluciones, 'suma_8_pliegues', jugador.suma_8_pliegues),
    endomorfia: latestMetricValue(evoluciones, 'endomorfia', jugador.endomorfia),
    mesomorfia: latestMetricValue(evoluciones, 'mesomorfia', jugador.mesomorfia),
    ectomorfia: latestMetricValue(evoluciones, 'ectomorfia', jugador.ectomorfia),
    pesajes: pesajes || [],
    semaforo,
  };
}
