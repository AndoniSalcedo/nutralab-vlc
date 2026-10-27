/**
 * Gestor de Memoria Culinaria Semanal para evitar repeticiones y garantizar variedad.
 *
 * La memoria se guarda por días: qué ramas de proteína e hidrato, qué alimentos, qué tipos de procesado (picada,
 * hamburguesa, noodles...) y qué frutas y verduras se han servido cada día. Con ella el motor evita:
 * - en el mismo día, repetir en la cena lo de la comida (rama, alimento o procesado);
 * - en días seguidos, repetir lo del día anterior y lo que el día siguiente ya lleva sí o sí (protocolos, pautas
 *   fijas y platos del menú sin alternativa, precargados con `setPlannedDays`);
 * - a lo largo de la semana (y de la anterior), volver a un alimento hace poco servido: dentro de una rama sale con
 *   más probabilidad el que lleva más días sin salir.
 */

// Días que se recuerdan (la semana del plan y la anterior).
const HISTORY_DAYS = 14;
// Días que tarda un alimento servido en volver a salir con la misma probabilidad que uno que no ha salido.
const FOOD_ROTATION_DAYS = 6;

const emptyDay = (key) => ({
  key,
  proteinBranches: [],
  carbBranches: [],
  foods: [],
  processing: [],
});

const addUnique = (list, value) => {
  if (value && !list.includes(value)) list.push(value);
};

export class WeeklyVarietyTracker {
  /**
   * @param {Object|null} player - Ficha del jugador de esta dieta.
   * @param {{ proteinBranches?: string[], carbBranches?: string[], getFoodProcessing?: (foodName: string) => string[] }} options
   *   Ramas del árbol que cuentan como proteína y como hidrato (cada dieta recibe las suyas, el tracker no guarda
   *   estado compartido) y cómo saber el tipo de procesado de un alimento.
   */
  constructor(player = null, { proteinBranches = [], carbBranches = [], getFoodProcessing = null } = {}) {
    this.player = player;
    this.proteinBranches = new Set(proteinBranches);
    this.carbBranches = new Set(carbBranches);
    // No enumerable: no viaja en snapshot/restore.
    Object.defineProperty(this, 'getFoodProcessing', { value: getFoodProcessing, enumerable: false });
    this.days = [];
    this.plannedDays = {};
    this.dayOrder = [];
    this.recentDishes = [];
    this.recentBreakfastStyles = [];
    this.currentDayKey = null;
    this.currentMealKind = null;
    this.todayLunch = null;
    this.todayPlannedDinner = null;
    this.freshnessStrength = 1;
  }

  isProteinBranch(name) {
    return Boolean(name && this.proteinBranches.has(name));
  }

  isCarbBranch(name) {
    return Boolean(name && this.carbBranches.has(name));
  }

  processingOf(foodName) {
    if (!foodName || typeof this.getFoodProcessing !== 'function') return [];
    return this.getFoodProcessing(foodName) || [];
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
    this.currentMealKind = null;
    this.todayLunch = null;
    this.todayPlannedDinner = null;
    this.days.push(emptyDay(dayKey));
    if (this.days.length > HISTORY_DAYS) this.days.shift();
  }

  /**
   * Lo que cada día del plan lleva sí o sí, precargado antes de generar: { [dayKey]: { proteinBranches, carbBranches,
   * foods, processing } }. `dayOrder` es el orden de los días, para saber cuál es el siguiente.
   */
  setPlannedDays(plannedDays = {}, dayOrder = []) {
    this.plannedDays = plannedDays || {};
    this.dayOrder = Array.isArray(dayOrder) ? dayOrder : [];
  }

