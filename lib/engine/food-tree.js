import { FOODS_CRUDO, normalizeFoodName } from '@/data/foods-crudo';
import { FOODS_MENU } from '@/data/foods-menu';
import { isMainMeal as checkIsMainMeal } from '@/config/nutrition-days';
import { WeeklyVarietyTracker, selectFoodWithVariety } from './variety-tracker.js';

export { WeeklyVarietyTracker, selectFoodWithVariety };

export function hasTreePath(food, pathOrSegment) {
  const tp = food?.treePath;
  if (!Array.isArray(tp)) return false;
  if (Array.isArray(pathOrSegment)) {
    return pathOrSegment.every((seg, i) => tp[i] === seg);
  }
  return tp.includes(pathOrSegment);
}

export const isEmbutidoFood = (food) => hasTreePath(food, 'embutidos');
export const isBreakfastGrain = (food) => hasTreePath(food, 'cereales');
export const isCookingGrain = (food) => hasTreePath(food, 'otros_granos');
export const isMeatFood = (food) =>
  hasTreePath(food, 'pollo') ||
  hasTreePath(food, 'pavo') ||
  hasTreePath(food, 'vacuno') ||
  hasTreePath(food, 'conejo') ||
  hasTreePath(food, 'cerdo') ||
  hasTreePath(food, 'embutidos') ||
  hasTreePath(food, 'carnes_otras');

export const isFishOrSeafoodFood = (food) =>
  hasTreePath(food, 'pescado_blanco') ||
  hasTreePath(food, 'pescado_azul') ||
  hasTreePath(food, 'marisco') ||
  hasTreePath(food, 'conservas_pescado');

export const isAnimalProteinFood = (food) =>
  isMeatFood(food) || isFishOrSeafoodFood(food);

export const isPlantProteinFood = (food) =>
  hasTreePath(food, 'vegetal_proteina');

export const isFatFood = (food) =>
  hasTreePath(food, 'grasas') ||
  hasTreePath(food, 'aceites') ||
  hasTreePath(food, 'aguacate') ||
  hasTreePath(food, 'frutos_secos') ||
  hasTreePath(food, 'semillas');

export const isDairyFood = (food) =>
  hasTreePath(food, 'lacteos') ||
  hasTreePath(food, 'leches') ||
  hasTreePath(food, 'yogures') ||
  hasTreePath(food, 'quesos');

export const isEggFood = (food) => hasTreePath(food, 'huevos');

/**
 * ÁRBOL TAXONÓMICO NUTRICIONAL DE NUTRALAB — única fuente de verdad de la taxonomía.
 *
 * - La ruta de ids de cada nodo es un prefijo del `treePath` de los alimentos del catálogo
 *   (data/foods-*.js). Un alimento cuelga del nodo más profundo cuya ruta es prefijo de su
 *   `treePath` (el dato puede ser más específico, p. ej. verduras/hojas_verdes); al cargar
 *   el módulo se valida que todos los alimentos cuelguen de una rama del árbol.
 * - Referenciar una rama en una pauta (hoja "food" del AST) equivale a la rama entera
 *   con todas sus subramas y alimentos; el motor rota entre los aptos para el jugador.
 * - `rotatable: false`: la rama nunca se elige al rotar desde un nodo padre ni en la
 *   rotación variada; solo entra si una pauta o menú la nombra (ella o uno de sus alimentos).
 * - `isExtra: true`: sus alimentos son complementos (salsas, condimentos) que se sirven
 *   con una ración fija y no compiten por los roles de hidrato/proteína/grasa al calibrar.
 * - `aliases`: nombres alternativos con los que se puede referenciar la rama.
 */

