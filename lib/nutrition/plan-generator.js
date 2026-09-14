import { getSupabaseAdmin } from '@/lib/supabase/server';
import { buildBasePlanData } from '@/lib/nutrition/plan-card';
import { getLatestMenu } from '@/repositories/menuRepository';
import { calibrateMeal, findFoodInCatalog } from '@/lib/nutrition/calculator';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import {
  findTreeNode,
  resolveDishIngredientsForPlayer,
  resolveNodeForPlayer,
  resolveMealTreeForDay,
} from '@/lib/nutrition/food-tree';


export function calculateMealBudgets(day) {
  const { kcal, proteina, hidratos, grasa, ingestas } = day;
  if (!ingestas || ingestas.length === 0) return [];

  if (!kcal || !proteina || !hidratos || !grasa) {
    throw new Error(`Datos nutricionales incompletos para el dia: kcal=${kcal}, proteina=${proteina}, hidratos=${hidratos}, grasa=${grasa}`);
  }

  const mealNames = ingestas.map((i) => i.nombre);
  const postMealName = mealNames.find((n) => n.toLowerCase().includes('post'));
  const hasPost = Boolean(postMealName);
  const hasMerienda = mealNames.some((n) => n.toLowerCase().includes('merienda'));
  const hasDesayuno = mealNames.some((n) => n.toLowerCase().includes('desayuno'));
  const hasComida = mealNames.some((n) => n.toLowerCase().includes('comida') || n.toLowerCase().includes('almuerzo'));
  const hasCena = mealNames.some((n) => n.toLowerCase().includes('cena'));

  // Porcentajes y cuotas de reparto de macronutrientes según la estructura exacta de tomas
  let pShares = {};
  let hcShares = {};
  let gShares = {};

  const POST_FIXED_PROTEIN = 20; // 20g fijos de proteína siempre para post-entreno y post-partido
  const postP = hasPost ? Math.min(POST_FIXED_PROTEIN, proteina) : 0;
  const remainingP = hasPost ? Math.max(0, proteina - postP) : proteina;

  if (hasPost) {
    if (hasDesayuno && hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 10 / 90, Comida: 35 / 90, Merienda: 10 / 90, Cena: 35 / 90 };
      hcShares = { Desayuno: 0.20, Comida: 0.35, Merienda: 0.15, Cena: 0.30 };
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
      const others = mealNames.filter((n) => !n.toLowerCase().includes('post'));
      const share = 1.0 / (others.length || 1);
      others.forEach((n) => {
        pShares[n] = share;
        hcShares[n] = share;
        gShares[n] = share;
      });
    }
  } else {
    if (hasDesayuno && hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 0.15, Comida: 0.375, Merienda: 0.10, Cena: 0.375 };
      hcShares = { Desayuno: 0.22, Comida: 0.36, Merienda: 0.16, Cena: 0.26 };
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
    const low = name.toLowerCase();
    if (low.includes('post')) return 'Post';
    if (low.includes('merienda')) return 'Merienda';
    if (low.includes('desayuno')) return 'Desayuno';
    if (low.includes('comida') || low.includes('almuerzo')) return 'Comida';
    if (low.includes('cena')) return 'Cena';
    return name;
  };

  const budgets = {};
  let accP = 0;
  let accHC = 0;
  let accG = 0;
  let accKcal = 0;

  if (hasPost && postMealName) {
    const postKcal = postP * 4;
    budgets[postMealName] = { kcal: postKcal, p: postP, hc: 0, g: 0 };
    budgets['Post-entreno'] = budgets[postMealName];
    budgets['Post-partido'] = budgets[postMealName];
    accP += postP;
    accKcal += postKcal;
  }

  const cenaMealName = mealNames.find((n) => n.toLowerCase().includes('cena')) || mealNames[mealNames.length - 1];

  for (const ing of ingestas) {
    if (ing.nombre === cenaMealName) continue;
    if (hasPost && ing.nombre === postMealName) continue;

    const key = findKey(ing.nombre);
    const pFrac = pShares[key] ?? (1 / ingestas.length);
    const hcFrac = hcShares[key] ?? (1 / ingestas.length);
    const gFrac = gShares[key] ?? (1 / ingestas.length);

    const mP = Math.round(remainingP * pFrac);
    const mHC = Math.round(hidratos * hcFrac);
    const mG = Math.round(grasa * gFrac);
    const mKcal = Math.round(mP * 4 + mHC * 4 + mG * 9);

    budgets[ing.nombre] = { kcal: mKcal, p: mP, hc: mHC, g: mG };
    accP += mP;
    accHC += mHC;
    accG += mG;
    accKcal += mKcal;
  }

  const remP = Math.max(0, proteina - accP);
  const remHC = Math.max(0, hidratos - accHC);
  const remG = Math.max(0, grasa - accG);
  const remKcal = Math.max(0, kcal - accKcal);

  budgets[cenaMealName] = { kcal: remKcal, p: remP, hc: remHC, g: remG };

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

