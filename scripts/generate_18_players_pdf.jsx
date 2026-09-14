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

import React from 'react';
import { renderToStream, Document } from '@react-pdf/renderer';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdOrdered } from '@/repositories/evolutionRepository';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { getWeeklyReport } from '@/repositories/weeklyReportsRepository';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';
import { getResolvedPlayerSupplementation } from '@/repositories/supplementationRepository';
import { generarDatosPlan, sanitizePlanData } from '@/lib/engine';
import NutritionPlanCardDocument, { PlanCardPage, CoverPage } from '@/components/reports/NutritionPlanCardDocument';

const ARTIFACTS_DIR = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/c714d7b8-10b6-4984-9087-800d72c8c9a2';
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const PLAYER_IDS = [
  178, // Arnaut Danjuma
  180, // César Tárrega
  182, // Copete
  183, // Cristian Rivero
  184, // Dani Raba
  186, // Diego López
  187, // Dimitri Foulquier
  188, // Filip Ugrinic
  190, // Hugo Duro
  191, // Javi Guerra
  192, // Jesús Vázquez
  193, // José Luis Gayá
  195, // Luis Rioja
  196, // Mouctar Diakhaby
  198, // Pepelu
  201, // Sadiq
  202, // Stole Dimitrevski
  237, // Pablo Maffeo
];

function cleanName(nombre, apellidos) {
  const full = `${nombre || ''}_${apellidos || ''}`.trim();
  return full
    .replace(/\s+/g, '_')
    .replace(/[^\wÁÉÍÓÚáéíóúñÑüÜ_-]/g, '');
}