export const FOOD_TREE = {
  id: 'raiz',
  label: 'Catálogo General',
  children: {
    // ------------------------------------------------------------------------
    // 1. PROTEÍNAS
    // ------------------------------------------------------------------------
    proteina: {
      id: 'proteina',
      label: 'Proteínas',
      children: {
        carne: {
          id: 'carne',
          label: 'Carne (Genérico)',
          isGeneric: true,
          defaultFood: 'Pechuga de pollo',
          aliases: ['Carne', 'Carne magra', 'Carnes'],
          children: {
            pollo: { id: 'pollo', label: 'Pollo (Genérico)', isGeneric: true, defaultFood: 'Pechuga de pollo' },
            pavo: { id: 'pavo', label: 'Pavo (Genérico)', isGeneric: true, defaultFood: 'Pechuga de pavo' },
            conejo: { id: 'conejo', label: 'Conejo', defaultFood: 'Conejo' },
            vacuno: {
              id: 'vacuno',
              label: 'Vacuno / Carne Roja',
              isGeneric: true,
              defaultFood: 'Ternera magra',
              aliases: ['Carne roja', 'Carnes rojas', 'Vacuno', 'Ternera'],
            },
            cerdo: { id: 'cerdo', label: 'Cerdo fresco', isPork: true, isGeneric: true, defaultFood: 'Solomillo de cerdo' },
          },
        },
        carnes_otras: { id: 'carnes_otras', label: 'Otras carnes', rotatable: false },
        pescado: {
          id: 'pescado',
          label: 'Pescado (Genérico)',
          isFish: true,
          isGeneric: true,
          defaultFood: 'Merluza',
          aliases: ['Pescado', 'Pescados'],
          children: {
            pescado_blanco: { id: 'pescado_blanco', label: 'Pescado blanco (Genérico)', isFish: true, isGeneric: true, defaultFood: 'Merluza' },
            pescado_azul: { id: 'pescado_azul', label: 'Pescado azul (Genérico)', isFish: true, isGeneric: true, defaultFood: 'Salmón' },
          },
        },
        marisco: { id: 'marisco', label: 'Marisco', isSeafood: true, isGeneric: true, defaultFood: 'Sepia' },
        huevos: { id: 'huevos', label: 'Huevos', defaultFood: 'Huevo entero' },
        conservas_pescado: { id: 'conservas_pescado', label: 'Conservas de pescado (Desayunos/Meriendas)', defaultFood: 'Atún natural' },
        vegetal_proteina: { id: 'vegetal_proteina', label: 'Proteína vegetal', defaultFood: 'Tofu firme' },
        embutidos: { id: 'embutidos', label: 'Embutidos y fiambres', rotatable: false },
      },
    },

    // ------------------------------------------------------------------------
    // 2. HIDRATOS
    // ------------------------------------------------------------------------
    hidratos: {
      id: 'hidratos',
      label: 'Hidratos de Carbono',
      children: {
        pasta: {
          id: 'pasta',
          label: 'Pasta (Grupo genérico)',
          isGeneric: true,
        },
        arroz: {
          id: 'arroz',
          label: 'Arroz (Grupo genérico)',
          isGeneric: true,
          defaultFood: 'Arroz blanco',
        },
        tuberculos: { id: 'tuberculos', label: 'Tubérculos', defaultFood: 'Patata' },
        panes: {
          id: 'panes',
          label: 'Panes (Grupo genérico)',
          isGeneric: true,
        },
        // Wraps (fajitas, tortillas de trigo): se tratan como plato de hidrato, no como pan de acompañamiento.
        // No rotan en comidas y cenas: solo salen si una pauta o un menú los nombra. En el desayuno sí cuentan como pan.
        wraps: { id: 'wraps', label: 'Wraps y tortillas de trigo', rotatable: false },
        otros_granos: { id: 'otros_granos', label: 'Otros granos culinarios (Quinoa, Cuscús, Bulgur)', isGeneric: true, defaultFood: 'Quinoa' },
        cereales: {
          id: 'cereales',
          label: 'Cereales y Avena',
          isGeneric: true,
          defaultFood: 'Copos de avena',
        },
        legumbres: { id: 'legumbres', label: 'Legumbres', defaultFood: 'Lenteja' },
        // Preparados de desayuno: se sirven en sus estilos de desayuno o si una pauta los nombra.
        preparados_desayuno: { id: 'preparados_desayuno', label: 'Pancakes y crepes', rotatable: false },
      },
    },

    // ------------------------------------------------------------------------
    // 3. FRUTAS
    // ------------------------------------------------------------------------
    frutas: {
      id: 'frutas',
      label: 'Frutas',
      isGeneric: true,
      defaultFood: 'Plátano',
      children: {
        desecadas: { id: 'desecadas', label: 'Fruta desecada y compotas', rotatable: false },
        // Zumos: nunca en rotación; solo se sirven si una pauta los nombra.
        zumos: { id: 'zumos', label: 'Zumos', rotatable: false },
      },
    },

    // ------------------------------------------------------------------------
    // 4. VERDURAS
    // ------------------------------------------------------------------------
    verduras: {
      id: 'verduras',
      label: 'Verduras y Hortalizas',
      isGeneric: true,
      defaultFood: 'Calabacín',
    },

    // ------------------------------------------------------------------------
    // 5. GRASAS
    // ------------------------------------------------------------------------
    grasas: {
      id: 'grasas',
      label: 'Grasas saludables',
      children: {
        aceites: {
          id: 'aceites',
          label: 'Aceites',
          defaultFood: 'AOVE',
          children: {
            // Grasa por defecto: AOVE. El resto solo se usa si una pauta o un menú lo nombra.
            aceites_otros: { id: 'aceites_otros', label: 'Otras grasas de cocinado (aceite de coco, girasol, mantequilla)', rotatable: false },
          },
        },
        aguacate: { id: 'aguacate', label: 'Aguacate', defaultFood: 'Aguacate' },
        frutos_secos: {
          id: 'frutos_secos',
          label: 'Frutos secos',
          defaultFood: 'Nueces',
          aliases: ['Frutos secos y semillas'],
          children: {
            // Semillas (chía, lino, sésamo, pipas...): solo si una pauta las nombra, nunca en rotación.
            semillas: { id: 'semillas', label: 'Semillas', rotatable: false },
          },
        },
      },
    },

    // ------------------------------------------------------------------------
    // 6. LÁCTEOS
    // ------------------------------------------------------------------------
    lacteos: {
      id: 'lacteos',
      label: 'Lácteos',
      children: {
        leches: {
          id: 'leches',
          label: 'Leches (Grupo genérico)',
          isGeneric: true,
        },
        yogures: {
          id: 'yogures',
          label: 'Yogures (Grupo genérico)',
          isGeneric: true,
        },
        quesos: { id: 'quesos', label: 'Quesos (Grupo genérico)', isGeneric: true, defaultFood: 'Queso fresco' },
      },
    },

    // ------------------------------------------------------------------------
    // 7. COMPLEMENTOS (solo si se nombran; ración fija de acompañamiento)
    // ------------------------------------------------------------------------
    complementos: {
      id: 'complementos',
      label: 'Complementos (salsas y condimentos)',
      rotatable: false,
      isExtra: true,
      children: {
        salsas: { id: 'salsas', label: 'Salsas' },
        condimentos: { id: 'condimentos', label: 'Condimentos y aromáticas' },
      },
    },

    // ------------------------------------------------------------------------
    // 8. SUPLEMENTOS, BEBIDAS Y OTROS (solo si se nombran)
    // ------------------------------------------------------------------------
    suplementos: {
      id: 'suplementos',
      label: 'Suplementos y otros',
      rotatable: false,
      children: {
        proteina_polvo: { id: 'proteina_polvo', label: 'Proteína en polvo' },
        deportivos: { id: 'deportivos', label: 'Suplementos deportivos' },
        bebidas: { id: 'bebidas', label: 'Bebidas' },
        dulces_otros: { id: 'dulces_otros', label: 'Dulces' },
        otros: { id: 'otros', label: 'Otros' },
      },
    },
  },
};

// Índice plano de nodos por id y label para búsqueda en O(1)
const FLAT_NODE_INDEX = new Map();
const PLAYER_TREE_METADATA = new WeakMap();
const PLAYER_TREE_CACHE = new WeakMap();
const CONTEXTUAL_TREE_CACHE = new WeakMap();

function indexTreeNodes(node, currentPath = [], inherited = {}) {
  if (!node || !node.id) return;
  const path = node.id === 'raiz' ? [] : [...currentPath, node.id];
  node.treePath = path;
  // Las propiedades de rama se heredan: una subrama de una rama no rotable tampoco rota.
  if (inherited.rotatable === false && node.rotatable === undefined) node.rotatable = false;
  if (inherited.isExtra && node.isExtra === undefined) node.isExtra = true;

  FLAT_NODE_INDEX.set(node.id.toLowerCase(), node);
  if (node.label) FLAT_NODE_INDEX.set(normalizeFoodName(node.label), node);
  (node.aliases || []).forEach((alias) => FLAT_NODE_INDEX.set(normalizeFoodName(alias), node));

  if (node.children) {
    Object.values(node.children).forEach((child) => indexTreeNodes(child, path, node));
  }
}

indexTreeNodes(FOOD_TREE);

const TREE_NODE_BY_PATH = new Map();
(function indexNodePaths(node) {
  if (node.id !== 'raiz') TREE_NODE_BY_PATH.set(node.treePath.join('/'), node);
  Object.values(node.children || {}).forEach(indexNodePaths);
})(FOOD_TREE);

/** Nodo del árbol al que pertenece un alimento: el más profundo cuya ruta es prefijo de su treePath. */
export function getTreeNodeForFood(food) {
  if (!Array.isArray(food?.treePath)) return null;
  for (let depth = food.treePath.length; depth > 0; depth--) {
    const node = TREE_NODE_BY_PATH.get(food.treePath.slice(0, depth).join('/'));
    if (node) return node;
  }
  return null;
}

// Invariante de la taxonomía: todo alimento del catálogo cuelga de un nodo del árbol.
const FOODS_WITHOUT_NODE = [...FOODS_CRUDO, ...FOODS_MENU].filter((food) => !getTreeNodeForFood(food));
if (FOODS_WITHOUT_NODE.length > 0) {
  throw new Error(`Alimentos con treePath sin nodo en FOOD_TREE: ${FOODS_WITHOUT_NODE
    .map((food) => `${food.name} [${(food.treePath || []).join('/')}]`).join(', ')}`);
}

