// kcal/kg derivadas de los macros (4P + 4C + 9G): es el valor que usa el motor, nunca se edita a mano.
export function calcKcalPerKg({ proteinGkg = 0, carbsGkg = 0, fatGkg = 0 } = {}) {
  const value = (Number(proteinGkg) || 0) * 4 + (Number(carbsGkg) || 0) * 4 + (Number(fatGkg) || 0) * 9;
  return Math.round(value * 100) / 100;
}

// Crea la entrada de g/kg de un tipo de día con su kcalPerKg calculado.
export function macros(proteinGkg, carbsGkg, fatGkg) {
  return { kcalPerKg: calcKcalPerKg({ proteinGkg, carbsGkg, fatGkg }), proteinGkg, carbsGkg, fatGkg };
}
