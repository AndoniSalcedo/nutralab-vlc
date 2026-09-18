/**
 * Motor Determinista de Catálogo Clínico para Nutralab
 * Filtra el catálogo oficial FOODS_CRUDO según el perfil clínico del jugador en <0.1ms y sin llamadas a IA.
 * 
 * Arquitectura basada en etiquetas ('tags') en cada alimento de data/foods-crudo.js:
 * - El jugador intolerante/alérgico recibe opciones aptas y se le purgan los alérgenos.
 * - El jugador tolerante/sano recibe alimentos estándar y se le purgan los productos especiales
 *   ('sin_gluten_especial', 'sin_lactosa_especial') para evitar que la IA los prescriba por error.
 */

import { FOODS_CRUDO, normalizeFoodName } from '../../data/foods-crudo.js';
import { FOODS_MENU } from '../../data/foods-menu.js';
import { parsePlayerClinicalTags, formatClinicalTags } from '../../config/clinical-tags.js';
import { isAnimalProteinFood } from '../engine/food-tree.js';

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
export function getClinicalCatalogForPlayer(playerOrTags, { useMenuCatalog = false } = {}) {
  const activeTags = parsePlayerClinicalTags(playerOrTags);
  const cacheKey = `${useMenuCatalog ? 'menu:' : ''}${activeTags.slice().sort().join('|')}`;

  if (CATALOG_CACHE.has(cacheKey)) {
    return CATALOG_CACHE.get(cacheKey);
  }

  const tagsSet = new Set(activeTags);
  const hasGlutenRestriction = tagsSet.has('sin_gluten');
  const hasLactoseRestriction = tagsSet.has('sin_lactosa');
  const hasSiboGeneral = tagsSet.has('sibo_low_fodmap');
  const hasSiboH2 = tagsSet.has('sibo_hidrogeno');
  const hasSiboImo = tagsSet.has('sibo_metano_imo');
  const hasSiboMixto = tagsSet.has('sibo_mixto');
  const hasSiboSulfuro = tagsSet.has('sibo_sulfuro');
  const hasIbsRestriction = tagsSet.has('colon_irritable');

  const hasFodmapDigestiveRestriction =
    hasSiboGeneral ||
    hasSiboH2 ||
    hasSiboImo ||
    hasSiboMixto ||
    hasSiboSulfuro ||
    hasIbsRestriction;

  const hasPorkRestriction = tagsSet.has('sin_cerdo');
  const hasFishRestriction = tagsSet.has('sin_pescado');
  const hasSeafoodRestriction = tagsSet.has('sin_marisco');
  const hasEggRestriction = tagsSet.has('sin_huevo');
  const hasNutRestriction = tagsSet.has('sin_frutos_secos');
  const hasSoyRestriction = tagsSet.has('sin_soja');
  const hasRedMeatRestriction = tagsSet.has('sin_carne_roja');
  const hasCowProteinRestriction = tagsSet.has('sin_proteina_vaca');
  const hasFructoseRestriction = tagsSet.has('sin_fructosa');
  const isVegetarian = tagsSet.has('vegetariano');
  const isVegan = tagsSet.has('vegano');

  // Necesidad de alternativas sin gluten: Celíacos y jugadores con patología digestiva / SIBO / bajo FODMAP
  const needsGlutenFreeAlternatives = hasGlutenRestriction || hasFodmapDigestiveRestriction;

  // Necesidad de alternativas sin lactosa: Intolerantes a lactosa y jugadores con patología digestiva / SIBO / bajo FODMAP
  const needsLactoseFreeAlternatives = hasLactoseRestriction || hasFodmapDigestiveRestriction;

  const sourceFoods = useMenuCatalog ? FOODS_MENU : FOODS_CRUDO;
  const filteredFoods = sourceFoods.filter((f) => {
    const foodTags = f.tags || [];
    const isPlantProtein = foodTags.includes('proteina_vegetal') || (Array.isArray(f.treePath) && f.treePath.includes('vegetal_proteina'));

    if (isPlantProtein && !isVegetarian && !isVegan) return false;

    // 1. REGLA GLUTEN (Bidireccional con alternativas)
    if (needsGlutenFreeAlternatives) {
      // Excluir cualquier alimento que contenga gluten
      if (foodTags.includes('gluten')) return false;
    } else {
      // Si el jugador no necesita restricción de gluten ni digestiva, purgar productos especiales sin gluten
      if (foodTags.includes('sin_gluten_especial')) return false;
    }

    // 2. REGLA LACTOSA (Bidireccional con alternativas)
    if (needsLactoseFreeAlternatives) {
      // Excluir cualquier lácteo tradicional con lactosa
      if (foodTags.includes('lactosa')) return false;
    } else {
      // Si el jugador no necesita restricción de lactosa ni digestiva, purgar productos especiales sin lactosa
      // (a menos que tenga APLV o sea vegano, que usan el batido vegetal)
      if (!hasCowProteinRestriction && !isVegan && foodTags.includes('sin_lactosa_especial')) return false;
    }

    // 2b. REGLA PROTEÍNA DE LECHE DE VACA (APLV) - Estricta: purga el 100% de lácteos y derivados bovinos (incluso sin lactosa)
    if (hasCowProteinRestriction) {
      if (foodTags.includes('proteina_vaca') || foodTags.includes('lactosa')) return false;
      if (foodTags.includes('sin_lactosa_especial') && !f.name.toLowerCase().includes('vegetal')) return false;
    }

    // 3. REGLA SIBO (TODOS LOS SUBTIPOS) / COLON IRRITABLE (SII) / BAJO FODMAP
    if (hasFodmapDigestiveRestriction) {
      // Excluir alimentos con alta carga fermentable (FODMAP)
      if (foodTags.includes('alto_fodmap')) return false;
    }

    // 3b. REGLA SIBO SULFHÍDRICO (H2S) - Bajo en Azufre: Excluye huevos, carnes rojas y alimentos ricos en azufre
    if (hasSiboSulfuro) {
      if (foodTags.includes('huevo') || foodTags.includes('carne_roja') || foodTags.includes('alto_azufre')) return false;
    }

    // 3c. REGLA FRUCTOSA (Intolerancia / Alergia) - Excluye alimentos con alto contenido en fructosa libre
    if (hasFructoseRestriction && foodTags.includes('fructosa')) return false;

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
      if (isAnimalProteinFood(f)) return false;
    }

    // 12. REGLA VEGANO
    if (isVegan) {
      if (isAnimalProteinFood(f)) return false;
      if (foodTags.includes('huevo') || foodTags.includes('lactosa') || foodTags.includes('proteina_vaca')) return false;
      if (foodTags.includes('sin_lactosa_especial') && !f.name.toLowerCase().includes('vegetal')) return false;
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
