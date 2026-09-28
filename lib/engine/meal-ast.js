/**
 * Motor AST (Árbol Sintáctico) para Pautas Nutricionales de Nutralab.
 * 
 * Reemplaza por completo el modelo legacy de alternativas paralelas y arrays ambiguos:
 * - "allOf": Conjunción estricta (todos los elementos se sirven en la toma).
 * - "oneOf": Disyunción estricta (el motor elige exactamente una opción evaluando variedad y no-colisión).
 * - "food": Hoja de alimento/grupo taxonómico.
 */

import {
  getFoodCategoryBranch,
  resolveFoodItemForPlayer,
  createFoodItemFromName,
  getPlayerFoodTree,
  buildContextualPlayerFoodTree,
  getCompleteMealBranches,
} from './food-tree.js';

/**
 * Formatea un AST o comida en un texto legible y elegante para la UI.
 * Ej: "Ternera magra + Patata + (Pasta o Arroz)"
 * 
 * @param {Object} mealAst - Nodo AST o pauta completa
 * @returns {string}
 */
export function formatAstToText(mealAst) {
  if (!mealAst) return '';
  if (mealAst.isComplete) {
    return 'Árbol completo (Rotación variada)';
  }

  const root = mealAst.tree || (mealAst.type ? mealAst : null);
  if (!root) {
    return mealAst.label || mealAst.raw || '';
  }

  function formatNode(node) {
    if (!node) return '';
    if (node.type === 'food') {
      return node.name || node.foodName || node.label || '';
    }
    if (node.type === 'oneOf') {
      const options = (node.children || []).map(formatNode).filter(Boolean);
      if (options.length === 0) return '';
      if (options.length === 1) return options[0];
      return `(${options.join(' o ')})`;
    }
    if (node.type === 'allOf') {
      const parts = (node.children || []).map(formatNode).filter(Boolean);
      return parts.join(' + ');
    }
    return '';
  }

  const formatted = formatNode(root);
  return formatted || mealAst.label || mealAst.raw || '';
}

/**
 * Extrae las ramas de macronutrientes planificadas en el AST.
 * Diferencia entre ramas fijas (obligadas por allOf) y ramas flexibles (opciones dentro de oneOf).
 * 
 * @param {Object} mealAst
 * @param {Object} clinicalCatalog
 * @returns {{
 *   carbBranches: string[],
 *   proteinBranches: string[],
 *   fixedCarbBranch: string|null,
 *   fixedProteinBranch: string|null,
 *   hasDisjunction: boolean
 * }}
 */
