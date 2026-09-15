import fs from 'node:fs';
import path from 'node:path';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
}
loadEnv(path.join(process.cwd(), '.env.local'));

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdOrdered } from '@/repositories/evolutionRepository';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { getWeeklyReport } from '@/repositories/weeklyReportsRepository';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';
import { generarDatosPlan } from '@/lib/engine';

const PLAYER_IDS = [
  178, 180, 182, 183, 184, 186, 187, 188, 190, 191, 192, 193, 195, 196, 198, 201, 202, 237
];

async function inspectPlans() {
  const supabase = getSupabaseAdmin();
  const teamId = 7;
  const semana = '2026-09-14';

  const menu = await getMenuByWeekAndTeam(supabase, semana, teamId);
  const report = await getWeeklyReport(supabase, teamId, semana);

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
    horario: 'noche',
    diaPartido: 'martes',
    partidos: {
      martes: { horario: 'noche' },
      domingo: { horario: 'noche' },
    },
  };

  console.log('=== INSPECCIÓN DETALLADA DE LOS 18 PLANES GENERADOS ===\n');

  const summary = [];

  for (const playerId of PLAYER_IDS) {
    const rawPlayer = await getPlayerWithTeamConfig(supabase, playerId);
    if (!rawPlayer) continue;

    const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, playerId);
    const jugador = withLatestMeasurement(rawPlayer, evolutions || []);
    const teamConfig = jugador?.equipos?.configuracion_nutricional || {};

    const planData = await generarDatosPlan({
      jugador,
      nombre: `Plan Semanal - ${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      contexto: 'semana_partido',
      calendario,
      preMatchConfig,
      menu,
      teamConfig,
    });

    const playerReport = {
      id: playerId,
      name: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      position: jugador.posicion || 'Sin posición',
      clinical: jugador.contexto_clinico || 'Ninguno',
      intolerances: jugador.intolerancias || 'Ninguna',
      allergies: jugador.alergias || 'Ninguna',
      aversions: jugador.aversiones || 'Ninguna',
      preMatchConfig: jugador.config_prepartido ? Object.keys(jugador.config_prepartido) : [],
      raw_config_prepartido: jugador.config_prepartido || null,
      raw_recomendaciones_defecto: jugador.recomendaciones_defecto || null,
      days: {},
    };

    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    for (const d of days) {
      const dayData = planData.dias[d];
      playerReport.days[d] = {
        tipo: dayData?.tipoDia,
        calorias: dayData?.kcal,
        ingestas: (dayData?.ingestas || []).map((ing) => ({
          nombre: ing.nombre,
          detalle: ing.detalle,
        })),
      };
    }

    summary.push(playerReport);
  }

  // Guardar reporte JSON en scratch para análisis exhaustivo
  const outPath = path.join(process.cwd(), 'scripts', 'scratch_inspection_18.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`Inspección guardada en ${outPath}`);

  // Imprimir resumen por jugador
  for (const p of summary) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`👤 JUGADOR: ${p.name} (ID: ${p.id}, Pos: ${p.position})`);
    console.log(`   Clínico: ${p.clinical} | Intol: ${p.intolerances} | Alergias: ${p.allergies} | Aversiones: ${p.aversions}`);
    console.log(`   Prepartido configs: ${p.preMatchConfig.join(', ') || 'Ninguna'}`);
    
    // Muestra Lunes (MD-1, víspera de partido), Martes (MD, partido), Miércoles (descanso), Jueves (entreno)
    const sampleDays = ['lunes', 'martes', 'miercoles', 'jueves'];
    for (const d of sampleDays) {
      const dInfo = p.days[d];
      console.log(`   📅 ${d.toUpperCase()} (${dInfo.tipo} - ${dInfo.calorias} kcal):`);
      for (const ing of dInfo.ingestas) {
        console.log(`      • [${ing.nombre}]: ${ing.detalle}`);
      }
    }
  }
}

inspectPlans().catch(console.error);
