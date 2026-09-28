/**
 * Gestor de Memoria Culinaria Semanal para evitar repeticiones consecutivas y garantizar variedad.
 */
export class WeeklyVarietyTracker {
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
    if (item) this.recentProteins.push(item);
    if (branch && branch !== item) this.recentProteins.push(branch);
    if (this.recentProteins.length > 12) this.recentProteins.shift();
  }

  isProteinRecent(item, branch = null) {
    // 1. Evitar colisión con la proteína de la cena planificada para hoy (para que la comida no la repita)
    const plannedBranch = this.todayPlannedDinner?.proteinBranch;
    const plannedFood = this.todayPlannedDinner?.proteinFood;
    if (plannedBranch && (item === plannedBranch || branch === plannedBranch)) return true;
    if (plannedFood && item === plannedFood) return true;

    // 2. Evitar colisión con la proteína del almuerzo de hoy (para que la cena no lo repita)
    const lunchBranch = this.todayLunch?.proteinBranch;
    const lunchFood = this.todayLunch?.proteinFood;
    if (lunchBranch && (item === lunchBranch || branch === lunchBranch)) return true;
    if (lunchFood && item === lunchFood) return true;

    // 3. Evitar alimentos o familias recientes de días anteriores
    if (item && this.recentProteins.includes(item)) return true;
    if (branch && this.recentProteins.includes(branch)) return true;
    return false;
  }

  recordCarb(item, branch = null) {
    if (!item && !branch) return;
    if (item) this.recentCarbs.push(item);
    if (branch && branch !== item) this.recentCarbs.push(branch);
    if (this.recentCarbs.length > 12) this.recentCarbs.shift();
  }

  isCarbRecent(item, branch = null) {
    // 1. Evitar colisión con el hidrato planificado para la cena de hoy (para que la comida no lo repita)
    const plannedBranch = this.todayPlannedDinner?.carbBranch;
    const plannedFood = this.todayPlannedDinner?.carbFood;
    if (plannedBranch && (item === plannedBranch || branch === plannedBranch)) return true;
    if (plannedFood && item === plannedFood) return true;

    // 2. Evitar colisión con el hidrato del almuerzo de hoy (para que la cena no lo repita)
    const lunchBranch = this.todayLunch?.carbBranch;
    const lunchFood = this.todayLunch?.carbFood;
    if (lunchBranch && (item === lunchBranch || branch === lunchBranch)) return true;
    if (lunchFood && item === lunchFood) return true;

    // 3. Evitar hidratos o familias recientes de días anteriores
    if (item && this.recentCarbs.includes(item)) return true;
    if (branch && this.recentCarbs.includes(branch)) return true;
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
export function selectFoodWithVariety(foods, tracker, isRecentFn, recordFn) {
  if (!Array.isArray(foods) || foods.length === 0) return null;
  if (foods.length === 1) {
    if (recordFn && tracker) recordFn.call(tracker, foods[0]);
    return foods[0];
  }

  const nonRecent = tracker && isRecentFn ? foods.filter((f) => !isRecentFn.call(tracker, f)) : foods;
  const pool = nonRecent.length > 0 ? nonRecent : foods;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  if (recordFn && tracker) recordFn.call(tracker, chosen);
  return chosen;
}
