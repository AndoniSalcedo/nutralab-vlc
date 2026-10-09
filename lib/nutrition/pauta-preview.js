import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import {
  buildContextualPlayerFoodTree,
  buildPlayerFoodTree,
  buildPreMatchFoodTree,
  createFoodItemFromName,
  getAvailableFoods,
  getNodeFromTree,
} from '@/lib/engine/food-tree';

// Ramas de carne y pescado para cocinar: en una toma ligera suelen ser un error de interpretación (se quería fiambre).
const COOKING_PROTEIN_BRANCHES = new Set([
  'carne', 'pollo', 'pavo', 'conejo', 'vacuno', 'cerdo', 'carnes_otras',
  'pescado', 'pescado_blanco', 'pescado_azul', 'marisco',
]);

/**
 * Qué puede salir de cada grupo que nombra una pauta en su toma, para revisarla antes de guardarla. Sigue las mismas
 * reglas que el motor: el grupo se resuelve con el catálogo del jugador; los grupos amplios (Proteínas, Hidratos...)
 * además con las reglas de composición de la toma, y las tomas del protocolo de partido sin fibra ni FODMAP.
 * Los alimentos concretos no se listan: se sirven tal cual.
 *
 * @returns {Array<{ name: string, foods: string[], cookingInLightMeal: boolean }>}
 */
export function previewPautaGroups(tree, { jugador = null, mealName = 'Comida', isMainMeal = true, isPreMatch = false } = {}) {
  if (!tree) return [];
  const catalog = getClinicalCatalogForPlayer(jugador || [], { useMenuCatalog: false });
  const baseTree = isPreMatch ? buildPreMatchFoodTree(catalog) : buildPlayerFoodTree(catalog);
  const contextualTree = buildContextualPlayerFoodTree(baseTree, { mealName, isMainMeal });
  const rootBranchIds = new Set(Object.values(baseTree.children || {}).map((child) => child.id));

  const groups = new Map();
  const visit = (node) => {
    if (!node) return;
    if (node.type !== 'food') {
      (node.children || []).forEach(visit);
      return;
    }
    const name = node.name;
    if (!name || groups.has(name) || createFoodItemFromName(name, null, baseTree)) return;
    const branch = getNodeFromTree(name, baseTree);
    if (!branch?.id) return;
    const tree = rootBranchIds.has(branch.id) ? contextualTree : baseTree;
    const foods = getAvailableFoods(getNodeFromTree(name, tree), tree);
    const cookingInLightMeal = !isMainMeal && (branch.treePath || []).some((id) => COOKING_PROTEIN_BRANCHES.has(id));
    groups.set(name, { name, foods, cookingInLightMeal });
  };
  visit(tree);
  return Array.from(groups.values());
}