  /**
   * Toma principal que se está resolviendo ('comida', 'cena' u otra): en el mismo día, la comida se compara con la
   * cena prevista y la cena con la comida, nunca una toma consigo misma.
   */
  setCurrentMeal(mealKind = null) {
    this.currentMealKind = mealKind;
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

  currentDay() {
    if (this.days.length === 0) this.days.push(emptyDay(this.currentDayKey));
    return this.days[this.days.length - 1];
  }

  previousDay() {
    return this.days.length >= 2 ? this.days[this.days.length - 2] : null;
  }

  nextPlannedDay() {
    const index = this.dayOrder.indexOf(this.currentDayKey);
    if (index === -1 || index >= this.dayOrder.length - 1) return null;
    return this.plannedDays[this.dayOrder[index + 1]] || null;
  }

  /** Días contiguos al actual: el anterior (lo servido) y el siguiente (lo que ya lleva sí o sí). */
  adjacentDays() {
    return [this.previousDay(), this.nextPlannedDay()].filter(Boolean);
  }

  /** Tomas principales de hoy con las que se compara la que se está resolviendo. */
  sameDayMeals() {
    if (this.currentMealKind === 'comida') return [this.todayPlannedDinner].filter(Boolean);
    if (this.currentMealKind === 'cena') return [this.todayLunch].filter(Boolean);
    return [this.todayLunch, this.todayPlannedDinner].filter(Boolean);
  }

  /** Tipos de procesado de las tomas principales de hoy con las que se compara la actual. */
  sameDayProcessing() {
    const processing = new Set();
    for (const meal of this.sameDayMeals()) {
      (meal.processing || []).forEach((tag) => processing.add(tag));
      [...(meal.proteinFoods || []), ...(meal.carbFoods || [])]
        .forEach((food) => this.processingOf(food).forEach((tag) => processing.add(tag)));
    }
    return processing;
  }

  recordFood(item) {
    if (!item) return;
    const day = this.currentDay();
    addUnique(day.foods, item);
    this.processingOf(item).forEach((tag) => addUnique(day.processing, tag));
  }

  recordProtein(item, branch = null) {
    if (!item && !branch) return;
    if (item && !branch && this.isProteinBranch(item)) {
      branch = item;
      item = null;
    }
    if (item) this.recordFood(item);
    if (branch) addUnique(this.currentDay().proteinBranches, branch);
  }

  recordCarb(item, branch = null) {
    if (!item && !branch) return;
    if (item && !branch && this.isCarbBranch(item)) {
      branch = item;
      item = null;
    }
    if (item) this.recordFood(item);
    if (branch) addUnique(this.currentDay().carbBranches, branch);
  }

  /** `kind`: 'protein' o 'carb'. Una toma prevista o resuelta guarda sus ramas y alimentos de cada tipo. */
  isSameDay(food, branch, kind) {
    const [branchesKey, branchKey, foodsKey, foodKey] = kind === 'protein'
      ? ['proteinBranches', 'proteinBranch', 'proteinFoods', 'proteinFood']
      : ['carbBranches', 'carbBranch', 'carbFoods', 'carbFood'];
    for (const meal of this.sameDayMeals()) {
      const branches = meal[branchesKey] || (meal[branchKey] ? [meal[branchKey]] : []);
      const foods = meal[foodsKey] || (meal[foodKey] ? [meal[foodKey]] : []);
      if (branch && branches.includes(branch)) return true;
      if (food && (branches.includes(food) || foods.includes(food) || (meal.foods || []).includes(food))) return true;
    }
    if (!food) return false;
    const processing = this.sameDayProcessing();
    return this.processingOf(food).some((tag) => processing.has(tag));
  }

  isSameDayProtein(item, branch = null) {
    if (item && !branch && this.isProteinBranch(item)) return this.isSameDay(null, item, 'protein');
    return this.isSameDay(item, branch, 'protein');
  }

  isSameDayCarb(item, branch = null) {
    if (item && !branch && this.isCarbBranch(item)) return this.isSameDay(null, item, 'carb');
    return this.isSameDay(item, branch, 'carb');
  }

  /** El alimento, su rama o su tipo de procesado están en el día anterior o en lo que el siguiente lleva sí o sí. */
  isInAdjacentDays(item, branch, branchesKey) {
    const processing = this.processingOf(item);
    return this.adjacentDays().some((day) => (
      (branch && (day[branchesKey] || []).includes(branch))
      || (item && (day.foods || []).includes(item))
      || processing.some((tag) => (day.processing || []).includes(tag))
    ));
  }

  isProteinRecent(item, branch = null) {
    if (item && !branch && this.isProteinBranch(item)) {
      branch = item;
      item = null;
    }
    if (this.isSameDayProtein(item, branch)) return true;
    return this.isInAdjacentDays(item, branch, 'proteinBranches');
  }

  isCarbRecent(item, branch = null) {
    if (item && !branch && this.isCarbBranch(item)) {
      branch = item;
      item = null;
    }
    if (this.isSameDayCarb(item, branch)) return true;
    return this.isInAdjacentDays(item, branch, 'carbBranches');
  }

  /**
   * Variedad de una opción completa (plato del menú, alternativa de una pauta): 2 si choca con la otra toma
   * principal del día, 1 si choca con el día anterior o el siguiente, 0 si no choca.
   */
  collisionLevel({ proteinBranches = [], carbBranches = [], foods = [] } = {}) {
    const sameDay = proteinBranches.some((branch) => this.isSameDayProtein(null, branch))
      || carbBranches.some((branch) => this.isSameDayCarb(null, branch))
      || foods.some((food) => this.isSameDayProtein(food) || this.isSameDayCarb(food));
    if (sameDay) return 2;
    const adjacent = proteinBranches.some((branch) => this.isInAdjacentDays(null, branch, 'proteinBranches'))
      || carbBranches.some((branch) => this.isInAdjacentDays(null, branch, 'carbBranches'))
      || foods.some((food) => this.isInAdjacentDays(food, null, 'proteinBranches'));
    return adjacent ? 1 : 0;
  }

  recordVeggie(item) {
    this.recordFood(item);
  }

  /** Verdura servida hoy o ayer. */
  isVeggieRecent(item) {
    return this.foodAge(item) <= 1;
  }

  recordFruit(item) {
    this.recordFood(item);
  }

  /** Fruta servida hoy o ayer. */
  isFruitRecent(item) {
    return this.foodAge(item) <= 1;
  }

  /** Días desde que se sirvió un alimento o uno de su mismo procesado (0 = hoy; Infinity = no está en la memoria). */
  foodAge(item) {
    if (!item) return Infinity;
    const processing = this.processingOf(item);
    for (let i = this.days.length - 1; i >= 0; i--) {
      const day = this.days[i];
      if (day.foods.includes(item) || processing.some((tag) => day.processing.includes(tag))) {
        return this.days.length - 1 - i;
      }
    }
    return Infinity;
  }

  /**
   * Cuánto pesa la frescura al rotar, de 1 (máximo) a 0 (al azar). Al repetir un día que no cuadra se relaja para
   * que otro intento pueda probar alimentos que encajan mejor en los macros aunque hayan salido hace poco.
   */
  setFreshnessStrength(strength = 1) {
    this.freshnessStrength = Math.min(1, Math.max(0, Number(strength) || 0));
  }

  /** Peso de un alimento al rotar: crece con los días que lleva sin salir (1 si no ha salido en la memoria). */
  freshnessWeight(item) {
    const age = this.foodAge(item);
    if (age === Infinity) return 1;
    return Math.min(1, ((age + 0.5) / FOOD_ROTATION_DAYS) ** 2) ** (this.freshnessStrength ?? 1);
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
 * Elige un alimento al azar dando más probabilidad a los que llevan más días sin salir (sin tracker, al azar).
 */
export function pickFreshFood(foods, tracker = null) {
  if (!Array.isArray(foods) || foods.length === 0) return null;
  if (foods.length === 1 || typeof tracker?.freshnessWeight !== 'function') {
    return foods[Math.floor(Math.random() * foods.length)];
  }
  const weights = foods.map((food) => tracker.freshnessWeight(food));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let r = Math.random() * total;
  return foods.find((_, i) => (r -= weights[i]) < 0) ?? foods[foods.length - 1];
}

/**
 * Selecciona un alimento de una lista garantizando variedad y registrando la elección en el tracker.
 * `getBranchWeightFn(rama)`: peso de rotación de cada sub-rama (1 por defecto); una rama con peso 0.25 sale con
 * un cuarto de probabilidad que las demás.
 */
export function selectFoodWithVariety(foods, tracker, isRecentFn, recordFn, isSameDayFn = null, getBranchFn = null, getBranchWeightFn = null) {
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

  // 2. Sobre el pool seguro, filtrar lo del día anterior y lo que el siguiente ya lleva (alimento, rama o procesado)
  const nonRecent = tracker && isRecentFn ? candidatePool.filter((f) => !isRecentFn.call(tracker, f)) : candidatePool;
  const pool = nonRecent.length > 0 ? nonRecent : candidatePool;

  // 3. Dentro de lo que queda, sale antes lo que lleva más días sin salir.
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
    const weights = branchKeys.map((b) => Math.max(0, Number(getBranchWeightFn?.(b) ?? 1)));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let chosenBranch = branchKeys[Math.floor(Math.random() * branchKeys.length)];
    if (totalWeight > 0) {
      let r = Math.random() * totalWeight;
      chosenBranch = branchKeys.find((_, i) => (r -= weights[i]) < 0) ?? branchKeys[branchKeys.length - 1];
    }
    chosen = pickFreshFood(branchesMap.get(chosenBranch), tracker);
  } else {
    chosen = pickFreshFood(pool, tracker);
  }

  if (recordFn && tracker) recordFn.call(tracker, chosen);
  return chosen;
}
