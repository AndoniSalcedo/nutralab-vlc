import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { buildBasePlanData } from '@/lib/nutrition-plan-card';
import { env } from '@/config/env';
import { getObjectiveLabel } from '@/lib/calculations';
import { getLatestMenu } from '@/repositories/menuRepository';
import { calibrateMeal, FOOD_NAMES_LIST } from '@/lib/nutrition-calculator';

const client = new Anthropic({ apiKey: env.AI_API_KEY });

function maxTokens() {
  const parsed = env.AI_PLAN_MAX_TOKENS;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 32000;
}

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

export const TABLA_COMPOSICION_ALIMENTOS = {
  cereales_y_derivados_en_crudo: {
    arroz_blanco: { hc_g: 78, p_g: 8, g_g: 1, kcal: 355 },
    arroz_integral: { hc_g: 74, p_g: 8, g_g: 2.5, kcal: 350 },
    arroz_basmati: { hc_g: 77, p_g: 8.5, g_g: 0.9, kcal: 350 },
    arroz_jazmin: { hc_g: 77, p_g: 8.5, g_g: 0.9, kcal: 350 },
    pasta_trigo: { hc_g: 75, p_g: 12, g_g: 1.5, kcal: 360 },
    pasta_sin_gluten: { hc_g: 78, p_g: 7, g_g: 1, kcal: 350 },
    fideos_de_arroz: { hc_g: 80, p_g: 7, g_g: 0.5, kcal: 355 },
    cuscus: { hc_g: 73, p_g: 13, g_g: 1.5, kcal: 360 },
    gnocchi_patata: { hc_g: 32, p_g: 3.5, g_g: 0.5, kcal: 150 },
    copos_avena: { hc_g: 60, p_g: 13, g_g: 7, kcal: 370 },
    quinoa: { hc_g: 64, p_g: 14, g_g: 6, kcal: 368 },
    trigo_sarraceno: { hc_g: 71, p_g: 13, g_g: 3.4, kcal: 343 },
    pan_blanco: { hc_g: 52, p_g: 8, g_g: 1.5, kcal: 260 },
    pan_integral: { hc_g: 45, p_g: 9, g_g: 2, kcal: 245 },
    tortas_arroz: { hc_g: 80, p_g: 8, g_g: 2.5, kcal: 380 },
    tortas_maiz: { hc_g: 78, p_g: 8, g_g: 3, kcal: 370 },
    tortillas_trigo_o_maiz: { hc_g: 50, p_g: 8, g_g: 6, kcal: 290 }
  },
  tuberculos: {
    patata: { hc_g: 18, p_g: 2, g_g: 0.1, kcal: 80 },
    boniato: { hc_g: 21, p_g: 1.6, g_g: 0.1, kcal: 90 },
    yuca: { hc_g: 38, p_g: 1.4, g_g: 0.3, kcal: 160 },
    calabaza: { hc_g: 7, p_g: 1, g_g: 0.1, kcal: 30 }
  },
  legumbres_y_derivados: {
    lentejas: { hc_g: 54, p_g: 25, g_g: 1.5, kcal: 330 },
    garbanzos: { hc_g: 55, p_g: 20, g_g: 6, kcal: 355 },
    alubias: { hc_g: 54, p_g: 22, g_g: 1.5, kcal: 320 },
    edamame: { hc_g: 10, p_g: 12, g_g: 5, kcal: 130 },
    hummus: { hc_g: 14, p_g: 8, g_g: 10, kcal: 170 }
  },
  frutas_y_miel: {
    platano: { hc_g: 21, p_g: 1.2, g_g: 0.2, kcal: 90 },
    manzana: { hc_g: 13, p_g: 0.3, g_g: 0.2, kcal: 54 },
    pera: { hc_g: 14, p_g: 0.4, g_g: 0.1, kcal: 57 },
    naranja: { hc_g: 10, p_g: 0.9, g_g: 0.1, kcal: 45 },
    kiwi: { hc_g: 12, p_g: 1.1, g_g: 0.5, kcal: 60 },
    fresas: { hc_g: 7, p_g: 0.7, g_g: 0.3, kcal: 35 },
    arandanos: { hc_g: 14, p_g: 0.7, g_g: 0.3, kcal: 60 },
    pina: { hc_g: 12, p_g: 0.5, g_g: 0.1, kcal: 50 },
    mango: { hc_g: 15, p_g: 0.8, g_g: 0.4, kcal: 65 },
    melocoton: { hc_g: 10, p_g: 0.9, g_g: 0.2, kcal: 45 },
    nectarina: { hc_g: 11, p_g: 1.0, g_g: 0.3, kcal: 50 },
    sandia: { hc_g: 7.5, p_g: 0.6, g_g: 0.1, kcal: 30 },
    melon: { hc_g: 8, p_g: 0.8, g_g: 0.2, kcal: 35 },
    uvas: { hc_g: 17, p_g: 0.7, g_g: 0.2, kcal: 70 },
    datil: { hc_g: 70, p_g: 2, g_g: 0.2, kcal: 290 },
    miel: { hc_g: 82, p_g: 0.3, g_g: 0, kcal: 330 }
  },
  carnes_y_aves_en_crudo: {
    pechuga_pollo: { hc_g: 0, p_g: 23, g_g: 2, kcal: 110 },
    pechuga_pavo: { hc_g: 0, p_g: 24, g_g: 1.5, kcal: 110 },
    solomillo_pavo: { hc_g: 0, p_g: 23, g_g: 2, kcal: 110 },
    contramuslo_pollo_deshuesado: { hc_g: 0, p_g: 20, g_g: 7, kcal: 145 },
    solomillo_ternera_magra: { hc_g: 0, p_g: 22, g_g: 4, kcal: 125 },
    lomo_ternera_magra: { hc_g: 0, p_g: 22, g_g: 5, kcal: 130 },
    carne_picada_vacuno_magra: { hc_g: 0, p_g: 21, g_g: 5, kcal: 130 },
    carne_picada_pavo: { hc_g: 0, p_g: 22, g_g: 3, kcal: 115 },
    carne_picada_pollo: { hc_g: 0, p_g: 22, g_g: 3, kcal: 115 },
    hamburguesa_ternera_magra: { hc_g: 0, p_g: 21, g_g: 6, kcal: 140 },
    conejo: { hc_g: 0, p_g: 22, g_g: 4, kcal: 125 },
    solomillo_cerdo_magro: { hc_g: 0, p_g: 22, g_g: 4, kcal: 125 },
    lomo_cerdo_magro: { hc_g: 0, p_g: 22, g_g: 5, kcal: 135 }
  },
  pescados_y_mariscos_en_crudo: {
    merluza: { hc_g: 0, p_g: 17, g_g: 1, kcal: 78 },
    bacalao: { hc_g: 0, p_g: 18, g_g: 0.8, kcal: 80 },
    lubina: { hc_g: 0, p_g: 19, g_g: 2.5, kcal: 98 },
    dorada: { hc_g: 0, p_g: 19, g_g: 2.5, kcal: 98 },
    lenguado: { hc_g: 0, p_g: 17, g_g: 1.2, kcal: 80 },
    sepia: { hc_g: 0.5, p_g: 16, g_g: 1, kcal: 75 },
    calamar: { hc_g: 1, p_g: 16, g_g: 1.4, kcal: 80 },
    pulpo_cocido: { hc_g: 1.5, p_g: 18, g_g: 1, kcal: 87 },
    gambas: { hc_g: 0, p_g: 21, g_g: 1, kcal: 93 },
    langostinos: { hc_g: 0, p_g: 21, g_g: 1, kcal: 93 },
    mejillones: { hc_g: 3, p_g: 12, g_g: 2, kcal: 80 },
    salmon_fresco: { hc_g: 0, p_g: 20, g_g: 12, kcal: 190 },
    atun_fresco: { hc_g: 0, p_g: 23, g_g: 5, kcal: 140 },
    pez_espada: { hc_g: 0, p_g: 20, g_g: 4, kcal: 120 },
    bonito_del_norte: { hc_g: 0, p_g: 24, g_g: 6, kcal: 150 },
    atun_lata_al_natural: { hc_g: 0, p_g: 24, g_g: 0.8, kcal: 105 }
  },
  huevos_y_lacteos: {
    huevo_entero_unidad_50g: { hc_g: 0.3, p_g: 6.5, g_g: 5, kcal: 75 },
    claras_huevo_100g: { hc_g: 0.7, p_g: 11, g_g: 0.1, kcal: 48 },
    queso_fresco_batido_0: { hc_g: 4, p_g: 9, g_g: 0.1, kcal: 52 },
    queso_cottage: { hc_g: 3, p_g: 12, g_g: 4, kcal: 95 },
    mozzarella_light: { hc_g: 1, p_g: 20, g_g: 10, kcal: 175 },
    yogur_griego_natural: { hc_g: 4, p_g: 9, g_g: 5, kcal: 97 },
    yogur_proteico_0: { hc_g: 4, p_g: 10, g_g: 0.1, kcal: 57 },
    yogur_natural_sin_lactosa: { hc_g: 4.5, p_g: 4, g_g: 3, kcal: 60 },
    yogur_proteico_sin_lactosa: { hc_g: 4, p_g: 10, g_g: 0.1, kcal: 57 },
    kefir_desnatado: { hc_g: 4, p_g: 3.5, g_g: 0.5, kcal: 35 },
    requeson_desnatado: { hc_g: 3.5, p_g: 12, g_g: 0.5, kcal: 68 },
    leche_desnatada_100ml: { hc_g: 5, p_g: 3.4, g_g: 0.2, kcal: 35 },
    leche_sin_lactosa_desnatada_100ml: { hc_g: 5, p_g: 3.4, g_g: 0.2, kcal: 35 },
    bebida_avena_soja_100ml: { hc_g: 6, p_g: 1.5, g_g: 1, kcal: 40 }
  },
  grasas_y_frutos_secos: {
    aceite_oliva_virgen_extra_aove: { hc_g: 0, p_g: 0, g_g: 100, kcal: 900 },
    aguacate: { hc_g: 2, p_g: 2, g_g: 15, kcal: 160 },
    nueces: { hc_g: 12, p_g: 15, g_g: 65, kcal: 650 },
    almendras: { hc_g: 10, p_g: 21, g_g: 52, kcal: 600 },
    avellanas: { hc_g: 11, p_g: 15, g_g: 60, kcal: 640 },
    anacardos: { hc_g: 25, p_g: 18, g_g: 44, kcal: 560 },
    pistachos: { hc_g: 18, p_g: 20, g_g: 45, kcal: 560 },
    crema_cacahuete_100: { hc_g: 15, p_g: 28, g_g: 50, kcal: 620 },
    crema_almendras_100: { hc_g: 10, p_g: 22, g_g: 55, kcal: 630 },
    semillas_chia: { hc_g: 8, p_g: 17, g_g: 31, kcal: 400 },
    semillas_lino: { hc_g: 2, p_g: 18, g_g: 42, kcal: 530 },
    pipas_calabaza: { hc_g: 11, p_g: 30, g_g: 49, kcal: 560 },
    pipas_girasol: { hc_g: 12, p_g: 21, g_g: 51, kcal: 580 },
    tahini_pasta_sesamo: { hc_g: 12, p_g: 18, g_g: 54, kcal: 600 }
  },
  suplementacion_deportiva: {
    batido_proteina_suero_30g: { hc_g: 1, p_g: 26, g_g: 0.5, kcal: 115 },
    batido_proteina_sin_lactosa_30g: { hc_g: 1, p_g: 26, g_g: 0.5, kcal: 115 },
    recuperador_carbohidratos_proteina_shake: { hc_g: 45, p_g: 25, g_g: 1.5, kcal: 295 },
    ciclodextrina_maltodextrina_30g: { hc_g: 29, p_g: 0, g_g: 0, kcal: 116 },
    bebida_isotonica_sales_500ml: { hc_g: 30, p_g: 0, g_g: 0, kcal: 120 },
    gel_energetico_deportivo_unidad: { hc_g: 30, p_g: 0, g_g: 0, kcal: 120 },
    barrita_energetica_avena_fruta: { hc_g: 35, p_g: 5, g_g: 4, kcal: 195 },
    barrita_proteica_baja_grasa: { hc_g: 15, p_g: 20, g_g: 5, kcal: 185 },
    caseina_micelar_nocturna_30g: { hc_g: 1.5, p_g: 25, g_g: 0.5, kcal: 110 },
    ensure_nutricion_entera_unidad: { hc_g: 32, p_g: 9, g_g: 8, kcal: 250 },
    colageno_hidrolizado_vitamina_c_15g: { hc_g: 0, p_g: 14, g_g: 0, kcal: 56 }
  }
};