function clonePlayerTreeNode(node, clinicalCatalog) {
  const cloned = { ...node };
  // Alimentos propios del nodo: los del catálogo del jugador cuyo treePath es exactamente el del nodo.
  cloned.foodNames = node.id === 'raiz'
    ? []
    : (clinicalCatalog.foods || []).filter((food) => getTreeNodeForFood(food) === node).map((food) => food.name);

  if (node.children) {
    cloned.children = Object.fromEntries(
      Object.entries(node.children).map(([key, child]) => [
        key,
        clonePlayerTreeNode(child, clinicalCatalog),
      ])
    );
  }

  return cloned;
}

function indexPlayerTreeNode(node, index) {
  if (!node?.id) return;

  index.byId.set(node.id.toLowerCase(), node);
  if (node.label) index.byName.set(normalizeFoodName(node.label), node);
  (node.aliases || []).forEach((alias) => index.byName.set(normalizeFoodName(alias), node));

  if (node.children) {
    Object.values(node.children).forEach((child) => indexPlayerTreeNode(child, index));
  }
}

function freezePlayerTree(node) {
  if (!node || typeof node !== 'object' || Object.isFrozen(node)) return node;
  if (Array.isArray(node.foodNames)) Object.freeze(node.foodNames);
  if (node.children) Object.values(node.children).forEach(freezePlayerTree);
  if (node.children) Object.freeze(node.children);
  return Object.freeze(node);
}

/**
 * Construye una copia del árbol canónico usando únicamente los alimentos del
 * catálogo clínico recibido. FOOD_TREE nunca se modifica ni se comparte como
 * estado mutable entre jugadores.
 */
export function buildPlayerFoodTree(clinicalCatalog) {
  if (!clinicalCatalog?.foodsByNormalizedName || !Array.isArray(clinicalCatalog.foods)) return FOOD_TREE;
  if (PLAYER_TREE_CACHE.has(clinicalCatalog)) return PLAYER_TREE_CACHE.get(clinicalCatalog);

  const playerTree = clonePlayerTreeNode(FOOD_TREE, clinicalCatalog);
  const index = { byId: new Map(), byName: new Map(), leaves: [] };

  indexPlayerTreeNode(playerTree, index);

  // Las hojas exactas se mantienen indexadas aunque no cuelguen de una rama
  // genérica concreta. Así una recomendación guardada sigue resolviéndose por
  // su nombre exacto sin reabrir el catálogo completo en el resolver.
  clinicalCatalog.foods.forEach((food) => {
    const leafId = food.normalizedName.replace(/\s+/g, '_');
    const leafNode = {
      id: leafId,
      label: food.name,
      foodNames: [food.name],
      isLeaf: true,
      isGeneric: false,
      category: food.treePath?.[0] || 'general',
      treePath: food.treePath,
      foodData: food,
    };
    // Los ids de rama tienen prioridad: 'arroz' es la rama aunque exista el alimento "Arroz".
    if (!index.byId.has(leafId)) index.byId.set(leafId, leafNode);
    index.byName.set(food.normalizedName, leafNode);
    index.leaves.push(leafNode);
  });

  PLAYER_TREE_METADATA.set(playerTree, index);
  const frozenTree = freezePlayerTree(playerTree);
  PLAYER_TREE_CACHE.set(clinicalCatalog, frozenTree);
  return frozenTree;
}

/**
 * Construye una vista contextual del árbol del jugador para una ingesta.
 *
 * Las restricciones clínicas ya están resueltas en `buildPlayerFoodTree`.
 * Aquí solo se aplican reglas de composición de la ingesta:
 * - comida y cena: sin huevos, conservas ni pan como hidrato principal;
 * - cena: además, sin legumbres.
 *
 * El árbol base no se modifica y las vistas se cachean por jugador/contexto.
 */
/**
 * Genera una vista contextual del árbol del jugador adaptada al tipo de comida.
 * Bloquea ingredientes de desayuno en comidas principales, y carnes/pescados de
 * cocinado y legumbres en tomas secundarias/ligeras.
 */
export function buildContextualPlayerFoodTree(
  playerTree,
  { mealName = 'Comida', isMainMeal = null } = {}
) {
  if (!playerTree) return playerTree;

  const resolvedIsMain = isMainMeal !== null && isMainMeal !== undefined
    ? Boolean(isMainMeal)
    : checkIsMainMeal(mealName);
  const normMeal = String(mealName || '').toLowerCase();
  const isDinner = normMeal.includes('cena');
  const contextKey = `${resolvedIsMain ? 'main' : 'light'}:${isDinner ? 'dinner' : 'not-dinner'}`;

  let contextCache = CONTEXTUAL_TREE_CACHE.get(playerTree);
  if (!contextCache) {
    contextCache = new Map();
    CONTEXTUAL_TREE_CACHE.set(playerTree, contextCache);
  }
  if (contextCache.has(contextKey)) return contextCache.get(contextKey);

  const blockedIds = new Set();
  if (resolvedIsMain) {
    blockedIds.add('huevos');
    blockedIds.add('conservas_pescado');
    blockedIds.add('panes');
    blockedIds.add('embutidos');
    blockedIds.add('cereales');
    blockedIds.add('marisco');
    blockedIds.add('desecadas');
    if (isDinner) blockedIds.add('legumbres');
  } else {
    // Tomas secundarias o ligeras (desayunos, meriendas, snacks)
    // Solo se quitan carnes y pescados de cocinado y legumbres de plato
    blockedIds.add('pollo');
    blockedIds.add('pavo');
    blockedIds.add('conejo');
    blockedIds.add('vacuno');
    blockedIds.add('cerdo');
    blockedIds.add('carnes_otras');
    blockedIds.add('carne');
    blockedIds.add('pescado_blanco');
    blockedIds.add('pescado_azul');
    blockedIds.add('marisco');
    blockedIds.add('legumbres');
  }

  const baseMetadata = PLAYER_TREE_METADATA.get(playerTree);
  const blockedFoodNames = new Set();
  blockedIds.forEach((blockedId) => {
    const blockedNode = getNodeFromTree(blockedId, playerTree);
    getFoodsFromTreeNode(blockedNode).forEach((foodName) => {
      blockedFoodNames.add(normalizeFoodName(foodName));
    });
  });

  if (baseMetadata) {
    for (const leaf of baseMetadata.leaves) {
      const normalizedName = normalizeFoodName(leaf.label || leaf.foodNames?.[0] || '');
      const food = leaf.foodData || leaf;
      const isBlocked = Array.isArray(food?.treePath) && food.treePath.some((seg) => blockedIds.has(seg));

      if (normalizedName && isBlocked) {
        blockedFoodNames.add(normalizedName);
      }
    }
  }

  const contextualTree = cloneContextualTreeNode(playerTree, blockedIds, blockedFoodNames);
  const index = { byId: new Map(), byName: new Map(), leaves: [] };
  indexPlayerTreeNode(contextualTree, index);

  // Las hojas exactas del catálogo no cuelgan necesariamente de una rama
  // visible, pero deben seguir resolviéndose si no pertenecen a una rama bloqueada.
  const baseLeaves = baseMetadata
    ? baseMetadata.leaves
    : [];
  baseLeaves.forEach((leaf) => {
    const normalizedName = normalizeFoodName(leaf.label || leaf.foodNames?.[0] || '');
    if (normalizedName && !blockedFoodNames.has(normalizedName)) {
      if (!index.byId.has(leaf.id.toLowerCase())) index.byId.set(leaf.id.toLowerCase(), leaf);
      index.byName.set(normalizedName, leaf);
      index.leaves.push(leaf);
    }
  });

  PLAYER_TREE_METADATA.set(contextualTree, index);
  const frozenTree = freezePlayerTree(contextualTree);
  contextCache.set(contextKey, frozenTree);
  return frozenTree;
}

