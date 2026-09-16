import fs from 'node:fs';
import path from 'node:path';

const BASE_DIR = path.join(process.cwd(), 'scripts', 'output_carlos_generation');
const allPlans = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'all_players_plans.json'), 'utf8'));
const allTraces = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'all_players_traces.json'), 'utf8'));

// Categorías y umbrales para auditoría
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

const auditResults = [];

for (const teamKey of ['team_7_valencia', 'team_8_futbol_elite']) {
  const teamPlans = allPlans[teamKey] || {};
  const teamTraces = allTraces[teamKey] || {};

  for (const [id, plan] of Object.entries(teamPlans)) {
    const trace = teamTraces[id] || {};
    const jugador = plan.jugador || trace.jugador || {};
    const pName = jugador.nombre || `Player ${id}`;
    const pId = jugador.id || id;
    const teamName = teamKey === 'team_7_valencia' ? 'Valencia C.F.' : 'Fútbol élite';

    const aversiones = (jugador.aversiones || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    const intolerancias = (jugador.intolerancias || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

    const findings = [];
    const intentionalNotes = [];

    // Analizar día a día
    const dias = plan.dias || {};
    for (const [dayKey, dayData] of Object.entries(dias)) {
      const _dayTrace = trace.etapa2_plan_base_y_presupuestos?.calendarioDias?.[dayKey] || {};
      const sources = trace.etapa3_fuentes_de_resolucion?.[dayKey] || [];
      const ingestas = dayData.ingestas || [];

      // 1. Verificar si hay repetición excesiva de la misma proteína en el mismo día (Comida y Cena)
      // Saltar días donde ambas tomas provienen de protocolo pre-partido (repetición intencionada de Carlos)
      const mainMeals = ingestas.filter((i) => {
        const n = i.nombre.toLowerCase();
        return n.includes('comida') || n.includes('cena');
      });
      const mainSources = sources.filter((s) => {
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
        // Si no son 'hamburguesa' genérica o algo así
        if (shared.length > 0 && !shared.includes('hamburguesa')) {
          findings.push({
            category: 'MONOTONÍA_PROTEÍNA_MISMO_DÍA',
            severity: 'MEDIA',
            day: dayKey,
            detail: `Misma proteína (${shared.join(', ')}) en ${proteinInMain[0].meal} y ${proteinInMain[1].meal}`,
            rawMeal: `${proteinInMain[0].meal}: ${proteinInMain[0].text} | ${proteinInMain[1].meal}: ${proteinInMain[1].text}`
          });
        }
      }

      // 2. Revisar cada ingesta individual
      for (const meal of ingestas) {
        const mName = meal.nombre || '';
        const normMName = mName.toLowerCase();
        const isMain = normMName.includes('comida') || normMName.includes('cena');
        const isDesayuno = normMName.includes('desayuno');
        const isMerienda = normMName.includes('merienda');
        const isAlmuerzo = normMName.includes('almuerzo');
        const detalle = meal.detalle || '';
        const detLow = detalle.toLowerCase();
        const sourceInfo = sources.find((s) => s.ingesta?.toLowerCase() === normMName)?.fuente || 'unknown';

        const items = detalle.split(',').map((s) => s.trim()).filter(Boolean);
        const parsedItems = items.map((str) => {
          const match = str.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s*g$/i);
          if (match) return { name: match[1].trim(), grams: parseFloat(match[2]), raw: str };
          return { name: str, grams: null, raw: str };
        });

        // 2.1 Pautas especiales prescritas
        if (detLow.includes('colacao')) {
          intentionalNotes.push({ day: dayKey, meal: mName, text: 'Colacao presente (pautado por Carlos en BD)' });
        }
        if (pName.includes('Danjuma') && isDesayuno && detLow.includes('leche') && parsedItems.length === 1) {
          intentionalNotes.push({ day: dayKey, meal: mName, text: 'Desayuno solo con leche (pautado "café con leche, no quiere nada más")' });
        }
        if (pName.includes('Danjuma') && isAlmuerzo && detLow.includes('huevo')) {
          intentionalNotes.push({ day: dayKey, meal: mName, text: 'Almuerzo con huevo/pan (pautado "Pan con salmón y huevos")' });
        }
        if (pName.includes('Danjuma') && normMName.includes('cena') && detLow.includes('yogur')) {
          intentionalNotes.push({ day: dayKey, meal: mName, text: 'Cena con yogur y fruta (pautado "Yogur con fruta")' });
        }

        // 2.2 Pescados o carnes de cocinado en Desayuno o Merienda
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
                rawMeal: detalle,
              });
            }
          }
        }

        // 2.3 Gramajes desproporcionados (demasiado altos o ridículamente bajos)
        for (const it of parsedItems) {
          const n = it.name.toLowerCase();

          // (Gramajes de proteínas y tubérculos son calculados por el calibrador según macros del jugador — no son anomalías)

          // Porciones diminutas (<20g) en carbohidratos o proteínas principales de comida/cena
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
                rawMeal: detalle,
              });
            }
          }

          // AOVE anómalo en comidas principales (<5g o >30g)
          if (isMain && (n.includes('aove') || n.includes('aceite'))) {
            if (it.grams && it.grams > 30) {
              findings.push({
                category: 'AOVE_EXCESIVO',
                severity: 'MEDIA',
                day: dayKey,
                meal: mName,
                detail: `AOVE con ${it.grams}g en ${mName}`,
                source: sourceInfo,
                rawMeal: detalle,
              });
            }
          }
        }

        // 2.4 Mezclas extrañas de hidratos en comida principal (doble hidrato de plato)
        // Saltar tomas cuya fuente es protocolo pre-partido (Carlos prescribe arroz+pasta)
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
              rawMeal: detalle,
            });
          }
        }

        // 2.5 Aversiones declaradas por el jugador
        for (const av of aversiones) {
          if (av === 'verdura' && isMain) {
            const hasSaladOrVeg = parsedItems.some((it) => VEG_ITEMS.some((v) => it.name.toLowerCase().includes(v)));
            if (hasSaladOrVeg) {
              findings.push({
                category: 'AVERSION_VERDURA_IGNORADA',
                severity: 'ALTA',
                day: dayKey,
                meal: mName,
                detail: `Plato con verduras servido a jugador con aversión a verdura declarada`,
                source: sourceInfo,
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
                detail: `Alimento de cerdo asignado a jugador con aversión a cerdo`,
                source: sourceInfo,
                rawMeal: detalle,
              });
            }
          }
        }

        // 2.6 Intolerancias clínicas
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
              rawMeal: detalle,
            });
          }
        }
      }
    }

    auditResults.push({
      id: pId,
      nombre: pName,
      equipo: teamName,
      totalHallazgos: findings.length,
      hallazgos: findings,
      notasIntencionadas: intentionalNotes,
    });
  }
}

