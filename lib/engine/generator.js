import { buildBasePlanData } from './plan-card.js';
import { calibrateMeal, refineDayMacros, buildMealOutput } from './calculator.js';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import { isMainMeal as checkIsMainMeal, isPreMatchPreviousDayMeal, isPreMatchMatchDayMeal } from '@/config/nutrition-days';
import { WeeklyVarietyTracker } from './variety-tracker.js';
import { mealPatternSchema } from '@/validations/mealAstSchema';
import { evaluateMealAst, extractPlannedBranchesFromAst, convertServiceToAst, validateMealAst } from './meal-ast.js';
import {
  buildPlayerFoodTree,
  extractPlannedCarbAndProtein,
  getFoodCategoryBranch,
  isAnimalProteinFood,
  getTreeNodeForFood,
  canResolveNodeForPlayer,
  isFatFood,
  createFoodItemFromName,
  resolveFoodItemForPlayer,
  getFullFoodTree,
} from './food-tree.js';
import { normalizeFoodName } from '@/data/foods-crudo';


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



function analyzeDishNutrition(sd, clinicalCatalog) {
  const dish = sd.dish;
  const items = sd.items || [];

  const proteinBranches = new Set();
  const proteinFoods = [];
  const carbBranches = new Set();
  const carbFoods = [];
  for (const item of items) {
    const cat = getFoodCategoryBranch(item, clinicalCatalog);
    if (cat.proteinBranch) {
      proteinBranches.add(cat.proteinBranch);
      proteinFoods.push(item);
    }
    if (cat.carbBranch) {
      carbBranches.add(cat.carbBranch);
      carbFoods.push(item);
    }
  }

  const hasVeg = items.some((item) => Array.isArray(item?.food?.treePath) && item.food.treePath[0] === 'verduras');

  const hasProtein = proteinFoods.length > 0;
  const hasCarb = carbFoods.length > 0;
  const isMixed = hasProtein && hasCarb;
  const isProteinOnly = hasProtein && !hasCarb;
  const isCarbOnly = hasCarb && !hasProtein;
  const isVegOnly = hasVeg && !hasProtein && !hasCarb;
  const isDessert = dish.curso === 'postre';

  return {
    dish,
    items,
    hasProtein,
    hasCarb,
    hasVeg,
    isMixed,
    isProteinOnly,
    isCarbOnly,
    isVegOnly,
    isDessert,
    proteinBranch: Array.from(proteinBranches)[0] || null,
    carbBranch: Array.from(carbBranches)[0] || null,
  };
}

function formatAstDishName(node) {
  if (!node) return 'Plato';
  if (node.type === 'food') return node.name || node.label || 'Alimento';
  return (node.children || []).map(formatAstDishName).filter(Boolean).join(' + ') || 'Plato';
}

/**
 * Selecciona y resuelve platos del buffet del comedor escolar/deportivo adaptados al perfil del jugador.
 * En lugar de imponer ciegamente 1 primero + 1 segundo, analiza la funcionalidad nutricional de cada plato
 * para formar combinaciones equilibradas y completas (1 proteína + 1 hidrato + verdura + postre).
 */
