import { FOODS_CRUDO, normalizeFoodName } from '@/data/foods-crudo';
import { diceSimilarity, STOP_WORDS } from '@/lib/nutrition/utils';

function isOtherGrainFood(food) {
  return food.category === 'otros_granos';
}

/**
 * ÁRBOL TAXONÓMICO NUTRICIONAL DE NUTRALAB
 * 
 * Permite que cualquier alimento, ingrediente o preferencia del usuario se ubique
 * al nivel de profundidad exacto:
 * - Nivel Genérico / Alto (ej. 'pasta', 'arroz', 'pan', 'leche', 'pollo', 'pescado_blanco'):
 *   Al generar el plan, se consulta el catálogo clínico del jugador y se resuelve a la hoja apta
 *   (ej. celíaco -> "Pasta sin gluten"; tolerante -> "Pasta de trigo").
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
        aves: {
          id: 'aves',
          label: 'Aves y Conejo',
          children: {
            pollo: {
              id: 'pollo',
              label: 'Pollo (Genérico)',
              isGeneric: true,
              defaultFood: 'Pechuga de pollo',
              foodNames: FOODS_CRUDO.filter(
                (f) => f.category === 'carnes_y_aves' && !f.tags?.includes('carne_roja') && !f.tags?.includes('cerdo') && f.name.toLowerCase().includes('pollo')
              ).map((f) => f.name),
            },
            pavo: {
              id: 'pavo',
              label: 'Pavo (Genérico)',
              isGeneric: true,
              defaultFood: 'Pechuga de pavo',
              foodNames: FOODS_CRUDO.filter(
                (f) => f.category === 'carnes_y_aves' && f.name.toLowerCase().includes('pavo')
              ).map((f) => f.name),
            },
            conejo: {
              id: 'conejo',
              label: 'Conejo',
              foodNames: ['Conejo'],
              defaultFood: 'Conejo',
            },
          },
        },
        vacuno: {
          id: 'vacuno',
          label: 'Vacuno / Carne Roja',
          isGeneric: true,
          defaultFood: 'Ternera magra',
          keywords: ['carne', 'carnes', 'ternera', 'vacuno'],
          foodNames: FOODS_CRUDO.filter(
            (f) => f.category === 'carnes_y_aves' && f.tags?.includes('carne_roja')
          ).map((f) => f.name),
        },
        cerdo: {
          id: 'cerdo',
          label: 'Cerdo',
          isPork: true,
          isGeneric: true,
          defaultFood: 'Solomillo de cerdo',
          foodNames: FOODS_CRUDO.filter(
            (f) => f.category === 'carnes_y_aves' && f.tags?.includes('cerdo')
          ).map((f) => f.name),
        },
        pescado_blanco: {
          id: 'pescado_blanco',
          label: 'Pescado blanco (Genérico)',
          isFish: true,
          isGeneric: true,
          defaultFood: 'Merluza',
          keywords: ['pescado', 'pescados'],
          foodNames: FOODS_CRUDO.filter((f) => f.tags?.includes('pescado_blanco')).map((f) => f.name),
        },
        pescado_azul: {
          id: 'pescado_azul',
          label: 'Pescado azul (Genérico)',
          isFish: true,
          isGeneric: true,
          defaultFood: 'Salmón',
          keywords: ['pescado', 'pescados'],
          foodNames: FOODS_CRUDO.filter((f) => f.tags?.includes('pescado_azul')).map((f) => f.name),
        },
        marisco: {
          id: 'marisco',
          label: 'Marisco',
          isSeafood: true,
          isGeneric: true,
          defaultFood: 'Sepia',
          foodNames: FOODS_CRUDO.filter((f) => f.tags?.includes('marisco')).map((f) => f.name),
        },
        huevos: {
          id: 'huevos',
          label: 'Huevos',
          defaultFood: 'Huevo entero',
          keywords: ['huevo', 'huevos', 'tortilla'],
          foodNames: FOODS_CRUDO.filter((f) => f.tags?.includes('huevo')).map((f) => f.name),
        },
        conservas_pescado: {
          id: 'conservas_pescado',
          label: 'Conservas de pescado (Desayunos/Meriendas)',
          defaultFood: 'Atún natural',
          foodNames: ['Atún natural', 'Atún natural conserva natural', 'Atún natural conserva aceite', 'Caballa en conserva (al natural)'],
        },
        vegetal_proteina: {
          id: 'vegetal_proteina',
          label: 'Proteína vegetal',
          defaultFood: 'Tofu firme',
          foodNames: ['Tofu firme', 'Seitán', 'Soja texturizada'],
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
          keywords: ['pasta', 'pastas', 'macarron', 'macarrones', 'espagueti', 'espaguetis', 'fideos'],
          foodNames: FOODS_CRUDO.filter((f) => ['cereales_y_tuberculos', 'otros_granos'].includes(f.category) && f.name.toLowerCase().includes('pasta')).map((f) => f.name),
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('pasta sin gluten') && !catalog.foodsByNormalizedName.has('pasta de trigo')) {
              return 'Pasta sin gluten';
            }
            return 'Pasta de trigo';
          },
        },
        arroz: {
          id: 'arroz',
          label: 'Arroz (Grupo genérico)',
          isGeneric: true,
          defaultFood: 'Arroz blanco',
          foodNames: FOODS_CRUDO.filter(
            (f) => ['cereales_y_tuberculos', 'otros_granos'].includes(f.category) && f.name.toLowerCase().includes('arroz') && !f.name.toLowerCase().includes('tortas')
          ).map((f) => f.name),
          resolve(_catalog) {
            return 'Arroz blanco';
          },
        },
        tuberculos: {
          id: 'tuberculos',
          label: 'Tubérculos',
          defaultFood: 'Patata',
          foodNames: FOODS_CRUDO.filter(
            (f) => ['cereales_y_tuberculos', 'otros_granos'].includes(f.category) && ['patata', 'boniato', 'yuca', 'ñoquis'].some((k) => f.name.toLowerCase().includes(k))
          ).map((f) => f.name),
        },
        panes: {
          id: 'panes',
          label: 'Panes (Grupo genérico)',
          isGeneric: true,
          keywords: ['pan', 'panes', 'tostada', 'tostadas', 'biscote'],
          foodNames: FOODS_CRUDO.filter(
            (f) => ['cereales_y_tuberculos', 'otros_granos'].includes(f.category) && ['pan ', 'pan de', 'tostada', 'biscote', 'pan sin gluten'].some((k) => f.name.toLowerCase().includes(k))
          ).map((f) => f.name),
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('pan sin gluten') && !catalog.foodsByNormalizedName.has('pan blanco de barra')) {
              return 'Pan sin gluten';
            }
            return 'Pan blanco de barra';
          },
        },
        otros_granos: {
          id: 'otros_granos',
          label: 'Otros granos y cereales',
          isGeneric: true,
          foodNames: FOODS_CRUDO.filter(isOtherGrainFood).map((f) => f.name),
        },
        legumbres: {
          id: 'legumbres',
          label: 'Legumbres',
          defaultFood: 'Lenteja',
          foodNames: FOODS_CRUDO.filter((f) => f.category === 'legumbres' && f.name.toLowerCase() !== 'soja texturizada').map((f) => f.name),
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
      foodNames: FOODS_CRUDO.filter((f) => f.category === 'frutas').map((f) => f.name),
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
      foodNames: FOODS_CRUDO.filter((f) => f.category === 'verduras_y_hortalizas').map((f) => f.name),
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
        },
        aguacate: {
          id: 'aguacate',
          label: 'Aguacate',
          defaultFood: 'Aguacate',
          foodNames: ['Aguacate'],
        },
        frutos_secos: {
          id: 'frutos_secos',
          label: 'Frutos secos',
          defaultFood: 'Nueces',
          foodNames: ['Nueces', 'Almendras', 'Crema de cacahuete natural (100% cacahuete)'],
        },
        leches: {
          id: 'leches',
          label: 'Leches (Grupo genérico)',
          isGeneric: true,
          foodNames: [
            'Leche semidesnatada',
            'Leche entera',
            'Leche entera sin lactosa',
            'Leche de avena',
            'Leche de soja sin azúcar',
            'Leche de almendra sin azúcar',
          ],
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
          foodNames: [
            'Yogur natural',
            'Yogur proteico natural',
            'Yogur natural sin lactosa',
            'Yogur proteico sin lactosa',
            'Yogur griego natural',
          ],
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('yogur proteico natural')) return 'Yogur proteico natural';
            return 'Yogur natural';
          },
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

// 1. Indexar ramas y categorías genéricas del árbol
indexTreeNodes(FOOD_TREE);

// 2. Registrar TODOS los alimentos limpios de FOODS_CRUDO como hojas específicas del árbol.
// Tienen prioridad absoluta sobre los nodos genéricos para que alimentos exactos como
// 'Pechuga de pollo', 'Arroz blanco' o 'Salmón' sean hojas específicas (elección 1 entre 1)
// y nunca se diluyan en grupos genéricos.
FOODS_CRUDO.forEach((food) => {
  const norm = food.normalizedName;
  const leafId = norm.replace(/\s+/g, '_');
  const leafNode = {
    id: leafId,
    label: food.name,
    foodNames: [food.name],
    isLeaf: true,
    isGeneric: false,
    category: food.category,
    foodData: food,
  };
  FLAT_NODE_INDEX.set(norm, leafNode);
  FLAT_NODE_INDEX.set(food.name.toLowerCase(), leafNode);
  FLAT_NODE_INDEX.set(leafId, leafNode);
});

/**
 * Busca un nodo en el árbol por su id o por el nombre de un alimento.
 * Utiliza coincidencia exacta O(1), tokenización filtrando STOP_WORDS y similitud Sørensen-Dice.
 */
