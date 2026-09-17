import { roundToFive } from '@/lib/utils';
import { normalizeFoodName } from '@/data/foods-crudo';
import { isMainMeal as checkIsMainMeal } from '@/config/nutrition-days';
import {
  hasTreePath,
  isAnimalProteinFood,
  isFatFood,
  isDairyFood,
  isEggFood,
  resolveGenericCarbNode,
  resolveGenericProteinNode,
  resolveGenericFruitNode,
} from '@/lib/engine/food-tree';
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
    isFixedComponent: item.isFixedComponent === true,
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

function calculateResolvedMealMacros(items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const totals = { kcal: 0, proteina: 0, hidratos: 0, grasa: 0 };
  for (const item of items) {
    const grams = Number(item?.grams);
    const food = item?.food;
    if (!Number.isFinite(grams) || !food) return null;
    if (![food.kcal, food.pro, food.cho, food.fat].every((value) => Number.isFinite(Number(value)))) {
      return null;
    }

    const factor = grams / 100;
    totals.kcal += factor * Number(food.kcal);
    totals.proteina += factor * Number(food.pro);
    totals.hidratos += factor * Number(food.cho);
    totals.grasa += factor * Number(food.fat);
  }

  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, Math.round(value)])
  );
}

function withMealDiagnostics(text, items, enabled) {
  if (!enabled) return text;
  return {
    text,
    macrosReales: calculateResolvedMealMacros(items),
  };
}


/**
 * Calibrador de precisión:
 * Ajusta matemáticamente los gramos del cereal/tubérculo y de la proteína principal
 * redondeando SIEMPRE a múltiplos de 5 gramos (ej: 193g -> 195g).
 */