export function extractPlannedBranchesFromAst(mealAst, clinicalCatalog = null) {
  const result = {
    carbBranches: [],
    proteinBranches: [],
    fixedCarbBranch: null,
    fixedProteinBranch: null,
    hasDisjunction: false,
  };

  if (!mealAst || mealAst.isComplete) return result;

  const root = mealAst.tree || (mealAst.type ? mealAst : null);
  if (!root) return result;

  const carbBranchesSet = new Set();
  const proteinBranchesSet = new Set();

  function inspectNode(node, isInsideOneOf = false) {
    if (!node) return;

    if (node.type === 'food') {
      const cat = getFoodCategoryBranch(node.name || node.label || node.id, clinicalCatalog);
      if (cat.carbBranch) {
        carbBranchesSet.add(cat.carbBranch);
        if (!isInsideOneOf && !result.fixedCarbBranch) {
          result.fixedCarbBranch = cat.carbBranch;
        }
      }
      if (cat.proteinBranch) {
        proteinBranchesSet.add(cat.proteinBranch);
        if (!isInsideOneOf && !result.fixedProteinBranch) {
          result.fixedProteinBranch = cat.proteinBranch;
        }
      }
    } else if (node.type === 'oneOf') {
      result.hasDisjunction = true;

      // Inspeccionar cada rama de la disyunción por separado para detectar ramas uniformes
      const oneOfCarbBranches = new Set();
      const oneOfProteinBranches = new Set();
      for (const child of node.children || []) {
        const childBranches = extractPlannedBranchesFromAst({ tree: child }, clinicalCatalog);
        childBranches.carbBranches.forEach((cb) => oneOfCarbBranches.add(cb));
        childBranches.proteinBranches.forEach((pb) => oneOfProteinBranches.add(pb));
        inspectNode(child, true);
      }

      // Si TODAS las ramas del oneOf convergen en la misma rama (ej: Patata/Boniato → ambos 'tuberculos'),
      // la colisión es inevitable → tratar como fija para que la evitación funcione
      if (oneOfCarbBranches.size === 1 && !result.fixedCarbBranch) {
        result.fixedCarbBranch = Array.from(oneOfCarbBranches)[0];
      }
      if (oneOfProteinBranches.size === 1 && !result.fixedProteinBranch) {
        result.fixedProteinBranch = Array.from(oneOfProteinBranches)[0];
      }
    } else if (node.type === 'allOf') {
      for (const child of node.children || []) {
        inspectNode(child, isInsideOneOf);
      }
    }
  }

  inspectNode(root, false);

  result.carbBranches = Array.from(carbBranchesSet);
  result.proteinBranches = Array.from(proteinBranchesSet);

  // Si había múltiples hidratos en allOf, no hay un único fixedCarbBranch
  if (carbBranchesSet.size > 1 && !result.hasDisjunction) {
    result.fixedCarbBranch = null; // Múltiples fijos
  }

  return result;
}

/**
 * Evalúa recursivamente un AST de comida y devuelve la lista plana de FoodItems aptos
 * y seleccionados según contexto clínico y variedad.
 * 
 * @param {Object} mealAst - Nodo AST o estructura con { tree, isComplete, raw }
 * @param {Object} context - Parámetros de contexto: {
 *   player,
 *   clinicalCatalog,
 *   tracker,
 *   playerFoodTree,
 *   mealName,
 *   isMainMeal,
 *   isLunch,
 *   isDinner,
 *   plannedDinner,
 *   todayLunch
 * }
 * @returns {Array<Object>} Lista de FoodItems resueltos
 */
