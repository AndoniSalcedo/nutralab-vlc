/**
 * Motor AST (Árbol Sintáctico) para Pautas Nutricionales de Nutralab.
 * 
 * Contrato canónico de comidas, pautas y platos de menú:
 * - "allOf": Conjunción estricta (todos los elementos se sirven en la toma).
 * - "oneOf": Disyunción estricta (el motor elige exactamente una opción, aplicando preferencias solo si hay opciones).
 * - "food": Hoja de alimento/grupo taxonómico.
 */

import {
  getFoodCategoryBranch,
  resolveFoodItemForPlayer,
  createFoodItemFromName,
  canResolveNodeForPlayer,
  getSubstituteBranchIds,
  resolveGenericBreakfastMeal,
  formatBreadForBreakfast,
  hasTreePath,
  getPlayerFoodTree,
  buildPreMatchFoodTree,
  getNodeFromTree,
  buildContextualPlayerFoodTree,
  getCompleteMealBranches,
  getCanonicalFoodLabel,
} from './food-tree.js';
import { normalizeFoodName } from '../../data/foods-crudo.js';

/**
 * Formatea un AST o comida en un texto legible y elegante para la UI.
 * Ej: "Ternera magra + Patata + (Pasta o Arroz)"
 * 
 * @param {Object} mealAst - Nodo AST o pauta completa
 * @returns {string}
 */