export function selectBuffetMealDishes(mealData, clinicalCatalog, player = null, mealName = 'Comida', foodTree = null) {
  if (!mealData) return null;
  if (String(mealName || '').toLowerCase().includes('almuerzo')) return null;

  const serviceAst = mealData.tree || convertServiceToAst(mealData);
  if (!serviceAst && mealData.primero == null && mealData.segundo == null && mealData.postre == null) return null;
  if (serviceAst) {
    const serviceValidation = validateMealAst({ type: 'meal', tree: serviceAst });
    if (!serviceValidation.valid) return null;
    const safeDishes = [];
    const serviceChildren = serviceAst.type === 'allOf' ? serviceAst.children || [] : [serviceAst];
    for (const courseNode of serviceChildren) {
      const course = courseNode.course || (String(courseNode?.label || '').toLowerCase().includes('segundo') ? 'segundo'
        : String(courseNode?.label || '').toLowerCase().includes('postre') ? 'postre'
          : String(courseNode?.label || '').toLowerCase().includes('primero') ? 'primero' : 'primero');
      const dishNodes = courseNode.type === 'oneOf' ? courseNode.children || [] : [courseNode];

      for (const dishNode of dishNodes) {
        const resolvedItems = evaluateMealAst({ type: 'meal', tree: dishNode }, {
          mealName,
          clinicalCatalog,
          player,
          playerFoodTree: foodTree || buildPlayerFoodTree(clinicalCatalog),
          isMainMeal: true,
        });
        if (!Array.isArray(resolvedItems) || resolvedItems.length === 0) continue;
        safeDishes.push({
          dish: { nombre: dishNode.label || formatAstDishName(dishNode), curso: dishNode.course || course, tree: dishNode },
          items: resolvedItems,
        });
      }
    }

    if (safeDishes.length > 0) {
      const analyzed = safeDishes.map((sd) => analyzeDishNutrition(sd, clinicalCatalog));
      const dessertDishes = analyzed.filter((a) => a.isDessert).map((a) => a.dish);
      const mainCandidates = analyzed.filter((a) => !a.isDessert);

      const mixedDishes = mainCandidates.filter((a) => a.isMixed);
      const proteinOnlyDishes = mainCandidates.filter((a) => a.isProteinOnly);
      const carbOnlyDishes = mainCandidates.filter((a) => a.isCarbOnly);
      const vegOnlyDishes = mainCandidates.filter((a) => a.isVegOnly);
      const standaloneProteinDishes = proteinOnlyDishes.filter((dish) => dish.dish.curso === 'segundo');
      const standaloneCarbDishes = carbOnlyDishes.filter((dish) => dish.dish.curso === 'primero');

      const validCombinations = [];

      // 1. Platos mixtos que ya aportan tanto proteína como hidrato (ej: Paella, Fideuà, Poke, Pasta boloñesa)
      for (const m of mixedDishes) {
        if (vegOnlyDishes.length > 0) {
          for (const v of vegOnlyDishes) {
            validCombinations.push({
              dishes: [m.dish, v.dish],
              proteinBranch: m.proteinBranch,
              carbBranch: m.carbBranch,
            });
          }
        }
        validCombinations.push({
          dishes: [m.dish],
          proteinBranch: m.proteinBranch,
          carbBranch: m.carbBranch,
        });
      }

      // 2. Combinaciones de 1 Plato con Proteína + 1 Plato con Carbohidrato (+ Verdura)
      for (const p of standaloneProteinDishes) {
        for (const c of standaloneCarbDishes) {
          if (p.hasVeg || c.hasVeg) {
            // La proteína o el hidrato ya traen verdura (ej. Ensalada César o Dorada al papillote)
            validCombinations.push({
              dishes: [p.dish, c.dish],
              proteinBranch: p.proteinBranch,
              carbBranch: c.carbBranch,
            });
            if (vegOnlyDishes.length > 0) {
              for (const v of vegOnlyDishes.slice(0, 2)) {
                validCombinations.push({
                  dishes: [p.dish, c.dish, v.dish],
                  proteinBranch: p.proteinBranch,
                  carbBranch: c.carbBranch,
                });
              }
            }
          } else {
            // Ni proteína ni hidrato tienen verdura (ej. Burger de potro + Patata splash)
            // Se suma verdura para completar los 3 componentes del plato
            if (vegOnlyDishes.length > 0) {
              for (const v of vegOnlyDishes) {
                validCombinations.push({
                  dishes: [p.dish, c.dish, v.dish],
                  proteinBranch: p.proteinBranch,
                  carbBranch: c.carbBranch,
                });
              }
            } else {
              validCombinations.push({
                dishes: [p.dish, c.dish],
                proteinBranch: p.proteinBranch,
                carbBranch: c.carbBranch,
              });
            }
          }
        }
      }

      if (validCombinations.length === 0) {
        return null;
      }

      return {
        kind: 'menu-options',
        combinations: validCombinations,
        dessertDishes,
      };
    }
  }

  return null;
}