export function evaluateMealAst(mealAst, context = {}) {
  const {
    player = null,
    clinicalCatalog = null,
    tracker = null,
    mealName = 'Comida',
    isMainMeal = true,
    isDinner = false,
  } = context;

  const basePlayerTree = getPlayerFoodTree(clinicalCatalog, context.playerFoodTree);
  const playerTree = buildContextualPlayerFoodTree(basePlayerTree, { mealName, isMainMeal });

  // 1. Árbol Completo (Comida libre / rotación del buffet sin restricciones de pauta)
  if (mealAst?.isComplete) {
    const branches = getCompleteMealBranches(mealName);
    const resolvedItems = [];
    for (const b of branches) {
      const item = resolveFoodItemForPlayer(b.id, clinicalCatalog, player, tracker, playerTree);
      if (item) resolvedItems.push(item);
    }
    return resolvedItems;
  }

  const root = mealAst?.tree || (mealAst?.type ? mealAst : null);
  if (!root) return [];

  // Helper recursivo de resolución
  function evaluateNode(node) {
    if (!node) return [];

    // Nodo Hoja: Alimento concreto o grupo
    if (node.type === 'food') {
      const foodName = node.name || node.foodName || node.label;
      if (!foodName) return [];

      let item = createFoodItemFromName(foodName, clinicalCatalog, playerTree);
      if (!item) {
        // Fallback al resolvedor del grupo
        item = resolveFoodItemForPlayer(foodName, clinicalCatalog, player, tracker, playerTree);
      }

      if (item) {
        if (tracker) {
          const cat = getFoodCategoryBranch(item, clinicalCatalog);
          if (cat.proteinBranch) tracker.recordProtein(item.name, cat.proteinBranch);
          if (cat.carbBranch) tracker.recordCarb(item.name, cat.carbBranch);
        }
        return [item];
      }
      return [];
    }

    // Nodo Conjunción: allOf -> evalúa todos los hijos
    if (node.type === 'allOf') {
      const items = [];
      for (const child of node.children || []) {
        const childItems = evaluateNode(child);
        items.push(...childItems);
      }
      return items;
    }

    // Nodo Disyunción: oneOf -> elige exactamente un hijo resolviendo colisiones
    if (node.type === 'oneOf') {
      const candidates = node.children || [];
      if (candidates.length === 0) return [];
      if (candidates.length === 1) return evaluateNode(candidates[0]);

      // Filtrar candidatos según colisiones de variedad
      const plannedDinner = !isDinner ? tracker?.getTodayPlannedDinner() : null;
      const todayLunch = isDinner ? tracker?.getTodayLunch() : null;

      const carbsToAvoid = new Set();
      const proteinsToAvoid = new Set();

      if (plannedDinner) {
        if (!plannedDinner.hasDisjunction) {
          (plannedDinner.carbBranches || []).forEach((b) => carbsToAvoid.add(b));
          (plannedDinner.proteinBranches || []).forEach((b) => proteinsToAvoid.add(b));
        } else {
          if (plannedDinner.fixedCarbBranch) carbsToAvoid.add(plannedDinner.fixedCarbBranch);
          if (plannedDinner.fixedProteinBranch) proteinsToAvoid.add(plannedDinner.fixedProteinBranch);
        }
        if (plannedDinner.carbBranch) carbsToAvoid.add(plannedDinner.carbBranch);
        if (plannedDinner.proteinBranch) proteinsToAvoid.add(plannedDinner.proteinBranch);
      }
      if (todayLunch?.carbBranch) carbsToAvoid.add(todayLunch.carbBranch);
      if (todayLunch?.proteinBranch) proteinsToAvoid.add(todayLunch.proteinBranch);
      (todayLunch?.carbBranches || []).forEach((b) => carbsToAvoid.add(b));
      (todayLunch?.proteinBranches || []).forEach((b) => proteinsToAvoid.add(b));

      let safeCandidates = candidates;

      // 1. Evitar colisión de proteína si hay opciones
      if (proteinsToAvoid.size > 0) {
        const nonCollidingProt = safeCandidates.filter((cand) => {
          const branches = extractPlannedBranchesFromAst({ tree: cand }, clinicalCatalog);
          return !branches.proteinBranches.some((pb) => proteinsToAvoid.has(pb));
        });
        if (nonCollidingProt.length > 0) safeCandidates = nonCollidingProt;
      }

      // 2. Evitar colisión de hidrato si hay opciones
      if (carbsToAvoid.size > 0) {
        const nonCollidingCarb = safeCandidates.filter((cand) => {
          const branches = extractPlannedBranchesFromAst({ tree: cand }, clinicalCatalog);
          return !branches.carbBranches.some((cb) => carbsToAvoid.has(cb));
        });
        if (nonCollidingCarb.length > 0) safeCandidates = nonCollidingCarb;
      }

      // 3. Priorizar opciones que no sean recientes en la semana
      if (tracker && safeCandidates.length > 1) {
        const nonRecent = safeCandidates.filter((cand) => {
          const branches = extractPlannedBranchesFromAst({ tree: cand }, clinicalCatalog);
          const hasRecentProt = branches.proteinBranches.some((pb) => tracker.isProteinRecent(null, pb));
          const hasRecentCarb = branches.carbBranches.some((cb) => tracker.isCarbRecent(null, cb));
          return !hasRecentProt && !hasRecentCarb;
        });
        if (nonRecent.length > 0) safeCandidates = nonRecent;
      }

      // Elegir el ganador
      const chosenChild = safeCandidates[Math.floor(Math.random() * safeCandidates.length)];
      return evaluateNode(chosenChild);
    }

    return [];
  }

  const rawItems = evaluateNode(root);
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  // Deduplicación intra-toma: evita que un alimento idéntico se repita en la misma comida
  const seenKeys = new Set();
  const dedupedItems = [];
  for (const item of rawItems) {
    if (!item) continue;
    const key = (item.id || item.food?.id || item.food?.name || item.name || '').toLowerCase().trim();
    if (key && seenKeys.has(key)) {
      continue;
    }
    if (key) seenKeys.add(key);
    dedupedItems.push(item);
  }
  return dedupedItems;
}

