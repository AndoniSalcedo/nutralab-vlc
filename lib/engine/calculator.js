import { roundToFive } from '@/lib/utils';
import { normalizeFoodName } from '@/data/foods-crudo';
import { hasTreePath } from '@/lib/engine/food-tree';
import {
  isEggItem,
  calculateEggAndClaras,
  formatMealItemDisplayName,
} from '@/lib/nutrition/utils';

function getCatalogFood(name, options = {}) {
  const normalizedName = normalizeFoodName(name);
  return options.clinicalCatalog?.foodsByNormalizedName?.get(normalizedName) || null;
}

/**
 * Normaliza una hoja que ya viene resuelta por el árbol.
 *
 * El alimento ya contiene sus datos del catálogo y no hay que volver a
 * localizarlo por nombre.
 */
function normalizeResolvedMealItem(item) {
  if (!item?.food) return null;

  return {
    name: item.name || item.food.name,
    grams: item.grams ?? item.food.minGrams ?? null,
    food: item.food,
    displayName: item.displayName,
  };
}

function createResolvedMealItem(food, grams = null) {
  if (!food) return null;
  return {
    name: food.name,
    grams,
    food,
  };
}


/**
 * Calibrador de precisión:
 * Ajusta matemáticamente los gramos del cereal/tubérculo y de la proteína principal
 * redondeando SIEMPRE a múltiplos de 5 gramos (ej: 193g -> 195g).
 */
