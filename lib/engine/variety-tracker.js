/**
 * Gestor de Memoria Culinaria Semanal para evitar repeticiones consecutivas y garantizar variedad.
 */
export class WeeklyVarietyTracker {
  static knownProteinBranches = new Set();
  static knownCarbBranches = new Set();

  static setKnownBranches({ proteinBranches, carbBranches } = {}) {
    if (Array.isArray(proteinBranches) || proteinBranches instanceof Set) {
      this.knownProteinBranches = new Set(proteinBranches);
    }
    if (Array.isArray(carbBranches) || carbBranches instanceof Set) {
      this.knownCarbBranches = new Set(carbBranches);
    }
  }

  static isProteinBranch(name) {
    return Boolean(name && this.knownProteinBranches.has(name));
  }

  static isCarbBranch(name) {
    return Boolean(name && this.knownCarbBranches.has(name));
  }

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

  /** Copia del estado de variedad para poder probar una selección y volver atrás. */
  snapshot() {
    const state = { ...this };
    delete state.player;
    return structuredClone(state);
  }

  restore(snapshot) {
    if (snapshot) Object.assign(this, structuredClone(snapshot));
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

  recordProtein(item, branch = null) {
    if (!item && !branch) return;
    if (item && !branch && WeeklyVarietyTracker.isProteinBranch(item)) {
      branch = item;
      item = null;
    }
    if (item) {
      this.recentProteins.push(item);
      if (this.recentProteins.length > 8) this.recentProteins.shift();
    }
    if (branch) {
      if (!this.recentProteinBranches) this.recentProteinBranches = [];
      this.recentProteinBranches.push(branch);
      if (this.recentProteinBranches.length > 3) this.recentProteinBranches.shift();
    }
  }

  isSameDayProtein(item, branch = null) {
    if (item && !branch && WeeklyVarietyTracker.isProteinBranch(item)) {
      branch = item;
    }
    const plannedBranches = this.todayPlannedDinner?.proteinBranches || (this.todayPlannedDinner?.proteinBranch ? [this.todayPlannedDinner.proteinBranch] : []);
    const plannedFoods = this.todayPlannedDinner?.proteinFoods || (this.todayPlannedDinner?.proteinFood ? [this.todayPlannedDinner.proteinFood] : []);
    if (branch && plannedBranches.includes(branch)) return true;
    if (item && (plannedBranches.includes(item) || plannedFoods.includes(item))) return true;

    const lunchBranches = this.todayLunch?.proteinBranches || (this.todayLunch?.proteinBranch ? [this.todayLunch.proteinBranch] : []);
    const lunchFoods = this.todayLunch?.proteinFoods || (this.todayLunch?.proteinFood ? [this.todayLunch.proteinFood] : []);
    if (branch && lunchBranches.includes(branch)) return true;
    if (item && (lunchBranches.includes(item) || lunchFoods.includes(item))) return true;
    return false;
  }

  isProteinRecent(item, branch = null) {
    if (item && !branch && WeeklyVarietyTracker.isProteinBranch(item)) {
      branch = item;
    }
    if (this.isSameDayProtein(item, branch)) return true;
    if (item && this.recentProteins.includes(item)) return true;
    if (branch && this.recentProteinBranches?.includes(branch)) return true;
    return false;
  }

  recordCarb(item, branch = null) {
    if (!item && !branch) return;
    if (item && !branch && WeeklyVarietyTracker.isCarbBranch(item)) {
      branch = item;
      item = null;
    }
    if (item) {
      this.recentCarbs.push(item);
      if (this.recentCarbs.length > 8) this.recentCarbs.shift();
    }
    if (branch) {
      if (!this.recentCarbBranches) this.recentCarbBranches = [];
      this.recentCarbBranches.push(branch);
      if (this.recentCarbBranches.length > 2) this.recentCarbBranches.shift();
    }
  }

  isSameDayCarb(item, branch = null) {
    if (item && !branch && WeeklyVarietyTracker.isCarbBranch(item)) {
      branch = item;
    }
    const plannedBranches = this.todayPlannedDinner?.carbBranches || (this.todayPlannedDinner?.carbBranch ? [this.todayPlannedDinner.carbBranch] : []);
    const plannedFoods = this.todayPlannedDinner?.carbFoods || (this.todayPlannedDinner?.carbFood ? [this.todayPlannedDinner.carbFood] : []);
    if (branch && plannedBranches.includes(branch)) return true;
    if (item && (plannedBranches.includes(item) || plannedFoods.includes(item))) return true;

    const lunchBranches = this.todayLunch?.carbBranches || (this.todayLunch?.carbBranch ? [this.todayLunch.carbBranch] : []);
    const lunchFoods = this.todayLunch?.carbFoods || (this.todayLunch?.carbFood ? [this.todayLunch.carbFood] : []);
    if (branch && lunchBranches.includes(branch)) return true;
    if (item && (lunchBranches.includes(item) || lunchFoods.includes(item))) return true;
    return false;
  }

  isCarbRecent(item, branch = null) {
    if (item && !branch && WeeklyVarietyTracker.isCarbBranch(item)) {
      branch = item;
    }
    if (this.isSameDayCarb(item, branch)) return true;
    if (item && this.recentCarbs.includes(item)) return true;
    if (branch && this.recentCarbBranches?.includes(branch)) return true;
    return false;
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
 * Selecciona un alimento de una lista garantizando variedad y registrando la elección en el tracker.
 */
export function selectFoodWithVariety(foods, tracker, isRecentFn, recordFn, isSameDayFn = null, getBranchFn = null) {
  if (!Array.isArray(foods) || foods.length === 0) return null;
  if (foods.length === 1) {
    if (recordFn && tracker) recordFn.call(tracker, foods[0]);
    return foods[0];
  }

  // 1. Filtrar estrictamente cualquier alimento que colisione con el mismo día (almuerzo / cena)
  const safePool = tracker && isSameDayFn
    ? foods.filter((f) => !isSameDayFn.call(tracker, f))
    : foods;
  const candidatePool = safePool.length > 0 ? safePool : foods;

  // 2. Sobre el pool seguro, filtrar alimentos o ramas recientes de días anteriores
  const nonRecent = tracker && isRecentFn ? candidatePool.filter((f) => !isRecentFn.call(tracker, f)) : candidatePool;
  const pool = nonRecent.length > 0 ? nonRecent : candidatePool;

  let chosen;
  // Si se provee getBranchFn, agrupar primero por sub-rama para asegurar rotación equilibrada entre sub-grupos
  if (typeof getBranchFn === 'function') {
    const branchesMap = new Map();
    for (const f of pool) {
      const b = getBranchFn(f) || '__default__';
      if (!branchesMap.has(b)) branchesMap.set(b, []);
      branchesMap.get(b).push(f);
    }
    const branchKeys = Array.from(branchesMap.keys());
    const chosenBranch = branchKeys[Math.floor(Math.random() * branchKeys.length)];
    const branchFoods = branchesMap.get(chosenBranch);
    chosen = branchFoods[Math.floor(Math.random() * branchFoods.length)];
  } else {
    chosen = pool[Math.floor(Math.random() * pool.length)];
  }

  if (recordFn && tracker) recordFn.call(tracker, chosen);
  return chosen;
}
