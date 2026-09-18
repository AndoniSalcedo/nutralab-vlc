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

const [
  { getSupabaseAdmin },
  { getPlayerWithTeamConfig },
  { getEvolutionsByPlayerIdOrdered },
  { withLatestMeasurement },
  { getWeeklyReport },
  { getMenuByWeekAndTeam },
  engine,
  foodTree,
  { getClinicalCatalogForPlayer },
  { buildBasePlanData },
] = await Promise.all([
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
]);

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function sanitizeSlug(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function treeFoodNames(node) {
  if (!node) return [];
  if (Array.isArray(node.foodNames)) return node.foodNames;
  return Object.values(node.children || {}).flatMap(treeFoodNames);
}

function treeBranchSummary(playerTree, id) {
  const node = id.split('.').reduce((current, key) => current?.children?.[key], playerTree);
  return {
    id,
    exists: Boolean(node),
    leaves: treeFoodNames(node).length,
    sample: treeFoodNames(node).slice(0, 8),
  };
}

function sourceForMeal({ dayKey, dayData, mealName, preMatchConfig, jugador, menu, baseDayTypes }) {
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

  if (isPost) {
    return isMatchDay || normMeal.includes('partido') ? 'fixed:Recovery y fruta' : 'fixed:batido';
  }
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
    if (mealService) return 'buffet_menu';
  }
  return 'default_recommendation';
}