/**
 * Parsea alimentos o combinaciones a partir del texto de un plato delegando en el Árbol Nutricional
 * y el catálogo clínico del jugador, garantizando nombres canónicos limpios.
 */
export function parseFoodsFromText(text, catalog, _player = null) {
  if (!text || typeof text !== 'string' || !text.trim()) return [];
  const raw = text.trim();
  const low = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (low.includes('descanso') || low.includes('partido')) return [];

  const foods = [];

  // Suplementación y protocolos específicos
  if (low.includes('ensure')) foods.push('Ensure Nutrición Entera 1 unidad');
  if (low.includes('recovery')) foods.push('Recovery y fruta');

  // Separar alimentos por delimitadores estándar (+, ,, /)
  const parts = raw
    .replace(/\+/g, ',')
    .replace(/\//g, ',')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    const node = findTreeNode(part);
    if (node) {
      const resolved = resolveNodeForPlayer(node.id, catalog);
      if (resolved) {
        foods.push(resolved);
        continue;
      }
    }
    const food = findFoodInCatalog(part, { clinicalCatalog: catalog });
    if (food) {
      foods.push(food.name);
      continue;
    }
    const partLow = part.toLowerCase();
    if (partLow.includes('aove') || partLow.includes('aceite')) {
      foods.push('AOVE');
    }
  }

  return Array.from(new Set(foods.filter(Boolean)));
}

/**
 * Selecciona y resuelve platos del buffet del comedor escolar/deportivo adaptados al perfil del jugador
 */
export function selectBuffetMealDishes(mealData, clinicalCatalog) {
  if (!mealData) return null;
  const rawCombined = `${mealData.primero || ''} ${mealData.segundo || ''}`.toLowerCase();
  if (rawCombined.includes('descanso') || rawCombined.includes('partido')) return null;

  if (Array.isArray(mealData.platos_desglosados) && mealData.platos_desglosados.length > 0) {
    const safeDishes = [];
    for (const d of mealData.platos_desglosados) {
      const res = resolveDishIngredientsForPlayer(d, clinicalCatalog);
      if (res.safe && res.items.length > 0) {
        safeDishes.push({ dish: d, items: res.items });
      }
    }

    if (safeDishes.length > 0) {
      const carbDish = safeDishes.find((sd) => sd.dish.hidrato);
      const proteinDish = safeDishes.find((sd) => sd.dish.proteina?.length > 0 && sd !== carbDish);
      const dessertDish = safeDishes.find((sd) => (sd.dish.fruta?.length > 0 || sd.dish.lacteo?.length > 0) && sd !== carbDish && sd !== proteinDish);

      const combinedItems = [];
      if (carbDish) combinedItems.push(...carbDish.items);
      if (proteinDish) {
        combinedItems.push(...proteinDish.items);
      } else if (!carbDish && safeDishes[0]) {
        combinedItems.push(...safeDishes[0].items);
      }
      if (dessertDish) {
        combinedItems.push(...dessertDish.items);
      }

      if (combinedItems.length > 0) {
        if ((carbDish || proteinDish) && !combinedItems.some((it) => it.toLowerCase().includes('aceite') || it.toLowerCase().includes('aove'))) {
          combinedItems.push('AOVE');
        }
        return Array.from(new Set(combinedItems)).join(', ');
      }
    }
  }

  const combinedText = `${mealData.primero || ''} ${mealData.segundo || ''}`;
  const parsed = parseFoodsFromText(combinedText, clinicalCatalog);
  if (parsed.length > 0) {
    if (!parsed.some((it) => it.toLowerCase().includes('aceite') || it.toLowerCase().includes('aove'))) {
      parsed.push('AOVE');
    }
    return parsed.join(', ');
  }

  return null;
}

