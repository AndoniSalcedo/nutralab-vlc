import { extractPlannedCarbAndProtein } from './food-tree.js';

/**
 * Planificación de variedad: decide qué hidratos y proteínas debe evitar una toma según lo que ya hay en el
 * mismo día (la memoria que guarda el WeeklyVarietyTracker) y según las alternativas de la cena del comedor.
 */

export function comboCollides(combo, proteinBranchesToAvoid, carbBranchesToAvoid, clinicalCatalog) {
  for (const dish of combo?.dishes || []) {
    const info = extractPlannedCarbAndProtein(dish?.tree || dish, clinicalCatalog);
    if (info.proteinBranches?.some((branch) => proteinBranchesToAvoid.has(branch))) return true;
    if (info.carbBranches?.some((branch) => carbBranchesToAvoid.has(branch))) return true;
  }
  return false;
}

export /**
 * Cena de menú de comedor: la comida del mismo día no puede repetir un hidrato o una proteína que TODAS las
 * combinaciones posibles de la cena comparten (si la cena tiene alternativas, ella misma evita la colisión).
 */
function plannedBuffetDinner(cenaTree, clinicalCatalog) {
  const combos = cenaTree?.kind === 'menu-options' ? cenaTree.combinations : null;
  if (!Array.isArray(combos) || combos.length === 0) return null;
  const perCombo = combos.map((combo) => {
    const carbs = new Set();
    const proteins = new Set();
    for (const dish of combo?.dishes || []) {
      const info = extractPlannedCarbAndProtein(dish?.tree || dish, clinicalCatalog);
      (info.carbBranches || []).forEach((branch) => carbs.add(branch));
      (info.proteinBranches || []).forEach((branch) => proteins.add(branch));
    }
    return { carbs, proteins };
  });
  const common = (key) => [...perCombo[0][key]].filter((branch) => perCombo.every((entry) => entry[key].has(branch)));
  const fixedCarbBranch = common('carbs')[0] || null;
  const fixedProteinBranch = common('proteins')[0] || null;
  if (!fixedCarbBranch && !fixedProteinBranch) return null;
  return { hasDisjunction: true, carbBranches: [], proteinBranches: [], fixedCarbBranch, fixedProteinBranch };
}

/**
 * Ramas de hidrato y de proteína que una toma debe evitar: las de la comida del mismo día (si es la cena) o las
 * que comparten todas las cenas posibles (si es la comida).
 */
export function getBranchesToAvoid(tracker, isDinner = false) {
  const plannedDinner = !isDinner ? tracker?.getTodayPlannedDinner() : null;
  const todayLunch = isDinner ? tracker?.getTodayLunch() : null;
  const carbBranchesToAvoid = new Set([
    ...(plannedDinner?.fixedCarbBranch ? [plannedDinner.fixedCarbBranch] : []),
    ...(isDinner ? todayLunch?.carbBranches || [] : []),
  ]);
  const proteinBranchesToAvoid = new Set([
    ...(plannedDinner?.fixedProteinBranch ? [plannedDinner.fixedProteinBranch] : []),
    ...(isDinner ? todayLunch?.proteinBranches || [] : []),
  ]);
  return { carbBranchesToAvoid, proteinBranchesToAvoid };
}
