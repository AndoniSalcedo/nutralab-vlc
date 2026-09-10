import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { generarDatosPlan } from '@/lib/ai/plan-generator';
import { findFoodInCatalog, parseMealItem } from '@/lib/nutrition/calculator';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import { formatClinicalTags } from '@/config/clinical-tags';
import WeeklySquadReportDocument from '@/components/reports/WeeklySquadReportDocument';

import { getPlayersByTeam } from '@/repositories/playerRepository';
import { getTeamById } from '@/repositories/teamRepository';
import { getEvolutionsByPlayerIds } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerIds } from '@/repositories/pesajeRepository';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';
import { getWeeklyReport } from '@/repositories/weeklyReportsRepository';

const SCRATCH_DIR = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/031498f3-0811-4b4f-b926-9355b2b66ec5/scratch';
const OUTPUT_PDF_PATH = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/031498f3-0811-4b4f-b926-9355b2b66ec5/informe_plantilla_simulado.pdf';
const PLANS_JSON_PATH = path.join(SCRATCH_DIR, 'squad_plans_full.json');
const AUDIT_JSON_PATH = path.join(SCRATCH_DIR, 'audit_results.json');

function parseMeal(mealDetailStr) {
  if (!mealDetailStr || typeof mealDetailStr !== 'string') return [];
  const rawParts = mealDetailStr.split(',').map((s) => s.trim()).filter(Boolean);
  return rawParts.map((part) => parseMealItem(part)).filter(Boolean);
}

function canonicalizeMealDetail(mealStr) {
  if (!mealStr) return mealStr;
  const parts = mealStr.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.map((p) => {
    const parsed = parseMealItem(p);
    if (!parsed) return p;
    if (parsed.hasUnits) {
      const u = parsed.unitCount === 1 ? '1 unidad' : `${parsed.unitCount} unidades`;
      return parsed.grams ? `${parsed.name} ${u} (${parsed.grams}g)` : `${parsed.name} ${u}`;
    }
    return `${parsed.name} ${parsed.grams}g`;
  }).join(', ');
}

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

// Lista de palabras clave que denotan platos cocinados o compuestos no desglosados
// (Salmorejo y Salsa boloñesa son considerados válidos como sopas frías o salsas por el usuario)
const COMPOUND_DISH_KEYWORDS = [
  'arroz al horno',
  'arroz 3 delicias',
  'arroz tres delicias',
  'arroz meloso',
  'lasaña',
  'all i pebre',
  'crema de',
  'guiso',
  'estofado',
  'paella',
  'fideua',
  'fideuà',
  'croqueta',
  'croquetas',
  'albondiga',
  'albondigas',
  'albóndiga',
  'albóndigas',
  'puré de',
  'pure de',
  'ensalada cesar',
  'ensalada césar',
  'pollo con salsa',
  'pollo teriyaki',
  'pollo asado',
  'nugget',
  'nuggets',
  'empanad',
  'secreto ibérico',
  'secreto iberico',
];

// Familias de proteínas para detectar repetición comida vs cena en el mismo día
function getProteinFamily(foodName) {
  const norm = String(foodName || '').toLowerCase();
  if (norm.includes('ternera') || norm.includes('vacuno') || norm.includes('buey') || norm.includes('solomillo de ternera') || norm.includes('entrecot')) return 'vacuno';
  if (norm.includes('pollo')) return 'pollo';
  if (norm.includes('pavo')) return 'pavo';
  if (norm.includes('cerdo') || norm.includes('lomo') || norm.includes('secreto') || norm.includes('jamón')) return 'cerdo';
  if (norm.includes('conejo')) return 'conejo';
  if (norm.includes('merluza') || norm.includes('dorada') || norm.includes('lubina') || norm.includes('bacalao') || norm.includes('lenguado') || norm.includes('rape') || norm.includes('corvina')) return 'pescado_blanco';
  if (norm.includes('salmón') || norm.includes('salmon') || norm.includes('atún') || norm.includes('atun') || norm.includes('bonito') || norm.includes('emperador')) return 'pescado_azul';
  if (norm.includes('sepia') || norm.includes('calamar') || norm.includes('pulpo') || norm.includes('gamba') || norm.includes('langostino')) return 'marisco';
  if (norm.includes('huevo') || norm.includes('clara')) return 'huevos';
  return null;
}

