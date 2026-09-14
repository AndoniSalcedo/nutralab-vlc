import { getSupabaseAdmin } from '@/lib/supabase/server';
import { buildBasePlanData } from '@/lib/nutrition/plan-card';
import { getLatestMenu } from '@/repositories/menuRepository';
import { calibrateMeal } from '@/lib/nutrition/calculator';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import { FOODS_BY_NORMALIZED_NAME, normalizeFoodName } from '@/data/foods-crudo';
import {
  resolveDishIngredientsForPlayer,
  resolveNodeForPlayer,
  buildMealTree,
  resolveMealTreeForDay,
} from '@/lib/nutrition/food-tree';

export { buildMealTree, resolveMealTreeForDay };

export async function latestMenu(supabase, equipoId = null) {
  return getLatestMenu(supabase, equipoId);
}

export function calculateMealBudgets(day) {
  const { kcal, proteina, hidratos, grasa, ingestas } = day;
  if (!ingestas || ingestas.length === 0) return [];

  if (!kcal || !proteina || !hidratos || !grasa) {
    throw new Error(`Datos nutricionales incompletos para el dia: kcal=${kcal}, proteina=${proteina}, hidratos=${hidratos}, grasa=${grasa}`);
  }

  const mealNames = ingestas.map((i) => i.nombre);
  const postMealName = mealNames.find((n) => n.toLowerCase().includes('post'));
  const hasPost = Boolean(postMealName);
  const hasMerienda = mealNames.some((n) => n.toLowerCase().includes('merienda'));
  const hasDesayuno = mealNames.some((n) => n.toLowerCase().includes('desayuno'));
  const hasComida = mealNames.some((n) => n.toLowerCase().includes('comida') || n.toLowerCase().includes('almuerzo'));
  const hasCena = mealNames.some((n) => n.toLowerCase().includes('cena'));

  // Porcentajes y cuotas de reparto de macronutrientes según la estructura exacta de tomas
  let pShares = {};
  let hcShares = {};
  let gShares = {};

  const POST_FIXED_PROTEIN = 20; // 20g fijos de proteína siempre para post-entreno y post-partido
  const postP = hasPost ? Math.min(POST_FIXED_PROTEIN, proteina) : 0;
  const remainingP = hasPost ? Math.max(0, proteina - postP) : proteina;

  if (hasPost) {
    if (hasDesayuno && hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 10 / 90, Comida: 35 / 90, Merienda: 10 / 90, Cena: 35 / 90 };
      hcShares = { Desayuno: 0.20, Comida: 0.35, Merienda: 0.15, Cena: 0.30 };
      gShares = { Desayuno: 0.18, Comida: 0.35, Merienda: 0.12, Cena: 0.35 };
    } else if (hasDesayuno && !hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 15 / 90, Comida: 40 / 90, Cena: 35 / 90 };
      hcShares = { Desayuno: 0.25, Comida: 0.40, Cena: 0.35 };
      gShares = { Desayuno: 0.20, Comida: 0.40, Cena: 0.40 };
    } else if (!hasDesayuno && hasMerienda && hasComida && hasCena) {
      pShares = { Comida: 40 / 90, Merienda: 10 / 90, Cena: 40 / 90 };
      hcShares = { Comida: 0.35, Merienda: 0.35, Cena: 0.30 };
      gShares = { Comida: 0.45, Merienda: 0.10, Cena: 0.45 };
    } else if (!hasDesayuno && !hasMerienda && hasComida && hasCena) {
      pShares = { Comida: 0.50, Cena: 0.50 };
      hcShares = { Comida: 0.50, Cena: 0.50 };
      gShares = { Comida: 0.50, Cena: 0.50 };
    } else {
      const others = mealNames.filter((n) => !n.toLowerCase().includes('post'));
      const share = 1.0 / (others.length || 1);
      others.forEach((n) => {
        pShares[n] = share;
        hcShares[n] = share;
        gShares[n] = share;
      });
    }
  } else {
    if (hasDesayuno && hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 0.15, Comida: 0.375, Merienda: 0.10, Cena: 0.375 };
      hcShares = { Desayuno: 0.22, Comida: 0.36, Merienda: 0.16, Cena: 0.26 };
      gShares = { Desayuno: 0.20, Comida: 0.35, Merienda: 0.15, Cena: 0.30 };
    } else if (hasDesayuno && !hasMerienda && hasComida && hasCena) {
      pShares = { Desayuno: 0.20, Comida: 0.42, Cena: 0.38 };
      hcShares = { Desayuno: 0.25, Comida: 0.40, Cena: 0.35 };
      gShares = { Desayuno: 0.22, Comida: 0.40, Cena: 0.38 };
    } else if (!hasDesayuno && !hasMerienda && hasComida && hasCena) {
      pShares = { Comida: 0.50, Cena: 0.50 };
      hcShares = { Comida: 0.50, Cena: 0.50 };
      gShares = { Comida: 0.50, Cena: 0.50 };
    } else {
      const share = 1.0 / mealNames.length;
      mealNames.forEach((n) => {
        pShares[n] = share;
        hcShares[n] = share;
        gShares[n] = share;
      });
    }
  }

  const findKey = (name) => {
    const low = name.toLowerCase();
    if (low.includes('post')) return 'Post';
    if (low.includes('merienda')) return 'Merienda';
    if (low.includes('desayuno')) return 'Desayuno';
    if (low.includes('comida') || low.includes('almuerzo')) return 'Comida';
    if (low.includes('cena')) return 'Cena';
    return name;
  };

  const budgets = {};
  let accP = 0;
  let accHC = 0;
  let accG = 0;
  let accKcal = 0;

  if (hasPost && postMealName) {
    const postKcal = postP * 4;
    budgets[postMealName] = { kcal: postKcal, p: postP, hc: 0, g: 0 };
    budgets['Post-entreno'] = budgets[postMealName];
    budgets['Post-partido'] = budgets[postMealName];
    accP += postP;
    accKcal += postKcal;
  }

  const cenaMealName = mealNames.find((n) => n.toLowerCase().includes('cena')) || mealNames[mealNames.length - 1];

  for (const ing of ingestas) {
    if (ing.nombre === cenaMealName) continue;
    if (hasPost && ing.nombre === postMealName) continue;

    const key = findKey(ing.nombre);
    const pFrac = pShares[key] ?? (1 / ingestas.length);
    const hcFrac = hcShares[key] ?? (1 / ingestas.length);
    const gFrac = gShares[key] ?? (1 / ingestas.length);

    const mP = Math.round(remainingP * pFrac);
    const mHC = Math.round(hidratos * hcFrac);
    const mG = Math.round(grasa * gFrac);
    const mKcal = Math.round(mP * 4 + mHC * 4 + mG * 9);

    budgets[ing.nombre] = { kcal: mKcal, p: mP, hc: mHC, g: mG };
    accP += mP;
    accHC += mHC;
    accG += mG;
    accKcal += mKcal;
  }

  const remP = Math.max(0, proteina - accP);
  const remHC = Math.max(0, hidratos - accHC);
  const remG = Math.max(0, grasa - accG);
  const remKcal = Math.max(0, kcal - accKcal);

  budgets[cenaMealName] = { kcal: remKcal, p: remP, hc: remHC, g: remG };

  return ingestas.map((ing) => ({
    nombre: ing.nombre,
    target: budgets[ing.nombre] || {
      kcal: Math.round(kcal / ingestas.length),
      p: Math.round(proteina / ingestas.length),
      hc: Math.round(hidratos / ingestas.length),
      g: Math.round(grasa / ingestas.length),
    },
  }));
}