function chooseMenuDish(dishes, tracker, record = true, shouldAvoid = null) {
  if (!dishes || dishes.length === 0) return null;

  const getDishObj = (item) => item?.dish || item;
  const getDishName = (item) => getDishObj(item)?.nombre;

  let candidatePool = dishes;
  if (typeof shouldAvoid === 'function') {
    const nonColliding = dishes.filter((item) => !shouldAvoid(item));
    if (nonColliding.length > 0) {
      candidatePool = nonColliding;
    }
  }

  const nonRecent = candidatePool.filter((item) => !tracker?.isDishRecent(getDishName(item)));
  const pool = nonRecent.length > 0 ? nonRecent : candidatePool;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const chosenDish = getDishObj(chosen);
  if (record && chosenDish?.nombre) tracker?.recordDish(chosenDish.nombre);
  return chosenDish || null;
}

function comboCollides(combo, proteinBranchesToAvoid, carbBranchesToAvoid, clinicalCatalog) {
  for (const dish of combo?.dishes || []) {
    const info = extractPlannedCarbAndProtein(dish?.tree || dish, clinicalCatalog);
    if (info.proteinBranches?.some((branch) => proteinBranchesToAvoid.has(branch))) return true;
    if (info.carbBranches?.some((branch) => carbBranchesToAvoid.has(branch))) return true;
  }
  return false;
}

function resolveMenuOptionsTree(menuOptions, tracker, clinicalCatalog = null, isDinner = false) {
  if (!menuOptions) return null;

  const plannedDinner = !isDinner ? tracker?.getTodayPlannedDinner() : null;
  const todayLunch = isDinner ? tracker?.getTodayLunch() : null;

  const carbBranchesToAvoid = new Set([
    ...(plannedDinner?.fixedCarbBranch ? [plannedDinner.fixedCarbBranch] : []),
    ...(isDinner ? todayLunch?.carbBranches || [] : []),
  ]);
  const proteinBranchesToAvoid = new Set([
    ...(plannedDinner?.fixedProteinBranch ? [plannedDinner.fixedProteinBranch] : []),
    ...(isDinner ? todayLunch?.proteinBranches || [] : []),
  ]);

  let selectedDishes = [];

  if (Array.isArray(menuOptions.combinations) && menuOptions.combinations.length > 0) {
    let pool = menuOptions.combinations;
    const nonColliding = pool.filter((combo) => !comboCollides(combo, proteinBranchesToAvoid, carbBranchesToAvoid, clinicalCatalog));
    if (nonColliding.length > 0) pool = nonColliding;

    // 3. Priorizar combinaciones sin platos recientes de la semana
    if (tracker) {
      const nonRecent = pool.filter((c) => !c.dishes.some((d) => tracker.isDishRecent(d?.nombre)));
      if (nonRecent.length > 0) pool = nonRecent;
    }

    const chosenCombo = pool[Math.floor(Math.random() * pool.length)];
    if (chosenCombo && Array.isArray(chosenCombo.dishes)) {
      selectedDishes = chosenCombo.ast ? [chosenCombo] : [...chosenCombo.dishes];
      if (tracker) {
        for (const d of chosenCombo.dishes) {
          if (d?.nombre) tracker.recordDish(d.nombre);
        }
      }
    }
  }

  if (selectedDishes.length === 0) return null;

  const dessertDish = chooseMenuDish(menuOptions.dessertDishes, tracker, false);
  if (dessertDish) selectedDishes.push(dessertDish);

  const allOfChildren = [];
  for (const dish of selectedDishes) {
    const dishTree = dish.ast?.tree || dish.tree;
    if (!dishTree) continue;
    if (dishTree.type === 'allOf') allOfChildren.push(...(dishTree.children || []));
    else allOfChildren.push(dishTree);
  }

  if (selectedDishes.length > 0 && allOfChildren.length > 0) {
    const label = selectedDishes.map((dish) => dish.nombre).filter(Boolean).join(' + ');
    return {
      type: 'meal',
      isMainMeal: true,
      raw: label,
      label,
      unrecognized: [],
      tree: {
        type: 'allOf',
        label,
        children: allOfChildren,
      },
    };
  }
  return null;
}