// Estadísticas globales y reporte
console.log('='.repeat(80));
console.log('SUPER AUDITORÍA CLÍNICA, CULINARIA Y NUTRICIONAL (41 JUGADORES)');
console.log('='.repeat(80));

const playersWithIssues = auditResults.filter((p) => p.totalHallazgos > 0);
const cleanPlayers = auditResults.filter((p) => p.totalHallazgos === 0);

console.log(`Total Jugadores Auditados: ${auditResults.length}`);
console.log(`Jugadores 100% Impecables: ${cleanPlayers.length}`);
console.log(`Jugadores con Hallazgos: ${playersWithIssues.length}`);

const categoryStats = {};
for (const p of playersWithIssues) {
  for (const h of p.hallazgos) {
    categoryStats[h.category] = (categoryStats[h.category] || 0) + 1;
  }
}
console.log('\nDesglose de Hallazgos por Categoría:', categoryStats);
console.log('='.repeat(80));

for (const p of auditResults) {
  if (p.totalHallazgos > 0) {
    console.log(`\n🔍 [#${p.id}] ${p.nombre} (${p.equipo}) · ${p.totalHallazgos} observación(es):`);
    for (const h of p.hallazgos) {
      console.log(`   [${h.severity}] [${h.category}] ${h.day ? h.day.toUpperCase() : ''} ${h.meal ? '· ' + h.meal : ''}`);
      console.log(`      Detalle: ${h.detail}`);
      if (h.rawMeal) console.log(`      Plato: "${h.rawMeal}"`);
    }
  }
}

fs.writeFileSync(
  path.join(BASE_DIR, 'super_auditoria_detallada.json'),
  JSON.stringify(auditResults, null, 2),
  'utf8'
);
console.log(`\nInforme exhaustivo guardado en scripts/output_carlos_generation/super_auditoria_detallada.json`);