export const BUFFET_SINGLE_FOOD_ALIASES = {
  arroz: 'Arroz blanco',
  pasta: 'Pasta de trigo',
  patata: 'Patata',
  patatas: 'Patata',
  boniato: 'Boniato',
  cuscus: 'Cuscús',
  couscous: 'Cuscús',
  'cous cous': 'Cuscús',
  avena: 'Copos de avena',
  'pollo asado': 'Pechuga de pollo',
  'pollo plancha': 'Pechuga de pollo',
  'pollo brasa': 'Pechuga de pollo',
  'pavo plancha': 'Pechuga de pavo',
  'pavo brasa': 'Pechuga de pavo',
  'sepia plancha': 'Sepia',
  'corvina plancha': 'Corvina',
  'emperador plancha': 'Emperador (pez espada)',
  'atun aleta amarilla': 'Atún fresco',
  'pure de boniato': 'Boniato',
  'patatas panaderas': 'Patata',
  'patatas asadas': 'Patata',
  'patatas splash': 'Patata',
  'patata baby al romero y tomillo': 'Patata',
  'noodles de arroz': 'Fideos de arroz',
  gazpacho: 'Gazpacho',
  salmorejo: 'Salmorejo',
};

export function filterDishOptionsByRestrictions(dishText, jugador, platosDesglosados = []) {
  if (!dishText || typeof dishText !== 'string' || !jugador) {
    return { filteredText: dishText || '', hasConflict: false, allExcluded: false };
  }

  const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
  const rawRestr = `${jugador.alergias || ''} ${jugador.intolerancias || ''} ${jugador.aversiones || ''}`.toLowerCase();
  const hasRestrictions = Boolean(
    rawRestr.trim() && !rawRestr.includes('nada') && !rawRestr.includes('ningun')
  );

  const isGlutenRestricted = rawRestr.includes('gluten') || rawRestr.includes('celiac') || rawRestr.includes('sibo') || rawRestr.includes('fodmap');
  const isLactoseRestricted = rawRestr.includes('lactosa') || rawRestr.includes('leche') || rawRestr.includes('sibo') || rawRestr.includes('fodmap');
  const isPorkRestricted = rawRestr.includes('cerdo') || rawRestr.includes('pork');
  const isFishRestricted = rawRestr.includes('pescado') || rawRestr.includes('marisco') || rawRestr.includes('fish');

  const options = dishText.split('/').map((s) => s.trim()).filter(Boolean);
  if (options.length === 0) {
    return { filteredText: dishText, hasConflict: false, allExcluded: false };
  }

  const safeOptions = [];
  let excludedAny = false;

  for (const opt of options) {
    const optLow = opt.toLowerCase();
    const norm = normalizeFoodName(opt);

    const decMatch = Array.isArray(platosDesglosados) ? platosDesglosados.find(
      (p) => p.nombre && (
        p.nombre.toLowerCase().trim() === optLow ||
        normalizeFoodName(p.nombre) === norm ||
        optLow.includes(p.nombre.toLowerCase().trim())
      )
    ) : null;

    if (decMatch) {
      const resolved = resolveDishIngredientsForPlayer(decMatch, clinicalCatalog);
      if (resolved.safe) {
        safeOptions.push(opt);
      } else {
        excludedAny = true;
      }
      continue;
    }

    let resolvedSingleFood = null;
    if (FOODS_BY_NORMALIZED_NAME.has(norm)) {
      resolvedSingleFood = FOODS_BY_NORMALIZED_NAME.get(norm).name;
    } else if (BUFFET_SINGLE_FOOD_ALIASES[optLow] || BUFFET_SINGLE_FOOD_ALIASES[norm]) {
      resolvedSingleFood = BUFFET_SINGLE_FOOD_ALIASES[optLow] || BUFFET_SINGLE_FOOD_ALIASES[norm];
    }

    let isExcluded = false;

    if (hasRestrictions) {
      if (isGlutenRestricted) {
        const strictGlutenKeywords = ['trigo', 'cuscus', 'cuscús', 'cous', 'cous cous', 'couscous', 'croqueta', 'empanado', 'ravioli', 'cebada', 'centeno', 'espelta'];
        if (strictGlutenKeywords.some((kw) => optLow.includes(kw) || (resolvedSingleFood && resolvedSingleFood.toLowerCase().includes(kw)))) {
          isExcluded = true;
        }
      }

      if (!isExcluded && isPorkRestricted) {
        const porkKeywords = ['cerdo', 'secreto', 'secreto ibérico', 'secreto iberico', 'presa', 'lomo', 'jamon', 'jamón', 'bacon', 'chorizo', 'costilla', 'panceta'];
        if (porkKeywords.some((kw) => optLow.includes(kw) || (resolvedSingleFood && resolvedSingleFood.toLowerCase().includes(kw)))) {
          isExcluded = true;
        }
      }

      if (!isExcluded && isFishRestricted) {
        const fishKeywords = ['pescado', 'merluza', 'dorada', 'lubina', 'corvina', 'bacalao', 'salmon', 'salmón', 'atun', 'atún', 'emperador', 'sepia', 'calamar', 'pulpo', 'gamba', 'gambas', 'langostino', 'marisco', 'fideua de pescado', 'pez espada', 'bonito', 'rape', 'gallineta', 'poke de atun'];
        if (fishKeywords.some((kw) => optLow.includes(kw) || (resolvedSingleFood && resolvedSingleFood.toLowerCase().includes(kw)))) {
          isExcluded = true;
        }
      }

      if (!isExcluded && isLactoseRestricted) {
        const lactoseKeywords = ['queso', 'nata', 'ricota', 'cottage', 'parmesano', 'gratinad'];
        if (lactoseKeywords.some((kw) => optLow.includes(kw) || (resolvedSingleFood && resolvedSingleFood.toLowerCase().includes(kw)))) {
          isExcluded = true;
        }
      }
    }

    if (isExcluded) {
      excludedAny = true;
    } else {
      safeOptions.push(resolvedSingleFood || opt);
    }
  }

  if (safeOptions.length > 0) {
    return {
      filteredText: safeOptions.join(' / '),
      hasConflict: excludedAny,
      allExcluded: false,
    };
  }

  return {
    filteredText: dishText,
    hasConflict: true,
    allExcluded: true,
  };
}

