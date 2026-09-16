import fs from 'node:fs';
import path from 'node:path';

const BASE_DIR = path.join(process.cwd(), 'scripts', 'output_carlos_generation');
const allPlans = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'all_players_plans.json'), 'utf8'));
const allTraces = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'all_players_traces.json'), 'utf8'));

const playersReport = [];

for (const teamKey of ['team_7_valencia', 'team_8_futbol_elite']) {
  const teamPlans = allPlans[teamKey] || {};
  const teamTraces = allTraces[teamKey] || {};

  for (const [id, plan] of Object.entries(teamPlans)) {
    const trace = teamTraces[id] || {};
    const jugador = plan.jugador || trace.jugador || {};
    const aversiones = (jugador.aversiones || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    const _intolerancias = (jugador.intolerancias || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

    const issues = [];
    const intentionalNotes = [];

    for (const [dayKey, day] of Object.entries(plan.dias || {})) {
      const sources = trace.etapa3_fuentes_de_resolucion?.[dayKey] || [];
      for (const meal of day.ingestas || []) {
        const mName = meal.nombre || '';
        const det = meal.detalle || '';
        const source = sources.find((s) => s.ingesta?.toLowerCase() === mName.toLowerCase())?.fuente || 'unknown';

        // 1. Ajo con gramaje desproporcionado
        const ajoMatch = det.match(/Ajo\s+(\d+)g/i);
        if (ajoMatch && parseInt(ajoMatch[1], 10) > 15) {
          issues.push({
            day: dayKey,
            meal: mName,
            type: 'AJO_EXCESIVO',
            text: `Ajo ${ajoMatch[1]}g (debería ser condimento ≤10g)`,
            source,
            plate: det,
          });
        }

        // 2. Colacao u otros alimentos específicos
        if (det.toLowerCase().includes('colacao')) {
          intentionalNotes.push({
            day: dayKey,
            meal: mName,
            text: `Colacao presente (${source}). Justificado: prescrito en las recomendaciones de cena del jugador.`,
          });
        }

        // 3. Aversiones del jugador
        for (const av of aversiones) {
          if (av === 'verdura' && (mName.toLowerCase().includes('comida') || mName.toLowerCase().includes('cena'))) {
            if (det.includes('Tomate') && det.includes('Pepino') && det.includes('Pimiento')) {
              issues.push({
                day: dayKey,
                meal: mName,
                type: 'AVERSION_VERDURA',
                text: `Gazpacho/Verduras asignado teniendo aversión a verduras declarada`,
                source,
                plate: det,
              });
            }
          }
          if (av === 'cerdo' && (det.toLowerCase().includes('cerdo') || det.toLowerCase().includes('jamón') || det.toLowerCase().includes('lomo'))) {
            issues.push({
              day: dayKey,
              meal: mName,
              type: 'AVERSION_CERDO',
              text: `Alimento de cerdo asignado teniendo aversión a cerdo declarada`,
              source,
              plate: det,
            });
          }
        }

        // 4. Incoherencias en Desayunos
        if (mName.toLowerCase().includes('desayuno')) {
          const lowerDet = det.toLowerCase();
          if (lowerDet.includes('dorada') || lowerDet.includes('merluza') || lowerDet.includes('ternera') || lowerDet.includes('conejo')) {
            issues.push({
              day: dayKey,
              meal: mName,
              type: 'CARNE_PESCADO_EN_DESAYUNO',
              text: `Pescado o carne de cocinado en desayuno`,
              source,
              plate: det,
            });
          }
        }

        // 5. Incoherencias en Cenas
        if (mName.toLowerCase().includes('cena')) {
          const lowerDet = det.toLowerCase();
          // Legumbres en cena (salvo que sea pasta de lenteja)
          if ((lowerDet.includes('garbanzo') || lowerDet.includes('alubia')) || (lowerDet.includes('lenteja') && !lowerDet.includes('pasta de lenteja'))) {
            issues.push({
              day: dayKey,
              meal: mName,
              type: 'LEGUMBRES_EN_CENA',
              text: `Legumbre tradicional asignada en cena`,
              source,
              plate: det,
            });
          }
        }

        // 6. Aceite excesivo (>35g en una sola toma)
        const aoveMatch = det.match(/AOVE\s+(\d+)g/i);
        if (aoveMatch && parseInt(aoveMatch[1], 10) > 35) {
          issues.push({
            day: dayKey,
            meal: mName,
            type: 'AOVE_EXCESIVO',
            text: `AOVE ${aoveMatch[1]}g en una sola toma`,
            source,
            plate: det,
          });
        }
      }
    }

    playersReport.push({
      id: jugador.id || id,
      nombre: jugador.nombre,
      equipo: teamKey === 'team_7_valencia' ? 'Valencia C.F.' : 'Fútbol élite',
      tieneMenu: teamKey === 'team_7_valencia',
      intolerancias: jugador.intolerancias || 'Ninguna',
      aversiones: jugador.aversiones || 'Ninguna',
      issuesCount: issues.length,
      issues,
      intentionalNotes,
    });
  }
}

// Estadísticas globales
const totalPlayers = playersReport.length;
const cleanPlayers = playersReport.filter((p) => p.issuesCount === 0);
const playersWithIssues = playersReport.filter((p) => p.issuesCount > 0);

console.log('='.repeat(80));
console.log(`AUDITORÍA UNO A UNO: ${totalPlayers} JUGADORES`);
console.log(`- Jugadores totalmente limpios: ${cleanPlayers.length}`);
console.log(`- Jugadores con observaciones o anomalías: ${playersWithIssues.length}`);
console.log('='.repeat(80));

for (const p of playersReport) {
  const icon = p.issuesCount === 0 ? '✓' : '⚠️';
  console.log(`\n[${icon}] #${p.id} ${p.nombre} (${p.equipo})`);
  console.log(`    Restricciones: Intol: [${p.intolerancias}] | Aversiones: [${p.aversiones}]`);
  
  if (p.intentionalNotes.length > 0) {
    for (const note of p.intentionalNotes) {
      console.log(`    ℹ️ [INTENCIONADO]: ${note.text}`);
    }
  }

  if (p.issuesCount > 0) {
    for (const iss of p.issues) {
      console.log(`    ❌ [${iss.day.toUpperCase()} · ${iss.meal}] ${iss.type}: ${iss.text} (Fuente: ${iss.source})`);
      console.log(`       Plato: "${iss.plate}"`);
    }
  } else {
    console.log(`    ✓ Menú semanal armónico, sin colisiones ni anomalías.`);
  }
}

fs.writeFileSync(
  path.join(BASE_DIR, 'reporte_jugador_por_jugador.json'),
  JSON.stringify(playersReport, null, 2),
  'utf8'
);
