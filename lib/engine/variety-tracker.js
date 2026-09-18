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

  recordProtein(item) {
    if (!item) return;
    this.recentProteins.push(item);
    if (this.recentProteins.length > 8) this.recentProteins.shift();
  }

  isProteinRecent(item) {
    return this.recentProteins.includes(item);
  }

  recordCarb(item) {
    if (!item) return;
    this.recentCarbs.push(item);
    if (this.recentCarbs.length > 8) this.recentCarbs.shift();
  }

  isCarbRecent(item) {
    return this.recentCarbs.includes(item);
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