/**
 * Convierte cualquier estructura legacy a un AST limpio y bien tipado.
 * Permite migrar de forma 100% determinista la base de datos sin llamadas externas.
 * 
 * @param {Object|string} legacyMeal - Pauta en formato anterior
 * @returns {Object} MealAst normalizado
 */
export function convertLegacyToAst(legacyMeal) {
  if (!legacyMeal) {
    return {
      raw: '',
      label: 'Árbol completo',
      isComplete: true,
      tree: null,
      unrecognized: [],
    };
  }

  // Si ya es un AST nativo
  if (legacyMeal.tree && (legacyMeal.tree.type === 'allOf' || legacyMeal.tree.type === 'oneOf')) {
    return legacyMeal;
  }

  if (typeof legacyMeal === 'string') {
    return {
      raw: legacyMeal,
      label: legacyMeal,
      isComplete: false,
      tree: {
        type: 'allOf',
        children: [{ type: 'food', name: legacyMeal }],
      },
      unrecognized: [],
    };
  }

  const isMainMeal = legacyMeal.isMainMeal !== undefined ? Boolean(legacyMeal.isMainMeal) : undefined;

  if (legacyMeal.isComplete) {
    return {
      raw: legacyMeal.raw || '',
      label: legacyMeal.label || 'Árbol completo',
      isComplete: true,
      ...(isMainMeal !== undefined ? { isMainMeal } : {}),
      tree: null,
      unrecognized: legacyMeal.unrecognized || [],
    };
  }

  // Caso A: Formato antiguo de alternativas paralelas
  if (Array.isArray(legacyMeal.alternativas) && legacyMeal.alternativas.length > 0) {
    const children = legacyMeal.alternativas.map((alt) => {
      const subItems = [];
      const addCategory = (list, category) => {
        const arr = Array.isArray(list) ? list : list ? [list] : [];
        for (const it of arr) {
          if (it && it !== 'Sin grasa añadida') {
            subItems.push({ type: 'food', category, name: it });
          }
        }
      };
      addCategory(alt.hidrato, 'hidratos');
      addCategory(alt.proteina, 'proteina');
      addCategory(alt.verdura, 'verduras');
      addCategory(alt.fruta, 'frutas');
      addCategory(alt.lacteo, 'lacteos');
      if (alt.grasa && alt.grasa !== 'Sin grasa añadida') {
        subItems.push({ type: 'food', category: 'grasas', name: alt.grasa });
      }

      return {
        type: 'allOf',
        label: alt.label || alt.nombre || 'Opción',
        children: subItems,
      };
    });

    return {
      raw: legacyMeal.raw || '',
      label: legacyMeal.label || children.map((c) => c.label).join(' / '),
      isComplete: false,
      ...(isMainMeal !== undefined ? { isMainMeal } : {}),
      tree: {
        type: 'oneOf',
        label: legacyMeal.label || 'Opciones',
        children,
      },
      unrecognized: legacyMeal.unrecognized || [],
    };
  }

  // Caso B: Formato de arrays planos dentro de la comida
  const allOfChildren = [];
  const addCategory = (list, category) => {
    const arr = Array.isArray(list) ? list : list ? [list] : [];
    for (const it of arr) {
      if (it && it !== 'Sin grasa añadida') {
        allOfChildren.push({ type: 'food', category, name: it });
      }
    }
  };

  addCategory(legacyMeal.hidrato, 'hidratos');
  addCategory(legacyMeal.proteina, 'proteina');
  addCategory(legacyMeal.verdura, 'verduras');
  addCategory(legacyMeal.fruta, 'frutas');
  addCategory(legacyMeal.lacteo, 'lacteos');
  if (legacyMeal.grasa && legacyMeal.grasa !== 'Sin grasa añadida') {
    allOfChildren.push({ type: 'food', category: 'grasas', name: legacyMeal.grasa });
  }

  return {
    raw: legacyMeal.raw || '',
    label: legacyMeal.label || '',
    isComplete: allOfChildren.length === 0,
    ...(isMainMeal !== undefined ? { isMainMeal } : {}),
    tree: allOfChildren.length > 0
      ? {
        type: 'allOf',
        label: legacyMeal.label || '',
        children: allOfChildren,
      }
      : null,
    unrecognized: legacyMeal.unrecognized || [],
  };
}

