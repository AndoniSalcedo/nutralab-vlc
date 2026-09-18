import fs from 'node:fs';
import path from 'node:path';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv(path.join(process.cwd(), '.env.local'));

const [{ getSupabaseAdmin }, { getPlayerWithTeamConfig }, { getEvolutionsByPlayerIdOrdered }, { withLatestMeasurement }, { getWeeklyReport }, { getMenuByWeekAndTeam }, engine, foodTree, { getClinicalCatalogForPlayer }, { buildBasePlanData }, { calibrateMeal }] = await Promise.all([
  import('@/lib/supabase/server'),
  import('@/repositories/playerRepository'),
  import('@/repositories/evolutionRepository'),
  import('@/lib/metrics/player'),
  import('@/repositories/weeklyReportsRepository'),
  import('@/repositories/menuRepository'),
  import('@/lib/engine/generator'),
  import('@/lib/engine/food-tree'),
  import('@/lib/nutrition/clinical-catalog'),
  import('@/lib/engine/plan-card'),
  import('@/lib/engine/calculator'),
]);

const PLAYER_ID = 178;
const TEAM_ID = 7;
const WEEK = '2026-09-14';
const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function compactFood(food) {
  if (!food) return null;
  return {
    name: food.name,
    category: food.category,
    minGrams: food.minGrams,
    maxGrams: food.maxGrams,
    cho: food.cho,
    pro: food.pro,
    tags: food.tags,
  };
}

function compactItem(item) {
  return {
    name: item?.name,
    grams: item?.grams,
    food: compactFood(item?.food),
  };
}

function compactTree(tree) {
  if (!tree || typeof tree !== 'object') return tree;
  return {
    isComplete: tree.isComplete,
    raw: tree.raw,
    label: tree.label,
    branches: (tree.branches || []).map((branch) => ({
      id: branch.id,
      label: branch.label,
      category: branch.category,
      isGeneric: branch.isGeneric,
      foodName: branch.foodName,
    })),
    unrecognized: tree.unrecognized,
  };
}

function treeFoodNames(node) {
  if (!node) return [];
  if (Array.isArray(node.foodNames)) return node.foodNames;
  return Object.values(node.children || {}).flatMap(treeFoodNames);
}

function treeBranchSummary(playerTree, id) {
  const node = id.split('.').reduce((current, key) => current?.children?.[key], playerTree);
  return { id, exists: Boolean(node), leaves: treeFoodNames(node).length, sample: treeFoodNames(node).slice(0, 12) };
}

function containsNodeId(node, id) {
  if (!node) return false;
  if (node.id === id) return true;
  return Object.values(node.children || {}).some((child) => containsNodeId(child, id));
}

