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
  { getLatestMenu },
  engine,
  ,
  ,
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

const PLAYER_IDS = [
  178, 180, 182, 183, 184, 186, 187, 188, 190, 191, 192, 193, 195, 196, 198, 201, 202, 237
];

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

const FISH_SEAFOOD = [
  'dorada', 'merluza', 'bacalao', 'salmón', 'salmon', 'lubina', 'atún', 'atun',
  'emperador', 'pez espada', 'sepia', 'calamar', 'pulpo', 'gambas', 'langostino',
  'mejillón', 'mejillon', 'mejillones', 'berberechos', 'rodaballo', 'corvina', 'lenguado',
  'caballa', 'sardina', 'bonito', 'trucha', 'rape'
];

const MEATS = [
  'pollo', 'pavo', 'ternera', 'vaca', 'cerdo', 'conejo', 'secreto', 'solomillo',
  'presa', 'morro', 'hamburguesa de ternera', 'hamburguesa de pollo', 'hamburguesa de pavo'
];

const VEG_ITEMS = [
  'lechuga', 'tomate', 'pepino', 'pimiento', 'cebolla', 'ajo', 'calabacín',
  'calabacin', 'zanahoria', 'puerro', 'berenjena', 'brócoli', 'brocoli', 'coliflor',
  'espinaca', 'acelga', 'alcachofa', 'champiñón', 'champinon', 'judías verdes',
  'judias verdes', 'espárragos', 'esparragos', 'rúcula', 'rucula', 'remolacha'
];

function sourceForMeal({ dayKey, dayData, mealName, preMatchConfig, jugador, baseDayTypes }) {
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
  if (isMatchDay) {
    const matchRecom = playerPreMatch.recomendaciones || {};
    for (const [recKey] of Object.entries(matchRecom)) {
      if (normMeal.includes(recKey.toLowerCase()) || recKey.toLowerCase().includes(normMeal)) {
        return `pre_match_day:${horario}:${recKey}`;
      }
    }
  }

  const defRecom = jugador?.recomendaciones_defecto || {};
  for (const [recKey] of Object.entries(defRecom)) {
    const rk = recKey.toLowerCase();
    if (normMeal.includes(rk) || rk.includes(normMeal)) {
      return `player_default_preference:${recKey}`;
    }
  }

  return 'menu_del_club';
}

