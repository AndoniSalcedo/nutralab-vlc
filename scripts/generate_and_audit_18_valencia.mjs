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
import { getLatestMenu } from '@/repositories/menuRepository';
import { generarDatosPlan } from '@/lib/engine';

const PLAYER_IDS = [
  178, 180, 182, 183, 184, 186, 187, 188, 190, 191, 192, 193, 195, 196, 198, 201, 202, 237
];

async function run() {
  const supabase = getSupabaseAdmin();
  const teamId = 7;

  const latestMenu = await getLatestMenu(supabase, teamId);
  console.log(`[INFO] Último menú de Valencia (Equipo 7): Semana ${latestMenu?.semana}, ID ${latestMenu?.id}`);

  const report = await getWeeklyReport(supabase, teamId, latestMenu?.semana);
  console.log(`[INFO] Weekly Report para semana ${latestMenu?.semana}: ${report ? 'Encontrado' : 'No encontrado (usando default)'}`);

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

  console.log('[INFO] Generando planes para los 18 jugadores...');

  const results = [];

  for (const pid of PLAYER_IDS) {
    const rawPlayer = await getPlayerWithTeamConfig(supabase, pid);
    if (!rawPlayer) {
      console.warn(`[WARN] Jugador ${pid} no encontrado`);
      continue;
    }

    const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, pid);
    const jugador = withLatestMeasurement(rawPlayer, evolutions || []);
    const teamConfig = jugador?.equipos?.configuracion_nutricional || {};

    const plan = await generarDatosPlan({
      jugador,
      nombre: `Plan Semanal - ${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      contexto: 'semana_partido',
      calendario,
      preMatchConfig,
      menu: latestMenu,
      teamConfig,
    });

    results.push({
      jugador: {
        id: jugador.id,
        nombre: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
        posicion: jugador.posicion,
        intolerancias: jugador.intolerancias || '',
        aversiones: jugador.aversiones || '',
        gustos: jugador.gustos || '',
        contexto_clinico: jugador.contexto_clinico || '',
        config_prepartido: jugador.config_prepartido || null,
        recomendaciones_defecto: jugador.recomendaciones_defecto || null,
      },
      plan,
    });
  }

  const outPath = path.join(process.cwd(), 'scripts', 'output_18_valencia_latest.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`[SUCCESS] Guardados ${results.length} planes en ${outPath}`);
}

run().catch(console.error);
