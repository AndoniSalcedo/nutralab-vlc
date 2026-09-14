import { getSupabaseAdmin } from '@/lib/supabase/server';
import { buildBasePlanData } from '@/lib/nutrition/plan-card';
import { env } from '@/config/env';
import { getObjectiveLabel } from '@/config/nutrition-days';
import { getLatestMenu } from '@/repositories/menuRepository';
import { calibrateMeal, findFoodInCatalog } from '@/lib/nutrition/calculator';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import {
  AI_NUTRITION_RULES,
  AI_MENU_NUTRITION_RULES,
  buildWeeklyPromptEnvelope,
  buildWeeklyMenuPromptEnvelope,
} from '@/config/ai-prompts';
import { aiClient as client, getMaxTokens as maxTokens } from './client';

function extractJson(text) {
  const value = String(text || '').replace(/```json|```/g, '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('La IA no devolvió un JSON válido');
  }
  return JSON.parse(value.slice(start, end + 1));
}

export async function latestMenu(supabase, equipoId = null) {
  return getLatestMenu(supabase, equipoId);
}

export function calculateMealBudgets(day) {
  const { kcal, proteina, hidratos, grasa, ingestas } = day;
  if (!ingestas || ingestas.length === 0) return [];

  if (!kcal || !proteina || !hidratos || !grasa) {
    throw new Error(`Datos nutricionales incompletos para el dia: kcal=${kcal}, proteina=${proteina}, hidratos=${hidratos}, grasa=${grasa}`);
  }

  const mealNames = ingestas.map(i => i.nombre);
  const postMealName = mealNames.find(n => n.toLowerCase().includes('post'));
  const hasPost = Boolean(postMealName);
  const hasMerienda = mealNames.some(n => n.toLowerCase().includes('merienda'));
  const hasDesayuno = mealNames.some(n => n.toLowerCase().includes('desayuno'));
  const hasComida = mealNames.some(n => n.toLowerCase().includes('comida') || n.toLowerCase().includes('almuerzo'));
  const hasCena = mealNames.some(n => n.toLowerCase().includes('cena'));

  // Porcentajes y cuotas de reparto de macronutrientes según la estructura exacta de tomas
  let pShares = {};
  let hcShares = {};
  let gShares = {};

  const POST_FIXED_PROTEIN = 20; // 20g fijos de proteína siempre para post-entreno y post-partido
  const postP = hasPost ? Math.min(POST_FIXED_PROTEIN, proteina) : 0;
  const remainingP = hasPost ? Math.max(0, proteina - postP) : proteina;

  if (hasPost) {
    if (hasDesayuno && hasMerienda && hasComida && hasCena) {
      // 5 tomas: Desayuno 10/90, Comida 35/90, Merienda 10/90, Cena 35/90 del remanente proteico
      pShares = { Desayuno: 10 / 90, Comida: 35 / 90, Merienda: 10 / 90, Cena: 35 / 90 };
      hcShares = { Desayuno: 0.20, Comida: 0.35, Merienda: 0.15, Cena: 0.30 };
      gShares = { Desayuno: 0.18, Comida: 0.35, Merienda: 0.12, Cena: 0.35 };
    } else if (hasDesayuno && !hasMerienda && hasComida && hasCena) {
      // 4 tomas: Desayuno 15/90, Comida 40/90, Cena 35/90 del remanente proteico
      pShares = { Desayuno: 15 / 90, Comida: 40 / 90, Cena: 35 / 90 };
      hcShares = { Desayuno: 0.25, Comida: 0.40, Cena: 0.35 };
      gShares = { Desayuno: 0.20, Comida: 0.40, Cena: 0.40 };
    } else if (!hasDesayuno && hasMerienda && hasComida && hasCena) {
      // 4 tomas (ej: día de partido sin desayuno): Comida 40/90, Merienda 10/90, Cena 40/90
      pShares = { Comida: 40 / 90, Merienda: 10 / 90, Cena: 40 / 90 };
      hcShares = { Comida: 0.35, Merienda: 0.35, Cena: 0.30 };
      gShares = { Comida: 0.45, Merienda: 0.10, Cena: 0.45 };
    } else if (!hasDesayuno && !hasMerienda && hasComida && hasCena) {
      // 3 tomas (ej: Crettaz): Comida 50%, Cena 50% del remanente proteico
      pShares = { Comida: 0.50, Cena: 0.50 };
      hcShares = { Comida: 0.50, Cena: 0.50 };
      gShares = { Comida: 0.50, Cena: 0.50 };
    } else {
      // Fallback proporcional para otras combinaciones
      const others = mealNames.filter(n => !n.toLowerCase().includes('post'));
      const share = 1.0 / (others.length || 1);
      others.forEach(n => {
        pShares[n] = share;
        hcShares[n] = share;
        gShares[n] = share;
      });
    }
  } else {
    // Sin Post (ej: días de descanso)
    if (hasDesayuno && hasMerienda && hasComida && hasCena) {
      // 4 tomas sin post: Desayuno 15%, Comida 37.5%, Merienda 10%, Cena 37.5%
      pShares = { Desayuno: 0.15, Comida: 0.375, Merienda: 0.10, Cena: 0.375 };
      hcShares = { Desayuno: 0.22, Comida: 0.36, Merienda: 0.16, Cena: 0.26 };
      gShares = { Desayuno: 0.20, Comida: 0.35, Merienda: 0.15, Cena: 0.30 };
    } else if (hasDesayuno && !hasMerienda && hasComida && hasCena) {
      // 3 tomas sin post: Desayuno 20%, Comida 42%, Cena 38%
      pShares = { Desayuno: 0.20, Comida: 0.42, Cena: 0.38 };
      hcShares = { Desayuno: 0.25, Comida: 0.40, Cena: 0.35 };
      gShares = { Desayuno: 0.22, Comida: 0.40, Cena: 0.38 };
    } else if (!hasDesayuno && !hasMerienda && hasComida && hasCena) {
      // 2 tomas sin post: Comida 50%, Cena 50%
      pShares = { Comida: 0.50, Cena: 0.50 };
      hcShares = { Comida: 0.50, Cena: 0.50 };
      gShares = { Comida: 0.50, Cena: 0.50 };
    } else {
      const share = 1.0 / mealNames.length;
      mealNames.forEach(n => {
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

  // Post-entreno / Post-partido: fijar siempre exactamente 20g de proteína
  if (hasPost && postMealName) {
    const postKcal = postP * 4;
    budgets[postMealName] = { kcal: postKcal, p: postP, hc: 0, g: 0 };
    budgets['Post-entreno'] = budgets[postMealName];
    budgets['Post-partido'] = budgets[postMealName];
    accP += postP;
    accKcal += postKcal;
  }

  // La última toma principal (Cena) absorbe el remanente para que la suma cuadre exactamente al 100%
  const cenaMealName = mealNames.find(n => n.toLowerCase().includes('cena')) || mealNames[mealNames.length - 1];

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

  return ingestas.map(ing => ({
    nombre: ing.nombre,
    target: budgets[ing.nombre] || {
      kcal: Math.round(kcal / ingestas.length),
      p: Math.round(proteina / ingestas.length),
      hc: Math.round(hidratos / ingestas.length),
      g: Math.round(grasa / ingestas.length)
    }
  }));
}

export function filterDishOptionsByRestrictions(dishText, jugador) {
  if (!dishText || typeof dishText !== 'string' || !jugador) {
    return { filteredText: dishText || '', hasConflict: false, allExcluded: false };
  }

  const rawRestr = `${jugador.alergias || ''} ${jugador.intolerancias || ''} ${jugador.aversiones || ''}`.toLowerCase();
  const hasRestrictions = Boolean(
    rawRestr.trim() && !rawRestr.includes('nada') && !rawRestr.includes('ningun')
  );

  const isGlutenRestricted = rawRestr.includes('gluten') || rawRestr.includes('celiac') || rawRestr.includes('sibo') || rawRestr.includes('fodmap');
  const isLactoseRestricted = rawRestr.includes('lactosa') || rawRestr.includes('leche') || rawRestr.includes('sibo') || rawRestr.includes('fodmap');
  const isPorkRestricted = rawRestr.includes('cerdo') || rawRestr.includes('pork');
  const isFishRestricted = rawRestr.includes('pescado') || rawRestr.includes('marisco') || rawRestr.includes('fish');

  const options = dishText.split('/').map(s => s.trim()).filter(Boolean);
  if (options.length === 0) {
    return { filteredText: dishText, hasConflict: false, allExcluded: false };
  }

  const safeOptions = [];
  let excludedAny = false;

  for (const opt of options) {
    const optLow = opt.toLowerCase();
    // 1. Mapear primero la opción al catálogo oficial mediante QUICK_ALIASES y FOODS_CRUDO
    const catalogFood = findFoodInCatalog(opt);
    const resolvedName = catalogFood ? catalogFood.name : null;
    const resolvedLow = resolvedName ? resolvedName.toLowerCase() : '';
    const category = catalogFood?.category || '';

    let isExcluded = false;

    if (hasRestrictions) {
      // Comprobar Gluten (celiaquía / intolerancia al gluten)
      if (isGlutenRestricted) {
        const glutenKeywords = ['pasta', 'trigo', 'pan', 'cuscus', 'cuscús', 'cous', 'cous cous', 'couscous', 'lasaña', 'croqueta', 'empanado', 'ravioli', 'fideua', 'fideuà', 'cebada', 'centeno', 'espelta'];
        if (
          glutenKeywords.some(kw => optLow.includes(kw) || resolvedLow.includes(kw)) ||
          resolvedName === 'Cuscús' ||
          resolvedName === 'Pasta de trigo' ||
          (category === 'cereales_y_tuberculos' && (resolvedLow.includes('trigo') || resolvedLow.includes('pan')))
        ) {
          isExcluded = true;
        }
      }

      // Comprobar Cerdo
      if (!isExcluded && isPorkRestricted) {
        const porkKeywords = ['cerdo', 'secreto', 'secreto ibérico', 'secreto iberico', 'presa', 'lomo', 'jamon', 'jamón', 'bacon', 'chorizo', 'costilla', 'panceta'];
        if (porkKeywords.some(kw => optLow.includes(kw) || resolvedLow.includes(kw))) {
          isExcluded = true;
        }
      }

      // Comprobar Pescado / Marisco
      if (!isExcluded && isFishRestricted) {
        const fishKeywords = ['pescado', 'merluza', 'dorada', 'lubina', 'corvina', 'bacalao', 'salmon', 'salmón', 'atun', 'atún', 'emperador', 'sepia', 'calamar', 'pulpo', 'gamba', 'gambas', 'langostino', 'marisco', 'fideua de pescado', 'pez espada', 'bonito', 'rape'];
        if (category === 'pescados_y_mariscos' || category === 'conservas' || fishKeywords.some(kw => optLow.includes(kw) || resolvedLow.includes(kw))) {
          isExcluded = true;
        }
      }

      // Comprobar Lactosa
      if (!isExcluded && isLactoseRestricted) {
        const lactoseKeywords = ['queso', 'yogur', 'yogures', 'leche', 'nata', 'ricota', 'cottage', 'parmesano'];
        if (
          (category === 'lacteos_y_huevos' && !resolvedLow.includes('sin lactosa') && !resolvedLow.includes('huevo') && !resolvedLow.includes('clara')) ||
          lactoseKeywords.some(kw => optLow.includes(kw) || resolvedLow.includes(kw))
        ) {
          isExcluded = true;
        }
      }
    }

    if (isExcluded) {
      excludedAny = true;
    } else {
      // Si la opción resolvió a un alimento directo del catálogo (ej: "Cous cous" -> "Cuscús", "Pollo pechuga" -> "Pechuga de pollo"),
      // se presenta con el nombre oficial exacto del catálogo para que la IA lo use directamente sin errores léxicos.
      // Si es un plato elaborado compuesto no catalogado individualmente (ej: "Arroz tres delicias"), se mantiene para que la IA lo desglose.
      safeOptions.push(catalogFood ? catalogFood.name : opt);
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
        ? 'Cena de carga pre-partido del comedor: Plato alto en hidratos de carbono (pasta o arroz) con proteína magra limpia (pechuga de pollo, pavo o ternera magra) y fruta fresca de postre. PROHIBIDO Ensure o batidos no pautados.'
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

  const primeroRes = filterDishOptionsByRestrictions(mealData.primero, jugador);
  const segundoRes = filterDishOptionsByRestrictions(mealData.segundo, jugador);
  const postreRes = filterDishOptionsByRestrictions(mealData.postre, jugador);

  const parts = [];
  let hasCriticalConflict = false;

  if (primeroRes.allExcluded) {
    hasCriticalConflict = true;
    parts.push(`Primero: [ATENCIÓN MÉDICA: Opción no tolerada (${mealData.primero}). Sustituir por arroz, patata o verdura apta]`);
  } else if (primeroRes.filteredText) {
    parts.push(`Primero: ${primeroRes.filteredText}`);
  }

  if (segundoRes.allExcluded) {
    hasCriticalConflict = true;
    parts.push(`Segundo: [ATENCIÓN CLÍNICA OBLIGATORIA: El comedor solo ofrece plato prohibido para el jugador ("${mealData.segundo}"). PROHIBIDO SERVIRLO. Sustituir OBLIGATORIAMENTE por proteína limpia del catálogo: pechuga de pollo, pavo, ternera magra o huevos]`);
  } else if (segundoRes.filteredText) {
    parts.push(`Segundo: ${segundoRes.filteredText}`);
  }

  if (postreRes.filteredText) {
    const isLactose = Boolean(
      jugador?.intolerancias?.toLowerCase().includes('lactosa') ||
      jugador?.alergias?.toLowerCase().includes('lactosa') ||
      jugador?.alergias?.toLowerCase().includes('leche')
    );
    if (isLactose) {
      parts.push('Postre: Fruta fresca');
    } else {
      parts.push(`Postre: ${postreRes.filteredText}`);
    }
  }

  if (parts.length === 0) return null;

  return {
    description: parts.join(' | ') + ' (las opciones separadas por "/" son alternativas de libre elección: selecciona una sola opción de hidrato principal y una de proteína, nunca combines opciones alternativas de la misma categoría)',
    hasCriticalConflict,
  };
}

export function buildMealAssemblySpec({ jugador, dayKey, dayData, allDays = {}, menu, preMatchConfig, _recsForDay, mealBudgets }) {
  const isMatchDay = dayData.tipoDia === 'partido';
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  // Detectar si el día siguiente es día de partido (tanto por tipo de día en el plan semanal como por preMatchConfig)
  const curIdx = daysOfWeek.indexOf(dayKey);
  const nextDayKey = curIdx !== -1 ? daysOfWeek[(curIdx + 1) % 7] : null;
  const matchDayKeys = Object.keys(preMatchConfig?.partidos || {}).filter((k) => preMatchConfig?.partidos?.[k]?.horario);

  const isNextDayMatch = Boolean(
    (nextDayKey && allDays?.[nextDayKey]?.tipoDia === 'partido') ||
    (nextDayKey && matchDayKeys.includes(nextDayKey))
  );

  const matchKeyForPrev = isNextDayMatch ? nextDayKey : null;
  const isPrevToMatch = Boolean(matchKeyForPrev);

  const horario = isMatchDay
    ? (preMatchConfig?.partidos?.[dayKey]?.horario || preMatchConfig?.horario || 'tarde')
    : (matchKeyForPrev ? (preMatchConfig?.partidos?.[matchKeyForPrev]?.horario || preMatchConfig?.horario || 'tarde') : 'tarde');

  // Solo se aplica protocolo pre-partido si el jugador tiene configurado ese horario específico de partido
  const playerPreMatch = jugador?.config_prepartido?.[horario] || {};

  return mealBudgets.map((m) => {
    const mealName = m.nombre;
    const normName = mealName.toLowerCase();
    const target = m.target;

    const isMainMeal = normName.includes('comida') || normName.includes('cena');
    const isBreakfast = normName.includes('desayuno');

    let basePropuesta = '';
    let esProtocoloFijo = false;

    // Prioridad 1: Protocolo pre-partido / post-partido / carga previa
    if (normName.includes('post')) {
      if (isMatchDay || normName.includes('partido')) {
        basePropuesta = 'Recovery y fruta';
      } else {
        const isAPLV = Boolean(
          jugador?.intolerancias?.toLowerCase().includes('proteina_vaca') ||
          jugador?.intolerancias?.toLowerCase().includes('aplv') ||
          jugador?.alergias?.toLowerCase().includes('aplv') ||
          jugador?.alergias?.toLowerCase().includes('vaca') ||
          jugador?.intolerancias?.toLowerCase().includes('vegano') ||
          jugador?.intolerancias?.toLowerCase().includes('vegan')
        );
        const isSinLactosa = Boolean(
          jugador?.intolerancias?.toLowerCase().includes('lactosa') ||
          jugador?.alergias?.toLowerCase().includes('lactosa') ||
          jugador?.alergias?.toLowerCase().includes('leche')
        );
        if (isAPLV) {
          basePropuesta = 'Batido de proteína vegetal 30g disuelto en agua.';
        } else if (isSinLactosa) {
          basePropuesta = 'Batido de proteína sin lactosa 30g disuelto en agua.';
        } else {
          basePropuesta = 'Batido de proteína 30g disuelto en agua.';
        }
      }
      esProtocoloFijo = true;
    } else if (isPrevToMatch && normName.includes('cena') && (playerPreMatch.dia_anterior || playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena)) {
      // Cena de carga pre-partido (24h previas): prioridad a dia_anterior sobre recomendaciones.Cena
      const cenaCarga = playerPreMatch.dia_anterior || playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena;
      basePropuesta = `Pauta fija cena de carga pre-partido (24h previas): ${cenaCarga}`;
      if (cenaCarga.toLowerCase().includes('ensure')) {
        basePropuesta += ' (Incluye 1 batido Ensure ~250 kcal y completa los hidratos y proteinas restantes con los alimentos pautados en crudo: patata, pollo y AOVE)';
      }
      esProtocoloFijo = true;
    } else if (isMatchDay && playerPreMatch.recomendaciones?.[mealName]) {
      // Ingestas del propio día de partido (Desayuno, Comida, Merienda pre-partido o Cena post-partido)
      basePropuesta = normName.includes('cena')
        ? `Pauta fija cena post-partido: ${playerPreMatch.recomendaciones[mealName]}`
        : `Pauta fija dia de partido: ${playerPreMatch.recomendaciones[mealName]}`;
      esProtocoloFijo = true;
    } else {
      // Prioridad 2: Menu del comedor de la ciudad deportiva
      const menuComedorInfo = getMenuMealOptions(menu, dayKey, mealName, jugador);
      if (menuComedorInfo) {
        basePropuesta = `Menu comedor ciudad deportiva: ${menuComedorInfo.description}`;
        // El menú de comedor NO es un protocolo fijo: son opciones a elegir y desglosar en ingredientes en crudo
        esProtocoloFijo = false;
      } else if (jugador?.recomendaciones_defecto?.[mealName]) {
        // Prioridad 3: Preferencia habitual del perfil del jugador
        const recDefecto = jugador.recomendaciones_defecto[mealName];
        if (isMainMeal) {
          basePropuesta = `Preferencia habitual del jugador: "${recDefecto}". Mantén esta base de preferencias pero asegura variedad a lo largo de la semana sin repetir la misma combinación en días consecutivos.`;
        } else {
          basePropuesta = `Preferencia habitual del jugador para esta ingesta: "${recDefecto}". Debe ser una opción típica y natural para este momento del día (nunca un plato cocinado de comida o cena), variando las opciones a lo largo de la semana.`;
        }
        esProtocoloFijo = false;
      } else {
        if (isMainMeal) {
          basePropuesta = 'Propuesta libre para comida o cena: Diseñar un plato completo, variado y equilibrado, alternando fuentes de proteína de calidad, hidratos de plato y verduras a lo largo de la semana sin repetir combinaciones.';
        } else if (isBreakfast) {
          basePropuesta = 'Propuesta libre de desayuno: Diseñar una ingesta matutina típica y natural acorde a los objetivos nutricionales, variando opciones a lo largo de la semana y evitando platos principales calientes propios de comida o cena.';
        } else {
          basePropuesta = 'Propuesta libre para esta ingesta: Diseñar una opción ligera, típica y adecuada para este momento del día acorde a los objetivos nutricionales, variando opciones a lo largo de la semana y evitando totalmente platos principales calientes propios de comida o cena.';
        }
        esProtocoloFijo = false;
      }
    }

    const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
    const clinicalRestrictions = [
      clinicalCatalog.activeTags.length > 0 ? `RESTRICCIONES CLÍNICAS FIJAS: ${clinicalCatalog.summary}` : null,
      jugador?.aversiones ? `AVERSIONES (TOTALMENTE PROHIBIDO): ${jugador.aversiones}` : null,
      jugador?.contexto_clinico ? `CONTEXTO / NOTAS: ${jugador.contexto_clinico}` : null,
    ].filter(Boolean).join(' | ');

    const item = {
      nombre: mealName,
      objetivo: {
        kcal: target.kcal,
        proteina_g: target.p,
        hidratos_g: target.hc,
        grasa_g: target.g,
      },
      es_protocolo_fijo: esProtocoloFijo,
    };

    if (basePropuesta) {
      item.base_propuesta = basePropuesta;
    }

    if (clinicalRestrictions) {
      item.restricciones_clinicas = clinicalRestrictions;
    }
    if (jugador?.gustos_preferencias) {
      item.preferencias_jugador = jugador.gustos_preferencias;
    }

    return item;
  });
}

function recommendationsToPrompt(recs) {
  if (!recs || typeof recs !== 'object') return '';
  const entries = Object.entries(recs).filter((entry) => entry[1] && entry[1].trim() !== '');
  if (entries.length === 0) return '';
  return entries.map(([meal, rec]) => `- Para ${meal}: ${rec}`).join('\n');
}

export function buildWeeklyPromptWithoutMenu({ jugador, baseData, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasSpec = {};

  for (const dayKey of daysOfWeek) {
    const dayData = baseData.dias[dayKey];
    const mealBudgets = calculateMealBudgets(dayData);
    const ingestasAGenerar = buildMealAssemblySpec({
      jugador,
      dayKey,
      dayData,
      allDays: baseData.dias,
      menu: null,
      preMatchConfig,
      mealBudgets,
    });

    diasSpec[dayKey] = {
      dia: dayData.label,
      tipo_dia: dayData.tipoDia,
      objetivos_totales: {
        kcal: dayData.kcal,
        proteina_g: dayData.proteina,
        hidratos_g: dayData.hidratos,
        grasa_g: dayData.grasa,
      },
      ingestas_a_generar: ingestasAGenerar,
    };
  }

  const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
  const recsGenerales = recomendacionesIngestas ? recommendationsToPrompt(recomendacionesIngestas) : '';

  const payload = {
    rol: 'Carlos Ferrando, nutricionista del Valencia CF',
    tarea: 'Diseñar la propuesta gastronómica de TODA LA SEMANA (Lunes a Domingo) seleccionando los ingredientes del catálogo oficial para cada ingesta, garantizando alta variedad gastronómica y respetando estrictamente protocolos fijos, restricciones clínicas y preferencias del jugador (la calculadora matemática de Nutralab se encargará de calcular y asignar los gramos exactos para cumplir las macros).',
    jugador: {
      nombre: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      posicion: jugador.posicion || 'No especificada',
      peso_kg: jugador.peso_kg,
      objetivo: getObjectiveLabel(jugador.objetivo) || jugador.objetivo,
      perfil_clinico: clinicalCatalog.summary,
      ...(jugador.contexto_clinico ? { notas_medicas: jugador.contexto_clinico } : {}),
      ...(jugador.aversiones ? { aversiones: jugador.aversiones } : {}),
      ...(jugador.gustos_preferencias ? { preferencias: jugador.gustos_preferencias } : {}),
    },
    contexto_adicional: contextoAdicional || 'Ajustar a las tolerancias y gustos del jugador',
    ...(recsGenerales ? { pautas_especificas_nutricionista: recsGenerales } : {}),
    plan_semanal_por_dias: diasSpec,
    catalogo_alimentos_oficiales_disponibles: clinicalCatalog.normalizedNamesList,
    reglas_calidad_nutricional_y_variedad: AI_NUTRITION_RULES,
  };

  const payloadJson = JSON.stringify(payload, null, 2);
  return buildWeeklyPromptEnvelope(payloadJson);
}

export function buildWeeklyPromptWithMenu({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasSpec = {};

  for (const dayKey of daysOfWeek) {
    const dayData = baseData.dias[dayKey];
    const mealBudgets = calculateMealBudgets(dayData);
    const ingestasAGenerar = buildMealAssemblySpec({
      jugador,
      dayKey,
      dayData,
      allDays: baseData.dias,
      menu,
      preMatchConfig,
      mealBudgets,
    });

    diasSpec[dayKey] = {
      dia: dayData.label,
      tipo_dia: dayData.tipoDia,
      objetivos_totales: {
        kcal: dayData.kcal,
        proteina_g: dayData.proteina,
        hidratos_g: dayData.hidratos,
        grasa_g: dayData.grasa,
      },
      ingestas_a_generar: ingestasAGenerar,
    };
  }

  const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
  const recsGenerales = recomendacionesIngestas ? recommendationsToPrompt(recomendacionesIngestas) : '';

  const payload = {
    rol: 'Carlos Ferrando, nutricionista del Valencia CF adaptando el MENÚ DE COMEDOR de la ciudad deportiva',
    tarea: 'Diseñar el menú gastronómico de TODA LA SEMANA (Lunes a Domingo) adaptando el menú buffet de la ciudad deportiva. Debes descartar opciones incompatibles con la salud clínica del jugador, seleccionar exactamente una proteína limpia y una sola base de hidratos (sin duplicar bases pesadas compitiendo), y DESGLOSAR obligatoriamente cualquier plato elaborado en sus ingredientes individuales en crudo del catálogo oficial para que los gramos se ajusten con precisión matemática a los objetivos de cada toma.',
    jugador: {
      nombre: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      posicion: jugador.posicion || 'No especificada',
      peso_kg: jugador.peso_kg,
      objetivo: getObjectiveLabel(jugador.objetivo) || jugador.objetivo,
      perfil_clinico: clinicalCatalog.summary,
      ...(jugador.contexto_clinico ? { notas_medicas: jugador.contexto_clinico } : {}),
      ...(jugador.aversiones ? { aversiones: jugador.aversiones } : {}),
      ...(jugador.gustos_preferencias ? { preferencias: jugador.gustos_preferencias } : {}),
    },
    contexto_adicional: contextoAdicional || 'Ajustar a las tolerancias y gustos del jugador',
    ...(recsGenerales ? { pautas_especificas_nutricionista: recsGenerales } : {}),
    plan_semanal_por_dias: diasSpec,
    catalogo_alimentos_oficiales_disponibles: clinicalCatalog.normalizedNamesList,
    reglas_calidad_nutricional_y_variedad: AI_MENU_NUTRITION_RULES,
  };

  const payloadJson = JSON.stringify(payload, null, 2);
  return buildWeeklyMenuPromptEnvelope(payloadJson);
}

export function buildWeeklyPrompt({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const hasDiningMenu = Boolean(
    menu &&
    Array.isArray(menu.dias) &&
    menu.dias.some((d) => d.comida?.primero || d.comida?.segundo || d.cena?.primero || d.cena?.segundo)
  );

  return hasDiningMenu
    ? buildWeeklyPromptWithMenu({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas })
    : buildWeeklyPromptWithoutMenu({ jugador, baseData, preMatchConfig, contextoAdicional, recomendacionesIngestas });
}

export function sanitizeMealDetail(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text
    .replace(/(?:[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+)\s+0\s*g(?:,\s*|\s+y\s+|\s+con\s+)?/gi, '')
    .replace(/(?:[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+)\s+sustituido\s+por\s+/gi, '')
    .replace(/aislado(?:\s+de)?\s+prote[ií]na[a-záéíóúñ\s\d]*(?:scoop)?(?:[a-záéíóúñ\s\d]*)/gi, (match) => {
      const lower = match.toLowerCase();
      if (lower.includes('vegetal') || lower.includes('soja') || lower.includes('guisante')) {
        return 'Batido de proteína vegetal 30g disuelto en agua';
      }
      return lower.includes('sin lactosa')
        ? 'Batido de proteína sin lactosa 30g disuelto en agua'
        : 'Batido de proteína 30g disuelto en agua';
    })
    .replace(/(?:,\s*|\s+y\s+)?(?:canela|pimienta|orégano|oregano|perejil|sal|especias)\s+al\s+gusto/gi, '')
    .replace(/^canela\s+al\s+gusto(?:,\s*)?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,.\s]+/, '')
    .replace(/[,.\s]+$/, '')
    .trim();

  // Si hay un título o nombre de plato seguido de dos puntos antes de los alimentos
  // ej: "Puré de patata y maíz: Patata 215g, Maíz dulce 50g..." -> "Patata 215g, Maíz dulce 50g..."
  if (cleaned.includes(':')) {
    const colonIndex = cleaned.indexOf(':');
    const afterColon = cleaned.slice(colonIndex + 1).trim();
    if (/\d+\s*(?:g|gr|ml|unidad|unidades)/i.test(afterColon)) {
      cleaned = afterColon;
    }
  }

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

export async function generateFullWeeklyPlan({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const prompt = buildWeeklyPrompt({
    jugador,
    baseData,
    menu,
    preMatchConfig,
    contextoAdicional,
    recomendacionesIngestas,
  });

  const res = await client.messages.create({
    model: env.AI_MODEL,
    max_tokens: maxTokens(),
    thinking: { type: 'adaptive' },
    output_config: { effort: env.AI_PLAN_THINKING_EFFORT || 'low' },
    messages: [{ role: 'user', content: prompt }],
  });

  const text = res.content.find((c) => c.type === 'text')?.text || '';
  let json;
  try {
    json = extractJson(text);
  } catch (e) {
    throw new Error(`Respuesta inválida de la IA en plan semanal: ${e.message}`);
  }

  if (!json.dias || typeof json.dias !== 'object') {
    throw new Error('La IA no devolvió los días de la semana válidos');
  }

  const sanitizedDias = {};
  for (const [dayKey, dayObj] of Object.entries(json.dias)) {
    sanitizedDias[dayKey] = {
      ...dayObj,
      ingestas: (dayObj.ingestas || []).map((ing) => ({
        ...ing,
        detalle: sanitizeMealDetail(ing.detalle),
      })),
    };
  }

  return {
    dias: sanitizedDias,
    notas: Array.isArray(json.notas) && json.notas.length > 0 ? json.notas : null,
  };
}

export async function generarDatosPlan({ jugador, nombre, contexto, contextoAdicional, calendario, menu, teamConfig, recomendacionesIngestas, preMatchConfig }) {
  const supabase = getSupabaseAdmin();
  const resolvedMenu = menu !== undefined ? menu : await latestMenu(supabase, jugador?.equipo_id);
  const baseData = buildBasePlanData({ jugador, nombre, contexto: contexto || 'semana_normal', contextoAdicional, menu: resolvedMenu, calendario, preMatchConfig, teamConfig });

  let weeklyResult = null;
  try {
    weeklyResult = await generateFullWeeklyPlan({
      jugador,
      baseData,
      menu: resolvedMenu,
      preMatchConfig,
      contextoAdicional,
      recomendacionesIngestas,
    });
  } catch (err) {
    console.warn(`Reintentando generación semanal: ${err.message}`);
    try {
      weeklyResult = await generateFullWeeklyPlan({
        jugador,
        baseData,
        menu: resolvedMenu,
        preMatchConfig,
        contextoAdicional,
        recomendacionesIngestas,
      });
    } catch (retryErr) {
      console.error('Error final en generación semanal:', retryErr.message);
    }
  }

  const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
  const activeTagsSet = new Set(clinicalCatalog.activeTags);
  const hasFodmapDigestiveRestriction = activeTagsSet.has('sibo_low_fodmap') ||
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
  const calOptions = { isLactoseIntolerant, isGlutenIntolerant, isFishIntolerant, isPorkIntolerant, hasCowProteinAllergy, hasFructoseIntolerance, hasIbs, isVegan, clinicalCatalog };

  const finalDias = { ...baseData.dias };
  if (weeklyResult?.dias) {
    const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    for (const dayKey of daysOfWeek) {
      const aiDay = weeklyResult.dias[dayKey];
      if (aiDay?.ingestas && Array.isArray(aiDay.ingestas) && aiDay.ingestas.length > 0) {
        let budgetMap = new Map();
        try {
          const budgets = calculateMealBudgets(baseData.dias[dayKey]);
          budgetMap = new Map(budgets.map(b => [b.nombre.toLowerCase().trim(), b.target]));
        } catch (bErr) {
          console.warn(`No se pudieron calcular presupuestos para calibrar ${dayKey}:`, bErr.message);
        }

        const isMatchDay = baseData.dias[dayKey]?.tipoDia === 'partido';
        const calOptionsForDay = { ...calOptions, isMatchDay };

        const calibratedIngestas = await Promise.all(
          aiDay.ingestas.map(async (ing) => {
            const sanitized = sanitizeMealDetail(ing.detalle);
            const target = budgetMap.get(ing.nombre.toLowerCase().trim());
            const calibrated = target
              ? await calibrateMeal(sanitized, target, { ...calOptionsForDay, mealName: ing.nombre })
              : sanitized;
            return {
              ...ing,
              detalle: calibrated,
            };
          })
        );

        finalDias[dayKey] = {
          ...baseData.dias[dayKey],
          ingestas: calibratedIngestas,
        };
      }
    }
  }

  const finalNotas = Array.isArray(weeklyResult?.notas) && weeklyResult.notas.length > 0
    ? weeklyResult.notas
    : [
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
    },
  };
}