export function getMenuMealOptions(menu, dayKey, mealName, jugador = null) {
  if (!menu?.dias?.length || !dayKey || !mealName) return null;
  const normDay = String(dayKey).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const dayMenu = menu.dias.find((d) => {
    const dStr = String(d.dia || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return dStr.includes(normDay) || normDay.includes(dStr);
  });
  if (!dayMenu) return null;

  const normMeal = String(mealName).toLowerCase().trim();
  let mealData = null;
  if (normMeal === 'comida' || normMeal === 'almuerzo') {
    mealData = dayMenu.comida;
  } else if (normMeal === 'cena') {
    mealData = dayMenu.cena;
  }

  if (!mealData) return null;

  const rawPrimero = String(mealData.primero || '').trim();
  const rawSegundo = String(mealData.segundo || '').trim();
  const rawCombined = `${rawPrimero} ${rawSegundo}`.toLowerCase();

  if (rawCombined === 'descanso') {
    return null;
  }

  const isPreMatchMarker = rawCombined.includes('prepartido') || rawCombined.includes('pre-partido');
  if (isPreMatchMarker && !rawPrimero.includes('/') && !rawSegundo.includes('/')) {
    return {
      description: normMeal === 'cena'
        ? 'Cena de carga pre-partido del comedor: Plato alto en hidratos de carbono (pasta o arroz) con proteína magra limpia (pechuga de pollo, pavo o ternera magra) y fruta fresca de postre.'
        : 'Comida pre-partido del comedor: Plato digestivo alto en hidratos (arroz o pasta) con proteína magra y fruta fresca.',
      hasCriticalConflict: false,
    };
  }

  const isMatchMarker = rawCombined.startsWith('partido ') || rawCombined.includes(' - valencia') || rawCombined.includes('valencia c.f');
  if (isMatchMarker && !rawPrimero.includes('/') && !rawSegundo.includes('/')) {
    return {
      description: 'Cena post-partido del comedor: Plato recuperador completo con carbohidratos de plato, proteína limpia de calidad y fruta fresca.',
      hasCriticalConflict: false,
    };
  }

  const primeroRes = filterDishOptionsByRestrictions(mealData.primero, jugador, mealData.platos_desglosados);
  const segundoRes = filterDishOptionsByRestrictions(mealData.segundo, jugador, mealData.platos_desglosados);
  const postreRes = filterDishOptionsByRestrictions(mealData.postre, jugador, mealData.platos_desglosados);

  const parts = [];
  let hasCriticalConflict = false;

  if (primeroRes.allExcluded) {
    hasCriticalConflict = true;
    parts.push(`Primero: [Opción no tolerada (${mealData.primero}). Sustituir por arroz, patata o verdura apta]`);
  } else if (primeroRes.filteredText) {
    parts.push(`Primero: ${primeroRes.filteredText}`);
  }

  if (segundoRes.allExcluded) {
    hasCriticalConflict = true;
    parts.push(`Segundo: [Plato prohibido para el jugador ("${mealData.segundo}"). Sustituir por proteína limpia: pechuga de pollo, pavo, ternera magra o huevos]`);
  } else if (segundoRes.filteredText) {
    parts.push(`Segundo: ${segundoRes.filteredText}`);
  }

  if (postreRes.filteredText) {
    parts.push(`Postre: ${postreRes.filteredText}`);
  }

  if (parts.length === 0) return null;

  return {
    description: parts.join(' | '),
    hasCriticalConflict,
  };
}

/**
 * Parsea alimentos o combinaciones a partir del texto de recomendaciones o protocolos del jugador.
 * Mapea tanto términos específicos como conceptos genéricos del Árbol Nutricional ('carbohidratos', 'proteína', 'vegetales', 'fruta').
 * Si no se reconocen alimentos o el texto es una descripción no gastronómica, devuelve un array vacío sin inventar platos.
 */
export function parseFoodsFromText(text, catalog, player = null) {
  if (!text || typeof text !== 'string' || !text.trim()) return [];
  const raw = text.trim();
  const low = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Frases descriptivas no gastronómicas que no contienen alimentos concretos
  const nonFoodPhrases = ['variado le gusta comer sano', 'variadas saludables', 'variadas', 'opciones variadas dulces saludables'];
  if (nonFoodPhrases.some((p) => low.includes(p)) && !low.includes('+') && !low.includes('con') && !low.includes('arroz') && !low.includes('pan')) {
    return [];
  }

  const foods = [];

  // 1. Suplementos específicos y protocolos médicos
  if (low.includes('ensure')) foods.push('Ensure Nutrición Entera 1 unidad');
  if (low.includes('recovery')) foods.push('Recovery y fruta');

  // 2. Hidratos de carbono
  if (low.includes('arroz con leche')) {
    foods.push('Arroz blanco');
    foods.push(resolveNodeForPlayer('leches', catalog) || 'Leche entera');
  } else if (low.includes('tortitas de arroz') || low.includes('tortas de arroz')) {
    foods.push('Tortitas de arroz');
  } else if (low.includes('arroz')) {
    foods.push(resolveNodeForPlayer('arroz', catalog) || 'Arroz blanco');
  }

  if (low.includes('pasta') || low.includes('macarron') || low.includes('espagueti') || low.includes('fideos')) {
    foods.push(resolveNodeForPlayer('pasta', catalog) || 'Pasta de trigo');
  }

  if (low.includes('pan') || low.includes('tostada') || low.includes('tostadas') || low.includes('biscote')) {
    foods.push(resolveNodeForPlayer('panes', catalog) || 'Pan blanco de barra');
  }

  if (low.includes('avena') || low.includes('porridge') || low.includes('chherios')) {
    foods.push(catalog.foodsByNormalizedName?.has('copos de avena sin gluten') ? 'Copos de avena sin gluten' : 'Copos de avena');
  }

  if (low.includes('patata') || low.includes('pure de patata')) {
    foods.push('Patata');
  }

  if (low.includes('boniato') || low.includes('batata')) {
    if (!player?.aversiones?.toLowerCase().includes('boniato')) {
      foods.push('Boniato');
    }
  }

  if (low.includes('maiz')) {
    foods.push('Maíz dulce');
  }

  // Genérico 'carbohidrato' / 'carbohidratos' / 'hidrato'
  if ((low.includes('carbohidrato') || low.includes('carbohidratos') || low.includes('hidrato')) &&
      !foods.some((f) => ['Arroz blanco', 'Pasta de trigo', 'Pasta sin gluten', 'Patata', 'Boniato', 'Pan blanco de barra', 'Pan sin gluten', 'Copos de avena'].includes(f))) {
    const genericCarb = resolveNodeForPlayer('hidratos', catalog) || 'Arroz blanco';
    foods.push(genericCarb);
  }

  // 3. Proteínas
  if (low.includes('alita')) {
    foods.push('Alitas de pollo');
  } else if (low.includes('contramuslo')) {
    foods.push('Contramuslo de pollo deshuesado');
  } else if (low.includes('pollo')) {
    foods.push(resolveNodeForPlayer('pollo', catalog) || 'Pechuga de pollo');
  }

  if (low.includes('pavo')) {
    foods.push('Pechuga de pavo');
  }

  if (low.includes('ternera') || low.includes('solomillo') || low.includes('carne picada')) {
    foods.push(resolveNodeForPlayer('vacuno', catalog) || 'Ternera magra');
  }

  if (low.includes('burger') || low.includes('hamburguesa')) {
    foods.push('Hamburguesa de ternera');
  }

  if (low.includes('salmon')) {
    if (!catalog.activeTags.includes('sin_pescado') && !player?.aversiones?.toLowerCase().includes('salmon')) {
      foods.push('Salmón');
    }
  }

  if (low.includes('atun')) {
    if (!catalog.activeTags.includes('sin_pescado') && !player?.aversiones?.toLowerCase().includes('atun')) {
      foods.push(low.includes('fresco') ? 'Atún fresco' : 'Atún natural');
    }
  }

  if (low.includes('merluza')) {
    if (!catalog.activeTags.includes('sin_pescado')) {
      foods.push('Merluza');
    }
  }

  if (low.includes('jamon') || low.includes('york')) {
    if (!catalog.activeTags.includes('sin_cerdo')) {
      foods.push('Jamón cocido');
    }
  }

  if (low.includes('huevo') || low.includes('tortilla') || low.includes('revuelto') || low.includes('claras')) {
    foods.push('Huevo entero');
  }

  // Genérico 'proteina' / 'proteína' / 'prote' / 'proteina magra'
  if ((low.includes('proteina') || low.includes('prote') || low.includes('proteinas')) &&
      !foods.some((f) => ['Pechuga de pollo', 'Pechuga de pavo', 'Ternera magra', 'Salmón', 'Merluza', 'Atún fresco', 'Atún natural', 'Huevo entero', 'Hamburguesa de ternera'].includes(f))) {
    let genericProt = null;
    if (!catalog.activeTags.includes('sin_pescado')) {
      genericProt = resolveNodeForPlayer('pescado_blanco', catalog);
    }
    if (!genericProt) {
      genericProt = resolveNodeForPlayer('aves', catalog) || 'Pechuga de pollo';
    }
    foods.push(genericProt);
  }

  // 4. Lácteos
  if (low.includes('yogur')) {
    foods.push(resolveNodeForPlayer('yogures', catalog) || 'Yogur proteico natural');
  }
  if (low.includes('leche') && !low.includes('arroz con leche')) {
    foods.push(resolveNodeForPlayer('leches', catalog) || 'Leche desnatada');
  }
  if (low.includes('queso')) {
    foods.push(resolveNodeForPlayer('quesos', catalog) || 'Queso fresco batido 0%');
  }

  // 5. Verduras y vegetales
  if (low.includes('ensalada')) {
    foods.push('Ensalada mixta');
  }
  if (low.includes('tomate') || low.includes('salsa de tomate') || low.includes('bolonesa')) {
    foods.push('Tomate');
  }
  if (low.includes('calabacin')) {
    foods.push('Calabacín');
  }
  if (low.includes('espinaca')) {
    if (!player?.aversiones?.toLowerCase().includes('espinaca')) {
      foods.push('Espinacas');
    }
  }

  // Genérico 'vegetales' / 'verdura'
  if ((low.includes('vegetal') || low.includes('vegetales') || low.includes('verdura') || low.includes('verduras')) &&
      !foods.some((f) => ['Calabacín', 'Ensalada mixta', 'Tomate', 'Espinacas', 'Champiñón'].includes(f))) {
    const genericVeg = resolveNodeForPlayer('verdura', catalog) || 'Calabacín';
    foods.push(genericVeg);
  }

  // 6. Frutas
  if (low.includes('platano') || low.includes('banana') || low.includes('pllatano')) {
    foods.push('Plátano');
  }
  if (low.includes('manzana')) {
    foods.push('Manzana');
  }
  if (low.includes('naranja') || low.includes('zumo')) {
    foods.push('Naranja');
  }
  if (low.includes('arandano') || low.includes('frutos rojos')) {
    foods.push('Arándanos');
  }

  // Genérico 'fruta' / 'frutas'
  if ((low.includes('fruta') || low.includes('frutas')) &&
      !foods.some((f) => ['Plátano', 'Manzana', 'Naranja', 'Arándanos', 'Kiwi', 'Fresas'].includes(f))) {
    const genericFruit = resolveNodeForPlayer('fruta', catalog) || 'Plátano';
    foods.push(genericFruit);
  }

  // 7. Grasas
  if (low.includes('aguacate')) foods.push('Aguacate');
  if (low.includes('nuez') || low.includes('nueces') || low.includes('frutos secos')) foods.push('Nuez');
  if (low.includes('aceite') || low.includes('aove')) foods.push('Aceite de oliva virgen extra');
  if (low.includes('miel')) foods.push('Miel');

  return Array.from(new Set(foods.filter(Boolean)));
}

/**
 * Selecciona y resuelve platos del buffet del comedor escolar/deportivo adaptados al perfil del jugador
 */
export function selectBuffetMealDishes(mealData, clinicalCatalog) {
  if (!mealData) return null;
  const rawCombined = `${mealData.primero || ''} ${mealData.segundo || ''}`.toLowerCase();
  if (rawCombined.includes('descanso') || rawCombined.includes('partido')) return null;

  if (Array.isArray(mealData.platos_desglosados) && mealData.platos_desglosados.length > 0) {
    const safeDishes = [];
    for (const d of mealData.platos_desglosados) {
      const res = resolveDishIngredientsForPlayer(d, clinicalCatalog);
      if (res.safe && res.items.length > 0) {
        safeDishes.push({ dish: d, items: res.items });
      }
    }

    if (safeDishes.length > 0) {
      const carbDish = safeDishes.find((sd) => sd.dish.hidrato);
      const proteinDish = safeDishes.find((sd) => sd.dish.proteina?.length > 0 && sd !== carbDish);
      const dessertDish = safeDishes.find((sd) => (sd.dish.fruta?.length > 0 || sd.dish.lacteo?.length > 0) && sd !== carbDish && sd !== proteinDish);

      const combinedItems = [];
      if (carbDish) combinedItems.push(...carbDish.items);
      if (proteinDish) {
        combinedItems.push(...proteinDish.items);
      } else if (!carbDish && safeDishes[0]) {
        combinedItems.push(...safeDishes[0].items);
      }
      if (dessertDish) {
        combinedItems.push(...dessertDish.items);
      }

      if (combinedItems.length > 0) {
        if ((carbDish || proteinDish) && !combinedItems.some((it) => it.toLowerCase().includes('aceite') || it.toLowerCase().includes('aove'))) {
          combinedItems.push('Aceite de oliva virgen extra');
        }
        return Array.from(new Set(combinedItems)).join(', ');
      }
    }
  }

  const combinedText = `${mealData.primero || ''} ${mealData.segundo || ''}`;
  const parsed = parseFoodsFromText(combinedText, clinicalCatalog);
  if (parsed.length > 0) {
    if (!parsed.some((it) => it.toLowerCase().includes('aceite') || it.toLowerCase().includes('aove'))) {
      parsed.push('Aceite de oliva virgen extra');
    }
    return parsed.join(', ');
  }

  return null;
}

/**
 * Generador Nutricional Semanal 100% Determinista (Sin IA y Sin Platos por Defecto).
 * - Mapea rigurosamente el Árbol Taxonómico desde conceptos genéricos hasta cortes concretos.
 * - Si falta una configuración o un plato no se reconoce, NO inventa platos: muestra el fallo claramente.
 */
export async function generateDeterministicWeeklyPlan({
  jugador,
  baseData,
  menu,
  preMatchConfig,
}) {
  const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
  const activeTagsSet = new Set(clinicalCatalog.activeTags);
  const hasFodmapDigestiveRestriction =
    activeTagsSet.has('sibo_low_fodmap') ||
    activeTagsSet.has('sibo_hidrogeno') ||
    activeTagsSet.has('sibo_metano_imo') ||
    activeTagsSet.has('sibo_mixto') ||
    activeTagsSet.has('sibo_sulfuro') ||
    activeTagsSet.has('colon_irritable');
  const isLactoseIntolerant = activeTagsSet.has('sin_lactosa') || hasFodmapDigestiveRestriction;
  const isGlutenIntolerant = activeTagsSet.has('sin_gluten') || hasFodmapDigestiveRestriction;
  const isFishIntolerant = activeTagsSet.has('sin_pescado') || activeTagsSet.has('sin_marisco');
  const isPorkIntolerant = activeTagsSet.has('sin_cerdo');
  const hasCowProteinAllergy = activeTagsSet.has('sin_proteina_vaca');
  const hasFructoseIntolerance = activeTagsSet.has('sin_fructosa');
  const hasIbs = activeTagsSet.has('colon_irritable');
  const isVegan = activeTagsSet.has('vegano');

  const calOptions = {
    isLactoseIntolerant,
    isGlutenIntolerant,
    isFishIntolerant,
    isPorkIntolerant,
    hasCowProteinAllergy,
    hasFructoseIntolerance,
    hasIbs,
    isVegan,
    clinicalCatalog,
  };

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const finalDias = { ...baseData.dias };

  for (let dayIdx = 0; dayIdx < daysOfWeek.length; dayIdx++) {
    const dayKey = daysOfWeek[dayIdx];
    const dayData = baseData.dias[dayKey];
    if (!dayData?.ingestas || !Array.isArray(dayData.ingestas)) continue;

    const nextDayKey = daysOfWeek[(dayIdx + 1) % 7];
    const matchDayKeys = Object.keys(preMatchConfig?.partidos || {}).filter((k) => preMatchConfig?.partidos?.[k]?.horario);
    const isNextDayMatch = Boolean(
      (nextDayKey && baseData.dias[nextDayKey]?.tipoDia === 'partido') ||
      (nextDayKey && matchDayKeys.includes(nextDayKey))
    );
    const isMatchDay = dayData.tipoDia === 'partido';
    const isPrevToMatch = isNextDayMatch;

    const matchKey = isMatchDay ? dayKey : (isPrevToMatch ? nextDayKey : null);
    const horario = matchKey ? preMatchConfig?.partidos?.[matchKey]?.horario : null;
    const playerPreMatch = horario ? (jugador?.config_prepartido?.[horario] || {}) : {};

    const normDay = dayKey.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const dayMenu = menu?.dias?.find((d) => {
      const dStr = String(d.dia || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return dStr.includes(normDay) || normDay.includes(dStr);
    });

    const budgets = calculateMealBudgets(dayData);
    const budgetMap = new Map(budgets.map((b) => [b.nombre.toLowerCase().trim(), b.target]));
    const calOptionsForDay = { ...calOptions, isMatchDay };

    const calibratedIngestas = [];

    for (const ing of dayData.ingestas) {
      const mealName = ing.nombre;
      const normMeal = mealName.toLowerCase().trim();
      const target = budgetMap.get(normMeal);

      let rawStr = '';

      // 1. Post-entreno / Post-partido
      if (normMeal.includes('post')) {
        if (isMatchDay || normMeal.includes('partido')) {
          rawStr = 'Recovery y fruta';
        } else if (hasCowProteinAllergy || isVegan) {
          rawStr = 'Batido de proteína vegetal 30g disuelto en agua';
        } else if (isLactoseIntolerant) {
          rawStr = 'Batido de proteína sin lactosa 30g disuelto en agua';
        } else {
          rawStr = 'Batido de proteína 30g disuelto en agua';
        }
      }
      // 2. Cena de carga pre-partido (24h previas)
      else if (isPrevToMatch && (normMeal.includes('cena') || (!dayData.ingestas.some((i) => i.nombre.toLowerCase().includes('cena')) && ing === dayData.ingestas[dayData.ingestas.length - 1]))) {
        const pautaCarga = playerPreMatch.dia_anterior || playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena;
        rawStr = resolveMealTreeForDay(pautaCarga, dayIdx, mealName, clinicalCatalog, jugador, true);
      }
      // 3. Día de partido (protocolo pre-partido)
      else if (isMatchDay) {
        const pautaMatch = playerPreMatch.recomendaciones?.[mealName] || playerPreMatch.recomendaciones?.[mealName.toLowerCase()];
        rawStr = resolveMealTreeForDay(pautaMatch, dayIdx, mealName, clinicalCatalog, jugador, true);
      }
      // 4. Comida o Cena habitual (revisar buffet de comedor primero)
      else if (normMeal.includes('comida') || normMeal.includes('almuerzo') || normMeal.includes('cena')) {
        const isLunch = normMeal.includes('comida') || normMeal.includes('almuerzo');
        const mealService = isLunch ? dayMenu?.comida : dayMenu?.cena;
        const buffetOption = selectBuffetMealDishes(mealService, clinicalCatalog);

        if (buffetOption) {
          rawStr = buffetOption;
        } else {
          const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
          rawStr = resolveMealTreeForDay(pautaDefecto, dayIdx, mealName, clinicalCatalog, jugador, false);
        }
      }
      // 5. Desayunos, Meriendas o colaciones habituales
      else {
        const pautaDefecto = jugador?.recomendaciones_defecto?.[mealName] || jugador?.recomendaciones_defecto?.[mealName.toLowerCase()];
        rawStr = resolveMealTreeForDay(pautaDefecto, dayIdx, mealName, clinicalCatalog, jugador, false);
      }

      const isAlert = rawStr.startsWith('[');
      const calibrated = (!isAlert && target)
        ? await calibrateMeal(rawStr, target, { ...calOptionsForDay, mealName, dayIndex: dayIdx })
        : rawStr;

      calibratedIngestas.push({
        ...ing,
        detalle: calibrated,
      });
    }

    finalDias[dayKey] = {
      ...dayData,
      ingestas: calibratedIngestas,
    };
  }

  return finalDias;
}

/**
 * Genera los datos completos del plan nutricional semanal de forma determinista,
 * utilizando el Árbol Taxonómico de Alimentos y la Calculadora Matemática.
 */
export async function generarDatosPlan({
  jugador,
  nombre,
  contexto,
  contextoAdicional,
  calendario,
  menu,
  teamConfig,
  recomendacionesIngestas,
  preMatchConfig,
}) {
  const supabase = getSupabaseAdmin();
  const resolvedMenu = menu !== undefined ? menu : await latestMenu(supabase, jugador?.equipo_id);
  const baseData = buildBasePlanData({
    jugador,
    nombre,
    contexto: contexto || 'semana_normal',
    contextoAdicional,
    menu: resolvedMenu,
    calendario,
    preMatchConfig,
    teamConfig,
  });

  const finalDias = await generateDeterministicWeeklyPlan({
    jugador,
    baseData,
    menu: resolvedMenu,
    preMatchConfig,
  });

  const finalNotas = [
    'Ajusta la hidratación según la intensidad de la sesión y la sudoración.',
    'Respeta los gramajes en crudo indicados para cada comida.',
    'Toma el batido post-entreno en los primeros 30 minutos tras finalizar la sesión.',
    'Mantén las pautas de descanso nocturno y digestión adecuada.',
  ];

  return {
    ...baseData,
    dias: finalDias,
    notas: finalNotas,
    meta: {
      ...baseData.meta,
      nombre,
      contexto: contexto || 'semana_normal',
      contextoAdicional,
      recomendacionesIngestas: recomendacionesIngestas || {},
      preMatchConfig: preMatchConfig || null,
      engine: 'deterministic_food_tree',
    },
  };
}
