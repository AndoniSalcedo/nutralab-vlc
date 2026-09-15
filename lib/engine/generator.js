import { getSupabaseAdmin } from '@/lib/supabase/server';
import { buildBasePlanData } from './plan-card.js';
import { getLatestMenu } from '@/repositories/menuRepository';
import { calibrateMeal } from './calculator.js';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import {
  findTreeNode,
  WeeklyVarietyTracker,
  buildPlayerFoodTree,
  buildContextualPlayerFoodTree,
  buildMealTree,
  resolveDishIngredientsForPlayer,
  resolveNodeForPlayer,
  resolveMealTreeForDay,
  resolveMealTreeItemsForDay,
} from './food-tree.js';


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
export function parseFoodsFromText(text, catalog, _player = null, foodTree = null) {
  if (!text || typeof text !== 'string' || !text.trim()) return [];
  const raw = text.trim();
  const low = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (low.includes('descanso') || low.includes('partido')) return [];

  const foods = [];
  const resolvedTree = foodTree || buildPlayerFoodTree(catalog);

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
    const node = findTreeNode(part, resolvedTree);
    if (node) {
      const resolved = resolveNodeForPlayer(node.id, catalog, _player, null, resolvedTree);
      if (resolved) {
        foods.push(resolved);
        continue;
      }
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
export function selectBuffetMealDishes(mealData, clinicalCatalog, player = null, _tracker = null, _isDinner = false, mealName = 'Comida', foodTree = null) {
  if (!mealData) return null;
  const rawCombined = `${mealData.primero || ''} ${mealData.segundo || ''}`.toLowerCase();
  if (rawCombined.includes('descanso') || rawCombined.includes('partido')) return null;

  const contextualTree = buildContextualPlayerFoodTree(
    foodTree || buildPlayerFoodTree(clinicalCatalog),
    { mealName }
  );

  if (Array.isArray(mealData.platos_desglosados) && mealData.platos_desglosados.length > 0) {
    const safeDishes = [];
    for (const d of mealData.platos_desglosados) {
      const res = resolveDishIngredientsForPlayer(d, clinicalCatalog, player, null, contextualTree);
      if (res.safe && res.items.length > 0) {
        const dishName = String(d.nombre || '').trim();
        const course = d.curso || ['primero', 'segundo', 'postre'].find((candidate) => {
          const source = String(mealData[candidate] || '').split('/').map((item) => item.trim());
          return source.includes(dishName);
        });
        safeDishes.push({ dish: { ...d, curso: course }, items: res.items });
      }
    }

    if (safeDishes.length > 0) {
      const firstDishes = safeDishes.filter((sd) => sd.dish.curso === 'primero');
      const secondDishes = safeDishes.filter((sd) => {
        if (sd.dish.curso !== 'segundo') return false;
        const protein = Array.isArray(sd.dish.proteina) ? sd.dish.proteina : [sd.dish.proteina];
        return protein.some(Boolean);
      });
      const dessertDishes = safeDishes.filter((sd) => sd.dish.curso === 'postre');

      if (firstDishes.length === 0 || secondDishes.length === 0) {
        return null;
      }

      return {
        kind: 'menu-options',
        firstDishes,
        secondDishes,
        dessertDishes,
      };
    }
  }

  const combinedText = `${mealData.primero || ''} ${mealData.segundo || ''}`;
  const parsed = parseFoodsFromText(combinedText, clinicalCatalog, player, contextualTree);
  if (parsed.length > 0) {
    if (!parsed.some((it) => it.toLowerCase().includes('aceite') || it.toLowerCase().includes('aove'))) {
      parsed.push('AOVE');
    }
    return buildMealTree(combinedText, mealName, clinicalCatalog, player, false);
  }

  return null;
}

function chooseMenuDish(dishes, tracker, record = true) {
  if (!dishes || dishes.length === 0) return null;
  const nonRecent = dishes.filter((item) => !tracker?.isDishRecent(item.dish.nombre));
  const pool = nonRecent.length > 0 ? nonRecent : dishes;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  if (record) tracker?.recordDish(chosen.dish.nombre);
  return chosen?.dish || null;
}

function resolveMenuOptionsTree(menuOptions, tracker) {
  const firstDish = chooseMenuDish(menuOptions.firstDishes, tracker);
  const secondDish = chooseMenuDish(menuOptions.secondDishes, tracker);
  const dessertDish = chooseMenuDish(menuOptions.dessertDishes, tracker, false);
  const selectedDishes = [firstDish, secondDish, dessertDish].filter(Boolean);
  if (selectedDishes.length === 0) return null;

  const tree = {
    isComplete: false,
    hidrato: [],
    proteina: [],
    verdura: [],
    fruta: [],
    lacteo: [],
    grasa: null,
  };

  for (const dish of selectedDishes) {
    for (const key of ['hidrato', 'proteina', 'verdura', 'fruta', 'lacteo']) {
      const values = Array.isArray(dish[key]) ? dish[key] : dish[key] ? [dish[key]] : [];
      tree[key].push(...values);
    }
    if (!tree.grasa && dish.grasa) tree.grasa = dish.grasa;
  }

  if (!tree.grasa && (firstDish || secondDish)) tree.grasa = 'AOVE';
  return tree;
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

  const calOptions = {
    isLactoseIntolerant,
    hasCowProteinAllergy,
    isVegan,
    isVegetarian,
    clinicalCatalog,
  };

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const finalDias = { ...baseData.dias };
  const tracker = new WeeklyVarietyTracker(jugador);
  const weeklyTrees = {};
  const dayContexts = {};

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

    const budgets = calculateMealBudgets(dayData);
    const calOptionsForDay = { ...calOptions, isMatchDay };
    const isCena = (mealName) => mealName.toLowerCase().includes('cena');
    const isPost = (mealName) => mealName.toLowerCase().includes('post');
    const previousMatchPauta = isPrevToMatch
      ? playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena
      : null;

    dayContexts[dayKey] = { dayData, budgets, calOptionsForDay };
    weeklyTrees[dayKey] = {};
    for (const ing of dayData.ingestas) {
      const mealName = ing.nombre;
      const normMeal = mealName.toLowerCase().trim();
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
      // 2. Cena de carga pre-partido (24h previas)
      else if (previousMatchPauta && (isCena(mealName) || (!dayData.ingestas.some((i) => isCena(i.nombre)) && ing === dayData.ingestas[dayData.ingestas.length - 1]))) {
        tree = { kind: 'meal', value: previousMatchPauta, isPreMatch: true };
      }
      // 3. Día de partido (protocolo pre-partido)
      else if (isMatchDay && matchProtocolEnabled) {
        const isPreviousDinnerSlot = horario === 'manana' && isCena(mealName);
        const pautaMatch = isPreviousDinnerSlot
          ? null
          : playerPreMatch.recomendaciones?.[mealName] || playerPreMatch.recomendaciones?.[mealName.toLowerCase()];
        if (pautaMatch) {
          tree = { kind: 'meal', value: pautaMatch, isPreMatch: true };
        }
      }
      if (!tree) {
        // 4. Comida o Cena habitual (revisar buffet de comedor primero)
        if (normMeal.includes('comida') || normMeal.includes('almuerzo') || normMeal.includes('cena')) {
          const isLunch = normMeal.includes('comida') || normMeal.includes('almuerzo');
          const mealService = isLunch ? dayMenu?.comida : dayMenu?.cena;
          const buffetOption = selectBuffetMealDishes(mealService, clinicalCatalog, jugador, tracker, !isLunch, mealName, playerFoodTree);

          if (buffetOption) {
            tree = buffetOption.kind === 'menu-options'
              ? buffetOption
              : { kind: 'meal', value: buffetOption, isPreMatch: false };
          } else {
            const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
            tree = { kind: 'meal', value: pautaDefecto, isPreMatch: false };
          }
        } else {
          // 5. Desayunos, Meriendas o colaciones habituales
          const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
          tree = { kind: 'meal', value: pautaDefecto, isPreMatch: false };
        }
      }
      weeklyTrees[dayKey][normMeal] = tree;
    }
  }

  for (let dayIdx = 0; dayIdx < daysOfWeek.length; dayIdx++) {
    const dayKey = daysOfWeek[dayIdx];
    const { dayData, budgets, calOptionsForDay } = dayContexts[dayKey];
    const budgetMap = new Map(budgets.map((b) => [b.nombre.toLowerCase().trim(), b.target]));
    const resolvedIngestas = [];

    for (const ing of dayData.ingestas) {
      const mealName = ing.nombre;
      const normMeal = mealName.toLowerCase().trim();
      const target = budgetMap.get(normMeal);
      const tree = weeklyTrees[dayKey][normMeal];
      const resolvedTree = tree?.kind === 'menu-options'
        ? resolveMenuOptionsTree(tree, tracker)
        : tree?.value;
      let rawResult = tree?.kind === 'fixed'
        ? tree.value
        : resolveMealTreeItemsForDay(resolvedTree, dayIdx, mealName, clinicalCatalog, jugador, tree?.isPreMatch, tracker, playerFoodTree);

      // Compatibilidad con recomendaciones antiguas, suplementos y nombres
      // que no sean hojas canónicas del árbol.
      if (!rawResult && tree?.kind !== 'fixed') {
        rawResult = resolveMealTreeForDay(
          resolvedTree,
          dayIdx,
          mealName,
          clinicalCatalog,
          jugador,
          tree?.isPreMatch,
          tracker,
          playerFoodTree
        );
      }

      const rawText = Array.isArray(rawResult)
        ? rawResult.map((item) => item.name || item.food?.name).filter(Boolean).join(', ')
        : rawResult;
      const isAlert = typeof rawText === 'string' && rawText.startsWith('[');
      const calibrated = (!isAlert && target)
        ? await calibrateMeal(rawResult, target, { ...calOptionsForDay, mealName, dayIndex: dayIdx })
        : rawText;

      resolvedIngestas.push({ ...ing, detalle: calibrated });
    }

    finalDias[dayKey] = {
      ...dayData,
      ingestas: resolvedIngestas,
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
