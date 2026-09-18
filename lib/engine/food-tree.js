import { normalizeFoodName } from '@/data/foods-crudo';
import { isMainMeal as checkIsMainMeal } from '@/config/nutrition-days';

export function hasTreePath(food, pathOrSegment) {
  const tp = food?.treePath;
  if (!Array.isArray(tp)) return false;
  if (Array.isArray(pathOrSegment)) {
    return pathOrSegment.every((seg, i) => tp[i] === seg);
  }
  return tp.includes(pathOrSegment);
}


export const isEmbutidoFood = (food) => hasTreePath(food, 'embutidos');
export const isBreakfastGrain = (food) => hasTreePath(food, 'cereales_desayuno');
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
 * ÁRBOL TAXONÓMICO NUTRICIONAL DE NUTRALAB
 * 
 * Permite que cualquier alimento, ingrediente o preferencia del usuario se ubique
 * al nivel de profundidad exacto:
 * - Nivel Genérico / Alto (ej. 'pasta', 'arroz', 'pan', 'leche', 'pollo', 'pescado_blanco'):
 *   Al generar el plan, se consulta el catálogo clínico del jugador y se resuelve a la hoja apta
 *   (ej. celíaco -> "Pasta sin gluten"; tolerante -> "Macarrones").
 * - Nivel Específico / Corte concreto (ej. 'alitas de pollo', 'contramuslo de pollo deshuesado',
 *   'solomillo de ternera', 'secreto de cerdo'):
 *   Conserva con máxima fidelidad el corte y sus propiedades nutricionales exactas.
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
      keywords: ['proteina', 'proteinas', 'protes', 'prote'],
      children: {
        pollo: {
          id: 'pollo',
          label: 'Pollo (Genérico)',
          isGeneric: true,
          defaultFood: 'Pechuga de pollo',
          foodSelector: (f) => hasTreePath(f, 'pollo'),
        },
        pavo: {
          id: 'pavo',
          label: 'Pavo (Genérico)',
          isGeneric: true,
          defaultFood: 'Pechuga de pavo',
          foodSelector: (f) => hasTreePath(f, 'pavo'),
        },
        conejo: {
          id: 'conejo',
          label: 'Conejo',
          foodNames: ['Conejo'],
          defaultFood: 'Conejo',
          foodSelector: (f) => hasTreePath(f, 'conejo'),
        },
        vacuno: {
          id: 'vacuno',
          label: 'Vacuno / Carne Roja',
          isGeneric: true,
          defaultFood: 'Ternera magra',
          keywords: ['carne', 'carnes', 'ternera', 'vacuno'],
          foodSelector: (f) => hasTreePath(f, 'vacuno'),
        },
        cerdo: {
          id: 'cerdo',
          label: 'Cerdo fresco',
          isPork: true,
          isGeneric: true,
          defaultFood: 'Solomillo de cerdo',
          foodSelector: (f) => hasTreePath(f, 'cerdo'),
        },
        embutidos_fiambres: {
          id: 'embutidos_fiambres',
          label: 'Embutidos y Fiambres (Desayunos/Meriendas)',
          isGeneric: true,
          defaultFood: 'Jamón serrano',
          keywords: ['embutido', 'embutidos', 'fiambre', 'fiambres', 'jamon', 'jamón', 'york', 'lomo embuchado', 'pavo', 'pechuga de pavo', 'lonchas'],
          foodSelector: (f) => hasTreePath(f, 'embutidos'),
        },
        pescado_blanco: {
          id: 'pescado_blanco',
          label: 'Pescado blanco (Genérico)',
          isFish: true,
          isGeneric: true,
          defaultFood: 'Merluza',
          keywords: ['pescado', 'pescados'],
          foodSelector: (f) => hasTreePath(f, 'pescado_blanco'),
        },
        pescado_azul: {
          id: 'pescado_azul',
          label: 'Pescado azul (Genérico)',
          isFish: true,
          isGeneric: true,
          defaultFood: 'Salmón',
          keywords: ['pescado', 'pescados'],
          foodSelector: (f) => hasTreePath(f, 'pescado_azul'),
        },
        marisco: {
          id: 'marisco',
          label: 'Marisco',
          isSeafood: true,
          isGeneric: true,
          defaultFood: 'Sepia',
          foodSelector: (f) => hasTreePath(f, 'marisco'),
        },
        huevos: {
          id: 'huevos',
          label: 'Huevos',
          defaultFood: 'Huevo entero',
          keywords: ['huevo', 'huevos', 'tortilla'],
          foodSelector: (f) => hasTreePath(f, 'huevos'),
        },
        conservas_pescado: {
          id: 'conservas_pescado',
          label: 'Conservas de pescado (Desayunos/Meriendas)',
          defaultFood: 'Atún natural',
          foodSelector: (f) => hasTreePath(f, 'conservas_pescado'),
        },
        vegetal_proteina: {
          id: 'vegetal_proteina',
          label: 'Proteína vegetal',
          defaultFood: 'Tofu firme',
          keywords: ['tofu', 'seitan', 'seitán', 'heura', 'tempeh', 'soja texturizada', 'burger vegana', 'hamburguesa vegana', 'proteina vegetal', 'vegetal_proteina'],
          foodSelector: (f) => hasTreePath(f, 'vegetal_proteina'),
        },
      },
    },

    // ------------------------------------------------------------------------
    // 2. HIDRATOS
    // ------------------------------------------------------------------------
    hidratos: {
      id: 'hidratos',
      label: 'Hidratos de Carbono',
      keywords: ['hidrato', 'hidratos', 'carbohidrato', 'carbohidratos', 'carbo', 'carbos', 'hc', 'ch'],
      children: {
        pasta: {
          id: 'pasta',
          label: 'Pasta (Grupo genérico)',
          isGeneric: true,
          keywords: ['pasta', 'pastas', 'macarron', 'macarrones', 'espagueti', 'espaguetis', 'fideos', 'pasta de trigo sarraceno'],
          foodSelector: (f) => hasTreePath(f, 'pasta'),
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('pasta sin gluten') && !catalog.foodsByNormalizedName.has('macarrones')) {
              return 'Pasta sin gluten';
            }
            return 'Macarrones';
          },
        },
        arroz: {
          id: 'arroz',
          label: 'Arroz (Grupo genérico)',
          isGeneric: true,
          defaultFood: 'Arroz blanco',
          foodSelector: (f) => hasTreePath(f, 'arroz'),
          resolve() {
            return 'Arroz blanco';
          },
        },
        tuberculos: {
          id: 'tuberculos',
          label: 'Tubérculos',
          defaultFood: 'Patata',
          keywords: ['patata', 'patatas', 'boniato', 'boniatos', 'yuca', 'pure de patata', 'puré de patata', 'pure de boniato', 'puré de boniato', 'pure', 'puré'],
          foodSelector: (f) => hasTreePath(f, 'tuberculos'),
        },
        panes: {
          id: 'panes',
          label: 'Panes (Grupo genérico)',
          isGeneric: true,
          keywords: ['pan', 'panes', 'tostada', 'tostadas', 'biscote', 'fajita', 'fajitas', 'tortilla de trigo', 'wrap', 'wraps'],
          foodSelector: (f) => hasTreePath(f, 'panes'),
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('pan sin gluten') && !catalog.foodsByNormalizedName.has('pan blanco de barra')) {
              return 'Pan sin gluten';
            }
            return 'Pan blanco de barra';
          },
        },
        otros_granos: {
          id: 'otros_granos',
          label: 'Otros granos culinarios (Quinoa, Cuscús, Bulgur)',
          isGeneric: true,
          defaultFood: 'Quinoa',
          keywords: ['quinoa', 'cuscus', 'cuscús', 'bulgur', 'trigo sarraceno', 'mijo', 'amaranto'],
          foodSelector: (f) => hasTreePath(f, 'otros_granos'),
        },
        cereales_desayuno: {
          id: 'cereales_desayuno',
          label: 'Cereales de desayuno y Avena',
          isGeneric: true,
          defaultFood: 'Copos de avena',
          keywords: ['avena', 'copos', 'muesli', 'porridge', 'cereales', 'hinchado'],
          foodSelector: (f) => hasTreePath(f, 'cereales_desayuno'),
          resolve(catalog) {
            if (catalog?.foodsByNormalizedName?.has('copos de avena sin gluten') && !catalog?.foodsByNormalizedName?.has('copos de avena')) {
              return 'Copos de avena sin gluten';
            }
            return 'Copos de avena';
          },
        },
        legumbres: {
          id: 'legumbres',
          label: 'Legumbres',
          defaultFood: 'Lenteja',
          foodSelector: (f) => hasTreePath(f, 'legumbres'),
        },
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
      keywords: ['fruta', 'frutas'],
      foodSelector: (f) => hasTreePath(f, 'frutas'),
    },

    // ------------------------------------------------------------------------
    // 4. VERDURAS
    // ------------------------------------------------------------------------
    verduras: {
      id: 'verduras',
      label: 'Verduras y Hortalizas',
      isGeneric: true,
      defaultFood: 'Calabacín',
      keywords: ['vegetal', 'vegetales', 'verdura', 'verduras', 'hortaliza', 'hortalizas'],
      foodSelector: (f) => hasTreePath(f, 'verduras'),
    },

    // ------------------------------------------------------------------------
    // 5. GRASAS Y LÁCTEOS
    // ------------------------------------------------------------------------
    grasas_y_lacteos: {
      id: 'grasas_y_lacteos',
      label: 'Grasas saludables y Lácteos',
      children: {
        aceites: {
          id: 'aceites',
          label: 'Aceites',
          defaultFood: 'AOVE',
          keywords: ['grasa', 'grasas', 'aceite', 'aceites'],
          foodNames: ['AOVE'],
          foodSelector: (f) => hasTreePath(f, 'aceites'),
        },
        aguacate: {
          id: 'aguacate',
          label: 'Aguacate',
          defaultFood: 'Aguacate',
          foodNames: ['Aguacate'],
          foodSelector: (f) => hasTreePath(f, 'aguacate'),
        },
        frutos_secos: {
          id: 'frutos_secos',
          label: 'Frutos secos',
          defaultFood: 'Nueces',
          foodSelector: (f) => hasTreePath(f, 'frutos_secos') || hasTreePath(f, 'semillas'),
        },
        leches: {
          id: 'leches',
          label: 'Leches (Grupo genérico)',
          isGeneric: true,
          foodSelector: (f) => hasTreePath(f, 'leches'),
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('leche entera sin lactosa')) return 'Leche entera sin lactosa';
            if (catalog.foodsByNormalizedName.has('leche de avena')) return 'Leche de avena';
            return 'Leche semidesnatada';
          },
        },
        yogures: {
          id: 'yogures',
          label: 'Yogures (Grupo genérico)',
          isGeneric: true,
          keywords: ['yogur', 'yogures', 'lacteo', 'lacteos'],
          foodSelector: (f) => hasTreePath(f, 'yogures'),
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('yogur proteico natural')) return 'Yogur proteico natural';
            return 'Yogur natural';
          },
        },
        quesos: {
          id: 'quesos',
          label: 'Quesos (Grupo genérico)',
          isGeneric: true,
          defaultFood: 'Queso fresco',
          keywords: ['queso', 'quesos'],
          foodSelector: (f) => hasTreePath(f, 'quesos'),
        },
      },
    },

    // ------------------------------------------------------------------------
    // 6. BEBIDAS E HIDRATACIÓN
    // ------------------------------------------------------------------------
    bebidas: {
      id: 'bebidas',
      label: 'Bebidas e Hidratación',
      children: {
        agua: {
          id: 'agua',
          label: 'Agua mineral',
          foodNames: ['Agua mineral', 'Agua'],
          defaultFood: 'Agua mineral',
        },
        cafe: {
          id: 'cafe',
          label: 'Café solo o con leche',
          foodNames: ['Café solo'],
          defaultFood: 'Café solo',
        },
        infusiones: {
          id: 'infusiones',
          label: 'Infusiones digestivas',
          foodNames: ['Té verde', 'Manzanilla'],
          defaultFood: 'Manzanilla',
        },
      },
    },

    // ------------------------------------------------------------------------
    // 7. SUPLEMENTACIÓN Y PROTOCOLOS
    // ------------------------------------------------------------------------
    suplementos: {
      id: 'suplementos',
      label: 'Suplementos y Protocolos',
      children: {
        ensure: {
          id: 'ensure',
          label: 'Ensure Nutrición Entera',
          foodNames: ['Ensure Nutrición Entera 1 unidad', 'Ensure'],
          defaultFood: 'Ensure Nutrición Entera 1 unidad',
        },
        recovery: {
          id: 'recovery',
          label: 'Recovery y Fruta',
          foodNames: ['Recovery y fruta', 'Recovery'],
          defaultFood: 'Recovery y fruta',
        },
      },
    },
  },
};