function cloneContextualTreeNode(node, blockedIds, blockedFoodNames = new Set()) {
  if (!node || blockedIds.has(node.id)) return null;

  const cloned = { ...node };
  if (Array.isArray(node.foodNames)) {
    cloned.foodNames = node.foodNames.filter(
      (foodName) => !blockedFoodNames.has(normalizeFoodName(foodName))
    );
  }
  if (cloned.defaultFood && blockedFoodNames.has(normalizeFoodName(cloned.defaultFood))) {
    cloned.defaultFood = null;
  }
  if (node.children) {
    cloned.children = Object.fromEntries(
      Object.entries(node.children)
        .filter(([, child]) => !blockedIds.has(child.id))
        .map(([key, child]) => [key, cloneContextualTreeNode(child, blockedIds, blockedFoodNames)])
        .filter(([, child]) => child)
    );
  }
  return cloned;
}

let FULL_FOOD_TREE = null;

/**
 * Árbol con el catálogo completo, sin filtros clínicos: vocabulario válido para datos
 * compartidos (menús de equipo) y para validar que una referencia existe. La adaptación
 * a cada jugador se hace al generar su plan.
 */
export function getFullFoodTree() {
  if (!FULL_FOOD_TREE) {
    const foods = Array.from(FOOD_BY_NORMALIZED_NAME.values());
    const foodsByNormalizedName = new Map(foods.map((food) => [food.normalizedName || normalizeFoodName(food.name), food]));
    FULL_FOOD_TREE = buildPlayerFoodTree({ foods, foodsByNormalizedName });
  }
  return FULL_FOOD_TREE;
}

export function getPlayerFoodTree(clinicalCatalog, foodTree = null) {
  return !foodTree || foodTree === FOOD_TREE
    ? buildPlayerFoodTree(clinicalCatalog)
    : foodTree;
}

export function getNodeFromTree(nodeOrId, foodTree = FOOD_TREE) {
  if (!nodeOrId) return null;
  const metadata = PLAYER_TREE_METADATA.get(foodTree);
  if (!metadata) return typeof nodeOrId === 'string' ? findTreeNode(nodeOrId, FOOD_TREE) : nodeOrId;

  const normalizedNode = normalizeFoodName(nodeOrId);
  const directMatch = metadata.byId.get(String(nodeOrId).toLowerCase()) || metadata.byName.get(normalizedNode);
  if (directMatch) return directMatch;

  const canonicalNode = typeof nodeOrId === 'string' ? findTreeNode(nodeOrId) : nodeOrId;
  if (canonicalNode?.id) {
    const byId = metadata.byId.get(canonicalNode.id.toLowerCase());
    if (byId) return byId;
  }

  return null;
}

export function getAvailableFoods(node, foodTree = FOOD_TREE) {
  if (!node) return [];
  const foods = getFoodsFromTreeNode(node);
  const metadata = PLAYER_TREE_METADATA.get(foodTree);

  return foods.filter((foodName) => {
    // El árbol derivado ya contiene exclusivamente alimentos clínicamente aptos.
    // Esta comprobación también confirma que una hoja sintética (por ejemplo un
    // defaultFood) sigue presente en el árbol contextual.
    return !metadata || metadata.byName.has(normalizeFoodName(foodName));
  });
}

/**
 * Busca un nodo por id o nombre exacto de alimento.
 * Los nombres exactos de alimentos solo existen en el índice del árbol del jugador;
 * el índice global contiene únicamente ramas canónicas.
 */
export function findTreeNode(idOrName, foodTree = FOOD_TREE) {
  if (!idOrName) return null;
  const norm = normalizeFoodName(idOrName);
  const low = idOrName.toLowerCase().trim();

  const metadata = PLAYER_TREE_METADATA.get(foodTree);
  if (metadata) {
    const playerExact = metadata.byId.get(low) || metadata.byName.get(norm);
    if (playerExact) return playerExact;
  }

  const exact = FLAT_NODE_INDEX.get(norm) || FLAT_NODE_INDEX.get(low);
  if (exact) return exact;
  return null;
}

// Ramas terminales de proteína del árbol: unidad de variedad semanal de proteínas.
export const CANONICAL_PROTEIN_BRANCHES = (function collectLeafBranches(node) {
  const children = Object.values(node.children || {});
  return children.length === 0 ? [node.id] : children.flatMap(collectLeafBranches);
})(FOOD_TREE.children.proteina);

export const CANONICAL_CARB_BRANCHES = Object.keys(FOOD_TREE.children?.hidratos?.children || {});

const FOOD_BY_NORMALIZED_NAME = new Map(
  [...FOODS_CRUDO, ...FOODS_MENU].map((food) => [food.normalizedName || normalizeFoodName(food.name), food])
);

/**
 * Resuelve la etiqueta canónica oficial de un alimento o concepto taxonómico
 * consultando la fuente de verdad del árbol y el catálogo.
 * Ej: 'arroz' -> 'Arroz (Grupo genérico)', 'pechuga de pollo' -> 'Pechuga de pollo'.
 * 
 * @param {string} raw - ID o nombre de alimento/rama
 * @returns {string} Etiqueta canónica
 */
export function getCanonicalFoodLabel(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim();
  const norm = normalizeFoodName(clean);
  const food = FOOD_BY_NORMALIZED_NAME.get(norm);
  if (food?.name) return food.name;
  const treeNode = findTreeNode(clean);
  if (treeNode?.label) return treeNode.label;
  return clean;
}

/**
 * Describe el árbol (del jugador o canónico) como esquema indentado de ramas y
 * sus alimentos hoja. Es el vocabulario que la IA usa para construir hojas "food":
 * el nombre de una rama referencia la rama entera; el de un alimento, esa hoja.
 *
 * @param {Object} foodTree - Árbol del jugador (buildPlayerFoodTree) o FOOD_TREE
 * @returns {string}
 */
export function describeFoodTreeOutline(foodTree = FOOD_TREE) {
  const lines = [];
  const walk = (node, depth) => {
    if (!node) return;
    const indent = '  '.repeat(depth);
    if (node.id !== 'raiz') {
      const ownFoods = Array.isArray(node.foodNames) ? node.foodNames : [];
      const marker = node.isExtra ? ' (complemento: solo si el texto lo nombra)'
        : node.rotatable === false ? ' (solo si el texto lo nombra)' : '';
      lines.push(`${indent}- [${node.label}]${marker}${ownFoods.length > 0 ? `: ${ownFoods.join(' | ')}` : ''}`);
    }
    Object.values(node.children || {}).forEach((child) => walk(child, node.id === 'raiz' ? depth : depth + 1));
  };
  walk(foodTree, 0);
  return lines.join('\n');
}

/**
 * Determina la rama de proteína y/o hidratos a la que pertenece un alimento o nodo del catálogo.
 * En el catálogo clínico oficial todos los alimentos están estructurados con `name` y `treePath`.
 */
