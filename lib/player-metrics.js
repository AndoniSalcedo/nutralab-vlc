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

export function withLatestMeasurement(jugador, evoluciones = []) {
  if (!jugador) return jugador;
  const latest = latestEvolution(evoluciones);
  if (!latest) return jugador;

  return {
    ...jugador,
    fecha_ultima_medicion: latest.fecha,
    altura_cm: latestMetricValue(evoluciones, 'altura_cm', jugador.altura_cm),
    peso_kg: latestMetricValue(evoluciones, 'peso_kg', jugador.peso_kg),
    porcentaje_grasa: latestMetricValue(evoluciones, 'porcentaje_grasa', jugador.porcentaje_grasa),
    masa_magra_kg: latestMetricValue(evoluciones, 'masa_magra_kg', jugador.masa_magra_kg),
    suma_6_pliegues: latestMetricValue(evoluciones, 'suma_6_pliegues', jugador.suma_6_pliegues),
    suma_8_pliegues: latestMetricValue(evoluciones, 'suma_8_pliegues', jugador.suma_8_pliegues),
    endomorfia: latestMetricValue(evoluciones, 'endomorfia', jugador.endomorfia),
    mesomorfia: latestMetricValue(evoluciones, 'mesomorfia', jugador.mesomorfia),
    ectomorfia: latestMetricValue(evoluciones, 'ectomorfia', jugador.ectomorfia),
  };
}