// Índice plano de nodos por id y por alias para búsqueda en O(1)
const FLAT_NODE_INDEX = new Map();
const PLAYER_TREE_METADATA = new WeakMap();
const PLAYER_TREE_CACHE = new WeakMap();
const CONTEXTUAL_TREE_CACHE = new WeakMap();

function indexTreeNodes(node) {
  if (!node || !node.id) return;
  FLAT_NODE_INDEX.set(node.id.toLowerCase(), node);
  if (node.label) {
    FLAT_NODE_INDEX.set(normalizeFoodName(node.label), node);
  }
  if (Array.isArray(node.foodNames)) {
    node.foodNames.forEach((fn) => {
      FLAT_NODE_INDEX.set(normalizeFoodName(fn), node);
    });
  }
  if (Array.isArray(node.keywords)) {
    node.keywords.forEach((kw) => {
      FLAT_NODE_INDEX.set(normalizeFoodName(kw), node);
      FLAT_NODE_INDEX.set(kw.toLowerCase().trim(), node);
    });
  }
  if (node.children) {
    Object.values(node.children).forEach((child) => indexTreeNodes(child));
  }
}

// Indexar únicamente ramas, aliases y opciones genéricas. Las hojas concretas
// se añaden exclusivamente en buildPlayerFoodTree a partir del catálogo clínico.
indexTreeNodes(FOOD_TREE);

