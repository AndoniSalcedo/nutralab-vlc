export function latestEvolution(evoluciones = []) {
  return [...(evoluciones || [])]
    .filter((item) => item?.fecha)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .at(-1) || null;
}

export function withLatestMeasurement(jugador, evoluciones = []) {
  if (!jugador) return jugador;
  const latest = latestEvolution(evoluciones);
  if (!latest) return jugador;

  return {
    ...jugador,
    altura_cm: latest.altura_cm ?? jugador.altura_cm,
    fecha_ultima_medicion: latest.fecha,
    peso_kg: latest.peso_kg,
    porcentaje_grasa: latest.porcentaje_grasa,
    masa_magra_kg: latest.masa_magra_kg,
    suma_6_pliegues: latest.suma_6_pliegues,
    suma_8_pliegues: latest.suma_8_pliegues,
    endomorfia: latest.endomorfia,
    mesomorfia: latest.mesomorfia,
    ectomorfia: latest.ectomorfia,
  };
}