export function calculateMealBudgets(day) {
  const { kcal, proteina, hidratos, grasa, ingestas } = day;
  if (!ingestas || ingestas.length === 0) return [];

  const mealNames = ingestas.map(i => i.nombre);
  const hasPost = mealNames.some(n => n.toLowerCase().includes('post'));
  const hasMerienda = mealNames.some(n => n.toLowerCase().includes('merienda'));

  if (!kcal || !proteina || !hidratos || !grasa) {
    throw new Error(`Datos nutricionales incompletos para el dia: kcal=${kcal}, proteina=${proteina}, hidratos=${hidratos}, grasa=${grasa}`);
  }

  let remKcal = kcal;
  let remP = proteina;
  let remHC = hidratos;
  let remG = grasa;

  const budgets = {};

  // 1. Post-entreno (batido de proteína aislado en agua)
  if (hasPost) {
    const postP = Math.min(30, Math.round(remP * 0.20));
    const postKcal = Math.round(postP * 4);
    budgets['Post-entreno'] = { kcal: postKcal, p: postP, hc: 0, g: 0 };
    remKcal -= postKcal;
    remP -= postP;
  }

  // 2. Merienda (si está configurada)
  if (hasMerienda) {
    const meriendaHC = Math.round(remHC * 0.20);
    const meriendaP = Math.round(remP * 0.15);
    const meriendaG = Math.round(remG * 0.12);
    const meriendaKcal = Math.round(meriendaP * 4 + meriendaHC * 4 + meriendaG * 9);
    budgets['Merienda'] = { kcal: meriendaKcal, p: meriendaP, hc: meriendaHC, g: meriendaG };
    remKcal -= meriendaKcal;
    remP -= meriendaP;
    remHC -= meriendaHC;
    remG -= meriendaG;
  }

  // 3. Reparto de comidas principales
  const mainMeals = mealNames.filter(n => !n.toLowerCase().includes('post') && !n.toLowerCase().includes('merienda'));
  const nMain = mainMeals.length;

  if (nMain === 1) {
    budgets[mainMeals[0]] = { kcal: remKcal, p: remP, hc: remHC, g: remG };
  } else if (nMain === 2) {
    // Comida & Cena (52% / 48%)
    const m1Kcal = Math.round(remKcal * 0.52);
    const m2Kcal = remKcal - m1Kcal;
    const m1P = Math.round(remP * 0.52);
    const m2P = remP - m1P;
    const m1HC = Math.round(remHC * 0.52);
    const m2HC = remHC - m1HC;
    const m1G = Math.round(remG * 0.50);
    const m2G = remG - m1G;

    budgets[mainMeals[0]] = { kcal: m1Kcal, p: m1P, hc: m1HC, g: m1G };
    budgets[mainMeals[1]] = { kcal: m2Kcal, p: m2P, hc: m2HC, g: m2G };
  } else if (nMain === 3) {
    // Desayuno (28%), Comida (42%), Cena (30%)
    const desKcal = Math.round(remKcal * 0.28);
    const comKcal = Math.round(remKcal * 0.42);
    const cenKcal = remKcal - desKcal - comKcal;

    const desP = Math.round(remP * 0.28);
    const comP = Math.round(remP * 0.42);
    const cenP = remP - desP - comP;

    const desHC = Math.round(remHC * 0.30);
    const comHC = Math.round(remHC * 0.42);
    const cenHC = remHC - desHC - comHC;

    const desG = Math.round(remG * 0.28);
    const comG = Math.round(remG * 0.42);
    const cenG = remG - desG - comG;

    budgets[mainMeals[0]] = { kcal: desKcal, p: desP, hc: desHC, g: desG };
    budgets[mainMeals[1]] = { kcal: comKcal, p: comP, hc: comHC, g: comG };
    budgets[mainMeals[2]] = { kcal: cenKcal, p: cenP, hc: cenHC, g: cenG };
  } else {
    mainMeals.forEach(name => {
      const share = 1 / nMain;
      budgets[name] = {
        kcal: Math.round(remKcal * share),
        p: Math.round(remP * share),
        hc: Math.round(remHC * share),
        g: Math.round(remG * share)
      };
    });
  }

  return ingestas.map(ing => ({
    nombre: ing.nombre,
    target: budgets[ing.nombre] || {
      kcal: Math.round(remKcal / ingestas.length),
      p: Math.round(remP / ingestas.length),
      hc: Math.round(remHC / ingestas.length),
      g: Math.round(remG / ingestas.length)
    }
  }));
}

