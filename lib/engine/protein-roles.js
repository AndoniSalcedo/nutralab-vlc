import { hasTreePath, isAnimalProteinFood, isDairyFood, isEggFood, isEmbutidoFood } from './food-tree.js';

/**
 * Papel de un alimento como proteína en una toma. Es la única regla del motor para decidirlo: la usan la selección de
 * platos del menú, la preparación de raciones y el calculador.
 *
 * Comida y cena:
 * - principal: carne, pescado, marisco y conservas de pescado; en vegetarianos y veganos, la proteína vegetal (tofu,
 *   seitán...). Es la que se ajusta para cuadrar la proteína de la toma.
 * - acompañamiento: fiambres, huevos y lácteos (jamón en unas judías, huevo en un arroz tres delicias, queso de una
 *   coliflor gratinada, yogur de postre). Ración fija; nunca son la proteína principal.
 * Desayuno, almuerzo, merienda: es principal cualquier fuente de proteína (carne, pescado, fiambre, huevo o lácteo
 * con al menos 8 g de proteína por 100 g).
 * Las legumbres son siempre hidrato de plato, nunca la proteína.
 */
export const PROTEIN_ROLE = { MAIN: 'principal', SIDE: 'acompanamiento' };

const MIN_DAIRY_PROTEIN_SOURCE_PRO = 8; // proteína (g/100 g) a partir de la cual un lácteo es fuente de proteína

const isPlantProtein = (food) => hasTreePath(food, 'vegetal_proteina');
const isMainMealSide = (food) => isEmbutidoFood(food) || isEggFood(food) || isDairyFood(food);

/**
 * @param {Object} food - Ficha del alimento
 * @param {{ isMainMeal: boolean, allowsPlantProtein?: boolean }} context
 * @returns {'principal'|'acompanamiento'|null}
 */
export function getProteinRole(food, { isMainMeal, allowsPlantProtein = false } = {}) {
  if (!food || hasTreePath(food, 'legumbres')) return null;
  if (isPlantProtein(food)) return allowsPlantProtein ? PROTEIN_ROLE.MAIN : null;
  if (isMainMeal) {
    if (isMainMealSide(food)) return PROTEIN_ROLE.SIDE;
    return isAnimalProteinFood(food) ? PROTEIN_ROLE.MAIN : null;
  }
  const isProteinSource = isAnimalProteinFood(food)
    || isEggFood(food)
    || (isDairyFood(food) && Number(food.pro || 0) >= MIN_DAIRY_PROTEIN_SOURCE_PRO);
  return isProteinSource ? PROTEIN_ROLE.MAIN : null;
}

/** El catálogo del jugador admite proteína vegetal como proteína principal (vegetarianos y veganos). */
export function allowsPlantProteinFor(clinicalCatalog) {
  const tags = clinicalCatalog?.activeTags || [];
  return tags.includes('vegano') || tags.includes('vegetariano');
}
