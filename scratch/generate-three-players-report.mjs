import { createClient } from "@supabase/supabase-js";
import React from "react";
import ReactPDF from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import { withLatestMeasurement } from "../lib/player-metrics.js";
import { planDataToLegacyContent } from "../lib/nutrition-plan-card.js";
import { generarDatosPlan } from "../lib/ai-plan-generator.js";
import WeeklySquadReportDocument from "../lib/reports/WeeklySquadReportDocument.jsx";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: process.env.SUPABASE_SCHEMA || "teams" }
});

async function main() {
  console.log("=== INICIANDO GENERACIÓN DE INFORME PARA GONZALO, ERAY Y FOYTH ===");

  const { data: team } = await supabase.from("equipos").select("*").eq("id", 8).single();
  const teamConfig = team?.configuracion_nutricional;

  const playerIds = [236, 231, 175];
  const { data: rawPlayers } = await supabase.from("jugadores").select("*, evoluciones(*), pesajes(*)").in("id", playerIds);

  const semana = "24/08/2026";
  const calendario = {
    lunes: "entreno",
    martes: "partido",
    miercoles: "recuperacion",
    jueves: "entreno",
    viernes: "entreno",
    sabado: "partido",
    domingo: "recuperacion"
  };

  const preMatchConfig = {
    enabled: true,
    horario: "tarde",
    partidos: {
      martes: { horario: "noche" },
      sabado: { horario: "noche" }
    },
    diaPartido: "sabado"
  };

  const resolvedPlayers = [];

  for (const raw of rawPlayers) {
    const player = withLatestMeasurement(raw, raw.evoluciones || [], raw.pesajes || []);
    console.log(`\n--- Generando / Verificando Plan para ${player.nombre} ${player.apellidos} (ID ${player.id}) ---`);
    console.log(`Posición: ${player.posicion} | Peso: ${player.peso_kg} kg | Comidas: ${player.num_comidas} | Post: ${player.postentreno}`);

    let contextoAdicional = "Martes partido a las 21:00 y sábado partido a las 21:00.";
    if (player.id === 236) {
      contextoAdicional = "Lunes viaje, martes partido a las 21:00 (pon merienda), y sábado partido a las 21:00. Adaptado a SIBO, antiinflamatorio, sin lactosa ni gluten.";
    } else if (player.id === 175) {
      contextoAdicional = "Martes partido a las 21:00 y sábado partido a las 21:00. Ha acabado fase de readaptación de lesión larga, ya en forma. Le gusta la carne.";
    } else if (player.id === 231) {
      contextoAdicional = "Martes partido a las 21:00 y sábado partido a las 21:00. Evitar verduras muy flatulentas. Le gusta algo dulce ligero nocturno.";
    }

    const t0 = Date.now();
    const planDatos = await generarDatosPlan({
      jugador: player,
      nombre: `Plan ${semana}`,
      contexto: "semana_partido",
      contextoAdicional,
      calendario,
      menu: undefined, // Will be fetched from player.equipo_id automatically
      teamConfig,
      preMatchConfig
    });

    console.log(`Plan generado con éxito en ${((Date.now() - t0)/1000).toFixed(1)}s!`);
    console.log("Comidas Lunes:", planDatos.dias.lunes.ingestas.map(i => i.nombre).join(" | "));
    console.log("Comidas Martes (partido):", planDatos.dias.martes.ingestas.map(i => i.nombre).join(" | "));

    // Save to DB
    const finalContenido = planDataToLegacyContent(planDatos, teamConfig);
    const { data: existingPlan } = await supabase
      .from("planes_ia")
      .select("id")
      .eq("jugador_id", player.id)
      .eq("nombre", `Plan ${semana}`)
      .single();

    let planId;
    if (existingPlan) {
      const { data: updated } = await supabase
        .from("planes_ia")
        .update({
          datos: planDatos,
          contenido: finalContenido,
          contexto: "semana_partido",
          contexto_adicional: contextoAdicional,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingPlan.id)
        .select("id")
        .single();
      planId = updated?.id || existingPlan.id;
      console.log(`Plan ${planId} actualizado en DB.`);
    } else {
      const { data: inserted } = await supabase
        .from("planes_ia")
        .insert({
          jugador_id: player.id,
          nombre: `Plan ${semana}`,
          datos: planDatos,
          contenido: finalContenido,
          contexto: "semana_partido",
          contexto_adicional: contextoAdicional,
        })
        .select("id")
        .single();
      planId = inserted?.id;
      console.log(`Nuevo Plan ${planId} insertado en DB.`);
    }

    resolvedPlayers.push({
      ...player,
      plan: planDatos
    });
  }

  // Generate Report PDF
  console.log("\n=== COMPILANDO PDF DEL INFORME CON PÁGINAS DESCRIPTIVAS ADICIONALES ===");
  const meta = {
    title: `Semana ${semana}`,
    subtitle: "Plan Nutricional y Validación Clínica · Fútbol Élite",
    team: "Fútbol élite",
    author: "Carlos Ferrando",
    handle: "Nutralab VLC",
    microcycle: "Lunes: Entrenamiento / Viaje\nMartes: Partido Oficial (21:00)\nMiércoles: Recuperación activa\nJueves: Entrenamiento técnico\nViernes: Entrenamiento pre-partido\nSábado: Partido Oficial (21:00)\nDomingo: Recuperación",
    rules: "Respetar timing en días de partido\nCarga de hidratos 24h previas en cena de Lunes y Viernes\nPriorizar alimentos antiinflamatorios e hidratación continua",
    buffet: "Buffet Ciudad Deportiva disponible según planificación individual"
  };

  const doc = React.createElement(WeeklySquadReportDocument, {
    meta,
    players: resolvedPlayers,
    teamConfig
  });

  const pdfPath = path.resolve(process.cwd(), "scratch/Informe_Futbol_Elite_Validacion.pdf");
  await ReactPDF.renderToFile(doc, pdfPath);
  console.log(`\n✅ PDF guardado exitosamente en: ${pdfPath}`);
  console.log(`Tamaño del archivo: ${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error("Error fatal generando informe:", err);
  process.exit(1);
});
