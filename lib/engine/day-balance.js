

/**
 * Cuadre del día: reparte los macros del día entre las tomas, compensa en cascada lo que cada toma se desvía y
 * regenera el día con otra selección de alimentos cuando, aun así, no cuadra.
 */

export function calculateMealBudgets(day, options = {}) {
  const { kcal, proteina, hidratos, grasa, ingestas } = day || {};
  if (!ingestas || ingestas.length === 0) return [];

  if (!Number(kcal) || !Number(proteina) || !Number(hidratos) || !Number(grasa)) {
    const dayName = day?.label || day?.dayKey || 'desconocido';
    throw new Error(`Datos nutricionales incompletos para el día ${dayName}: kcal=${kcal}, proteina=${proteina}, hidratos=${hidratos}, grasa=${grasa}. Comprueba el peso del jugador y los objetivos de su equipo.`);
  }

  const mealNames = ingestas.map((i) => i?.nombre).filter(Boolean);
  const postMealName = mealNames.find((n) => String(n).toLowerCase().includes('post'));
  const hasPost = Boolean(postMealName);
  const hasMerienda = mealNames.some((n) => String(n).toLowerCase().includes('merienda'));
  const hasDesayuno = mealNames.some((n) => String(n).toLowerCase().includes('desayuno'));
  const hasAlmuerzo = mealNames.some((n) => String(n).toLowerCase().includes('almuerzo'));
  const hasComida = mealNames.some((n) => String(n).toLowerCase().includes('comida'));
  const hasCena = mealNames.some((n) => String(n).toLowerCase().includes('cena'));

  const customFixedMeals = options.fixedMeals && typeof options.fixedMeals === 'object'
    ? options.fixedMeals
    : null;
  const fixedOnlyMealNames = new Set(Array.isArray(options.fixedOnlyMeals) ? options.fixedOnlyMeals : []);
  const fixedMacrosByMeal = new Map(
    Object.entries(customFixedMeals || {}).map(([name, value]) => [name, {
      kcal: Number(value?.kcal) || 0,
      p: Number(value?.p) || 0,
      hc: Number(value?.hc) || 0,
      g: Number(value?.g) || 0,
    }])
  );

  // Porcentajes y cuotas de reparto de macronutrientes según la estructura exacta de tomas
  let pShares = {};
  let hcShares = {};
  let gShares = {};

  const POST_FIXED_PROTEIN = 20; // 20g fijos de proteína siempre para post-entreno y post-partido
  const postP = hasPost ? Math.min(POST_FIXED_PROTEIN, proteina) : 0;

  // Compatibilidad para los consumidores antiguos de esta función: si no se
  // proporciona el análisis de árboles, el post sigue siendo la única toma fija.
  if (!customFixedMeals && hasPost && postMealName) {
    fixedMacrosByMeal.set(postMealName, { kcal: postP * 4, p: postP, hc: 0, g: 0 });
    fixedOnlyMealNames.add(postMealName);
  }

  if (hasPost) {
    if (hasDesayuno && hasAlmuerzo && hasComida && hasMerienda && hasCena) {
      pShares = { Desayuno: 10 / 90, Almuerzo: 10 / 90, Comida: 35 / 90, Merienda: 10 / 90, Cena: 25 / 90 };
      hcShares = { Desayuno: 0.15, Almuerzo: 0.10, Comida: 0.35, Merienda: 0.10, Cena: 0.30 };
      gShares = { Desayuno: 0.15, Almuerzo: 0.10, Comida: 0.35, Merienda: 0.10, Cena: 0.30 };
    } else if (hasDesayuno && hasAlmuerzo && hasComida && hasCena) {
      pShares = { Desayuno: 10 / 90, Almuerzo: 10 / 90, Comida: 35 / 90, Cena: 35 / 90 };
      hcShares = { Desayuno: 0.18, Almuerzo: 0.12, Comida: 0.40, Cena: 0.30 };
      gShares = { Desayuno: 0.18, Almuerzo: 0.10, Comida: 0.37, Cena: 0.35 };
    } else if (hasDesayuno && hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 10 / 90, Comida: 35 / 90, Merienda: 10 / 90, Cena: 35 / 90 };
      hcShares = { Desayuno: 0.20, Comida: 0.38, Merienda: 0.12, Cena: 0.30 };
      gShares = { Desayuno: 0.18, Comida: 0.35, Merienda: 0.12, Cena: 0.35 };
    } else if (hasDesayuno && !hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 15 / 90, Comida: 40 / 90, Cena: 35 / 90 };
      hcShares = { Desayuno: 0.25, Comida: 0.40, Cena: 0.35 };
      gShares = { Desayuno: 0.20, Comida: 0.40, Cena: 0.40 };
    } else if (!hasDesayuno && hasMerienda && hasComida && hasCena) {
      pShares = { Comida: 40 / 90, Merienda: 10 / 90, Cena: 40 / 90 };
      hcShares = { Comida: 0.35, Merienda: 0.35, Cena: 0.30 };
      gShares = { Comida: 0.45, Merienda: 0.10, Cena: 0.45 };
    } else if (!hasDesayuno && !hasMerienda && hasComida && hasCena) {
      pShares = { Comida: 0.50, Cena: 0.50 };
      hcShares = { Comida: 0.50, Cena: 0.50 };
      gShares = { Comida: 0.50, Cena: 0.50 };
    } else {
      const others = mealNames.filter((n) => !String(n).toLowerCase().includes('post'));
      const share = 1.0 / (others.length || 1);
      others.forEach((n) => {
        pShares[n] = share;
        hcShares[n] = share;
        gShares[n] = share;
      });
    }
  } else {
    if (hasDesayuno && hasAlmuerzo && hasComida && hasMerienda && hasCena) {
      pShares = { Desayuno: 0.12, Almuerzo: 0.08, Comida: 0.38, Merienda: 0.10, Cena: 0.32 };
      hcShares = { Desayuno: 0.18, Almuerzo: 0.10, Comida: 0.38, Merienda: 0.10, Cena: 0.24 };
      gShares = { Desayuno: 0.18, Almuerzo: 0.10, Comida: 0.37, Merienda: 0.10, Cena: 0.25 };
    } else if (hasDesayuno && hasAlmuerzo && hasComida && hasCena) {
      pShares = { Desayuno: 0.15, Almuerzo: 0.10, Comida: 0.40, Cena: 0.35 };
      hcShares = { Desayuno: 0.20, Almuerzo: 0.10, Comida: 0.40, Cena: 0.30 };
      gShares = { Desayuno: 0.20, Almuerzo: 0.10, Comida: 0.40, Cena: 0.30 };
    } else if (hasDesayuno && hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 0.15, Comida: 0.375, Merienda: 0.10, Cena: 0.375 };
      hcShares = { Desayuno: 0.22, Comida: 0.40, Merienda: 0.12, Cena: 0.26 };
      gShares = { Desayuno: 0.20, Comida: 0.35, Merienda: 0.15, Cena: 0.30 };
    } else if (hasDesayuno && !hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 0.20, Comida: 0.42, Cena: 0.38 };
      hcShares = { Desayuno: 0.25, Comida: 0.40, Cena: 0.35 };
      gShares = { Desayuno: 0.22, Comida: 0.40, Cena: 0.38 };
    } else if (!hasDesayuno && !hasMerienda && hasComida && hasCena) {
      pShares = { Comida: 0.50, Cena: 0.50 };
      hcShares = { Comida: 0.50, Cena: 0.50 };
      gShares = { Comida: 0.50, Cena: 0.50 };
    } else {
      const share = 1.0 / mealNames.length;
      mealNames.forEach((n) => {
        pShares[n] = share;
        hcShares[n] = share;
        gShares[n] = share;
      });
    }
  }

  const findKey = (name) => {
    const low = String(name || '').toLowerCase();
    if (low.includes('post')) return 'Post';
    if (low.includes('merienda')) return 'Merienda';
    if (low.includes('desayuno')) return 'Desayuno';
    if (low.includes('almuerzo')) return 'Almuerzo';
    if (low.includes('comida')) return 'Comida';
    if (low.includes('cena')) return 'Cena';
    return name;
  };

  const fixedTotals = Array.from(fixedMacrosByMeal.values()).reduce((totals, value) => ({
    kcal: totals.kcal + value.kcal,
    p: totals.p + value.p,
    hc: totals.hc + value.hc,
    g: totals.g + value.g,
  }), { kcal: 0, p: 0, hc: 0, g: 0 });

  const remaining = {
    p: Math.max(0, proteina - fixedTotals.p),
    hc: Math.max(0, hidratos - fixedTotals.hc),
    g: Math.max(0, grasa - fixedTotals.g),
  };

  const eligibleIngestas = ingestas.filter((ing) => !fixedOnlyMealNames.has(ing.nombre));
  const eligibleNames = eligibleIngestas.map((ing) => ing.nombre);
  // Las cuotas mantienen la jerarquía del patrón original, pero se
  // renormalizan únicamente entre las ingestas que sí pueden calibrarse.
  const shareWeight = (shares, name) => {
    const value = Number(shares[findKey(name)] ?? shares[name]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };
  const normalizedShare = (shares, name) => {
    if (eligibleNames.length === 0) return 0;
    const total = eligibleNames.reduce((sum, eligibleName) => sum + shareWeight(shares, eligibleName), 0);
    return total > 0 ? shareWeight(shares, name) / total : 1 / eligibleNames.length;
  };

  const budgets = {};
  const assigned = { p: 0, hc: 0, g: 0 };
  eligibleIngestas.forEach((ing, index) => {
    const isLastEligible = index === eligibleIngestas.length - 1;
    const shareP = normalizedShare(pShares, ing.nombre);
    const shareHC = normalizedShare(hcShares, ing.nombre);
    const shareG = normalizedShare(gShares, ing.nombre);
    const variableP = isLastEligible ? remaining.p - assigned.p : Math.round(remaining.p * shareP);
    const variableHC = isLastEligible ? remaining.hc - assigned.hc : Math.round(remaining.hc * shareHC);
    const variableG = isLastEligible ? remaining.g - assigned.g : Math.round(remaining.g * shareG);
    const fixed = fixedMacrosByMeal.get(ing.nombre) || { p: 0, hc: 0, g: 0 };
    const mP = Math.max(0, variableP + fixed.p);
    const mHC = Math.max(0, variableHC + fixed.hc);
    const mG = Math.max(0, variableG + fixed.g);

    budgets[ing.nombre] = {
      kcal: Math.round(mP * 4 + mHC * 4 + mG * 9),
      p: mP,
      hc: mHC,
      g: mG,
    };
    assigned.p += variableP;
    assigned.hc += variableHC;
    assigned.g += variableG;
  });

  fixedOnlyMealNames.forEach((mealName) => {
    const fixed = fixedMacrosByMeal.get(mealName) || { kcal: 0, p: 0, hc: 0, g: 0 };
    budgets[mealName] = {
      kcal: Math.round(fixed.p * 4 + fixed.hc * 4 + fixed.g * 9),
      p: fixed.p,
      hc: fixed.hc,
      g: fixed.g,
    };
  });

  return ingestas.map((ing) => ({
    nombre: ing.nombre,
    target: budgets[ing.nombre] || {
      kcal: Math.round(kcal / ingestas.length),
      p: Math.round(proteina / ingestas.length),
      hc: Math.round(hidratos / ingestas.length),
      g: Math.round(grasa / ingestas.length),
    },
  }));
}

