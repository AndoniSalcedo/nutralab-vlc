import fs from 'node:fs';
import path from 'node:path';

const BASE_DIR = path.join(process.cwd(), 'scripts', 'output_carlos_generation');
const allPlansPath = path.join(BASE_DIR, 'all_players_plans.json');
const allTracesPath = path.join(BASE_DIR, 'all_players_traces.json');

const plansData = JSON.parse(fs.readFileSync(allPlansPath, 'utf8'));
const tracesData = JSON.parse(fs.readFileSync(allTracesPath, 'utf8'));

const TEAMS = ['team_7_valencia', 'team_8_futbol_elite'];

const CONDIMENT_CAPS = {
  'ajo': 15,
  'aove': 45,
  'aceite de oliva': 45,
  'sal': 5,
  'vinagre': 30,
  'mostaza': 30,
};

const MAIN_MEALS = ['comida', 'cena'];

const results = [];

for (const teamKey of TEAMS) {
  const teamPlans = plansData[teamKey] || {};
  const teamTraces = tracesData[teamKey] || {};

  for (const [playerId, plan] of Object.entries(teamPlans)) {
    const trace = teamTraces[playerId] || {};
    const jugador = plan.jugador || trace.jugador || {};
    const pName = jugador.nombre || `Player ${playerId}`;
    const pId = jugador.id || playerId;
    const teamName = teamKey === 'team_7_valencia' ? 'Valencia C.F.' : 'Fútbol élite';

    const playerAnomalies = [];
    const playerPrescriptions = [];

    // Inspeccionar cada día
    const dias = plan.dias || {};
    for (const [dayKey, dayData] of Object.entries(dias)) {
      const _dayType = dayData.tipoDia || 'entreno';
      const dayTrace = trace.etapa2_plan_base_y_presupuestos?.calendarioDias?.[dayKey] || {};
      const mealSources = trace.etapa3_fuentes_de_resolucion?.[dayKey] || [];

      for (const meal of dayData.ingestas || []) {
        const mName = meal.nombre || '';
        const normMName = mName.toLowerCase();
        const isMain = MAIN_MEALS.some((m) => normMName.includes(m));
        const detalle = meal.detalle || '';
        const sourceInfo = mealSources.find((s) => s.ingesta?.toLowerCase() === normMName)?.fuente || 'unknown';

        // Parsear items: "Dorada 235g, Tomate 80g..."
        const rawItems = detalle.split(',').map((s) => s.trim()).filter(Boolean);
        const parsedItems = rawItems.map((itemStr) => {
          const match = itemStr.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s*g$/i);
          if (match) {
            return { name: match[1].trim(), grams: parseFloat(match[2]), raw: itemStr };
          }
          return { name: itemStr, grams: null, raw: itemStr };
        });

        // 1. Detección de gramajes anómalos de condimentos/aromas
        for (const it of parsedItems) {
          const lowerName = it.name.toLowerCase();
          for (const [condiment, maxGrams] of Object.entries(CONDIMENT_CAPS)) {
            if (lowerName === condiment || lowerName.startsWith(`${condiment} `) || lowerName.endsWith(` ${condiment}`)) {
              if (it.grams && it.grams > maxGrams) {
                playerAnomalies.push({
                  day: dayKey,
                  meal: mName,
                  type: 'EXCESSIVE_CONDIMENT_GRAMS',
                  detail: `${it.name} con ${it.grams}g (máximo lógico ~${maxGrams}g)`,
                  source: sourceInfo,
                  rawMeal: detalle,
                });
              }
            }
          }

          // Gramajes desorbitados en general (>600g de un solo alimento sólido)
          if (it.grams && it.grams > 600 && !lowerName.includes('agua') && !lowerName.includes('leche') && !lowerName.includes('caldo')) {
            playerAnomalies.push({
              day: dayKey,
              meal: mName,
              type: 'EXTREME_PORTION_SIZE',
              detail: `${it.name} con ${it.grams}g en una sola toma`,
              source: sourceInfo,
              rawMeal: detalle,
            });
          }

          // Detección de alimentos prescritos específicos (Cola Cao, suplementos, etc.)
          if (lowerName.includes('colacao') || lowerName.includes('cola cao') || lowerName.includes('cacao')) {
            playerPrescriptions.push({
              day: dayKey,
              meal: mName,
              food: it.name,
              source: sourceInfo,
              isIntentional: sourceInfo.includes('recommendation') || sourceInfo.includes('pre_match') || sourceInfo.includes('fixed'),
            });
          }
        }

        // 2. Comprobación en Comida / Cena: Carbohidratos y Proteínas
        if (isMain) {
          const hasCarbBase = parsedItems.some((it) => {
            const n = it.name.toLowerCase();
            return n.includes('arroz') || n.includes('pasta') || n.includes('patata') ||
                   n.includes('boniato') || n.includes('ñoc') || n.includes('quinoa') ||
                   n.includes('cuscús') || n.includes('cuscus') || n.includes('bulgur') ||
                   n.includes('pan ') || n.includes('panes') || n.includes('legumbre') ||
                   n.includes('lenteja') || n.includes('garbanzo') || n.includes('alubia');
          });

          const hasProteinBase = parsedItems.some((it) => {
            const n = it.name.toLowerCase();
            return n.includes('pollo') || n.includes('pavo') || n.includes('ternera') ||
                   n.includes('dorada') || n.includes('merluza') || n.includes('bacalao') ||
                   n.includes('salmón') || n.includes('salmon') || n.includes('atún') ||
                   n.includes('atun') || n.includes('lubina') || n.includes('conejo') ||
                   n.includes('cerdo') || n.includes('presa') || n.includes('solomillo') ||
                   n.includes('huevo') || n.includes('tofu') || n.includes('soja') ||
                   n.includes('corvina') || n.includes('lenguado') || n.includes('sepia') ||
                   n.includes('calamar') || n.includes('gambas') || n.includes('langostino') ||
                   n.includes('rape') || n.includes('trucha') || n.includes('burger');
          });

          if (!hasProteinBase) {
            playerAnomalies.push({
              day: dayKey,
              meal: mName,
              type: 'MISSING_PROTEIN_IN_MAIN_MEAL',
              detail: `Comida principal sin fuente de proteína evidente`,
              source: sourceInfo,
              rawMeal: detalle,
            });
          }

          const targetHc = dayTrace.repartoIngestas?.find((r) => r.nombre?.toLowerCase() === normMName)?.target?.hc || 0;
          if (targetHc > 70 && !hasCarbBase) {
            playerAnomalies.push({
              day: dayKey,
              meal: mName,
              type: 'MISSING_PRIMARY_CARB_IN_HIGH_HC_MEAL',
              detail: `Target de HC es ${targetHc}g pero no hay cereal/tubérculo base (posible inflado de verdura/fruta)`,
              source: sourceInfo,
              rawMeal: detalle,
            });
          }

          for (const it of parsedItems) {
            const n = it.name.toLowerCase();
            if (n.includes('avena') || n.includes('muesli') || n.includes('corn flakes') || n.includes('chocapic')) {
              playerAnomalies.push({
                day: dayKey,
                meal: mName,
                type: 'BREAKFAST_ITEM_IN_MAIN_MEAL',
                detail: `${it.name} presente en ${mName}`,
                source: sourceInfo,
                rawMeal: detalle,
              });
            }
          }
        }

        // 3. Comprobación de Alimentos Incompatibles con Intolerancias
        const intolerances = Array.isArray(jugador.intolerancias) ? jugador.intolerancias : [jugador.intolerancias].filter(Boolean);
        const aversions = Array.isArray(jugador.aversiones) ? jugador.aversiones : [jugador.aversiones].filter(Boolean);

        for (const it of parsedItems) {
          const n = it.name.toLowerCase();
          if ((intolerances.includes('sin_cerdo') || aversions.some((a) => a.toLowerCase().includes('cerdo'))) &&
              (n.includes('cerdo') || n.includes('jamón') || n.includes('jamon') || n.includes('lomo') || n.includes('presa'))) {
            playerAnomalies.push({
              day: dayKey,
              meal: mName,
              type: 'PORK_LEAK_IN_RESTRICTED_PLAYER',
              detail: `${it.name} encontrado en jugador con restricción de cerdo`,
              source: sourceInfo,
              rawMeal: detalle,
            });
          }
        }
      }
    }

    results.push({
      id: pId,
      nombre: pName,
      equipo: teamName,
      totalAnomalias: playerAnomalies.length,
      anomalias: playerAnomalies,
      prescripciones: playerPrescriptions,
    });
  }
}