/**
 * Convierte un plato individual de un menú de buffet a un nodo AST allOf.
 * 
 * @param {Object} dish - Objeto plato ({ nombre, hidrato, proteina, verdura, fruta, lacteo, grasa })
 * @returns {Object} Nodo AST allOf
 */
export function convertDishToAst(dish) {
  if (!dish || typeof dish !== 'object') return null;
  if (dish.type === 'allOf' || dish.type === 'oneOf' || dish.type === 'food') return dish;
  if (dish.tree) return dish.tree;

  const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const subItems = [];

  const addCategory = (list, category) => {
    for (const it of toArray(list)) {
      if (it && it !== 'Sin grasa añadida') {
        subItems.push({ type: 'food', category, name: it });
      }
    }
  };

  addCategory(dish.hidrato, 'hidratos');
  addCategory(dish.proteina, 'proteina');
  addCategory(dish.verdura, 'verduras');
  addCategory(dish.fruta, 'frutas');
  addCategory(dish.lacteo, 'lacteos');
  if (dish.grasa && dish.grasa !== 'Sin grasa añadida') {
    subItems.push({ type: 'food', category: 'grasas', name: dish.grasa });
  }

  return {
    type: 'allOf',
    label: dish.nombre || 'Plato',
    children: subItems,
  };
}

/**
 * Convierte un servicio de buffet (comida o cena con platos desglosados) a un AST completo:
 * allOf([ oneOf(primeros), oneOf(segundos), oneOf(postres) ])
 * 
 * @param {Object} serviceData - Servicio ({ primero, segundo, postre, platos_desglosados })
 * @returns {Object|null} Árbol AST del servicio
 */
export function convertServiceToAst(serviceData) {
  if (!serviceData || typeof serviceData !== 'object') return null;
  if (serviceData.tree) return serviceData.tree;

  const dishes = Array.isArray(serviceData.platos_desglosados) ? serviceData.platos_desglosados : [];
  if (dishes.length === 0) return null;

  const primeros = dishes.filter((d) => d.curso === 'primero').map(convertDishToAst).filter(Boolean);
  const segundos = dishes.filter((d) => d.curso === 'segundo').map(convertDishToAst).filter(Boolean);
  const postres = dishes.filter((d) => d.curso === 'postre').map(convertDishToAst).filter(Boolean);

  const courses = [];
  if (primeros.length > 0) {
    courses.push(primeros.length === 1 ? primeros[0] : { type: 'oneOf', label: 'Primeros', children: primeros });
  }
  if (segundos.length > 0) {
    courses.push(segundos.length === 1 ? segundos[0] : { type: 'oneOf', label: 'Segundos', children: segundos });
  }
  if (postres.length > 0) {
    courses.push(postres.length === 1 ? postres[0] : { type: 'oneOf', label: 'Postres', children: postres });
  }

  if (courses.length === 0) return null;
  if (courses.length === 1) return courses[0];

  return {
    type: 'allOf',
    label: 'Buffet Oficial del Club',
    children: courses,
  };
}