const FIXED_MEAL_PORTIONS = {
  fruta: 200,
  yogur: 250,
  leche: 250,
};

function getFixedFoodGroup(food) {
  if (!food) return null;
  // Complementos (salsas, condimentos): ración fija de acompañamiento, nunca se calibran.
  if (getTreeNodeForFood(food)?.isExtra) return 'complemento';
  const path = Array.isArray(food.treePath) ? food.treePath.map((part) => String(part).toLowerCase()) : [];
  if (path[0] === 'frutas') return 'fruta';
  if (path[0] === 'lacteos' && path[1] === 'yogures') return 'yogur';
  if (path[0] === 'lacteos' && path[1] === 'leches') return 'leche';
  if (path[0] === 'lacteos') return 'lacteo';
  return null;
}

function getFoodRootBranch(food) {
  return Array.isArray(food?.treePath) ? String(food.treePath[0] || '').toLowerCase() : null;
}

function getFixedFoodPortion(food, group) {
  const preferred = FIXED_MEAL_PORTIONS[group];
  const min = Number(food?.minGrams);
  const max = Number(food?.maxGrams);
  const basePortion = Number.isFinite(preferred) ? preferred : min;
  if (!Number.isFinite(basePortion)) return null;
  const withMinimum = Number.isFinite(min) ? Math.max(min, basePortion) : basePortion;
  return Number.isFinite(max) ? Math.min(max, withMinimum) : withMinimum;
}

function calculateMacroTotals(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { kcal: 0, p: 0, hc: 0, g: 0, proteina: 0, hidratos: 0, grasa: 0 };
  }
  return items.reduce((totals, item) => {
    const grams = Number(item?.grams);
    const food = item?.food;
    if (!Number.isFinite(grams) || !food) return totals;
    const kcal = totals.kcal + (grams / 100) * Number(food.kcal ?? 0);
    const p = totals.p + (grams / 100) * Number(food.pro ?? 0);
    const hc = totals.hc + (grams / 100) * Number(food.cho ?? 0);
    const g = totals.g + (grams / 100) * Number(food.fat ?? 0);
    return {
      kcal,
      p,
      hc,
      g,
      proteina: p,
      hidratos: hc,
      grasa: g,
    };
  }, { kcal: 0, p: 0, hc: 0, g: 0, proteina: 0, hidratos: 0, grasa: 0 });
}

/**
 * En comidas principales sin grasa explícita y con algún componente escalable (no solo fruta
 * o lácteos), se añade AOVE como grasa de cocinado para que la calibración cuadre las grasas.
 */
function ensureMainMealFat(items, isMainMeal, clinicalCatalog, playerFoodTree) {
  if (!isMainMeal || !Array.isArray(items) || items.length === 0) return items;
  if (items.some((item) => item?.food && isFatFood(item.food))) return items;
  const hasScalableComponent = items.some((item) => !['frutas', 'lacteos'].includes(getFoodRootBranch(item?.food)));
  if (!hasScalableComponent) return items;
  const fatItem = createFoodItemFromName('AOVE', clinicalCatalog, playerFoodTree)
    || resolveFoodItemForPlayer('aceites', clinicalCatalog, null, null, playerFoodTree);
  return fatItem ? [...items, fatItem] : items;
}