export function findTreeNode(idOrName) {
  if (!idOrName) return null;
  const norm = normalizeFoodName(idOrName);
  const low = idOrName.toLowerCase().trim();

  // 1. Coincidencia exacta O(1)
  const exact = FLAT_NODE_INDEX.get(norm) || FLAT_NODE_INDEX.get(low);
  if (exact) return exact;

  // 2. Coincidencia por tokens significativos (filtrando STOP_WORDS)
  const queryTokens = norm.split(' ').filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  if (queryTokens.length > 0) {
    if (queryTokens.length === 1) {
      const singleMatch = FLAT_NODE_INDEX.get(queryTokens[0]);
      if (singleMatch) return singleMatch;
    }

    // Buscar si los tokens significativos están contenidos exactamente en algún nodo/alimento
    for (const [key, node] of FLAT_NODE_INDEX.entries()) {
      const keyTokens = key.split(' ').filter((t) => t.length > 2 && !STOP_WORDS.has(t));
      if (queryTokens.length <= keyTokens.length && queryTokens.every((qt) => keyTokens.includes(qt))) {
        return node;
      }
    }
  }

  // 3. Similitud difusa Sørensen-Dice (variaciones morfológicas, plurales/singulares)
  let bestNode = null;
  let bestScore = 0;

  for (const [key, node] of FLAT_NODE_INDEX.entries()) {
    const score = diceSimilarity(norm, key);
    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
      if (score === 1.0) break;
    }
  }

  if (bestScore >= 0.75) {
    return bestNode;
  }

  return null;
}