// Resumen agrupado
console.log('='.repeat(80));
console.log('AUDITORÍA PROFUNDA DE INCOHERENCIAS JUGADOR POR JUGADOR (41 JUGADORES)');
console.log('='.repeat(80));

let playersWithAnomalies = 0;
const anomalyTypeCounts = {};

for (const p of results) {
  if (p.totalAnomalias > 0) {
    playersWithAnomalies++;
    console.log(`\n🔴 [${p.equipo}] ${p.nombre} (ID: ${p.id}) · ${p.totalAnomalias} anomalía(s):`);
    for (const a of p.anomalias) {
      console.log(`   - [${a.day.toUpperCase()} · ${a.meal}] (${a.type}) [Fuente: ${a.source}]`);
      console.log(`     Detalle: ${a.detail}`);
      console.log(`     Plato: "${a.rawMeal}"`);
      anomalyTypeCounts[a.type] = (anomalyTypeCounts[a.type] || 0) + 1;
    }
  } else {
    console.log(`🟢 [${p.equipo}] ${p.nombre} (ID: ${p.id}): Sin anomalías detectadas.`);
  }

  if (p.prescripciones.length > 0) {
    console.log(`   ℹ️ Prescripciones especiales detectadas:`);
    for (const pr of p.prescripciones) {
      console.log(`     • ${pr.food} en ${pr.day} ${pr.meal} (Fuente: ${pr.source}, Intencional: ${pr.isIntentional})`);
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log(`RESUMEN GLOBAL:`);
console.log(`- Jugadores analizados: ${results.length}`);
console.log(`- Jugadores con alertas: ${playersWithAnomalies}`);
console.log(`- Desglose por tipo de anomalía:`, anomalyTypeCounts);
console.log('='.repeat(80));

fs.writeFileSync(
  path.join(BASE_DIR, 'auditoria_detallada_jugadores.json'),
  JSON.stringify(results, null, 2),
  'utf8'
);
console.log(`Informe detallado guardado en scripts/output_carlos_generation/auditoria_detallada_jugadores.json`);
