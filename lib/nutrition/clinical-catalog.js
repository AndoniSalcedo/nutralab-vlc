/**
 * Motor Determinista de Catálogo Clínico para Nutralab
 * Filtra el catálogo oficial FOODS_CRUDO según el perfil clínico del jugador en <0.1ms y sin llamadas a IA.
 * 
 * Arquitectura basada en etiquetas ('tags') en cada alimento de data/foods-crudo.js:
 * - El jugador intolerante/alérgico recibe opciones aptas y se le purgan los alérgenos.
 * - El jugador tolerante/sano recibe alimentos estándar y se le purgan los productos especiales
 *   ('sin_gluten_especial', 'sin_lactosa_especial') para evitar que la IA los prescriba por error.
 */

import { FOODS_CRUDO, normalizeFoodName } from '@/data/foods-crudo';
import { parsePlayerClinicalTags, formatClinicalTags } from '@/config/clinical-tags';

// Cache por clave de tags para no recomputar catálogos idénticos
const CATALOG_CACHE = new Map();

/**
 * Obtiene el catálogo limpio y 100% determinista para un jugador dado basándose en las etiquetas (tags) de cada alimento.
 * 
 * @param {Object|Array|string} playerOrTags - Ficha del jugador o lista de tags
 * @returns {{
 *   foods: Array,
 *   normalizedNamesList: string[],
 *   foodsByNormalizedName: Map,
 *   activeTags: string[],
 *   summary: string
 * }}
 */
export function getClinicalCatalogForPlayer(playerOrTags) {
  const activeTags = parsePlayerClinicalTags(playerOrTags);
  const cacheKey = activeTags.slice().sort().join('|');

  if (CATALOG_CACHE.has(cacheKey)) {
    return CATALOG_CACHE.get(cacheKey);
  }

  const tagsSet = new Set(activeTags);
  const hasGlutenRestriction = tagsSet.has('sin_gluten');
  const hasLactoseRestriction = tagsSet.has('sin_lactosa');
  const hasSiboRestriction = tagsSet.has('sibo_low_fodmap');
  const hasPorkRestriction = tagsSet.has('sin_cerdo');
  const hasFishRestriction = tagsSet.has('sin_pescado');
  const hasSeafoodRestriction = tagsSet.has('sin_marisco');
  const hasEggRestriction = tagsSet.has('sin_huevo');
  const hasNutRestriction = tagsSet.has('sin_frutos_secos');
  const hasSoyRestriction = tagsSet.has('sin_soja');
  const hasRedMeatRestriction = tagsSet.has('sin_carne_roja');
  const isVegetarian = tagsSet.has('vegetariano');
  const isVegan = tagsSet.has('vegano');

  const filteredFoods = FOODS_CRUDO.filter((f) => {
    const foodTags = f.tags || [];

    // 1. REGLA GLUTEN (Bidireccional)
    if (hasGlutenRestriction) {
      if (foodTags.includes('gluten')) return false;
    } else {
      // Si el jugador NO tiene restricción de gluten, purgar productos especiales sin gluten
      if (foodTags.includes('sin_gluten_especial')) return false;
    }

    // 2. REGLA LACTOSA (Bidireccional)
    if (hasLactoseRestriction) {
      if (foodTags.includes('lactosa')) return false;
    } else {
      // Si el jugador NO tiene restricción de lactosa, purgar productos especiales sin lactosa
      if (foodTags.includes('sin_lactosa_especial')) return false;
    }

    // 3. REGLA SIBO / BAJO FODMAP
    if (hasSiboRestriction) {
      if (foodTags.includes('alto_fodmap') || foodTags.includes('lactosa') || foodTags.includes('gluten')) return false;
    }

    // 4. REGLA CERDO / HALAL
    if (hasPorkRestriction && foodTags.includes('cerdo')) return false;

    // 5. REGLA PESCADO
    if (hasFishRestriction && foodTags.includes('pescado')) return false;

    // 6. REGLA MARISCO
    if (hasSeafoodRestriction && foodTags.includes('marisco')) return false;

    // 7. REGLA HUEVO
    if (hasEggRestriction && foodTags.includes('huevo')) return false;

    // 8. REGLA FRUTOS SECOS
    if (hasNutRestriction && foodTags.includes('fruto_seco')) return false;

    // 9. REGLA SOJA
    if (hasSoyRestriction && foodTags.includes('soja')) return false;

    // 10. REGLA CARNE ROJA
    if (hasRedMeatRestriction && foodTags.includes('carne_roja')) return false;

    // 11. REGLA VEGETARIANO
    if (isVegetarian) {
      if (f.category === 'carnes_y_aves' || f.category === 'pescados_y_mariscos') return false;
    }

    // 12. REGLA VEGANO
    if (isVegan) {
      if (f.category === 'carnes_y_aves' || f.category === 'pescados_y_mariscos') return false;
      if (foodTags.includes('huevo') || foodTags.includes('lactosa') || foodTags.includes('sin_lactosa_especial')) return false;
    }

    return true;
  });

  const normalizedNamesList = filteredFoods.map((f) => f.normalizedName);
  const foodsByNormalizedName = new Map(filteredFoods.map((f) => [f.normalizedName, f]));

  const summary = activeTags.length > 0
    ? `Restricciones activas (${activeTags.length}): ${formatClinicalTags(activeTags)}`
    : 'Perfil clínico estándar (Tolerante / Sin restricciones específicas)';

  const result = {
    foods: filteredFoods,
    normalizedNamesList,
    foodsByNormalizedName,
    activeTags,
    summary,
  };

  CATALOG_CACHE.set(cacheKey, result);
  return result;
}

/**
 * Valida si un alimento es clínicamente seguro para un jugador.
 */
export function isFoodSafeForPlayer(foodName, playerOrTags) {
  const catalog = getClinicalCatalogForPlayer(playerOrTags);
  const norm = normalizeFoodName(foodName);
  return catalog.foodsByNormalizedName.has(norm);
}