/**
 * Resuelve deterministamente un nodo del árbol para un jugador según su catálogo clínico.
 * 
 * - Si el nodo es genérico de nivel alto (ej. 'pasta', 'panes', 'leches'):
 *   Aplica la función resolve o busca el primer alimento candidato disponible en el catálogo del jugador
 *   (ej: si es celíaco, resolverá a "Pasta sin gluten"; si tolera, a "Pasta de trigo").
 * 
 * - Si el nodo es específico (ej. 'alitas_pollo', 'contramuslo_pollo', 'solomillo_ternera'):
 *   Devuelve el alimento exacto del catálogo oficial si está permitido en la ficha del jugador.
 */
export function hasPlayerAversion(foodOrDish, player) {
  if (!player?.aversiones || typeof player.aversiones !== 'string') return false;
  const aversionsList = player.aversiones
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (aversionsList.length === 0) return false;

  const target = typeof foodOrDish === 'string'
    ? foodOrDish.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : JSON.stringify(foodOrDish || {}).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return aversionsList.some((av) => {
    const cleanAv = av.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return cleanAv && target.includes(cleanAv);
  });
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
  }

  recordProtein(item) {
    if (!item) return;
    this.recentProteins.push(item);
    if (this.recentProteins.length > 3) this.recentProteins.shift();
  }

  isProteinRecent(item) {
    return this.recentProteins.includes(item);
  }

  recordCarb(item) {
    if (!item) return;
    this.recentCarbs.push(item);
    if (this.recentCarbs.length > 3) this.recentCarbs.shift();
  }

  isCarbRecent(item) {
    return this.recentCarbs.includes(item);
  }

  recordVeggie(item) {
    if (!item) return;
    this.recentVeggies.push(item);
    if (this.recentVeggies.length > 3) this.recentVeggies.shift();
  }

  isVeggieRecent(item) {
    return this.recentVeggies.includes(item);
  }

  recordFruit(item) {
    if (!item) return;
    this.recentFruits.push(item);
    if (this.recentFruits.length > 3) this.recentFruits.shift();
  }

  isFruitRecent(item) {
    return this.recentFruits.includes(item);
  }

  recordDish(dishName) {
    if (!dishName) return;
    this.recentDishes.push(dishName);
    if (this.recentDishes.length > 4) this.recentDishes.shift();
  }

  isDishRecent(dishName) {
    return this.recentDishes.includes(dishName);
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
export function resolveGenericProteinNode(clinicalCatalog, player = null, tracker = null, isPreMatch = false, allowEggs = true) {
  const proteinChildren = FOOD_TREE.children.proteina.children;
  const proteinBranches = Object.entries(proteinChildren)
    .filter(([id]) => id !== 'conservas_pescado' || !isPreMatch)
    .map(([id, childNode]) => ({
      id,
      label: childNode.label,
      foods: getFoodsFromTreeNode(childNode),
    }));

  const tags = new Set(clinicalCatalog?.activeTags || []);

  const validBranches = proteinBranches.filter((b) => {
    if (b.id === 'huevos' && !allowEggs) return false;
    if (b.id === 'cerdo') {
      if (tags.has('sin_cerdo') || hasPlayerAversion('cerdo', player) || isPreMatch) return false;
    }
    if (b.id === 'pescado_blanco' || b.id === 'pescado_azul' || b.id === 'marisco' || b.id === 'conservas_pescado') {
      if (tags.has('sin_pescado') || hasPlayerAversion('pescado', player)) return false;
      if (b.id === 'marisco' && (tags.has('sin_marisco') || hasPlayerAversion('marisco', player))) return false;
      if ((b.id === 'pescado_azul' || b.id === 'marisco') && isPreMatch) return false;
    }
    if (b.id === 'vacuno') {
      if (tags.has('sin_carne_roja') || hasPlayerAversion('ternera', player) || hasPlayerAversion('carne roja', player) || hasPlayerAversion('vacuno', player) || isPreMatch) return false;
    }
    if (b.id === 'huevos') {
      if (tags.has('sin_huevo') || hasPlayerAversion('huevo', player)) return false;
    }
    if (hasPlayerAversion(b.id, player)) return false;
    if (tags.has('vegano')) {
      return b.id === 'vegetal_proteina';
    }
    if (tags.has('vegetariano')) {
      return b.id === 'vegetal_proteina' || b.id === 'huevos';
    }

    // Asegurar que al menos un alimento de la rama está libre de aversiones y está en el catálogo clínico
    const hasAvailableFood = b.foods.some((f) => {
      const norm = normalizeFoodName(f);
      const inCatalog = !clinicalCatalog || clinicalCatalog.foodsByNormalizedName.has(norm);
      return inCatalog && !hasPlayerAversion(f, player);
    });

    return hasAvailableFood;
  });

  if (validBranches.length === 0) return 'Pechuga de pollo';

  let chosenBranch = null;
  if (validBranches.length === 1) {
    chosenBranch = validBranches[0];
  } else {
    const nonRecentBranches = validBranches.filter((b) => !tracker?.isProteinRecent(b.id));
    const pool = nonRecentBranches.length > 0 ? nonRecentBranches : validBranches;
    chosenBranch = pool[Math.floor(Math.random() * pool.length)];
  }

  tracker?.recordProtein(chosenBranch.id);

  const validFoods = chosenBranch.foods.filter((f) => {
    const norm = normalizeFoodName(f);
    const inCatalog = !clinicalCatalog || clinicalCatalog.foodsByNormalizedName.has(norm);
    const noAversion = !hasPlayerAversion(f, player);
    return inCatalog && noAversion;
  });

  if (validFoods.length === 0) return chosenBranch.foods[0];
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
export function resolveGenericCarbNode(clinicalCatalog, player = null, tracker = null, isPreMatch = false, isDinner = false) {
  const isCeliac = clinicalCatalog?.activeTags?.includes('sin_gluten') || hasPlayerAversion('gluten', player);
  const carbChildren = FOOD_TREE.children.hidratos.children;

  const carbBranches = [
    {
      id: 'arroz',
      label: carbChildren.arroz.label,
      foods: isPreMatch
        ? ['Arroz blanco']
        : getFoodsFromTreeNode(carbChildren.arroz).filter((f) => !f.toLowerCase().includes('leche')),
    },
    {
      id: 'pasta',
      label: carbChildren.pasta.label,
      foods: isCeliac ? ['Pasta sin gluten'] : ['Pasta de trigo'],
    },
    {
      id: 'tuberculos',
      label: carbChildren.tuberculos.label,
      foods: isPreMatch ? ['Patata'] : getFoodsFromTreeNode(carbChildren.tuberculos),
    },
    ...(!isPreMatch
      ? [{
          id: 'otros_granos',
          label: carbChildren.otros_granos.label,
          foods: getFoodsFromTreeNode(carbChildren.otros_granos),
        }]
      : []),
    ...(!isPreMatch
      ? [{
          id: 'legumbres',
          label: carbChildren.legumbres.label,
          foods: getFoodsFromTreeNode(carbChildren.legumbres),
        }]
      : []),
  ];

  const validBranches = carbBranches.filter((b) => {
    if (b.id === 'legumbres') {
      if (isDinner) return false;
      if (clinicalCatalog?.activeTags?.includes('sibo_low_fodmap') || clinicalCatalog?.activeTags?.includes('colon_irritable')) return false;
      if (hasPlayerAversion('legumbres', player) || hasPlayerAversion('lentejas', player) || hasPlayerAversion('garbanzos', player)) return false;
    }
    if (hasPlayerAversion(b.id, player)) return false;

    // Asegurar que al menos un alimento de la rama de hidratos está libre de aversiones y está en el catálogo clínico
    const hasAvailableFood = b.foods.some((f) => {
      const norm = normalizeFoodName(f);
      const inCatalog = !clinicalCatalog || clinicalCatalog.foodsByNormalizedName.has(norm);
      return inCatalog && !hasPlayerAversion(f, player);
    });

    return hasAvailableFood;
  });

  if (validBranches.length === 0) return 'Arroz blanco';

  let chosenBranch = null;
  if (validBranches.length === 1) {
    chosenBranch = validBranches[0];
  } else {
    const nonRecentBranches = validBranches.filter((b) => !tracker?.isCarbRecent(b.id));
    const pool = nonRecentBranches.length > 0 ? nonRecentBranches : validBranches;
    chosenBranch = pool[Math.floor(Math.random() * pool.length)];
  }

  tracker?.recordCarb(chosenBranch.id);

  const validFoods = chosenBranch.foods.filter((f) => {
    const norm = normalizeFoodName(f);
    const inCatalog = !clinicalCatalog || clinicalCatalog.foodsByNormalizedName.has(norm);
    const noAversion = !hasPlayerAversion(f, player);
    return inCatalog && noAversion;
  });

  if (validFoods.length === 0) return chosenBranch.foods[0];
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
export function resolveGenericVeggieNode(clinicalCatalog, player = null, tracker = null, _isPreMatch = false) {
  const candidateFoods = getFoodsFromTreeNode(FOOD_TREE.children.verduras);

  const valid = candidateFoods.filter((f) => {
    const norm = normalizeFoodName(f);
    const inCatalog = !clinicalCatalog || clinicalCatalog.foodsByNormalizedName.has(norm);
    const noAversion = !hasPlayerAversion(f, player);
    return inCatalog && noAversion;
  });

  if (valid.length === 0) return 'Calabacín';
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
export function resolveGenericFruitNode(clinicalCatalog, player = null, tracker = null, isPreMatch = false) {
  const candidateFoods = isPreMatch
    ? ['Plátano', 'Manzana', 'Pera']
    : FOOD_TREE.children.frutas.foodNames.filter((f) => !f.toLowerCase().includes('desecada') && !f.toLowerCase().includes('congelada') && !f.toLowerCase().includes('vinagre') && !f.toLowerCase().includes('compota'));

  const valid = candidateFoods.filter((f) => {
    const norm = normalizeFoodName(f);
    const inCatalog = !clinicalCatalog || clinicalCatalog.foodsByNormalizedName.has(norm);
    const noAversion = !hasPlayerAversion(f, player);
    return inCatalog && noAversion;
  });

  if (valid.length === 0) return 'Plátano';
  if (valid.length === 1) return valid[0];

  const nonRecent = valid.filter((f) => !tracker?.isFruitRecent(f));
  const pool = nonRecent.length > 0 ? nonRecent : valid;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  tracker?.recordFruit(chosen);
  return chosen;
}

/**
 * Resuelve deterministamente un nodo del árbol para un jugador según su catálogo clínico.
 * - Si es una opción fija/específica (ej: 'Pechuga de pollo'): elección 1 entre 1.
 * - Si es genérica con múltiples opciones: rota aleatoriamente con coherencia sin repetir.
 */
export function resolveNodeForPlayer(nodeOrId, clinicalCatalog, player = null, tracker = null) {
  if (!nodeOrId) return null;

  // Delegar ramas genéricas raíz
  const normKey = String(nodeOrId?.id || nodeOrId).toLowerCase();
  if (normKey === 'proteina') return resolveGenericProteinNode(clinicalCatalog, player, tracker);
  if (normKey === 'hidratos') return resolveGenericCarbNode(clinicalCatalog, player, tracker);
  if (normKey === 'verduras' || normKey === 'hojas_verdes') return resolveGenericVeggieNode(clinicalCatalog, player, tracker);
  if (normKey === 'frutas') return resolveGenericFruitNode(clinicalCatalog, player, tracker);

  const node = typeof nodeOrId === 'string' ? findTreeNode(nodeOrId) : nodeOrId;
  if (!node) {
    if (clinicalCatalog && clinicalCatalog.foodsByNormalizedName?.has(normalizeFoodName(nodeOrId))) {
      return clinicalCatalog.foodsByNormalizedName.get(normalizeFoodName(nodeOrId)).name;
    }
    return null;
  }

  // Si tiene función de resolución propia (ej. pasta, panes, leches)
  if (typeof node.resolve === 'function' && clinicalCatalog) {
    const resolvedName = node.resolve(clinicalCatalog);
    if (resolvedName && (!clinicalCatalog || clinicalCatalog.foodsByNormalizedName.has(normalizeFoodName(resolvedName)))) {
      return resolvedName;
    }
  }

  // Si tiene lista de alimentos candidatos
  if (Array.isArray(node.foodNames) && node.foodNames.length > 0) {
    const validFoods = node.foodNames.filter((foodName) => {
      const norm = normalizeFoodName(foodName);
      return clinicalCatalog.foodsByNormalizedName.has(norm) && !hasPlayerAversion(foodName, player);
    });

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

  // Si es un nodo de nivel superior con hijos (ej. 'aves'), buscar en sus hijos
  if (node.children) {
    const childList = Object.values(node.children);
    if (childList.length === 1) {
      return resolveNodeForPlayer(childList[0], clinicalCatalog, player, tracker);
    }
    const nonRecent = childList.filter((c) => !tracker?.isProteinRecent(c.id));
    const pool = nonRecent.length > 0 ? nonRecent : childList;
    const chosenChild = pool[Math.floor(Math.random() * pool.length)];
    tracker?.recordProtein(chosenChild.id);
    return resolveNodeForPlayer(chosenChild, clinicalCatalog, player, tracker);
  }

  if (node.defaultFood) {
    if (!clinicalCatalog) return node.defaultFood;
    const normDefault = normalizeFoodName(node.defaultFood);
    if (clinicalCatalog.foodsByNormalizedName.has(normDefault)) {
      return node.defaultFood;
    }
  }

  return null;
}

/**
 * Resuelve todos los ingredientes de un plato desglosado para el perfil clínico de un jugador.
 * - Si contiene un ingrediente con aversión explícita o prohibido: devuelve { safe: false, reason: '...' }
 */
export function resolveDishIngredientsForPlayer(decomposedDish, clinicalCatalog, player = null, tracker = null) {
  if (!decomposedDish) return { safe: false, items: [], reason: 'Plato no especificado' };
  if (hasPlayerAversion(decomposedDish, player)) {
    return { safe: false, items: [], reason: `Aversión personal del jugador al plato` };
  }

  const resolvedItems = [];

  // 1. Hidrato (ej: 'pasta' -> 'Pasta sin gluten' para celíacos)
  if (decomposedDish.hidrato) {
    const resolvedHidrato = resolveNodeForPlayer(decomposedDish.hidrato, clinicalCatalog, player, tracker);
    if (!resolvedHidrato) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Hidrato no apto para el jugador (${decomposedDish.hidrato})`,
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
    const resolvedProt = resolveNodeForPlayer(prot, clinicalCatalog, player, tracker);
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
    const resolvedVerd = resolveNodeForPlayer(verd, clinicalCatalog, player, tracker);
    if (resolvedVerd) {
      resolvedItems.push(resolvedVerd);
    }
  }

  // 4. Grasa saludable
  if (decomposedDish.grasa) {
    const resolvedGrasa = resolveNodeForPlayer(decomposedDish.grasa, clinicalCatalog, player, tracker) || 'AOVE';
    resolvedItems.push(resolvedGrasa);
  }

  // 5. Frutas (ej: postre o fruta fresca)
  const frutaList = Array.isArray(decomposedDish.fruta)
    ? decomposedDish.fruta
    : decomposedDish.fruta ? [decomposedDish.fruta] : [];

  for (const fru of frutaList) {
    if (!fru) continue;
    const resolvedFru = resolveNodeForPlayer(fru, clinicalCatalog, player, tracker) || fru;
    if (resolvedFru) {
      resolvedItems.push(resolvedFru);
    }
  }

  // 6. Lácteos y Yogures
  const lacteoList = Array.isArray(decomposedDish.lacteo)
    ? decomposedDish.lacteo
    : decomposedDish.lacteo ? [decomposedDish.lacteo] : [];

  for (const lac of lacteoList) {
    if (!lac) continue;
    const resolvedLac = resolveNodeForPlayer(lac, clinicalCatalog, player, tracker) || lac;
    if (resolvedLac) {
      resolvedItems.push(resolvedLac);
    }
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
export function getCompleteMealBranches(mealName = 'Comida', _clinicalCatalog = null, _player = null, isPreMatch = false) {
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
  if (isPreMatch) {
    return [
      { id: 'hidratos', label: 'Carbohidrato digestivo (Arroz / Pasta)', isGeneric: true, category: 'hidratos' },
      { id: 'proteina', label: 'Proteína magra limpia (Pollo / Pavo)', isGeneric: true, category: 'proteina' },
      { id: 'verduras', label: 'Verdura suave (Calabacín / Zanahoria)', isGeneric: true, category: 'verduras' },
      { id: 'frutas', label: 'Fruta digestiva (Plátano / Manzana)', isGeneric: true, category: 'frutas' },
    ];
  }

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
export function buildMealTree(text, mealName = 'Comida', clinicalCatalog = null, player = null, isPreMatch = false) {
  if (text && typeof text === 'object') {
    if (Array.isArray(text.branches)) return text;
    if (text.tree && Array.isArray(text.tree.branches)) return text.tree;

    // Si ya viene estructurado por categorías tipadas (nuevo estándar)
    if (text.isComplete !== undefined || text.proteina !== undefined || text.hidrato !== undefined) {
      if (text.isComplete) {
        const branches = getCompleteMealBranches(mealName, clinicalCatalog, player, isPreMatch);
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
        const node = findTreeNode(item);
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

      const fallbackBranches = branches.length > 0 ? branches : getCompleteMealBranches(mealName, clinicalCatalog, player, isPreMatch);
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
    const branches = getCompleteMealBranches(mealName, clinicalCatalog, player, isPreMatch);
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
      const node = findTreeNode(part);
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
  const singleNode = findTreeNode(rawText);
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

  const fallbackBranches = getCompleteMealBranches(mealName, clinicalCatalog, player, isPreMatch);
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
export function resolveMealTreeForDay(treeOrRaw, dayIndex = 0, mealName = 'Comida', clinicalCatalog = null, player = null, isPreMatch = false, tracker = null) {
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

  const normMeal = String(mealName || '').toLowerCase();
  const isDinner = normMeal.includes('cena');
  const isMainMeal = normMeal.includes('comida') || normMeal.includes('cena') || normMeal.includes('almuerzo');
  const isCeliac = clinicalCatalog?.activeTags?.includes('sin_gluten') || hasPlayerAversion('gluten', player);
  const panApto = isCeliac ? 'Pan sin gluten' : 'Pan blanco de barra';

  // Si es Árbol Completo, armar el plato según el tipo de toma
  if (tree.isComplete) {
    if (normMeal.includes('desayuno')) {
      const bCarb = dayIndex % 2 === 0 ? `Tostadas de ${panApto.toLowerCase()}` : 'Copos de avena';
      const bProt = dayIndex % 2 === 0 ? 'Pechuga de pavo' : 'Huevo entero';
      const bFruit = resolveGenericFruitNode(clinicalCatalog, player, tracker, isPreMatch);
      const bFat = dayIndex % 2 === 0 ? 'AOVE' : 'Aguacate';
      return [bCarb, bProt, bFat, bFruit].filter(Boolean).join(', ');
    }

    if (normMeal.includes('merienda') || normMeal.includes('snack') || normMeal.includes('almuerzo')) {
      const sFruit = resolveGenericFruitNode(clinicalCatalog, player, tracker, isPreMatch);
      const sDairy = dayIndex % 2 === 0 ? 'Yogur natural' : 'Yogur proteico natural';
      const sNut = dayIndex % 2 === 0 ? 'Nueces' : 'Almendras';
      return [sFruit, sDairy, sNut].filter(Boolean).join(', ');
    }

    // Comida o Cena completa
    const dCarb = resolveGenericCarbNode(clinicalCatalog, player, tracker, isPreMatch, isDinner);
    const dProt = resolveGenericProteinNode(clinicalCatalog, player, tracker, isPreMatch, !isMainMeal);
    const dVeg = resolveGenericVeggieNode(clinicalCatalog, player, tracker, isPreMatch);
    const dFruit = resolveGenericFruitNode(clinicalCatalog, player, tracker, isPreMatch);
    return [dCarb, dProt, dVeg, dFruit, 'AOVE'].filter(Boolean).join(', ');
  }

  // Árbol con ramas explícitas
  const resolvedParts = [];
  for (const branch of tree.branches) {
    const bId = branch.id.toLowerCase();
    const branchNode = findTreeNode(branch.id);
    const isEggBranch = bId === 'huevos' || branchNode?.id === 'huevos' || branchNode?.foodData?.tags?.includes('huevo');

    if (isMainMeal && isEggBranch) continue;

    // 1. Si la rama tiene un alimento específico fijado por el usuario o menú:
    if (branch.foodName) {
      // Poda clínica: verificar si el alimento fijado entra en conflicto con el perfil clínico o aversiones
      if (hasPlayerAversion(branch.foodName, player) || (clinicalCatalog && !clinicalCatalog.foodsByNormalizedName.has(normalizeFoodName(branch.foodName)))) {
        let fallbackCategory = branch.category || branch.id;
        const norm = normalizeFoodName(branch.foodName);
        const foodItem = FOODS_CRUDO.find((f) => f.normalizedName === norm);
        if (foodItem) {
          if (['carnes_y_aves', 'pescados_y_mariscos', 'huevos'].includes(foodItem.category)) {
            fallbackCategory = 'proteina';
          } else if (['cereales_y_tuberculos', 'otros_granos'].includes(foodItem.category)) {
            fallbackCategory = 'hidratos';
          } else if (foodItem.category === 'verduras') {
            fallbackCategory = 'verduras';
          } else if (foodItem.category === 'frutas') {
            fallbackCategory = 'frutas';
          }
        }
        const alt = resolveNodeForPlayer(fallbackCategory, clinicalCatalog, player, tracker);
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
      resolvedParts.push(resolveGenericCarbNode(clinicalCatalog, player, tracker, isPreMatch, isDinner));
    } else if (bId === 'proteina') {
      resolvedParts.push(resolveGenericProteinNode(clinicalCatalog, player, tracker, isPreMatch, !isMainMeal));
    } else if (bId === 'verduras' || bId === 'hojas_verdes') {
      resolvedParts.push(resolveGenericVeggieNode(clinicalCatalog, player, tracker, isPreMatch));
    } else if (bId === 'frutas') {
      resolvedParts.push(resolveGenericFruitNode(clinicalCatalog, player, tracker, isPreMatch));
    } else if (bId === 'panes') {
      resolvedParts.push(`Tostadas de ${panApto.toLowerCase()}`);
    } else if (bId === 'huevos' && !isMainMeal) {
      resolvedParts.push('Huevo entero');
    } else if (bId === 'leches') {
      resolvedParts.push(resolveNodeForPlayer('leches', clinicalCatalog, player, tracker) || 'Leche semidesnatada');
    } else if (bId === 'yogures') {
      resolvedParts.push(resolveNodeForPlayer('yogures', clinicalCatalog, player, tracker) || 'Yogur natural');
    } else if (bId === 'agua') {
      resolvedParts.push('Agua mineral');
    } else {
      // Rama específica o sub-grupo (ej: 'pescado_blanco', 'aves', 'tuberculos')
      const specificResolved = resolveNodeForPlayer(branch.id, clinicalCatalog, player, tracker);
      if (specificResolved) {
        resolvedParts.push(specificResolved);
      } else if (branch.defaultFood) {
        resolvedParts.push(branch.defaultFood);
      } else {
        resolvedParts.push(branch.label);
      }
    }
  }

  if (resolvedParts.length === 0) {
    return `[Sin pauta definida para ${mealName}]`;
  }

  // Si es comida o cena principal y no tiene grasa explícita, añadir AOVE para cocinado
  const isMain = normMeal.includes('comida') || normMeal.includes('cena') || normMeal.includes('almuerzo');
  const hasFat = resolvedParts.some(p => {
    const low = p.toLowerCase();
    return low.includes('aceite') || low.includes('aove') || low.includes('aguacate') || low.includes('nuez') || low.includes('almendra');
  });
  if (isMain && !hasFat) {
    resolvedParts.push('AOVE');
  }

  return resolvedParts.filter(Boolean).join(', ');
}

/**
 * ----------------------------------------------------------------------------
 * GENERADORES DINÁMICOS DE OPCIONES AGRUPADAS PARA LA INTERFAZ DE USUARIO (MANTINE)
 * ----------------------------------------------------------------------------
 * Se generan 100% automáticamente a partir del catálogo oficial FOODS_CRUDO.
 * Garantiza que cualquier alimento añadido a data/foods-crudo.js aparezca
 * de forma instantánea en su categoría sin duplicar strings ni mantener listas paralelas.
 */

function mapFoodsToItems(foods, seen = new Set()) {
  const items = [];
  foods.forEach((f) => {
    const foodName = typeof f === 'string' ? f : f?.name;
    if (foodName && !seen.has(foodName)) {
      seen.add(foodName);
      items.push({ value: foodName, label: foodName });
    }
  });
  return items;
}

export function getTreeProteinaOptions() {
  const seen = new Set();
  const mapItems = (foods) => mapFoodsToItems(foods, seen);

  const aves = FOODS_CRUDO.filter(
    (f) => f.category === 'carnes_y_aves' && !f.tags?.includes('carne_roja') && !f.tags?.includes('cerdo')
  );
  const ternera = FOODS_CRUDO.filter(
    (f) => f.category === 'carnes_y_aves' && f.tags?.includes('carne_roja')
  );
  const cerdo = FOODS_CRUDO.filter(
    (f) => f.category === 'carnes_y_aves' && f.tags?.includes('cerdo')
  );
  const mariscos = FOODS_CRUDO.filter((f) => f.tags?.includes('marisco'));
  const azules = FOODS_CRUDO.filter((f) => f.tags?.includes('pescado_azul'));
  const blancos = FOODS_CRUDO.filter((f) => f.tags?.includes('pescado_blanco'));

  const vegetalHuevos = FOODS_CRUDO.filter(
    (f) =>
      f.tags?.includes('huevo') ||
      ['tofu firme', 'seitán', 'seitan', 'soja texturizada'].includes(f.name.toLowerCase())
  );

  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'pollo', label: 'Pollo (Genérico)' },
        { value: 'pavo', label: 'Pavo (Genérico)' },
        { value: 'vacuno', label: 'Ternera / Vacuno (Genérico)' },
        { value: 'cerdo', label: 'Cerdo (Genérico)' },
        { value: 'pescado_blanco', label: 'Pescado blanco (Genérico)' },
        { value: 'pescado_azul', label: 'Pescado azul (Genérico)' },
        { value: 'marisco', label: 'Marisco (Genérico)' },
        { value: 'huevos', label: 'Huevos (Genérico)' },
        { value: 'vegetal_proteina', label: 'Proteína vegetal (Genérico)' },
      ],
    },
    { group: 'Aves y Conejo', items: mapItems(aves) },
    { group: 'Ternera y Carnes Rojas', items: mapItems(ternera) },
    { group: 'Cerdo', items: mapItems(cerdo) },
    { group: 'Pescados Blancos', items: mapItems(blancos) },
    { group: 'Pescados Azules y Conservas', items: mapItems(azules) },
    { group: 'Mariscos y Cefalópodos', items: mapItems(mariscos) },
    { group: 'Huevos y Proteína Vegetal', items: mapItems(vegetalHuevos) },
  ];
}

export function getTreeHidratoOptions() {
  const seen = new Set();
  const mapItems = (foods) => mapFoodsToItems(foods, seen);

  const carbFoods = FOODS_CRUDO.filter((f) => ['cereales_y_tuberculos', 'otros_granos'].includes(f.category));

  const pastas = carbFoods.filter((f) => f.name.toLowerCase().includes('pasta'));
  pastas.forEach((f) => seen.add(f.name));

  const arroces = carbFoods.filter(
    (f) => !seen.has(f.name) && f.name.toLowerCase().includes('arroz') && !f.name.toLowerCase().includes('tortas')
  );
  arroces.forEach((f) => seen.add(f.name));

  const tuberculos = carbFoods.filter((f) =>
    ['patata', 'boniato', 'yuca', 'ñoquis', 'noquis'].some((k) => f.name.toLowerCase().includes(k))
  );
  tuberculos.forEach((f) => seen.add(f.name));

  const panesKeywords = ['pan ', 'pan de', 'tostada', 'picos', 'tortas', 'tortilla de trigo', 'biscote'];
  const panes = carbFoods.filter((f) => !seen.has(f.name) && panesKeywords.some((k) => f.name.toLowerCase().includes(k)));
  panes.forEach((f) => seen.add(f.name));

  const granos = carbFoods.filter((f) => !seen.has(f.name) && !f.name.toLowerCase().includes('leche'));
  granos.forEach((f) => seen.add(f.name));

  const legumbres = FOODS_CRUDO.filter((f) => f.category === 'legumbres' && f.name.toLowerCase() !== 'soja texturizada');

  seen.clear();
  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'pasta', label: 'Pasta (Genérica adaptable)' },
        { value: 'arroz', label: 'Arroz (Genérico adaptable)' },
        { value: 'panes', label: 'Panes (Genérico adaptable)' },
        { value: 'tuberculos', label: 'Tubérculos (Genérico)' },
        { value: 'otros_granos', label: 'Otros granos y cereales (Genérico)' },
        { value: 'legumbres', label: 'Legumbres (Genérico)' },
      ],
    },
    { group: 'Pastas', items: mapItems(pastas) },
    { group: 'Arroces', items: mapItems(arroces) },
    { group: 'Tubérculos', items: mapItems(tuberculos) },
    { group: 'Panes y Masas', items: mapItems(panes) },
    { group: 'Granos, Cereales y Semillas', items: mapItems(granos) },
    { group: 'Legumbres', items: mapItems(legumbres) },
  ];
}

export function getTreeVerduraOptions() {
  const seen = new Set();
  const mapItems = (foods) => mapFoodsToItems(foods, seen);

  const verduraFoods = FOODS_CRUDO.filter((f) => f.category === 'verduras_y_hortalizas');
  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'verduras', label: 'Verduras variadas (Genérico)' },
      ],
    },
    { group: 'Verduras y Hortalizas', items: mapItems(verduraFoods) },
  ];
}

export function getTreeFrutaOptions() {
  const seen = new Set();
  const mapItems = (foods) => mapFoodsToItems(foods, seen);

  const frutaFoods = FOODS_CRUDO.filter((f) => f.category === 'frutas' && f.name !== 'Vinagre de manzana');

  const desecadasKeywords = ['desecada', 'compota', 'seco', 'pasta de dátil', 'pasta de datil'];
  const desecadas = frutaFoods.filter((f) => desecadasKeywords.some((k) => f.name.toLowerCase().includes(k)));
  desecadas.forEach((f) => seen.add(f.name));

  const frescas = frutaFoods.filter((f) => !seen.has(f.name));

  seen.clear();
  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'frutas', label: 'Fruta fresca / de temporada (Genérica)' },
      ],
    },
    { group: 'Frutas Frescas', items: mapItems(frescas) },
    { group: 'Frutas Desecadas y Compotas', items: mapItems(desecadas) },
  ];
}

export function getTreeLacteoOptions() {
  const seen = new Set();
  const mapItems = (foods) => mapFoodsToItems(foods, seen);

  const yogurKeywords = ['yogur', 'k\u00e9fir', 'kefir', 'skyr'];
  const quesoKeywords = ['queso', 'reques\u00f3n', 'requeson', 'mozzarella'];
  const lecheKeywords = ['leche'];

  const yogures = FOODS_CRUDO.filter((f) => yogurKeywords.some((k) => f.name.toLowerCase().includes(k)));
  const quesos = FOODS_CRUDO.filter((f) => quesoKeywords.some((k) => f.name.toLowerCase().includes(k)));
  const leches = FOODS_CRUDO.filter(
    (f) => lecheKeywords.some((k) => f.name.toLowerCase().includes(k)) && f.name !== 'Arroz con leche'
  );

  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'yogures', label: 'Yogures (Genérico adaptable)' },
        { value: 'leches', label: 'Leches (Genérico adaptable)' },
        { value: 'quesos', label: 'Quesos (Genérico adaptable)' },
      ],
    },
    { group: 'Yogures y Kéfir', items: mapItems(yogures) },
    { group: 'Quesos', items: mapItems(quesos) },
    { group: 'Leches y Bebidas Vegetales', items: mapItems(leches) },
  ];
}

export function getTreeGrasaOptions() {
  return [
    { value: 'AOVE', label: 'AOVE' },
    { value: 'Aguacate', label: 'Aguacate' },
    { value: 'Frutos secos', label: 'Frutos secos' },
    { value: 'Aceite de coco', label: 'Aceite de coco' },
    { value: 'Sin grasa añadida', label: 'Sin grasa añadida' },
  ];
}