// El primer recurso es compensar gramos. Solo si el día sigue fuera de estas tolerancias se vuelve a
// generar con otra selección de alimentos (hasta DAY_MAX_ATTEMPTS intentos), como último recurso.
const DAY_MAX_ATTEMPTS = 15;
const DAY_TOLERANCE = { kcal: 60, proteina: 4, hidratos: 12, grasa: 8 };

function isDayWithinTolerance(deviation) {
  return Math.abs(deviation.kcal) <= DAY_TOLERANCE.kcal
    && Math.abs(deviation.proteina) <= DAY_TOLERANCE.proteina
    && Math.abs(deviation.hidratos) <= DAY_TOLERANCE.hidratos
    && Math.abs(deviation.grasa) <= DAY_TOLERANCE.grasa;
}

// Coste de un día (menor es mejor): error en kcal de cada macro, con la proteína más ponderada.
function dayDeviationCost(deviation) {
  if (!deviation) return Number.POSITIVE_INFINITY;
  const eP = 4 * deviation.proteina;
  const eC = 4 * deviation.hidratos;
  const eG = 9 * deviation.grasa;
  const eK = eP + eC + eG;
  return 2 * eP * eP + eC * eC + eG * eG + 0.5 * eK * eK;
}

// Límites de la compensación entre tomas: cada toma puede variar su parte variable ±30 %.
const CASCADE_RATIO_MIN = 0.7;
const CASCADE_RATIO_MAX = 1.3;