async function run() {
  const supabase = getSupabaseAdmin();

  // Directorio base de salida
  const baseOutputDir = path.join(process.cwd(), 'scripts', 'output_carlos_generation');
  const dirTeam7 = path.join(baseOutputDir, 'team_7_valencia');
  const dirTeam8 = path.join(baseOutputDir, 'team_8_futbol_elite');
  fs.mkdirSync(dirTeam7, { recursive: true });
  fs.mkdirSync(dirTeam8, { recursive: true });

  console.log('='.repeat(80));
  console.log('GENERACIÓN DE PLANES Y TRAZAS · BASE DE DATOS DE CARLOS FERRANDO');
  console.log('='.repeat(80));

  // 1. Configuraciones de Equipos
  // Valencia CF (Team 7): Con último menú (Semana 2026-09-14)
  const TEAM_7_ID = 7;
  const WEEK_7 = '2026-09-14';
  const menu7 = await getMenuByWeekAndTeam(supabase, WEEK_7, TEAM_7_ID);
  const report7 = await getWeeklyReport(supabase, TEAM_7_ID, WEEK_7);
  const calendario7 = report7?.meta?.calendario || {
    lunes: 'entreno', martes: 'partido', miercoles: 'descanso', jueves: 'entreno',
    viernes: 'entreno', sabado: 'entreno', domingo: 'partido',
  };
  const preMatchConfig7 = report7?.meta?.preMatchConfig || {
    enabled: true,
    horario: 'tarde',
    partidos: { martes: { horario: 'noche' }, domingo: { horario: 'noche' } },
    diaPartido: 'sabado',
  };

  // Fútbol élite (Team 8): SIN menú (como es el otro equipo)
  const TEAM_8_ID = 8;
  const report8 = await getWeeklyReport(supabase, TEAM_8_ID, '2026-08-17');
  const menu8 = null; // Expresamente sin menú según directiva de Carlos
  const calendario8 = report8?.meta?.calendario || {
    lunes: 'entreno', martes: 'partido', miercoles: 'descanso', jueves: 'entreno',
    viernes: 'entreno', sabado: 'descanso', domingo: 'descanso',
  };
  const preMatchConfig8 = report8?.meta?.preMatchConfig || {
    enabled: true,
    horario: 'tarde',
    partidos: { martes: { horario: 'noche' } },
    diaPartido: 'sabado',
  };

  // Obtener listados de jugadores de Carlos (Teams 7 y 8)
  const { data: rawPlayers7 } = await supabase
    .from('jugadores')
    .select('id, nombre, apellidos')
    .eq('equipo_id', TEAM_7_ID)
    .order('id');

  const { data: rawPlayers8 } = await supabase
    .from('jugadores')
    .select('id, nombre, apellidos')
    .eq('equipo_id', TEAM_8_ID)
    .order('id');

  console.log(`\n• Equipo 7 (Valencia C.F.): ${rawPlayers7.length} jugadores. Menú semanal: ${WEEK_7} (ID: ${menu7?.id})`);
  console.log(`• Equipo 8 (Fútbol élite): ${rawPlayers8.length} jugadores. Menú: SIN MENÚ (Recomendaciones base individuales)`);
  console.log(`• Total jugadores a procesar: ${rawPlayers7.length + rawPlayers8.length}\n`);

  const allTraces = {
    team_7_valencia: {},
    team_8_futbol_elite: {},
  };
  const allPlans = {
    team_7_valencia: {},
    team_8_futbol_elite: {},
  };
  const summaryList = [];

  // Función procesadora individual
  async function processPlayer({ playerId, teamId, teamName, targetDir, menu, calendario, preMatchConfig, storageKey }) {
    const rawPlayer = await getPlayerWithTeamConfig(supabase, playerId);
    if (!rawPlayer) {
      console.warn(`[WARN] No se encontró el jugador con ID ${playerId}`);
      return null;
    }

    const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, playerId);
    const jugador = withLatestMeasurement(rawPlayer, evolutions || []);
    const teamConfig = jugador?.equipos?.configuracion_nutricional || {};
    const clinicalCatalog = getClinicalCatalogForPlayer(jugador);
    const playerFoodTree = foodTree.buildPlayerFoodTree(clinicalCatalog);

    const playerName = `${jugador.nombre} ${jugador.apellidos || ''}`.trim();
    const slug = sanitizeSlug(playerName);

    // 1. Datos Base (Metas, métricas, presupuestos calóricos)
    const baseData = buildBasePlanData({
      jugador,
      nombre: `Plan Semanal - ${playerName}`,
      contexto: 'semana_partido',
      calendario,
      preMatchConfig,
      menu,
      teamConfig,
    });

    // 2. Generación determinista del plan semanal
    const generated = await engine.generarDatosPlan({
      jugador,
      nombre: `Plan Semanal - ${playerName}`,
      contexto: 'semana_partido',
      calendario,
      preMatchConfig,
      menu,
      teamConfig,
    });

    // 3. Inspección y Traza detallada
    const dayBudgets = {};
    const mealSources = {};
    const finalPlanPerDay = {};
    const alerts = [];

    for (const day of DAYS) {
      const bDay = baseData.dias[day];
      const gDay = generated.dias[day];
      const bBudgets = engine.calculateMealBudgets(bDay);
      dayBudgets[day] = {
        tipo: bDay.tipoDia,
        macrosObjetivo: {
          kcal: bDay.kcal,
          proteina: bDay.proteina,
          hidratos: bDay.hidratos,
          grasa: bDay.grasa,
        },
        repartoIngestas: bBudgets,
      };

      mealSources[day] = bDay.ingestas.map((meal) => ({
        ingesta: meal.nombre,
        fuente: sourceForMeal({
          dayKey: day,
          dayData: bDay,
          mealName: meal.nombre,
          preMatchConfig,
          jugador,
          menu,
          baseDayTypes: calendario,
        }),
      }));

      finalPlanPerDay[day] = {
        tipo: gDay.tipoDia,
        kcal: gDay.kcal,
        macros: {
          proteina: gDay.proteina,
          hidratos: gDay.hidratos,
          grasa: gDay.grasa,
        },
        ingestas: gDay.ingestas.map((meal) => {
          const isAlert = typeof meal.detalle === 'string' && meal.detalle.startsWith('[');
          if (isAlert) {
            alerts.push({ day, meal: meal.nombre, alert: meal.detalle });
          }
          return {
            nombre: meal.nombre,
            detalle: meal.detalle,
            alerta: isAlert,
          };
        }),
      };
    }

    const latestEvo = evolutions?.at(-1) || null;

    const trace = {
      team: {
        id: teamId,
        nombre: teamName,
        tieneMenu: Boolean(menu),
        semanaMenu: menu?.semana || null,
      },
      jugador: {
        id: jugador.id,
        nombre: playerName,
        posicion: jugador.posicion || 'Sin posición',
        numComidas: jugador.num_comidas,
        objetivo: jugador.objetivo,
        postentreno: jugador.postentreno,
        pesoKg: jugador.peso_kg,
        alturaCm: jugador.altura_cm,
        contextoClinico: jugador.contexto_clinico || null,
        intolerancias: jugador.intolerancias || null,
        aversiones: jugador.aversiones || null,
        tieneConfigPrepartido: Boolean(jugador.config_prepartido && Object.keys(jugador.config_prepartido).length > 0),
        tieneRecomendacionesDefecto: Boolean(jugador.recomendaciones_defecto && Object.keys(jugador.recomendaciones_defecto).length > 0),
        ultimaMedicion: latestEvo ? {
          fecha: latestEvo.fecha,
          pesoKg: latestEvo.peso_kg,
          grasaPorcentaje: latestEvo.porcentaje_grasa,
          suma6Pliegues: latestEvo.suma_6_pliegues,
        } : null,
      },
      etapa1_catalogo_clinico: {
        resumen: clinicalCatalog.summary,
        tagsActivos: clinicalCatalog.activeTags,
        alimentosDisponiblesTotal: clinicalCatalog.foods.length,
        alimentosCerdoPresentes: clinicalCatalog.foods.filter((f) => f.tags?.includes('cerdo')).map((f) => f.name),
        alimentosGlutenPresentes: clinicalCatalog.foods.filter((f) => f.tags?.includes('gluten')).map((f) => f.name),
        alimentosLacteosPresentes: clinicalCatalog.foods.filter((f) => f.tags?.includes('lacteo') || f.tags?.includes('lacteos')).map((f) => f.name),
        muestrasRamasArbol: [
          treeBranchSummary(playerFoodTree, 'hidratos.pasta'),
          treeBranchSummary(playerFoodTree, 'hidratos.arroz'),
          treeBranchSummary(playerFoodTree, 'hidratos.tuberculos'),
          treeBranchSummary(playerFoodTree, 'proteina.pollo'),
          treeBranchSummary(playerFoodTree, 'proteina.pavo'),
          treeBranchSummary(playerFoodTree, 'proteina.pescado_blanco'),
          treeBranchSummary(playerFoodTree, 'proteina.pescado_azul'),
        ],
      },
      etapa2_plan_base_y_presupuestos: {
        metricas: baseData.metricas,
        calendarioDias: dayBudgets,
      },
      etapa3_fuentes_de_resolucion: mealSources,
      etapa4_plan_final_calibrado: finalPlanPerDay,
      validacion: {
        valido: alerts.length === 0,
        alertasCount: alerts.length,
        alertas: alerts,
      },
    };

    // Guardar archivos individuales
    const traceFile = path.join(targetDir, `trace_${playerId}_${slug}.json`);
    const planFile = path.join(targetDir, `salida_plan_${playerId}_${slug}.json`);
    fs.writeFileSync(traceFile, JSON.stringify(trace, null, 2), 'utf8');
    fs.writeFileSync(planFile, JSON.stringify(generated, null, 2), 'utf8');

    allTraces[storageKey][playerId] = trace;
    allPlans[storageKey][playerId] = generated;

    const summaryItem = {
      id: jugador.id,
      equipo: teamName,
      nombre: playerName,
      posicion: jugador.posicion || 'N/A',
      pesoKg: jugador.peso_kg,
      objetivo: jugador.objetivo,
      numComidas: jugador.num_comidas,
      restricciones: clinicalCatalog.activeTags.length,
      alertasCount: alerts.length,
      diasGenerados: Object.keys(finalPlanPerDay).length,
      ejemploLunesComida: finalPlanPerDay.lunes?.ingestas?.find((i) => i.nombre.toLowerCase().includes('comida'))?.detalle || 'N/A',
    };
    summaryList.push(summaryItem);

    console.log(` [✓] ${teamName.padEnd(14)} | ID ${String(playerId).padStart(3)} | ${playerName.padEnd(24)} | ${jugador.peso_kg}kg | ${alerts.length === 0 ? '✓ OK' : `⚠️ ${alerts.length} alertas`}`);
    return summaryItem;
  }

  // Ejecutar Equipo 7 (Valencia CF con Menú)
  console.log('--- GENERANDO JUGADORES VALENCIA C.F. (CON MENÚ) ---');
  for (const p of rawPlayers7) {
    await processPlayer({
      playerId: p.id,
      teamId: TEAM_7_ID,
      teamName: 'Valencia C.F.',
      targetDir: dirTeam7,
      menu: menu7,
      calendario: calendario7,
      preMatchConfig: preMatchConfig7,
      storageKey: 'team_7_valencia',
    });
  }

  // Ejecutar Equipo 8 (Fútbol élite SIN Menú)
  console.log('\n--- GENERANDO JUGADORES FÚTBOL ÉLITE (SIN MENÚ) ---');
  for (const p of rawPlayers8) {
    await processPlayer({
      playerId: p.id,
      teamId: TEAM_8_ID,
      teamName: 'Fútbol élite',
      targetDir: dirTeam8,
      menu: menu8,
      calendario: calendario8,
      preMatchConfig: preMatchConfig8,
      storageKey: 'team_8_futbol_elite',
    });
  }

  // Guardar consolidados globales
  const consolidatedTracesPath = path.join(baseOutputDir, 'all_players_traces.json');
  const consolidatedPlansPath = path.join(baseOutputDir, 'all_players_plans.json');
  const consolidatedSummaryPath = path.join(baseOutputDir, 'summary.json');

  fs.writeFileSync(consolidatedTracesPath, JSON.stringify(allTraces, null, 2), 'utf8');
  fs.writeFileSync(consolidatedPlansPath, JSON.stringify(allPlans, null, 2), 'utf8');
  fs.writeFileSync(consolidatedSummaryPath, JSON.stringify({
    fechaGeneracion: new Date().toISOString(),
    totalJugadores: summaryList.length,
    equipos: {
      team_7_valencia: {
        id: TEAM_7_ID,
        nombre: 'Valencia C.F.',
        menuSemanal: WEEK_7,
        totalJugadores: rawPlayers7.length,
      },
      team_8_futbol_elite: {
        id: TEAM_8_ID,
        nombre: 'Fútbol élite',
        menuSemanal: null,
        totalJugadores: rawPlayers8.length,
      },
    },
    jugadores: summaryList,
  }, null, 2), 'utf8');

  console.log('\n' + '='.repeat(80));
  console.log('GENERACIÓN COMPLETADA CON ÉXITO');
  console.log(`• Directorio base: ${baseOutputDir}`);
  console.log(`• Trazas consolidadas: ${consolidatedTracesPath}`);
  console.log(`• Planes consolidados: ${consolidatedPlansPath}`);
  console.log(`• Resumen global: ${consolidatedSummaryPath}`);
  console.log('='.repeat(80));
}

run().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
