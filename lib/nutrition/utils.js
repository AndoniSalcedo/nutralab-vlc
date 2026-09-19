import { roundToFive } from '../utils.js';
import { normalizeFoodName } from '../../data/foods-crudo.js';

/**
 * Conjunto de palabras vacías para tokenización y búsqueda léxica
 */
export const STOP_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'con', 'sin', 'en', 'al', 'a', 'y', 'o',
  'un', 'una', 'unidad', 'unidades', 'fresco', 'fresca', 'frescos', 'frescas',
  'natural', 'crudo', 'cruda'
]);

/**
 * Coeficiente de Sørensen-Dice para similitud de bigramas entre cadenas normalizadas
 */
export function diceSimilarity(str1, str2) {
  const s1 = normalizeFoodName(str1).replace(/\s+/g, '');
  const s2 = normalizeFoodName(str2).replace(/\s+/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const b1 = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.slice(i, i + 2);
    b1.set(bg, (b1.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.slice(i, i + 2);
    const count = b1.get(bg) || 0;
    if (count > 0) {
      b1.set(bg, count - 1);
      intersection++;
    }
  }

  return (2.0 * intersection) / (s1.length - 1 + s2.length - 1);
}

/**
 * Determina si un alimento corresponde a la familia del huevo entero
 */
export function isEggItem(it) {
  if (!it) return false;
  const nameLow = String(it.name || it.food?.name || '').toLowerCase();
  if (nameLow.includes('clara')) return false;

  return (
    nameLow.includes('huevo') ||
    Boolean(it.food?.tags?.includes('huevo')) ||
    (nameLow.includes('tortilla') && !nameLow.includes('trigo') && !nameLow.includes('maiz'))
  );
}

/**
 * Formatea un alimento de huevo o clara en unidades físicas de cocina
 */
export function formatEggOrClaraItem(it) {
  if (isEggItem(it)) {
    // 1 huevo entero mediano = 50g (~6.25g P)
    const numHuevos = Math.max(1, Math.round((it.grams || 50) / 50));
    return numHuevos === 1 ? '1 Huevo' : `${numHuevos} Huevos`;
  }
  const nameLow = String(it.name || it.food?.name || '').toLowerCase();
  if (nameLow.includes('clara')) {
    // 1 clara = 30g (~3.3g P)
    const numClaras = Math.max(1, Math.round((it.grams || 30) / 30));
    return numClaras === 1 ? '1 Clara' : `${numClaras} Claras`;
  }
  return null;
}

/**
 * Calibra de forma inteligente combinaciones gastronómicas de huevos enteros y claras
 * para satisfacer un objetivo de proteína exacto sin exceder grasas ni calorías.
 * 1 huevo entero = 50g (~6.25g P, ~5g fat, ~75 kcal)
 * 1 clara de huevo = 30g (~3.3g P, ~0.1g fat, ~15 kcal)
 */
export function calculateEggAndClaras(neededPro, preferredHuevos = 1) {
  const pTarget = Math.max(0, Number(neededPro) || 0);
  if (pTarget <= 7.5) {
    return {
      huevos: 1,
      claras: 0,
      totalGrams: 50,
      displayName: '1 Huevo',
      pro: 6.25,
      fat: 5,
      kcal: 75,
    };
  }
  if (pTarget <= 13.5 && preferredHuevos >= 2) {
    return {
      huevos: 2,
      claras: 0,
      totalGrams: 100,
      displayName: '2 Huevos',
      pro: 12.5,
      fat: 10,
      kcal: 150,
    };
  }

  // Base de 1 o 2 huevos enteros + claras líquidas según necesidad
  const baseHuevos = pTarget > 18 && preferredHuevos >= 2 ? 2 : 1;
  const proFromHuevos = baseHuevos * 6.25;
  const remPro = Math.max(0, pTarget - proFromHuevos);
  const numClaras = Math.max(1, Math.round(remPro / 3.3));
  const totalGrams = (baseHuevos * 50) + (numClaras * 30);
  const displayName = `${baseHuevos} Huevo${baseHuevos > 1 ? 's' : ''} y ${numClaras} Clara${numClaras > 1 ? 's' : ''}`;

  return {
    huevos: baseHuevos,
    claras: numClaras,
    totalGrams,
    displayName,
    pro: (baseHuevos * 6.25) + (numClaras * 3.3),
    fat: baseHuevos * 5,
    kcal: (baseHuevos * 75) + (numClaras * 15),
  };
}

/**
 * Formatea la presentación final de un alimento calibrado para el informe nutricional
 */
export function formatMealItemDisplayName(it) {
  // Manejo de presentaciones especiales de combinaciones de huevo calculadas (ej: '2 Huevos y 3 Claras')
  if (it.displayName && isEggItem(it)) {
    return it.displayName;
  }

  // Manejo de presentaciones especiales en unidades físicas de huevo / claras
  const eggOrClaraStr = formatEggOrClaraItem(it);
  if (eggOrClaraStr) {
    return eggOrClaraStr;
  }

  const nameLow = String(it.name || it.food?.name || '').toLowerCase();
  if (nameLow.includes('ensure')) {
    return 'Ensure Nutrición Entera 1 unidad';
  }
  if (nameLow.includes('recovery')) {
    return 'Recovery y fruta';
  }

  // Nombre canónico oficial o nombre de presentación culinario (ej: 'Tostadas de pan blanco de barra')
  let canonicalName = String(it.displayName || it.name || it.food?.name || '').trim();
  const lowerCanon = canonicalName.toLowerCase();
  if (lowerCanon.includes('aceite de oliva') || lowerCanon.startsWith('aove')) {
    canonicalName = 'AOVE';
  }
  const displayName = canonicalName === 'AOVE' ? 'AOVE' : (canonicalName.charAt(0).toUpperCase() + canonicalName.slice(1));
  const roundedGrams = roundToFive(it.grams);

  return `${displayName} ${roundedGrams}g`;
}
