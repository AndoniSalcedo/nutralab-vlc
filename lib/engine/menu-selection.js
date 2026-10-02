import { buildPlayerFoodTree, getFoodCategoryBranch } from './food-tree.js';
import { evaluateMealAst, convertServiceToAst, validateMealAst } from './meal-ast.js';
import { comboCollides, getBranchesToAvoid } from './variety-planning.js';

/**
 * Selección de platos del menú de comedor: forma combinaciones (proteína + hidrato + verdura + postre) aptas para
 * el jugador y elige una evitando repeticiones.
 */

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

export function resolveMenuOptionsTree(menuOptions, tracker, clinicalCatalog = null, isDinner = false) {
  if (!menuOptions) return null;

  const { carbBranchesToAvoid, proteinBranchesToAvoid } = getBranchesToAvoid(tracker, isDinner);

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
