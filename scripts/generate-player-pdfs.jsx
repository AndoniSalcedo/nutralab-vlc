import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdOrdered } from '@/repositories/evolutionRepository';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { getWeeklyReport } from '@/repositories/weeklyReportsRepository';
import { getResolvedPlayerSupplementation } from '@/repositories/supplementationRepository';
import { generarDatosPlan } from '@/lib/ai/plan-generator';
import NutritionPlanCardDocument from '@/components/reports/NutritionPlanCardDocument';

const ARTIFACTS_DIR = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/c714d7b8-10b6-4984-9087-800d72c8c9a2';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

async function generatePlayerPlanPdf(playerId, playerNameClean) {
  console.log(`\n======================================================`);
  console.log(`[GENERANDO PLAN] ID: ${playerId} (${playerNameClean})`);
  console.log(`======================================================`);

  const supabase = getSupabaseAdmin();

  // 1. Obtener jugador y su equipo
  const rawPlayer = await getPlayerWithTeamConfig(supabase, playerId);
  if (!rawPlayer) throw new Error(`Jugador ${playerId} no encontrado`);

  const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, playerId);
  const jugador = withLatestMeasurement(rawPlayer, evolutions || []);

  const teamConfig = jugador?.equipos?.configuracion_nutricional || {};
  const teamId = jugador.equipo_id || 7;
  const semana = '2026-09-07';

  // Cargar menú y reporte semanal oficial
  const { getMenuByWeekAndTeam } = await import('@/repositories/menuRepository');
  const menu = await getMenuByWeekAndTeam(supabase, semana, teamId);
  const report = await getWeeklyReport(supabase, teamId, semana);

  const calendario = report?.meta?.calendario || {
    lunes: 'recuperacion',
    martes: 'entreno',
    miercoles: 'entreno',
    jueves: 'entreno',
    viernes: 'partido',
    sabado: 'recuperacion',
    domingo: 'entreno',
  };

  const preMatchConfig = report?.meta?.preMatchConfig || {
    enabled: true,
    horario: 'noche',
    diaPartido: 'viernes',
    partidos: {
      viernes: { horario: 'noche' },
    },
  };

  console.log(`- Nombre: ${jugador.nombre} ${jugador.apellidos || ''}`);
  console.log(`- Posición: ${jugador.posicion}`);
  console.log(`- Intolerancias: ${jugador.intolerancias || 'Ninguna'}`);
  console.log(`- Contexto clínico: ${jugador.contexto_clinico || 'Ninguno'}`);
  console.log(`- Aversiones: ${jugador.aversiones || 'Ninguna'}`);
  console.log(`- Preferencias: ${jugador.gustos_preferencias || 'Ninguna'}`);
  console.log(`- Comidas diarias: ${jugador.num_comidas}`);
  console.log(`- Menú buffet disponible: ${menu ? `Sí (ID ${menu.id})` : 'No'}`);

  // 2. Generar datos del plan en memoria (SIN GUARDAR EN BD)
  console.log('\n--> Llamando a generarDatosPlan (IA + Calibración matemática)...');
  const planData = await generarDatosPlan({
    jugador,
    nombre: `Plan Semanal - ${playerNameClean}`,
    contexto: 'semana_partido',
    calendario,
    preMatchConfig,
    menu,
    teamConfig,
  });

  console.log('✅ Plan generado y calibrado en memoria.');

  // 3. Suplementación y protocolos
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

  // 4. Reporte semanal meta
  let weeklyReportMeta = report?.meta || null;

  // Guardar JSON de auditoría en scratch
  const jsonPath = path.join(SCRATCH_DIR, `plan_${playerNameClean.toLowerCase()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(planData, null, 2), 'utf8');
  console.log(`- JSON de auditoría guardado en: ${jsonPath}`);

  // 5. Renderizar a PDF
  console.log('--> Renderizando PDF con @react-pdf/renderer...');
  const effectiveTeamConfig = {
    ...teamConfig,
    planColors: planData.meta?.planColors || planData.planColors || teamConfig?.planColors,
  };

  const stream = await renderToStream(
    <NutritionPlanCardDocument
      data={planData}
      weeklyReportMeta={weeklyReportMeta}
      teamConfig={effectiveTeamConfig}
    />
  );

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  // Guardar en public/ y en artifacts/
  const publicPdfPath = path.join(PUBLIC_DIR, `Plan_${playerNameClean}.pdf`);
  const artifactPdfPath = path.join(ARTIFACTS_DIR, `Plan_${playerNameClean}.pdf`);

  fs.writeFileSync(publicPdfPath, buffer);
  fs.writeFileSync(artifactPdfPath, buffer);

  console.log(`✅ PDF guardado con éxito:`);
  console.log(`   - Public:   ${publicPdfPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  console.log(`   - Artifact: ${artifactPdfPath}`);

  return { jugador, planData, pdfPath: publicPdfPath };
}

async function main() {
  console.log('Iniciando generación de prueba para Eray y Gonzalo (SIN GUARDAR EN BD)...');

  const supabase = getSupabaseAdmin();
  const { count: countBefore } = await supabase.from('planes_ia').select('*', { count: 'exact', head: true });
  console.log(`[DB Check] Registros en planes_ia antes: ${countBefore}`);

  await generatePlayerPlanPdf(231, 'Eray_Comert');
  await generatePlayerPlanPdf(236, 'Gonzalo_Crettaz');

  const { count: countAfter } = await supabase.from('planes_ia').select('*', { count: 'exact', head: true });
  console.log(`\n[DB Check] Registros en planes_ia después: ${countAfter}`);
  if (countBefore === countAfter) {
    console.log('✅ Confirmado: NINGÚN registro se guardó en la base de datos.');
  } else {
    console.warn('⚠️ ALERTA: Hubo cambios en planes_ia');
  }

  console.log('\n======================================================');
  console.log('RESUMEN DE GENERACIÓN COMPLETADA CON ÉXITO');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('Error fatal en generación de PDFs:', err);
  process.exit(1);
});