function clonePlayerTreeNode(node, clinicalCatalog) {
  const cloned = { ...node };
  const allowedNames = clinicalCatalog?.foodsByNormalizedName || new Map();

  if (typeof node.foodSelector === 'function') {
    cloned.foodNames = clinicalCatalog.foods
      .filter(node.foodSelector)
      .map((food) => food.name);
  }

  if (Array.isArray(node.foodNames)) {
    cloned.foodNames = Array.from(new Set(
      node.foodNames.filter((foodName) => allowedNames.has(normalizeFoodName(foodName)))
    ));
  }

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
  if (Array.isArray(node.foodNames)) {
    node.foodNames.forEach((foodName) => {
      index.byName.set(normalizeFoodName(foodName), node);
    });
  }
  if (Array.isArray(node.keywords)) {
    node.keywords.forEach((keyword) => {
      index.byName.set(normalizeFoodName(keyword), node);
    });
  }
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
  const index = { byId: new Map(), byName: new Map() };

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
    index.byId.set(leafId, leafNode);
    index.byName.set(food.normalizedName, leafNode);
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
    blockedIds.add('embutidos_fiambres');
    blockedIds.add('cereales_desayuno');
    blockedIds.add('marisco')
    if (isDinner) blockedIds.add('legumbres');
  } else {
    // Tomas secundarias o ligeras (desayunos, meriendas, snacks)
    // Solo se quitan carnes y pescados de cocinado y legumbres de plato
    blockedIds.add('pollo');
    blockedIds.add('cefalopodos')
    blockedIds.add('pavo');
    blockedIds.add('conejo');
    blockedIds.add('vacuno');
    blockedIds.add('cerdo');
    blockedIds.add('carnes_otras');
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
    for (const leaf of baseMetadata.byId.values()) {
      if (!leaf.isLeaf) continue;
      const normalizedName = normalizeFoodName(leaf.label || leaf.foodNames?.[0] || '');
      const food = leaf.foodData || leaf;
      const isBlocked = Array.isArray(food?.treePath) && food.treePath.some((seg) => blockedIds.has(seg));

      if (normalizedName && isBlocked) {
        blockedFoodNames.add(normalizedName);
      }
    }
  }

  const contextualTree = cloneContextualTreeNode(playerTree, blockedIds, blockedFoodNames);
  const index = { byId: new Map(), byName: new Map() };
  indexPlayerTreeNode(contextualTree, index);

  // Las hojas exactas del catálogo no cuelgan necesariamente de una rama
  // visible, pero deben seguir resolviéndose si no pertenecen a una rama bloqueada.
  const baseLeaves = baseMetadata
    ? Array.from(baseMetadata.byId.values()).filter((node) => node.isLeaf)
    : [];
  baseLeaves.forEach((leaf) => {
    const normalizedName = normalizeFoodName(leaf.label || leaf.foodNames?.[0] || '');
    if (normalizedName && !blockedFoodNames.has(normalizedName)) {
      index.byId.set(leaf.id.toLowerCase(), leaf);
      index.byName.set(normalizedName, leaf);
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

function getPlayerFoodTree(clinicalCatalog, foodTree = null) {
  return !foodTree || foodTree === FOOD_TREE
    ? buildPlayerFoodTree(clinicalCatalog)
    : foodTree;
}

function getNodeFromTree(nodeOrId, foodTree = FOOD_TREE) {
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

function getAvailableFoods(node, foodTree = FOOD_TREE) {
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
 * Busca un nodo por id, alias o nombre exacto de alimento.
 * Los nombres exactos de alimentos solo existen en el índice del árbol del jugador;
 * el índice global contiene únicamente ramas y aliases canónicos.
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

export const CANONICAL_PROTEIN_BRANCHES = [
  'pollo', 'pavo', 'vacuno', 'ternera', 'cerdo', 'conejo',
  'pescado_blanco', 'pescado_azul', 'marisco', 'embutidos_fiambres',
  'conservas_pescado', 'huevos', 'vegetal_proteina',
];

export const CANONICAL_CARB_BRANCHES = [
  'arroz', 'pasta', 'tuberculos', 'otros_granos', 'legumbres', 'panes', 'cereales_desayuno',
];

/**
 * Determina la rama de proteína y/o hidratos a la que pertenece un alimento o nodo del catálogo.
 * En el catálogo clínico oficial todos los alimentos están estructurados con `name` y `treePath`.
 */
export function getFoodCategoryBranch(foodOrName, clinicalCatalog = null) {
  if (!foodOrName) return { proteinBranch: null, carbBranch: null };

  // 1. Si ya es un alimento del catálogo o nodo del árbol con treePath directo
  let tp = Array.isArray(foodOrName?.treePath) ? foodOrName.treePath : null;

  // 2. Si no tiene treePath directo, resolver en el catálogo clínico o árbol por nombre o id
  if (!tp) {
    const rawName = typeof foodOrName === 'string' ? foodOrName : (foodOrName?.name || foodOrName?.id || '');
    if (rawName) {
      const norm = normalizeFoodName(rawName);
      const foodObj = clinicalCatalog?.foodsByNormalizedName?.get(norm)
        || FLAT_NODE_INDEX.get(norm)
        || findTreeNode(rawName);
      if (Array.isArray(foodObj?.treePath)) {
        tp = foodObj.treePath;
      }
    }
  }

  let proteinBranch = null;
  let carbBranch = null;

  if (tp) {
    if (tp[0] === 'proteina' && tp[1]) {
      proteinBranch = tp[1];
    }
    if (tp[0] === 'hidratos' && tp[1]) {
      carbBranch = tp[1];
    }
  }

  // 3. Comprobar si el identificador es directamente el de una rama canónica (ej: 'pavo', 'arroz', 'tuberculos')
  if (!proteinBranch || !carbBranch) {
    const rawStr = String(typeof foodOrName === 'string' ? foodOrName : (foodOrName?.name || foodOrName?.id || '')).toLowerCase().trim();
    const str = rawStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!proteinBranch && CANONICAL_PROTEIN_BRANCHES.includes(str)) {
      proteinBranch = str === 'ternera' ? 'vacuno' : str;
    }
    if (!carbBranch && CANONICAL_CARB_BRANCHES.includes(str)) {
      carbBranch = str;
    }
  }

  return { proteinBranch, carbBranch };
}

/**
 * Extrae la proteína y el carbohidrato planificados o resueltos de una toma (árbol, texto, plato o alternativas).
 */
export function extractPlannedCarbAndProtein(treeNodeOrMeal, clinicalCatalog = null) {
  if (!treeNodeOrMeal) return { carbBranch: null, proteinBranch: null, carbFood: null, proteinFood: null };

  let carbBranch = null;
  let proteinBranch = null;
  let carbFood = null;
  let proteinFood = null;

  const inspectItem = (item) => {
    if (!item) return;
    if (typeof item === 'object') {
      if (!proteinBranch && item.proteinBranch) {
        proteinBranch = item.proteinBranch;
        proteinFood = item.name || item.id;
      }
      if (!carbBranch && item.carbBranch) {
        carbBranch = item.carbBranch;
        carbFood = item.name || item.id;
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
    if (!carbBranch && cat.carbBranch) {
      carbBranch = cat.carbBranch;
      carbFood = typeof item === 'string' ? item : item?.name;
    }
    if (!proteinBranch && cat.proteinBranch) {
      proteinBranch = cat.proteinBranch;
      proteinFood = typeof item === 'string' ? item : item?.name;
    }
  };

  const val = treeNodeOrMeal.value !== undefined ? treeNodeOrMeal.value : treeNodeOrMeal;

  if (Array.isArray(val)) {
    for (const it of val) inspectItem(it);
  } else if (typeof val === 'string') {
    const parts = val.replace(/\+/g, ',').replace(/\//g, ',').split(',').map((s) => s.trim()).filter(Boolean);
    for (const p of parts) inspectItem(p);
  } else if (val && typeof val === 'object') {
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
      const proteins = new Set();
      const carbs = new Set();
      for (const c of val.combinations) {
        if (c.proteinBranch) proteins.add(c.proteinBranch);
        if (c.carbBranch) carbs.add(c.carbBranch);
      }
      if (proteins.size === 1) {
        proteinBranch = Array.from(proteins)[0];
      } else if (!proteinBranch && val.combinations[0]?.proteinBranch) {
        proteinBranch = val.combinations[0].proteinBranch;
      }

      if (carbs.size === 1) {
        carbBranch = Array.from(carbs)[0];
      } else if (!carbBranch && val.combinations[0]?.carbBranch) {
        carbBranch = val.combinations[0].carbBranch;
      }

      for (const combo of val.combinations) {
        if (Array.isArray(combo?.dishes)) {
          for (const d of combo.dishes) inspectItem(d);
        }
      }
    }
    if (Array.isArray(val.firstDishes) && val.firstDishes.length > 0) {
      for (const fd of val.firstDishes) inspectItem(fd?.dish || fd);
    }
    if (Array.isArray(val.secondDishes) && val.secondDishes.length > 0) {
      for (const sd of val.secondDishes) inspectItem(sd?.dish || sd);
    }
    if (Array.isArray(val.alternativas) && val.alternativas.length > 0) {
      const altPlanned = extractPlannedCarbAndProtein(val.alternativas[0], clinicalCatalog);
      if (!carbBranch) {
        carbBranch = altPlanned.carbBranch;
        carbFood = altPlanned.carbFood;
      }
      if (!proteinBranch) {
        proteinBranch = altPlanned.proteinBranch;
        proteinFood = altPlanned.proteinFood;
      }
    }
    if (Array.isArray(val.items)) {
      for (const it of val.items) inspectItem(it);
    }
    if (Array.isArray(val.dishes)) {
      for (const d of val.dishes) inspectItem(d);
    }
  }

  return { carbBranch, proteinBranch, carbFood, proteinFood };
}

/**
 * Gestor de Memoria Culinaria Semanal para evitar repeticiones consecutivas y garantizar variedad
 */
export class WeeklyVarietyTracker {
  constructor(player = null) {
    this.player = player;
    this.recentProteins = [];
    this.recentCarbs = [];
    this.recentVeggies = [];
    this.recentFruits = [];
    this.recentDishes = [];
    this.recentBreakfastStyles = [];
    this.currentDayKey = null;
    this.todayLunch = null;
    this.todayPlannedDinner = null;
  }

  startNewDay(dayKey = null) {
    this.currentDayKey = dayKey;
    this.todayLunch = null;
    this.todayPlannedDinner = null;
  }

  setTodayPlannedDinner(dinnerInfo) {
    this.todayPlannedDinner = dinnerInfo;
  }

  getTodayPlannedDinner() {
    return this.todayPlannedDinner;
  }

  setTodayLunch(lunchInfo) {
    this.todayLunch = lunchInfo;
  }

  getTodayLunch() {
    return this.todayLunch;
  }

  recordProtein(item) {
    if (!item) return;
    this.recentProteins.push(item);
    if (this.recentProteins.length > 8) this.recentProteins.shift();
  }

  isProteinRecent(item) {
    return this.recentProteins.includes(item);
  }

  recordCarb(item) {
    if (!item) return;
    this.recentCarbs.push(item);
    if (this.recentCarbs.length > 8) this.recentCarbs.shift();
  }

  isCarbRecent(item) {
    return this.recentCarbs.includes(item);
  }

  recordVeggie(item) {
    if (!item) return;
    this.recentVeggies.push(item);
    if (this.recentVeggies.length > 6) this.recentVeggies.shift();
  }

  isVeggieRecent(item) {
    return this.recentVeggies.includes(item);
  }

  recordFruit(item) {
    if (!item) return;
    this.recentFruits.push(item);
    if (this.recentFruits.length > 6) this.recentFruits.shift();
  }

  isFruitRecent(item) {
    return this.recentFruits.includes(item);
  }

  recordDish(dishName) {
    if (!dishName) return;
    this.recentDishes.push(dishName);
    if (this.recentDishes.length > 8) this.recentDishes.shift();
  }

  isDishRecent(dishName) {
    return this.recentDishes.includes(dishName);
  }

  recordBreakfastStyle(style) {
    if (!style) return;
    this.recentBreakfastStyles.push(style);
    if (this.recentBreakfastStyles.length > 5) this.recentBreakfastStyles.shift();
  }

  isBreakfastStyleRecent(style) {
    return this.recentBreakfastStyles.includes(style);
  }
}

/**
 * Extrae recursivamente todos los nombres de alimentos contenidos en un nodo o subárbol de FOOD_TREE.
 */
export function getFoodsFromTreeNode(node) {
  if (!node) return [];
  const foods = [];
  if (Array.isArray(node.foodNames)) {
    foods.push(...node.foodNames);
  }
  if (node.children) {
    for (const child of Object.values(node.children)) {
      foods.push(...getFoodsFromTreeNode(child));
    }
  }
  return Array.from(new Set(foods));
}

/**
 * Resuelve un nodo genérico de proteína seleccionando entre los nodos disponibles en FOOD_TREE,
 * podados según el perfil clínico del jugador, y eligiendo con rotación variada entre todos sus alimentos.
 */
export function resolveGenericProteinNode(clinicalCatalog, tracker = null, isPreMatch = false, allowEggs = true, foodTree = null) {
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  const proteinChildren = playerTree.children.proteina.children;
  const proteinBranches = Object.entries(proteinChildren)
    .filter(([id]) => allowEggs || id !== 'huevos')
    .map(([id, childNode]) => ({
      id,
      label: childNode.label,
      foods: getAvailableFoods(childNode, playerTree),
    }));

  const validBranches = proteinBranches.filter((b) => b.foods.length > 0);

  if (validBranches.length === 0) {
    const fallbackChicken = getAvailableFoods(playerTree.children.proteina.children.pollo, playerTree)[0];
    if (fallbackChicken) return fallbackChicken;
    const anyProtein = clinicalCatalog?.foods?.find((f) => isAnimalProteinFood(f));
    return anyProtein?.name || null;
  }

  let chosenBranch = null;
  if (validBranches.length === 1) {
    chosenBranch = validBranches[0];
  } else {
    // Si no es un protocolo estricto de partido, excluir activamente la proteína del almuerzo de hoy si hay alternativas
    const todayLunch = tracker?.getTodayLunch();
    let poolBranches = validBranches;
    if (!isPreMatch && todayLunch?.proteinBranch) {
      const nonLunchBranches = validBranches.filter((b) => b.id !== todayLunch.proteinBranch);
      if (nonLunchBranches.length > 0) {
        poolBranches = nonLunchBranches;
      }
    }
    const nonRecentBranches = poolBranches.filter((b) => !tracker?.isProteinRecent(b.id));
    const pool = nonRecentBranches.length > 0 ? nonRecentBranches : poolBranches;
    chosenBranch = pool[Math.floor(Math.random() * pool.length)];
  }

  tracker?.recordProtein(chosenBranch.id);

  const validFoods = chosenBranch.foods;

  if (validFoods.length === 0) return null;
  if (validFoods.length === 1) {
    tracker?.recordProtein(validFoods[0]);
    return validFoods[0];
  }

  const nonRecentFoods = validFoods.filter((f) => !tracker?.isProteinRecent(f));
  const foodPool = nonRecentFoods.length > 0 ? nonRecentFoods : validFoods;
  const chosenFood = foodPool[Math.floor(Math.random() * foodPool.length)];

  tracker?.recordProtein(chosenFood);
  return chosenFood;
}

/**
 * Resuelve un nodo genérico de carbohidratos seleccionando entre las opciones clínicas de FOOD_TREE,
 * variando entre arroz, pasta, tubérculos o legumbres sin repeticiones consecutivas.
 */
export function resolveGenericCarbNode(clinicalCatalog, tracker = null, isPreMatch = false, foodTree = null) {
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  const carbChildren = playerTree.children.hidratos.children;

  const carbBranches = [
    {
      id: 'arroz',
      label: carbChildren.arroz?.label || 'Arroz',
      foods: getAvailableFoods(carbChildren.arroz, playerTree),
    },
    {
      id: 'pasta',
      label: carbChildren.pasta?.label || 'Pasta',
      foods: getAvailableFoods(carbChildren.pasta, playerTree),
    },
    {
      id: 'tuberculos',
      label: carbChildren.tuberculos?.label || 'Tubérculos',
      foods: getAvailableFoods(carbChildren.tuberculos, playerTree),
    },
    {
      id: 'otros_granos',
      label: carbChildren.otros_granos?.label || 'Otros granos y cereales',
      foods: getAvailableFoods(carbChildren.otros_granos, playerTree),
    },
    {
      id: 'legumbres',
      label: carbChildren.legumbres?.label || 'Legumbres',
      foods: getAvailableFoods(carbChildren.legumbres, playerTree),
    },
  ];

  const validBranches = carbBranches.filter((b) => b.foods.length > 0);

  if (validBranches.length === 0) return getAvailableFoods(carbChildren.arroz, playerTree)[0] || null;

  let chosenBranch = null;
  if (validBranches.length === 1) {
    chosenBranch = validBranches[0];
  } else {
    // Si no es un protocolo estricto de partido, excluir activamente el hidrato del almuerzo de hoy si hay alternativas
    const todayLunch = tracker?.getTodayLunch();
    let poolBranches = validBranches;
    if (!isPreMatch && todayLunch?.carbBranch) {
      const nonLunchBranches = validBranches.filter((b) => b.id !== todayLunch.carbBranch);
      if (nonLunchBranches.length > 0) {
        poolBranches = nonLunchBranches;
      }
    }
    const nonRecentBranches = poolBranches.filter((b) => !tracker?.isCarbRecent(b.id));
    const pool = nonRecentBranches.length > 0 ? nonRecentBranches : poolBranches;
    chosenBranch = pool[Math.floor(Math.random() * pool.length)];
  }

  tracker?.recordCarb(chosenBranch.id);

  const validFoods = chosenBranch.foods;

  if (validFoods.length === 0) return null;
  if (validFoods.length === 1) {
    tracker?.recordCarb(validFoods[0]);
    return validFoods[0];
  }

  const nonRecentFoods = validFoods.filter((f) => !tracker?.isCarbRecent(f));
  const foodPool = nonRecentFoods.length > 0 ? nonRecentFoods : validFoods;
  const chosenFood = foodPool[Math.floor(Math.random() * foodPool.length)];

  tracker?.recordCarb(chosenFood);
  return chosenFood;
}

/**
 * Resuelve verduras variadas de guarnición desde FOOD_TREE
 */
export function resolveGenericVeggieNode(clinicalCatalog, tracker = null, isPreMatch = false, foodTree = null) {
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  let candidateFoods = getAvailableFoods(playerTree.children.verduras, playerTree);

  if (isPreMatch) {
    const lowResidue = candidateFoods.filter((f) => {
      const low = f.toLowerCase();
      return !low.includes('col') && !low.includes('brócoli') && !low.includes('brocoli') && !low.includes('alcachofa');
    });
    if (lowResidue.length > 0) candidateFoods = lowResidue;
  }

  const valid = candidateFoods;
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];

  const nonRecent = valid.filter((f) => !tracker?.isVeggieRecent(f));
  const pool = nonRecent.length > 0 ? nonRecent : valid;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  tracker?.recordVeggie(chosen);
  return chosen;
}

/**
 * Resuelve frutas de postre desde FOOD_TREE
 */
export function resolveGenericFruitNode(clinicalCatalog, tracker = null, isPreMatch = false, foodTree = null) {
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  let candidateFoods = getAvailableFoods(playerTree.children.frutas, playerTree)
    .filter((f) => {
      const foodItem = clinicalCatalog?.foodsByNormalizedName?.get(normalizeFoodName(f));
      if (foodItem && hasTreePath(foodItem, 'desecadas')) return false;
      return !String(f || '').toLowerCase().includes('congelada');
    });

  if (isPreMatch) {
    const matchFruits = candidateFoods.filter((f) => {
      const low = f.toLowerCase();
      return low.includes('plátano') || low.includes('platano') || low.includes('manzana') || low.includes('pera');
    });
    if (matchFruits.length > 0) candidateFoods = matchFruits;
  }

  const valid = candidateFoods;
  if (valid.length === 0) return playerTree.children.frutas?.defaultFood || 'Plátano';
  if (valid.length === 1) return valid[0];

  const nonRecent = valid.filter((f) => !tracker?.isFruitRecent(f));
  const pool = nonRecent.length > 0 ? nonRecent : valid;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  tracker?.recordFruit(chosen);
  return chosen;
}

/**
 * Formatea el nombre de pan para presentación culinaria en tostadas.
 */
export function formatBreadForBreakfast(panName) {
  if (!panName) return 'Pan blanco de barra';
  const low = String(panName).trim().toLowerCase();
  if (low.startsWith('tostada') || low.startsWith('torta') || low.startsWith('fajita') || low.startsWith('wrap') || low.startsWith('picos')) {
    return panName;
  }
  return `Tostadas de ${low}`;
}

/**
 * Resuelve un desayuno variado, dinámico y gastronómicamente coherente para un jugador.
 * Selecciona con libertad entre arquetipos de tostadas (embutidos/fiambres, huevos, queso/conservas)
 * y bowls de cereales/avena, rotando estilos e ingredientes a lo largo de la semana.
 */
export function resolveGenericBreakfastMeal(clinicalCatalog, player = null, tracker = null, isPreMatch = false, playerTree = null) {
  const tree = playerTree || getPlayerFoodTree(clinicalCatalog);

  const chooseFromFoods = (foods, isCarb = false) => {
    if (!foods || foods.length === 0) return null;
    if (foods.length === 1) return foods[0];
    const isRecent = (item) => (isCarb ? tracker?.isCarbRecent(item) : tracker?.isProteinRecent(item));
    const nonRecent = foods.filter((f) => !isRecent(f));
    const pool = nonRecent.length > 0 ? nonRecent : foods;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const breadNode = tree.children?.hidratos?.children?.panes;
  const availableBreads = getAvailableFoods(breadNode, tree);

  const cerealNode = tree.children?.hidratos?.children?.cereales_desayuno;
  const availableCereals = getAvailableFoods(cerealNode, tree);

  const embutidosNode = tree.children?.proteina?.children?.embutidos_fiambres;
  const availableEmbutidos = getAvailableFoods(embutidosNode, tree);

  const huevosNode = tree.children?.proteina?.children?.huevos;
  const availableHuevos = getAvailableFoods(huevosNode, tree);

  const yoguresNode = tree.children?.grasas_y_lacteos?.children?.yogures;
  const availableYogures = getAvailableFoods(yoguresNode, tree);

  /*
  const quesosNode = tree.children?.grasas_y_lacteos?.children?.quesos;
  const availableQuesos = getAvailableFoods(quesosNode, tree);

  const conservasNode = tree.children?.proteina?.children?.conservas_pescado;
  const availableConservas = getAvailableFoods(conservasNode, tree);
  */

  const frutosSecosNode = tree.children?.grasas_y_lacteos?.children?.frutos_secos;
  const availableFrutosSecos = getAvailableFoods(frutosSecosNode, tree);

  const panApto = availableBreads.length > 0
    ? (resolveNodeForPlayer('panes', clinicalCatalog, player, tracker, tree) || availableBreads[0])
    : null;

  const styles = [];

  // 1. Tostadas con Embutidos y Fiambres (pechuga de pavo en lonchas, jamón serrano, jamón cocido, lomo embuchado, etc.)
  if (availableBreads.length > 0 && availableEmbutidos.length > 0) {
    styles.push({
      id: 'tostada_embutido',
      getFoods: () => {
        const rawBread = chooseFromFoods(availableBreads, true) || panApto;
        const carb = formatBreadForBreakfast(rawBread);
        const prot = chooseFromFoods(availableEmbutidos, false);
        const fat = Math.random() < 0.7
          ? (resolveNodeForPlayer('aceites', clinicalCatalog, player, tracker, tree) || 'AOVE')
          : (resolveNodeForPlayer('aguacate', clinicalCatalog, player, tracker, tree) || 'Aguacate');
        const fruit = resolveGenericFruitNode(clinicalCatalog, tracker, isPreMatch, tree);
        return { carb, prot, fat, fruit, carbRaw: rawBread };
      },
    });
  }

  // 2. Tostadas con Huevo (revuelto, tortilla francesa, cocido)
  if (availableBreads.length > 0 && availableHuevos.length > 0) {
    styles.push({
      id: 'tostada_huevo',
      getFoods: () => {
        const rawBread = chooseFromFoods(availableBreads, true) || panApto;
        const carb = formatBreadForBreakfast(rawBread);
        const prot = chooseFromFoods(availableHuevos, false);
        const fat = Math.random() < 0.6
          ? (resolveNodeForPlayer('aceites', clinicalCatalog, player, tracker, tree) || 'AOVE')
          : (resolveNodeForPlayer('aguacate', clinicalCatalog, player, tracker, tree) || 'Aguacate');
        const fruit = resolveGenericFruitNode(clinicalCatalog, tracker, isPreMatch, tree);
        return { carb, prot, fat, fruit, carbRaw: rawBread };
      },
    });
  }

  /*
  // 3. Tostadas con Queso Fresco o Conservas de Pescado (comentado temporalmente)
  if (availableBreads.length > 0 && (availableQuesos.length > 0 || availableConservas.length > 0)) {
    styles.push({
      id: 'tostada_queso_pescado',
      getFoods: () => {
        const rawBread = chooseFromFoods(availableBreads, true) || panApto;
        const carb = formatBreadForBreakfast(rawBread);
        const options = [...availableQuesos, ...availableConservas];
        const prot = chooseFromFoods(options, false);
        const fat = resolveNodeForPlayer('aceites', clinicalCatalog, player, tracker, tree) || 'AOVE';
        const fruit = resolveGenericFruitNode(clinicalCatalog, tracker, isPreMatch, tree);
        return { carb, prot, fat, fruit, carbRaw: rawBread };
      },
    });
  }
  */

  // 4. Bowl de Avena / Cereales con Lácteos Proteicos / Yogures y Frutos Secos
  if (availableCereals.length > 0 && availableYogures.length > 0) {
    styles.push({
      id: 'bowl_avena_yogur',
      getFoods: () => {
        const carb = chooseFromFoods(availableCereals, true)
          || resolveNodeForPlayer('cereales_desayuno', clinicalCatalog, player, tracker, tree)
          || 'Copos de avena';
        const prot = chooseFromFoods(availableYogures, false);
        const fat = (availableFrutosSecos.length > 0 ? chooseFromFoods(availableFrutosSecos, false) : null)
          || resolveNodeForPlayer('frutos_secos', clinicalCatalog, player, tracker, tree)
          || 'Nueces';
        const fruit = resolveGenericFruitNode(clinicalCatalog, tracker, isPreMatch, tree);
        return { carb, prot, fat, fruit, carbRaw: carb };
      },
    });
  }

  // 5. Avena con Huevos / Tortitas y Fruta
  if (availableCereals.length > 0 && availableHuevos.length > 0) {
    styles.push({
      id: 'avena_huevo',
      getFoods: () => {
        const carb = chooseFromFoods(availableCereals, true)
          || resolveNodeForPlayer('cereales_desayuno', clinicalCatalog, player, tracker, tree)
          || 'Copos de avena';
        const prot = chooseFromFoods(availableHuevos, false);
        const fat = (availableFrutosSecos.length > 0 ? chooseFromFoods(availableFrutosSecos, false) : null)
          || resolveNodeForPlayer('aguacate', clinicalCatalog, player, tracker, tree)
          || 'Aguacate';
        const fruit = resolveGenericFruitNode(clinicalCatalog, tracker, isPreMatch, tree);
        return { carb, prot, fat, fruit, carbRaw: carb };
      },
    });
  }

  if (styles.length === 0) {
    const fallbackBread = panApto || 'Pan blanco de barra';
    const fallbackProt = availableEmbutidos[0] || availableHuevos[0] || 'Jamón serrano';
    return [formatBreadForBreakfast(fallbackBread), fallbackProt, 'AOVE', 'Plátano'].filter(Boolean).join(', ');
  }

  const nonRecentStyles = styles.filter((s) => !tracker?.isBreakfastStyleRecent(s.id));
  const candidatePool = nonRecentStyles.length > 0 ? nonRecentStyles : styles;
  const chosenStyle = candidatePool[Math.floor(Math.random() * candidatePool.length)];

  tracker?.recordBreakfastStyle(chosenStyle.id);

  const result = chosenStyle.getFoods();
  if (result.prot) tracker?.recordProtein(result.prot);
  if (result.carbRaw) tracker?.recordCarb(result.carbRaw);

  return [result.carb, result.prot, result.fat, result.fruit].filter(Boolean).join(', ');
}

/**
 * Resuelve deterministamente un nodo del árbol para un jugador según su catálogo clínico.
 * - Si es una opción fija/específica (ej: 'Pechuga de pollo'): elección 1 entre 1.
 * - Si es genérica con múltiples opciones: rota aleatoriamente con coherencia sin repetir.
 */
export function resolveNodeForPlayer(nodeOrId, clinicalCatalog, player = null, tracker = null, foodTree = null) {
  if (!nodeOrId) return null;
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);

  // Delegar ramas genéricas raíz
  const normKey = String(nodeOrId?.id || nodeOrId).toLowerCase();
  if (normKey === 'proteina') return resolveGenericProteinNode(clinicalCatalog, tracker, false, true, playerTree);
  if (normKey === 'hidratos') return resolveGenericCarbNode(clinicalCatalog, tracker, false, playerTree);
  if (normKey === 'verduras' || normKey === 'hojas_verdes') return resolveGenericVeggieNode(clinicalCatalog, tracker, false, playerTree);
  if (normKey === 'frutas') return resolveGenericFruitNode(clinicalCatalog, tracker, false, playerTree);

  const node = getNodeFromTree(nodeOrId, playerTree);
  if (!node) return null;

  // Si tiene función de resolución propia (ej. pasta, panes, leches)
  if (typeof node.resolve === 'function' && clinicalCatalog) {
    const resolvedName = node.resolve(clinicalCatalog);
    if (resolvedName && getAvailableFoods({ foodNames: [resolvedName] }, playerTree).length > 0) {
      return resolvedName;
    }
  }

  // Si tiene lista de alimentos candidatos
  if (Array.isArray(node.foodNames) && node.foodNames.length > 0) {
    const validFoods = getAvailableFoods(node, playerTree);

    if (validFoods.length === 1) {
      return validFoods[0]; // 1 entre 1
    }

    if (validFoods.length > 1) {
      const nonRecent = validFoods.filter((f) => !tracker?.isProteinRecent(f));
      const pool = nonRecent.length > 0 ? nonRecent : validFoods;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      tracker?.recordProtein(chosen);
      return chosen;
    }
  }

  // Si es un nodo de nivel superior con hijos (ej. 'proteina'), buscar en sus hijos
  if (node.children) {
    const childList = Object.values(node.children).filter((child) => getAvailableFoods(child, playerTree).length > 0 || child.children);
    if (childList.length === 1) {
      return resolveNodeForPlayer(childList[0], clinicalCatalog, player, tracker, playerTree);
    }
    if (childList.length === 0) return null;
    const nonRecent = childList.filter((c) => !tracker?.isProteinRecent(c.id));
    const pool = nonRecent.length > 0 ? nonRecent : childList;
    const chosenChild = pool[Math.floor(Math.random() * pool.length)];
    tracker?.recordProtein(chosenChild.id);
    return resolveNodeForPlayer(chosenChild, clinicalCatalog, player, tracker, playerTree);
  }

  if (node.defaultFood) {
    if (getAvailableFoods({ foodNames: [node.defaultFood] }, playerTree).length > 0) {
      return node.defaultFood;
    }
  }

  return null;
}

/**
 * Resuelve todos los ingredientes de un plato desglosado contra el árbol
 * clínico/contextual del jugador.
 */
export function resolveDishIngredientsForPlayer(decomposedDish, clinicalCatalog, player = null, tracker = null, foodTree = null) {
  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  if (!decomposedDish) return { safe: false, items: [], reason: 'Plato no especificado' };

  const resolvedItems = [];

  // 1. Hidratos (puede haber más de uno en un plato, por ejemplo pasta + patata)
  const hidratoList = Array.isArray(decomposedDish.hidrato)
    ? decomposedDish.hidrato
    : decomposedDish.hidrato ? [decomposedDish.hidrato] : [];

  for (const hidrato of hidratoList) {
    if (!hidrato) continue;
    const resolvedHidrato = resolveNodeForPlayer(hidrato, clinicalCatalog, player, tracker, playerTree);
    if (!resolvedHidrato) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Hidrato no apto para el jugador (${hidrato})`,
      };
    }
    resolvedItems.push(resolvedHidrato);
  }

  // 2. Proteína (corte específico como 'alitas de pollo', o genérico como 'pollo')
  const proteinaList = Array.isArray(decomposedDish.proteina)
    ? decomposedDish.proteina
    : decomposedDish.proteina ? [decomposedDish.proteina] : [];

  for (const prot of proteinaList) {
    if (!prot) continue;
    const resolvedProt = resolveNodeForPlayer(prot, clinicalCatalog, player, tracker, playerTree);
    if (!resolvedProt) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Proteína no tolerada para el jugador (${prot})`,
      };
    }
    resolvedItems.push(resolvedProt);
  }

  // 3. Verduras
  const verduraList = Array.isArray(decomposedDish.verdura)
    ? decomposedDish.verdura
    : decomposedDish.verdura ? [decomposedDish.verdura] : [];

  for (const verd of verduraList) {
    if (!verd) continue;
    const resolvedVerd = resolveNodeForPlayer(verd, clinicalCatalog, player, tracker, playerTree);
    if (!resolvedVerd) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Verdura no apta para el jugador (${verd})`,
      };
    }
    resolvedItems.push(resolvedVerd);
  }

  // 4. Grasa saludable
  if (decomposedDish.grasa) {
    const resolvedGrasa = resolveNodeForPlayer(decomposedDish.grasa, clinicalCatalog, player, tracker, playerTree)
      || resolveNodeForPlayer('AOVE', clinicalCatalog, player, tracker, playerTree);
    if (!resolvedGrasa) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Grasa no apta para el jugador (${decomposedDish.grasa})`,
      };
    }
    resolvedItems.push(resolvedGrasa);
  }

  // 5. Frutas (ej: postre o fruta fresca)
  const frutaList = Array.isArray(decomposedDish.fruta)
    ? decomposedDish.fruta
    : decomposedDish.fruta ? [decomposedDish.fruta] : [];

  for (const fru of frutaList) {
    if (!fru) continue;
    const resolvedFru = resolveNodeForPlayer(fru, clinicalCatalog, player, tracker, playerTree);
    if (!resolvedFru) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Fruta no apta para el jugador (${fru})`,
      };
    }
    resolvedItems.push(resolvedFru);
  }

  // 6. Lácteos y Yogures
  const lacteoList = Array.isArray(decomposedDish.lacteo)
    ? decomposedDish.lacteo
    : decomposedDish.lacteo ? [decomposedDish.lacteo] : [];

  for (const lac of lacteoList) {
    if (!lac) continue;
    const resolvedLac = resolveNodeForPlayer(lac, clinicalCatalog, player, tracker, playerTree);
    if (!resolvedLac) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Lácteo no apto para el jugador (${lac})`,
      };
    }
    resolvedItems.push(resolvedLac);
  }

  return {
    safe: true,
    dishName: decomposedDish.nombre,
    items: resolvedItems,
  };
}