export function getFoodCategoryBranch(foodOrName, clinicalCatalog = null) {
  if (!foodOrName) return { proteinBranch: null, carbBranch: null };

  // 1. Si ya es un alimento del catálogo o nodo del árbol con treePath directo
  let tp = Array.isArray(foodOrName?.treePath) ? foodOrName.treePath : null;

  // 1b. Items estructurados del motor llevan los datos en .food
  if (!tp && Array.isArray(foodOrName?.food?.treePath)) {
    tp = foodOrName.food.treePath;
  }

  // 2. Si no tiene treePath directo, resolver en el catálogo clínico o en el árbol taxonómico
  if (!tp) {
    const rawName = typeof foodOrName === 'string' ? foodOrName : (foodOrName?.name || foodOrName?.id || '');
    if (rawName) {
      const norm = normalizeFoodName(rawName);
      const low = rawName.toLowerCase().trim();
      const foodObj = clinicalCatalog?.foodsByNormalizedName?.get(norm)
        || FOOD_BY_NORMALIZED_NAME.get(norm)
        || FLAT_NODE_INDEX.get(norm)
        || FLAT_NODE_INDEX.get(low)
        || findTreeNode(rawName);
      if (Array.isArray(foodObj?.treePath)) {
        tp = foodObj.treePath;
      }
    }
  }

  let proteinBranch = null;
  let carbBranch = null;

  if (tp) {
    if (tp[0] === 'proteina') {
      const foundBranch = CANONICAL_PROTEIN_BRANCHES.find((b) => tp.includes(b));
      if (foundBranch) {
        proteinBranch = foundBranch;
      }
    }
    if (tp[0] === 'hidratos') {
      const foundCarb = CANONICAL_CARB_BRANCHES.find((b) => tp.includes(b)) || tp[1];
      if (foundCarb) {
        carbBranch = foundCarb;
      }
    }
  }

  return { proteinBranch, carbBranch };
}

/**
 * Extrae la proteína y el carbohidrato planificados o resueltos de una toma (árbol, texto, plato o alternativas).
 */
