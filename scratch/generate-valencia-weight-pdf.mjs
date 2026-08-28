import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import WeightExportDocument from '../lib/reports/WeightExportDocument.jsx';
import { calculateSemaforo, withLatestMeasurement } from '../lib/player-metrics.js';
import { formatFullDate } from '../lib/weight-export.js';

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: env.SUPABASE_SCHEMA || 'teams' },
});

async function main() {
  console.log('1. Buscando equipos...');
  const { data: teams, error: tErr } = await supabase.from('equipos').select('*');
  if (tErr) throw tErr;
  console.log('Equipos disponibles:', teams.map((t) => `${t.id}: ${t.nombre}`).join(' | '));

  const valenciaTeam = teams.find((t) => t.nombre.toLowerCase().includes('valencia')) || teams[0];
  console.log(`Equipo seleccionado: [${valenciaTeam.id}] ${valenciaTeam.nombre}`);

  console.log('2. Obteniendo jugadores, evoluciones y pesajes...');
  const { data: rawPlayers, error: pErr } = await supabase
    .from('jugadores')
    .select('*, evoluciones(*), pesajes(*)')
    .eq('equipo_id', valenciaTeam.id)
    .order('nombre');

  if (pErr) throw pErr;
  console.log(`Jugadores en plantilla: ${rawPlayers.length}`);

  // Encontrar la fecha de la última medición (pesajes) en el equipo
  const allPesajeDates = [];
  rawPlayers.forEach((p) => {
    (p.pesajes || []).forEach((pj) => {
      if (pj?.fecha && pj.peso_kg !== null && pj.peso_kg !== undefined && pj.peso_kg !== '') {
        allPesajeDates.push(String(pj.fecha).slice(0, 10));
      }
    });
  });

  allPesajeDates.sort();
  const latestDate = allPesajeDates[allPesajeDates.length - 1];
  console.log(`Última fecha de medición (pesaje) en el equipo: ${latestDate}`);

  if (!latestDate) {
    console.error('No se encontraron pesajes registrados para este equipo.');
    return;
  }

  // Filtrar solo los jugadores que tienen pesaje registrado en esa última fecha
  const playersWithWeightOnDate = [];

  for (const raw of rawPlayers) {
    const pesajes = raw.pesajes || [];
    const evoluciones = raw.evoluciones || [];
    const pesajeOnDate = pesajes.find((pj) => String(pj.fecha).slice(0, 10) === latestDate && pj.peso_kg !== null && pj.peso_kg !== '');

    if (pesajeOnDate) {
      const pesoVal = Number(pesajeOnDate.peso_kg);
      const playerWithMetrics = withLatestMeasurement(raw, evoluciones, pesajes);

      const semaforo = calculateSemaforo(pesajes, pesoVal, {
        masaMagra: playerWithMetrics.masa_magra_kg,
        porcentajeGrasaObjetivo: raw.porcentaje_grasa_objetivo,
        evoluciones,
        jugador: raw,
      });

      const masaMagra = semaforo.masaMagra || playerWithMetrics.masa_magra_kg;
      const targetFatPct = Number(raw.porcentaje_grasa_objetivo) || 8;

      const peso8 = masaMagra ? Math.round((masaMagra / 0.92) * 100) / 100 : null;
      const peso9 = masaMagra ? Math.round((masaMagra / 0.91) * 100) / 100 : null;
      const peso10 = masaMagra ? Math.round((masaMagra / 0.90) * 100) / 100 : null;

      let title = 'Óptimo';
      if (semaforo.status === 'amarillo') title = 'Precaución';
      else if (semaforo.status === 'rojo') title = semaforo.diff < 0 ? 'Alerta (Pérdida)' : 'Alerta (Exceso)';

      playersWithWeightOnDate.push({
        id: raw.id,
        nombre: raw.nombre,
        apellidos: raw.apellidos,
        posicion: raw.posicion,
        hasWeight: true,
        peso: pesoVal,
        pesoReferencia: semaforo.pesoReferencia,
        porcentajeGrasaObjetivo: targetFatPct,
        masaMagra,
        peso8,
        peso9,
        peso10,
        diff: semaforo.diff,
        status: semaforo.status,
        statusTitle: title,
        statusLabel: title,
      });
    }
  }

  console.log(`Jugadores seleccionados con peso en la última fecha (${latestDate}): ${playersWithWeightOnDate.length}`);
  playersWithWeightOnDate.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.nombre} ${p.apellidos || ''} (${p.posicion || '—'}): ${p.peso} kg | Obj (${p.porcentajeGrasaObjetivo}%): ${p.pesoReferencia} kg | Diff: ${p.diff > 0 ? '+' : ''}${p.diff} kg | [10%: ${p.peso10 || '—'}, 9%: ${p.peso9 || '—'}, 8%: ${p.peso8 || '—'}]`);
  });

  const optimoCount = playersWithWeightOnDate.filter((r) => r.status === 'verde').length;
  const precaucionCount = playersWithWeightOnDate.filter((r) => r.status === 'amarillo').length;
  const alertaCount = playersWithWeightOnDate.filter((r) => r.status === 'rojo').length;

  const summary = {
    total: playersWithWeightOnDate.length,
    conPeso: playersWithWeightOnDate.length,
    optimo: optimoCount,
    precaucion: precaucionCount,
    alerta: alertaCount,
  };

  const fechaFormatted = formatFullDate(latestDate);

  console.log('\n3. Generando documento PDF con @react-pdf/renderer...');
  const docElement = React.createElement(WeightExportDocument, {
    teamName: valenciaTeam.nombre,
    fechaFormatted,
    records: playersWithWeightOnDate,
    summary,
  });

  const safeTeam = valenciaTeam.nombre.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const outputFilename = `Toma_Pesos_${safeTeam}_${latestDate}.pdf`;
  const outputPath = path.resolve('./scratch', outputFilename);
  const artifactPath = path.resolve('/Users/andonisalcedo/.gemini/antigravity-cli/brain/ab8d2ed9-d58a-40bc-a1ec-d887ec454f8b', outputFilename);

  await ReactPDF.render(docElement, outputPath);
  fs.copyFileSync(outputPath, artifactPath);

  console.log(`\n✅ PDF generado exitosamente:`);
  console.log(`Ruta local: ${outputPath}`);
  console.log(`Ruta artefacto: ${artifactPath}`);
}

main().catch(console.error);