export async function calibrateMeal(mealDetailStr, targetBudget, options = {}) {
  const isStructuredMeal = Array.isArray(mealDetailStr);
  if (!mealDetailStr || (!isStructuredMeal && typeof mealDetailStr !== 'string')) {
    return withMealDiagnostics(mealDetailStr, null, options.returnDiagnostics);
  }
  if (!targetBudget) return withMealDiagnostics(mealDetailStr, null, options.returnDiagnostics);

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
      return withMealDiagnostics('Recovery y fruta', null, options.returnDiagnostics);
    }
    if (options.hasCowProteinAllergy || options.isVegan || lower.includes('vegetal')) {
      return withMealDiagnostics('Batido de proteína vegetal 30g disuelto en agua', null, options.returnDiagnostics);
    }
    if (options.isLactoseIntolerant || lower.includes('sin lactosa')) {
      return withMealDiagnostics('Batido de proteína sin lactosa 30g disuelto en agua', null, options.returnDiagnostics);
    }
    return withMealDiagnostics('Batido de proteína 30g disuelto en agua', null, options.returnDiagnostics);
  }

  // Las comidas normales llegan desde el árbol como hojas estructuradas.
  // Si entra texto sin resolver, se conserva sin intentar adivinar alimentos.
  if (!isStructuredMeal) return withMealDiagnostics(mealDetailStr, null, options.returnDiagnostics);

  let parsedItems = mealDetailStr.map(normalizeResolvedMealItem).filter(Boolean);

  if (parsedItems.length === 0) return withMealDiagnostics('', null, options.returnDiagnostics);

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

  const isFixedItem = (item) => item?.isFixedComponent === true;

  if (options.fixedOnly) {
    const fixedText = parsedItems.map((item) => formatMealItemDisplayName(item)).join(', ');
    return withMealDiagnostics(fixedText, parsedItems, options.returnDiagnostics);
  }



  // REPARTO CLÍNICO EN COMIDAS DE ALTA CONCENTRACIÓN DE HIDRATOS (POSTRE DE FRUTA):
  // Si la comida concentra muchos hidratos (>=80g), se incluye postre de fruta fresca del árbol
  // para evitar montañas indigeribles de un solo cereal/tubérculo en el plato principal.
  const hasFruit = parsedItems.some(it => hasTreePath(it.food, 'frutas'));
  if (targetBudget.hc >= 80 && !hasFruit) {
    let selectedFruit = null;
    const resolvedFruitName = resolveGenericFruitNode(
      options.clinicalCatalog,
      options.player,
      options.tracker,
      options.isMatchDay,
      options.playerFoodTree
    );
    if (resolvedFruitName) {
      selectedFruit = getCatalogFood(resolvedFruitName, options);
    }
    if (!selectedFruit && options.clinicalCatalog?.foods) {
      selectedFruit = options.clinicalCatalog.foods.find(f => hasTreePath(f, 'frutas')) || null;
    }

    if (selectedFruit) {
      const isBanana = hasTreePath(selectedFruit, 'platano') || String(selectedFruit.name || '').toLowerCase().includes('platano');
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
    return hasTreePath(item.food, 'legumbres') || hasTreePath(item.food, 'vegetal_proteina');
  };

  let primaryFatIndex = -1;

  const isMainMeal = checkIsMainMeal(options.mealName, options);
  const allowsPlantProtein = options.isVegan || options.isVegetarian;

  parsedItems.forEach((it, idx) => {
    if (isFixedItem(it)) return;

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
      if (isAnimalProteinFood(it.food) || (allowsPlantProtein && isPlantProtein(it))) {
        if (it.food.pro > maxProDensity) {
          maxProDensity = it.food.pro;
          primaryProteinIndex = idx;
        }
      }
    } else {
      if (isAnimalProteinFood(it.food) || isDairyFood(it.food) || isEggItem(it) || (it.food?.pro > 10)) {
        if (it.food.pro > maxProDensity) {
          maxProDensity = it.food.pro;
          primaryProteinIndex = idx;
        }
      }
    }

    // Grasa primaria (AOVE / Aceites / Grasas limpias del árbol)
    if (isFatFood(it.food)) {
      primaryFatIndex = idx;
    }
  });

  // En comidas y cenas principales, SOLO PUEDE HABER UNA PROTEÍNA PRINCIPAL LIMPIA (carne, ave o pescado).
  // Se purga cualquier segunda proteína incompatible (huevos, claras, quesos, yogures o segunda carne).
  if (isMainMeal && primaryProteinIndex !== -1) {
    const toRemove = [];
    parsedItems.forEach((it, idx) => {
      if (idx !== primaryProteinIndex && !isFixedItem(it)) {
        const isPlantProt = isPlantProtein(it);
        const isProt = (
          isAnimalProteinFood(it.food) ||
          isDairyFood(it.food) ||
          isEggFood(it.food) ||
          isEggItem(it) ||
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
      return hasTreePath(it.food, 'panes');
    });

    if (breadIdx !== -1) {
      const breadItem = parsedItems[breadIdx];
      const primaryItem = parsedItems[primaryCarbIndex];
      const primaryChoFactor = (primaryItem.food?.cho || 20) / 100;
      const isTuber = hasTreePath(primaryItem.food, 'tuberculos');
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
  const clarasIdx = parsedItems.findIndex(it => String(it?.name || it?.food?.name || '').toLowerCase().includes('clara'));
  if (clarasIdx !== -1) {
    primaryProteinIndex = clarasIdx;
  }

  // RED DE SEGURIDAD OBLIGATORIA DE PROTEÍNA EN COMIDAS Y CENAS:
  // Si en una comida o cena principal no hay fuente de proteína limpia,
  // inyectar automáticamente una proteína limpia del árbol taxonómico del jugador
  if (isMainMeal && primaryProteinIndex === -1) {
    let chosenFood = null;
    const resolvedProtName = resolveGenericProteinNode(
      options.clinicalCatalog,
      options.player,
      options.tracker,
      options.isMatchDay,
      false,
      options.playerFoodTree
    );
    if (resolvedProtName) {
      chosenFood = getCatalogFood(resolvedProtName, options);
    }
    if (!chosenFood && options.clinicalCatalog?.foods) {
      chosenFood = options.clinicalCatalog.foods.find(f =>
        isAnimalProteinFood(f) || (allowsPlantProtein && hasTreePath(f, 'vegetal_proteina'))
      ) || null;
    }

    if (chosenFood) {
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
  }

  // RED DE SEGURIDAD OBLIGATORIA DE HIDRATO DE PLATO EN COMIDAS Y CENAS:
  // Si en una comida o cena principal no hay hidrato de plato,
  // inyectar un cereal/tubérculo limpio resuelto desde el árbol taxonómico del jugador
  if (isMainMeal && primaryCarbIndex === -1) {
    const isCena = Boolean(options.mealName && String(options.mealName).toLowerCase().includes('cena'));
    let chosenCarb = null;
    const resolvedCarbName = resolveGenericCarbNode(
      options.clinicalCatalog,
      options.player,
      options.tracker,
      options.isMatchDay,
      isCena,
      options.playerFoodTree
    );
    if (resolvedCarbName) {
      chosenCarb = getCatalogFood(resolvedCarbName, options);
    }
    if (!chosenCarb && options.clinicalCatalog?.foods) {
      chosenCarb = options.clinicalCatalog.foods.find(f =>
        hasTreePath(f, 'arroz') ||
        hasTreePath(f, 'pasta') ||
        hasTreePath(f, 'tuberculos') ||
        hasTreePath(f, 'otros_granos')
      ) || null;
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
    const isTuber = hasTreePath(carbItem.food, 'tuberculos');

    // Identificar o asegurar fruta de postre en comida principal
    let fruitItem = parsedItems.find(it => hasTreePath(it.food, 'frutas'));
    let fruitCanAdjust = fruitItem && !isFixedItem(fruitItem);
    if (!fruitItem && isMainMeal) {
      let dessertFruit = null;
      const fruitName = resolveGenericFruitNode(
        options.clinicalCatalog,
        options.player,
        options.tracker,
        options.isMatchDay,
        options.playerFoodTree
      );
      if (fruitName) {
        dessertFruit = getCatalogFood(fruitName, options);
      }
      if (!dessertFruit && options.clinicalCatalog?.foods) {
        dessertFruit = options.clinicalCatalog.foods.find(f => hasTreePath(f, 'frutas')) || null;
      }
      if (dessertFruit) {
        fruitItem = {
          name: dessertFruit.name,
          grams: 150,
          food: dessertFruit,
        };
        parsedItems.push(fruitItem);
        fruitCanAdjust = true;
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
        const availableFruitCho = fruitCanAdjust
          ? Math.max(0, (maxF - currentFruitGrams) * fruitChoFactor)
          : 0;

        if (excessCho <= availableFruitCho && fruitCanAdjust) {
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
            if (fruitCanAdjust) fruitItem.grams = maxF;
          } else if (isMainMeal) {
            // Exceso elevado (>= 20g HC pendientes, e.g. hipercarga o >130g HC totales):
            // Rebalanceo armónico: Tubérculo a zona media de confort (310g) + Cereal secundario (arroz/pasta >= 60g)
            carbItem.grams = 310;
            if (fruitCanAdjust) fruitItem.grams = 150;

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
      // === CASO CEREAL DE PLATO (Arroz blanco / Macarrones / Espaguetis) ===
      if (rawCarbGrams < minP) {
        // Demanda baja: garantizar que el cereal no baje de minP (50g)
        if (fruitCanAdjust && fruitItem.grams > minF) {
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
        const availableFruitCho = fruitCanAdjust
          ? Math.max(0, (maxF - currentFruitGrams) * fruitChoFactor)
          : 0;

        if (excessCho <= availableFruitCho && fruitCanAdjust) {
          carbItem.grams = maxP;
          const extraFruitGrams = roundToFive(excessCho / fruitChoFactor);
          fruitItem.grams = roundToFive(Math.min(maxF, currentFruitGrams + extraFruitGrams));
        } else {
          // Hipercarga que excede el tope del cereal y la capacidad de la fruta:
          // Rebalanceo armónico: Cereal a zona alta cómoda (140g-160g), fruta a 180g-200g,
          // y si es comida principal, acompañante de pan (30g-60g) para no sobrecargar el estómago.
          if (fruitCanAdjust) fruitItem.grams = Math.min(maxF, 180);
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
            return hasTreePath(it.food, 'panes');
          });

          if (!breadItem && isMainMeal && remCho > (140 * choFactor)) {
            let breadFood = null;
            const breadNode = options.playerFoodTree?.children?.hidratos?.children?.panes;
            if (breadNode && typeof breadNode.resolve === 'function' && options.clinicalCatalog) {
              const resolvedBreadName = breadNode.resolve(options.clinicalCatalog);
              if (resolvedBreadName) breadFood = getCatalogFood(resolvedBreadName, options);
            }
            if (!breadFood && options.clinicalCatalog?.foods) {
              breadFood = options.clinicalCatalog.foods.find(f => hasTreePath(f, 'panes')) || null;
            }
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
    if (isFixedItem(it)) return;
    const isProt = (
      isAnimalProteinFood(it.food) ||
      isEggFood(it.food) ||
      isEggItem(it) ||
      (isDairyFood(it.food) && (it.food?.pro || 0) >= 8)
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

  return withMealDiagnostics(resultParts.join(', '), parsedItems, options.returnDiagnostics);
}