export function extractPlannedCarbAndProtein(treeNodeOrMeal, clinicalCatalog = null) {
  if (!treeNodeOrMeal) {
    return {
      carbBranch: null,
      proteinBranch: null,
      carbFood: null,
      proteinFood: null,
      carbBranches: [],
      proteinBranches: [],
      carbFoods: [],
      proteinFoods: [],
    };
  }

  const carbBranches = new Set();
  const proteinBranches = new Set();
  const carbFoods = new Set();
  const proteinFoods = new Set();

  const inspectItem = (item) => {
    if (!item) return;
    if (typeof item === 'object') {
      if (item.proteinBranch) {
        proteinBranches.add(item.proteinBranch);
        if (item.name || item.id) proteinFoods.add(item.name || item.id);
      }
      if (item.carbBranch) {
        carbBranches.add(item.carbBranch);
        if (item.name || item.id) carbFoods.add(item.name || item.id);
      }
      if (item.proteina) {
        const list = Array.isArray(item.proteina) ? item.proteina : [item.proteina];
        for (const p of list) inspectItem(p);
      }
      if (item.hidrato) {
        const list = Array.isArray(item.hidrato) ? item.hidrato : [item.hidrato];
        for (const h of list) inspectItem(h);
      }
    }
    const cat = getFoodCategoryBranch(item, clinicalCatalog);
    if (cat.carbBranch) {
      carbBranches.add(cat.carbBranch);
      const name = typeof item === 'string' ? item : item?.name;
      if (name) carbFoods.add(name);
    }
    if (cat.proteinBranch) {
      proteinBranches.add(cat.proteinBranch);
      const name = typeof item === 'string' ? item : item?.name;
      if (name) proteinFoods.add(name);
    }
  };

  const inspectAst = (node) => {
    if (!node) return;
    if (node.type === 'food') {
      inspectItem(node.name || node.foodName || node.label || node.id);
      return;
    }
    if (node.type === 'allOf' || node.type === 'oneOf') {
      (node.children || []).forEach(inspectAst);
    }
  };

  const inspectAstNode = (node) => {
    if (!node) return;
    if (node.type === 'food') {
      inspectItem(node.name || node.foodName || node.label || node.id);
      return;
    }
    if (node.type === 'allOf' || node.type === 'oneOf') {
      (node.children || []).forEach(inspectAstNode);
    }
  };

  const val = treeNodeOrMeal.value !== undefined ? treeNodeOrMeal.value : treeNodeOrMeal;

  if (val.type === 'food' || val.type === 'allOf' || val.type === 'oneOf') {
    inspectAst(val);
  } else if (val.type === 'meal' && val.tree) {
    inspectAst(val.tree);
  } else if (Array.isArray(val)) {
    for (const it of val) inspectItem(it);
  } else if (typeof val === 'string') {
    const parts = val.replace(/\+/g, ',').replace(/\//g, ',').split(',').map((s) => s.trim()).filter(Boolean);
    for (const p of parts) inspectItem(p);
  } else if (val && typeof val === 'object' && ['food', 'allOf', 'oneOf'].includes(val.type)) {
    inspectAstNode(val);
  } else if (val && typeof val === 'object') {
    if (val.tree && ['food', 'allOf', 'oneOf'].includes(val.tree.type)) {
      inspectAstNode(val.tree);
    }
    if (val.hidrato) {
      const list = Array.isArray(val.hidrato) ? val.hidrato : [val.hidrato];
      for (const h of list) inspectItem(h);
    }
    if (val.proteina) {
      const list = Array.isArray(val.proteina) ? val.proteina : [val.proteina];
      for (const p of list) inspectItem(p);
    }
    if (Array.isArray(val.branches)) {
      for (const b of val.branches) {
        if (b.isGeneric) inspectItem(b.id);
        else inspectItem(b.foodName || b.label || b.id);
      }
    }
    if (Array.isArray(val.combinations) && val.combinations.length > 0) {
      for (const c of val.combinations) {
        if (c.proteinBranch) proteinBranches.add(c.proteinBranch);
        if (c.carbBranch) carbBranches.add(c.carbBranch);
        if (Array.isArray(c?.dishes)) {
          for (const d of c.dishes) inspectItem(d);
        }
      }
    }
    if (Array.isArray(val.firstDishes) && val.firstDishes.length > 0) {
      for (const fd of val.firstDishes) inspectItem(fd?.dish || fd);
    }
    if (Array.isArray(val.secondDishes) && val.secondDishes.length > 0) {
      for (const sd of val.secondDishes) inspectItem(sd?.dish || sd);
    }
    if (Array.isArray(val.items)) {
      for (const it of val.items) inspectItem(it);
    }
    if (Array.isArray(val.dishes)) {
      for (const d of val.dishes) inspectItem(d);
    }
  }

  const carbBranchesArr = Array.from(carbBranches);
  const proteinBranchesArr = Array.from(proteinBranches);
  const carbFoodsArr = Array.from(carbFoods);
  const proteinFoodsArr = Array.from(proteinFoods);

  return {
    carbBranch: carbBranchesArr[0] || null,
    proteinBranch: proteinBranchesArr[0] || null,
    carbFood: carbFoodsArr[0] || null,
    proteinFood: proteinFoodsArr[0] || null,
    carbBranches: carbBranchesArr,
    proteinBranches: proteinBranchesArr,
    carbFoods: carbFoodsArr,
    proteinFoods: proteinFoodsArr,
  };
}

/**
 * Extrae recursivamente los alimentos de un nodo y de sus subramas rotables.
 * Una subrama con `rotatable: false` solo aporta alimentos si se referencia directamente.
 */
export function getFoodsFromTreeNode(node) {
  if (!node) return [];
  const foods = [];
  if (Array.isArray(node.foodNames)) {
    foods.push(...node.foodNames);
  }
  if (node.children) {
    for (const child of Object.values(node.children)) {
      if (child.rotatable === false) continue;
      foods.push(...getFoodsFromTreeNode(child));
    }
  }
  return Array.from(new Set(foods));
}

/**
 * Resuelve deterministamente un nodo del árbol para un jugador según su catálogo clínico.
 * - Si es una opción fija/específica (ej: 'Pechuga de pollo'): elección 1 entre 1.
 * - Si es genérica con múltiples opciones: rota aleatoriamente con coherencia sin repetir.
 */
function getFoodCategory(node, foodName, clinicalCatalog) {
  const normNodeId = String(node?.id || '').toLowerCase();
  if (normNodeId === 'proteina' || normNodeId === 'carne' || normNodeId === 'pescado') return 'proteina';
  if (normNodeId === 'hidratos') return 'hidratos';
  if (normNodeId === 'verduras' || normNodeId === 'hojas_verdes') return 'verduras';
  if (normNodeId === 'frutas') return 'frutas';

  if (foodName) {
    const normName = normalizeFoodName(foodName);
    const foodItem = clinicalCatalog?.foodsByNormalizedName?.get(normName);
    if (Array.isArray(foodItem?.treePath) && foodItem.treePath.length > 0) {
      return foodItem.treePath[0];
    }
  }

  if (Array.isArray(node?.treePath) && node.treePath.length > 0) {
    return node.treePath[0];
  }

  return null;
}

function getTrackerHandlers(category, tracker, clinicalCatalog = null) {
  if (!tracker || !category) return { isRecentFn: null, recordFn: null, isSameDayFn: null, getBranchFn: null };
  if (category === 'proteina') {
    return {
      isRecentFn: (food) => {
        const branch = getFoodCategoryBranch(food, clinicalCatalog).proteinBranch;
        return tracker.isProteinRecent(food, branch);
      },
      isSameDayFn: (food) => {
        const branch = getFoodCategoryBranch(food, clinicalCatalog).proteinBranch;
        return tracker.isSameDayProtein(food, branch);
      },
      recordFn: (food) => {
        const branch = getFoodCategoryBranch(food, clinicalCatalog).proteinBranch;
        tracker.recordProtein(food, branch);
      },
      getBranchFn: (food) => getFoodCategoryBranch(food, clinicalCatalog).proteinBranch,
    };
  }
  if (category === 'hidratos') {
    return {
      isRecentFn: (food) => {
        const branch = getFoodCategoryBranch(food, clinicalCatalog).carbBranch;
        return tracker.isCarbRecent(food, branch);
      },
      isSameDayFn: (food) => {
        const branch = getFoodCategoryBranch(food, clinicalCatalog).carbBranch;
        return tracker.isSameDayCarb(food, branch);
      },
      recordFn: (food) => {
        const branch = getFoodCategoryBranch(food, clinicalCatalog).carbBranch;
        tracker.recordCarb(food, branch);
      },
      getBranchFn: (food) => getFoodCategoryBranch(food, clinicalCatalog).carbBranch,
    };
  }
  if (category === 'verduras') {
    return { isRecentFn: tracker.isVeggieRecent, recordFn: tracker.recordVeggie, isSameDayFn: null, getBranchFn: null };
  }
  if (category === 'frutas') {
    return { isRecentFn: tracker.isFruitRecent, recordFn: tracker.recordFruit, isSameDayFn: null, getBranchFn: null };
  }
  return { isRecentFn: null, recordFn: null, isSameDayFn: null, getBranchFn: null };
}

function recordFoodWithTracker(foodName, category, tracker, clinicalCatalog = null) {
  if (!foodName || !tracker || !category) return;
  const { recordFn } = getTrackerHandlers(category, tracker, clinicalCatalog);
  if (recordFn) recordFn.call(tracker, foodName);
}

/**
 * Indica si una referencia (rama o alimento) se puede resolver para el jugador en el árbol
 * dado, sin elegir ni registrar nada (no consume aleatoriedad ni toca el tracker).
 */
export function canResolveNodeForPlayer(nodeOrId, clinicalCatalog, foodTree = null) {
  if (!nodeOrId) return false;
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  if (createFoodItemFromName(nodeOrId, clinicalCatalog, playerTree)) return true;
  const node = getNodeFromTree(nodeOrId, playerTree);
  if (!node) return false;
  const isAvailable = (foodName) => getAvailableFoods({ foodNames: [foodName] }, playerTree).length > 0;
  if (getAvailableFoods(node, playerTree).length > 0) return true;
  return Boolean(node.defaultFood && isAvailable(node.defaultFood));
}

export function resolveNodeForPlayer(nodeOrId, clinicalCatalog, player = null, tracker = null, foodTree = null) {
  void player;
  if (!nodeOrId) return null;
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);

  const node = getNodeFromTree(nodeOrId, playerTree);
  if (!node) return null;

  // Obtener todos los alimentos disponibles bajo este nodo (ya sea hoja, rama o categoría raíz)
  const validFoods = getAvailableFoods(node, playerTree);

  if (validFoods.length === 1) {
    const chosen = validFoods[0];
    const category = getFoodCategory(node, chosen, clinicalCatalog);
    recordFoodWithTracker(chosen, category, tracker, clinicalCatalog);
    return chosen;
  }

  if (validFoods.length > 1) {
    const category = getFoodCategory(node, validFoods[0], clinicalCatalog);
    const { isRecentFn, recordFn, isSameDayFn, getBranchFn } = getTrackerHandlers(category, tracker, clinicalCatalog);
    return selectFoodWithVariety(validFoods, tracker, isRecentFn, recordFn, isSameDayFn, getBranchFn);
  }

  if (node.defaultFood) {
    if (getAvailableFoods({ foodNames: [node.defaultFood] }, playerTree).length > 0) {
      const category = getFoodCategory(node, node.defaultFood, clinicalCatalog);
      recordFoodWithTracker(node.defaultFood, category, tracker);
      return node.defaultFood;
    }
  }

  return null;
}

/**
 * Devuelve las ramas canónicas del Árbol Completo para una toma determinada.
 */