/**
 * Compensación en cascada: el objetivo de una toma se ajusta con lo que se ha desviado el día
 * hasta ese punto. Lo consumido por las tomas ya calculadas se descuenta del día y el resto
 * (menos los componentes fijos) se reparte entre la toma actual y las pendientes en proporción
 * a su presupuesto original. Los componentes fijos nunca se modifican.
 */
export function adaptTargetToDay({ target, meal, pendingMeals, budgetFor, dayData, consumed }) {
  const fixedOf = (m) => ({ p: Number(m?.fixedMacros?.p) || 0, hc: Number(m?.fixedMacros?.hc) || 0, g: Number(m?.fixedMacros?.g) || 0 });
  const group = [meal, ...pendingMeals];
  const day = { p: Number(dayData.proteina), hc: Number(dayData.hidratos), g: Number(dayData.grasa) };
  const fixedMeal = fixedOf(meal);
  const adapted = {};
  for (const macro of ['p', 'hc', 'g']) {
    const fixedGroup = group.reduce((sum, m) => sum + fixedOf(m)[macro], 0);
    const variablePot = group.reduce((sum, m) => sum + Math.max(0, (budgetFor(m)?.[macro] || 0) - fixedOf(m)[macro]), 0);
    const leftover = day[macro] - consumed[macro] - fixedGroup;
    const variableCurrent = Math.max(0, target[macro] - fixedMeal[macro]);
    const ratio = variablePot > 0
      ? Math.min(CASCADE_RATIO_MAX, Math.max(CASCADE_RATIO_MIN, leftover / variablePot))
      : 1;
    adapted[macro] = Math.max(fixedMeal[macro], Math.round(fixedMeal[macro] + variableCurrent * ratio));
  }
  adapted.kcal = Math.round(adapted.p * 4 + adapted.hc * 4 + adapted.g * 9);
  return adapted;
}

/**
 * Genera un día con `generateDay` y, si queda fuera de tolerancia, lo repite (con la memoria de variedad y los
 * avisos restaurados) hasta DAY_MAX_ATTEMPTS veces. Devuelve el mejor intento y deja el tracker y los avisos en el
 * estado de ese intento.
 */
export async function generateBestDay({ generateDay, tracker, avisos }) {
  const startSnapshot = tracker?.snapshot();
  const avisosStart = avisos.length;
  let best = null;
  for (let attempt = 0; attempt < DAY_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      tracker?.restore(startSnapshot);
      avisos.length = avisosStart;
    }
    const day = await generateDay();
    const cost = dayDeviationCost(day.desviacionMacros);
    if (!best || cost < best.cost) {
      best = { day, cost, endSnapshot: tracker?.snapshot(), avisos: avisos.slice(avisosStart) };
    }
    if (!day.desviacionMacros || isDayWithinTolerance(day.desviacionMacros)) break;
  }
  tracker?.restore(best.endSnapshot);
  avisos.length = avisosStart;
  avisos.push(...best.avisos);
  return best.day;
}