/**
 * Generador Nutricional Semanal 100% Determinista (Sin IA y Sin Platos por Defecto).
 * - Mapea rigurosamente el Árbol Taxonómico desde conceptos genéricos hasta cortes concretos.
 * - Si falta una configuración o un plato no se reconoce, NO inventa platos: muestra el fallo claramente.
 */
export async function generateDeterministicWeeklyPlan({
  jugador,
  baseData,
  menu,
  preMatchConfig,
}) {
  const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
  const activeTagsSet = new Set(clinicalCatalog.activeTags);
  const hasFodmapDigestiveRestriction =
    activeTagsSet.has('sibo_low_fodmap') ||
    activeTagsSet.has('sibo_hidrogeno') ||
    activeTagsSet.has('sibo_metano_imo') ||
    activeTagsSet.has('sibo_mixto') ||
    activeTagsSet.has('sibo_sulfuro') ||
    activeTagsSet.has('colon_irritable');
  const isLactoseIntolerant = activeTagsSet.has('sin_lactosa') || hasFodmapDigestiveRestriction;
  const isGlutenIntolerant = activeTagsSet.has('sin_gluten') || hasFodmapDigestiveRestriction;
  const isFishIntolerant = activeTagsSet.has('sin_pescado') || activeTagsSet.has('sin_marisco');
  const isPorkIntolerant = activeTagsSet.has('sin_cerdo');
  const hasCowProteinAllergy = activeTagsSet.has('sin_proteina_vaca');
  const hasFructoseIntolerance = activeTagsSet.has('sin_fructosa');
  const hasIbs = activeTagsSet.has('colon_irritable');
  const isVegan = activeTagsSet.has('vegano');

  const calOptions = {
    isLactoseIntolerant,
    isGlutenIntolerant,
    isFishIntolerant,
    isPorkIntolerant,
    hasCowProteinAllergy,
    hasFructoseIntolerance,
    hasIbs,
    isVegan,
    clinicalCatalog,
  };

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const finalDias = { ...baseData.dias };

  for (let dayIdx = 0; dayIdx < daysOfWeek.length; dayIdx++) {
    const dayKey = daysOfWeek[dayIdx];
    const dayData = baseData.dias[dayKey];
    if (!dayData?.ingestas || !Array.isArray(dayData.ingestas)) continue;

    const nextDayKey = daysOfWeek[(dayIdx + 1) % 7];
    const matchDayKeys = Object.keys(preMatchConfig?.partidos || {}).filter((k) => preMatchConfig?.partidos?.[k]?.horario);
    const isNextDayMatch = Boolean(
      (nextDayKey && baseData.dias[nextDayKey]?.tipoDia === 'partido') ||
      (nextDayKey && matchDayKeys.includes(nextDayKey))
    );
    const isMatchDay = dayData.tipoDia === 'partido';
    const isPrevToMatch = isNextDayMatch;

    const matchKey = isMatchDay ? dayKey : (isPrevToMatch ? nextDayKey : null);
    const horario = matchKey ? preMatchConfig?.partidos?.[matchKey]?.horario : null;
    const playerPreMatch = horario ? (jugador?.config_prepartido?.[horario] || {}) : {};

    const normDay = dayKey.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const dayMenu = menu?.dias?.find((d) => {
      const dStr = String(d.dia || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return dStr.includes(normDay) || normDay.includes(dStr);
    });

    const budgets = calculateMealBudgets(dayData);
    const budgetMap = new Map(budgets.map((b) => [b.nombre.toLowerCase().trim(), b.target]));
    const calOptionsForDay = { ...calOptions, isMatchDay };

    const calibratedIngestas = [];

    for (const ing of dayData.ingestas) {
      const mealName = ing.nombre;
      const normMeal = mealName.toLowerCase().trim();
      const target = budgetMap.get(normMeal);

      let rawStr = '';

      // 1. Post-entreno / Post-partido
      if (normMeal.includes('post')) {
        if (isMatchDay || normMeal.includes('partido')) {
          rawStr = 'Recovery y fruta';
        } else if (hasCowProteinAllergy || isVegan) {
          rawStr = 'Batido de proteína vegetal 30g disuelto en agua';
        } else if (isLactoseIntolerant) {
          rawStr = 'Batido de proteína sin lactosa 30g disuelto en agua';
        } else {
          rawStr = 'Batido de proteína 30g disuelto en agua';
        }
      }
      // 2. Cena de carga pre-partido (24h previas)
      else if (isPrevToMatch && (normMeal.includes('cena') || (!dayData.ingestas.some((i) => i.nombre.toLowerCase().includes('cena')) && ing === dayData.ingestas[dayData.ingestas.length - 1]))) {
        const pautaCarga = playerPreMatch.dia_anterior || playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena;
        rawStr = resolveMealTreeForDay(pautaCarga, dayIdx, mealName, clinicalCatalog, jugador, true);
      }
      // 3. Día de partido (protocolo pre-partido)
      else if (isMatchDay) {
        const pautaMatch = playerPreMatch.recomendaciones?.[mealName] || playerPreMatch.recomendaciones?.[mealName.toLowerCase()];
        rawStr = resolveMealTreeForDay(pautaMatch, dayIdx, mealName, clinicalCatalog, jugador, true);
      }
      // 4. Comida o Cena habitual (revisar buffet de comedor primero)
      else if (normMeal.includes('comida') || normMeal.includes('almuerzo') || normMeal.includes('cena')) {
        const isLunch = normMeal.includes('comida') || normMeal.includes('almuerzo');
        const mealService = isLunch ? dayMenu?.comida : dayMenu?.cena;
        const buffetOption = selectBuffetMealDishes(mealService, clinicalCatalog);

        if (buffetOption) {
          rawStr = buffetOption;
        } else {
          const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
          rawStr = resolveMealTreeForDay(pautaDefecto, dayIdx, mealName, clinicalCatalog, jugador, false);
        }
      }
      // 5. Desayunos, Meriendas o colaciones habituales
      else {
        const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
        rawStr = resolveMealTreeForDay(pautaDefecto, dayIdx, mealName, clinicalCatalog, jugador, false);
      }

      const isAlert = rawStr.startsWith('[');
      const calibrated = (!isAlert && target)
        ? await calibrateMeal(rawStr, target, { ...calOptionsForDay, mealName, dayIndex: dayIdx })
        : rawStr;

      calibratedIngestas.push({
        ...ing,
        detalle: calibrated,
      });
    }

    finalDias[dayKey] = {
      ...dayData,
      ingestas: calibratedIngestas,
    };
  }

  return finalDias;
}

/**
 * Genera los datos completos del plan nutricional semanal de forma determinista,
 * utilizando el Árbol Taxonómico de Alimentos y la Calculadora Matemática.
 */
export async function generarDatosPlan({
  jugador,
  nombre,
  contexto,
  contextoAdicional,
  calendario,
  menu,
  teamConfig,
  recomendacionesIngestas,
  preMatchConfig,
}) {
  const supabase = getSupabaseAdmin();
  const resolvedMenu = menu !== undefined ? menu : await getLatestMenu(supabase, jugador?.equipo_id);
  const baseData = buildBasePlanData({
    jugador,
    nombre,
    contexto: contexto || 'semana_normal',
    contextoAdicional,
    menu: resolvedMenu,
    calendario,
    preMatchConfig,
    teamConfig,
  });

  const finalDias = await generateDeterministicWeeklyPlan({
    jugador,
    baseData,
    menu: resolvedMenu,
    preMatchConfig,
  });

  const finalNotas = [
    'Ajusta la hidratación según la intensidad de la sesión y la sudoración.',
    'Respeta los gramajes en crudo indicados para cada comida.',
    'Toma el batido post-entreno en los primeros 30 minutos tras finalizar la sesión.',
    'Mantén las pautas de descanso nocturno y digestión adecuada.',
  ];

  return {
    ...baseData,
    dias: finalDias,
    notas: finalNotas,
    meta: {
      ...baseData.meta,
      nombre,
      contexto: contexto || 'semana_normal',
      contextoAdicional,
      recomendacionesIngestas: recomendacionesIngestas || {},
      preMatchConfig: preMatchConfig || null,
      engine: 'deterministic_food_tree',
    },
  };
}