export function getCompleteMealBranches(mealName = 'Comida') {
  const norm = String(mealName || '').toLowerCase();

  if (norm.includes('desayuno')) {
    return [
      { id: 'panes', label: 'Panes y cereales de desayuno', isGeneric: true, category: 'hidratos' },
      { id: 'proteina', label: 'Proteínas de desayuno', isGeneric: true, category: 'proteina' },
      { id: 'frutas', label: 'Fruta fresca', isGeneric: true, category: 'frutas' },
      { id: 'aceites', label: 'Grasa saludable (AOVE / Aguacate)', isGeneric: true, category: 'grasas' },
    ];
  }

  if (norm.includes('merienda') || norm.includes('snack') || norm.includes('almuerzo')) {
    return [
      { id: 'frutas', label: 'Fruta fresca', isGeneric: true, category: 'frutas' },
      { id: 'yogures', label: 'Yogur / Lácteo proteico', isGeneric: true, category: 'lacteos' },
      { id: 'frutos_secos', label: 'Frutos secos / Grasas saludables', isGeneric: true, category: 'grasas' },
    ];
  }

  // Comida o Cena completa: 5 componentes canónicos (HC + Proteína + Verdura + Fruta + AOVE)
  return [
    { id: 'hidratos', label: 'Hidratos de carbono', isGeneric: true, category: 'hidratos' },
    { id: 'proteina', label: 'Proteínas', isGeneric: true, category: 'proteina' },
    { id: 'verduras', label: 'Verduras y hortalizas', isGeneric: true, category: 'verduras' },
    { id: 'frutas', label: 'Fruta fresca de temporada', isGeneric: true, category: 'frutas' },
    { id: 'aceites', label: 'Aceite de oliva virgen extra (AOVE)', isGeneric: true, category: 'grasas' },
  ];
}

/**
 * Busca los datos nutricionales de un alimento por nombre en el índice
 * del árbol del jugador o, como fallback, en el catálogo clínico.
 */
function getResolvedFoodData(foodName, clinicalCatalog, foodTree) {
  if (!foodName) return null;

  const normalizedName = normalizeFoodName(foodName);
  const metadata = foodTree ? PLAYER_TREE_METADATA.get(foodTree) : null;
  const indexedLeaf = metadata?.byName.get(normalizedName);
  if (indexedLeaf?.foodData) return indexedLeaf.foodData;

  const catalogFood = clinicalCatalog?.foodsByNormalizedName?.get(normalizedName);
  if (catalogFood) return catalogFood;

  return null;
}

/**
 * Crea un item de comida estructurado a partir de un nombre de alimento resuelto.
 * Busca los datos nutricionales en el índice del árbol del jugador o el catálogo clínico.
 *
 * @param {string} foodName - Nombre del alimento (ej: 'Arroz basmati')
 * @param {object} clinicalCatalog - Catálogo clínico del jugador
 * @param {object} playerTree - Árbol de alimentos del jugador
 * @param {string|null} displayName - Nombre de presentación alternativo (ej: 'Tostadas de pan integral')
 * @returns {{ name: string, food: object, grams: null, displayName: string|null } | null}
 */
export function createFoodItemFromName(foodName, clinicalCatalog, playerTree, displayName = null) {
  if (!foodName) return null;
  const food = getResolvedFoodData(foodName, clinicalCatalog, playerTree);
  if (!food) return null;
  return { name: food.name, food, grams: null, displayName: displayName || null };
}

/**
 * Resuelve un nodo del árbol para un jugador y devuelve directamente el item
 * estructurado con datos nutricionales listo para calibrateMeal.
 *
 * A diferencia de resolveNodeForPlayer (que devuelve solo el nombre del alimento),
 * esta función entrega el objeto completo { name, food, grams: null }.
 */
export function resolveFoodItemForPlayer(nodeOrId, clinicalCatalog, player = null, tracker = null, foodTree = null) {
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  const foodName = resolveNodeForPlayer(nodeOrId, clinicalCatalog, player, tracker, playerTree);
  if (!foodName) return null;
  return createFoodItemFromName(foodName, clinicalCatalog, playerTree);
}

/**
 * Ramas candidatas para sustituir una referencia que no se puede servir al jugador:
 * primero la rama del propio alimento (o el padre de la rama referenciada) y después
 * sus ancestros, de la más concreta a la más general. Ej: 'Macarrones' → ['pasta', 'hidratos'].
 */
export function getSubstituteBranchIds(nameOrId) {
  if (!nameOrId) return [];
  const food = FOOD_BY_NORMALIZED_NAME.get(normalizeFoodName(nameOrId));
  const node = food ? getTreeNodeForFood(food) : findTreeNode(nameOrId);
  if (!node?.treePath) return [];
  const path = food ? node.treePath : node.treePath.slice(0, -1);
  const ids = [];
  for (let depth = path.length; depth > 0; depth--) ids.push(path[depth - 1]);
  return ids;
}

/**
 * Formatea el nombre de pan para presentación culinaria en tostadas.
 */
export function formatBreadForBreakfast(panName) {
  if (!panName) return 'Pan blanco de barra';
  const low = String(panName).trim().toLowerCase();
  if (low.startsWith('tostada') || low.startsWith('torta') || low.startsWith('fajita') || low.startsWith('wrap')) {
    return panName;
  }
  return `Tostadas de ${low}`;
}

// Quesos frescos proteicos que acompañan a los pancakes en el desayuno.
const PANCAKE_CHEESES = ['Queso fresco batido desnatado', 'Queso cottage', 'Requesón'];

// Frutas de fácil digestión para las tomas previas a un partido.
const PRE_MATCH_FRUITS = ['platano', 'manzana', 'pera'];

function resolveBreakfastFruit(clinicalCatalog, tracker, tree, isPreMatch) {
  let candidates = getAvailableFoods(tree.children?.frutas, tree);
  if (isPreMatch) {
    const matchFruits = candidates.filter((name) => PRE_MATCH_FRUITS.some((fruit) => normalizeFoodName(name).startsWith(fruit)));
    if (matchFruits.length > 0) candidates = matchFruits;
  }
  if (candidates.length === 0) return null;
  const nonRecent = candidates.filter((name) => !tracker?.isFruitRecent(name));
  const pool = nonRecent.length > 0 ? nonRecent : candidates;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  tracker?.recordFruit(chosen);
  return createFoodItemFromName(chosen, clinicalCatalog, tree);
}

/**
 * Desayuno de rotación variada: elige un estilo gastronómico coherente entre los aptos
 * para el jugador (tostada con embutido, tostada con huevo, bowl de avena con yogur y
 * frutos secos, avena con huevo, pancakes proteicos con queso fresco, crepes de avena con yogur), rotando
 * estilos e ingredientes a lo largo de la semana.
 * En las tomas previas a un partido la fruta se limita a plátano, manzana o pera.
 *
 * @returns {Array<Object>} FoodItems resueltos
 */
