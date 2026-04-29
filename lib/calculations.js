export function getLeanMass(input) {
  if (input.leanMassKg && input.leanMassKg > 0) return input.leanMassKg;
  if (input.bodyFatPct === undefined || input.bodyFatPct === null) return 0;
  return input.weightKg * (1 - input.bodyFatPct / 100);
}

export function cunninghamPlan(input) {
  const leanMass = getLeanMass(input);
  const rmr = 500 + 22 * leanMass;
  const kcal = Math.round(rmr * input.activityFactor);
  const cho = Math.round(input.weightKg * (input.choGkg ?? 5));
  const protein = Math.round(leanMass * (input.proteinGkgLean ?? 1.8));
  const fat = Math.max(40, Math.round((kcal - cho * 4 - protein * 4) / 9));
  const hydrationMl = Math.round(input.weightKg * 40);
  return { leanMass, rmr: Math.round(rmr), kcal, cho, protein, fat, hydrationMl };
}