export function getMenuMealOptions(menu, dayKey, mealName) {
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

  const parts = [];
  if (mealData.primero && String(mealData.primero).trim()) parts.push(`Primero: ${mealData.primero.trim()}`);
  if (mealData.segundo && String(mealData.segundo).trim()) parts.push(`Segundo: ${mealData.segundo.trim()}`);
  if (mealData.postre && String(mealData.postre).trim()) parts.push(`Postre: ${mealData.postre.trim()}`);

  return parts.length > 0 ? parts.join(' | ') : null;
}

export function buildMealAssemblySpec({ jugador, dayKey, dayData, menu, preMatchConfig, _recsForDay, mealBudgets }) {
  const isMatchDay = dayData.tipoDia === 'partido';
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const matchDayKeys = Object.keys(preMatchConfig?.partidos || {}).filter((k) => preMatchConfig?.partidos?.[k]?.horario);

  const matchKeyForPrev = matchDayKeys.find((mKey) => {
    const mIdx = daysOfWeek.indexOf(mKey);
    const prevIdx = (mIdx - 1 + 7) % 7;
    return daysOfWeek[prevIdx] === dayKey;
  });
  const isPrevToMatch = Boolean(matchKeyForPrev);

  const horario = isMatchDay
    ? (preMatchConfig?.partidos?.[dayKey]?.horario || preMatchConfig?.horario || 'tarde')
    : (matchKeyForPrev ? (preMatchConfig?.partidos?.[matchKeyForPrev]?.horario || 'tarde') : 'tarde');

  const playerPreMatch = jugador?.config_prepartido?.[horario] || {};

  return mealBudgets.map((m) => {
    const mealName = m.nombre;
    const normName = mealName.toLowerCase();
    const target = m.target;

    let basePropuesta = '';
    let esProtocoloFijo = false;

    // Prioridad 1: Protocolo pre-partido / post-partido / carga previa
    if (normName.includes('post')) {
      const isSinLactosa = Boolean(
        jugador?.intolerancias?.toLowerCase().includes('lactosa') ||
        jugador?.alergias?.toLowerCase().includes('lactosa') ||
        jugador?.alergias?.toLowerCase().includes('leche')
      );
      basePropuesta = isSinLactosa
        ? 'Batido de proteína sin lactosa 30g disuelto en agua.'
        : 'Batido de proteína 30g disuelto en agua.';
      esProtocoloFijo = true;
    } else if (isMatchDay && playerPreMatch.recomendaciones?.[mealName]) {
      basePropuesta = `Pauta fija dia de partido: ${playerPreMatch.recomendaciones[mealName]}`;
      esProtocoloFijo = true;
    } else if (isPrevToMatch && normName.includes('cena') && (playerPreMatch.dia_anterior || playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena)) {
      const cenaCarga = playerPreMatch.dia_anterior || playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena;
      basePropuesta = `Pauta fija cena de carga pre-partido (24h previas): ${cenaCarga}`;
      if (cenaCarga.toLowerCase().includes('ensure')) {
        basePropuesta += ' (Incluye 1 batido Ensure ~250 kcal y completa los hidratos y proteinas restantes con los alimentos pautados en crudo: patata, pollo y AOVE)';
      }
      esProtocoloFijo = true;
    } else {
      // Prioridad 2: Menu del comedor de la ciudad deportiva
      const menuComedor = getMenuMealOptions(menu, dayKey, mealName);
      if (menuComedor) {
        basePropuesta = `Menu comedor ciudad deportiva: ${menuComedor}`;
        esProtocoloFijo = true;
      } else if (jugador?.recomendaciones_defecto?.[mealName]) {
        // Prioridad 3: Preferencia habitual del perfil del jugador
        const recDefecto = jugador.recomendaciones_defecto[mealName];
        basePropuesta = `Preferencia habitual del jugador: "${recDefecto}". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.`;
        esProtocoloFijo = false;
      } else {
        basePropuesta = 'Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).';
        esProtocoloFijo = false;
      }
    }

    const clinicalRestrictions = [
      jugador?.alergias ? `ALERGIAS (TOTALMENTE PROHIBIDO): ${jugador.alergias}` : null,
      jugador?.intolerancias ? `INTOLERANCIAS (TOTALMENTE PROHIBIDO): ${jugador.intolerancias}` : null,
      jugador?.aversiones ? `AVERSIONES (TOTALMENTE PROHIBIDO): ${jugador.aversiones}` : null,
      jugador?.contexto_clinico ? `CONTEXTO CLÍNICO: ${jugador.contexto_clinico}` : null,
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

export function buildDayPrompt({ jugador, dayKey, dayData, menu, preMatchConfig, contextoAdicional, recsForDay }) {
  const mealBudgets = calculateMealBudgets(dayData);
  const ingestasAGenerar = buildMealAssemblySpec({
    jugador,
    dayKey,
    dayData,
    menu,
    preMatchConfig,
    _recsForDay: recsForDay,
    mealBudgets,
  });

  const payload = {
    rol: 'Carlos Ferrando, nutricionista del Valencia CF',
    tarea: `Disenar el detalle gastronomico de cada ingesta para el ${dayData.label} (${dayData.tipoDia}) calculando los gramos exactos en crudo para cumplir las macros fijadas.`,
    formato_salida_requerido: {
      ingestas: [
        {
          nombre: 'Nombre de la ingesta',
          detalle: 'Alimentos y gramos exactos en crudo de forma concisa.',
        },
      ],
    },
    jugador: {
      nombre: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      posicion: jugador.posicion || 'No especificada',
      peso_kg: jugador.peso_kg,
      objetivo: getObjectiveLabel(jugador.objetivo) || jugador.objetivo,
      ...(jugador.contexto_clinico ? { contexto_clinico: jugador.contexto_clinico } : {}),
      ...([jugador.alergias ? `Alergias: ${jugador.alergias}` : null, jugador.intolerancias ? `Intolerancias: ${jugador.intolerancias}` : null, jugador.aversiones ? `Aversiones: ${jugador.aversiones}` : null].filter(Boolean).length > 0
        ? { alergias_intolerancias: [jugador.alergias ? `Alergias: ${jugador.alergias}` : null, jugador.intolerancias ? `Intolerancias: ${jugador.intolerancias}` : null, jugador.aversiones ? `Aversiones: ${jugador.aversiones}` : null].filter(Boolean).join(' | ') }
        : {}),
      ...(jugador.gustos_preferencias ? { preferencias: jugador.gustos_preferencias } : {}),
    },
    dia: {
      nombre: dayData.label,
      tipo: dayData.tipoDia,
      objetivos_totales: {
        kcal: dayData.kcal,
        proteina_g: dayData.proteina,
        hidratos_g: dayData.hidratos,
        grasa_g: dayData.grasa,
      },
    },
    contexto_adicional: contextoAdicional || 'Ajustar a las tolerancias y gustos del jugador',
    ingestas_a_generar: ingestasAGenerar,
    tabla_composicion_alimentos_100g: TABLA_COMPOSICION_ALIMENTOS,
    reglas_calidad_nutricional: [
      'CUADRE MATEMATICO EXACTO: Utiliza los valores nutricionales de la tabla de composicion por 100g para calcular con precision las cantidades de cada alimento de modo que la suma de macronutrientes coincida con el "objetivo" de la ingesta (tolerancia maxima ±5%).',
      'TABLA DE REFERENCIA Y VARIEDAD: La tabla de composicion por 100g adjunta es una referencia de calculo para los alimentos mas frecuentes. Tienes total libertad para incluir cualquier otro alimento saludable, del menu de comedor o acorde a los gustos del jugador (ej: dorada, lubina, bacalao, pavo, lomo, cuscus, legumbres, esparragos, frutos rojos, etc.) aplicando con precision sus valores nutricionales estandar de la nutricion deportiva en crudo.',
      'CALCULO DE PROTEINA OBLIGATORIO Y COMPLEMENTOS: En tu proceso de razonamiento interno, calcula primero los gramos de proteina pura que aporta el alimento principal (ej: 100g de pollo = 23g P, 100g de merluza = 18g P). Si la carne/pescado no alcanza por si sola el objetivo de proteina_g de la ingesta, aumenta los gramos de carne/pescado (en futbol de elite raciones de 250g-320g son normales) o anade OBLIGATORIAMENTE un complemento proteico (yogur proteico/griego/sin lactosa, claras de huevo, queso fresco batido, huevo cocido, lata de atun al natural) para que la suma total de proteina del plato cumpla exactamente el numero fijado en el objetivo.',
      'SOLO INGREDIENTES Y GRAMAJES (SIN METODOS DE COCINADO NI "EN CRUDO"): Nombra unicamente los alimentos y sus gramos exactos. PROHIBIDO anadir formas de preparacion ("hervido", "a la plancha", "al horno", "salteado", "asado", "cocido", "marcado") y PROHIBIDO escribir "(en crudo)" (los pesos siempre se entienden en crudo). Ejemplo: "Arroz blanco 220g, solomillo de ternera 220g, calabacin y zanahoria 150g, AOVE 15g, platano 150g".',
      'FORMATO LIMPIO Y DIRECTO: Enumera los alimentos y sus cantidades de forma fluida, separando con comas y conectores sencillos ("con", "y de postre").',
      'PROHIBIDO RELLENO NARRATIVO: Sin introducciones, verbos ni rodeos ("Prepara...", "Disfruta de...", "Marca...", "Sírvelo con..."). Directo a los alimentos y gramajes.',
      'PROHIBIDO RESUMENES NUMERICOS: NUNCA anadas al final "Total aprox:", "Total:", "kcal", "P:", "HC:", "G:" ni balances matematicos.',
      'PROHIBIDO LISTAS CON SIGNOS MAS (+): Usa comas o conectores naturales ("y", "con").',
      'VERDURAS CONCRETAS: Nombra siempre verduras especificas (calabacin, zanahoria, espinacas, judias verdes).'
    ],
  };

  const payloadJson = JSON.stringify(payload, null, 2);

  return [
    'INSTRUCCIÓN CRÍTICA:',
    'Devuelve ÚNICAMENTE un objeto JSON válido que contenga la clave "ingestas".',
    'NO incluyas texto explicativo, encabezados Markdown ni introducciones.',
    'ESTRUCTURA DE RESPUESTA OBLIGATORIA:',
    '{',
    '  "ingestas": [',
    '    {',
    '      "nombre": "Nombre de la ingesta",',
    '      "detalle": "Lista limpia y concisa de alimentos y gramos exactos, sin métodos de cocinado ni menciones a crudo/cocido."',
    '    }',
    '  ]',
    '}',
    '',
    'ESPECIFICACIÓN DEL PLAN EN FORMATO JSON:',
    payloadJson,
  ].join('\n');
}

export function buildWeeklyPrompt({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasSpec = {};

  for (const dayKey of daysOfWeek) {
    const dayData = baseData.dias[dayKey];
    const mealBudgets = calculateMealBudgets(dayData);
    const ingestasAGenerar = buildMealAssemblySpec({
      jugador,
      dayKey,
      dayData,
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

  const recsGenerales = recomendacionesIngestas ? recommendationsToPrompt(recomendacionesIngestas) : '';

  const payload = {
    rol: 'Carlos Ferrando, nutricionista del Valencia CF',
    tarea: 'Diseñar el menú gastronómico de TODA LA SEMANA (Lunes a Domingo) calculando los gramos exactos en crudo para cumplir las macros fijadas en cada ingesta, garantizando alta variedad gastronómica y respetando estrictamente protocolos fijos, restricciones clínicas y preferencias del jugador.',
    jugador: {
      nombre: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      posicion: jugador.posicion || 'No especificada',
      peso_kg: jugador.peso_kg,
      objetivo: getObjectiveLabel(jugador.objetivo) || jugador.objetivo,
      ...(jugador.contexto_clinico ? { contexto_clinico: jugador.contexto_clinico } : {}),
      ...([jugador.alergias ? `Alergias: ${jugador.alergias}` : null, jugador.intolerancias ? `Intolerancias: ${jugador.intolerancias}` : null, jugador.aversiones ? `Aversiones: ${jugador.aversiones}` : null].filter(Boolean).length > 0
        ? { alergias_intolerancias: [jugador.alergias ? `Alergias: ${jugador.alergias}` : null, jugador.intolerancias ? `Intolerancias: ${jugador.intolerancias}` : null, jugador.aversiones ? `Aversiones: ${jugador.aversiones}` : null].filter(Boolean).join(' | ') }
        : {}),
      ...(jugador.gustos_preferencias ? { preferencias: jugador.gustos_preferencias } : {}),
    },
    contexto_adicional: contextoAdicional || 'Ajustar a las tolerancias y gustos del jugador',
    ...(recsGenerales ? { pautas_especificas_nutricionista: recsGenerales } : {}),
    plan_semanal_por_dias: diasSpec,
    catalogo_alimentos_oficiales_disponibles: FOOD_NAMES_LIST,
    reglas_calidad_nutricional_y_variedad: [
      '1. PROTOCOLOS FIJOS OBLIGATORIOS Y BOLOÑESA: Si una ingesta tiene "es_protocolo_fijo: true" (día de partido, cena de carga pre-partido con Ensure, batido post-entreno o menú de comedor), respeta la pauta indicada. Si la pauta pre-partido indica salsa boloñesa, los ingredientes son tomate triturado y carne picada magra (de vacuno o de pollo/pavo), NUNCA hamburguesa. Si hay múltiples días de partido en la misma semana (ej: martes y sábado) o la pauta ofrece alternativas ("pasta o arroz", boloñesa de vacuno o ave), ALTERNA las opciones para no repetir exactamente el mismo plato en ambos partidos.',
      '2. MÁXIMA VARIEDAD SEMANAL Y PROHIBIDO REPETIR PROTEÍNA EN EL MISMO DÍA: En toda la semana, PROHIBIDO repetir la misma fuente de proteína en la comida y en la cena del mismo día (ej: NUNCA ternera/hamburguesa en comida y ternera/hamburguesa en cena). Si a mediodía se toma carne roja/vacuno, por la noche debe ser ave (pollo/pavo), pescado blanco/azul, marisco o huevos, y viceversa. ROTA continuamente entre todas las fuentes de proteína (ternera magra, pechuga/contramuslo de pollo, pavo, conejo, pescados blancos [merluza, dorada, lubina, lenguado, bacalao], mariscos [sepia, calamar, pulpo, gambas], pescados azules [salmón, atún, bonito, emperador], huevos y legumbres aptas). ROTA también los hidratos (arroz blanco/basmati/jazmín, arroz integral, pasta, fideos de arroz, cuscús, gnocchi, patata, boniato, avena, quinoa). PROHIBIDO servir el mismo plato o la misma combinación de proteína e hidrato en días consecutivos.',
      '3. PREFERENCIAS DEL JUGADOR CON ELEVADA VARIABILIDAD: Si el jugador expresa preferencias (ej: "solo como arroz con pollo", "como verdura con carne"), respeta esa preferencia pero NO hagas platos idénticos todos los días. Varía los cortes/tipos de carne (solomillo, pechuga, carne magra, pavo), rota las verduras de acompañamiento (calabacín, espárragos, zanahoria, brócoli, pimientos, judías verdes) y varía las fuentes de hidrato afines para no caer en la monotonía.',
      '4. SEGURIDAD CLÍNICA TOTAL Y ALIMENTOS PROHIBIDOS: Respeta rigurosamente las alergias, intolerancias, aversiones y contexto médico indicados en la ficha del jugador. Jamás incluyas un alimento prohibido o conflictivo. Si el jugador tiene intolerancia o aversión a un alimento, ese alimento NUNCA debe aparecer en su menú bajo ningún concepto. Si el jugador tiene intolerancia al gluten, alimentos como cuscús (sémola de trigo), trigo, cebada y centeno están TOTALMENTE PROHIBIDOS (usa arroz, quinoa, patata, boniato o pasta sin gluten). Si tiene intolerancia a la lactosa, los lácteos tradicionales están prohibidos (usa opciones sin lactosa o vegetales). PROHIBIDO escribir "X sustituido por Y". PROHIBIDO escribir alimentos con 0g.',
      '5. SELECCIÓN DE ALIMENTOS DEL CATÁLOGO OFICIAL Y CÁLCULO PRECISO: Utiliza exclusivamente los nombres oficiales del catálogo disponible (ej: "Arroz blanco", "Solomillo de ternera", "Boniato", "Pechuga de pollo", "AOVE"). Tu rol primordial es gastronómico y clínico: decidir combinaciones ricas, variadas y seguras. No te preocupes por calcular mentalmente los gramos exactos: la calculadora matemática de Nutralab ajustará los gramos al múltiplo de 5g exacto según los requerimientos del jugador.',
      '6. SOLO INGREDIENTES Y GRAMAJES APROXIMADOS (SIN MÉTODOS DE COCINADO NI "EN CRUDO"): Nombra únicamente los alimentos individuales reales del catálogo con su gramaje orientativo (ej: "Arroz blanco 150g, Pechuga de pollo 150g, Brócoli 150g, AOVE 15g"). PROHIBIDO nombrar mezclas híbridas en un solo ítem (no escribir "sepia y calamar", "merluza bacalao", "manzana y pera" ni "pollo y pavo"). PROHIBIDO añadir métodos de cocinado ("a la plancha", "al horno", "hervido") y PROHIBIDO escribir "(en crudo)".',
      '7. PROHIBIDO RELLENO NARRATIVO Y RESÚMENES NUMÉRICOS: Sin introducciones, sin verbos ("Prepara...", "Añade..."), sin resúmenes numéricos al final ("Total:", "kcal", "P:"). Directo a los alimentos y gramajes.',
      '8. VERDURAS CONCRETAS: Nombra siempre verduras específicas.',
      '9. NOTAS SEMANALES INTEGRADAS: Genera en el mismo JSON exactamente 4 consejos/indicaciones clave de la semana dirigidos al jugador en segunda persona ("tú") de forma cercana y profesional (hidratación, descanso, adherencia a gramajes y pauta específica si hay partido).',
      '10. REDACCIÓN NATURAL DEL POST-ENTRENO: En la ingesta de post-entreno, redacta siempre de manera clara y directa para el jugador: "Batido de proteína 30g disuelto en agua" (o "Batido de proteína sin lactosa 30g disuelto en agua" si tiene intolerancia a la lactosa). PROHIBIDO usar palabras como "scoop", "aislado de proteína scoop" o tecnicismos en inglés.',
      '11. COMIDAS CON POSTRE EN CASO DE POCAS INGESTAS O ALTA CARGA: Si el jugador tiene 2 o 3 comidas al día o la comida concentra muchos hidratos (>80g HC) o proteína (>45g P): NO satures el plato principal con un único ingrediente gigante (evita poner más de 180g de quinoa/arroz o 380g de patata, o más de 200g de carne). Reparte los macros incluyendo SIEMPRE postre: añade fruta fresca (plátano, manzana, uvas, kiwi o mango) y un postre proteico apto (yogur proteico, yogur griego o queso fresco batido, asegurando que sea SIN LACTOSA si no la tolera). En el desayuno de día de partido, combina fruta con hidratos de asimilación fácil (pan blanco tostado, copos de avena o tortas) y proteína limpia (claras o yogur), NUNCA solo fruta cruda.'
    ],
  };

  const payloadJson = JSON.stringify(payload, null, 2);

  return [
    'INSTRUCCIÓN CRÍTICA:',
    'Devuelve ÚNICAMENTE un objeto JSON válido con las claves "dias" y "notas".',
    'NO incluyas texto explicativo, encabezados Markdown ni introducciones.',
    'ESTRUCTURA DE RESPUESTA OBLIGATORIA:',
    '{',
    '  "dias": {',
    '    "lunes": {',
    '      "ingestas": [',
    '        {',
    '          "nombre": "Nombre de la ingesta",',
    '          "detalle": "Alimentos y gramos exactos en crudo de forma concisa."',
    '        }',
    '      ]',
    '    },',
    '    "martes": { ... },',
    '    "miercoles": { ... },',
    '    "jueves": { ... },',
    '    "viernes": { ... },',
    '    "sabado": { ... },',
    '    "domingo": { ... }',
    '  },',
    '  "notas": [',
    '    "Consejo 1...",',
    '    "Consejo 2...",',
    '    "Consejo 3...",',
    '    "Consejo 4..."',
    '  ]',
    '}',
    '',
    'ESPECIFICACIÓN COMPLETA DEL PLAN SEMANAL EN JSON:',
    payloadJson,
  ].join('\n');
}

export function sanitizeMealDetail(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text
    .replace(/(?:[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+)\s+0\s*g(?:,\s*|\s+y\s+|\s+con\s+)?/gi, '')
    .replace(/(?:[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+)\s+sustituido\s+por\s+/gi, '')
    .replace(/aislado(?:\s+de)?\s+prote[ií]na[a-záéíóúñ\s\d]*(?:scoop)?(?:[a-záéíóúñ\s\d]*)/gi, (match) => {
      return match.toLowerCase().includes('sin lactosa')
        ? 'Batido de proteína sin lactosa 30g disuelto en agua'
        : 'Batido de proteína 30g disuelto en agua';
    })
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,.\s]+/, '')
    .replace(/[,.\s]+$/, '')
    .trim();

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

export async function generateSingleDay({ jugador, dayKey, dayData, menu, preMatchConfig, contextoAdicional, recsForDay }) {
  const prompt = buildDayPrompt({
    jugador,
    dayKey,
    dayData,
    menu,
    preMatchConfig,
    contextoAdicional,
    recsForDay,
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
    throw new Error(`Respuesta inválida en día ${dayKey}: ${e.message}`);
  }

  if (!json.ingestas || !Array.isArray(json.ingestas) || json.ingestas.length === 0) {
    throw new Error(`La IA no devolvio ingestas validas para el dia ${dayKey}`);
  }
  const rawIngestas = json.ingestas;
  const sanitizedIngestas = rawIngestas.map((ing) => ({
    ...ing,
    detalle: ing.detalle,
  }));

  return {
    dayKey,
    ingestas: sanitizedIngestas,
  };
}

export async function generateWeeklyPlanParallel({ jugador, baseData, menu, preMatchConfig, contextoAdicional, recomendacionesIngestas }) {
  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  const dayPromises = daysOfWeek.map(async (dayKey) => {
    const dayData = baseData.dias[dayKey];
    const recsForDay = recomendacionesIngestas ? recommendationsToPrompt(recomendacionesIngestas) : '';

    try {
      return await generateSingleDay({
        jugador,
        dayKey,
        dayData,
        menu,
        preMatchConfig,
        contextoAdicional,
        recsForDay,
      });
    } catch (err) {
      console.warn(`Reintentando generación para ${dayKey}: ${err.message}`);
      try {
        return await generateSingleDay({
          jugador,
          dayKey,
          dayData,
          menu,
          preMatchConfig,
          contextoAdicional,
          recsForDay,
        });
      } catch (retryErr) {
        console.error(`Error final en día ${dayKey}:`, retryErr.message);
        return {
          dayKey,
          ingestas: dayData.ingestas,
        };
      }
    }
  });

  const dayResults = await Promise.all(dayPromises);
  const dias = {};
  for (const res of dayResults) {
    dias[res.dayKey] = {
      ...baseData.dias[res.dayKey],
      ingestas: res.ingestas,
    };
  }

  return {
    ...baseData,
    dias,
  };
}

function recommendationsToPrompt(recs) {
  if (!recs || typeof recs !== 'object') return '';
  const entries = Object.entries(recs).filter((entry) => entry[1] && entry[1].trim() !== '');
  if (entries.length === 0) return '';
  return entries.map(([meal, rec]) => `- Para ${meal}: ${rec}`).join('\n');
}

export function buildWeeklyNotesPrompt({ jugador, contextoAdicional }) {
  return [
    `Eres Carlos Ferrando, nutricionista del Valencia CF.`,
    `A partir de este plan nutricional semanal generado para ${jugador.nombre} ${jugador.apellidos} (${jugador.posicion || 'Jugador'}), genera exactamente 4 indicaciones/consejos clave de la semana (notes).`,
    `Devuelve ÚNICAMENTE un objeto JSON: {"notes": ["nota 1", "nota 2", "nota 3", "nota 4"]}`,
    ``,
    `DATOS CLÍNICOS:`,
    `- Objetivo: ${getObjectiveLabel(jugador.objetivo) || jugador.objetivo}`,
    `- Contexto clínico: ${jugador.contexto_clinico || 'Sin particularidades'}`,
    `- Alergias/Intolerancias: ${jugador.alergias || ''} ${jugador.intolerancias || ''}`,
    `- Preferencias: ${jugador.gustos_preferencias || 'No especificadas'}`,
    contextoAdicional ? `- Pautas globales: ${contextoAdicional}` : '',
    ``,
    `REGLAS:`,
    `- Tono: Dirígete SIEMPRE al jugador en segunda persona del singular ("tú") de forma cercana y profesional.`,
    `- Las notas deben ser prácticas: hidratación, descanso, pauta pre-partido si aplica, digestión y adherencia a sus gramos.`
  ].filter(Boolean).join('\n');
}

export async function reviewAndRepairPlanData({ jugador, contextoAdicional, planData }) {
  try {
    const res = await client.messages.create({
      model: env.AI_MODEL || 'claude-sonnet-5',
      max_tokens: 1000,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: buildWeeklyNotesPrompt({ jugador, contextoAdicional }) }],
    });

    const text = res.content.find((c) => c.type === 'text')?.text || '';
    const json = extractJson(text);
    if (Array.isArray(json.notes) && json.notes.length > 0) {
      return {
        ...planData,
        notas: json.notes,
      };
    }
  } catch (error) {
    console.warn('Weekly notes generation fallback:', error.message);
  }

  return {
    ...planData,
    notas: [
      'Ajusta la hidratación según la intensidad de la sesión y la sudoración.',
      'Respeta los gramajes en crudo indicados para cada comida.',
      'Toma el batido post-entreno en los primeros 30 minutos tras finalizar la sesión.',
      'Mantén las pautas de descanso nocturno y digestión adecuada.',
    ],
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

  const intoleranciasStr = `${jugador?.intolerancias || ''} ${jugador?.alergias || ''} ${jugador?.alergias_intolerancias || ''}`.toLowerCase();
  const isLactoseIntolerant = intoleranciasStr.includes('lactosa') || intoleranciasStr.includes('leche');
  const isGlutenIntolerant = intoleranciasStr.includes('gluten') || intoleranciasStr.includes('celiac');
  const calOptions = { isLactoseIntolerant, isGlutenIntolerant };

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

        const calibratedIngestas = await Promise.all(
          aiDay.ingestas.map(async (ing) => {
            const sanitized = sanitizeMealDetail(ing.detalle);
            const target = budgetMap.get(ing.nombre.toLowerCase().trim());
            const calibrated = target ? await calibrateMeal(sanitized, target, calOptions) : sanitized;
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