/**
 * Devuelve las ramas por defecto del Árbol Completo para una toma determinada.
 */
export function getCompleteMealBranches(mealName = 'Comida') {
  const norm = String(mealName || '').toLowerCase();

  if (norm.includes('desayuno')) {
    return [
      { id: 'panes', label: 'Panes y cereales', isGeneric: true, category: 'hidratos' },
      { id: 'huevos', label: 'Proteínas de desayuno (Huevos / Pavo)', isGeneric: true, category: 'proteina' },
      { id: 'frutas', label: 'Fruta fresca', isGeneric: true, category: 'frutas' },
      { id: 'aceites', label: 'Grasa saludable (AOVE / Aguacate)', isGeneric: true, category: 'grasas' },
    ];
  }

  if (norm.includes('merienda') || norm.includes('snack') || norm.includes('almuerzo')) {
    return [
      { id: 'frutas', label: 'Fruta fresca', isGeneric: true, category: 'frutas' },
      { id: 'yogures', label: 'Yogur / Lácteo proteico', isGeneric: true, category: 'lacteos' },
      { id: 'frutos_secos', label: 'Frutos secos / Tostada', isGeneric: true, category: 'grasas' },
    ];
  }

  // Comida o Cena
  return [
    { id: 'hidratos', label: 'Hidratos de carbono', isGeneric: true, category: 'hidratos' },
    { id: 'proteina', label: 'Proteínas', isGeneric: true, category: 'proteina' },
    { id: 'verduras', label: 'Verduras y hortalizas', isGeneric: true, category: 'verduras' },
    { id: 'frutas', label: 'Fruta fresca de temporada', isGeneric: true, category: 'frutas' },
  ];
}

