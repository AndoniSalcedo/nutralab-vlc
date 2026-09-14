import { env } from '@/config/env';
import { aiClient } from '@/lib/ai/client';
import { roundToFive } from '@/lib/utils';
import {
  FOODS_CRUDO,
  FOOD_NAMES_LIST,
  FOODS_BY_NORMALIZED_NAME,
  FOOD_NORMALIZED_NAMES_LIST,
  normalizeFoodName,
} from '@/data/foods-crudo.js';

/**
 * Convierte un requerimiento de calorías de huevo en unidades de huevos enteros y claras
 * 1 clara = 12 kcal
 * 1 huevo = 80 kcal
 */
export function huevosYClarasFromKcal(kcal) {
  // 1 clara = 12 kcal
  // 1 huevo 80
  const K = Math.max(0, Number(kcal) || 0);
  const huevos = Math.floor(K / 80);
  const remainingKcal = K - (huevos * 80);
  const claras = Math.ceil(remainingKcal / 12);

  const partes = [];
  if (huevos > 0) partes.push(`${huevos} Huevo${huevos !== 1 ? 's' : ''}`);
  if (claras > 0) partes.push(`${claras} Clara${claras !== 1 ? 's' : ''}`);
  // Ensure at least 1 Huevo when kcal > 0 but formula yields 0
  if (partes.length === 0 && K > 0) partes.push('1 Huevo');
  return { total: partes.join(' y ') };
}

/**
 * Caché en memoria para alimentos externos o sinónimos resueltos por la IA
 */
const RESOLVED_FOODS_CACHE = new Map();

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'con', 'sin', 'en', 'al', 'a', 'y', 'o',
  'un', 'una', 'unidad', 'unidades', 'fresco', 'fresca', 'frescos', 'frescas',
  'natural', 'crudo', 'cruda'
]);

/**
 * Coeficiente de Sørensen-Dice para similitud de bigramas entre cadenas normalizadas
 */