function sourceForMeal({ dayKey, dayData, mealName, preMatchConfig, jugador, menu }) {
  const dayIndex = DAYS.indexOf(dayKey);
  const nextDayKey = DAYS[(dayIndex + 1) % DAYS.length];
  const matchProtocolEnabled = preMatchConfig?.enabled === true;
  const matchDayKeys = matchProtocolEnabled
    ? Object.keys(preMatchConfig?.partidos || {}).filter((key) => preMatchConfig.partidos[key]?.horario)
    : [];
  const isNextDayMatch = Boolean(
    baseDayTypes[nextDayKey] === 'partido' || matchDayKeys.includes(nextDayKey)
  );
  const isMatchDay = dayData.tipoDia === 'partido';
  const isPrevToMatch = isNextDayMatch;
  const matchKey = isMatchDay ? dayKey : (isPrevToMatch ? nextDayKey : null);
  const horario = matchKey ? preMatchConfig?.partidos?.[matchKey]?.horario : null;
  const playerPreMatch = horario ? (jugador?.config_prepartido?.[horario] || {}) : {};
  const previousMatchPauta = isPrevToMatch
    ? playerPreMatch.recomendaciones?.Cena || playerPreMatch.recomendaciones?.cena
    : null;
  const normMeal = mealName.toLowerCase();
  const isCena = normMeal.includes('cena');
  const isPost = normMeal.includes('post');

  if (isPost) return isMatchDay || normMeal.includes('partido') ? 'fixed:Recovery y fruta' : 'fixed:batido';
  if (previousMatchPauta && (isCena || !dayData.ingestas.some((item) => item.nombre.toLowerCase().includes('cena')))) {
    return `pre_match_previous_dinner:${horario}`;
  }
  if (isMatchDay && matchProtocolEnabled) {
    const pautaMatch = horario === 'manana' && isCena
      ? null
      : playerPreMatch.recomendaciones?.[mealName] || playerPreMatch.recomendaciones?.[mealName.toLowerCase()];
    if (pautaMatch) return `pre_match_match_day:${horario}`;
  }

  const dayMenu = menu?.dias?.find((day) => {
    const dayName = String(day.dia || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedDay = dayKey.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return dayName.includes(normalizedDay) || normalizedDay.includes(dayName);
  });
  if (normMeal.includes('comida') || normMeal.includes('cena')) {
    const mealService = normMeal.includes('comida') ? dayMenu?.comida : dayMenu?.cena;
    if (mealService) return 'buffet_or_default';
  }
  return 'default_recommendation';
}

const supabase = getSupabaseAdmin();
const rawPlayer = await getPlayerWithTeamConfig(supabase, PLAYER_ID);
const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, PLAYER_ID);
const jugador = withLatestMeasurement(rawPlayer, evolutions || []);
const teamConfig = jugador?.equipos?.configuracion_nutricional || {};
const report = await getWeeklyReport(supabase, TEAM_ID, WEEK);
const menu = await getMenuByWeekAndTeam(supabase, WEEK, TEAM_ID);
const calendario = report?.meta?.calendario || {
  lunes: 'entreno', martes: 'partido', miercoles: 'descanso', jueves: 'entreno',
  viernes: 'entreno', sabado: 'entreno', domingo: 'partido',
};
const preMatchConfig = report?.meta?.preMatchConfig || {
  enabled: true,
  horario: 'noche',
  diaPartido: 'martes',
  partidos: { martes: { horario: 'noche' }, domingo: { horario: 'noche' } },
};
const baseDayTypes = calendario;

