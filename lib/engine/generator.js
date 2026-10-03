import { buildBasePlanData } from './plan-card.js';
import { calibrateMeal, refineDayMacros, buildMealOutput } from './calculator.js';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import { isMainMeal as checkIsMainMeal, isPreMatchPreviousDayMeal, isPreMatchMatchDayMeal } from '@/config/nutrition-days';
import { WeeklyVarietyTracker } from './variety-tracker.js';
import { mealPatternSchema } from '@/validations/mealAstSchema';
import { evaluateMealAst, extractPlannedBranchesFromAst } from './meal-ast.js';
import {
  buildPlayerFoodTree,
  extractPlannedCarbAndProtein,
  canResolveNodeForPlayer,
  createFoodItemFromName,
  getFullFoodTree,
  CANONICAL_PROTEIN_BRANCHES,
  CANONICAL_CARB_BRANCHES,
} from './food-tree.js';
import { normalizeFoodName } from '@/data/foods-crudo';
import { calculateMealBudgets, adaptTargetToDay, generateBestDay } from './day-balance.js';
import { selectBuffetMealDishes, resolveMenuOptionsTree } from './menu-selection.js';
import { plannedBuffetDinner } from './variety-planning.js';
import { ensureMainMealFat, prepareFixedMealItems } from './meal-items.js';

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
  avisos = [],
}) {
  // Referencias de las pautas del jugador que no se le pueden servir: se informan en el plan.
  // (En los menús de comedor, omitir ingredientes no aptos es el filtrado esperado y no se avisa.)
  const reportUnresolved = (dayKey, mealName) => (foodName, substituteName = null) => {
    // Un alimento concreto se juzga por el catálogo clínico del jugador; una rama, por si tiene opciones aptas.
    const isCatalogFood = Boolean(createFoodItemFromName(foodName, null, getFullFoodTree()));
    const isClinicallyAllowed = isCatalogFood
      ? clinicalCatalog.foodsByNormalizedName.has(normalizeFoodName(foodName))
      : canResolveNodeForPlayer(foodName, clinicalCatalog, playerFoodTree);
    const reason = isClinicallyAllowed
      ? 'no se sirve en este tipo de toma'
      : 'no está en el catálogo del jugador para este plan (restricciones clínicas, aversiones o lo que hay en el menú de comedor)';
    const mensaje = substituteName
      ? `"${foodName}" ${reason}; se ha sustituido por ${substituteName}.`
      : `"${foodName}" ${reason} y se ha omitido.`;
    const exists = avisos.some((a) => a.dia === dayKey && a.ingesta === mealName && a.mensaje === mensaje);
    if (!exists) avisos.push({ dia: dayKey, ingesta: mealName, mensaje });
  };
  const hasMenu = Boolean(
    menu && (
      (Array.isArray(menu.dias) && menu.dias.length > 0) ||
      menu.comida ||
      menu.cena
    )
  );
  const clinicalCatalog = getClinicalCatalogForPlayer(jugador, { useMenuCatalog: hasMenu });
  const playerFoodTree = buildPlayerFoodTree(clinicalCatalog);
  const activeTagsSet = new Set(clinicalCatalog.activeTags);
  const hasFodmapDigestiveRestriction =
    activeTagsSet.has('sibo_low_fodmap') ||
    activeTagsSet.has('sibo_hidrogeno') ||
    activeTagsSet.has('sibo_metano_imo') ||
    activeTagsSet.has('sibo_mixto') ||
    activeTagsSet.has('sibo_sulfuro') ||
    activeTagsSet.has('colon_irritable');
  const isLactoseIntolerant = activeTagsSet.has('sin_lactosa') || hasFodmapDigestiveRestriction;
  const hasCowProteinAllergy = activeTagsSet.has('sin_proteina_vaca');
  const isVegan = activeTagsSet.has('vegano');
  const isVegetarian = activeTagsSet.has('vegetariano');

  const tracker = new WeeklyVarietyTracker(jugador, {
    proteinBranches: CANONICAL_PROTEIN_BRANCHES,
    carbBranches: CANONICAL_CARB_BRANCHES,
  });
  const calOptions = {
    isLactoseIntolerant,
    hasCowProteinAllergy,
    isVegan,
    isVegetarian,
    clinicalCatalog,
    player: jugador,
    playerFoodTree,
    tracker,
  };

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const finalDias = { ...baseData.dias };
  const weeklyTrees = {};
  const dayContexts = {};
  const wrapMealValue = (value, { dayKey, mealName } = {}) => {
    const mealValue = value || { type: 'complete', label: 'Rotación variada', unrecognized: [] };
    const parsed = mealPatternSchema.safeParse(mealValue);
    if (!parsed.success) {
      // Pauta guardada con un formato no válido: se avisa y la toma cae a rotación variada.
      avisos.push({ dia: dayKey, ingesta: mealName, mensaje: 'La pauta guardada no es válida; se ha usado rotación variada. Revísala en el perfil del jugador.' });
    }
    const normalizedMeal = parsed.success
      ? parsed.data
      : { type: 'complete', raw: mealValue.raw || '', label: 'Rotación variada', unrecognized: [] };
    const isMainMeal = (value && typeof value === 'object' && value.isMainMeal !== undefined)
      ? Boolean(value.isMainMeal)
      : null;
    return {
      kind: normalizedMeal.type === 'complete' ? 'meal-complete' : 'meal-ast',
      value: normalizedMeal,
      isMainMeal,
    };
  };

  for (let dayIdx = 0; dayIdx < daysOfWeek.length; dayIdx++) {
    const dayKey = daysOfWeek[dayIdx];
    const dayData = baseData.dias[dayKey];
    if (!dayData?.ingestas || !Array.isArray(dayData.ingestas)) continue;

    const nextDayKey = daysOfWeek[(dayIdx + 1) % 7];
    const matchProtocolEnabled = preMatchConfig?.enabled === true;
    const matchDayKeys = matchProtocolEnabled
      ? Object.keys(preMatchConfig?.partidos || {}).filter((k) => preMatchConfig?.partidos?.[k]?.horario)
      : [];
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

    const calOptionsForDay = { ...calOptions, isMatchDay };
    const isPost = (mealName) => String(mealName || '').toLowerCase().includes('post');

    dayContexts[dayKey] = { dayData, calOptionsForDay };
    weeklyTrees[dayKey] = {};
    for (const ing of dayData.ingestas) {
      const mealName = ing?.nombre || '';
      const normMeal = String(mealName).toLowerCase().trim();
      let tree = null;

      // 1. Post-entreno / Post-partido
      if (isPost(mealName)) {
        if (isMatchDay || normMeal.includes('partido')) {
          tree = { kind: 'fixed', value: 'Recovery y fruta' };
        } else if (hasCowProteinAllergy || isVegan) {
          tree = { kind: 'fixed', value: 'Batido de proteína vegetal 30g disuelto en agua' };
        } else if (isLactoseIntolerant) {
          tree = { kind: 'fixed', value: 'Batido de proteína sin lactosa 30g disuelto en agua' };
        } else {
          tree = { kind: 'fixed', value: 'Batido de proteína 30g disuelto en agua' };
        }
      }
      // 2. Víspera de partido (Carga 24h previas): solo ingestas que correspondan a la víspera (ej: Merienda, Cena)
      else if (isPrevToMatch && isPreMatchPreviousDayMeal(horario, mealName)) {
        const pauta24h = playerPreMatch.recomendaciones?.[mealName]
          || playerPreMatch.recomendaciones?.[mealName.toLowerCase()]
          || (normMeal.includes('cena') ? (playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena) : null);
        if (pauta24h) {
          tree = wrapMealValue(pauta24h, { dayKey, mealName });
        }
      }
      // 3. Día de partido (protocolo pre-partido): solo ingestas que correspondan al día de partido
      else if (isMatchDay && matchProtocolEnabled && !isPost(mealName)) {
        const pautaMatch = playerPreMatch.recomendaciones?.[mealName]
          || playerPreMatch.recomendaciones?.[mealName.toLowerCase()];
        // Las tomas previas al partido usan siempre su pauta. Una toma posterior al partido (p. ej. la comida
        // tras un partido de mañana) usa la pauta del protocolo si el jugador la ha definido para ella,
        // salvo las de la víspera, que comparten nombre pero son de otro día.
        const isCoveredByProtocol = isPreMatchMatchDayMeal(horario, mealName)
          || (Boolean(pautaMatch) && !isPreMatchPreviousDayMeal(horario, mealName));
        if (pautaMatch && isCoveredByProtocol) {
          tree = wrapMealValue(pautaMatch, { dayKey, mealName });
        }
      }
      if (!tree) {
        // 4. Comida o Cena habitual (revisar buffet de comedor primero)
        if (normMeal.includes('comida') || normMeal.includes('cena')) {
          const isLunch = normMeal.includes('comida');
          const mealService = isLunch ? dayMenu?.comida : dayMenu?.cena;
          const buffetOption = selectBuffetMealDishes(mealService, clinicalCatalog, jugador, mealName, playerFoodTree);

          if (buffetOption) {
            tree = buffetOption;
          } else {
            const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
            tree = wrapMealValue(pautaDefecto, { dayKey, mealName });
          }
        } else {
          // 5. Desayunos, Meriendas o colaciones habituales
          const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
          tree = wrapMealValue(pautaDefecto, { dayKey, mealName });
        }
      }
      weeklyTrees[dayKey][normMeal] = tree;
    }
  }

  for (let dayIdx = 0; dayIdx < daysOfWeek.length; dayIdx++) {
    const dayKey = daysOfWeek[dayIdx];
    const { dayData, calOptionsForDay } = dayContexts[dayKey];

    const generateDay = async () => {
    // Iniciar nuevo día en el tracker de variedad semanal
    tracker?.startNewDay(dayKey);

    // Inspeccionar la cena planificada para anticipar colisiones desde la comida
    const cenaIngesta = dayData.ingestas.find((i) => String(i?.nombre || '').toLowerCase().includes('cena'));
    if (cenaIngesta && cenaIngesta.nombre) {
      const cenaTree = weeklyTrees[dayKey]?.[String(cenaIngesta.nombre).toLowerCase().trim()];
      const plannedDinner = cenaTree?.value?.tree
        ? extractPlannedBranchesFromAst(cenaTree.value, clinicalCatalog)
        : plannedBuffetDinner(cenaTree, clinicalCatalog);
      tracker?.setTodayPlannedDinner(plannedDinner);
    }

    const resolvedMeals = [];
    for (const ing of dayData.ingestas) {
      const mealName = ing?.nombre || '';
      const normMeal = String(mealName).toLowerCase().trim();
      const tree = weeklyTrees[dayKey][normMeal];
      const isLunch = normMeal.includes('comida');
      const isCena = normMeal.includes('cena');
      const isMainMeal = tree?.isMainMeal !== null && tree?.isMainMeal !== undefined
        ? Boolean(tree.isMainMeal)
        : (tree?.value?.isMainMeal !== undefined ? Boolean(tree.value.isMainMeal) : checkIsMainMeal(mealName));

      const isBuffetTree = tree?.kind === 'menu-options';
      const resolvedTree = isBuffetTree
        ? resolveMenuOptionsTree(tree, tracker, clinicalCatalog, isCena)
        : tree?.value;
      let rawResult;
      if (tree?.kind === 'fixed') {
        rawResult = tree.value;
      } else if (isBuffetTree) {
        rawResult = resolvedTree
          ? evaluateMealAst(resolvedTree, {
            player: jugador,
            clinicalCatalog,
            tracker,
            playerFoodTree,
            mealName,
            isMainMeal,
            isDinner: isCena,
          })
          : `[Sin opción apta para ${mealName}]`;
      } else if (tree?.kind === 'meal-ast' || tree?.kind === 'meal-complete') {
        rawResult = evaluateMealAst(tree.value, {
          markExplicit: tree.kind === 'meal-ast',
          player: jugador,
          clinicalCatalog,
          tracker,
          playerFoodTree,
          mealName,
          isMainMeal,
          isDinner: isCena,
          onUnresolved: reportUnresolved(dayKey, mealName),
        });
      } else {
        throw new Error(`Formato AST no reconocido para ${mealName}`);
      }

      // Si es el almuerzo, registrar la proteína e hidrato consumidos para que la cena no los repita
      if (isLunch && rawResult) {
        const lunchInfo = extractPlannedCarbAndProtein(rawResult, clinicalCatalog);
        tracker?.setTodayLunch(lunchInfo);
        const pBranches = lunchInfo.proteinBranches?.length ? lunchInfo.proteinBranches : (lunchInfo.proteinBranch ? [lunchInfo.proteinBranch] : []);
        pBranches.forEach((pb) => tracker?.recordProtein(null, pb));
        if (lunchInfo.proteinFood) tracker?.recordProtein(lunchInfo.proteinFood);

        const cBranches = lunchInfo.carbBranches?.length ? lunchInfo.carbBranches : (lunchInfo.carbBranch ? [lunchInfo.carbBranch] : []);
        cBranches.forEach((cb) => tracker?.recordCarb(null, cb));
        if (lunchInfo.carbFood) tracker?.recordCarb(lunchInfo.carbFood);
      }

      rawResult = ensureMainMealFat(rawResult, isMainMeal, clinicalCatalog, playerFoodTree);
      const prepared = prepareFixedMealItems(rawResult, isMainMeal);
      const isPostFixed = tree?.kind === 'fixed';
      if (isPostFixed) {
        const isRecovery = String(tree?.value || '').toLowerCase().includes('recovery');
        if (isRecovery) {
          prepared.fixedMacros = { kcal: 320, p: 20, hc: 60, g: 0, proteina: 20, hidratos: 60, grasa: 0 };
        } else {
          prepared.fixedMacros = { kcal: 80, p: 20, hc: 0, g: 0, proteina: 20, hidratos: 0, grasa: 0 };
        }
        prepared.fixedComponents = 0;
        prepared.fixedOnly = true;
      }

      const rawText = Array.isArray(prepared.rawResult)
        ? prepared.rawResult.map((item) => item.name).filter(Boolean).join(', ')
        : prepared.rawResult;
      const isAlert = typeof rawText === 'string' && rawText.startsWith('[');
      resolvedMeals.push({
        ing,
        tree,
        isMainMeal,
        rawResult: prepared.rawResult,
        rawText,
        isAlert,
        fixedOnly: prepared.fixedOnly,
        fixedComponents: prepared.fixedComponents,
        fixedMacros: prepared.fixedMacros,
      });
    }

    const fixedMeals = Object.fromEntries(
      resolvedMeals
        .filter((meal) => meal.fixedComponents > 0 || meal.fixedOnly)
        .map((meal) => [meal.ing?.nombre || '', meal.fixedMacros])
    );
    const fixedOnlyMeals = resolvedMeals
      .filter((meal) => meal.fixedOnly)
      .map((meal) => meal.ing?.nombre || '');
    const budgets = calculateMealBudgets(dayData, {
      fixedMeals,
      fixedOnlyMeals,
    });
    const budgetMap = new Map(budgets.map((b) => [String(b.nombre || '').toLowerCase().trim(), b.target]));
    const resolvedIngestas = [];
    const budgetFor = (m) => budgetMap.get(String(m?.ing?.nombre || '').toLowerCase().trim());
    const consumed = { p: 0, hc: 0, g: 0 };
    const refinableMeals = [];

    for (const [mealIndex, meal] of resolvedMeals.entries()) {
      let { ing, tree, rawResult, rawText, isAlert, fixedOnly, isMainMeal: mealIsMain, fixedMacros } = meal;
      const normMeal = String(ing?.nombre || '').toLowerCase().trim();
      const target = budgetMap.get(normMeal);
      // Objetivo con el que se calcula la toma: el presupuesto original corregido por el desvío del día.
      const calibrationTarget = target && !fixedOnly
        ? adaptTargetToDay({ target, meal, pendingMeals: resolvedMeals.slice(mealIndex + 1), budgetFor, dayData, consumed })
        : target;
      const isLunch = normMeal.includes('comida');
      const isCena = normMeal.includes('cena');

      // Si es la cena y ya calibramos el almuerzo, verificar si hay colisión con lo que realmente se calibró
      if (isCena && Array.isArray(rawResult)) {
        const cenaInfo = extractPlannedCarbAndProtein(rawResult, clinicalCatalog);
        const collidesCarb = (cenaInfo.carbBranches || []).some((cb) => tracker?.isSameDayCarb(null, cb))
          || (cenaInfo.carbFoods || []).some((cf) => tracker?.isSameDayCarb(cf, null));
        const collidesProtein = (cenaInfo.proteinBranches || []).some((pb) => tracker?.isSameDayProtein(null, pb))
          || (cenaInfo.proteinFoods || []).some((pf) => tracker?.isSameDayProtein(pf, null));

        if (collidesCarb || collidesProtein) {
          if (tree?.kind === 'meal-ast') {
            const reResolved = evaluateMealAst(tree.value, {
              markExplicit: true,
              player: jugador,
              clinicalCatalog,
              tracker,
              playerFoodTree,
              mealName: ing?.nombre,
              isMainMeal: mealIsMain,
              isDinner: true,
            });
            if (Array.isArray(reResolved) && reResolved.length > 0) {
              rawResult = ensureMainMealFat(reResolved, mealIsMain, clinicalCatalog, playerFoodTree);
            }
          }
        }
      }

      const calibrated = (!isAlert && target && (!fixedOnly || Array.isArray(rawResult)))
        ? await calibrateMeal(rawResult, calibrationTarget, {
          ...calOptionsForDay,
          mealName: ing.nombre,
          isMainMeal: mealIsMain,
          dayIndex: dayIdx,
          fixedOnly,
          returnDiagnostics: true,
        })
        : null;

      // Si es el almuerzo y se añadieron cereales secundarios u otros ajustes, actualizar el tracker con los items reales
      if (isLunch && calibrated?.parsedItems) {
        const calibratedLunchInfo = extractPlannedCarbAndProtein(calibrated.parsedItems, clinicalCatalog);
        tracker?.setTodayLunch(calibratedLunchInfo);
        const cBranches = calibratedLunchInfo.carbBranches?.length ? calibratedLunchInfo.carbBranches : (calibratedLunchInfo.carbBranch ? [calibratedLunchInfo.carbBranch] : []);
        cBranches.forEach((cb) => tracker?.recordCarb(null, cb));
        if (calibratedLunchInfo.carbFood) tracker?.recordCarb(calibratedLunchInfo.carbFood);
      }

      const detalle = calibrated?.text ?? rawText;
      const macrosReales = calibrated?.macrosReales || (fixedOnly && fixedMacros ? fixedMacros : null);

      const objetivo = target
        ? { kcal: target.kcal, proteina: target.p, hidratos: target.hc, grasa: target.g }
        : null;

      // Lo calculado (o, si no se pudo calcular, el presupuesto original) cuenta como consumido del día.
      const spent = macrosReales
        ? { p: macrosReales.proteina, hc: macrosReales.hidratos, g: macrosReales.grasa }
        : { p: target?.p || 0, hc: target?.hc || 0, g: target?.g || 0 };
      consumed.p += spent.p;
      consumed.hc += spent.hc;
      consumed.g += spent.g;

      if (calibrated?.parsedItems && macrosReales && target && !fixedOnly) {
        refinableMeals.push({ index: resolvedIngestas.length, items: calibrated.parsedItems, isMainMeal: mealIsMain, target });
      }
      resolvedIngestas.push({ ...ing, detalle, macrosReales, objetivo });
    }

    // Mejora iterativa del día completo: con todas las tomas calculadas, se reajustan juntas hasta cuadrar.
    if (refinableMeals.length > 0) {
      const refinableIndexes = new Set(refinableMeals.map((meal) => meal.index));
      const fixedTotals = resolvedIngestas.reduce((totals, meal, index) => (
        refinableIndexes.has(index) || !meal.macrosReales
          ? totals
          : {
            p: totals.p + meal.macrosReales.proteina,
            hc: totals.hc + meal.macrosReales.hidratos,
            g: totals.g + meal.macrosReales.grasa,
          }
      ), { p: 0, hc: 0, g: 0 });
      refineDayMacros(
        refinableMeals,
        { p: dayData.proteina, hc: dayData.hidratos, g: dayData.grasa },
        { fixedTotals }
      );
      for (const meal of refinableMeals) {
        const keptItems = meal.items.filter((item) => item.grams !== 0);
        const output = buildMealOutput(keptItems);
        if (!output.macrosReales) continue;
        resolvedIngestas[meal.index] = { ...resolvedIngestas[meal.index], detalle: output.text, macrosReales: output.macrosReales };
      }
    }

    const calculableMeals = resolvedIngestas.filter((meal) => meal.macrosReales);
    const allMealsCalculable = calculableMeals.length === resolvedIngestas.length && resolvedIngestas.length > 0;
    const macrosReales = allMealsCalculable
      ? calculableMeals.reduce((totals, meal) => ({
        kcal: totals.kcal + meal.macrosReales.kcal,
        proteina: totals.proteina + meal.macrosReales.proteina,
        hidratos: totals.hidratos + meal.macrosReales.hidratos,
        grasa: totals.grasa + meal.macrosReales.grasa,
      }), { kcal: 0, proteina: 0, hidratos: 0, grasa: 0 })
      : null;
    const desviacionMacros = macrosReales
      ? {
        kcal: macrosReales.kcal - dayData.kcal,
        proteina: macrosReales.proteina - dayData.proteina,
        hidratos: macrosReales.hidratos - dayData.hidratos,
        grasa: macrosReales.grasa - dayData.grasa,
      }
      : null;

    return {
      ...dayData,
      ingestas: resolvedIngestas,
      macrosReales,
      desviacionMacros,
      cierreMacros: {
        estado: allMealsCalculable ? 'completo' : 'parcial',
        ingestasCalculadas: calculableMeals.length,
        ingestasTotales: resolvedIngestas.length,
      },
    };
    };

    // Si el día no cuadra tras los ajustes, se regenera con otra selección de alimentos y se conserva el mejor intento.
    finalDias[dayKey] = await generateBestDay({ generateDay, tracker, avisos });
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
  calendario,
  menu = null,
  teamConfig,
  preMatchConfig,
  suplementacion,
}) {
  const resolvedMenu = menu || null;
  const baseData = buildBasePlanData({
    jugador,
    nombre,
    menu: resolvedMenu,
    calendario,
    preMatchConfig,
    teamConfig,
    suplementacion,
  });

  const avisos = [];
  const finalDias = await generateDeterministicWeeklyPlan({
    jugador,
    baseData,
    menu: resolvedMenu,
    preMatchConfig,
    avisos,
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
      preMatchConfig: preMatchConfig || null,
      engine: 'deterministic_food_tree',
      avisos,
    },
  };
}