export async function calibrateMeal(mealDetailStr, targetBudget, options = {}) {
  const isStructuredMeal = Array.isArray(mealDetailStr);
  if (!mealDetailStr || (!isStructuredMeal && typeof mealDetailStr !== 'string')) return mealDetailStr;
  if (!targetBudget) return mealDetailStr;

  const lower = isStructuredMeal ? '' : mealDetailStr.toLowerCase();

  // Pauta fija de post-partido vs post-entreno identificada de forma determinista por el nombre de la ingesta
  const mealName = (options.mealName || '').trim();
  const mealNameLow = mealName.toLowerCase();
  const isPostByName = !isStructuredMeal && Boolean(mealNameLow && (mealNameLow.includes('post') || mealNameLow.includes('recovery')));
  const isPostFallback = !isStructuredMeal && !options.mealName && (lower.startsWith('post') || lower.startsWith('recovery') || lower.startsWith('batido de prote'));
  const isPostMeal = isPostByName || isPostFallback;

  if (isPostMeal) {
    const isMatchPost = options.isMatchDay || mealNameLow.includes('partido') || lower.includes('partido') || lower.includes('recovery');
    if (isMatchPost) {
      return 'Recovery y fruta';
    }
    if (options.hasCowProteinAllergy || options.isVegan || lower.includes('vegetal')) {
      return 'Batido de proteína vegetal 30g disuelto en agua';
    }
    if (options.isLactoseIntolerant || lower.includes('sin lactosa')) {
      return 'Batido de proteína sin lactosa 30g disuelto en agua';
    }
    return 'Batido de proteína 30g disuelto en agua';
  }

  // Las comidas normales llegan desde el árbol como hojas estructuradas.
  // Si entra texto sin resolver, se conserva sin intentar adivinar alimentos.
  if (!isStructuredMeal) return mealDetailStr;

  let parsedItems = mealDetailStr.map(normalizeResolvedMealItem).filter(Boolean);

  if (parsedItems.length === 0) return '';

  // Consolidar duplicados del mismo alimento (ej: dos entradas de "Arroz blanco")
  const consolidatedMap = new Map();
  parsedItems.forEach(it => {
    const key = normalizeFoodName(it.food?.name || it.name);
    if (consolidatedMap.has(key)) {
      const existing = consolidatedMap.get(key);
      existing.grams = (existing.grams || 100) + (it.grams || 100);
    } else {
      consolidatedMap.set(key, { ...it });
    }
  });
  parsedItems = Array.from(consolidatedMap.values());



  // REPARTO CLÍNICO EN COMIDAS DE ALTA CONCENTRACIÓN DE HIDRATOS (POSTRE DE FRUTA):
  // Si la comida concentra muchos hidratos (>=80g), se incluye postre de fruta fresca del árbol
  // para evitar montañas indigeribles de un solo cereal/tubérculo en el plato principal.
  const hasFruit = parsedItems.some(it => it.food?.category === 'frutas');
  if (targetBudget.hc >= 80 && !hasFruit) {
    const fruitOptions = options.isMatchDay
      ? ['Plátano', 'Manzana', 'Pera', 'Uvas']
      : ['Plátano', 'Manzana', 'Kiwi', 'Naranja', 'Pera', 'Mandarina', 'Fresas'];

    const dayIdx = typeof options.dayIndex === 'number' ? options.dayIndex : 0;
    let selectedFruit = null;
    for (let offset = 0; offset < fruitOptions.length; offset++) {
      const cand = fruitOptions[(dayIdx + offset) % fruitOptions.length];
      const found = getCatalogFood(cand, options);
      if (found) {
        selectedFruit = found;
        break;
      }
    }
    if (!selectedFruit) {
      selectedFruit = getCatalogFood('Plátano', options);
    }

    if (selectedFruit) {
      const isBanana = selectedFruit.name.toLowerCase().includes('platano');
      const dessertGrams = isBanana ? 120 : selectedFruit.minGrams;
      const dessertFruit = createResolvedMealItem(selectedFruit, dessertGrams);
      if (dessertFruit) parsedItems.push(dessertFruit);
    }
  }

  // Identificar roles de alimentos
  let primaryCarbIndex = -1;
  let maxChoPriority = -1; // 2: Cereal/tubérculo de plato, 1: Pan/tortas/harinas, 0: otros
  let maxChoDensity = -1;

  let primaryProteinIndex = -1;
  let maxProDensity = -1;
  const isPlantProtein = (item) => {
    const category = item.food?.category || '';
    const itemName = (item.food?.name || item.name).toLowerCase();
    return category === 'legumbres' || itemName.includes('tofu') || itemName.includes('seit') || itemName.includes('seitan');
  };

  let primaryFatIndex = -1;

  const isMainMeal = options.mealName && (
    options.mealName.toLowerCase().includes('comida') ||
    options.mealName.toLowerCase().includes('cena')
  );
  const allowsPlantProtein = options.isVegan || options.isVegetarian;

  parsedItems.forEach((it, idx) => {
    const cat = it.food?.category || '';
    const nameLow = (it.food?.name || it.name).toLowerCase();
    const isFixed = nameLow.includes('ensure') || nameLow.includes('batido') || nameLow.includes('recovery');
    if (isFixed) return;

    // Hidrato primario
    const isFruit = hasTreePath(it.food, 'frutas');
    const isDishCarb = hasTreePath(it.food, 'arroz') ||
      hasTreePath(it.food, 'pasta') ||
      hasTreePath(it.food, 'tuberculos') ||
      hasTreePath(it.food, 'otros_granos') ||
      hasTreePath(it.food, 'legumbres');
    const isBread = hasTreePath(it.food, 'panes');
    const isVegOrCondiment = hasTreePath(it.food, 'verduras') || hasTreePath(it.food, 'condimentos');

    const isEligiblePrimaryCarb = !isFruit && !isVegOrCondiment && (
      isDishCarb ||
      (!isMainMeal && (it.food?.cho || 0) > 15)
    );

    if (isEligiblePrimaryCarb) {
      // En comidas principales, el pan nunca puede ser el hidrato principal (solo secundario de acompañamiento)
      if (isMainMeal && isBread) {
        return;
      }

      // En comidas y cenas principales, los cereales/tubérculos de plato tienen prioridad absoluta (2)
      let carbPriority = isDishCarb ? (isMainMeal ? 2 : 1.5) : 1;

      if (carbPriority > maxChoPriority || (carbPriority === maxChoPriority && (it.food.cho || 0) > maxChoDensity)) {
        maxChoPriority = carbPriority;
        maxChoDensity = it.food.cho || 0;
        primaryCarbIndex = idx;
      }
    }

    // Proteína primaria (carne, ave, pescado, conservas o claras escalables)
    if (isMainMeal) {
      // En comidas y cenas principales, la proteína primaria DEBE ser carne, ave o pescado limpio de plato
      if (cat === 'carnes_y_aves' || cat === 'pescados_y_mariscos' || (allowsPlantProtein && isPlantProtein(it))) {
        if (it.food.pro > maxProDensity) {
          maxProDensity = it.food.pro;
          primaryProteinIndex = idx;
        }
      }
    } else {
      if (cat === 'carnes_y_aves' || cat === 'pescados_y_mariscos' || cat === 'conservas' || (cat === 'huevos_y_lacteos' && it.food.pro > 10)) {
        if (it.food.pro > maxProDensity) {
          maxProDensity = it.food.pro;
          primaryProteinIndex = idx;
        }
      }
    }

    // Grasa primaria (AOVE)
    if (cat === 'grasas_y_frutos_secos' || it.name.toLowerCase().includes('aove') || it.name.toLowerCase().includes('aceite')) {
      primaryFatIndex = idx;
    }
  });

  // En comidas y cenas principales, SOLO PUEDE HABER UNA PROTEÍNA PRINCIPAL LIMPIA (carne, ave o pescado).
  // Se purga cualquier segunda proteína incompatible (huevos, claras, quesos, yogures o segunda carne).
  if (isMainMeal && primaryProteinIndex !== -1) {
    const toRemove = [];
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryProteinIndex) {
        const cat = it.food?.category || '';
        const nameLow = (it.food?.name || it.name).toLowerCase();
        const isPlantProt = isPlantProtein(it);
        const isProt = (
          cat === 'carnes_y_aves' ||
          cat === 'pescados_y_mariscos' ||
          cat === 'huevos_y_lacteos' ||
          cat === 'lacteos_y_huevos' ||
          cat === 'conservas' ||
          isEggItem(it) ||
          nameLow.includes('huevo') ||
          nameLow.includes('clara') ||
          nameLow.includes('yogur') ||
          nameLow.includes('queso') ||
          (isPlantProt && !allowsPlantProtein)
        );
        if (isProt) {
          toRemove.push(idx);
        }
      }
    });
    if (toRemove.length > 0) {
      const primaryItem = parsedItems[primaryProteinIndex];
      const primaryCarbItem = primaryCarbIndex !== -1 ? parsedItems[primaryCarbIndex] : null;
      const primaryFatItem = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
      parsedItems = parsedItems.filter((_, idx) => !toRemove.includes(idx));
      primaryProteinIndex = parsedItems.indexOf(primaryItem);
      if (primaryCarbItem) primaryCarbIndex = parsedItems.indexOf(primaryCarbItem);
      if (primaryFatItem) primaryFatIndex = parsedItems.indexOf(primaryFatItem);
    }
  }

  // En comidas y cenas principales, calibración del acompañante de hidratos (pan):
  // El pan no tiene una ración fija: se evalúa dinámicamente según la holgura de hidratos.
  // Si no hay margen para mantener una ración digna del plato principal (arroz/pasta/patata), se descarta el pan.
  if (isMainMeal && primaryCarbIndex !== -1) {
    const breadIdx = parsedItems.findIndex((it, idx) => {
      if (idx === primaryCarbIndex) return false;
      return hasTreePath(it.food, 'panes') || ['pan', 'tosta', 'biscote', 'picos'].some(kw => (it.food?.name || it.name).toLowerCase().includes(kw));
    });

    if (breadIdx !== -1) {
      const breadItem = parsedItems[breadIdx];
      const primaryItem = parsedItems[primaryCarbIndex];
      const primaryChoFactor = (primaryItem.food?.cho || 20) / 100;
      const isTuber = hasTreePath(primaryItem.food, 'tuberculos') || ['patata', 'boniato', 'batata'].some(kw => (primaryItem.food?.name || primaryItem.name).toLowerCase().includes(kw));
      const minDishGrams = isTuber ? 150 : 60;
      const minDishCho = minDishGrams * primaryChoFactor;

      // Hidratos aportados por fruta de postre y verduras
      let fixedCarbs = 0;
      parsedItems.forEach((it, idx) => {
        if (idx !== breadIdx && idx !== primaryCarbIndex) {
          fixedCarbs += (it.grams / 100) * (it.food?.cho || 0);
        }
      });

      const carbRoom = targetBudget.hc - fixedCarbs;
      const minBreadCho = 30 * ((breadItem.food?.cho || 55) / 100);

      if (carbRoom < minDishCho + minBreadCho) {
        // No hay margen suficiente para el plato principal y el pan a la vez:
        // Se purga el pan para que el plato principal mantenga su gramaje mínimo digno.
        const primaryCarbObj = parsedItems[primaryCarbIndex];
        parsedItems = parsedItems.filter((_, idx) => idx !== breadIdx);
        primaryCarbIndex = parsedItems.indexOf(primaryCarbObj);
        if (primaryProteinIndex > breadIdx) primaryProteinIndex--;
        if (primaryFatIndex > breadIdx) primaryFatIndex--;
      } else {
        // Hay margen holgado: calibrar el pan dinámicamente entre 30g y 60g según los hidratos sobrantes
        const standardDishCho = (isTuber ? 250 : 85) * primaryChoFactor;
        const availableForBread = Math.max(0, carbRoom - standardDishCho);
        const breadChoFactor = (breadItem.food?.cho || 55) / 100;
        let calibratedBreadGrams = roundToFive(availableForBread / breadChoFactor);
        calibratedBreadGrams = Math.min(60, Math.max(30, calibratedBreadGrams));
        breadItem.grams = calibratedBreadGrams;
      }
    }
  }

  if (isMainMeal && primaryCarbIndex !== -1) {

    // En comidas y cenas, evitar duplicar dos bases de plato de la misma categoría de cereal/pasta compitiendo
    const isCerealDish = (item) => {
      if (!item?.food) return false;
      return hasTreePath(item.food, 'arroz') ||
             hasTreePath(item.food, 'pasta') ||
             hasTreePath(item.food, 'otros_granos');
    };

    const isPrimaryCereal = isCerealDish(parsedItems[primaryCarbIndex]);

    if (isPrimaryCereal) {
      const competingIndices = [];
      parsedItems.forEach((it, idx) => {
        if (idx !== primaryCarbIndex && isCerealDish(it)) {
          competingIndices.push(idx);
        }
      });

      if (competingIndices.length > 0) {
        let bestIndex = primaryCarbIndex;
        competingIndices.forEach(idx => {
          if ((parsedItems[idx].grams || 0) > (parsedItems[bestIndex].grams || 0)) {
            bestIndex = idx;
          }
        });

        const toRemove = [primaryCarbIndex, ...competingIndices].filter(i => i !== bestIndex);
        const bestItem = parsedItems[bestIndex];
        const primaryProteinItem = primaryProteinIndex !== -1 ? parsedItems[primaryProteinIndex] : null;
        const primaryFatItem = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
        console.warn(`[NUTRICIÓN] Purgando cereal secundario incompatible en comida principal para evitar duplicar bases.`);
        parsedItems = parsedItems.filter((_, idx) => !toRemove.includes(idx));
        primaryCarbIndex = parsedItems.indexOf(bestItem);
        if (primaryCarbIndex === -1) {
          primaryCarbIndex = 0;
        }
        if (primaryProteinItem) primaryProteinIndex = parsedItems.indexOf(primaryProteinItem);
        if (primaryFatItem) primaryFatIndex = parsedItems.indexOf(primaryFatItem);
      }
    }
  }

  // Si hay claras y huevos enteros en desayuno, preferir calibrar las claras líquidas
  const clarasIdx = parsedItems.findIndex(it => it.name.toLowerCase().includes('clara'));
  if (clarasIdx !== -1) {
    primaryProteinIndex = clarasIdx;
  }

  // RED DE SEGURIDAD OBLIGATORIA DE PROTEÍNA EN COMIDAS Y CENAS:
  // Si en una comida o cena principal no hay fuente de proteína limpia (carnes_y_aves, pescados_y_mariscos),
  // inyectar automáticamente una proteína limpia y segura del catálogo para garantizar siempre los requerimientos nutricionales
  if (isMainMeal && primaryProteinIndex === -1) {
    const isCena = options.mealName && options.mealName.toLowerCase().includes('cena');
    const candidates = isCena
      ? ['Merluza', 'Dorada', 'Lubina', 'Pechuga de pavo', 'Pechuga de pollo', 'Tofu firme']
      : ['Pechuga de pollo', 'Pechuga de pavo', 'Ternera magra', 'Merluza', 'Dorada', 'Tofu firme'];

    let chosenFood = null;
    for (const cand of candidates) {
      const found = getCatalogFood(cand, options);
      if (found && (found.category === 'carnes_y_aves' || found.category === 'pescados_y_mariscos')) {
        chosenFood = found;
        break;
      }
    }

    if (!chosenFood) {
      chosenFood = getCatalogFood('Pechuga de pollo', options);
    }

    const rescueItem = {
      name: chosenFood.name,
      grams: 150,
      food: chosenFood,
    };

    const insertIdx = primaryCarbIndex !== -1 ? primaryCarbIndex + 1 : 0;
    parsedItems.splice(insertIdx, 0, rescueItem);
    primaryProteinIndex = insertIdx;
    if (primaryCarbIndex >= insertIdx && primaryCarbIndex !== -1) primaryCarbIndex++;
    if (primaryFatIndex >= insertIdx) primaryFatIndex++;
  }

  // RED DE SEGURIDAD OBLIGATORIA DE HIDRATO DE PLATO EN COMIDAS Y CENAS:
  // Si en una comida o cena principal no hay hidrato de plato (porque no se especificó o solo había pan),
  // inyectar un cereal de plato limpio (Arroz blanco o Pasta de trigo) como hidrato principal
  if (isMainMeal && primaryCarbIndex === -1) {
    const carbCandidates = ['Arroz blanco', 'Pasta de trigo', 'Patata', 'Boniato', 'Quinoa', 'Cuscús'];
    let chosenCarb = null;
    for (const cand of carbCandidates) {
      const found = getCatalogFood(cand, options);
      if (found) {
        chosenCarb = found;
        break;
      }
    }
    if (chosenCarb) {
      const rescueCarb = {
        name: chosenCarb.name,
        grams: 100,
        food: chosenCarb,
      };
      parsedItems.unshift(rescueCarb);
      primaryCarbIndex = 0;
      if (primaryProteinIndex !== -1) primaryProteinIndex++;
      if (primaryFatIndex !== -1) primaryFatIndex++;
    }
  }

  // 1. Calibrar Carbohidratos con Reparto Armónico:
  let nonPrimaryCarbs = 0;
  parsedItems.forEach((it, idx) => {
    if (idx !== primaryCarbIndex) {
      nonPrimaryCarbs += (it.grams / 100) * (it.food?.cho || 0);
    }
  });

  if (primaryCarbIndex !== -1) {
    const carbItem = parsedItems[primaryCarbIndex];
    if (!carbItem.food || carbItem.food.minGrams === undefined || carbItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${carbItem.food?.name || carbItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }
    const choFactor = (carbItem.food.cho || 20) / 100;
    const minP = carbItem.food.minGrams;
    const maxP = carbItem.food.maxGrams;
    const isTuber = hasTreePath(carbItem.food, 'tuberculos') || ['patata', 'boniato', 'batata'].some(kw => (carbItem.food?.name || carbItem.name).toLowerCase().includes(kw));

    // Identificar o asegurar fruta de postre en comida principal
    let fruitItem = parsedItems.find(it => hasTreePath(it.food, 'frutas') || it.food?.category === 'frutas');
    if (!fruitItem && isMainMeal) {
      const dessertFruit = getCatalogFood('Manzana', options) || getCatalogFood('Plátano', options);
      if (dessertFruit) {
        fruitItem = {
          name: dessertFruit.name,
          grams: 150,
          food: dessertFruit,
        };
        parsedItems.push(fruitItem);
        nonPrimaryCarbs += (150 / 100) * (dessertFruit.cho || 15);
      }
    }

    let minF = 0;
    let maxF = 0;
    let fruitChoFactor = 0;
    if (fruitItem) {
      if (!fruitItem.food || fruitItem.food.minGrams === undefined || fruitItem.food.maxGrams === undefined) {
        throw new Error(`Alimento "${fruitItem.food?.name || fruitItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
      }
      minF = fruitItem.food.minGrams;
      maxF = fruitItem.food.maxGrams;
      fruitChoFactor = (fruitItem.food.cho || 15) / 100;
    }

    const neededCho = Math.max(0, targetBudget.hc - nonPrimaryCarbs);
    let rawCarbGrams = roundToFive(neededCho / choFactor);

    if (isTuber) {
      // === CASO TUBÉRCULO (Patata / Boniato) ===
      if (rawCarbGrams <= maxP) {
        carbItem.grams = roundToFive(Math.max(minP, rawCarbGrams));
      } else {
        // Supera el máximo del tubérculo (450g)
        const excessCho = Math.max(0, (rawCarbGrams - maxP) * choFactor);
        const currentFruitGrams = fruitItem ? (fruitItem.grams || 150) : 150;
        const availableFruitCho = Math.max(0, (maxF - currentFruitGrams) * fruitChoFactor);

        if (excessCho <= availableFruitCho && fruitItem) {
          // Exceso pequeño: cabe en la fruta sin rebasar su tope de 200g
          carbItem.grams = maxP;
          const extraFruitGrams = roundToFive(excessCho / fruitChoFactor);
          fruitItem.grams = roundToFive(Math.min(maxF, currentFruitGrams + extraFruitGrams));
        } else {
          // El exceso supera la holgura de la fruta
          const remExcessAfterFruit = excessCho - availableFruitCho;
          if (remExcessAfterFruit < 20) {
            // Exceso residual pequeño (< 20g HC): la fruta sube a su tope (200g) y el tubérculo queda en 450g.
            // No se añade cereal testimonial (ej: 15g de arroz) para evitar platos amorfos.
            carbItem.grams = maxP;
            if (fruitItem) fruitItem.grams = maxF;
          } else if (isMainMeal) {
            // Exceso elevado (>= 20g HC pendientes, e.g. hipercarga o >130g HC totales):
            // Rebalanceo armónico: Tubérculo a zona media de confort (310g) + Cereal secundario (arroz/pasta >= 60g)
            carbItem.grams = 310;
            if (fruitItem) fruitItem.grams = 150;

            let otherCho = 0;
            parsedItems.forEach((it, idx) => {
              if (idx !== primaryCarbIndex) {
                otherCho += (it.grams / 100) * (it.food?.cho || 0);
              }
            });
            const primaryCho = (carbItem.grams / 100) * (carbItem.food?.cho || 0);
            const deficitForCereal = Math.max(0, targetBudget.hc - (otherCho + primaryCho));

            const existingCereal = parsedItems.find((it, idx) => {
              if (idx === primaryCarbIndex) return false;
              return (
                hasTreePath(it.food, 'arroz') ||
                hasTreePath(it.food, 'pasta') ||
                hasTreePath(it.food, 'otros_granos')
              ) && !hasTreePath(it.food, 'tuberculos');
            });

            if (existingCereal) {
              if (!existingCereal.food || existingCereal.food.minGrams === undefined || existingCereal.food.maxGrams === undefined) {
                throw new Error(`Alimento "${existingCereal.food?.name || existingCereal.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
              }
              const secChoFactor = (existingCereal.food.cho || 75) / 100;
              const minS = existingCereal.food.minGrams;
              const maxS = existingCereal.food.maxGrams;
              let secGrams = roundToFive(deficitForCereal / secChoFactor);
              secGrams = Math.min(maxS, Math.max(minS, secGrams));
              existingCereal.grams = secGrams;
            } else {
              const cerealFood = getCatalogFood('Arroz blanco', options);
              if (cerealFood) {
                if (cerealFood.minGrams === undefined || cerealFood.maxGrams === undefined) {
                  throw new Error(`Alimento "${cerealFood.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
                }
                const secChoFactor = (cerealFood.cho || 75) / 100;
                const minS = cerealFood.minGrams;
                const maxS = cerealFood.maxGrams;
                let secGrams = roundToFive(Math.max(minS, deficitForCereal / secChoFactor));
                secGrams = Math.min(maxS, secGrams);
                const secondaryCerealItem = {
                  name: cerealFood.name,
                  grams: secGrams,
                  food: cerealFood,
                };
                parsedItems.unshift(secondaryCerealItem);
                primaryCarbIndex = parsedItems.indexOf(secondaryCerealItem);
                if (primaryProteinIndex !== -1) primaryProteinIndex++;
                if (primaryFatIndex !== -1) primaryFatIndex++;
              }
            }
          } else {
            carbItem.grams = maxP;
          }
        }
      }
    } else {
      // === CASO CEREAL DE PLATO (Arroz blanco / Pasta de trigo) ===
      if (rawCarbGrams < minP) {
        // Demanda baja: garantizar que el cereal no baje de minP (50g)
        if (fruitItem && fruitItem.grams > minF) {
          const fruitReduction = Math.min(50, fruitItem.grams - minF);
          fruitItem.grams -= fruitReduction;
          const recoveredCho = fruitReduction * fruitChoFactor;
          rawCarbGrams = roundToFive((neededCho + recoveredCho) / choFactor);
        }
        carbItem.grams = roundToFive(Math.max(minP, rawCarbGrams));
      } else if (rawCarbGrams <= maxP) {
        // Carga normal: el cereal absorbe limpiamente dentro de [minP, maxP]
        carbItem.grams = roundToFive(rawCarbGrams);
      } else {
        // Hipercarga que excede el tope digestivo del cereal (170g)
        const excessCho = Math.max(0, (rawCarbGrams - maxP) * choFactor);
        const currentFruitGrams = fruitItem ? (fruitItem.grams || 150) : 150;
        const availableFruitCho = Math.max(0, (maxF - currentFruitGrams) * fruitChoFactor);

        if (excessCho <= availableFruitCho && fruitItem) {
          carbItem.grams = maxP;
          const extraFruitGrams = roundToFive(excessCho / fruitChoFactor);
          fruitItem.grams = roundToFive(Math.min(maxF, currentFruitGrams + extraFruitGrams));
        } else {
          // Hipercarga que excede el tope del cereal y la capacidad de la fruta:
          // Rebalanceo armónico: Cereal a zona alta cómoda (140g-160g), fruta a 180g-200g,
          // y si es comida principal, acompañante de pan (30g-60g) para no sobrecargar el estómago.
          if (fruitItem) fruitItem.grams = Math.min(maxF, 180);
          const fruitCho = fruitItem ? (fruitItem.grams / 100) * (fruitItem.food?.cho || 15) : 0;

          let otherCho = 0;
          parsedItems.forEach((it, idx) => {
            if (idx !== primaryCarbIndex && it !== fruitItem) {
              otherCho += (it.grams / 100) * (it.food?.cho || 0);
            }
          });

          const remCho = Math.max(0, targetBudget.hc - (fruitCho + otherCho));

          // Verificar si ya existe pan de acompañamiento
          let breadItem = parsedItems.find((it, idx) => {
            if (idx === primaryCarbIndex) return false;
            const nl = (it.food?.name || it.name).toLowerCase();
            return nl.includes('pan') || nl.includes('tosta') || nl.includes('biscote') || nl.includes('picos');
          });

          if (!breadItem && isMainMeal && remCho > (140 * choFactor)) {
            const breadFood = getCatalogFood('Pan blanco de barra', options) || getCatalogFood('Pan blanco', options);
            if (breadFood) {
              if (breadFood.minGrams === undefined || breadFood.maxGrams === undefined) {
                throw new Error(`Alimento "${breadFood.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
              }
              breadItem = {
                name: breadFood.name,
                grams: 40,
                food: breadFood,
              };
              parsedItems.push(breadItem);
            }
          }

          if (breadItem) {
            if (!breadItem.food || breadItem.food.minGrams === undefined || breadItem.food.maxGrams === undefined) {
              throw new Error(`Alimento "${breadItem.food?.name || breadItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
            }
            const breadChoFactor = (breadItem.food?.cho || 55) / 100;
            const targetCerealGrams = Math.min(160, Math.max(130, roundToFive((remCho - (40 * breadChoFactor)) / choFactor)));
            carbItem.grams = targetCerealGrams;
            const cerealCho = (targetCerealGrams / 100) * (carbItem.food?.cho || 75);
            const forBreadCho = Math.max(0, remCho - cerealCho);
            let calibratedBreadGrams = roundToFive(forBreadCho / breadChoFactor);
            calibratedBreadGrams = Math.min(breadItem.food.maxGrams, Math.max(breadItem.food.minGrams, calibratedBreadGrams));
            breadItem.grams = calibratedBreadGrams;
          } else {
            carbItem.grams = Math.min(maxP, roundToFive(remCho / choFactor));
          }
        }
      }
    }
  }



  // 2. Calibrar Proteínas:
  // Detectar todas las fuentes dedicadas de proteína en la toma
  const proteinItemIndices = [];
  parsedItems.forEach((it, idx) => {
    const cat = it.food?.category || '';
    const nameLow = (it.food?.name || it.name).toLowerCase();
    const isProt = (
      cat === 'carnes_y_aves' ||
      cat === 'pescados_y_mariscos' ||
      cat === 'conservas' ||
      ((cat === 'huevos_y_lacteos' || cat === 'lacteos_y_huevos') && (it.food?.pro || 0) >= 8) ||
      nameLow.includes('huevo') ||
      nameLow.includes('clara')
    );
    if (isProt) {
      proteinItemIndices.push(idx);
    }
  });

  // Proteína ya aportada por alimentos no proteicos (pan, cereal, fruta, verdura)
  let nonProteinSourcesP = 0;
  parsedItems.forEach((it, idx) => {
    if (!proteinItemIndices.includes(idx)) {
      nonProteinSourcesP += (it.grams / 100) * (it.food?.pro || 0);
    }
  });

  const neededTotalPro = Math.max(0, targetBudget.p - nonProteinSourcesP);

  if (isMainMeal && primaryProteinIndex !== -1) {
    // En comidas y cenas, la proteína principal (carne o pescado limpio) asume la totalidad de la proteína pendiente.
    // Los alimentos secundarios (ej: 1 huevo, claras, queso o pan de acompañamiento) mantienen su porción moderada fijada.
    let nonPrimaryProtein = 0;
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryProteinIndex) {
        nonPrimaryProtein += (it.grams / 100) * (it.food?.pro || 0);
      }
    });

    const primaryItem = parsedItems[primaryProteinIndex];
    if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${primaryItem.food?.name || primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }

    const neededPrimaryPro = Math.max(0, targetBudget.p - nonPrimaryProtein);
    const proFactor = (primaryItem.food?.pro || 20) / 100;
    let exactGrams = roundToFive(neededPrimaryPro / proFactor);

    exactGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, exactGrams));

    primaryItem.grams = roundToFive(exactGrams);
  } else if (proteinItemIndices.length > 0) {
    if (proteinItemIndices.length === 1) {
      // Caso 1 sola proteína en desayuno/merienda
      const singleItem = parsedItems[proteinItemIndices[0]];
      if (isEggItem(singleItem)) {
        const eggCalc = calculateEggAndClaras(neededTotalPro, 2);
        singleItem.grams = eggCalc.totalGrams;
        singleItem.displayName = eggCalc.displayName;
      } else {
        if (!singleItem.food || singleItem.food.minGrams === undefined || singleItem.food.maxGrams === undefined) {
          throw new Error(`Alimento "${singleItem.food?.name || singleItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
        }
        const proFactor = (singleItem.food?.pro || 20) / 100;
        let exactGrams = roundToFive(neededTotalPro / proFactor);
        exactGrams = Math.max(singleItem.food.minGrams, Math.min(singleItem.food.maxGrams, exactGrams));
        singleItem.grams = roundToFive(exactGrams);
      }
    } else {
      // Caso múltiples proteínas en desayuno/merienda (ej: Tostada con huevo + jamón/pavo/queso)
      // Identificar proteína principal (huevo) vs proteínas secundarias (lonchas de embutido/queso)
      let primaryIdx = proteinItemIndices.find(idx => isEggItem(parsedItems[idx]));
      if (primaryIdx === undefined) {
        primaryIdx = proteinItemIndices[0];
      }
      const secondaryIndices = proteinItemIndices.filter(idx => idx !== primaryIdx);
      const primaryItem = parsedItems[primaryIdx];
      const isEggPrimary = isEggItem(primaryItem);

      // Calcular mínimos culinarios reales
      const minPriPro = isEggPrimary ? 6.25 : 6.0;
      let minSecProTotal = 0;
      const secInfoList = [];

      secondaryIndices.forEach(sIdx => {
        const sItem = parsedItems[sIdx];
        if (!sItem.food || sItem.food.minGrams === undefined || sItem.food.maxGrams === undefined) {
          throw new Error(`Alimento "${sItem.food?.name || sItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
        }
        const sFactor = (sItem.food?.pro || 20) / 100;
        const sMinGrams = sItem.food.minGrams;
        const sPro = sMinGrams * sFactor;
        minSecProTotal += sPro;
        secInfoList.push({ idx: sIdx, item: sItem, grams: sMinGrams, pro: sPro });
      });

      const minTotalRequired = minPriPro + minSecProTotal;

      if (neededTotalPro < minTotalRequired) {
        // No hay margen de proteína para sostener ambos con raciones útiles:
        // Se descartan las secundarias y se calibra únicamente la principal con cohesión gastronómica
        const toDrop = secondaryIndices;
        const primaryFatObj = primaryFatIndex !== -1 ? parsedItems[primaryFatIndex] : null;
        const primaryCarbObj = primaryCarbIndex !== -1 ? parsedItems[primaryCarbIndex] : null;
        parsedItems = parsedItems.filter((_, idx) => !toDrop.includes(idx));
        primaryProteinIndex = parsedItems.indexOf(primaryItem);
        if (primaryFatObj) primaryFatIndex = parsedItems.indexOf(primaryFatObj);
        if (primaryCarbObj) primaryCarbIndex = parsedItems.indexOf(primaryCarbObj);

        if (isEggPrimary) {
          const eggCalc = calculateEggAndClaras(neededTotalPro, 2);
          primaryItem.grams = eggCalc.totalGrams;
          primaryItem.displayName = eggCalc.displayName;
        } else {
          if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
            throw new Error(`Alimento "${primaryItem.food?.name || primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
          }
          const proFactor = (primaryItem.food?.pro || 20) / 100;
          let calculatedGrams = roundToFive(neededTotalPro / proFactor);
          calculatedGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, calculatedGrams));
          primaryItem.grams = calculatedGrams;
        }
      } else {
        // Sí caben ambas respetando sus mínimos culinarios:
        // Se asigna la ración útil a las secundarias y la principal absorbe el resto
        let assignedSecPro = 0;
        secInfoList.forEach(info => {
          info.item.grams = info.grams;
          assignedSecPro += info.pro;
        });

        const remainingPriPro = Math.max(minPriPro, neededTotalPro - assignedSecPro);

        if (isEggPrimary) {
          const eggCalc = calculateEggAndClaras(remainingPriPro, 1);
          primaryItem.grams = eggCalc.totalGrams;
          primaryItem.displayName = eggCalc.displayName;
        } else {
          if (!primaryItem.food || primaryItem.food.minGrams === undefined || primaryItem.food.maxGrams === undefined) {
            throw new Error(`Alimento "${primaryItem.food?.name || primaryItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
          }
          const proFactor = (primaryItem.food?.pro || 20) / 100;
          let calculatedGrams = roundToFive(remainingPriPro / proFactor);
          calculatedGrams = Math.max(primaryItem.food.minGrams, Math.min(primaryItem.food.maxGrams, calculatedGrams));
          primaryItem.grams = calculatedGrams;
        }
      }
    }
  }

  // 3. Calibrar Grasas (AOVE):
  let nonPrimaryFat = 0;
  parsedItems.forEach((it, idx) => {
    if (idx !== primaryFatIndex) {
      const f = (it.grams / 100) * (it.food?.fat || 0);
      nonPrimaryFat += f;
    }
  });

  if (primaryFatIndex !== -1 && parsedItems[primaryFatIndex]) {
    const fatItem = parsedItems[primaryFatIndex];
    if (!fatItem.food || fatItem.food.minGrams === undefined || fatItem.food.maxGrams === undefined) {
      throw new Error(`Alimento "${fatItem.food?.name || fatItem.name}" sin límites minGrams/maxGrams definidos en el catálogo.`);
    }
    const fatFactor = (fatItem.food.fat || 100) / 100;
    const neededFat = Math.max(0, targetBudget.g - nonPrimaryFat);
    let exactFatGrams = roundToFive(neededFat / fatFactor);
    exactFatGrams = Math.max(fatItem.food.minGrams, Math.min(fatItem.food.maxGrams, exactFatGrams));
    fatItem.grams = roundToFive(exactFatGrams);
  }

  // Respetar topes máximos y mínimos de cada alimento directamente desde su catálogo
  parsedItems.forEach(it => {
    if (it.displayName) return;
    if (it.food && (it.food.minGrams === undefined || it.food.maxGrams === undefined)) {
      it.food.minGrams = it.food.minGrams ?? 10;
      it.food.maxGrams = it.food.maxGrams ?? 200;
    }
    if (!it.food) {
      it.food = {
        name: it.name,
        minGrams: 10,
        maxGrams: 200,
      };
    }
    const minG = it.food.minGrams;
    const maxG = it.food.maxGrams;
    if (it.grams === null || it.grams === undefined) {
      it.grams = minG;
    }
    if (it.grams > maxG) {
      it.grams = maxG;
    }
    if (it.grams < minG) {
      it.grams = minG;
    }
  });

  // Reconstruir la descripción con formato limpio, profesional y elegante
  const resultParts = parsedItems.map(it => formatMealItemDisplayName(it));

  return resultParts.join(', ');
}
