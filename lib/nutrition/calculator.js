import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/config/env';
import { FOODS_CRUDO, FOOD_NAMES_LIST } from '@/data/foods-crudo.js';

let anthropicClient = null;
function getAnthropic() {
  if (!anthropicClient && env.AI_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: env.AI_API_KEY });
  }
  return anthropicClient;
}

/**
 * Redondeo exacto a múltiplos de 5 gramos (tolerancia estándar en nutrición deportiva)
 * Ejemplo: 193g -> 195g, 142g -> 140g, 168g -> 170g
 */
export function roundToFive(val) {
  if (!val || isNaN(val) || val <= 0) return 0;
  return Math.max(5, Math.round(val / 5) * 5);
}

/**
 * Caché en memoria para alimentos externos o sinónimos resueltos por la IA
 */
const RESOLVED_FOODS_CACHE = new Map();

/**
 * Mapa de sinónimos inmediatos para no hacer llamadas innecesarias a la IA
 */
const QUICK_ALIASES = {
  aove: 'AOVE',
  'aceite de oliva': 'AOVE',
  'aceite oliva': 'AOVE',
  'aceite de oliva virgen extra': 'AOVE',
  clara: 'Claras de huevo',
  claras: 'Claras de huevo',
  'clara de huevo': 'Claras de huevo',
  'claras de huevo': 'Claras de huevo',
  huevo: 'Huevo entero (unidad 50g)',
  huevos: 'Huevo entero (unidad 50g)',
  'huevo entero': 'Huevo entero (unidad 50g)',
  'huevos enteros': 'Huevo entero (unidad 50g)',
  'tortas de arroz': 'Tortas de arroz',
  'tortitas de arroz': 'Tortas de arroz',
  'tortas de maiz': 'Tortas de maíz',
  'tortitas de maiz': 'Tortas de maíz',
  'tortas de maíz': 'Tortas de maíz',
  'tortitas de maíz': 'Tortas de maíz',
  'solomillo de ternera': 'Solomillo de ternera',
  'solomillo de ternera magra': 'Solomillo de ternera',
  'solomillo de vacuno': 'Solomillo de ternera',
  'ternera magra': 'Ternera magra',
  'ternera solomillo': 'Solomillo de ternera',
  'entrecot de ternera': 'Entrecot de ternera',
  'lomo de ternera': 'Ternera magra',
  'lomo de ternera magra': 'Ternera magra',
  'pechuga de pollo': 'Pechuga de pollo',
  'contramuslo de pollo': 'Contramuslo de pollo deshuesado',
  'contramuslo de pollo deshuesado': 'Contramuslo de pollo deshuesado',
  'muslo de pollo': 'Contramuslo de pollo deshuesado',
  'pechuga de pavo': 'Pechuga de pavo',
  'solomillo de pavo': 'Pechuga de pavo',
  'chuletas de pavo': 'Chuletas de pavo',
  'carne picada de pollo': 'Carne picada de pollo',
  'carne picada de ternera': 'Carne picada de ternera',
  'carne picada de pavo': 'Carne picada de pavo',
  'carne picada de vacuno magra': 'Carne picada de ternera',
  'carne picada de vacuno': 'Carne picada de ternera',
  'hamburguesa de ternera magra': 'Hamburguesa de ternera magra',
  'hamburguesa de ternera': 'Hamburguesa de ternera magra',
  'hamburguesa de pollo': 'Hamburguesa de pollo',
  'arroz basmati': 'Arroz basmati',
  'arroz jazmin': 'Arroz jazmín',
  'arroz jazmín': 'Arroz jazmín',
  'arroz integral': 'Arroz integral',
  'arroz blanco': 'Arroz blanco',
  'pasta de trigo': 'Pasta de trigo',
  'pasta integral': 'Pasta de trigo',
  'pasta sin gluten': 'Pasta sin gluten',
  'fideos de arroz': 'Fideos de arroz',
  fideua: 'Pasta de trigo',
  fideuà: 'Pasta de trigo',
  'fideua de pescado': 'Pasta de trigo',
  'fideuà de pescado': 'Pasta de trigo',
  boniato: 'Boniato',
  batata: 'Boniato',
  'batata boniato': 'Boniato',
  patata: 'Patata',
  patatas: 'Patata',
  'copos de avena': 'Copos de avena',
  avena: 'Copos de avena',
  cuscus: 'Cuscús',
  cuscús: 'Cuscús',
  quinoa: 'Quinoa',
  'trigo sarraceno': 'Trigo sarraceno',
  'pan integral': 'Pan integral',
  'pan blanco': 'Pan blanco de barra',
  'pan de barra': 'Pan blanco de barra',
  fresas: 'Fresas',
  fresa: 'Fresas',
  arandanos: 'Arándanos',
  arándanos: 'Arándanos',
  platano: 'Plátano',
  plátano: 'Plátano',
  naranja: 'Naranja',
  manzana: 'Manzana',
  pera: 'Pera',
  kiwi: 'Kiwi',
  uvas: 'Uvas',
  uva: 'Uvas',
  mango: 'Mango',
  merluza: 'Merluza',
  dorada: 'Dorada',
  lubina: 'Lubina',
  salmon: 'Salmón fresco',
  salmón: 'Salmón fresco',
  'salmon fresco': 'Salmón fresco',
  'salmón fresco': 'Salmón fresco',
  bacalao: 'Bacalao fresco',
  'bacalao fresco': 'Bacalao fresco',
  'atun al natural': 'Atún natural',
  'atún al natural': 'Atún natural',
  'atun al natural en lata': 'Atún natural',
  'atún al natural en lata': 'Atún natural',
  'queso fresco batido': 'Queso fresco batido',
  'queso fresco batido 0%': 'Queso fresco batido',
  'queso cottage': 'Queso cottage',
  cottage: 'Queso cottage',
  'yogur griego': 'Yogur griego natural',
  'yogur griego natural': 'Yogur griego natural',
  'yogur proteico': 'Yogur proteico natural',
  'yogur proteico 0%': 'Yogur proteico natural',
  'batido de proteina': 'Batido de proteína de suero 30g',
  'batido de proteína': 'Batido de proteína de suero 30g',
  'batido de proteina 30g': 'Batido de proteína de suero 30g',
  'batido de proteína 30g': 'Batido de proteína de suero 30g',
  'batido de proteina sin lactosa': 'Batido de proteína sin lactosa 30g',
  'batido de proteína sin lactosa': 'Batido de proteína sin lactosa 30g',
  'batido de proteina sin lactosa 30g': 'Batido de proteína sin lactosa 30g',
  'batido de proteína sin lactosa 30g': 'Batido de proteína sin lactosa 30g',
  'batido de proteína 30g disuelto en agua': 'Batido de proteína de suero 30g',
  'batido de proteina 30g disuelto en agua': 'Batido de proteína de suero 30g',
  'batido de proteína sin lactosa 30g disuelto en agua': 'Batido de proteína sin lactosa 30g',
  'batido de proteina sin lactosa 30g disuelto en agua': 'Batido de proteína sin lactosa 30g',
  'batido post-entreno': 'Batido de proteína de suero 30g',
  'batido post entreno': 'Batido de proteína de suero 30g',
  recovery: 'Batido de proteína de suero 30g',
  'recovery y fruta': 'Batido de proteína de suero 30g',
  'recovery fruta': 'Batido de proteína de suero 30g',
  'recovery + fruta': 'Batido de proteína de suero 30g',
  ensure: 'Ensure Nutrición Entera (unidad)',
  'ensure nutricion entera': 'Ensure Nutrición Entera (unidad)',
  'ensure nutrición entera': 'Ensure Nutrición Entera (unidad)',
  miel: 'Miel',
  aguacate: 'Aguacate',
  nueces: 'Nueces',
  almendras: 'Almendras',
  conejo: 'Conejo',
  sepia: 'Sepia',
  calamar: 'Calamar',
  pulpo: 'Pulpo',
  gambas: 'Gambas',
  gamba: 'Gambas',
  'albondigas de pavo': 'Carne picada de pavo',
  'albóndigas de pavo': 'Carne picada de pavo',
  'patatas baby': 'Patata',
  'patata baby': 'Patata',
  'patatas splash': 'Patata',
  'patata splash': 'Patata',
  'patatas panaderas': 'Patata',
  'patata panadera': 'Patata',
  'patatas asadas': 'Patata',
  'patata asada': 'Patata',
  'noodles de arroz': 'Fideos de arroz',
  'cous cous': 'Cuscús',
  'jamoncito de pavo': 'Pechuga de pavo',
  'jamoncito de pavo confitado': 'Pechuga de pavo',
  'chuletas de pavo': 'Pechuga de pavo',
  'pollo teriyaki': 'Pechuga de pollo',
  'pollo asado': 'Pechuga de pollo',
  'pollo con salsa de champiñones': 'Contramuslo de pollo deshuesado',
  'crema de calabacin': 'Calabacín',
  'crema de calabacín': 'Calabacín',
  'crema de coliflor': 'Coliflor',
  'crema de puerros': 'Puerro',
  'crema de calabaza': 'Calabaza'
};