export function resolveGenericBreakfastMeal(clinicalCatalog, player = null, tracker = null, playerTree = null, { isPreMatch = false } = {}) {
  const tree = playerTree || getPlayerFoodTree(clinicalCatalog);
  const branch = (...ids) => ids.reduce((node, id) => node?.children?.[id], tree);

  const chooseFromFoods = (foods, isCarb = false) => {
    if (!foods || foods.length === 0) return null;
    if (foods.length === 1) return foods[0];
    const isRecent = (item) => (isCarb ? tracker?.isCarbRecent(item) : tracker?.isProteinRecent(item));
    const nonRecent = foods.filter((f) => !isRecent(f));
    const pool = nonRecent.length > 0 ? nonRecent : foods;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const availableBreads = [...getAvailableFoods(branch('hidratos', 'panes'), tree), ...getAvailableFoods(branch('hidratos', 'wraps'), tree)];
  const availableCereals = getAvailableFoods(branch('hidratos', 'cereales'), tree);
  const availableEmbutidos = getAvailableFoods(branch('proteina', 'embutidos'), tree);
  const availableHuevos = getAvailableFoods(branch('proteina', 'huevos'), tree);
  const availableYogures = getAvailableFoods(branch('lacteos', 'yogures'), tree);
  const availableFrutosSecos = getAvailableFoods(branch('grasas', 'frutos_secos'), tree);
  const availablePreparados = getAvailableFoods(branch('hidratos', 'preparados_desayuno'), tree);
  // Pancakes aptos para el jugador: los normales o, si necesita sin gluten, la versión sin gluten.
  const pancakeName = availablePreparados.find((name) => name.startsWith('Pancakes proteicos'));
  const hasPancakes = Boolean(pancakeName);
  const hasCrepes = availablePreparados.includes('Crepes de avena');

  const panApto = availableBreads.length > 0
    ? (resolveNodeForPlayer('panes', clinicalCatalog, player, tracker, tree) || availableBreads[0])
    : null;
  const breadItem = () => {
    const rawBread = chooseFromFoods(availableBreads, true) || panApto;
    return { rawBread, item: createFoodItemFromName(rawBread, clinicalCatalog, tree, formatBreadForBreakfast(rawBread)) };
  };
  const fatFromNode = (preferOilProbability) => createFoodItemFromName(
    Math.random() < preferOilProbability
      ? (resolveNodeForPlayer('aceites', clinicalCatalog, player, tracker, tree) || 'AOVE')
      : (resolveNodeForPlayer('aguacate', clinicalCatalog, player, tracker, tree) || 'Aguacate'),
    clinicalCatalog,
    tree,
  );
  const cerealName = () => chooseFromFoods(availableCereals, true)
    || resolveNodeForPlayer('cereales', clinicalCatalog, player, tracker, tree)
    || 'Copos de avena';
  const fruit = () => resolveBreakfastFruit(clinicalCatalog, tracker, tree, isPreMatch);

  const styles = [];

  // 1. Tostadas con embutidos y fiambres (pechuga de pavo en lonchas, jamón serrano, jamón cocido...)
  if (availableBreads.length > 0 && availableEmbutidos.length > 0) {
    styles.push({
      id: 'tostada_embutido',
      getItems: () => {
        const bread = breadItem();
        const protName = chooseFromFoods(availableEmbutidos, false);
        return {
          items: [bread.item, createFoodItemFromName(protName, clinicalCatalog, tree), fatFromNode(0.7), fruit()],
          carbName: bread.rawBread,
          protName,
        };
      },
    });
  }

  // 2. Tostadas con huevo (revuelto, tortilla francesa, cocido)
  if (availableBreads.length > 0 && availableHuevos.length > 0) {
    styles.push({
      id: 'tostada_huevo',
      getItems: () => {
        const bread = breadItem();
        const protName = chooseFromFoods(availableHuevos, false);
        return {
          items: [bread.item, createFoodItemFromName(protName, clinicalCatalog, tree), fatFromNode(0.6), fruit()],
          carbName: bread.rawBread,
          protName,
        };
      },
    });
  }

  // 3. Bowl de avena / cereales con yogur y frutos secos
  if (availableCereals.length > 0 && availableYogures.length > 0) {
    styles.push({
      id: 'bowl_avena_yogur',
      getItems: () => {
        const carbName = cerealName();
        const protName = chooseFromFoods(availableYogures, false);
        const fatName = chooseFromFoods(availableFrutosSecos, false)
          || resolveNodeForPlayer('frutos_secos', clinicalCatalog, player, tracker, tree)
          || 'Nueces';
        return {
          items: [
            createFoodItemFromName(carbName, clinicalCatalog, tree),
            createFoodItemFromName(protName, clinicalCatalog, tree),
            createFoodItemFromName(fatName, clinicalCatalog, tree),
            fruit(),
          ],
          carbName,
          protName,
        };
      },
    });
  }

  // 4. Avena con huevos y fruta
  if (availableCereals.length > 0 && availableHuevos.length > 0) {
    styles.push({
      id: 'avena_huevo',
      getItems: () => {
        const carbName = cerealName();
        const protName = chooseFromFoods(availableHuevos, false);
        const fatName = chooseFromFoods(availableFrutosSecos, false)
          || resolveNodeForPlayer('aguacate', clinicalCatalog, player, tracker, tree)
          || 'Aguacate';
        return {
          items: [
            createFoodItemFromName(carbName, clinicalCatalog, tree),
            createFoodItemFromName(protName, clinicalCatalog, tree),
            createFoodItemFromName(fatName, clinicalCatalog, tree),
            fruit(),
          ],
          carbName,
          protName,
        };
      },
    });
  }

  // 5. Pancakes proteicos con queso fresco batido (o cottage/requesón), frutos secos y fruta.
  // El queso no es ración fija: la calibración lo ajusta para completar solo la proteína que falte.
  const availableQuesosFrescos = getAvailableFoods(branch('lacteos', 'quesos'), tree)
    .filter((name) => PANCAKE_CHEESES.includes(name));
  if (hasPancakes && availableQuesosFrescos.length > 0) {
    styles.push({
      id: 'pancakes_proteicos',
      getItems: () => {
        const protName = chooseFromFoods(availableQuesosFrescos, false);
        const fatName = chooseFromFoods(availableFrutosSecos, false);
        return {
          items: [
            createFoodItemFromName(pancakeName, clinicalCatalog, tree),
            createFoodItemFromName(protName, clinicalCatalog, tree),
            fatName ? createFoodItemFromName(fatName, clinicalCatalog, tree) : null,
            fruit(),
          ],
          carbName: pancakeName,
          protName,
        };
      },
    });
  }

  // 6. Crepes de avena con yogur y fruta
  if (hasCrepes && availableYogures.length > 0) {
    styles.push({
      id: 'crepes_avena',
      getItems: () => {
        const protName = chooseFromFoods(availableYogures, false);
        return {
          items: [
            createFoodItemFromName('Crepes de avena', clinicalCatalog, tree),
            createFoodItemFromName(protName, clinicalCatalog, tree),
            fruit(),
          ],
          carbName: 'Crepes de avena',
          protName,
        };
      },
    });
  }

  // Sin estilos aptos (p. ej. restricciones severas): ramas genéricas de desayuno.
  if (styles.length === 0) {
    return getCompleteMealBranches('Desayuno')
      .map((b) => resolveFoodItemForPlayer(b.id, clinicalCatalog, player, tracker, tree))
      .filter(Boolean);
  }

  const nonRecentStyles = styles.filter((s) => !tracker?.isBreakfastStyleRecent(s.id));
  const candidatePool = nonRecentStyles.length > 0 ? nonRecentStyles : styles;
  const chosenStyle = candidatePool[Math.floor(Math.random() * candidatePool.length)];
  tracker?.recordBreakfastStyle(chosenStyle.id);

  const result = chosenStyle.getItems();
  if (result.protName) tracker?.recordProtein(result.protName, getFoodCategoryBranch(result.protName, clinicalCatalog).proteinBranch);
  if (result.carbName) tracker?.recordCarb(result.carbName, getFoodCategoryBranch(result.carbName, clinicalCatalog).carbBranch);
  return result.items.filter(Boolean);
}