/**
 * Parsea y genera el Árbol Nutricional a partir de un texto introducido en el perfil del jugador.
 * Detecta si es un árbol completo (variadas / vacío), valida restricciones clínicas y detecta términos no reconocidos.
 */
export function buildMealTree(text, mealName = 'Comida', clinicalCatalog = null) {
  const lookupTree = clinicalCatalog ? buildPlayerFoodTree(clinicalCatalog) : FOOD_TREE;
  if (text && typeof text === 'object') {
    // Las alternativas son grupos completos de plato. No deben convertirse en
    // ramas planas porque eso mezclaría los ingredientes de opciones distintas.
    if (Array.isArray(text.alternativas) && text.alternativas.length > 0) {
      return {
        ...text,
        isComplete: false,
        isAlternativeSet: true,
        alternativas: text.alternativas,
        branches: [],
        unrecognized: text.unrecognized || [],
        conflicts: [],
        isValid: true,
        label: text.label || text.alternativas.map((alternative) => alternative.label || alternative.nombre).join(' / '),
      };
    }

    if (Array.isArray(text.branches)) return text;
    if (text.tree && Array.isArray(text.tree.branches)) return text.tree;

    // Si ya viene estructurado por categorías tipadas (nuevo estándar)
    if (text.isComplete !== undefined || text.proteina !== undefined || text.hidrato !== undefined) {
      if (text.isComplete) {
        const branches = getCompleteMealBranches(mealName);
        return {
          ...text,
          isComplete: true,
          branches,
          unrecognized: text.unrecognized || [],
          conflicts: [],
          isValid: true,
          label: text.label || `Árbol completo (${branches.map((b) => b.label).join(' + ')})`,
        };
      }

      const items = [
        ...(Array.isArray(text.hidrato) ? text.hidrato : text.hidrato ? [text.hidrato] : []),
        ...(Array.isArray(text.proteina) ? text.proteina : text.proteina ? [text.proteina] : []),
        ...(Array.isArray(text.verdura) ? text.verdura : text.verdura ? [text.verdura] : []),
        ...(Array.isArray(text.fruta) ? text.fruta : text.fruta ? [text.fruta] : []),
        ...(Array.isArray(text.lacteo) ? text.lacteo : text.lacteo ? [text.lacteo] : []),
        ...(text.grasa && text.grasa !== 'Sin grasa añadida' ? [text.grasa] : []),
      ];

      const branches = [];
      const seenIds = new Set();
      for (const item of items) {
        const node = findTreeNode(item, lookupTree);
        if (node) {
          const nodeId = node.id.toLowerCase();
          if (!seenIds.has(nodeId)) {
            seenIds.add(nodeId);
            const isGen = Boolean(node.isGeneric || !node.isLeaf);
            branches.push({
              id: node.id,
              label: node.label,
              isGeneric: isGen,
              category: node.category || node.id,
              foodName: (!isGen && node.isLeaf) ? (node.foodNames?.[0] || node.label) : null,
            });
          }
        } else {
          const normKey = String(item).toLowerCase();
          if (!seenIds.has(normKey)) {
            seenIds.add(normKey);
            branches.push({
              id: normKey,
              label: item,
              isGeneric: false,
              category: 'especifico',
              foodName: item,
            });
          }
        }
      }

      const fallbackBranches = branches.length > 0 ? branches : getCompleteMealBranches(mealName);
      const isStillComplete = branches.length === 0;

      return {
        ...text,
        isComplete: isStillComplete,
        branches: fallbackBranches,
        unrecognized: text.unrecognized || [],
        conflicts: [],
        isValid: true,
        label: text.label || (isStillComplete ? 'Árbol completo (rotación variada)' : branches.map((b) => b.label).join(' + ')),
      };
    }
  }

  const rawText = String(text?.raw || text || '').trim();
  const normLower = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Detección de árbol completo (ingesta vacía o especificada como variada / libre)
  const isComplete = !rawText || [
    'variadas', 'variado', 'come variable', 'variable', 'libre', 'variadas saludables',
    'opciones variadas dulces saludables', 'variado le gusta comer sano', 'saludable',
  ].some((p) => normLower === p || normLower.startsWith(p));

  if (isComplete) {
    const branches = getCompleteMealBranches(mealName);
    return {
      raw: rawText,
      isComplete: true,
      branches,
      unrecognized: [],
      conflicts: [],
      isValid: true,
      label: `Árbol completo (${branches.map((b) => b.label).join(' + ')})`,
    };
  }

  // Si contiene múltiples alimentos o ramas separadas por coma o '+'
  if (rawText.includes(',') || rawText.includes('+')) {
    const parts = rawText.split(/[,+]/).map((s) => s.trim()).filter(Boolean);
    const branches = [];
    const seenIds = new Set();
    for (const part of parts) {
      const node = findTreeNode(part, lookupTree);
      if (node) {
        const nodeId = node.id.toLowerCase();
        if (!seenIds.has(nodeId)) {
          seenIds.add(nodeId);
          const isGen = Boolean(node.isGeneric || !node.isLeaf);
          branches.push({
            id: node.id,
            label: node.label,
            isGeneric: isGen,
            category: node.category || node.id,
            foodName: (!isGen && node.isLeaf) ? (node.foodNames?.[0] || node.label) : null,
          });
        }
      } else {
        const normKey = part.toLowerCase();
        if (!seenIds.has(normKey)) {
          seenIds.add(normKey);
          branches.push({
            id: normKey,
            label: part,
            isGeneric: false,
            category: 'especifico',
            foodName: part,
          });
        }
      }
    }
    if (branches.length > 0) {
      return {
        raw: rawText,
        isComplete: false,
        branches,
        unrecognized: [],
        conflicts: [],
        isValid: true,
        label: branches.map((b) => b.label).join(' + '),
      };
    }
  }

  // Fallback directo sin regex heurísticos: busca el nodo completo en el árbol
  const singleNode = findTreeNode(rawText, lookupTree);
  if (singleNode) {
    const isGen = Boolean(singleNode.isGeneric || !singleNode.isLeaf);
    return {
      raw: rawText,
      isComplete: false,
      branches: [{
        id: singleNode.id,
        label: singleNode.label,
        isGeneric: isGen,
        category: singleNode.category || singleNode.id,
        foodName: (!isGen && singleNode.isLeaf) ? (singleNode.foodNames?.[0] || singleNode.label) : null,
        defaultFood: singleNode.defaultFood || (singleNode.foodNames ? singleNode.foodNames[0] : null),
      }],
      unrecognized: [],
      conflicts: [],
      isValid: true,
      label: singleNode.label,
    };
  }

  const fallbackBranches = getCompleteMealBranches(mealName);
  return {
    raw: rawText,
    isComplete: true,
    branches: fallbackBranches,
    unrecognized: [],
    conflicts: [],
    isValid: true,
    label: `Árbol completo (${fallbackBranches.map((b) => b.label).join(' + ')})`,
  };
}