/**
 * Perfiles semánticos de respaldo (Fallback Nivel 3)
 */
const CATEGORY_FALLBACKS = {
  frutas: { name: 'Fruta fresca', category: 'frutas', kcal: 52, cho: 13, pro: 0.8, fat: 0.2 },
  verduras_y_hortalizas: { name: 'Verdura fresca', category: 'verduras_y_hortalizas', kcal: 25, cho: 3.5, pro: 1.5, fat: 0.2 },
  pescados_y_mariscos: { name: 'Pescado blanco', category: 'pescados_y_mariscos', kcal: 85, cho: 0, pro: 18, fat: 1 },
  carnes_y_aves: { name: 'Carne magra', category: 'carnes_y_aves', kcal: 125, cho: 0, pro: 22, fat: 3.5 },
  cereales_y_tuberculos: { name: 'Cereal / Grano seco', category: 'cereales_y_tuberculos', kcal: 360, cho: 75, pro: 10, fat: 1.5 },
  grasas_y_frutos_secos: { name: 'Grasa saludable', category: 'grasas_y_frutos_secos', kcal: 884, cho: 0, pro: 0, fat: 100 },
  huevos_y_lacteos: { name: 'Lácteo proteico', category: 'huevos_y_lacteos', kcal: 65, cho: 4, pro: 10, fat: 0.5 },
};

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[(),.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Búsqueda directa y rápida en el catálogo FOODS_CRUDO
 */
export function findFoodInCatalog(query) {
  const norm = normalize(query);
  if (!norm) return null;

  // 1. Alias rápido exacto
  if (QUICK_ALIASES[norm]) {
    const targetNorm = normalize(QUICK_ALIASES[norm]);
    const found = FOODS_CRUDO.find(f => normalize(f.name) === targetNorm);
    if (found) return found;
  }

  // 2. Alias por coincidencia de subcadenas completas
  for (const [aliasKey, targetVal] of Object.entries(QUICK_ALIASES)) {
    if (norm === aliasKey || norm.startsWith(aliasKey + ' ') || norm.endsWith(' ' + aliasKey) || norm.includes(' ' + aliasKey + ' ')) {
      const targetNorm = normalize(targetVal);
      const found = FOODS_CRUDO.find(f => normalize(f.name) === targetNorm);
      if (found) return found;
    }
  }

  // 3. Coincidencia exacta en FOODS_CRUDO
  let found = FOODS_CRUDO.find(f => normalize(f.name) === norm);
  if (found) return found;

  // 4. Subcadena en FOODS_CRUDO
  found = FOODS_CRUDO.find(f => {
    const fn = normalize(f.name);
    return norm.includes(fn) || fn.includes(norm);
  });
  if (found) return found;

  // 5. Comprobar en la caché de resueltos por IA
  if (RESOLVED_FOODS_CACHE.has(norm)) {
    return RESOLVED_FOODS_CACHE.get(norm);
  }

  return null;
}

/**
 * Resolución con IA para el 1% de alimentos desconocidos o fuera de catálogo:
 * Consulta a Claude si corresponde a un alimento del catálogo o pide sus macros por 100g en crudo.
 */
export async function resolveUnknownFoodWithAI(foodName) {
  const norm = normalize(foodName);
  if (!norm) return CATEGORY_FALLBACKS.verduras_y_hortalizas;

  if (RESOLVED_FOODS_CACHE.has(norm)) {
    return RESOLVED_FOODS_CACHE.get(norm);
  }

  const client = getAnthropic();
  if (!client) {
    // Fallback semántico inmediato si no hay cliente de IA disponible
    const fallback = getSemanticFallback(foodName);
    RESOLVED_FOODS_CACHE.set(norm, fallback);
    return fallback;
  }

  try {
    const sampleNames = FOOD_NAMES_LIST.slice(0, 80).join(', ');
    const response = await client.messages.create({
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
  const norm = normalize(foodName);
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
  return CATEGORY_FALLBACKS.verduras_y_hortalizas;
}

/**
 * Parsea un ítem de comida extrayendo su nombre y gramos o unidades
 */
export function parseMealItem(itemText) {
  const clean = itemText.trim();
  if (!clean) return null;

  // Extraer gramos o mililitros
  const gMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|gramos|ml)/i);
  let grams = gMatch ? parseFloat(gMatch[1]) : null;

  // Extraer unidades si no hay gramos
  let hasUnits = false;
  let unitCount = 1;
  const uMatch = clean.match(/(\d+)\s*(?:unidades|unidad|scoop|bote|botella)/i);
  if (uMatch) {
    hasUnits = true;
    unitCount = parseInt(uMatch[1], 10);
    if (grams === null) {
      if (clean.toLowerCase().includes('huevo')) {
        grams = unitCount * 50;
      } else if (clean.toLowerCase().includes('ensure')) {
        grams = 100;
      }
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
      const insideName = inside.replace(/\b\d+(?:\.\d+)?\s*(?:g|gr|gramos|ml)\b/gi, '').trim();
      if (insideName) {
        insideFood = findFoodInCatalog(insideName);
      }
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
  let food = insideFood || findFoodInCatalog(nameOnly);
  if (!food) {
    food = getSemanticFallback(nameOnly);
  }

  return {
    rawText: clean,
    name: nameOnly,
    grams: grams || 100,
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
    const parsed = parseMealItem(part);
    if (parsed) {
      // Si el alimento no se encontró en catálogo oficial, intentar resolver con IA
      if (!findFoodInCatalog(parsed.name)) {
        parsed.food = await resolveUnknownFoodWithAI(parsed.name);
      }
      parsedItems.push(parsed);
    }
  }

  if (parsedItems.length === 0) return mealDetailStr;

  // Consolidar duplicados del mismo alimento (ej: dos entradas de "Arroz blanco")
  const consolidatedMap = new Map();
  parsedItems.forEach(it => {
    const key = normalize(it.food?.name || it.name);
    if (consolidatedMap.has(key)) {
      const existing = consolidatedMap.get(key);
      existing.grams = (existing.grams || 100) + (it.grams || 100);
      if (it.hasUnits) existing.unitCount = (existing.unitCount || 1) + (it.unitCount || 1);
    } else {
      consolidatedMap.set(key, { ...it });
    }
  });
  parsedItems = Array.from(consolidatedMap.values());

  // SALVAGUARDA DETERMINISTA DE SEGURIDAD CLÍNICA (ALLERGY & INTOLERANCE GUARD):
  // Si el jugador no tolera pescado, marisco o cerdo y la IA lo ha incluido, se sustituye
  // automáticamente por una proteína segura equivalente (pechuga de pollo/pavo) antes de calibrar.
  if (options.isFishIntolerant) {
    const FISH_KW = ['pescado', 'merluza', 'dorada', 'lubina', 'corvina', 'bacalao', 'salmon', 'salmón', 'atun', 'atún', 'emperador', 'sepia', 'calamar', 'pulpo', 'gamba', 'gambas', 'langostino', 'marisco', 'pez espada', 'bonito'];
    parsedItems.forEach(it => {
      const isFish = it.food?.category === 'pescados_y_mariscos' ||
        FISH_KW.some(kw => it.name.toLowerCase().includes(kw) || it.food?.name?.toLowerCase().includes(kw));
      if (isFish) {
        console.warn(`[SEGURIDAD CLÍNICA] Sustituyendo "${it.name}" por Pechuga de pollo debido a intolerancia/alergia a pescado.`);
        it.name = 'Pechuga de pollo';
        it.food = findFoodInCatalog('Pechuga de pollo') || CATEGORY_FALLBACKS.carnes_y_aves;
      }
    });
  }

  if (options.isPorkIntolerant) {
    const PORK_KW = ['cerdo', 'secreto', 'lomo', 'jamon', 'jamón', 'bacon', 'presa', 'chorizo', 'panceta'];
    parsedItems.forEach(it => {
      const isPork = PORK_KW.some(kw => it.name.toLowerCase().includes(kw) || it.food?.name?.toLowerCase().includes(kw));
      if (isPork) {
        console.warn(`[SEGURIDAD CLÍNICA] Sustituyendo "${it.name}" por Pechuga de pollo debido a restricción de cerdo.`);
        it.name = 'Pechuga de pollo';
        it.food = findFoodInCatalog('Pechuga de pollo') || CATEGORY_FALLBACKS.carnes_y_aves;
      }
    });
  }

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
    options.mealName.toLowerCase().includes('cena') ||
    options.mealName.toLowerCase().includes('almuerzo')
  );

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

    // Proteína primaria (carne, ave, pescado o claras escalables)
    if (cat === 'carnes_y_aves' || cat === 'pescados_y_mariscos' || (cat === 'huevos_y_lacteos' && it.food.pro > 10)) {
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
    const neededCho = Math.max(15, targetBudget.hc - nonPrimaryCarbs);
    let exactCarbGrams = roundToFive(neededCho / choFactor);

    const foodNameLow = carbItem.food.name.toLowerCase();
    if (foodNameLow.includes('patata') || foodNameLow.includes('boniato') || foodNameLow.includes('batata')) {
      exactCarbGrams = Math.max(150, Math.min(500, exactCarbGrams));
    } else if (foodNameLow.includes('pan')) {
      const maxPan = isMainMeal ? 80 : 180;
      exactCarbGrams = Math.max(30, Math.min(maxPan, exactCarbGrams));
    } else if (foodNameLow.includes('torta') || foodNameLow.includes('tortita')) {
      exactCarbGrams = Math.max(30, Math.min(100, exactCarbGrams));
    } else {
      // Granos secos: arroz, pasta, quinoa, cuscús (máximo digerible de ~180-190g)
      exactCarbGrams = Math.max(50, Math.min(190, exactCarbGrams));
    }
    carbItem.grams = roundToFive(exactCarbGrams);
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
    const neededPro = Math.max(15, targetBudget.p - nonPrimaryProtein);
    let exactProteinGrams = roundToFive(neededPro / proFactor);
    exactProteinGrams = Math.max(80, Math.min(320, exactProteinGrams));
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
    const neededFat = Math.max(5, targetBudget.g - nonPrimaryFat);
    let exactFatGrams = roundToFive(neededFat / fatFactor);
    exactFatGrams = Math.max(5, Math.min(25, exactFatGrams));
    fatItem.grams = roundToFive(exactFatGrams);
  }

  // Reconstruir la descripción con formato limpio, profesional y elegante
  const resultParts = parsedItems.map(it => {
    let cleanName = it.name.trim();

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
    if (low.includes('huevo entero')) {
      const units = it.unitCount || (it.grams ? Math.max(1, Math.round(it.grams / 50)) : 1);
      const unitStr = units === 1 ? '1 unidad' : `${units} unidades`;
      return `Huevo entero ${unitStr} (${roundToFive(units * 50)}g)`;
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

export { FOODS_CRUDO, FOOD_NAMES_LIST };
