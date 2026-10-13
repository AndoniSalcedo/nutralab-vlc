import { getMealKind, getUserMeals } from '@/config/nutrition-days';
import { getDefaultMealDistribution } from '@/lib/engine/day-balance';

/**
 * Reparto de kcal por ingesta del jugador (`reparto_ingestas`: { toma: % }, enteros que suman 100). Todo jugador lo
 * tiene guardado y el generador reparte los macros del día con él. Las tomas post no entran: tienen macros fijos.
 */

/** Tomas del jugador entre las que se reparten las kcal: sus comidas habituales sin el post. */
function getDistributionMeals(player) {
  return getUserMeals(player).filter((meal) => getMealKind(meal) !== 'post');
}

function isValidDistribution(distribution, meals) {
  if (!distribution || typeof distribution !== 'object' || Array.isArray(distribution)) return false;
  const keys = Object.keys(distribution);
  if (keys.length !== meals.length || !meals.every((meal) => keys.includes(meal))) return false;
  const values = meals.map((meal) => Number(distribution[meal]));
  return values.every((v) => Number.isInteger(v) && v >= 0 && v <= 100)
    && values.reduce((sum, v) => sum + v, 0) === 100;
}

/**
 * Reparto que debe tener guardado el jugador: el suyo si corresponde a sus tomas actuales o, si no (sin reparto o
 * con otras tomas), el reparto por defecto para sus tomas.
 */
export function syncMealDistribution(player) {
  const meals = getDistributionMeals(player);
  const current = player?.reparto_ingestas;
  if (isValidDistribution(current, meals)) {
    return Object.fromEntries(meals.map((meal) => [meal, Number(current[meal])]));
  }
  return getDefaultMealDistribution(meals, { hasPost: Boolean(player?.postentreno) });
}
