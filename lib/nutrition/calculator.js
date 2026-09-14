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
import {
  STOP_WORDS,
  diceSimilarity,

  isEggItem,
  calculateEggAndClaras,
  formatEggOrClaraItem,
  formatMealItemDisplayName,
} from './utils.js';

/**
 * Caché en memoria para alimentos externos o sinónimos resueltos por la IA
 */
const RESOLVED_FOODS_CACHE = new Map();


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

    // 3. Pasta de plato: "pasta", "pasta fresca", "espaguetis", "macarrones", "tallarines"
    const isPastaDishQuery = queryTokens.some(q => ['pasta', 'espagueti', 'espaguetis', 'macarron', 'macarrones', 'tallarin', 'tallarines', 'penne', 'fusilli', 'rigatoni', 'tagliatelle'].includes(q));
    if (isPastaDishQuery) {
      if (normFood.includes('datil')) {
        totalScore -= 1.0; // Jamás emparejar pasta de plato con pasta de dátil
      } else {
        const isGlutenFree = options.isGlutenIntolerant || options.clinicalCatalog?.activeTags?.includes('sin_gluten');
        if (isGlutenFree) {
          if (normFood === 'pasta sin gluten') totalScore += 0.8;
          if (normFood === 'pasta de trigo') totalScore -= 0.8;
        } else {
          if (normFood === 'pasta de trigo') totalScore += 0.6;
        }
      }
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

export function findFoodInCatalog(query, options = {}) {
  const norm = normalizeFoodName(query);
  if (!norm) return null;

  // 1. Coincidencia directa instantánea O(1) en catálogo normalizado (>94% de los casos)
  const targetMap = options.clinicalCatalog?.foodsByNormalizedName || FOODS_BY_NORMALIZED_NAME;
  const exact = targetMap.get(norm);
  if (exact) return exact;

  const catalogTagKey = options.clinicalCatalog
    ? options.clinicalCatalog.activeTags.join('_')
    : (options.isGlutenIntolerant ? 'sin_gluten' : 'all');
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
  if (!norm) return null;

  if (RESOLVED_FOODS_CACHE.has(norm)) {
    return RESOLVED_FOODS_CACHE.get(norm);
  }

  if (!aiClient) {
    return null;
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
      return null;
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
        minGrams: Number(parsed.minGrams) || 10,
        maxGrams: Number(parsed.maxGrams) || 200,
        defaultGrams: Number(parsed.defaultGrams) || 50,
      };
      RESOLVED_FOODS_CACHE.set(norm, customFood);
      return customFood;
    }
  } catch (err) {
    console.warn(`No se pudo resolver alimento con IA para "${foodName}":`, err.message);
  }

  return null;
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

  // Si no se han especificado gramos (la IA solo envía nombres de ingredientes),
  // asignar la ración estándar de referencia según la naturaleza del alimento.
  // Luego calibrateMeal recalculará matemáticamente el cereal, la proteína y el AOVE.
  if (grams === null) {
    if (food?.defaultGrams) {
      grams = food.defaultGrams;
    } else {
      const cat = food?.category || '';
      const nLow = nameOnly.toLowerCase();
      if (cat === 'frutas') {
        grams = nLow.includes('platano') ? 120 : 150;
      } else if (cat === 'verduras_y_hortalizas') {
        grams = 100;
      }
    }
  }

  // Si el alimento está en el catálogo, exigir que tenga sus límites minGrams y maxGrams
  if (food) {
    if (food.minGrams === undefined || food.maxGrams === undefined) {
      throw new Error(`Alimento "${food.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }
    if (grams !== null) {
      if (grams > food.maxGrams) grams = food.maxGrams;
      if (grams < food.minGrams) grams = food.minGrams;
    }
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

  // Pauta fija de post-partido vs post-entreno identificada de forma determinista por el nombre de la ingesta
  const mealName = (options.mealName || '').trim();
  const mealNameLow = mealName.toLowerCase();
  const isPostByName = Boolean(mealNameLow && (mealNameLow.includes('post') || mealNameLow.includes('recovery')));
  const isPostFallback = !options.mealName && (lower.startsWith('post') || lower.startsWith('recovery') || lower.startsWith('batido de prote'));
  const isPostMeal = isPostByName || isPostFallback;

  if (isPostMeal) {
    const isMatchPost = options.isMatchDay || mealNameLow.includes('partido') || lower.includes('partido') || lower.includes('recovery');
    if (isMatchPost) {
      return 'Recovery y fruta';
    }
    if (options.hasCowProteinAllergy || options.isVegan || lower.includes('vegetal')) {
      return 'Batido de proteína vegetal 30g disuelto en agua';
    }
    if (options.isLactoseIntolerant || lower.includes('sin lactosa')) {
      return 'Batido de proteína sin lactosa 30g disuelto en agua';
    }
    return 'Batido de proteína 30g disuelto en agua';
  }

  // Separar ingredientes (normalizando posibles conectores en prosa)
  const cleanStr = mealDetailStr
    .replace(/\bcon\b/gi, ',')
    .replace(/\by\b/gi, ',')
    .replace(/\bpostre:\s*/gi, ',')
    .replace(/\+/g, ',');
  const rawParts = cleanStr.split(',').map(s => s.trim()).filter(Boolean);
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

      // En comidas principales, el pan nunca puede ser el hidrato principal (solo secundario de acompañamiento)
      if (isMainMeal && isBread) {
        return;
      }

      // En comidas y cenas principales, los cereales/tubérculos de plato tienen prioridad absoluta (2)
      let carbPriority = isDishCarb ? (isMainMeal ? 2 : 1.5) : 1;

      if (carbPriority > maxChoPriority || (carbPriority === maxChoPriority && (it.food.cho || 0) > maxChoDensity)) {
        maxChoPriority = carbPriority;
        maxChoDensity = it.food.cho || 0;
        primaryCarbIndex = idx;
      }
    }

    // Proteína primaria (carne, ave, pescado, conservas o claras escalables)
    if (isMainMeal) {
      // En comidas y cenas principales, la proteína primaria DEBE ser carne, ave o pescado limpio de plato
      if (cat === 'carnes_y_aves' || cat === 'pescados_y_mariscos') {
        if (it.food.pro > maxProDensity) {
          maxProDensity = it.food.pro;
          primaryProteinIndex = idx;
        }
      }
    } else {
      if (cat === 'carnes_y_aves' || cat === 'pescados_y_mariscos' || cat === 'conservas' || (cat === 'huevos_y_lacteos' && it.food.pro > 10)) {
        if (it.food.pro > maxProDensity) {
          maxProDensity = it.food.pro;
          primaryProteinIndex = idx;
        }
      }
    }

    // Grasa primaria (AOVE)
    if (cat === 'grasas_y_frutos_secos' || it.name.toLowerCase().includes('aove') || it.name.toLowerCase().includes('aceite')) {
      primaryFatIndex = idx;
    }
  });

  // En comidas y cenas principales, SOLO PUEDE HABER UNA PROTEÍNA PRINCIPAL LIMPIA (carne, ave o pescado).
  // Se purga cualquier segunda proteína incompatible (huevos, claras, quesos, yogures o segunda carne).
  if (isMainMeal && primaryProteinIndex !== -1) {
    const toRemove = [];
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryProteinIndex) {
        const cat = it.food?.category || '';
        const nameLow = (it.food?.name || it.name).toLowerCase();
        const isProt = (
          cat === 'carnes_y_aves' ||
          cat === 'pescados_y_mariscos' ||
          cat === 'huevos_y_lacteos' ||
          cat === 'lacteos_y_huevos' ||
          cat === 'conservas' ||
          isEggItem(it) ||
          nameLow.includes('huevo') ||
          nameLow.includes('clara') ||
          nameLow.includes('yogur') ||
          nameLow.includes('queso')
        );
        if (isProt) {
          toRemove.push(idx);
        }
      }
    });
    if (toRemove.length > 0) {
      const primaryItem = parsedItems[primaryProteinIndex];
      const primaryCarbItem = primaryCarbIndex !== -1 ? parsedItems[primaryCarbIndex] : null;
      const primaryFatItem = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
      parsedItems = parsedItems.filter((_, idx) => !toRemove.includes(idx));
      primaryProteinIndex = parsedItems.indexOf(primaryItem);
      if (primaryCarbItem) primaryCarbIndex = parsedItems.indexOf(primaryCarbItem);
      if (primaryFatItem) primaryFatIndex = parsedItems.indexOf(primaryFatItem);
    }
  }

  // En comidas y cenas principales, calibración del acompañante de hidratos (pan):
  // El pan no tiene una ración fija: se evalúa dinámicamente según la holgura de hidratos.
  // Si no hay margen para mantener una ración digna del plato principal (arroz/pasta/patata), se descarta el pan.
  if (isMainMeal && primaryCarbIndex !== -1) {
    const breadIdx = parsedItems.findIndex((it, idx) => {
      if (idx === primaryCarbIndex) return false;
      const nameLow = (it.food?.name || it.name).toLowerCase();
      return nameLow.includes('pan') || nameLow.includes('tosta') || nameLow.includes('biscote') || nameLow.includes('picos');
    });

    if (breadIdx !== -1) {
      const breadItem = parsedItems[breadIdx];
      const primaryItem = parsedItems[primaryCarbIndex];
      const primaryChoFactor = (primaryItem.food?.cho || 20) / 100;
      const isTuber = (primaryItem.food?.name || primaryItem.name).toLowerCase().includes('patata') || (primaryItem.food?.name || primaryItem.name).toLowerCase().includes('boniato');
      const minDishGrams = isTuber ? 150 : 60;
      const minDishCho = minDishGrams * primaryChoFactor;

      // Hidratos aportados por fruta de postre y verduras
      let fixedCarbs = 0;
      parsedItems.forEach((it, idx) => {
        if (idx !== breadIdx && idx !== primaryCarbIndex) {
          fixedCarbs += (it.grams / 100) * (it.food?.cho || 0);
        }
      });

      const carbRoom = targetBudget.hc - fixedCarbs;
      const minBreadCho = 30 * ((breadItem.food?.cho || 55) / 100);

      if (carbRoom < minDishCho + minBreadCho) {
        // No hay margen suficiente para el plato principal y el pan a la vez:
        // Se purga el pan para que el plato principal mantenga su gramaje mínimo digno.
        const primaryCarbObj = parsedItems[primaryCarbIndex];
        parsedItems = parsedItems.filter((_, idx) => idx !== breadIdx);
        primaryCarbIndex = parsedItems.indexOf(primaryCarbObj);
        if (primaryProteinIndex > breadIdx) primaryProteinIndex--;
        if (primaryFatIndex > breadIdx) primaryFatIndex--;
      } else {
        // Hay margen holgado: calibrar el pan dinámicamente entre 30g y 60g según los hidratos sobrantes
        const standardDishCho = (isTuber ? 250 : 85) * primaryChoFactor;
        const availableForBread = Math.max(0, carbRoom - standardDishCho);
        const breadChoFactor = (breadItem.food?.cho || 55) / 100;
        let calibratedBreadGrams = roundToFive(availableForBread / breadChoFactor);
        calibratedBreadGrams = Math.min(60, Math.max(30, calibratedBreadGrams));
        breadItem.grams = calibratedBreadGrams;
        breadItem.rawText = `${breadItem.food?.name || breadItem.name} ${calibratedBreadGrams}g`;
      }
    }
  }

  if (isMainMeal && primaryCarbIndex !== -1) {

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
        const primaryProteinItem = primaryProteinIndex !== -1 ? parsedItems[primaryProteinIndex] : null;
        const primaryFatItem = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
        console.warn(`[NUTRICIÓN] Purgando cereal secundario incompatible en comida principal para evitar duplicar bases.`);
        parsedItems = parsedItems.filter((_, idx) => !toRemove.includes(idx));
        primaryCarbIndex = parsedItems.indexOf(bestItem);
        if (primaryCarbIndex === -1) {
          primaryCarbIndex = 0;
        }
        if (primaryProteinItem) primaryProteinIndex = parsedItems.indexOf(primaryProteinItem);
        if (primaryFatItem) primaryFatIndex = parsedItems.indexOf(primaryFatItem);
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
  // Si en una comida o cena principal no hay fuente de proteína limpia (carnes_y_aves, pescados_y_mariscos),
  // inyectar automáticamente una proteína limpia y segura del catálogo para garantizar siempre los requerimientos nutricionales
  if (isMainMeal && primaryProteinIndex === -1) {
    const isCena = options.mealName && options.mealName.toLowerCase().includes('cena');
    const candidates = isCena
      ? ['Merluza', 'Dorada', 'Lubina', 'Pechuga de pavo', 'Pechuga de pollo', 'Tofu firme']
      : ['Pechuga de pollo', 'Pechuga de pavo', 'Ternera magra', 'Merluza', 'Dorada', 'Tofu firme'];

    let chosenFood = null;
    for (const cand of candidates) {
      const found = findFoodInCatalog(cand, options);
      if (found && (found.category === 'carnes_y_aves' || found.category === 'pescados_y_mariscos')) {
        chosenFood = found;
        break;
      }
    }

    if (!chosenFood) {
      chosenFood = findFoodInCatalog('Pechuga de pollo', options);
    }

    const rescueItem = {
      rawText: chosenFood.name,
      name: chosenFood.name,
      grams: 150,
      hasUnits: false,
      unitCount: 1,
      food: chosenFood,
    };

    const insertIdx = primaryCarbIndex !== -1 ? primaryCarbIndex + 1 : 0;
    parsedItems.splice(insertIdx, 0, rescueItem);
    primaryProteinIndex = insertIdx;
    if (primaryCarbIndex >= insertIdx && primaryCarbIndex !== -1) primaryCarbIndex++;
    if (primaryFatIndex >= insertIdx) primaryFatIndex++;
  }

  // RED DE SEGURIDAD OBLIGATORIA DE HIDRATO DE PLATO EN COMIDAS Y CENAS:
  // Si en una comida o cena principal no hay hidrato de plato (porque no se especificó o solo había pan),
  // inyectar un cereal de plato limpio (Arroz blanco o Pasta de trigo) como hidrato principal
  if (isMainMeal && primaryCarbIndex === -1) {
    const carbCandidates = options.isGlutenIntolerant
      ? ['Arroz blanco', 'Patata', 'Boniato', 'Quinoa']
      : ['Arroz blanco', 'Pasta de trigo', 'Patata', 'Cuscús'];
    let chosenCarb = null;
    for (const cand of carbCandidates) {
      const found = findFoodInCatalog(cand, options);
      if (found) {
        chosenCarb = found;
        break;
      }
    }
    if (chosenCarb) {
      const rescueCarb = {
        rawText: chosenCarb.name,
        name: chosenCarb.name,
        grams: 100,
        hasUnits: false,
        food: chosenCarb,
      };
      parsedItems.unshift(rescueCarb);
      primaryCarbIndex = 0;
      if (primaryProteinIndex !== -1) primaryProteinIndex++;
      if (primaryFatIndex !== -1) primaryFatIndex++;
    }
  }

  // 1. Calibrar Carbohidratos con Reparto Armónico:
  let nonPrimaryCarbs = 0;
  parsedItems.forEach((it, idx) => {
    if (idx !== primaryCarbIndex) {
      nonPrimaryCarbs += (it.grams / 100) * (it.food?.cho || 0);
    }
  });

  if (primaryCarbIndex !== -1) {
    const carbItem = parsedItems[primaryCarbIndex];
    if (!carbItem.food || carbItem.food.minGrams === undefined || carbItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${carbItem.food?.name || carbItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }
    const choFactor = (carbItem.food.cho || 20) / 100;
    const minP = carbItem.food.minGrams;
    const maxP = carbItem.food.maxGrams;
    const nameLow = (carbItem.food?.name || carbItem.name).toLowerCase();
    const isTuber = nameLow.includes('patata') || nameLow.includes('boniato') || nameLow.includes('batata');

    // Identificar o asegurar fruta de postre en comida principal
    let fruitItem = parsedItems.find(it => it.food?.category === 'frutas' || it.name.toLowerCase().includes('plátano') || it.name.toLowerCase().includes('manzana'));
    if (!fruitItem && isMainMeal) {
      const dessertFruit = findFoodInCatalog('Manzana', options) || findFoodInCatalog('Plátano', options);
      if (dessertFruit) {
        fruitItem = {
          rawText: dessertFruit.name,
          name: dessertFruit.name,
          grams: 150,
          hasUnits: false,
          food: dessertFruit,
        };
        parsedItems.push(fruitItem);
        nonPrimaryCarbs += (150 / 100) * (dessertFruit.cho || 15);
      }
    }

    let minF = 0;
    let maxF = 0;
    let fruitChoFactor = 0;
    if (fruitItem) {
      if (!fruitItem.food || fruitItem.food.minGrams === undefined || fruitItem.food.maxGrams === undefined) {
        throw new Error(`Alimento "${fruitItem.food?.name || fruitItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
      }
      minF = fruitItem.food.minGrams;
      maxF = fruitItem.food.maxGrams;
      fruitChoFactor = (fruitItem.food.cho || 15) / 100;
    }

    const neededCho = Math.max(0, targetBudget.hc - nonPrimaryCarbs);
    let rawCarbGrams = roundToFive(neededCho / choFactor);

    if (isTuber) {
      // === CASO TUBÉRCULO (Patata / Boniato) ===
      if (rawCarbGrams <= maxP) {
        carbItem.grams = roundToFive(Math.max(minP, rawCarbGrams));
      } else {
        // Supera el máximo del tubérculo (450g)
        const excessCho = Math.max(0, (rawCarbGrams - maxP) * choFactor);
        const currentFruitGrams = fruitItem ? (fruitItem.grams || 150) : 150;
        const availableFruitCho = Math.max(0, (maxF - currentFruitGrams) * fruitChoFactor);

        if (excessCho <= availableFruitCho && fruitItem) {
          // Exceso pequeño: cabe en la fruta sin rebasar su tope de 200g
          carbItem.grams = maxP;
          const extraFruitGrams = roundToFive(excessCho / fruitChoFactor);
          fruitItem.grams = roundToFive(Math.min(maxF, currentFruitGrams + extraFruitGrams));
        } else {
          // El exceso supera la holgura de la fruta
          const remExcessAfterFruit = excessCho - availableFruitCho;
          if (remExcessAfterFruit < 20) {
            // Exceso residual pequeño (< 20g HC): la fruta sube a su tope (200g) y el tubérculo queda en 450g.
            // No se añade cereal testimonial (ej: 15g de arroz) para evitar platos amorfos.
            carbItem.grams = maxP;
            if (fruitItem) fruitItem.grams = maxF;
          } else if (isMainMeal) {
            // Exceso elevado (>= 20g HC pendientes, e.g. hipercarga o >130g HC totales):
            // Rebalanceo armónico: Tubérculo a zona media de confort (310g) + Cereal secundario (arroz/pasta >= 60g)
            carbItem.grams = 310;
            if (fruitItem) fruitItem.grams = 150;

            let otherCho = 0;
            parsedItems.forEach((it, idx) => {
              if (idx !== primaryCarbIndex) {
                otherCho += (it.grams / 100) * (it.food?.cho || 0);
              }
            });
            const primaryCho = (carbItem.grams / 100) * (carbItem.food?.cho || 0);
            const deficitForCereal = Math.max(0, targetBudget.hc - (otherCho + primaryCho));

            const existingCereal = parsedItems.find((it, idx) => {
              if (idx === primaryCarbIndex) return false;
              return it.food?.category === 'cereales_y_tuberculos' && !it.name.toLowerCase().includes('patata') && !it.name.toLowerCase().includes('boniato');
            });

            if (existingCereal) {
              if (!existingCereal.food || existingCereal.food.minGrams === undefined || existingCereal.food.maxGrams === undefined) {
                throw new Error(`Alimento "${existingCereal.food?.name || existingCereal.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
              }
              const secChoFactor = (existingCereal.food.cho || 75) / 100;
              const minS = existingCereal.food.minGrams;
              const maxS = existingCereal.food.maxGrams;
              let secGrams = roundToFive(deficitForCereal / secChoFactor);
              secGrams = Math.min(maxS, Math.max(minS, secGrams));
              existingCereal.grams = secGrams;
            } else {
              const cerealName = options.isGlutenIntolerant ? 'Arroz blanco' : 'Arroz blanco';
              const cerealFood = findFoodInCatalog(cerealName, options) || findFoodInCatalog('Arroz blanco', options);
              if (cerealFood) {
                if (cerealFood.minGrams === undefined || cerealFood.maxGrams === undefined) {
                  throw new Error(`Alimento "${cerealFood.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
                }
                const secChoFactor = (cerealFood.cho || 75) / 100;
                const minS = cerealFood.minGrams;
                const maxS = cerealFood.maxGrams;
                let secGrams = roundToFive(Math.max(minS, deficitForCereal / secChoFactor));
                secGrams = Math.min(maxS, secGrams);
                const secondaryCerealItem = {
                  rawText: `${cerealFood.name} ${secGrams}g`,
                  name: cerealFood.name,
                  grams: secGrams,
                  hasUnits: false,
                  food: cerealFood,
                };
                parsedItems.unshift(secondaryCerealItem);
                primaryCarbIndex = parsedItems.indexOf(secondaryCerealItem);
                if (primaryProteinIndex !== -1) primaryProteinIndex++;
                if (primaryFatIndex !== -1) primaryFatIndex++;
              }
            }
          } else {
            carbItem.grams = maxP;
          }
        }
      }
    } else {
      // === CASO CEREAL DE PLATO (Arroz blanco / Pasta de trigo) ===
      if (rawCarbGrams < minP) {
        // Demanda baja: garantizar que el cereal no baje de minP (50g)
        if (fruitItem && fruitItem.grams > minF) {
          const fruitReduction = Math.min(50, fruitItem.grams - minF);
          fruitItem.grams -= fruitReduction;
          const recoveredCho = fruitReduction * fruitChoFactor;
          rawCarbGrams = roundToFive((neededCho + recoveredCho) / choFactor);
        }
        carbItem.grams = roundToFive(Math.max(minP, rawCarbGrams));
      } else if (rawCarbGrams <= maxP) {
        // Carga normal: el cereal absorbe limpiamente dentro de [minP, maxP]
        carbItem.grams = roundToFive(rawCarbGrams);
      } else {
        // Hipercarga que excede el tope digestivo del cereal (170g)
        const excessCho = Math.max(0, (rawCarbGrams - maxP) * choFactor);
        const currentFruitGrams = fruitItem ? (fruitItem.grams || 150) : 150;
        const availableFruitCho = Math.max(0, (maxF - currentFruitGrams) * fruitChoFactor);

        if (excessCho <= availableFruitCho && fruitItem) {
          carbItem.grams = maxP;
          const extraFruitGrams = roundToFive(excessCho / fruitChoFactor);
          fruitItem.grams = roundToFive(Math.min(maxF, currentFruitGrams + extraFruitGrams));
        } else {
          // Hipercarga que excede el tope del cereal y la capacidad de la fruta:
          // Rebalanceo armónico: Cereal a zona alta cómoda (140g-160g), fruta a 180g-200g,
          // y si es comida principal, acompañante de pan (30g-60g) para no sobrecargar el estómago.
          if (fruitItem) fruitItem.grams = Math.min(maxF, 180);
          const fruitCho = fruitItem ? (fruitItem.grams / 100) * (fruitItem.food?.cho || 15) : 0;

          let otherCho = 0;
          parsedItems.forEach((it, idx) => {
            if (idx !== primaryCarbIndex && it !== fruitItem) {
              otherCho += (it.grams / 100) * (it.food?.cho || 0);
            }
          });

          const remCho = Math.max(0, targetBudget.hc - (fruitCho + otherCho));

          // Verificar si ya existe pan de acompañamiento
          let breadItem = parsedItems.find((it, idx) => {
            if (idx === primaryCarbIndex) return false;
            const nl = (it.food?.name || it.name).toLowerCase();
            return nl.includes('pan') || nl.includes('tosta') || nl.includes('biscote') || nl.includes('picos');
          });

          if (!breadItem && isMainMeal && remCho > (140 * choFactor)) {
            const breadFood = findFoodInCatalog('Pan blanco de barra', options) || findFoodInCatalog('Pan blanco', options);
            if (breadFood) {
              if (breadFood.minGrams === undefined || breadFood.maxGrams === undefined) {
                throw new Error(`Alimento "${breadFood.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
              }
              breadItem = {
                rawText: breadFood.name,
                name: breadFood.name,
                grams: 40,
                hasUnits: false,
                food: breadFood,
              };
              parsedItems.push(breadItem);
            }
          }

          if (breadItem) {
            if (!breadItem.food || breadItem.food.minGrams === undefined || breadItem.food.maxGrams === undefined) {
              throw new Error(`Alimento "${breadItem.food?.name || breadItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
            }
            const breadChoFactor = (breadItem.food?.cho || 55) / 100;
            const targetCerealGrams = Math.min(160, Math.max(130, roundToFive((remCho - (40 * breadChoFactor)) / choFactor)));
            carbItem.grams = targetCerealGrams;
            const cerealCho = (targetCerealGrams / 100) * (carbItem.food?.cho || 75);
            const forBreadCho = Math.max(0, remCho - cerealCho);
            let calibratedBreadGrams = roundToFive(forBreadCho / breadChoFactor);
            calibratedBreadGrams = Math.min(breadItem.food.maxGrams, Math.max(breadItem.food.minGrams, calibratedBreadGrams));
            breadItem.grams = calibratedBreadGrams;
            breadItem.rawText = `${breadItem.food?.name || breadItem.name} ${calibratedBreadGrams}g`;
          } else {
            carbItem.grams = Math.min(maxP, roundToFive(remCho / choFactor));
          }
        }
      }
    }
  }



  // 2. Calibrar Proteínas:
  // Detectar todas las fuentes dedicadas de proteína en la toma
  const proteinItemIndices = [];
  parsedItems.forEach((it, idx) => {
    const cat = it.food?.category || '';
    const nameLow = (it.food?.name || it.name).toLowerCase();
    const isProt = (
      cat === 'carnes_y_aves' ||
      cat === 'pescados_y_mariscos' ||
      cat === 'conservas' ||
      ((cat === 'huevos_y_lacteos' || cat === 'lacteos_y_huevos') && (it.food?.pro || 0) >= 8) ||
      nameLow.includes('huevo') ||
      nameLow.includes('clara')
    );
    if (isProt) {
      proteinItemIndices.push(idx);
    }
  });

  // Proteína ya aportada por alimentos no proteicos (pan, cereal, fruta, verdura)
  let nonProteinSourcesP = 0;
  parsedItems.forEach((it, idx) => {
    if (!proteinItemIndices.includes(idx)) {
      nonProteinSourcesP += (it.grams / 100) * (it.food?.pro || 0);
    }
  });

  const neededTotalPro = Math.max(0, targetBudget.p - nonProteinSourcesP);

  if (isMainMeal && primaryProteinIndex !== -1) {
    // En comidas y cenas, la proteína principal (carne o pescado limpio) asume la totalidad de la proteína pendiente.
    // Los alimentos secundarios (ej: 1 huevo, claras, queso o pan de acompañamiento) mantienen su porción moderada fijada.
    let nonPrimaryProtein = 0;
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryProteinIndex) {
        nonPrimaryProtein += (it.grams / 100) * (it.food?.pro || 0);
      }
    });

    const primaryItem = parsedItems[primaryProteinIndex];
    if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${primaryItem.food?.name || primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }

    const neededPrimaryPro = Math.max(0, targetBudget.p - nonPrimaryProtein);
    const proFactor = (primaryItem.food?.pro || 20) / 100;
    let exactGrams = roundToFive(neededPrimaryPro / proFactor);

    exactGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, exactGrams));

    primaryItem.grams = roundToFive(exactGrams);
  } else if (proteinItemIndices.length > 0) {
    if (proteinItemIndices.length === 1) {
      // Caso 1 sola proteína en desayuno/merienda
      const singleItem = parsedItems[proteinItemIndices[0]];
      if (isEggItem(singleItem)) {
        const eggCalc = calculateEggAndClaras(neededTotalPro, 2);
        singleItem.grams = eggCalc.totalGrams;
        singleItem.displayName = eggCalc.displayName;
      } else {
        if (!singleItem.food || singleItem.food.minGrams === undefined || singleItem.food.maxGrams === undefined) {
          throw new Error(`Alimento "${singleItem.food?.name || singleItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
        }
        const proFactor = (singleItem.food?.pro || 20) / 100;
        let exactGrams = roundToFive(neededTotalPro / proFactor);
        exactGrams = Math.max(singleItem.food.minGrams, Math.min(singleItem.food.maxGrams, exactGrams));
        singleItem.grams = roundToFive(exactGrams);
      }
    } else {
      // Caso múltiples proteínas en desayuno/merienda (ej: Tostada con huevo + jamón/pavo/queso)
      // Identificar proteína principal (huevo) vs proteínas secundarias (lonchas de embutido/queso)
      let primaryIdx = proteinItemIndices.find(idx => isEggItem(parsedItems[idx]));
      if (primaryIdx === undefined) {
        primaryIdx = proteinItemIndices[0];
      }
      const secondaryIndices = proteinItemIndices.filter(idx => idx !== primaryIdx);
      const primaryItem = parsedItems[primaryIdx];
      const isEggPrimary = isEggItem(primaryItem);

      // Calcular mínimos culinarios reales
      const minPriPro = isEggPrimary ? 6.25 : 6.0;
      let minSecProTotal = 0;
      const secInfoList = [];

      secondaryIndices.forEach(sIdx => {
        const sItem = parsedItems[sIdx];
        if (!sItem.food || sItem.food.minGrams === undefined || sItem.food.maxGrams === undefined) {
          throw new Error(`Alimento "${sItem.food?.name || sItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
        }
        const sFactor = (sItem.food?.pro || 20) / 100;
        const sMinGrams = sItem.food.minGrams;
        const sPro = sMinGrams * sFactor;
        minSecProTotal += sPro;
        secInfoList.push({ idx: sIdx, item: sItem, grams: sMinGrams, pro: sPro });
      });

      const minTotalRequired = minPriPro + minSecProTotal;

      if (neededTotalPro < minTotalRequired) {
        // No hay margen de proteína para sostener ambos con raciones útiles:
        // Se descartan las secundarias y se calibra únicamente la principal con cohesión gastronómica
        const toDrop = secondaryIndices;
        const primaryFatObj = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
        const primaryCarbObj = primaryCarbIndex !== -1 ? parsedItems[primaryCarbIndex] : null;
        parsedItems = parsedItems.filter((_, idx) => !toDrop.includes(idx));
        primaryProteinIndex = parsedItems.indexOf(primaryItem);
        if (primaryFatObj) primaryFatIndex = parsedItems.indexOf(primaryFatObj);
        if (primaryCarbObj) primaryCarbIndex = parsedItems.indexOf(primaryCarbObj);

        if (isEggPrimary) {
          const eggCalc = calculateEggAndClaras(neededTotalPro, 2);
          primaryItem.grams = eggCalc.totalGrams;
          primaryItem.displayName = eggCalc.displayName;
        } else {
          if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
            throw new Error(`Alimento "${primaryItem.food?.name || primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
          }
          const proFactor = (primaryItem.food?.pro || 20) / 100;
          let calculatedGrams = roundToFive(neededTotalPro / proFactor);
          calculatedGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, calculatedGrams));
          primaryItem.grams = calculatedGrams;
        }
      } else {
        // Sí caben ambas respetando sus mínimos culinarios:
        // Se asigna la ración útil a las secundarias y la principal absorbe el resto
        let assignedSecPro = 0;
        secInfoList.forEach(info => {
          info.item.grams = info.grams;
          info.item.rawText = `${info.item.food?.name || info.item.name} ${info.grams}g`;
          assignedSecPro += info.pro;
        });

        const remainingPriPro = Math.max(minPriPro, neededTotalPro - assignedSecPro);

        if (isEggPrimary) {
          const eggCalc = calculateEggAndClaras(remainingPriPro, 1);
          primaryItem.grams = eggCalc.totalGrams;
          primaryItem.displayName = eggCalc.displayName;
        } else {
          if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
            throw new Error(`Alimento "${primaryItem.food?.name || primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
          }
          const proFactor = (primaryItem.food?.pro || 20) / 100;
          let calculatedGrams = roundToFive(remainingPriPro / proFactor);
          calculatedGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, calculatedGrams));
          primaryItem.grams = calculatedGrams;
        }
      }
    }
  }

  // 3. Calibrar Grasas (AOVE):
  let nonPrimaryFat = 0;
  parsedItems.forEach((it, idx) => {
    if (idx !== primaryFatIndex) {
      const f = (it.grams / 100) * (it.food?.fat || 0);
      nonPrimaryFat += f;
    }
  });

  if (primaryFatIndex !== -1 && parsedItems[primaryFatIndex]) {
    const fatItem = parsedItems[primaryFatIndex];
    if (!fatItem.food || fatItem.food.minGrams === undefined || fatItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${fatItem.food?.name || fatItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }
    const fatFactor = (fatItem.food.fat || 100) / 100;
    const neededFat = Math.max(0, targetBudget.g - nonPrimaryFat);
    let exactFatGrams = roundToFive(neededFat / fatFactor);
    exactFatGrams = Math.max(fatItem.food.minGrams, Math.min(fatItem.food.maxGrams, exactFatGrams));
    fatItem.grams = roundToFive(exactFatGrams);
  }

  // Respetar topes máximos y mínimos de cada alimento directamente desde su catálogo
  parsedItems.forEach(it => {
    if (it.displayName) return;
    if (it.food && (it.food.minGrams === undefined || it.food.maxGrams === undefined)) {
      it.food.minGrams = it.food.minGrams ?? 10;
      it.food.maxGrams = it.food.maxGrams ?? 200;
    }
    if (!it.food) {
      it.food = {
        name: it.name,
        minGrams: 10,
        maxGrams: 200,
      };
    }
    const minG = it.food.minGrams;
    const maxG = it.food.maxGrams;
    if (it.grams === null || it.grams === undefined) {
      it.grams = minG;
    }
    if (it.grams > maxG) {
      it.grams = maxG;
    }
    if (it.grams < minG) {
      it.grams = minG;
    }
  });

  // Reconstruir la descripción con formato limpio, profesional y elegante
  const resultParts = parsedItems.map(it => formatMealItemDisplayName(it));

  return resultParts.join(', ');
}

export {
  FOODS_CRUDO,
  FOOD_NAMES_LIST,
  FOOD_NORMALIZED_NAMES_LIST,
  FOODS_BY_NORMALIZED_NAME,
  normalizeFoodName,
  diceSimilarity,
  isEggItem,
  calculateEggAndClaras,
  formatEggOrClaraItem,
  formatMealItemDisplayName,
};
