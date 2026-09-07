import fs from 'fs';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { withLatestMeasurement } from '@/lib/metrics/player';
import { generarDatosPlan } from '@/lib/ai/plan-generator';
import WeeklySquadReportDocument from '@/components/reports/WeeklySquadReportDocument';

import { getPlayersByTeam } from '@/repositories/playerRepository';
import { getTeamById } from '@/repositories/teamRepository';
import { getEvolutionsByPlayerIds } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerIds } from '@/repositories/pesajeRepository';
import { getMenuByWeekAndTeam } from '@/repositories/menuRepository';
import { getWeeklyReport } from '@/repositories/weeklyReportsRepository';

const OUTPUT_PDF_PATH = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/031498f3-0811-4b4f-b926-9355b2b66ec5/informe_plantilla_simulado.pdf';

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

async function simulateTeamGeneration() {
  console.log('====================================================');
  console.log('SIMULACIÓN DE GENERACIÓN PARA TODO EL EQUIPO');
  console.log('====================================================\n');

  const supabase = getSupabaseAdmin();
  const teamId = 7;
  const semana = '2026-09-07';

  // 1. Verificar registros en planes_ia antes de empezar
  const { count: planCountBefore } = await supabase
    .from('planes_ia')
    .select('*', { count: 'exact', head: true });
  console.log(`[DB Check] Total planes_ia antes de simulación: ${planCountBefore}`);

  // 2. Cargar datos del equipo
  const team = await getTeamById(supabase, teamId);
  if (!team) throw new Error(`Equipo ${teamId} no encontrado`);
  console.log(`[Equipo] ${team.nombre} (ID: ${team.id})`);

  // 3. Cargar jugadores
  const rawPlayers = await getPlayersByTeam(supabase, teamId);
  if (!rawPlayers?.length) throw new Error('No se encontraron jugadores');
  console.log(`[Jugadores] ${rawPlayers.length} jugadores encontrados en plantilla.`);

  const playerIds = rawPlayers.map((p) => p.id);

  // 4. Cargar mediciones, pesajes y menú
  console.log('[Cargando datos] Evoluciones, pesajes y menú semanal...');
  const [evoluciones, pesajes, menu, storedReport] = await Promise.all([
    getEvolutionsByPlayerIds(supabase, playerIds),
    getPesajesByPlayerIds(supabase, playerIds),
    getMenuByWeekAndTeam(supabase, semana, teamId),
    getWeeklyReport(supabase, teamId, semana),
  ]);

  console.log(`- Evoluciones cargadas: ${evoluciones?.length || 0}`);
  console.log(`- Pesajes cargados: ${pesajes?.length || 0}`);
  console.log(`- Menú cargado: ${menu ? `ID ${menu.id}, semana ${menu.semana}` : 'No disponible'}`);

  // 5. Parámetros de simulación exactos
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

  // 6. Preparar jugadores con mediciones
  const playersWithMetrics = rawPlayers.map((rawPlayer) => {
    const pEvol = (evoluciones || []).filter((item) => String(item.jugador_id) === String(rawPlayer.id));
    const pPesajes = (pesajes || []).filter((item) => String(item.jugador_id) === String(rawPlayer.id));
    return withLatestMeasurement(rawPlayer, pEvol, pPesajes);
  });

  // 7. Simular generación en memoria (SIN TOCAR LA BASE DE DATOS)
  console.log('\n--- Generando planes en memoria para la plantilla (concurrencia: 4) ---');
  const startTime = Date.now();
  let ensureCount = 0;
  const hugoDuroCheck = { thursDinner: null, friMeals: [] };
  const cesarTarregaCheck = { lunch: null, dinner: null };

  const resolvedPlayers = await runWithConcurrency(playersWithMetrics, 4, async (player, idx) => {
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
      console.log(`[${idx + 1}/${playersWithMetrics.length}] OK: ${fullName} (${dur}s)`);

      // Verificar si hay "Ensure"
      const planStr = JSON.stringify(planData).toLowerCase();
      if (planStr.includes('ensure')) {
        console.warn(`⚠️ ALERTA: Ensure detectado en el plan de ${fullName}!`);
        ensureCount++;
      }

      // Guardar detalle específico de Hugo Duro
      if (fullName.toLowerCase().includes('hugo') && fullName.toLowerCase().includes('duro')) {
        const jue = planData?.dias?.jueves?.ingestas || [];
        const vie = planData?.dias?.viernes?.ingestas || [];
        hugoDuroCheck.thursDinner = jue.find((i) => i.nombre?.toLowerCase().includes('cena')) || jue[jue.length - 1];
        hugoDuroCheck.friMeals = vie.map((i) => `${i.nombre}: ${i.detalle || i.platos || i.opciones || i.recomendacion || '-'}`);
      }

      // Guardar detalle específico de César Tárrega
      if (fullName.toLowerCase().includes('césar') || fullName.toLowerCase().includes('cesar')) {
        const lun = planData?.dias?.lunes?.ingestas || [];
        cesarTarregaCheck.lunch = lun.find((i) => i.nombre?.toLowerCase().includes('comida'));
        cesarTarregaCheck.dinner = lun.find((i) => i.nombre?.toLowerCase().includes('cena'));
      }

      return {
        ...player,
        plan: planData,
      };
    } catch (err) {
      console.error(`❌ Error generando ${fullName}:`, err.message);
      return {
        ...player,
        plan: null,
      };
    }
  });

  const totalGenTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nGeneración completada en ${totalGenTime}s.`);

  // 8. Verificar que la base de datos no se ha tocado
  const { count: planCountAfter } = await supabase
    .from('planes_ia')
    .select('*', { count: 'exact', head: true });
  console.log(`\n[DB Check] Total planes_ia tras simulación: ${planCountAfter} (Cambio: ${planCountAfter - planCountBefore})`);

  // 9. Comprobación de reglas nutricionales
  console.log('\n====================================================');
  console.log('AUDITORÍA DE RESULTADOS');
  console.log('====================================================');
  console.log(`- Menciones de "Ensure" en toda la plantilla: ${ensureCount}`);
  if (cesarTarregaCheck.lunch || cesarTarregaCheck.dinner) {
    console.log(`- César Tárrega (Lunes):`);
    if (cesarTarregaCheck.lunch) console.log(`    Comida: ${cesarTarregaCheck.lunch.detalle}`);
    if (cesarTarregaCheck.dinner) console.log(`    Cena:   ${cesarTarregaCheck.dinner.detalle}`);
  }
  if (hugoDuroCheck.thursDinner) {
    console.log(`- Hugo Duro (Cena Jueves - Prepartido Noche):`);
    console.log(`    Nombre: ${hugoDuroCheck.thursDinner.nombre}`);
    console.log(`    Detalle: ${hugoDuroCheck.thursDinner.detalle || hugoDuroCheck.thursDinner.platos || hugoDuroCheck.thursDinner.opciones || hugoDuroCheck.thursDinner.recomendacion}`);
  }
  if (hugoDuroCheck.friMeals.length) {
    console.log(`- Hugo Duro (Ingestas Viernes - Día Partido Noche):`);
    hugoDuroCheck.friMeals.forEach((m) => console.log(`    ${m}`));
  }

  // 10. Renderizar PDF del informe completo de la plantilla
  console.log('\n--- Renderizando documento PDF de la plantilla ---');
  const validPlayers = resolvedPlayers.filter((p) => p.plan);
  console.log(`Renderizando ${validPlayers.length} jugadores en el informe semanal...`);

  const stream = await renderToStream(
    <WeeklySquadReportDocument
      meta={{ ...meta, semana }}
      players={validPlayers}
      teamConfig={team.configuracion_nutricional}
    />
  );

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  fs.writeFileSync(OUTPUT_PDF_PATH, buffer);

  console.log(`\n✅ PDF generado exitosamente!`);
  console.log(`- Archivo: ${OUTPUT_PDF_PATH}`);
  console.log(`- Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`- Jugadores incluidos: ${validPlayers.length}`);
}

simulateTeamGeneration().catch((err) => {
  console.error('Error fatal en simulación:', err);
  process.exit(1);
});