/**
 * Resuelve deterministamente el Árbol de una comida para un día concreto (0..6).
 * Rota alimentos aptos sin repetición ('x, y, z') y devuelve el plato listo para calibrar.
 */
export function resolveMealTreeForDay(treeOrRaw, mealName = 'Comida', clinicalCatalog = null, player = null, isPreMatch = false, tracker = null, foodTree = null, isMainMealParam = null) {
  const isMainMeal = checkIsMainMeal(mealName, isMainMealParam ?? treeOrRaw);
  const basePlayerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  const playerTree = buildContextualPlayerFoodTree(basePlayerTree, { mealName, isMainMeal });
  let tree = treeOrRaw;
  if (tree && typeof tree === 'object' && tree.tree && Array.isArray(tree.tree.branches)) {
    tree = tree.tree;
  }
  if (!tree || typeof tree === 'string' || !tree.branches) {
    tree = buildMealTree(treeOrRaw || '', mealName, clinicalCatalog, player, isPreMatch);
  }

  if (!tree.isValid) {
    return `[Fallo en árbol de ${mealName}: ${tree.error || 'Configuración no válida'}]`;
  }

  // La generación normal selecciona las alternativas completas antes de
  // entrar aquí. Evitamos intentar iterar unas ramas inexistentes si este
  // resolver recibe una pauta nueva desde otro punto de la aplicación.
  if (tree.isAlternativeSet) {
    return `[Alternativas de ${mealName} pendientes de seleccionar]`;
  }

  const normMeal = String(mealName || '').toLowerCase();
  const panApto = resolveNodeForPlayer('panes', clinicalCatalog, player, null, playerTree);

  // Si es Árbol Completo, armar el plato según el tipo de toma
  if (tree.isComplete) {
    if (normMeal.includes('desayuno')) {
      return resolveGenericBreakfastMeal(clinicalCatalog, player, tracker, isPreMatch, playerTree);
    }

    if (normMeal.includes('merienda') || normMeal.includes('snack') || normMeal.includes('almuerzo')) {
      const sFruit = resolveGenericFruitNode(clinicalCatalog, tracker, isPreMatch, playerTree);
      const sDairy = resolveNodeForPlayer('yogures', clinicalCatalog, player, tracker, playerTree);
      const sNut = resolveNodeForPlayer('frutos_secos', clinicalCatalog, player, tracker, playerTree);
      return [sFruit, sDairy, sNut].filter(Boolean).join(', ');
    }

    // Comida o Cena completa
    const dCarb = resolveGenericCarbNode(clinicalCatalog, tracker, false, playerTree);
    const dProt = resolveGenericProteinNode(clinicalCatalog, tracker, false, true, playerTree);
    const dVeg = resolveGenericVeggieNode(clinicalCatalog, tracker, isPreMatch, playerTree);
    const dFruit = resolveGenericFruitNode(clinicalCatalog, tracker, isPreMatch, playerTree);
    const dFat = resolveNodeForPlayer('aceites', clinicalCatalog, player, tracker, playerTree);
    return [dCarb, dProt, dVeg, dFruit, dFat].filter(Boolean).join(', ');
  }

  // Árbol con ramas explícitas
  const resolvedParts = [];
  for (const branch of tree.branches) {
    const bId = branch.id.toLowerCase();

    // 1. Si la rama tiene un alimento específico fijado por el usuario o menú:
    if (branch.foodName) {
      // El árbol contextual ya ha resuelto las restricciones clínicas y de
      // composición. Si una recomendación antigua apunta a un alimento que ya
      // no existe en ese árbol, se sustituye por una alternativa de su categoría.
      const fixedFoodNode = getNodeFromTree(branch.foodName, playerTree);
      if (!fixedFoodNode) {
        let fallbackCategory = branch.category || branch.id;
        const norm = normalizeFoodName(branch.foodName);
        const foodItem = clinicalCatalog?.foodsByNormalizedName?.get(norm);
        if (foodItem) {
          if (hasTreePath(foodItem, 'proteina')) {
            fallbackCategory = 'proteina';
          } else if (hasTreePath(foodItem, 'hidratos')) {
            fallbackCategory = 'hidratos';
          } else if (hasTreePath(foodItem, 'verduras')) {
            fallbackCategory = 'verduras';
          } else if (hasTreePath(foodItem, 'frutas')) {
            fallbackCategory = 'frutas';
          } else if (hasTreePath(foodItem, 'grasas') || hasTreePath(foodItem, 'lacteos')) {
            fallbackCategory = 'grasas_y_lacteos';
          }
        }
        const alt = resolveNodeForPlayer(fallbackCategory, clinicalCatalog, player, tracker, playerTree);
        if (alt) {
          resolvedParts.push(alt);
          continue;
        }
        continue;
      }
      resolvedParts.push(branch.foodName);
      continue;
    }

    // 2. Si la rama es un nodo genérico raíz: resolver con variedad coherente
    if (bId === 'hidratos') {
      const carb = resolveGenericCarbNode(clinicalCatalog, tracker, false, playerTree);
      if (carb) resolvedParts.push(carb);
    } else if (bId === 'proteina') {
      const prot = resolveGenericProteinNode(clinicalCatalog, tracker, false, true, playerTree);
      if (prot) resolvedParts.push(prot);
    } else if (bId === 'verduras' || bId === 'hojas_verdes') {
      const veg = resolveGenericVeggieNode(clinicalCatalog, tracker, isPreMatch, playerTree);
      if (veg) resolvedParts.push(veg);
    } else if (bId === 'frutas') {
      const fruit = resolveGenericFruitNode(clinicalCatalog, tracker, isPreMatch, playerTree);
      if (fruit) resolvedParts.push(fruit);
    } else if (bId === 'panes') {
      if (panApto) resolvedParts.push(`Tostadas de ${String(panApto).toLowerCase()}`);
    } else if (bId === 'huevos') {
      const egg = resolveNodeForPlayer('huevos', clinicalCatalog, player, tracker, playerTree);
      if (egg) resolvedParts.push(egg);
    } else if (bId === 'leches') {
      const milk = resolveNodeForPlayer('leches', clinicalCatalog, player, tracker, playerTree);
      if (milk) resolvedParts.push(milk);
    } else if (bId === 'yogures') {
      const yogurt = resolveNodeForPlayer('yogures', clinicalCatalog, player, tracker, playerTree);
      if (yogurt) resolvedParts.push(yogurt);
    } else if (bId === 'agua') {
      resolvedParts.push('Agua mineral');
    } else if (bId === 'embutidos_fiambres') {
      const emb = resolveNodeForPlayer('embutidos_fiambres', clinicalCatalog, player, tracker, playerTree);
      if (emb) resolvedParts.push(emb);
    } else if (bId === 'cereales_desayuno') {
      const cer = resolveNodeForPlayer('cereales_desayuno', clinicalCatalog, player, tracker, playerTree);
      if (cer) resolvedParts.push(cer);
    } else {
      // Rama específica o sub-grupo (ej: 'pescado_blanco', 'pollo', 'tuberculos')
      const specificResolved = resolveNodeForPlayer(branch.id, clinicalCatalog, player, tracker, playerTree);
      if (specificResolved) {
        resolvedParts.push(specificResolved);
      } else if (branch.defaultFood && getNodeFromTree(branch.defaultFood, playerTree)) {
        resolvedParts.push(branch.defaultFood);
      } else {
        const fallbackCat = branch.category || (branch.isFish || branch.isPork ? 'proteina' : null);
        const alt = fallbackCat ? resolveNodeForPlayer(fallbackCat, clinicalCatalog, player, tracker, playerTree) : null;
        if (alt) {
          resolvedParts.push(alt);
        } else if (branch.label) {
          resolvedParts.push(branch.label);
        }
      }
    }
  }

  const cleanParts = resolvedParts.filter(Boolean);

  if (cleanParts.length === 0) {
    return `[Sin pauta definida para ${mealName}]`;
  }

  // Si es comida o cena principal y no tiene grasa explícita, añadir AOVE para cocinado
  const hasFat = cleanParts.some((p) => {
    const food = getResolvedFoodData(p, clinicalCatalog, playerTree);
    if (food && isFatFood(food)) return true;
    const low = String(p || '').toLowerCase();
    return low.includes('aceite') || low.includes('aove') || low.includes('aguacate');
  });
  const hasScalableComponent = cleanParts.some((part) => {
    const food = getResolvedFoodData(part, clinicalCatalog, playerTree);
    const path = Array.isArray(food?.treePath) ? food.treePath.map((value) => String(value).toLowerCase()) : [];
    const isFixedOnlyFood = path[0] === 'frutas' || path[0] === 'lacteos';
    return !isFixedOnlyFood;
  });
  if (isMainMeal && !hasFat && hasScalableComponent) {
    cleanParts.push('AOVE');
  }

  return cleanParts.join(', ');
}

