import { createClient } from "@supabase/supabase-js";
import React from "react";
import ReactPDF from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import { withLatestMeasurement } from "../lib/player-metrics.js";
import { generarDatosPlan } from "../lib/ai-plan-generator.js";
import WeeklySquadReportDocument from "../lib/reports/WeeklySquadReportDocument.jsx";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: process.env.SUPABASE_SCHEMA || "teams" }
});

// Configuración individual de tipos de día y pre-partido según el último plan de la semana
const PLAYER_CONFIGS = {
  236: { // Gonzalo Crettaz
    nombre: "Gonzalo Crettaz",
    calendario: {
      lunes: "descanso",
      martes: "descanso",
      miercoles: "entreno",
      jueves: "entreno",
      viernes: "entreno",
      sabado: "partido",
      domingo: "recuperacion"
    },
    preMatchConfig: {
      enabled: true,
      horario: "noche",
      partidos: {
        sabado: { horario: "noche" }
      },
      diaPartido: "sabado"
    },
    contexto: "semana_normal"
  },
  231: { // Eray Cömert
    nombre: "Eray Cömert",
    calendario: {
      lunes: "entreno",
      martes: "partido",
      miercoles: "doble",
      jueves: "entreno",
      viernes: "entreno",
      sabado: "partido",
      domingo: "recuperacion"
    },
    preMatchConfig: {
      enabled: true,
      horario: "noche",
      partidos: {
        martes: { horario: "noche" },
        sabado: { horario: "noche" }
      },
      diaPartido: "sabado"
    },
    contexto: "semana_normal"
  }
};

async function main() {
  console.log("=== INICIANDO GENERACIÓN DE INFORME PARA GONZALO Y ERAY ===");

  const { data: team } = await supabase.from("equipos").select("*").eq("id", 8).single();
  const teamConfig = team?.configuracion_nutricional;

  // Jugadores: Gonzalo (236) y Eray (231)
  const playerIds = [236, 231];
  const { data: rawPlayers } = await supabase.from("jugadores").select("*, evoluciones(*), pesajes(*)").in("id", playerIds);

  const semana = "31/08/2026";

  const resolvedPlayers = [];

  for (const raw of rawPlayers) {
    const player = withLatestMeasurement(raw, raw.evoluciones || [], raw.pesajes || []);
    const playerConf = PLAYER_CONFIGS[player.id] || {
      calendario: {
        lunes: "entreno",
        martes: "partido",
        miercoles: "recuperacion",
        jueves: "entreno",
        viernes: "entreno",
        sabado: "partido",
        domingo: "recuperacion"
      },
      preMatchConfig: {
        enabled: true,
        horario: "noche",
        partidos: { sabado: { horario: "noche" } },
        diaPartido: "sabado"
      },
      contexto: "semana_normal"
    };

    console.log(`\n--- Generando Plan para ${player.nombre} ${player.apellidos} (ID ${player.id}) ---`);
    console.log(`Posición: ${player.posicion} | Peso: ${player.peso_kg} kg | Comidas: ${player.num_comidas} | Post: ${player.postentreno}`);
    console.log(`Distribución de días:`, playerConf.calendario);

    const contextoAdicional = "";

    const t0 = Date.now();
    const planDatos = await generarDatosPlan({
      jugador: player,
      nombre: `Plan ${semana}`,
      contexto: playerConf.contexto,
      contextoAdicional,
      calendario: playerConf.calendario,
      menu: undefined, // Obtenido automáticamente del equipo del jugador
      teamConfig,
      preMatchConfig: playerConf.preMatchConfig
    });

    console.log(`Plan generado con éxito en ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
    for (const [, d] of Object.entries(planDatos.dias)) {
      console.log(`  [${d.label.toUpperCase()} - ${d.tipoDia}]`);
      for (const ing of d.ingestas) {
        console.log(`    * ${ing.nombre}: ${ing.detalle}`);
      }
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
    microcycle: "Lunes: Entrenamiento / Descanso individualizado\nMartes: Partido Oficial / Descanso individualizado\nMiércoles: Doble sesión / Entrenamiento técnico\nJueves: Entrenamiento táctico\nViernes: Entrenamiento pre-partido\nSábado: Partido Oficial (21:00)\nDomingo: Recuperación",
    rules: "Respetar timing en días de partido\nCarga de hidratos 24h previas en cena de Lunes y Viernes según planificación\nPriorizar alimentos antiinflamatorios e hidratación continua",
    buffet: "Buffet Ciudad Deportiva disponible según planificación individual"
  };

  const doc = React.createElement(WeeklySquadReportDocument, {
    meta,
    players: resolvedPlayers,
    teamConfig
  });

  const pdfPath = path.resolve(process.cwd(), "scratch/Informe_Futbol_Elite_Gonzalo_Eray.pdf");
  await ReactPDF.renderToFile(doc, pdfPath);
  console.log(`\n✅ PDF guardado exitosamente en: ${pdfPath}`);
  console.log(`Tamaño del archivo: ${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error("Error fatal generando informe:", err);
  process.exit(1);
});