export function formatAstToText(mealAst) {
  if (!mealAst) return '';
  if (mealAst.type === 'complete') {
    return 'Árbol completo (Rotación variada)';
  }

  const root = mealAst.tree || (mealAst.type ? mealAst : null);
  if (!root) {
    return mealAst.label || mealAst.raw || '';
  }

  function formatNode(node) {
    if (!node) return '';
    if (node.type === 'food') {
      const raw = node.name || node.foodName || node.label || '';
      return getCanonicalFoodLabel(raw);
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

export function validateMealAst(mealAst) {
  if (mealAst?.type === 'complete') return { valid: true, error: null };
  if (mealAst?.type !== 'meal') return { valid: false, error: 'La pauta debe tener type "meal" o "complete".' };

  const validateNode = (node) => {
    if (!node || typeof node !== 'object') return 'Nodo AST no válido.';
    if (node.type === 'food') {
      if (!String(node.name || node.foodName || node.label || '').trim()) return 'La hoja food necesita un nombre.';
      return null;
    }
    if (node.type !== 'allOf' && node.type !== 'oneOf') return `Tipo de nodo desconocido: ${node.type || 'sin tipo'}.`;
    if (!Array.isArray(node.children) || node.children.length === 0) return `${node.type} necesita al menos un hijo.`;
    for (const child of node.children) {
      const error = validateNode(child);
      if (error) return error;
    }
    return null;
  };

  const error = validateNode(mealAst.tree);
  return { valid: !error, error };
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

  if (!mealAst || mealAst.type === 'complete') return result;

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
      if (oneOfCarbBranches.size === 1 && !isInsideOneOf && !result.fixedCarbBranch) {
        result.fixedCarbBranch = Array.from(oneOfCarbBranches)[0];
      }
      if (oneOfProteinBranches.size === 1 && !isInsideOneOf && !result.fixedProteinBranch) {
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
 *   preMatchFoodTree,
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

  // Tomas del protocolo prepartido: al elegir dentro de un grupo no salen alimentos altos en fibra ni FODMAP.
  const basePlayerTree = context.isPreMatch
    ? (context.preMatchFoodTree || buildPreMatchFoodTree(clinicalCatalog))
    : getPlayerFoodTree(clinicalCatalog, context.playerFoodTree);
  const playerTree = buildContextualPlayerFoodTree(basePlayerTree, { mealName, isMainMeal });

  // Las reglas de composición de la toma (sin huevos en la comida, sin legumbres en la cena...)
  // solo guían lo que elige el motor: la rotación y los grupos amplios (Proteínas, Hidratos...).
  // Lo que la pauta, el protocolo o el menú nombran de forma concreta se sirve siempre; solo lo
  // limitan las restricciones clínicas del jugador.
  const rootBranchIds = new Set(Object.values(basePlayerTree?.children || {}).map((child) => child.id));
  const treeForLeaf = (name) => {
    const node = getNodeFromTree(name, basePlayerTree);
    return node && rootBranchIds.has(node.id) ? playerTree : basePlayerTree;
  };

  // 1. Árbol Completo (Comida libre / rotación del buffet sin restricciones de pauta)
  // El desayuno se compone por estilos gastronómicos (tostadas, bowls...) en lugar de por ramas fijas.
  if (mealAst?.type === 'complete' && String(mealName).toLowerCase().includes('desayuno')) {
    return resolveGenericBreakfastMeal(clinicalCatalog, player, tracker, playerTree);
  }
  if (mealAst?.type === 'complete') {
    const branches = getCompleteMealBranches(mealName);
    const resolvedItems = [];
    for (const b of branches) {
      const item = resolveFoodItemForPlayer(b.id, clinicalCatalog, player, tracker, playerTree);
      if (item) resolvedItems.push(item);
    }
    return resolvedItems;
  }

  const validation = validateMealAst(mealAst);
  if (!validation.valid) throw new Error(validation.error);

  const root = mealAst?.tree || (['allOf', 'oneOf', 'food'].includes(mealAst?.type) ? mealAst : null);
  if (!root) return [];

  // Alimento concreto fuera de la rotación del jugador que se sirve porque se nombra de forma exacta: en una pauta o
  // protocolo, un producto especial o (con menú) un alimento que no está en el menú; en un plato del menú, un
  // alimento apto que no está en el catálogo del menú.
  const findNamedFood = (name) => {
    const key = normalizeFoodName(name);
    return context.markExplicit ? clinicalCatalog?.namedOnly?.get(key) : clinicalCatalog?.offMenuFoods?.get(key);
  };

  function isNodeResolvable(node) {
    if (!node) return false;
    if (node.type === 'food') {
      const leafName = node.name || node.foodName || node.label;
      return canResolveNodeForPlayer(leafName, clinicalCatalog, treeForLeaf(leafName)) || Boolean(findNamedFood(leafName));
    }
    if (node.type === 'allOf') return (node.children || []).some(isNodeResolvable);
    if (node.type === 'oneOf') return (node.children || []).some(isNodeResolvable);
    return false;
  }

  // Helper recursivo de resolución
  function evaluateNode(node) {
    if (!node) return [];

    // Nodo Hoja: Alimento concreto o grupo
    if (node.type === 'food') {
      const foodName = node.name || node.foodName || node.label;
      if (!foodName) return [];

      const leafTree = treeForLeaf(foodName);
      let item = createFoodItemFromName(foodName, clinicalCatalog, leafTree);
      // Alimento nombrado que no está en la rotación del jugador pero no choca con ninguna restricción clínica:
      // se sirve.
      if (!item) {
        const namedFood = findNamedFood(foodName);
        if (namedFood) item = { name: namedFood.name, food: namedFood, grams: null, displayName: null };
      }
      if (!item) {
        // Fallback al resolvedor del grupo
        item = resolveFoodItemForPlayer(foodName, clinicalCatalog, player, tracker, leafTree);
      }
      if (!item && !context.markExplicit) {
        // Plato de menú de comedor: un alimento que no cumple las restricciones del jugador simplemente se elimina.
        context.onUnresolved?.(foodName, null);
      }
      if (!item && context.markExplicit) {
        // Pauta o protocolo del jugador con un alimento que ya no le vale (restricción nueva o catálogo cambiado):
        // se sustituye por la rama apta más cercana y el plan lo avisa.
        // En el desayuno, el sustituto de un hidrato es un cereal o un pan, no un hidrato de plato (arroz, patata...).
        const substituteIds = getSubstituteBranchIds(foodName).flatMap((id) => (
          id === 'hidratos' && String(mealName || '').toLowerCase().includes('desayuno') ? ['cereales', 'panes', id] : [id]
        ));
        for (const branchId of substituteIds) {
          item = resolveFoodItemForPlayer(branchId, clinicalCatalog, player, tracker, playerTree);
          if (item) { item = { ...item, substituted: true }; break; }
        }
        context.onUnresolved?.(foodName, item?.name || null);
      }
      if (item && !isMainMeal && !item.displayName && hasTreePath(item.food, 'panes')) {
        item = { ...item, displayName: formatBreadForBreakfast(item.name) };
      }

      // Lo que la pauta o el protocolo del jugador nombra de forma concreta (no un grupo amplio) se marca como
      // explícito: el calculador puede ajustar sus gramos, pero nunca lo elimina de la toma.
      if (item && context.markExplicit && leafTree === basePlayerTree && !item.substituted) {
        item = { ...item, explicit: true };
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
      // Solo compiten las opciones resolubles para el jugador; si ninguna lo es, se evalúan para avisar.
      const resolvable = (node.children || []).filter((child) => isNodeResolvable(child));
      const candidates = resolvable.length > 0 ? resolvable : node.children || [];
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

      // 3. Priorizar opciones que no sean recientes en la semana. Solo en comidas y cenas: en desayunos y
      // meriendas las opciones que el nutricionista escribe ("A o B") se alternan por igual.
      if (isMainMeal && tracker && safeCandidates.length > 1) {
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
 * @param {Object|string} legacyMeal - Registro legacy leído por el migrador
 * @returns {Object} MealAst normalizado
 */
export function convertLegacyToAst(legacyMeal) {
  if (!legacyMeal) {
    return {
      raw: '',
      label: 'Árbol completo',
      type: 'complete',
      unrecognized: [],
    };
  }

  // Si ya es un AST nativo, normalizar el envoltorio y validar la raíz.
  if (legacyMeal.type === 'complete') {
    return {
      type: 'complete',
      raw: legacyMeal.raw || '',
      label: legacyMeal.label || 'Árbol completo',
      ...(legacyMeal.isMainMeal !== undefined ? { isMainMeal: Boolean(legacyMeal.isMainMeal) } : {}),
      unrecognized: legacyMeal.unrecognized || [],
    };
  }
  if (legacyMeal.tree || ['allOf', 'oneOf', 'food'].includes(legacyMeal.type)) {
    const tree = legacyMeal.tree || legacyMeal;
    if (!['allOf', 'oneOf', 'food'].includes(tree.type)) {
      throw new Error(`Tipo de nodo AST no válido: ${tree.type || 'sin tipo'}`);
    }
    return {
      type: 'meal',
      tree,
      raw: legacyMeal.raw || '',
      label: legacyMeal.label || formatAstToText({ tree }),
      ...(legacyMeal.isMainMeal !== undefined ? { isMainMeal: Boolean(legacyMeal.isMainMeal) } : {}),
      unrecognized: legacyMeal.unrecognized || [],
    };
  }

  if (typeof legacyMeal === 'string') {
    return {
      type: 'meal',
      raw: legacyMeal,
      label: legacyMeal,
      tree: {
        type: 'allOf',
        children: [{ type: 'food', name: legacyMeal }],
      },
      unrecognized: [],
    };
  }

  const isMainMeal = legacyMeal.isMainMeal !== undefined ? Boolean(legacyMeal.isMainMeal) : undefined;

  if (legacyMeal.isComplete === true && !legacyMeal.tree) {
    return {
      type: 'complete',
      raw: legacyMeal.raw || '',
      label: legacyMeal.label || 'Árbol completo',
      ...(isMainMeal !== undefined ? { isMainMeal } : {}),
      unrecognized: legacyMeal.unrecognized || [],
    };
  }

  if (Array.isArray(legacyMeal.alternativas) && legacyMeal.alternativas.length > 0) {
    const alternatives = legacyMeal.alternativas.map((alternative) => {
      const children = [];
      const addCategory = (value, category) => {
        const list = Array.isArray(value) ? value : value ? [value] : [];
        list.forEach((name) => {
          if (name && name !== 'Sin grasa añadida') children.push({ type: 'food', category, name: String(name) });
        });
      };
      addCategory(alternative.hidrato, 'hidratos');
      addCategory(alternative.proteina, 'proteina');
      addCategory(alternative.verdura, 'verduras');
      addCategory(alternative.fruta, 'frutas');
      addCategory(alternative.lacteo, 'lacteos');
      addCategory(alternative.grasa, 'grasas');
      return { type: 'allOf', label: alternative.label || alternative.nombre || 'Opción', children };
    });
    return {
      type: 'meal',
      tree: { type: 'oneOf', label: legacyMeal.label || 'Opciones', children: alternatives },
      raw: legacyMeal.raw || '',
      label: legacyMeal.label || formatAstToText({ type: 'oneOf', children: alternatives }),
      ...(legacyMeal.isMainMeal !== undefined ? { isMainMeal: Boolean(legacyMeal.isMainMeal) } : {}),
      unrecognized: legacyMeal.unrecognized || [],
    };
  }

  // Compatibilidad legacy solo para convertir registros previos durante la migración.
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
    type: allOfChildren.length > 0 ? 'meal' : 'complete',
    raw: legacyMeal.raw || '',
    label: legacyMeal.label || '',
    ...(isMainMeal !== undefined ? { isMainMeal } : {}),
    ...(allOfChildren.length > 0 ? {
      tree: {
        type: 'allOf',
        label: legacyMeal.label || '',
        children: allOfChildren,
      },
    } : {}),
    unrecognized: legacyMeal.unrecognized || [],
  };
}

/**
 * Convierte un servicio de buffet (comida o cena) a un AST completo:
 * allOf([ oneOf(primeros), oneOf(segundos), oneOf(postres) ])
 * 
 * @param {Object} serviceData - Servicio con nodos AST de curso o AST ya construido
 * @returns {Object|null} Árbol AST del servicio
 */
export function convertServiceToAst(serviceData) {
  if (!serviceData || typeof serviceData !== 'object') return null;
  const tree = serviceData.tree || (['allOf', 'oneOf', 'food'].includes(serviceData.type) ? serviceData : null);
  if (!tree || !['allOf', 'oneOf', 'food'].includes(tree.type)) return null;
  return tree;
}