function getResolvedFoodData(foodName, clinicalCatalog, foodTree) {
  if (!foodName) return null;

  const normalizedName = normalizeFoodName(foodName);
  const metadata = PLAYER_TREE_METADATA.get(foodTree);
  const indexedLeaf = metadata?.byName.get(normalizedName);
  if (indexedLeaf?.foodData) return indexedLeaf.foodData;

  const catalogFood = clinicalCatalog?.foodsByNormalizedName?.get(normalizedName);
  if (catalogFood) return catalogFood;

  return null;
}

/**
 * Convierte una comida ya resuelta por el árbol en hojas con sus datos
 * nutricionales. No utiliza similarity ni vuelve a buscar en el catálogo bruto.
 *
 * Devuelve null si alguna parte no es una hoja canónica; en ese caso el
 * generador puede utilizar el adaptador textual legacy para recomendaciones
 * antiguas o entradas no estructuradas.
 */
export function resolveMealTextToFoodItems(mealText, clinicalCatalog, foodTree = null) {
  if (!mealText || typeof mealText !== 'string') return null;
  if (mealText.startsWith('[')) return null;

  const playerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  const parts = mealText
    .replace(/\+/g, ',')
    .replace(/\//g, ',')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const items = parts.map((part) => {
    const toastedMatch = part.match(/^tostadas?\s+de\s+(.+)$/i);
    const lookupName = toastedMatch ? toastedMatch[1].trim() : part;
    const food = getResolvedFoodData(lookupName, clinicalCatalog, playerTree);
    if (!food) return null;

    return {
      name: food.name,
      food,
      grams: null,
    };
  });

  return items.length > 0 && items.every(Boolean) ? items : null;
}

/**
 * Variante estructurada de resolveMealTreeForDay para la generación nueva.
 * Conserva el resolver textual como fuente de compatibilidad, pero entrega
 * directamente las hojas del catálogo cuando todas son canónicas.
 */
export function resolveMealTreeItemsForDay(treeOrRaw, mealName = 'Comida', clinicalCatalog = null, player = null, isPreMatch = false, tracker = null, foodTree = null, isMainMealParam = null) {
  const isMainMeal = checkIsMainMeal(mealName, isMainMealParam ?? treeOrRaw);
  const basePlayerTree = getPlayerFoodTree(clinicalCatalog, foodTree);
  const contextualTree = buildContextualPlayerFoodTree(basePlayerTree, { mealName, isMainMeal });
  const resolvedText = resolveMealTreeForDay(
    treeOrRaw,
    mealName,
    clinicalCatalog,
    player,
    isPreMatch,
    tracker,
    basePlayerTree,
    isMainMeal
  );

  const items = resolveMealTextToFoodItems(resolvedText, clinicalCatalog, contextualTree);
  return items || resolvedText;
}