function prepareFixedMealItems(rawResult, isMainMeal = false) {
  if (!Array.isArray(rawResult)) {
    return {
      rawResult,
      fixedComponents: 0,
      fixedMacros: { kcal: 0, p: 0, hc: 0, g: 0, proteina: 0, hidratos: 0, grasa: 0 },
      fixedOnly: false,
    };
  }

  const prepared = rawResult.map((item) => {
    const group = getFixedFoodGroup(item?.food);
    if (!group) return item;
    if (isMainMeal && group === 'fruta') {
      //FIXEME: solve this i dont like
      const dessertGrams = Math.min(120, Math.max(100, Number(item.food?.minGrams) || 100));
      return {
        ...item,
        grams: dessertGrams,
        isFixedComponent: false,
      };
    }
    return {
      ...item,
      grams: getFixedFoodPortion(item.food, group) ?? item.grams,
      isFixedComponent: true,
    };
  });
  const hasBranchData = prepared.every((item) => getFoodRootBranch(item?.food));
  const hasPrimaryProtein = prepared.some((item) => getFoodRootBranch(item?.food) === 'proteina' || isAnimalProteinFood(item?.food));
  const hasPrimaryCarb = prepared.some((item) => getFoodRootBranch(item?.food) === 'hidratos');
  const fixedOnly = !isMainMeal && prepared.length > 0 && hasBranchData && !hasPrimaryProtein && !hasPrimaryCarb;
  const fixedPrepared = fixedOnly
    ? prepared.map((item) => {
      if (Number.isFinite(Number(item?.grams))) return { ...item, isFixedComponent: true };
      const rootBranch = getFoodRootBranch(item?.food);
      const isProtein = rootBranch === 'proteina' || isAnimalProteinFood(item?.food);
      const isCarb = rootBranch === 'hidratos';
      const fallbackGrams = (isProtein || isCarb)
        ? Number(item?.food?.maxGrams)
        : Number(item?.food?.minGrams);
      return Number.isFinite(fallbackGrams)
        ? { ...item, grams: fallbackGrams, isFixedComponent: true }
        : { ...item, isFixedComponent: true };
    })
    : prepared;
  const fixedItems = fixedOnly
    ? fixedPrepared
    : fixedPrepared.filter((item) => item?.isFixedComponent === true);

  return {
    rawResult: fixedPrepared,
    fixedComponents: fixedItems.length,
    fixedMacros: calculateMacroTotals(fixedItems),
    fixedOnly,
  };
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
function adaptTargetToDay({ target, meal, pendingMeals, budgetFor, dayData, consumed }) {
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
      : 'no está en el catálogo del jugador para este plan (restricciones clínicas, aversiones o semana sin menú de comedor)';
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

  const tracker = new WeeklyVarietyTracker(jugador);
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
  const wrapMealValue = (value, isPreMatch = false, { dayKey, mealName } = {}) => {
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
      isPreMatch,
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
          tree = wrapMealValue(pauta24h, true, { dayKey, mealName });
        }
      }
      // 3. Día de partido (protocolo pre-partido): solo ingestas que correspondan al día de partido
      else if (isMatchDay && matchProtocolEnabled && isPreMatchMatchDayMeal(horario, mealName)) {
        const pautaMatch = playerPreMatch.recomendaciones?.[mealName]
          || playerPreMatch.recomendaciones?.[mealName.toLowerCase()];
        if (pautaMatch) {
          tree = wrapMealValue(pautaMatch, true, { dayKey, mealName });
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
            tree = wrapMealValue(pautaDefecto, false, { dayKey, mealName });
          }
        } else {
          // 5. Desayunos, Meriendas o colaciones habituales
          const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
          tree = wrapMealValue(pautaDefecto, false, { dayKey, mealName });
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
        : null;
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
          player: jugador,
          clinicalCatalog,
          tracker,
          playerFoodTree,
          mealName,
          isMainMeal,
          isDinner: isCena,
          // Toma previa al partido: la del protocolo pre-partido y el desayuno del día de partido.
          isPreMatch: tree.isPreMatch === true || (dayData.tipoDia === 'partido' && normMeal.includes('desayuno')),
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
              player: jugador,
              clinicalCatalog,
              tracker,
              playerFoodTree,
              mealName: ing?.nombre,
              isMainMeal: mealIsMain,
              isDinner: true,
              isPreMatch: tree.isPreMatch === true,
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
        { fixedTotals, isMatchDay: calOptionsForDay.isMatchDay }
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

    // Mejora iterativa de la selección: si tras los ajustes el día sigue fuera de tolerancia,
    // se vuelve a generar con otra selección de alimentos y se conserva el mejor intento.
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
    finalDias[dayKey] = best.day;
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