async function run() {
  const supabase = getSupabaseAdmin();
  const teamId = 7;

  const latestMenu = await getLatestMenu(supabase, teamId);
  console.log(`[INFO] Último menú de Valencia C.F. (Equipo 7): Semana ${latestMenu?.semana} (ID: ${latestMenu?.id})`);

  // Intentamos obtener el reporte semanal de esa semana; si no, de la anterior o default
  let report = await getWeeklyReport(supabase, teamId, latestMenu?.semana);
  if (!report) {
    report = await getWeeklyReport(supabase, teamId, '2026-09-14');
  }

  const calendario = report?.meta?.calendario || {
    lunes: 'entreno',
    martes: 'partido',
    miercoles: 'descanso',
    jueves: 'entreno',
    viernes: 'entreno',
    sabado: 'entreno',
    domingo: 'partido',
  };

  const preMatchConfig = report?.meta?.preMatchConfig || {
    enabled: true,
    horario: 'tarde',
    diaPartido: 'sabado',
    partidos: {
      martes: { horario: 'noche' },
      domingo: { horario: 'noche' },
    },
  };

  console.log(`[INFO] Procesando los ${PLAYER_IDS.length} jugadores...`);

  const auditReport = [];

  for (const pid of PLAYER_IDS) {
    const rawPlayer = await getPlayerWithTeamConfig(supabase, pid);
    if (!rawPlayer) continue;

    const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, pid);
    const jugador = withLatestMeasurement(rawPlayer, evolutions || []);
    const teamConfig = jugador?.equipos?.configuracion_nutricional || {};

    const playerName = `${jugador.nombre} ${jugador.apellidos || ''}`.trim();

    // 1. Base data
    const baseData = buildBasePlanData({
      jugador,
      nombre: `Plan Semanal - ${playerName}`,
      contexto: 'semana_partido',
      calendario,
      preMatchConfig,
      menu: latestMenu,
      teamConfig,
    });

    // 2. Generar plan
    const plan = await engine.generarDatosPlan({
      jugador,
      nombre: `Plan Semanal - ${playerName}`,
      contexto: 'semana_partido',
      calendario,
      preMatchConfig,
      menu: latestMenu,
      teamConfig,
    });

    const aversiones = (jugador.aversiones || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    const intolerancias = (jugador.intolerancias || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

    const findings = [];
    const intentionalNotes = [];

    // Inspeccionar días
    for (const dayKey of DAYS) {
      const bDay = baseData.dias[dayKey];
      const gDay = plan.dias[dayKey];
      if (!gDay) continue;

      const ingestas = gDay.ingestas || [];

      // Fuentes por ingesta
      const mealSources = (bDay?.ingestas || []).map((meal) => ({
        ingesta: meal.nombre,
        fuente: sourceForMeal({
          dayKey,
          dayData: bDay,
          mealName: meal.nombre,
          preMatchConfig,
          jugador,
          baseDayTypes: calendario,
        }),
      }));

      // 1. Repetición de proteína en Comida y Cena del mismo día
      const mainMeals = ingestas.filter((i) => {
        const n = i.nombre.toLowerCase();
        return n.includes('comida') || n.includes('cena');
      });
      const mainSources = mealSources.filter((s) => {
        const n = (s.ingesta || '').toLowerCase();
        return n.includes('comida') || n.includes('cena');
      });
      const anyPreMatch = mainSources.some((s) => (s.fuente || '').startsWith('pre_match'));

      const proteinInMain = [];
      for (const m of mainMeals) {
        const detLow = (m.detalle || '').toLowerCase();
        const foundProteins = [...MEATS, ...FISH_SEAFOOD].filter((p) => detLow.includes(p));
        if (foundProteins.length > 0) {
          proteinInMain.push({ meal: m.nombre, proteins: foundProteins, text: m.detalle });
        }
      }

      if (proteinInMain.length >= 2 && !anyPreMatch) {
        const p1 = proteinInMain[0].proteins;
        const p2 = proteinInMain[1].proteins;
        const shared = p1.filter((pr) => p2.includes(pr));
        if (shared.length > 0 && !shared.includes('hamburguesa')) {
          // Comprobar la traza: ¿viene del menú o de pautas?
          const src1 = mealSources.find((s) => s.ingesta.toLowerCase().includes('comida'))?.fuente;
          const src2 = mealSources.find((s) => s.ingesta.toLowerCase().includes('cena'))?.fuente;
          findings.push({
            category: 'MONOTONÍA_PROTEÍNA_MISMO_DÍA',
            severity: 'MEDIA',
            day: dayKey,
            detail: `Misma proteína (${shared.join(', ')}) en comida y cena`,
            meals: `${proteinInMain[0].meal}: "${proteinInMain[0].text}" vs ${proteinInMain[1].meal}: "${proteinInMain[1].text}"`,
            traceAnalysis: `Fuente Comida: ${src1} | Fuente Cena: ${src2}. ¿Es bug?: Si ambas tomas son de menú, el menú del club ofreció esa proteína en ambos servicios o el selector de opciones eligió el plato con esa proteína.`,
          });
        }
      }

      // 2. Analizar cada ingesta
      for (const meal of ingestas) {
        const mName = meal.nombre || '';
        const normMName = mName.toLowerCase();
        const detalle = meal.detalle || '';
        const detLow = detalle.toLowerCase();
        const isMain = normMName.includes('comida') || normMName.includes('cena');
        const isDesayuno = normMName.includes('desayuno');
        const isMerienda = normMName.includes('merienda');
        const sourceInfo = mealSources.find((s) => s.ingesta?.toLowerCase() === normMName)?.fuente || 'unknown';

        // Parse items
        const items = detalle.split(',').map((s) => s.trim()).filter(Boolean);
        const parsedItems = items.map((str) => {
          const match = str.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s*g$/i);
          if (match) return { name: match[1].trim(), grams: parseFloat(match[2]), raw: str };
          return { name: str, grams: null, raw: str };
        });

        // 2.1 Alertas del sistema
        if (detalle.startsWith('[')) {
          findings.push({
            category: 'ALERTA_SISTEMA_PLAN',
            severity: 'ALTA',
            day: dayKey,
            meal: mName,
            detail: detalle,
            source: sourceInfo,
            traceAnalysis: 'Es un bug si el catálogo o el menú no pudo resolver opciones para esta toma.',
          });
        }

        // 2.2 Notas intencionadas por el usuario Carlos
        if (detLow.includes('colacao')) {
          intentionalNotes.push({ day: dayKey, meal: mName, text: 'Colacao presente (pautado por Carlos en recomendaciones_defecto)' });
        }
        if (playerName.includes('Danjuma') && isDesayuno && detLow.includes('leche')) {
          intentionalNotes.push({ day: dayKey, meal: mName, text: `Desayuno Danjuma: "${detalle}" (pautado en BD: "café con leche, no quiere nada más")` });
        }

        // 2.3 Pescados o carnes cocinadas pesadas en Desayuno o Merienda
        if (isDesayuno || isMerienda) {
          for (const it of parsedItems) {
            const n = it.name.toLowerCase();
            const isCookingFish = ['dorada', 'merluza', 'bacalao', 'lubina', 'emperador', 'sepia', 'pulpo', 'rodaballo', 'corvina'].some((f) => n.includes(f));
            const isCookingMeat = ['conejo', 'ternera', 'solomillo', 'secreto', 'carne picada'].some((m) => n.includes(m));
            if (isCookingFish || isCookingMeat) {
              findings.push({
                category: 'PLATO_COCINADO_EN_DESAYUNO_MERIENDA',
                severity: 'ALTA',
                day: dayKey,
                meal: mName,
                detail: `${it.name} (${it.grams}g) en ${mName}`,
                source: sourceInfo,
                traceAnalysis: `Fuente: ${sourceInfo}. Si la fuente es player_default_preference o pre_match, es una preferencia explícita. Si es fallback de árbol, es un bug de categorización.`,
                rawMeal: detalle,
              });
            }
          }
        }

        // 2.4 Huevos y claras exageradas
        if (detLow.includes('clara')) {
          const matchClaras = detLow.match(/(\d+)\s*claras?/);
          if (matchClaras && parseInt(matchClaras[1]) > 8) {
            findings.push({
              category: 'EXCESO_CLARAS_HUEVO',
              severity: 'ALTA',
              day: dayKey,
              meal: mName,
              detail: `${matchClaras[1]} claras de huevo en ${mName}`,
              source: sourceInfo,
              traceAnalysis: 'Bug de calibrador si excede los límites culinarios normales (>8 claras).',
              rawMeal: detalle,
            });
          }
        }

        // 2.5 Gramajes extremos
        for (const it of parsedItems) {
          const n = it.name.toLowerCase();
          if (isMain && it.grams && it.grams < 30) {
            const isMainCarbOrProt = ['arroz', 'pasta', 'pollo', 'pavo', 'ternera', 'merluza', 'dorada'].some((c) => n.includes(c));
            if (isMainCarbOrProt) {
              findings.push({
                category: 'PORCIÓN_DIMINUTA_PRINCIPAL',
                severity: 'MEDIA',
                day: dayKey,
                meal: mName,
                detail: `${it.name} con solo ${it.grams}g en ${mName}`,
                source: sourceInfo,
                traceAnalysis: `Fuente: ${sourceInfo}. Calibrador asignó ${it.grams}g. Puede deberse a presupuesto de hidratos o proteínas muy bajo en esa toma.`,
                rawMeal: detalle,
              });
            }
          }
          if (isMain && (n.includes('aove') || n.includes('aceite')) && it.grams > 30) {
            findings.push({
              category: 'AOVE_EXCESIVO',
              severity: 'MEDIA',
              day: dayKey,
              meal: mName,
              detail: `AOVE con ${it.grams}g en ${mName}`,
              source: sourceInfo,
              traceAnalysis: 'Calibrador de grasas asignó más de 30g de aceite puro.',
              rawMeal: detalle,
            });
          }
        }

        // 2.6 Doble cereal de plato en comida principal
        if (isMain && !sourceInfo.startsWith('pre_match')) {
          const dishCarbs = parsedItems.filter((it) => {
            const n = it.name.toLowerCase();
            return (n.includes('arroz') || n.includes('pasta') || n.includes('ñoc')) && !n.includes('leche');
          });
          if (dishCarbs.length >= 2) {
            findings.push({
              category: 'DOBLE_CEREAL_DE_PLATO',
              severity: 'ALTA',
              day: dayKey,
              meal: mName,
              detail: `Coexisten dos cereales de plato: ${dishCarbs.map((c) => c.name).join(' + ')}`,
              source: sourceInfo,
              traceAnalysis: `Fuente: ${sourceInfo}. En menú del club, ¿el primero y segundo tenían ambos arroz/pasta? O el jugador lo tiene en pauta?`,
              rawMeal: detalle,
            });
          }
        }

        // 2.7 Aversiones declaradas
        for (const av of aversiones) {
          if (av === 'verdura' && isMain) {
            const hasSaladOrVeg = parsedItems.some((it) => VEG_ITEMS.some((v) => it.name.toLowerCase().includes(v)));
            if (hasSaladOrVeg) {
              findings.push({
                category: 'AVERSION_VERDURA_IGNORADA',
                severity: 'ALTA',
                day: dayKey,
                meal: mName,
                detail: `Plato con verdura servido a jugador con aversión`,
                source: sourceInfo,
                traceAnalysis: `Jugador tiene aversión 'verdura'. Fuente: ${sourceInfo}. Si la guarnición del menú incluye verdura y no se filtró, es bug de filtro.`,
                rawMeal: detalle,
              });
            }
          }
          if (av === 'cerdo') {
            const hasPork = parsedItems.some((it) => {
              const n = it.name.toLowerCase();
              return n.includes('cerdo') || n.includes('jamón') || n.includes('jamon') || n.includes('lomo') || n.includes('presa') || n.includes('secreto');
            });
            if (hasPork) {
              findings.push({
                category: 'AVERSION_CERDO_IGNORADA',
                severity: 'CRÍTICA',
                day: dayKey,
                meal: mName,
                detail: `Alimento de cerdo asignado a jugador con aversión`,
                source: sourceInfo,
                traceAnalysis: `Jugador tiene aversión 'cerdo'. Fuente: ${sourceInfo}. Si viene de recomendaciones_defecto de Carlos, el nutricionista lo prescribió expresamente a pesar de la aversión. Si viene de menú o árbol, es un bug de exclusión.`,
                rawMeal: detalle,
              });
            }
          }
        }

        // 2.8 Intolerancias clínicas
        if (intolerancias.includes('sin_cerdo')) {
          const hasPork = parsedItems.some((it) => {
            const n = it.name.toLowerCase();
            return n.includes('cerdo') || n.includes('jamón') || n.includes('jamon') || n.includes('lomo') || n.includes('presa') || n.includes('secreto');
          });
          if (hasPork) {
            findings.push({
              category: 'INTOLERANCIA_CERDO_VIOLADA',
              severity: 'CRÍTICA',
              day: dayKey,
              meal: mName,
              detail: `Cerdo servido a jugador sin_cerdo / halal`,
              source: sourceInfo,
              traceAnalysis: `Jugador tiene intolerancia 'sin_cerdo'. Fuente: ${sourceInfo}.`,
              rawMeal: detalle,
            });
          }
        }

        if (intolerancias.includes('sin_gluten')) {
          const hasGluten = parsedItems.some((it) => {
            const n = it.name.toLowerCase();
            return (n.includes('trigo') && !n.includes('sarraceno')) || n.includes('pan blanco') || n.includes('cuscús') || n.includes('bulgur');
          });
          if (hasGluten) {
            findings.push({
              category: 'INTOLERANCIA_GLUTEN_VIOLADA',
              severity: 'CRÍTICA',
              day: dayKey,
              meal: mName,
              detail: `Alimento con gluten asignado a jugador celíaco/sin gluten`,
              source: sourceInfo,
              traceAnalysis: `Jugador celíaco/sin gluten. Fuente: ${sourceInfo}.`,
              rawMeal: detalle,
            });
          }
        }
      }
    }

    auditReport.push({
      id: pid,
      nombre: playerName,
      posicion: jugador.posicion,
      aversiones: jugador.aversiones || 'Ninguna',
      intolerancias: jugador.intolerancias || 'Ninguna',
      preferenciasCarlos: {
        tienePrepartido: Boolean(jugador.config_prepartido),
        tieneRecomendacionesDefecto: Boolean(jugador.recomendaciones_defecto),
        detallesDefecto: jugador.recomendaciones_defecto || {},
      },
      totalHallazgos: findings.length,
      hallazgos: findings,
      notasIntencionadas: intentionalNotes,
    });
  }

  // Resumen
  console.log('\n' + '='.repeat(80));
  console.log(`AUDITORÍA DE LOS 18 JUGADORES CON EL ÚLTIMO MENÚ (Semana ${latestMenu?.semana})`);
  console.log('='.repeat(80));

  const clean = auditReport.filter((p) => p.totalHallazgos === 0);
  const withFindings = auditReport.filter((p) => p.totalHallazgos > 0);

  console.log(`Total Jugadores: ${auditReport.length}`);
  console.log(`Jugadores 100% Impecables: ${clean.length} (${clean.map((p) => p.nombre).join(', ')})`);
  console.log(`Jugadores con Hallazgos: ${withFindings.length}`);

  const catCounts = {};
  for (const p of withFindings) {
    for (const h of p.hallazgos) {
      catCounts[h.category] = (catCounts[h.category] || 0) + 1;
    }
  }
  console.log('\nDesglose por categoría de anomalía:', catCounts);

  for (const p of withFindings) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`👤 [#${p.id}] ${p.nombre} (${p.posicion})`);
    console.log(`   Aversiones: ${p.aversiones} | Intolerancias: ${p.intolerancias}`);
    if (p.notasIntencionadas.length > 0) {
      console.log(`   💡 Notas intencionadas detectadas:`);
      for (const n of p.notasIntencionadas) {
        console.log(`      • [${n.day.toUpperCase()} · ${n.meal}] ${n.text}`);
      }
    }
    console.log(`   ⚠️ Hallazgos (${p.hallazgos.length}):`);
    for (const h of p.hallazgos) {
      console.log(`      [${h.severity}] [${h.category}] ${h.day?.toUpperCase()} · ${h.meal || ''}`);
      console.log(`         Detalle: ${h.detail}`);
      if (h.meals) console.log(`         Platos: ${h.meals}`);
      if (h.rawMeal) console.log(`         Toma completa: "${h.rawMeal}"`);
      console.log(`         Traza & Veredicto: ${h.traceAnalysis}`);
    }
  }

  const outPath = path.join(process.cwd(), 'scripts', 'output_audit_18_valencia.json');
  fs.writeFileSync(outPath, JSON.stringify(auditReport, null, 2), 'utf8');
  console.log(`\n[SUCCESS] Auditoría completa guardada en ${outPath}`);
}

run().catch(console.error);