async function renderPdfBuffer(element) {
  const stream = await renderToStream(element);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function main() {
  console.log('\n======================================================');
  console.log(' GENERACIÓN DETERMINISTA DE PLANES PARA 18 JUGADORES');
  console.log(' (Modo simulación: SIN GUARDAR en la base de datos)');
  console.log('======================================================\n');

  const supabase = getSupabaseAdmin();

  // 1. Verificación previa de planes_ia
  const { count: countBefore } = await supabase
    .from('planes_ia')
    .select('*', { count: 'exact', head: true });
  console.log(`[DB Check] Registros en planes_ia antes: ${countBefore}`);

  const teamId = 7;
  const semana = '2026-09-14';

  const menu = await getMenuByWeekAndTeam(supabase, semana, teamId);
  const report = await getWeeklyReport(supabase, teamId, semana);

  console.log(`- Menú cargado: ${menu ? `ID ${menu.id} (${menu.semana})` : 'No encontrado'}`);
  console.log(`- Reporte semanal: ${report ? `Cargado con semana ${semana}` : 'No encontrado'}`);

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

  const weeklyReportMeta = report?.meta || {
    title: 'Semana 14-20 Septiembre',
    team: 'Primer Equipo',
    author: 'Carlos Ferrando · Nutralab',
    handle: '@c.ferrando',
    semana: '2026-09-14',
    contexto: 'semana_partido',
  };

  const generatedPlans = [];

  for (let i = 0; i < PLAYER_IDS.length; i++) {
    const playerId = PLAYER_IDS[i];
    const rawPlayer = await getPlayerWithTeamConfig(supabase, playerId);
    if (!rawPlayer) {
      console.warn(`⚠️ Jugador ID ${playerId} no encontrado en la BD. Saltando...`);
      continue;
    }

    const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, playerId);
    const jugador = withLatestMeasurement(rawPlayer, evolutions || []);
    const playerName = cleanName(jugador.nombre, jugador.apellidos);

    console.log(`\n[${i + 1}/${PLAYER_IDS.length}] Procesando: ${jugador.nombre} ${jugador.apellidos || ''} (ID: ${playerId})`);
    console.log(`    - Posición: ${jugador.posicion || 'N/A'}`);
    console.log(`    - Contexto clínico: ${jugador.contexto_clinico || 'Ninguno'}`);
    console.log(`    - Pautas habituales: ${jugador.recomendaciones_defecto ? Object.keys(jugador.recomendaciones_defecto).join(', ') : 'Árbol completo'}`);

    const teamConfig = jugador?.equipos?.configuracion_nutricional || {};

    // Generar plan en memoria
    const planData = await generarDatosPlan({
      jugador,
      nombre: `Plan Semanal - ${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
      contexto: 'semana_partido',
      calendario,
      preMatchConfig,
      menu,
      teamConfig,
    });

    // Resolver suplementación
    if (!Array.isArray(planData.suplementacion) || planData.suplementacion.length === 0) {
      const resolvedSupps = await getResolvedPlayerSupplementation(
        supabase,
        jugador.id,
        planData.metricas?.peso || jugador?.peso_kg
      );
      if (resolvedSupps?.length) {
        planData.suplementacion = resolvedSupps;
      }
    }

    // Resolver protocolos
    if (!Array.isArray(planData.protocolos) || planData.protocolos.length === 0) {
      const teamProtocols = teamConfig?.protocols || [];
      const customProtocols = jugador?.protocolos_custom || {};
      const activeDayTypes = new Set(Object.values(planData.dias || {}).map((d) => d.tipoDia).filter(Boolean));
      const resolvedProtocols = teamProtocols
        .map((p) => customProtocols[p.id] || p)
        .filter((p) => {
          const isIncluded = p.incluirEnPlan !== false && (p.incluirEnPlan === true || p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido')));
          if (!isIncluded) return false;
          if (p.dayTypeKey && activeDayTypes.size > 0) {
            return activeDayTypes.has(p.dayTypeKey);
          }
          return true;
        });
      if (resolvedProtocols.length > 0) {
        planData.protocolos = resolvedProtocols;
      }
    }

    const effectiveTeamConfig = {
      ...teamConfig,
      planColors: planData.meta?.planColors || planData.planColors || teamConfig?.planColors,
    };

    // Renderizar PDF individual
    const singlePdfBuffer = await renderPdfBuffer(
      <NutritionPlanCardDocument
        data={planData}
        weeklyReportMeta={weeklyReportMeta}
        teamConfig={effectiveTeamConfig}
      />
    );

    const artifactPath = path.join(ARTIFACTS_DIR, `Plan_${playerName}.pdf`);
    const publicPath = path.join(PUBLIC_DIR, `Plan_${playerName}.pdf`);

    fs.writeFileSync(artifactPath, singlePdfBuffer);
    fs.writeFileSync(publicPath, singlePdfBuffer);

    console.log(`    ✓ PDF individual guardado: Plan_${playerName}.pdf (${(singlePdfBuffer.length / 1024).toFixed(1)} KB)`);

    generatedPlans.push({
      jugador,
      playerName,
      planData,
      teamConfig: effectiveTeamConfig,
    });
  }

  // Renderizar dossier colectivo de los 18 jugadores
  console.log(`\n======================================================`);
  console.log(` Generando dossier colectivo: Plan_Valencia_CF_18_Jugadores.pdf ...`);
  console.log(`======================================================`);

  const combinedDoc = (
    <Document title="Planes Nutricionales Valencia CF - 18 Jugadores" author="Nutralab" subject="Planes Nutricionales Semanales">
      <CoverPage meta={weeklyReportMeta} playerName="Plantilla Valencia CF (18 Jugadores)" />
      {generatedPlans.map((p) => {
        const sanitized = sanitizePlanData(p.planData, p.teamConfig);
        return (
          <PlanCardPage
            key={p.jugador.id}
            plan={sanitized}
            teamConfig={p.teamConfig}
          />
        );
      })}
    </Document>
  );

  const combinedBuffer = await renderPdfBuffer(combinedDoc);
  const combinedArtifactPath = path.join(ARTIFACTS_DIR, 'Plan_Valencia_CF_18_Jugadores.pdf');
  const combinedPublicPath = path.join(PUBLIC_DIR, 'Plan_Valencia_CF_18_Jugadores.pdf');

  fs.writeFileSync(combinedArtifactPath, combinedBuffer);
  fs.writeFileSync(combinedPublicPath, combinedBuffer);

  console.log(`✓ Dossier completo guardado: Plan_Valencia_CF_18_Jugadores.pdf (${(combinedBuffer.length / 1024).toFixed(1)} KB)`);

  // Verificación final de base de datos
  const { count: countAfter } = await supabase
    .from('planes_ia')
    .select('*', { count: 'exact', head: true });
  console.log(`\n[DB Check] Registros en planes_ia después: ${countAfter}`);

  if (countBefore === countAfter) {
    console.log('✅ Verificado: CERO registros insertados en la base de datos.');
  } else {
    console.warn(`⚠️ Advertencia: Cambiaron los registros en planes_ia (${countBefore} -> ${countAfter})`);
  }

  console.log(`\n======================================================`);
  console.log(` PROCESO FINALIZADO EXITOSAMENTE`);
  console.log(` - 18 PDFs individuales generados en artifacts y public.`);
  console.log(` - 1 PDF dossier conjunto generado (18 jugadores).`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('Error fatal durante la generación:', err);
  process.exit(1);
});
