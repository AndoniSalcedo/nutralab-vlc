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

  const combinedWeightLogs = [...(evoluciones || []), ...(pesajes || [])];
  
  return {
    ...jugador,
    fecha_ultima_medicion: latestDate,
    altura_cm: latestMetricValue(evoluciones, 'altura_cm', jugador.altura_cm),
    peso_kg: latestMetricValue(combinedWeightLogs, 'peso_kg', jugador.peso_kg),
    porcentaje_grasa: latestMetricValue(evoluciones, 'porcentaje_grasa', jugador.porcentaje_grasa),
    masa_magra_kg: latestMetricValue(evoluciones, 'masa_magra_kg', jugador.masa_magra_kg),
    peso_muscular_pct: latestPesoMuscularPct(evoluciones, jugador.peso_muscular_pct),
    suma_6_pliegues: latestMetricValue(evoluciones, 'suma_6_pliegues', jugador.suma_6_pliegues),
    suma_8_pliegues: latestMetricValue(evoluciones, 'suma_8_pliegues', jugador.suma_8_pliegues),
    endomorfia: latestMetricValue(evoluciones, 'endomorfia', jugador.endomorfia),
    mesomorfia: latestMetricValue(evoluciones, 'mesomorfia', jugador.mesomorfia),
    ectomorfia: latestMetricValue(evoluciones, 'ectomorfia', jugador.ectomorfia),
  };
}