// Bases pesadas de hidratos para detectar competición en la misma ingesta
function getCerealBase(foodName) {
  const norm = String(foodName || '').toLowerCase();
  if (norm.includes('arroz')) return 'arroz';
  if (norm.includes('pasta') || norm.includes('espagueti') || norm.includes('macarron') || norm.includes('fideo')) return 'pasta';
  if (norm.includes('cuscus') || norm.includes('cuscús')) return 'cuscus';
  if (norm.includes('quinoa')) return 'quinoa';
  if (norm.includes('avena')) return 'avena';
  if (norm.includes('gnocchi') || norm.includes('ñoqui')) return 'gnocchi';
  return null;
}

async function runWithConcurrency(items, limit, fn) {
  const results = [];
  const index = { current: 0 };

  async function worker() {
    while (index.current < items.length) {
      const curIndex = index.current++;
      results[curIndex] = await fn(items[curIndex], curIndex);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function runSquadAudit() {
  console.log('========================================================================');
  console.log('INICIANDO AUDITORÍA INTEGRAL JUGADOR A JUGADOR (28 JUGADORES)');
  console.log('========================================================================\n');

  const supabase = getSupabaseAdmin();
  const teamId = 7;
  const semana = '2026-09-07';

  const team = await getTeamById(supabase, teamId);
  const rawPlayers = await getPlayersByTeam(supabase, teamId);
  const playerIds = rawPlayers.map((p) => p.id);

  console.log(`[Carga] Cargando mediciones, evoluciones, pesajes y menú para ${rawPlayers.length} jugadores...`);
  const [evoluciones, pesajes, menu, storedReport] = await Promise.all([
    getEvolutionsByPlayerIds(supabase, playerIds),
    getPesajesByPlayerIds(supabase, playerIds),
    getMenuByWeekAndTeam(supabase, semana, teamId),
    getWeeklyReport(supabase, teamId, semana),
  ]);

  const calendario = {
    lunes: 'recuperacion',
    martes: 'entreno',
    miercoles: 'entreno',
    jueves: 'entreno',
    viernes: 'partido',
    sabado: 'recuperacion',
    domingo: 'entreno',
  };

  const preMatchConfig = {
    enabled: true,
    horario: 'tarde',
    diaPartido: 'viernes',
    partidos: {
      viernes: { horario: 'noche' },
    },
  };

  const contexto = 'semana_partido';
  const meta = {
    ...(storedReport?.meta || {}),
    title: storedReport?.meta?.title || 'Semana 7-13 Septiembre',
    team: team.nombre,
    semana,
    contexto,
    calendario,
    preMatchConfig,
  };

  const playersWithMetrics = rawPlayers.map((rawPlayer) => {
    const pEvol = (evoluciones || []).filter((item) => String(item.jugador_id) === String(rawPlayer.id));
    const pPesajes = (pesajes || []).filter((item) => String(item.jugador_id) === String(rawPlayer.id));
    return withLatestMeasurement(rawPlayer, pEvol, pPesajes);
  });

  let resolvedPlayers = null;
  if (fs.existsSync(PLANS_JSON_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(PLANS_JSON_PATH, 'utf8'));
      if (Array.isArray(cached) && cached.length === playersWithMetrics.length && cached.every((p) => p.plan && p.plan.dias)) {
        console.log(`[Cache] Utilizando los ${cached.length} planes ya generados y guardados en ${PLANS_JSON_PATH}`);
        resolvedPlayers = cached;
      }
    } catch (cErr) {
      console.warn('No se pudo cargar la caché:', cErr.message);
    }
  }

  if (!resolvedPlayers) {
    console.log(`\n--- Generando planes en memoria para toda la plantilla (concurrencia: 4) ---`);
    const tStart = Date.now();

    resolvedPlayers = await runWithConcurrency(playersWithMetrics, 4, async (player, idx) => {
      const fullName = `${player.nombre} ${player.apellidos || ''}`.trim();
      const t0 = Date.now();
      try {
        const planData = await generarDatosPlan({
          jugador: player,
          nombre: `Plan ${semana}`,
          contexto,
          menu,
          calendario,
          preMatchConfig,
          teamConfig: team.configuracion_nutricional,
        });
        const dur = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`[${idx + 1}/28] OK: ${fullName} (${dur}s) - Lunes kcal: ${planData?.dias?.lunes?.kcal || 'NULL'}`);
        return {
          ...player,
          plan: planData,
        };
      } catch (err) {
        console.error(`❌ ERROR generando ${fullName}:`, err.message);
        return {
          ...player,
          plan: null,
        };
      }
    });

    console.log(`\nGeneración de plantilla finalizada en ${((Date.now() - tStart) / 1000).toFixed(1)}s.`);
    fs.writeFileSync(PLANS_JSON_PATH, JSON.stringify(resolvedPlayers, null, 2));
    console.log(`[Storage] Planes completos guardados en: ${PLANS_JSON_PATH}`);
  }

  // Asegurar nombres canónicos oficiales en todos los detalles de comidas
  resolvedPlayers.forEach((p) => {
    if (!p.plan?.dias) return;
    Object.values(p.plan.dias).forEach((dia) => {
      (dia.ingestas || []).forEach((ing) => {
        if (ing.detalle) {
          ing.detalle = canonicalizeMealDetail(ing.detalle);
        }
      });
    });
  });
  fs.writeFileSync(PLANS_JSON_PATH, JSON.stringify(resolvedPlayers, null, 2));

  // ========================================================================
  // AUDITORÍA JUGADOR A JUGADOR
  // ========================================================================
  console.log('\n========================================================================');
  console.log('AUDITORÍA EXHAUSTIVA DE CUMPLIMIENTO NUTRICIONAL Y CLÍNICO');
  console.log('========================================================================\n');

  const auditReport = {
    totalPlayers: resolvedPlayers.length,
    timestamp: new Date().toISOString(),
    globalFindings: {
      totalCompoundDishViolations: 0,
      totalUnmatchedFoods: 0,
      totalSameDayProteinRepeats: 0,
      totalCompetingCarbBases: 0,
      totalClinicalViolations: 0,
      totalAnomalousGrams: 0,
      ensureCount: 0,
    },
    playerAudits: [],
  };

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  for (const player of resolvedPlayers) {
    const fullName = `${player.nombre} ${player.apellidos || ''}`.trim();
    const playerAudit = {
      id: player.id,
      name: fullName,
      peso_kg: player.peso_kg,
      objetivo: player.objetivo,
      alergias_intolerancias: formatClinicalTags(player.intolerancias || player.alergias),
      aversiones: player.aversiones || '',
      issues: [],
      metricsOk: true,
      dayAudits: {},
    };

    if (!player.plan || !player.plan.dias) {
      playerAudit.issues.push({
        severity: 'CRITICAL',
        category: 'PLAN_MISSING',
        message: 'El jugador no tiene plan semanal generado.',
      });
      auditReport.playerAudits.push(playerAudit);
      continue;
    }

    const clinicalCatalog = getClinicalCatalogForPlayer(player);
    const activeTagsSet = new Set(clinicalCatalog.activeTags);
    const isLactose = activeTagsSet.has('sin_lactosa');
    const isCowProtein = activeTagsSet.has('sin_proteina_vaca');
    const isFructose = activeTagsSet.has('sin_fructosa');
    const isPork = activeTagsSet.has('sin_cerdo');
    const isFish = activeTagsSet.has('sin_pescado') || activeTagsSet.has('sin_marisco');
    const isGluten = activeTagsSet.has('sin_gluten');

    // Revisar cada día de la semana
    for (const dayKey of daysOfWeek) {
      const dayData = player.plan.dias[dayKey];
      if (!dayData) {
        playerAudit.issues.push({
          severity: 'HIGH',
          category: 'MISSING_DAY',
          message: `Día ${dayKey} no encontrado en el plan.`,
        });
        continue;
      }

      if (!dayData.kcal || isNaN(dayData.kcal)) {
        playerAudit.metricsOk = false;
        playerAudit.issues.push({
          severity: 'HIGH',
          category: 'NULL_MACROS',
          message: `Día ${dayKey} tiene kcal nulas o no calculadas.`,
        });
      }

      const ingestas = dayData.ingestas || [];
      const daySummary = {
        tipoDia: dayData.tipoDia,
        kcal: dayData.kcal,
        proteina: dayData.proteina,
        hidratos: dayData.hidratos,
        grasa: dayData.grasa,
        comidaProtein: null,
        cenaProtein: null,
        competingBases: [],
        unmatchedItems: [],
        compoundDishes: [],
        clinicalAlerts: [],
        anomalousGrams: [],
      };

      for (const meal of ingestas) {
        const mealName = meal.nombre || '';
        const mealDetail = meal.detalle || '';
        const isComida = mealName.toLowerCase().includes('comida');
        const isCena = mealName.toLowerCase().includes('cena');

        // Check "Ensure"
        if (mealDetail.toLowerCase().includes('ensure')) {
          auditReport.globalFindings.ensureCount++;
          playerAudit.issues.push({
            severity: 'HIGH',
            category: 'ENSURE_HALLUCINATION',
            message: `Mención indebida de Ensure en ${dayKey} (${mealName}): "${mealDetail}"`,
          });
        }

        // 1. Check Platos compuestos no desglosados
        for (const kw of COMPOUND_DISH_KEYWORDS) {
          if (mealDetail.toLowerCase().includes(kw)) {
            // Verificar si está acompañado de gramos directamente sobre el plato
            const regex = new RegExp(`${kw}\\s*\\d+\\s*g`, 'i');
            const isCompoundAsGram = regex.test(mealDetail) || mealDetail.toLowerCase().startsWith(kw);
            if (isCompoundAsGram) {
              daySummary.compoundDishes.push({ meal: mealName, keyword: kw, text: mealDetail });
              auditReport.globalFindings.totalCompoundDishViolations++;
              playerAudit.issues.push({
                severity: 'MEDIUM',
                category: 'PLATO_COMPUESTO',
                message: `Plato compuesto sin desglosar en ${dayKey} (${mealName}): "${kw}" en "${mealDetail}"`,
              });
            }
          }
        }

        // 2. Check Alimentos del Catálogo y Parseo
        const parsedItems = parseMeal(mealDetail);
        const cerealBasesInMeal = [];

        for (const item of parsedItems) {
          const matched = findFoodInCatalog(item.name);
          if (!matched) {
            daySummary.unmatchedItems.push({ meal: mealName, food: item.name, grams: item.grams });
            auditReport.globalFindings.totalUnmatchedFoods++;
            playerAudit.issues.push({
              severity: 'LOW',
              category: 'ALIMENTO_FUERA_CATALOGO',
              message: `Alimento no encontrado directamente en catálogo en ${dayKey} (${mealName}): "${item.name}" (${item.grams}g)`,
            });
          }

          // Check Gramajes anómalos de proteína
          const protFam = getProteinFamily(item.name);
          if (protFam && (isComida || isCena)) {
            if (item.grams > 0 && item.grams < 85 && protFam !== 'huevos') {
              daySummary.anomalousGrams.push({ meal: mealName, food: item.name, grams: item.grams, reason: 'demasiado_bajo' });
              auditReport.globalFindings.totalAnomalousGrams++;
              playerAudit.issues.push({
                severity: 'MEDIUM',
                category: 'GRAMAJE_ANOMALO',
                message: `Ración de proteína sospechosamente baja en ${dayKey} (${mealName}): ${item.name} ${item.grams}g (<85g)`,
              });
            } else if (item.grams > 360) {
              daySummary.anomalousGrams.push({ meal: mealName, food: item.name, grams: item.grams, reason: 'excesivo' });
              auditReport.globalFindings.totalAnomalousGrams++;
              playerAudit.issues.push({
                severity: 'MEDIUM',
                category: 'GRAMAJE_ANOMALO',
                message: `Ración de proteína excesiva en ${dayKey} (${mealName}): ${item.name} ${item.grams}g (>360g)`,
              });
            }

            if (isComida && !daySummary.comidaProtein) daySummary.comidaProtein = protFam;
            if (isCena && !daySummary.cenaProtein) daySummary.cenaProtein = protFam;
          }

          // Check bases compitiendo
          const cBase = getCerealBase(item.name);
          if (cBase && (isComida || isCena)) {
            cerealBasesInMeal.push(cBase);
          }

          // Check seguridad clínica bidireccional
          const itemLower = item.name.toLowerCase();
          if (isPork && (itemLower.includes('cerdo') || itemLower.includes('jamón') || itemLower.includes('jamon') || itemLower.includes('secreto') || itemLower.includes('lomo de cerdo'))) {
            daySummary.clinicalAlerts.push({ meal: mealName, food: item.name, violation: 'cerdo' });
            auditReport.globalFindings.totalClinicalViolations++;
            playerAudit.issues.push({
              severity: 'HIGH',
              category: 'SEGURIDAD_CLINICA',
              message: `Violación de restricción de cerdo en ${dayKey} (${mealName}): servido "${item.name}"`,
            });
          }
          if (isFish && (protFam === 'pescado_blanco' || protFam === 'pescado_azul' || protFam === 'marisco')) {
            daySummary.clinicalAlerts.push({ meal: mealName, food: item.name, violation: 'pescado_marisco' });
            auditReport.globalFindings.totalClinicalViolations++;
            playerAudit.issues.push({
              severity: 'HIGH',
              category: 'SEGURIDAD_CLINICA',
              message: `Violación de alergia a pescado/marisco en ${dayKey} (${mealName}): servido "${item.name}"`,
            });
          }
          const isPlantMilk = itemLower.includes('de almendra') || itemLower.includes('de soja') || itemLower.includes('de avena') || itemLower.includes('de coco');
          if (isLactose && (itemLower.includes('queso') || itemLower.includes('leche') || itemLower.includes('yogur')) && !itemLower.includes('sin lactosa') && !isPlantMilk) {
            daySummary.clinicalAlerts.push({ meal: mealName, food: item.name, violation: 'lactosa' });
            auditReport.globalFindings.totalClinicalViolations++;
            playerAudit.issues.push({
              severity: 'HIGH',
              category: 'SEGURIDAD_CLINICA',
              message: `Posible lácteo con lactosa para intolerante en ${dayKey} (${mealName}): servido "${item.name}"`,
            });
          }
          if (isCowProtein && (itemLower.includes('queso') || itemLower.includes('leche') || itemLower.includes('yogur') || itemLower.includes('kéfir') || itemLower.includes('mantequilla') || itemLower.includes('requesón') || itemLower.includes('skyr') || itemLower.includes('caseína') || itemLower.includes('suero')) && !isPlantMilk && !itemLower.includes('vegetal')) {
            daySummary.clinicalAlerts.push({ meal: mealName, food: item.name, violation: 'proteina_vaca' });
            auditReport.globalFindings.totalClinicalViolations++;
            playerAudit.issues.push({
              severity: 'HIGH',
              category: 'SEGURIDAD_CLINICA',
              message: `Lácteo/derivado bovino servido a jugador con APLV en ${dayKey} (${mealName}): "${item.name}"`,
            });
          }
          if (isFructose && (itemLower.includes('miel') || itemLower.includes('manzana') || itemLower.includes('pera') || itemLower.includes('mango') || itemLower.includes('sandía') || itemLower.includes('dátil') || itemLower.includes('desecada'))) {
            daySummary.clinicalAlerts.push({ meal: mealName, food: item.name, violation: 'fructosa' });
            auditReport.globalFindings.totalClinicalViolations++;
            playerAudit.issues.push({
              severity: 'HIGH',
              category: 'SEGURIDAD_CLINICA',
              message: `Alimento rico en fructosa para intolerante a fructosa en ${dayKey} (${mealName}): "${item.name}"`,
            });
          }
          if (isGluten && (itemLower.includes('pasta de trigo') || itemLower.includes('pan blanco') || itemLower.includes('pan de barra') || itemLower.includes('cuscús'))) {
            daySummary.clinicalAlerts.push({ meal: mealName, food: item.name, violation: 'gluten' });
            auditReport.globalFindings.totalClinicalViolations++;
            playerAudit.issues.push({
              severity: 'HIGH',
              category: 'SEGURIDAD_CLINICA',
              message: `Alimento con gluten para celiaco/intolerante en ${dayKey} (${mealName}): servido "${item.name}"`,
            });
          }
          if (!isGluten && itemLower.includes('sin gluten')) {
            auditReport.globalFindings.totalClinicalViolations++;
            playerAudit.issues.push({
              severity: 'HIGH',
              category: 'SEGURIDAD_CLINICA',
              message: `Producto "sin gluten" prescrito innecesariamente a jugador tolerante en ${dayKey} (${mealName}): "${item.name}"`,
            });
          }
          if (!isLactose && itemLower.includes('sin lactosa')) {
            auditReport.globalFindings.totalClinicalViolations++;
            playerAudit.issues.push({
              severity: 'HIGH',
              category: 'SEGURIDAD_CLINICA',
              message: `Producto "sin lactosa" prescrito innecesariamente a jugador tolerante en ${dayKey} (${mealName}): "${item.name}"`,
            });
          }
        }

        // Check if competing cereal bases in the same meal
        const uniqueBases = [...new Set(cerealBasesInMeal)];
        if (uniqueBases.length > 1) {
          daySummary.competingBases.push({ meal: mealName, bases: uniqueBases });
          auditReport.globalFindings.totalCompetingCarbBases++;
          playerAudit.issues.push({
            severity: 'MEDIUM',
            category: 'BASES_COMPITIENDO',
            message: `Dos bases de cereal compitiendo en ${dayKey} (${mealName}): ${uniqueBases.join(' + ')}`,
          });
        }
      }

      // 3. Check Repetición de Proteína en el mismo día (Comida vs Cena)
      if (daySummary.comidaProtein && daySummary.cenaProtein && daySummary.comidaProtein === daySummary.cenaProtein) {
        auditReport.globalFindings.totalSameDayProteinRepeats++;
        playerAudit.issues.push({
          severity: 'LOW',
          category: 'REPETICION_PROTEINA',
          message: `Repetición de familia de proteína en ${dayKey}: Comida (${daySummary.comidaProtein}) y Cena (${daySummary.cenaProtein})`,
        });
      }

      playerAudit.dayAudits[dayKey] = daySummary;
    }

    auditReport.playerAudits.push(playerAudit);
  }

  // Guardar resultados de auditoría en JSON
  fs.writeFileSync(AUDIT_JSON_PATH, JSON.stringify(auditReport, null, 2));
  console.log(`[Audit] Informe de auditoría guardado en: ${AUDIT_JSON_PATH}\n`);

  // ========================================================================
  // RESUMEN TERMINAL DE LA AUDITORÍA
  // ========================================================================
  console.log('========================================================================');
  console.log('RESUMEN GLOBAL DE RESULTADOS');
  console.log('========================================================================');
  console.log(`- Total Jugadores Auditados: ${auditReport.totalPlayers}`);
  console.log(`- Menciones de "Ensure" en toda la plantilla: ${auditReport.globalFindings.ensureCount}`);
  console.log(`- Platos compuestos no desglosados: ${auditReport.globalFindings.totalCompoundDishViolations}`);
  console.log(`- Alimentos fuera de catálogo directo: ${auditReport.globalFindings.totalUnmatchedFoods}`);
  console.log(`- Repeticiones de proteína (Comida vs Cena en el mismo día): ${auditReport.globalFindings.totalSameDayProteinRepeats}`);
  console.log(`- Conflictos de bases de hidratos compitiendo: ${auditReport.globalFindings.totalCompetingCarbBases}`);
  console.log(`- Violaciones de seguridad clínica (alergias/intolerancias): ${auditReport.globalFindings.totalClinicalViolations}`);
  console.log(`- Raciones de proteína anómalas (<85g o >360g): ${auditReport.globalFindings.totalAnomalousGrams}`);

  // Listar jugadores con incidencias destacadas
  const playersWithIssues = auditReport.playerAudits.filter((p) => p.issues.length > 0);
  console.log(`\nJugadores con observaciones o incidencias: ${playersWithIssues.length} / ${auditReport.totalPlayers}`);

  for (const p of playersWithIssues) {
    console.log(`\n▶ [${p.id}] ${p.name} (${p.peso_kg}kg | Obj: ${p.objetivo})`);
    if (p.alergias_intolerancias) console.log(`   Clínica: ${p.alergias_intolerancias}`);
    p.issues.forEach((iss) => {
      console.log(`   [${iss.severity}] [${iss.category}] ${iss.message}`);
    });
  }

  // Generar PDF actualizado de toda la plantilla
  console.log('\n--- Renderizando PDF final actualizado de la plantilla ---');
  const validPlayers = resolvedPlayers.filter((p) => p.plan);
  const stream = await renderToStream(
    <WeeklySquadReportDocument
      meta={{ ...meta, semana }}
      players={validPlayers}
      teamConfig={team.configuracion_nutricional}
    />
  );

  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  fs.writeFileSync(OUTPUT_PDF_PATH, buffer);
  console.log(`\n✅ PDF generado exitosamente en: ${OUTPUT_PDF_PATH} (${(buffer.length / 1024).toFixed(1)} KB, ${validPlayers.length} jugadores)`);
}

runSquadAudit().catch((err) => {
  console.error('Error fatal en auditoría:', err);
  process.exit(1);
});