function diceSimilarity(str1, str2) {
  const s1 = normalizeFoodName(str1).replace(/\s+/g, '');
  const s2 = normalizeFoodName(str2).replace(/\s+/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const b1 = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.slice(i, i + 2);
    b1.set(bg, (b1.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.slice(i, i + 2);
    const count = b1.get(bg) || 0;
    if (count > 0) {
      b1.set(bg, count - 1);
      intersection++;
    }
  }

  return (2.0 * intersection) / (s1.length - 1 + s2.length - 1);
}

/**
 * Algoritmo de Similitud Léxica:
 * Combina coincidencia de palabras raíz (Token Overlap) y similitud de bigramas (Sørensen-Dice)
 * con discriminación clínica de alergias/intolerancias (ej: pasta con vs sin gluten).
 */
export function findFoodBySimilarity(query, options = {}) {
  const normQuery = normalizeFoodName(query);
  if (!normQuery) return null;

  const queryTokens = normQuery.split(' ').filter(t => t.length > 2 && !STOP_WORDS.has(t));

  let bestFood = null;
  let bestScore = 0;
  const targetFoods = options.clinicalCatalog?.foods || FOODS_CRUDO;

  for (const food of targetFoods) {
    const normFood = food.normalizedName;
    const foodTokens = normFood.split(' ').filter(t => t.length > 2 && !STOP_WORDS.has(t));

    let matchingTokens = 0;
    for (const qt of queryTokens) {
      if (foodTokens.includes(qt)) {
        matchingTokens++;
      } else {
        // Tolerancia a singular y plural (ej: tomates -> tomate, zanahorias -> zanahoria)
        const singular = qt.endsWith('es') ? qt.slice(0, -2) : (qt.endsWith('s') ? qt.slice(0, -1) : qt);
        if (foodTokens.some(ft => ft === singular || ft.startsWith(singular) || singular.startsWith(ft))) {
          matchingTokens += 0.85;
        }
      }
    }

    const tokenScore = queryTokens.length > 0 ? (matchingTokens / queryTokens.length) : 0;
    const stringScore = diceSimilarity(normQuery, normFood);

    let totalScore = (tokenScore * 0.6) + (stringScore * 0.4);

    // Priorizaciones culinarias universales:
    // 1. Pollo: "pollo asado", "pollo al horno" -> Pechuga de pollo
    if (queryTokens.includes('pollo') && normFood === 'pechuga de pollo') {
      totalScore += 0.35;
    }

    // 2. Pavo: "pavo pechuga" -> Pechuga de pavo
    if (queryTokens.includes('pavo') && normFood === 'pechuga de pavo') {
      totalScore += 0.35;
    }

    // 4. Secreto: "secreto iberico" -> Secreto de cerdo
    if (queryTokens.includes('secreto') && normFood === 'secreto de cerdo') {
      totalScore += 0.45;
    }

    // 4b. Atún fresco: "atun", "atun fresco" -> Atún fresco (pescado limpio de plato)
    if (queryTokens.includes('atun') && !queryTokens.includes('conserva') && !queryTokens.includes('lata') && normFood === 'atun fresco') {
      totalScore += 0.45;
    }

    // 5. Cuscús: "cous cous" / "couscous" -> Cuscús
    if ((normQuery.includes('cous') || queryTokens.includes('cuscus')) && normFood === 'cuscus') {
      totalScore += 0.45;
    }

    // 6. Huevos y claras:
    const isWheatTortilla = queryTokens.includes('trigo') || queryTokens.includes('integral') || queryTokens.includes('maiz') || queryTokens.includes('wrap') || queryTokens.includes('fajita');
    if (queryTokens.includes('tortilla') && !isWheatTortilla) {
      if (normFood === 'huevo entero') totalScore += 0.95;
      if (normFood.includes('trigo') || normFood.includes('integral')) totalScore -= 0.8;
    }
    if (queryTokens.includes('huevo') || queryTokens.includes('huevos') || queryTokens.includes('revuelto') || queryTokens.includes('revueltos')) {
      if (normFood === 'huevo entero') totalScore += 0.85;
    } else if (queryTokens.includes('clara') || queryTokens.includes('claras')) {
      if (normFood === 'claras de huevo') totalScore += 0.6;
    }

    // 7. Suplementación y recuperación:
    if ((normQuery.includes('batido') || normQuery.includes('recovery')) && normFood.startsWith('batido de proteina')) {
      totalScore += 0.4;
    }

    // 8. Grasas y frutos secos:
    if ((normQuery.includes('aove') || queryTokens.includes('aceite')) && normFood.startsWith('aove')) {
      totalScore += 0.5;
    }
    if (normQuery.includes('cacahuete') && normFood.startsWith('crema de cacahuete')) {
      totalScore += 0.4;
    }
    if (normQuery.includes('tortita') && normFood.startsWith('tortas')) {
      totalScore += 0.4;
    }

    // 9. Rescates de genéricos hacia alimentos oficiales:
    if (normQuery.includes('verdura') && normFood === 'calabacin') {
      totalScore += 0.45;
    }
    if (normQuery.includes('carne') && !queryTokens.some(q => ['pollo', 'pavo', 'ternera', 'cerdo'].includes(q)) && normFood === 'pechuga de pollo') {
      totalScore += 0.4;
    }

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestFood = food;
    }
  }

  if (bestScore >= 0.4) {
    return { food: bestFood, score: bestScore };
  }
  return null;
}

/**
 * Perfiles semánticos de respaldo (Fallback Nivel 3)
 * Todos enlazados a alimentos 100% reales y existentes en el catálogo oficial
 */
const CATEGORY_FALLBACKS = {
  frutas: FOODS_BY_NORMALIZED_NAME.get('platano') || { name: 'Plátano', category: 'frutas', kcal: 90, cho: 20, pro: 1, fat: 0.3 },
  verduras_y_hortalizas: FOODS_BY_NORMALIZED_NAME.get('calabacin') || { name: 'Calabacín', category: 'verduras_y_hortalizas', kcal: 25, cho: 3.5, pro: 1.5, fat: 0.2 },
  pescados_y_mariscos: FOODS_BY_NORMALIZED_NAME.get('merluza') || { name: 'Merluza', category: 'pescados_y_mariscos', kcal: 85, cho: 0, pro: 18, fat: 1 },
  conservas: FOODS_BY_NORMALIZED_NAME.get('atun natural') || { name: 'Atún natural', category: 'conservas', kcal: 116, cho: 0, pro: 26, fat: 1 },
  carnes_y_aves: FOODS_BY_NORMALIZED_NAME.get('pechuga de pollo') || { name: 'Pechuga de pollo', category: 'carnes_y_aves', kcal: 125, cho: 0, pro: 22, fat: 3.5 },
  cereales_y_tuberculos: FOODS_BY_NORMALIZED_NAME.get('arroz blanco') || { name: 'Arroz blanco', category: 'cereales_y_tuberculos', kcal: 360, cho: 75, pro: 10, fat: 1.5 },
  grasas_y_frutos_secos: FOODS_BY_NORMALIZED_NAME.get('aove') || { name: 'AOVE', category: 'grasas_y_frutos_secos', kcal: 884, cho: 0, pro: 0, fat: 100 },
  huevos_y_lacteos: FOODS_BY_NORMALIZED_NAME.get('queso fresco batido desnatado') || { name: 'Queso fresco batido desnatado', category: 'huevos_y_lacteos', kcal: 65, cho: 4, pro: 10, fat: 0.5 },
};

export function findFoodInCatalog(query, options = {}) {
  const norm = normalizeFoodName(query);
  if (!norm) return null;

  // 1. Coincidencia directa instantánea O(1) en catálogo normalizado (>94% de los casos)
  const targetMap = options.clinicalCatalog?.foodsByNormalizedName || FOODS_BY_NORMALIZED_NAME;
  const exact = targetMap.get(norm);
  if (exact) return exact;

  const catalogTagKey = options.clinicalCatalog ? options.clinicalCatalog.activeTags.join('_') : 'all';
  const cacheKey = `${norm}_${catalogTagKey}`;

  // 2. Comprobar en la caché en memoria de resoluciones
  if (RESOLVED_FOODS_CACHE.has(cacheKey)) {
    return RESOLVED_FOODS_CACHE.get(cacheKey);
  }

  // 3. Algoritmo de Similitud Léxica (Token Overlap + Coeficiente de Sørensen-Dice)
  const fuzzyMatch = findFoodBySimilarity(norm, options);
  if (fuzzyMatch && fuzzyMatch.food) {
    RESOLVED_FOODS_CACHE.set(cacheKey, fuzzyMatch.food);
    return fuzzyMatch.food;
  }

  return null;
}

/**
 * Resolución con IA para el 1% de alimentos desconocidos o fuera de catálogo:
 * Consulta a Claude si corresponde a un alimento del catálogo o pide sus macros por 100g en crudo.
 */
export async function resolveUnknownFoodWithAI(foodName) {
  const norm = normalizeFoodName(foodName);
  if (!norm) return CATEGORY_FALLBACKS.verduras_y_hortalizas;

  if (RESOLVED_FOODS_CACHE.has(norm)) {
    return RESOLVED_FOODS_CACHE.get(norm);
  }

  if (!aiClient) {
    // Fallback semántico inmediato si no hay cliente de IA disponible
    const fallback = getSemanticFallback(foodName);
    RESOLVED_FOODS_CACHE.set(norm, fallback);
    return fallback;
  }

  try {
    const sampleNames = FOOD_NAMES_LIST.slice(0, 80).join(', ');
    const response = await aiClient.messages.create({
      model: env.AI_MODEL || env.CHAT_MODEL || 'claude-sonnet-5',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Catálogo oficial de alimentos en crudo:
${sampleNames}

El nutricionista ha nombrado el alimento: "${foodName}".
1. Si corresponde a un alimento del catálogo (ej: "solomillo de vacuno" -> "Solomillo de ternera", "arándanos silvestres" -> "Arándanos"), devuelve:
{ "match": "Nombre exacto del catálogo" }

2. Si es un alimento externo que no está en el catálogo (ej: "Pitaya", "Tirabeques", "Açai"), devuelve sus macros por 100g en crudo:
{ "name": "${foodName}", "category": "frutas|verduras_y_hortalizas|carnes_y_aves|pescados_y_mariscos|cereales_y_tuberculos|grasas_y_frutos_secos|huevos_y_lacteos", "kcal": number, "cho": number, "pro": number, "fat": number }

Devuelve ÚNICAMENTE el objeto JSON sin explicaciones.`,
        },
      ],
    });

    const text = response.content?.[0]?.text?.trim() || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const fallback = getSemanticFallback(foodName);
      RESOLVED_FOODS_CACHE.set(norm, fallback);
      return fallback;
    }
    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.match) {
      const foundInCatalog = findFoodInCatalog(parsed.match);
      if (foundInCatalog) {
        RESOLVED_FOODS_CACHE.set(norm, foundInCatalog);
        return foundInCatalog;
      }
    }

    if (parsed.kcal !== undefined && parsed.cho !== undefined) {
      const customFood = {
        name: parsed.name || foodName,
        category: parsed.category || 'otros_y_suplementos',
        kcal: Number(parsed.kcal) || 100,
        cho: Number(parsed.cho) || 0,
        pro: Number(parsed.pro) || 0,
        fat: Number(parsed.fat) || 0,
      };
      RESOLVED_FOODS_CACHE.set(norm, customFood);
      return customFood;
    }
  } catch (err) {
    console.warn(`No se pudo resolver alimento con IA para "${foodName}":`, err.message);
  }

  const fallback = getSemanticFallback(foodName);
  RESOLVED_FOODS_CACHE.set(norm, fallback);
  return fallback;
}

function getSemanticFallback(foodName) {
  const norm = normalizeFoodName(foodName);
  if (norm.includes('fruta') || norm.includes('baya') || norm.includes('mora') || norm.includes('pitaya') || norm.includes('higo') || norm.includes('ciruela') || norm.includes('cereza')) {
    return CATEGORY_FALLBACKS.frutas;
  }
  if (norm.includes('verdura') || norm.includes('calabacin') || norm.includes('esparrago') || norm.includes('pimiento') || norm.includes('judia') || norm.includes('brocoli') || norm.includes('zanahoria') || norm.includes('tomate') || norm.includes('berenjena') || norm.includes('espinaca') || norm.includes('champiñon') || norm.includes('tirabeque') || norm.includes('kale')) {
    return CATEGORY_FALLBACKS.verduras_y_hortalizas;
  }
  if (norm.includes('pescado') || norm.includes('merluza') || norm.includes('lubina') || norm.includes('dorada') || norm.includes('gamba') || norm.includes('sepia') || norm.includes('calamar') || norm.includes('acedia') || norm.includes('gallo')) {
    return CATEGORY_FALLBACKS.pescados_y_mariscos;
  }
  if (norm.includes('pollo') || norm.includes('pavo') || norm.includes('ternera') || norm.includes('carne') || norm.includes('solomillo') || norm.includes('conejo')) {
    return CATEGORY_FALLBACKS.carnes_y_aves;
  }
  if (norm.includes('arroz') || norm.includes('pasta') || norm.includes('avena') || norm.includes('patata') || norm.includes('boniato') || norm.includes('pan') || norm.includes('quinoa') || norm.includes('cuscus')) {
    return CATEGORY_FALLBACKS.cereales_y_tuberculos;
  }
  if (norm.includes('aceite') || norm.includes('aove') || norm.includes('nuez') || norm.includes('almendra')) {
    return CATEGORY_FALLBACKS.grasas_y_frutos_secos;
  }
  if (norm.includes('conserva') || norm.includes('lata')) {
    return CATEGORY_FALLBACKS.conservas;
  }
  return CATEGORY_FALLBACKS.verduras_y_hortalizas;
}

/**
 * Parsea un ítem de comida extrayendo su nombre y gramos o unidades
 */
export function parseMealItem(itemText, options = {}) {
  const clean = itemText.trim();
  if (!clean) return null;

  // Extraer gramos o mililitros
  const gMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|gramos|ml)/i);
  let grams = gMatch ? parseFloat(gMatch[1]) : null;

  // Ignorar condimentos, especias o aderezos sin gramos o redactados "al gusto"
  const cleanLower = clean.toLowerCase();
  if (
    cleanLower.includes('al gusto') ||
    cleanLower.startsWith('canela') ||
    cleanLower.startsWith('pimienta') ||
    cleanLower.startsWith('orégano') ||
    cleanLower.startsWith('oregano') ||
    cleanLower.startsWith('sal') ||
    cleanLower.startsWith('especias')
  ) {
    if (grams === null) return null;
  }

  // Extraer unidades si no hay gramos
  let hasUnits = false;
  let unitCount = 1;
  const uMatch = clean.match(/(\d+)\s*(?:unidades|unidad|scoop|bote|botella)/i);
  if (uMatch) {
    unitCount = parseInt(uMatch[1], 10);
    // Para huevos no fijar unidad estática para permitir cálculo y calibración dinámica de claras
    if (!clean.toLowerCase().includes('huevo')) {
      hasUnits = true;
    }
    if (grams === null) {
      if (clean.toLowerCase().includes('huevo')) {
        grams = unitCount * 50;
      } else if (clean.toLowerCase().includes('ensure')) {
        grams = 100;
      }
    }
  }

  // Detección de combinaciones explícitas de huevos y claras: ej: "2 Huevos y 3 Claras", "3 Huevos", "4 Claras"
  const eggMatch = clean.match(/(\d+)\s*huevos?/i);
  const claraMatch = clean.match(/(\d+)\s*claras?/i);
  if (eggMatch || claraMatch) {
    const eggCount = eggMatch ? parseInt(eggMatch[1], 10) : 0;
    const claraCount = claraMatch ? parseInt(claraMatch[1], 10) : 0;
    if (grams === null) {
      grams = (eggCount * 50) + (claraCount * 30);
    }
  }

  // El batido post-entreno en polvo o recovery representa 1 ración completa de catálogo
  if (
    clean.toLowerCase().includes('batido de proteina') ||
    clean.toLowerCase().includes('batido de proteína') ||
    clean.toLowerCase().includes('recovery')
  ) {
    grams = 100;
  }

  // Detección de patrones con receta y alimento de catálogo entre paréntesis:
  // Ej: "Patatas splash (Patata 350g)" o "Albóndigas de pavo (Carne picada de pavo 185g)"
  let insideFood = null;
  const parenMatch = clean.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const inside = parenMatch[2].trim();
    const insideGMatch = inside.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|gramos|ml)/i);
    if (insideGMatch) {
      if (grams === null) grams = parseFloat(insideGMatch[1]);
    }
    const insideName = inside.replace(/\b\d+(?:\.\d+)?\s*(?:g|gr|gramos|ml)\b/gi, '').trim();
    if (insideName) {
      insideFood = findFoodInCatalog(insideName, options);
    }
  }

  // Limpiar el nombre para la búsqueda
  let nameOnly = parenMatch ? parenMatch[1].trim() : clean;
  nameOnly = nameOnly
    .replace(/\b\d+(?:\.\d+)?\s*(?:g|gr|gramos|ml)\b/gi, '')
    .replace(/\b\d+\s*(?:unidades|unidad|scoop|bote|botella)\b/gi, '')
    .replace(/[()]/g, '')
    .replace(/^[\s,+-]+|[\s,+-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Búsqueda en catálogo directo (preferir alimento resuelto del paréntesis si existe)
  let food = insideFood || findFoodInCatalog(nameOnly, options);
  if (!food) {
    food = getSemanticFallback(nameOnly);
  }

  // Si no se han especificado gramos (la IA solo envía nombres de ingredientes),
  // asignar la ración estándar de referencia según la naturaleza del alimento.
  // Luego calibrateMeal recalculará matemáticamente el cereal, la proteína y el AOVE.
  if (grams === null) {
    if (food?.defaultGrams) {
      grams = food.defaultGrams;
    } else {
      const cat = food?.category || '';
      const nLow = nameOnly.toLowerCase();
      if (cat === 'frutas' || nLow.includes('manzana') || nLow.includes('platano') || nLow.includes('naranja') || nLow.includes('pera') || nLow.includes('melon') || nLow.includes('sandia') || nLow.includes('fresa') || nLow.includes('kiwi') || nLow.includes('arandano')) {
        grams = nLow.includes('platano') ? 120 : 150;
      } else if (cat === 'verduras_y_hortalizas' || nLow.includes('espinaca') || nLow.includes('brocoli') || nLow.includes('calabacin') || nLow.includes('zanahoria') || nLow.includes('tomate') || nLow.includes('pimiento') || nLow.includes('puerro') || nLow.includes('guisante')) {
        grams = 100;
      } else if (nLow.includes('chocolate') || nLow.includes('cacao')) {
        grams = 20; // Ración estándar deportiva: 15-20g (1-2 onzas), jamás 100g
      } else if (nLow.includes('semilla') || nLow.includes('chía') || nLow.includes('chia') || nLow.includes('calabaza') || nLow.includes('lino') || nLow.includes('sesamo') || nLow.includes('sésamo')) {
        grams = 15; // Ración deportiva estándar de semillas: 15g
      } else if (cat === 'grasas_y_frutos_secos' || cat === 'frutos_secos_y_semillas' || nLow.includes('nuez') || nLow.includes('almendra') || nLow.includes('cacahuete') || nLow.includes('avellana') || nLow.includes('anacardo') || nLow.includes('pistacho')) {
        grams = 25;
      } else if (cat === 'aceites_y_grasas' || nLow.includes('aove') || nLow.includes('aceite')) {
        grams = 15;
      } else if (cat === 'lacteos_y_huevos') {
        if (nLow.includes('huevo')) {
          grams = 100; // 2 huevos base (100g = 160 kcal) sin fijar a 1 unidad estática
        } else if (nLow.includes('yogur')) {
          grams = 125;
        } else if (nLow.includes('queso fresco')) {
          grams = 60;
        } else {
          grams = 100;
        }
      } else if (cat === 'carnes_y_aves' || cat === 'pescados_y_mariscos') {
        grams = 150;
      } else if (cat === 'conservas') {
        grams = 60; // 1 lata escurrida estándar de conserva
      } else if (cat === 'cereales_y_tuberculos') {
        grams = nLow.includes('patata') || nLow.includes('boniato') ? 200 : 100;
      } else {
        grams = 100;
      }
    }
  }

  // Si el alimento tiene límites propios en el catálogo, aplicarlos
  if (food?.maxGrams && grams > food.maxGrams) {
    grams = food.maxGrams;
  }
  if (food?.minGrams && grams < food.minGrams) {
    grams = food.minGrams;
  }

  const displayName = food?.name || (nameOnly.charAt(0).toUpperCase() + nameOnly.slice(1));

  return {
    rawText: clean,
    name: displayName,
    grams,
    hasUnits,
    unitCount,
    food,
  };
}


/**
 * Calibrador de precisión:
 * Ajusta matemáticamente los gramos del cereal/tubérculo y de la proteína principal
 * redondeando SIEMPRE a múltiplos de 5 gramos (ej: 193g -> 195g).
 */
export async function calibrateMeal(mealDetailStr, targetBudget, options = {}) {
  if (!mealDetailStr || typeof mealDetailStr !== 'string') return mealDetailStr;
  if (!targetBudget) return mealDetailStr;

  const lower = mealDetailStr.toLowerCase();

  // Pauta fija de post-partido vs post-entreno
  const isPostOrRecovery =
    lower.includes('batido de proteina') ||
    lower.includes('batido de proteína') ||
    lower.includes('post-entreno') ||
    lower.includes('post-partido') ||
    lower.includes('recovery') ||
    (options.mealName && options.mealName.toLowerCase().includes('post'));

  const isMatchPost =
    lower.includes('recovery') ||
    lower.includes('post-partido') ||
    (options.isMatchDay && isPostOrRecovery);

  if (isMatchPost) {
    return 'Recovery y fruta';
  }

  if (isPostOrRecovery) {
    if (lower.includes('vegetal') || options.hasCowProteinAllergy || options.isVegan) {
      return 'Batido de proteína vegetal 30g disuelto en agua';
    }
    if (lower.includes('sin lactosa') || options.isLactoseIntolerant) {
      return 'Batido de proteína sin lactosa 30g disuelto en agua';
    }
    return 'Batido de proteína 30g disuelto en agua';
  }

  // Separar ingredientes
  const rawParts = mealDetailStr.split(',').map(s => s.trim()).filter(Boolean);
  if (rawParts.length === 0) return mealDetailStr;

  let parsedItems = [];
  for (const part of rawParts) {
    const parsed = parseMealItem(part, options);
    if (parsed) {
      // Si el alimento no se encontró en catálogo oficial, intentar resolver con IA
      if (!findFoodInCatalog(parsed.name, options)) {
        parsed.food = await resolveUnknownFoodWithAI(parsed.name);
        if (parsed.food?.name) {
          parsed.name = parsed.food.name;
        }
      }
      parsedItems.push(parsed);
    }
  }

  if (parsedItems.length === 0) return mealDetailStr;

  // Consolidar duplicados del mismo alimento (ej: dos entradas de "Arroz blanco")
  const consolidatedMap = new Map();
  parsedItems.forEach(it => {
    const key = normalizeFoodName(it.food?.name || it.name);
    if (consolidatedMap.has(key)) {
      const existing = consolidatedMap.get(key);
      existing.grams = (existing.grams || 100) + (it.grams || 100);
      if (it.hasUnits) existing.unitCount = (existing.unitCount || 1) + (it.unitCount || 1);
    } else {
      consolidatedMap.set(key, { ...it });
    }
  });
  parsedItems = Array.from(consolidatedMap.values());



  // REPARTO CLÍNICO EN COMIDAS DE ALTA CONCENTRACIÓN DE HIDRATOS (POSTRE DE FRUTA):
  // Si la comida concentra muchos hidratos (>80g), se incluye postre de fruta fresca dentro de la misma
  // para evitar montañas indigeribles de un solo cereal/tubérculo en el plato principal.
  const hasFruit = parsedItems.some(it => it.food?.category === 'frutas');
  if (targetBudget.hc >= 80 && !hasFruit) {
    const dessertFruit = parseMealItem('Plátano 120g') || parseMealItem('Manzana 150g');
    if (dessertFruit) parsedItems.push(dessertFruit);
  }

  // Identificar roles de alimentos
  let primaryCarbIndex = -1;
  let maxChoPriority = -1; // 2: Cereal/tubérculo de plato, 1: Pan/tortas/harinas, 0: otros
  let maxChoDensity = -1;

  let primaryProteinIndex = -1;
  let maxProDensity = -1;

  let primaryFatIndex = -1;

  const isMainMeal = options.mealName && (
    options.mealName.toLowerCase().includes('comida') ||
    options.mealName.toLowerCase().includes('cena')
  );

  // En comidas y cenas principales, el atún de plato debe ser pescado fresco (Atún fresco)
  if (isMainMeal) {
    parsedItems.forEach(it => {
      const itCat = it.food?.category || '';
      const itNameLow = (it.food?.name || it.name).toLowerCase();
      if ((itCat === 'conservas' || itNameLow.includes('conserva') || itNameLow.includes('natural')) && (itNameLow.includes('atun') || itNameLow.includes('atún'))) {
        const freshTuna = findFoodInCatalog('Atún fresco', options);
        if (freshTuna) {
          it.food = freshTuna;
          it.name = freshTuna.name;
        }
      }
    });
  }

  parsedItems.forEach((it, idx) => {
    const cat = it.food?.category || '';
    const nameLow = (it.food?.name || it.name).toLowerCase();
    const isFixed = nameLow.includes('ensure') || nameLow.includes('batido') || nameLow.includes('recovery');
    if (isFixed) return;

    // Hidrato primario
    const isFruit = cat.includes('frutas') || it.food?.category === 'frutas';
    if (!isFruit && (cat === 'cereales_y_tuberculos' || (it.food?.cho || 0) > 15)) {
      const isDishCarb = nameLow.includes('arroz') || nameLow.includes('pasta') || nameLow.includes('patata') || nameLow.includes('boniato') || nameLow.includes('batata') || nameLow.includes('quinoa') || nameLow.includes('cuscus') || nameLow.includes('cuscús') || nameLow.includes('fideo') || nameLow.includes('gnocchi') || nameLow.includes('ñoqui') || nameLow.includes('lenteja') || nameLow.includes('garbanzo') || nameLow.includes('alubia') || nameLow.includes('avena');
      const isBread = nameLow.includes('pan') || nameLow.includes('torta') || nameLow.includes('biscote') || nameLow.includes('tostada');

      // En comidas y cenas principales, los cereales/tubérculos de plato tienen prioridad absoluta (2) sobre el pan (0.5)
      let carbPriority = 1;
      if (isDishCarb) {
        carbPriority = isMainMeal ? 2 : 1.5;
      } else if (isBread && isMainMeal) {
        carbPriority = 0.5; // El pan en comida/cena solo debe ser primario si no existe ninguna otra opción de plato
      }

      if (carbPriority > maxChoPriority || (carbPriority === maxChoPriority && (it.food.cho || 0) > maxChoDensity)) {
        maxChoPriority = carbPriority;
        maxChoDensity = it.food.cho || 0;
        primaryCarbIndex = idx;
      }
    }

    // Proteína primaria (carne, ave, pescado, conservas o claras escalables)
    if (cat === 'carnes_y_aves' || cat === 'pescados_y_mariscos' || cat === 'conservas' || (cat === 'huevos_y_lacteos' && it.food.pro > 10)) {
      if (it.food.pro > maxProDensity) {
        maxProDensity = it.food.pro;
        primaryProteinIndex = idx;
      }
    }

    // Grasa primaria (AOVE)
    if (cat === 'grasas_y_frutos_secos' || it.name.toLowerCase().includes('aove') || it.name.toLowerCase().includes('aceite')) {
      primaryFatIndex = idx;
    }
  });

  // En comidas y cenas principales, evitar duplicar dos proteínas principales compitiendo (ej: atún + pollo)
  if (isMainMeal) {
    const proteinIndices = [];
    parsedItems.forEach((it, idx) => {
      const cat = it.food?.category || '';
      if (cat === 'carnes_y_aves' || cat === 'pescados_y_mariscos') {
        proteinIndices.push(idx);
      }
    });
    if (proteinIndices.length > 1) {
      const toRemove = proteinIndices.slice(1);
      const primaryItem = parsedItems[proteinIndices[0]];
      const primaryCarbItem = primaryCarbIndex !== -1 ? parsedItems[primaryCarbIndex] : null;
      parsedItems = parsedItems.filter((_, idx) => !toRemove.includes(idx));
      primaryProteinIndex = parsedItems.indexOf(primaryItem);
      if (primaryCarbItem) primaryCarbIndex = parsedItems.indexOf(primaryCarbItem);
    }
  }

  // En comida o cena, si el pan es un acompañamiento secundario junto a un plato principal, limitar su ración a 30-40g
  if (isMainMeal && primaryCarbIndex !== -1) {
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryCarbIndex) {
        const nameLow = (it.food?.name || it.name).toLowerCase();
        if (nameLow.includes('pan')) {
          it.grams = Math.min(40, it.grams || 40);
        }
      }
    });

    // En comidas y cenas, evitar duplicar dos bases de plato de la misma categoría de cereal/pasta compitiendo
    const CEREAL_BASE_KEYWORDS = ['arroz', 'pasta', 'fideo', 'fideua', 'fideuà', 'tallarin', 'espagueti', 'macarron', 'noodle', 'lasaña', 'cuscus', 'cuscús', 'gnocchi', 'ñoqui'];
    const primaryNameLow = (parsedItems[primaryCarbIndex].food?.name || parsedItems[primaryCarbIndex].name).toLowerCase();
    const isPrimaryCereal = CEREAL_BASE_KEYWORDS.some(kw => primaryNameLow.includes(kw));

    if (isPrimaryCereal) {
      const competingIndices = [];
      parsedItems.forEach((it, idx) => {
        if (idx !== primaryCarbIndex) {
          const nameLow = (it.food?.name || it.name).toLowerCase();
          const isOtherCereal = CEREAL_BASE_KEYWORDS.some(kw => nameLow.includes(kw));
          if (isOtherCereal) {
            competingIndices.push(idx);
          }
        }
      });

      if (competingIndices.length > 0) {
        let bestIndex = primaryCarbIndex;
        competingIndices.forEach(idx => {
          if ((parsedItems[idx].grams || 0) > (parsedItems[bestIndex].grams || 0)) {
            bestIndex = idx;
          }
        });

        const toRemove = [primaryCarbIndex, ...competingIndices].filter(i => i !== bestIndex);
        const bestItem = parsedItems[bestIndex];
        console.warn(`[NUTRICIÓN] Purgando cereal secundario incompatible en comida principal para evitar duplicar bases.`);
        parsedItems = parsedItems.filter((_, idx) => !toRemove.includes(idx));
        primaryCarbIndex = parsedItems.indexOf(bestItem);
        if (primaryCarbIndex === -1) {
          primaryCarbIndex = 0;
        }
      }
    }
  }

  // Si hay claras y huevos enteros en desayuno, preferir calibrar las claras líquidas
  const clarasIdx = parsedItems.findIndex(it => it.name.toLowerCase().includes('clara'));
  if (clarasIdx !== -1) {
    primaryProteinIndex = clarasIdx;
  }

  // Purgar bebidas o líquidos (como agua de coco) asignados por error a una comida o cena principal de plato
  if (isMainMeal) {
    const liquidIdx = parsedItems.findIndex(it => it.name.toLowerCase().includes('agua de coco'));
    if (liquidIdx !== -1) {
      parsedItems = parsedItems.filter((_, idx) => idx !== liquidIdx);
      if (primaryCarbIndex > liquidIdx) primaryCarbIndex--;
      if (primaryProteinIndex > liquidIdx) primaryProteinIndex--;
      if (primaryFatIndex > liquidIdx) primaryFatIndex--;
    }
  }

  // RED DE SEGURIDAD OBLIGATORIA DE PROTEÍNA EN COMIDAS Y CENAS:
  // Si en una comida o cena principal no hay fuente de proteína limpia (carnes_y_aves, pescados_y_mariscos, huevos),
  // inyectar automáticamente una proteína limpia y segura del catálogo para garantizar siempre los requerimientos nutricionales
  if (isMainMeal && primaryProteinIndex === -1) {
    const isCena = options.mealName && options.mealName.toLowerCase().includes('cena');
    const candidates = isCena
      ? ['Merluza', 'Dorada', 'Lubina', 'Pechuga de pavo', 'Pechuga de pollo', 'Huevo entero', 'Tofu firme']
      : ['Pechuga de pollo', 'Pechuga de pavo', 'Ternera magra', 'Merluza', 'Dorada', 'Huevo entero', 'Tofu firme'];

    let chosenFood = null;
    for (const cand of candidates) {
      const found = findFoodInCatalog(cand, options);
      if (found && (found.category === 'carnes_y_aves' || found.category === 'pescados_y_mariscos' || found.category === 'huevos_y_lacteos' || found.category === 'legumbres')) {
        chosenFood = found;
        break;
      }
    }

    if (!chosenFood) {
      chosenFood = CATEGORY_FALLBACKS.carnes_y_aves;
    }

    const isEgg = chosenFood.name.toLowerCase().includes('huevo');
    const rescueItem = {
      rawText: chosenFood.name,
      name: chosenFood.name,
      grams: isEgg ? 100 : 150,
      hasUnits: false,
      unitCount: isEgg ? 2 : 1,
      food: chosenFood,
    };

    const insertIdx = primaryCarbIndex !== -1 ? primaryCarbIndex + 1 : 0;
    parsedItems.splice(insertIdx, 0, rescueItem);
    primaryProteinIndex = insertIdx;
    if (primaryCarbIndex >= insertIdx && primaryCarbIndex !== -1) primaryCarbIndex++;
    if (primaryFatIndex >= insertIdx) primaryFatIndex++;
  }

  // 1. Calibrar Carbohidratos:
  // Calcular hidratos de alimentos no primarios (frutas, verduras, lácteos, salsas, ensure)
  let nonPrimaryCarbs = 0;
  parsedItems.forEach((it, idx) => {
    if (idx !== primaryCarbIndex) {
      const c = (it.grams / 100) * (it.food.cho || 0);
      nonPrimaryCarbs += c;
    }
  });

  if (primaryCarbIndex !== -1) {
    const carbItem = parsedItems[primaryCarbIndex];
    const choFactor = (carbItem.food.cho || 20) / 100;
    const neededCho = Math.max(0, targetBudget.hc - nonPrimaryCarbs);
    let exactCarbGrams = roundToFive(neededCho / choFactor);

    if (carbItem.food?.minGrams) exactCarbGrams = Math.max(carbItem.food.minGrams, exactCarbGrams);
    if (carbItem.food?.maxGrams) exactCarbGrams = Math.min(carbItem.food.maxGrams, exactCarbGrams);

    carbItem.grams = roundToFive(exactCarbGrams);
  }

  // En comidas y cenas principales (isMainMeal), si hay carne, ave o pescado,
  // purgar yogures o lácteos secundarios que canibalizan la proteína del plato principal
  if (isMainMeal && primaryProteinIndex !== -1) {
    const dairyIndices = [];
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryProteinIndex) {
        const itNameLow = (it.food?.name || it.name).toLowerCase();
        if (itNameLow.includes('yogur') || (itNameLow.includes('queso') && (it.grams || 0) > 60)) {
          dairyIndices.push(idx);
        }
      }
    });
    if (dairyIndices.length > 0) {
      const primaryItem = parsedItems[primaryProteinIndex];
      const primaryCarbItem = primaryCarbIndex !== -1 ? parsedItems[primaryCarbIndex] : null;
      parsedItems = parsedItems.filter((_, idx) => !dairyIndices.includes(idx));
      primaryProteinIndex = parsedItems.indexOf(primaryItem);
      if (primaryProteinIndex === -1) primaryProteinIndex = 0;
      if (primaryCarbItem) primaryCarbIndex = parsedItems.indexOf(primaryCarbItem);
    }
  }

  // 2. Calibrar Proteínas:
  // Calcular proteína ya aportada por el cereal calibrado, verduras, ensure, lácteos, etc.
  let nonPrimaryProtein = 0;
  parsedItems.forEach((it, idx) => {
    if (idx !== primaryProteinIndex) {
      const p = (it.grams / 100) * (it.food.pro || 0);
      nonPrimaryProtein += p;
    }
  });

  if (primaryProteinIndex !== -1) {
    const proteinItem = parsedItems[primaryProteinIndex];
    const proFactor = (proteinItem.food.pro || 20) / 100;
    const neededPro = Math.max(0, targetBudget.p - nonPrimaryProtein);
    let exactProteinGrams = roundToFive(neededPro / proFactor);

    if (proteinItem.food?.minGrams) exactProteinGrams = Math.max(proteinItem.food.minGrams, exactProteinGrams);
    if (proteinItem.food?.maxGrams) exactProteinGrams = Math.min(proteinItem.food.maxGrams, exactProteinGrams);

    proteinItem.grams = roundToFive(exactProteinGrams);
  }

  // 3. Calibrar Grasas (AOVE):
  let nonPrimaryFat = 0;
  parsedItems.forEach((it, idx) => {
    if (idx !== primaryFatIndex) {
      const f = (it.grams / 100) * (it.food.fat || 0);
      nonPrimaryFat += f;
    }
  });

  if (primaryFatIndex !== -1) {
    const fatItem = parsedItems[primaryFatIndex];
    const fatFactor = (fatItem.food.fat || 100) / 100;
    const neededFat = Math.max(0, targetBudget.g - nonPrimaryFat);
    let exactFatGrams = roundToFive(neededFat / fatFactor);
    const minFat = fatItem.food?.minGrams ?? 5;
    const maxFat = fatItem.food?.maxGrams ?? 25;
    exactFatGrams = Math.max(minFat, Math.min(maxFat, exactFatGrams));
    fatItem.grams = roundToFive(exactFatGrams);
  }

  // Respetar topes máximos y mínimos de cualquier alimento que los tenga definidos en catálogo
  parsedItems.forEach(it => {
    if (it.food?.maxGrams && it.grams > it.food.maxGrams) {
      it.grams = it.food.maxGrams;
    }
    if (it.food?.minGrams && it.grams < it.food.minGrams) {
      it.grams = it.food.minGrams;
    }
  });

  // Reconstruir la descripción con formato limpio, profesional y elegante
  const resultParts = parsedItems.map(it => {
    let cleanName = (it.food?.name || it.name).trim();

    // Sanitización de nombres para presentación impecable
    cleanName = cleanName
      .replace(/\s*\/\s*desnatado/gi, '')
      .replace(/\s*\([^)]*mercadona[^)]*\)/gi, '')
      .replace(/\s*hacendado\/mercadona/gi, '')
      .replace(/\s*danone/gi, '')
      .replace(/\s*-\s*conserva\s*natural/gi, '')
      .replace(/\s*-\s*alto\s*prote[ií]na/gi, ' proteico')
      .replace(/arla\/mercadona/gi, '')
      .replace(/\s*1ud\s*/gi, '')
      .replace(/\s+unidad\s+1ud/gi, '')
      .replace(/\s*-\s*crudo/gi, '')
      .replace(/cous cous cuscús/gi, 'Cuscús')
      .replace(/patatas? splash patatas?/gi, 'Patatas splash')
      .replace(/patata baby patata/gi, 'Patata baby')
      .replace(/albóndigas de pavo carne picada de pavo/gi, 'Albóndigas de pavo')
      .replace(/guisantes con pavo pechuga de pavo/gi, 'Guisantes con pavo')
      .replace(/contramuslo de pollo marinado contramuslo de pollo deshuesado/gi, 'Contramuslo de pollo marinado')
      .replace(/salsa boloñesa tomate frito/gi, 'Salsa boloñesa')
      .replace(/secreto de cerd\b/gi, 'Secreto de cerdo')
      .replace(/secreto ibérico solomillo de cerdo/gi, 'Secreto ibérico')
      .replace(/habitas con cebolla tierna alubia blanca/gi, 'Habitas con cebolla tierna')
      .replace(/gallineta confitada dorada/gi, 'Gallineta confitada')
      .replace(/fideos de arroz noodles de arroz/gi, 'Fideos de arroz')
      .replace(/noodles de arroz fideos de arroz/gi, 'Noodles de arroz')
      .replace(/ensalada de patata alemana patata/gi, 'Ensalada de patata alemana')
      .replace(/pure de boniato boniato/gi, 'Puré de boniato')
      .replace(/patata baby al romero y tomillo patata/gi, 'Patata baby al romero y tomillo')
      .replace(/crema de puerros y guisantes puerro/gi, 'Crema de puerros y guisantes')
      .replace(/pollo con salsa de champiñones contramuslo de pollo deshuesado/gi, 'Pollo con salsa de champiñones')
      .replace(/judías verdes con jamón judías verdes/gi, 'Judías verdes con jamón')
      .replace(/pasta fresca con verduras glaseadas pasta de trigo/gi, 'Pasta fresca con verduras')
      .replace(/pollo teriyaki pechuga de pollo/gi, 'Pollo teriyaki')
      .replace(/\s+/g, ' ')
      .trim();

    const low = cleanName.toLowerCase();
    const isEggItem = (
      low === 'huevo entero' ||
      low === 'huevo' ||
      low === 'huevos' ||
      low.includes('huevo entero') ||
      (it.food?.tags?.includes('huevo') && !low.includes('clara')) ||
      (it.name && it.name.toLowerCase().includes('huevo') && !it.name.toLowerCase().includes('clara')) ||
      (it.name && it.name.toLowerCase().includes('tortilla') && !it.name.toLowerCase().includes('trigo') && !it.name.toLowerCase().includes('maiz'))
    );

    if (isEggItem) {
      const itemKcal = Math.round(((it.grams || 100) / 100) * (it.food?.kcal || 160));
      const eggInfo = huevosYClarasFromKcal(itemKcal);
      return eggInfo.total || '1 Huevo';
    }
    if (low.includes('ensure')) {
      return 'Ensure Nutrición Entera 1 unidad';
    }
    if (low.includes('recovery')) {
      return 'Recovery y fruta';
    }

    const displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    return `${displayName} ${roundToFive(it.grams)}g`;
  });

  return resultParts.join(', ');
}

export {
  FOODS_CRUDO,
  FOOD_NAMES_LIST,
  FOOD_NORMALIZED_NAMES_LIST,
  FOODS_BY_NORMALIZED_NAME,
  normalizeFoodName,
};