const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
const playerFoodTree = foodTree.buildPlayerFoodTree(clinicalCatalog);
const baseData = buildBasePlanData({
  jugador,
  nombre: `Trace - ${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
  contexto: 'semana_partido',
  calendario,
  preMatchConfig,
  menu,
  teamConfig,
});

const generated = await engine.generarDatosPlan({
  jugador,
  nombre: `Trace - ${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
  contexto: 'semana_partido',
  calendario,
  preMatchConfig,
  menu,
  teamConfig,
});

const trace = {
  input: {
    playerId: jugador.id,
    name: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
    weightKg: jugador.peso_kg,
    objective: jugador.objetivo,
    numMeals: jugador.num_comidas,
    clinicalContext: jugador.contexto_clinico,
    intolerances: jugador.intolerancias,
    allergies: jugador.alergias,
    aversions: jugador.aversiones,
    latestEvolution: evolutions?.at(-1) || null,
  },
  stage1_catalog: {
    summary: clinicalCatalog.summary,
    activeTags: clinicalCatalog.activeTags,
    foodsCount: clinicalCatalog.foods.length,
    porkFoodsPresent: clinicalCatalog.foods.filter((food) => food.tags?.includes('cerdo')).map((food) => food.name),
    branches: [
      treeBranchSummary(playerFoodTree, 'hidratos.pasta'),
      treeBranchSummary(playerFoodTree, 'hidratos.tuberculos'),
      treeBranchSummary(playerFoodTree, 'proteina.pollo'),
      treeBranchSummary(playerFoodTree, 'proteina.pavo'),
    ],
  },
  stage2_basePlan: {
    meta: baseData.meta,
    player: baseData.jugador,
    metrics: baseData.metricas,
    days: Object.fromEntries(DAYS.map((day) => [day, {
      type: baseData.dias[day].tipoDia,
      macros: {
        kcal: baseData.dias[day].kcal,
        protein: baseData.dias[day].proteina,
        carbs: baseData.dias[day].hidratos,
        fat: baseData.dias[day].grasa,
      },
      budgets: engine.calculateMealBudgets(baseData.dias[day]),
      meals: baseData.dias[day].ingestas.map((meal) => meal.nombre),
    }])),
  },
  stage3_mealSources: Object.fromEntries(DAYS.map((day) => [day, baseData.dias[day].ingestas.map((meal) => ({
    meal: meal.nombre,
    source: sourceForMeal({ dayKey: day, dayData: baseData.dias[day], mealName: meal.nombre, preMatchConfig, jugador, menu }),
  }))])),
  stage4_mondayDinner: {},
  stage5_defaultLunchRecommendation: {},
  finalPlan: Object.fromEntries(DAYS.map((day) => [day, generated.dias[day].ingestas.map((meal) => ({
    meal: meal.nombre,
    detail: meal.detalle,
  }))])),
};

const monday = baseData.dias.lunes;
const mondayBudgets = engine.calculateMealBudgets(monday);
const dinnerTarget = mondayBudgets.find((budget) => budget.nombre.toLowerCase() === 'cena')?.target;
const mondayPauta = jugador.config_prepartido?.noche?.recomendaciones?.Cena;
const builtDinnerTree = foodTree.buildMealTree(mondayPauta, 'Cena', clinicalCatalog, jugador, true);
const contextualDinnerTree = foodTree.buildContextualPlayerFoodTree(playerFoodTree, { mealName: 'Cena' });
const resolvedDinnerItems = foodTree.resolveMealTreeItemsForDay(
  builtDinnerTree,
  'Cena',
  clinicalCatalog,
  jugador,
  true,
  null,
  contextualDinnerTree,
);
const calibratedDinner = await calibrateMeal(resolvedDinnerItems, dinnerTarget, {
  clinicalCatalog,
  mealName: 'Cena',
  dayIndex: 0,
  isMatchDay: false,
});

trace.stage4_mondayDinner = {
  decision: {
    dayType: monday.tipoDia,
    nextDayType: baseData.dias.martes.tipoDia,
    isNextDayMatch: true,
    selectedHorario: 'noche',
    source: 'config_prepartido.noche.recomendaciones.Cena',
    raw: mondayPauta?.raw,
  },
  budget: dinnerTarget,
  buildMealTree: compactTree(builtDinnerTree),
  contextualRules: {
    dinnerBlocksEggs: !containsNodeId(contextualDinnerTree, 'huevos'),
    dinnerBlocksCannedFish: !containsNodeId(contextualDinnerTree, 'conservas_pescado'),
    dinnerBlocksLegumes: !containsNodeId(contextualDinnerTree, 'legumbres'),
    keepsPasta: Boolean(contextualDinnerTree.children?.hidratos?.children?.pasta),
    keepsPotato: Boolean(contextualDinnerTree.children?.hidratos?.children?.tuberculos?.children?.patata),
  },
  resolvedBeforeCalibration: resolvedDinnerItems?.map(compactItem) || resolvedDinnerItems,
  calibrationInput: resolvedDinnerItems?.map((item) => item.name),
  calibrated: calibratedDinner,
};

const defaultLunchTree = foodTree.buildMealTree(
  jugador.recomendaciones_defecto?.Comida,
  'Comida',
  clinicalCatalog,
  jugador,
  false,
);
trace.stage5_defaultLunchRecommendation = {
  raw: jugador.recomendaciones_defecto?.Comida?.raw,
  structuredHidratos: jugador.recomendaciones_defecto?.Comida?.hidrato,
  parsedTree: compactTree(defaultLunchTree),
};

const outputPath = path.join(process.cwd(), 'scripts', 'trace_arnaut_178.json');
fs.writeFileSync(outputPath, JSON.stringify(trace, null, 2), 'utf8');

console.log(JSON.stringify({
  outputPath,
  input: trace.input,
  catalog: trace.stage1_catalog,
  basePlan: trace.stage2_basePlan,
  mondaySources: trace.stage3_mealSources.lunes,
  mondayDinner: trace.stage4_mondayDinner,
  defaultLunchRecommendation: trace.stage5_defaultLunchRecommendation,
  finalMonday: trace.finalPlan.lunes,
}, null, 2));
