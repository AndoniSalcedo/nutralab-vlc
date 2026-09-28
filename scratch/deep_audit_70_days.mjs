import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { withLatestMeasurement } from './lib/metrics/player.js';
import { generarDatosPlan } from './lib/engine/generator.js';
import { getFoodCategoryBranch } from './lib/engine/food-tree.js';
import { getClinicalCatalogForPlayer } from './lib/nutrition/clinical-catalog.js';

// 1. Conexión a Supabase
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[match[1]] = val;
  }
}

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: envVars.SUPABASE_SCHEMA || 'teams' },
});

const DAYS_OF_WEEK = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

const diasCalendarioBase = {
  lunes: 'descanso',
  martes: 'entreno',
  miercoles: 'doble',
  jueves: 'recuperacion',
  viernes: 'entreno',
  sabado: 'partido',
  domingo: 'descanso',
};

const WEEK_SCHEDULES = [
  'noche', 'tarde', 'manana', 'noche', 'tarde',
  'manana', 'noche', 'tarde', 'noche', 'tarde'
];

function parseItemsFromDetalle(detalle, catalog) {
  if (!detalle || typeof detalle !== 'string') {
    return { carbBranch: null, proteinBranch: null, carbFood: null, proteinFood: null, items: [] };
  }

  const rawTokens = detalle.split(',').map((s) => s.trim()).filter(Boolean);
  const items = [];
  let carbBranch = null;
  let proteinBranch = null;
  let carbFood = null;
  let proteinFood = null;

  for (const token of rawTokens) {
    const m = token.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)\s*g)?$/i);
    const name = m ? m[1].trim() : token;
    const grams = m && m[2] ? parseFloat(m[2]) : null;

    const branch = getFoodCategoryBranch(name, catalog);
    items.push({ name, grams, branch });

    if (branch.carbBranch && !carbBranch) {
      carbBranch = branch.carbBranch;
      carbFood = name;
    }
    if (branch.proteinBranch && !proteinBranch) {
      proteinBranch = branch.proteinBranch;
      proteinFood = name;
    }
  }

  return { carbBranch, proteinBranch, carbFood, proteinFood, items };
}

async function runDeepAudit() {
  console.log('🔍 Iniciando Auditoría Profunda de 70 Días (10 Semanas x 88 Jugadores)...');
  const startTime = Date.now();

  // 1. Cargar datos
  const { data: jugadoresRaw, error: errJug } = await supabase
    .from('jugadores')
    .select('*, equipos(configuracion_nutricional)');
  if (errJug) throw errJug;

  const { data: evoluciones } = await supabase.from('evolucion').select('*');
  const { data: pesajes } = await supabase.from('pesajes').select('*');

  // Menús disponibles en BD con días reales
  const { data: rawMenus } = await supabase
    .from('menu_semanal')
    .select('*')
    .order('id', { ascending: false });

  const validMenus = (rawMenus || []).filter((m) =>
    Array.isArray(m.dias) && m.dias.some((d) => d.comida?.platos_desglosados?.length > 0 || d.cena?.platos_desglosados?.length > 0)
  );

  console.log(`✓ Total Jugadores: ${jugadoresRaw.length}`);
  console.log(`✓ Menús reales utilizables en rotación: ${validMenus.length}`);

  const report = {
    totalJugadores: jugadoresRaw.length,
    planesGenerados: 0,
    totalDiasEvaluados: 0,
    fallosEjecucion: [],

    // 1. Inconsistencias dentro de la misma toma (intra-meal)
    duplicadosMismaToma: [],

    // 2. Colisiones mismo día (Comida vs Cena)
    colisionesMismoDia: {
      arroz: [],
      tuberculos: [],
      pasta: [],
      mismaProteina: [],
      mismoAlimentoExacto: [],
    },

    // 3. Rachas consecutivas (día tras día)
    colisionesConsecutivas: {
      maxRachaCarb: { racha: 0, detalle: '' },
      maxRachaPro: { racha: 0, detalle: '' },
      racha3Carb: [],
      racha3Pro: [],
    },

    // 4. Inconsistencias de macros, gramajes y objetivos
    incongruenciasMacros: {
      kcalInvalida: [],
      desviacionKcalExcesiva: [],
      proteinaFueraDeRango: [],
      gramosAnomalos: [],
    },

    // 5. Inconsistencias clínicas y alérgenos
    incongruenciasClinicas: {
      glutenEnCeliaco: [],
      lactosaEnIntolerante: [],
      cerdoEnSinCerdo: [],
      pescadoEnSinPescado: [],
      alimentoAversionServido: [],
    },

    // 6. Inconsistencias de estructura y día de partido
    incongruenciasEstructura: {
      diasFaltantes: [],
      ingestasVacias: [],
      cenaPerdidaEnPartido: [],
      grasaElevadaEnPrepartido: [],
    },
  };

  let playerIndex = 0;

  for (const rawPlayer of jugadoresRaw) {
    playerIndex++;
    const playerEvol = (evoluciones || []).filter((e) => e.jugador_id === rawPlayer.id);
    const playerPes = (pesajes || []).filter((p) => p.jugador_id === rawPlayer.id);
    const jugador = withLatestMeasurement(rawPlayer, playerEvol, playerPes);

    const playerReady = {
      ...jugador,
      peso_kg: jugador.peso_kg || 75,
      altura_cm: jugador.altura_cm || 180,
      num_comidas: jugador.num_comidas || 'Desayuno, Comida, Cena',
    };

    const teamConfig = jugador?.equipos?.configuracion_nutricional || {};
    const clinicalCatalog = getClinicalCatalogForPlayer(playerReady);

    const intoleranciasStr = String(playerReady.intolerancias || '').toLowerCase();
    const aversionesStr = String(playerReady.aversiones || '').toLowerCase();
    const isSinGluten = intoleranciasStr.includes('gluten') || (playerReady.etiquetas_nutricionales || []).includes('sin_gluten');
    const isSinLactosa = intoleranciasStr.includes('lactosa') || (playerReady.etiquetas_nutricionales || []).includes('sin_lactosa');
    const isSinCerdo = intoleranciasStr.includes('cerdo') || aversionesStr.includes('cerdo');
    const isSinPescado = intoleranciasStr.includes('pescado') || aversionesStr.includes('pescado');

    const aversionesList = aversionesStr
      .split(/[,;\n]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 2 && !['cerdo', 'pescado'].includes(s));

    let streakCarbBranch = null;
    let streakCarbCount = 0;
    let streakProBranch = null;
    let streakProCount = 0;

    for (let week = 0; week < 10; week++) {
      const horario = WEEK_SCHEDULES[week];
      const preMatchConfig = {
        enabled: true,
        horario,
        partidos: { sabado: { horario } },
        diaPartido: 'sabado',
      };

      // Usar menús reales en rotación semanal
      const chosenMenu = validMenus.length > 0 ? validMenus[week % validMenus.length] : null;
      const playerMenu = (chosenMenu && rawPlayer.equipo_id === chosenMenu.equipo_id) ? chosenMenu : validMenus[0] || null;

      report.planesGenerados++;
      let plan;
      try {
        plan = await generarDatosPlan({
          jugador: playerReady,
          nombre: `DeepAudit W${week + 1} ${playerReady.nombre}`,
          calendario: diasCalendarioBase,
          menu: playerMenu,
          teamConfig,
          preMatchConfig,
        });
      } catch (err) {
        report.fallosEjecucion.push({
          jugador: `${playerReady.nombre} (${playerReady.id})`,
          semana: week + 1,
          error: err.message,
        });
        continue;
      }

      for (const dayKey of DAYS_OF_WEEK) {
        report.totalDiasEvaluados++;
        const dia = plan.dias?.[dayKey];
        if (!dia) {
          report.incongruenciasEstructura.diasFaltantes.push({
            jugador: playerReady.nombre,
            dia: `W${week + 1} ${dayKey}`,
          });
          continue;
        }

        // 1. Validación de Kcal totales del día
        if (!dia.kcal || dia.kcal <= 0 || Number.isNaN(dia.kcal)) {
          report.incongruenciasMacros.kcalInvalida.push({
            jugador: playerReady.nombre,
            dia: `W${week + 1} ${dayKey}`,
            kcal: dia.kcal,
          });
        }

        // Desviación calórica respecto a objetivo (> 35% de desviación)
        if (dia.targetKcal && dia.kcal) {
          const diffPct = Math.abs(dia.kcal - dia.targetKcal) / dia.targetKcal;
          if (diffPct > 0.35) {
            report.incongruenciasMacros.desviacionKcalExcesiva.push({
              jugador: playerReady.nombre,
              dia: `W${week + 1} ${dayKey}`,
              kcal: Math.round(dia.kcal),
              target: Math.round(dia.targetKcal),
              diffPct: Math.round(diffPct * 100),
            });
          }
        }

        // Validación de ratio de proteína (g/kg corporal)
        if (dia.proteinas && playerReady.peso_kg) {
          const gPerKg = dia.proteinas / playerReady.peso_kg;
          if (gPerKg < 1.3 || gPerKg > 3.5) {
            report.incongruenciasMacros.proteinaFueraDeRango.push({
              jugador: playerReady.nombre,
              dia: `W${week + 1} ${dayKey}`,
              gPerKg: Math.round(gPerKg * 10) / 10,
              proteinaTotal: Math.round(dia.proteinas),
            });
          }
        }

        const ingestas = Array.isArray(dia.ingestas) ? dia.ingestas : [];
        const comida = ingestas.find((i) => i.nombre?.toLowerCase().includes('comida'));
        const cena = ingestas.find((i) => i.nombre?.toLowerCase().includes('cena'));

        const hasBaseDinner = String(playerReady.num_comidas || '').toLowerCase().includes('cena') || !playerReady.num_comidas;
        if (dayKey === 'sabado' && hasBaseDinner && !cena) {
          report.incongruenciasEstructura.cenaPerdidaEnPartido.push({
            jugador: playerReady.nombre,
            horario,
            semana: week + 1,
          });
        }

        // Inspeccionar cada ingesta del día
        for (const ing of ingestas) {
          if (!ing.detalle || typeof ing.detalle !== 'string' || !ing.detalle.trim()) {
            report.incongruenciasEstructura.ingestasVacias.push({
              jugador: playerReady.nombre,
              ingesta: ing.nombre,
              dia: `W${week + 1} ${dayKey}`,
            });
            continue;
          }

          const parsed = parseItemsFromDetalle(ing.detalle, clinicalCatalog);

          // Comprobar duplicados dentro de la misma toma
          const seenInMeal = new Map();
          for (const item of parsed.items) {
            const normName = item.name.toLowerCase().trim();
            if (seenInMeal.has(normName)) {
              report.duplicadosMismaToma.push({
                jugador: playerReady.nombre,
                ingesta: ing.nombre,
                dia: `W${week + 1} ${dayKey}`,
                alimento: item.name,
              });
            } else {
              seenInMeal.set(normName, true);
            }
          }

          // Grasa en ingesta pre-partido
          const isPreMatchMeal = dayKey === 'sabado' && (
            (horario === 'tarde' && ing.nombre?.toLowerCase().includes('comida')) ||
            (horario === 'manana' && ing.nombre?.toLowerCase().includes('desayuno')) ||
            (horario === 'noche' && ing.nombre?.toLowerCase().includes('merienda'))
          );

          if (isPreMatchMeal) {
            let fatCount = 0;
            for (const item of parsed.items) {
              if (item.branch.fatBranch || /aove|aceite|mantequilla|frito/i.test(item.name)) {
                fatCount++;
                if (item.grams && item.grams > 35) {
                  report.incongruenciasEstructura.grasaElevadaEnPrepartido.push({
                    jugador: playerReady.nombre,
                    ingesta: ing.nombre,
                    alimento: item.name,
                    gramos: item.grams,
                    dia: `W${week + 1} ${dayKey}`,
                  });
                }
              }
            }
          }

          for (const item of parsed.items) {
            const lowerName = item.name.toLowerCase();

            // Validar gramajes
            const isUnitBased = /^\d+\s*(huevo|clara|unidad|rebanada)/i.test(item.name) || /batido|disuelto|infusión|café|té|agua/i.test(item.name);
            if (!isUnitBased) {
              if (item.grams !== null && (item.grams <= 0 || Number.isNaN(item.grams) || item.grams > 600)) {
                report.incongruenciasMacros.gramosAnomalos.push({
                  jugador: playerReady.nombre,
                  alimento: item.name,
                  gramos: item.grams,
                  ingesta: ing.nombre,
                  dia: `W${week + 1} ${dayKey}`,
                });
              }
            }

            // Restricciones clínicas
            if (isSinGluten) {
              const isBuckwheat = lowerName.includes('trigo sarraceno');
              const isLegumePasta = lowerName.includes('lenteja') || lowerName.includes('guisante');
              if (
                (!isBuckwheat && lowerName.includes('trigo')) ||
                lowerName.includes('cuscús') ||
                (lowerName.includes('pan') && !lowerName.includes('sin gluten')) ||
                (lowerName.includes('pasta') && !lowerName.includes('sin gluten') && !lowerName.includes('arroz') && !lowerName.includes('maíz') && !isLegumePasta && !isBuckwheat)
              ) {
                report.incongruenciasClinicas.glutenEnCeliaco.push({
                  jugador: playerReady.nombre,
                  alimento: item.name,
                  dia: `W${week + 1} ${dayKey}`,
                });
              }
            }

            if (isSinLactosa) {
              if (
                (lowerName.includes('leche') && !lowerName.includes('sin lactosa') && !lowerName.includes('avena') && !lowerName.includes('almendra') && !lowerName.includes('soja')) ||
                (lowerName.includes('queso') && !lowerName.includes('sin lactosa'))
              ) {
                report.incongruenciasClinicas.lactosaEnIntolerante.push({
                  jugador: playerReady.nombre,
                  alimento: item.name,
                  dia: `W${week + 1} ${dayKey}`,
                });
              }
            }

            if (isSinCerdo) {
              if (
                lowerName.includes('cerdo') ||
                lowerName.includes('jamón serrano') ||
                lowerName.includes('lomo embuchado') ||
                lowerName.includes('bacon')
              ) {
                report.incongruenciasClinicas.cerdoEnSinCerdo.push({
                  jugador: playerReady.nombre,
                  alimento: item.name,
                  dia: `W${week + 1} ${dayKey}`,
                });
              }
            }

            if (isSinPescado) {
              const branch = getFoodCategoryBranch(item.name, clinicalCatalog);
              if (branch.proteinBranch === 'pescado_blanco' || branch.proteinBranch === 'pescado_azul') {
                report.incongruenciasClinicas.pescadoEnSinPescado.push({
                  jugador: playerReady.nombre,
                  alimento: item.name,
                  dia: `W${week + 1} ${dayKey}`,
                });
              }
            }

            // Aversiones
            for (const av of aversionesList) {
              if (lowerName.includes(av)) {
                report.incongruenciasClinicas.alimentoAversionServido.push({
                  jugador: playerReady.nombre,
                  alimento: item.name,
                  aversion: av,
                  dia: `W${week + 1} ${dayKey}`,
                });
              }
            }
          }
        }

        // Colisiones Comida vs Cena
        if (comida && cena) {
          const cRes = parseItemsFromDetalle(comida.detalle, clinicalCatalog);
          const dRes = parseItemsFromDetalle(cena.detalle, clinicalCatalog);

          if (cRes.carbBranch && dRes.carbBranch && cRes.carbBranch === dRes.carbBranch) {
            const entry = {
              jugador: playerReady.nombre,
              dia: `W${week + 1} ${dayKey}`,
              rama: cRes.carbBranch,
              comida: cRes.carbFood,
              cena: dRes.carbFood,
            };
            if (cRes.carbBranch === 'arroz') report.colisionesMismoDia.arroz.push(entry);
            else if (cRes.carbBranch === 'tuberculos') report.colisionesMismoDia.tuberculos.push(entry);
            else if (cRes.carbBranch === 'pasta') report.colisionesMismoDia.pasta.push(entry);
          }

          if (cRes.proteinBranch && dRes.proteinBranch && cRes.proteinBranch === dRes.proteinBranch) {
            report.colisionesMismoDia.mismaProteina.push({
              jugador: playerReady.nombre,
              dia: `W${week + 1} ${dayKey}`,
              rama: cRes.proteinBranch,
              comida: cRes.proteinFood,
              cena: dRes.proteinFood,
            });
          }

          if (cRes.carbFood && dRes.carbFood && cRes.carbFood.toLowerCase() === dRes.carbFood.toLowerCase()) {
            report.colisionesMismoDia.mismoAlimentoExacto.push({
              jugador: playerReady.nombre,
              dia: `W${week + 1} ${dayKey}`,
              tipo: 'carb',
              alimento: cRes.carbFood,
            });
          }
          if (cRes.proteinFood && dRes.proteinFood && cRes.proteinFood.toLowerCase() === dRes.proteinFood.toLowerCase()) {
            report.colisionesMismoDia.mismoAlimentoExacto.push({
              jugador: playerReady.nombre,
              dia: `W${week + 1} ${dayKey}`,
              tipo: 'protein',
              alimento: cRes.proteinFood,
            });
          }

          // Rachas consecutivas
          if (cRes.carbBranch) {
            if (cRes.carbBranch === streakCarbBranch) {
              streakCarbCount++;
            } else {
              streakCarbBranch = cRes.carbBranch;
              streakCarbCount = 1;
            }
            if (streakCarbCount > report.colisionesConsecutivas.maxRachaCarb.racha) {
              report.colisionesConsecutivas.maxRachaCarb = {
                racha: streakCarbCount,
                detalle: `${playerReady.nombre} (${cRes.carbBranch}) W${week + 1} ${dayKey}`,
              };
            }
            if (streakCarbCount >= 3) {
              report.colisionesConsecutivas.racha3Carb.push({
                jugador: playerReady.nombre,
                rama: cRes.carbBranch,
                racha: streakCarbCount,
                dia: `W${week + 1} ${dayKey}`,
              });
            }
          }

          if (cRes.proteinBranch) {
            if (cRes.proteinBranch === streakProBranch) {
              streakProCount++;
            } else {
              streakProBranch = cRes.proteinBranch;
              streakProCount = 1;
            }
            if (streakProCount > report.colisionesConsecutivas.maxRachaPro.racha) {
              report.colisionesConsecutivas.maxRachaPro = {
                racha: streakProCount,
                detalle: `${playerReady.nombre} (${cRes.proteinBranch}) W${week + 1} ${dayKey}`,
              };
            }
            if (streakProCount >= 3) {
              report.colisionesConsecutivas.racha3Pro.push({
                jugador: playerReady.nombre,
                rama: cRes.proteinBranch,
                racha: streakProCount,
                dia: `W${week + 1} ${dayKey}`,
              });
            }
          }
        }
      }
    }

    if (playerIndex % 15 === 0 || playerIndex === jugadoresRaw.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${elapsed}s] Evaluados ${playerIndex}/${jugadoresRaw.length} jugadores... (${playerIndex * 70} días analizados)`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n========================================================================');
  console.log(`   INFORME DE AUDITORÍA PROFUNDA DE 70 DÍAS (${duration}s)`);
  console.log('========================================================================');
  console.log(`Total Jugadores:                    ${report.totalJugadores}`);
  console.log(`Total Planes Generados:             ${report.planesGenerados}`);
  console.log(`Total Días Evaluados:               ${report.totalDiasEvaluados}`);
  console.log(`Fallos de Ejecución (Crashes):      ${report.fallosEjecucion.length}`);

  console.log('\n--- 1. DUPLICADOS EN LA MISMA INGESTA (INTRA-MEAL) ---');
  console.log(`Alimentos Duplicados en Misma Toma: ${report.duplicadosMismaToma.length}`);
  if (report.duplicadosMismaToma.length > 0) {
    console.log('Muestras:', report.duplicadosMismaToma.slice(0, 5));
  }

  console.log('\n--- 2. COLISIONES EN EL MISMO DÍA (COMIDA vs CENA) ---');
  console.log(`Colisiones de Arroz:                ${report.colisionesMismoDia.arroz.length}`);
  console.log(`Colisiones de Tubérculos:           ${report.colisionesMismoDia.tuberculos.length}`);
  console.log(`Colisiones de Pasta:                ${report.colisionesMismoDia.pasta.length}`);
  console.log(`Misma Proteína Comida y Cena:       ${report.colisionesMismoDia.mismaProteina.length}`);
  console.log(`Mismo Alimento Exacto:              ${report.colisionesMismoDia.mismoAlimentoExacto.length}`);

  console.log('\n--- 3. RACHAS CONSECUTIVAS (DÍA TRAS DÍA) ---');
  console.log(`Máxima Racha Mismo Carbohidrato:    ${report.colisionesConsecutivas.maxRachaCarb.racha} días (${report.colisionesConsecutivas.maxRachaCarb.detalle})`);
  console.log(`Máxima Racha Misma Proteína:        ${report.colisionesConsecutivas.maxRachaPro.racha} días (${report.colisionesConsecutivas.maxRachaPro.detalle})`);
  console.log(`Rachas >= 3 días Carb:             ${report.colisionesConsecutivas.racha3Carb.length}`);
  console.log(`Rachas >= 3 días Proteína:         ${report.colisionesConsecutivas.racha3Pro.length}`);

  console.log('\n--- 4. INTEGRIDAD DE MACROS Y GRAMAJES ---');
  console.log(`Kcal Inválidas (<=0 o NaN):         ${report.incongruenciasMacros.kcalInvalida.length}`);
  console.log(`Desviación Calórica Excesiva (>35%):${report.incongruenciasMacros.desviacionKcalExcesiva.length}`);
  console.log(`Proteína fuera de rango (g/kg):     ${report.incongruenciasMacros.proteinaFueraDeRango.length}`);
  console.log(`Gramajes Anómalos (<=0 o >600g):    ${report.incongruenciasMacros.gramosAnomalos.length}`);
  if (report.incongruenciasMacros.gramosAnomalos.length > 0) {
    console.log('Muestras gramajes anómalos:', report.incongruenciasMacros.gramosAnomalos.slice(0, 5));
  }

  console.log('\n--- 5. RESTRICCIONES CLÍNICAS Y ALERGIAS ---');
  console.log(`Gluten a Celíacos:                  ${report.incongruenciasClinicas.glutenEnCeliaco.length}`);
  console.log(`Lactosa a Intolerantes:             ${report.incongruenciasClinicas.lactosaEnIntolerante.length}`);
  console.log(`Cerdo a Restringidos:               ${report.incongruenciasClinicas.cerdoEnSinCerdo.length}`);
  console.log(`Pescado a Restringidos:             ${report.incongruenciasClinicas.pescadoEnSinPescado.length}`);
  console.log(`Alimentos con Aversión Servidos:    ${report.incongruenciasClinicas.alimentoAversionServido.length}`);

  console.log('\n--- 6. ESTRUCTURA Y DÍA DE PARTIDO ---');
  console.log(`Días Faltantes:                     ${report.incongruenciasEstructura.diasFaltantes.length}`);
  console.log(`Ingestas Vacías:                    ${report.incongruenciasEstructura.ingestasVacias.length}`);
  console.log(`Cenas Perdidas en Partido:          ${report.incongruenciasEstructura.cenaPerdidaEnPartido.length}`);
  console.log(`Grasa Excesiva Prepartido (>35g):   ${report.incongruenciasEstructura.grasaElevadaEnPrepartido.length}`);

  // Guardar archivo JSON con los detalles completos
  fs.writeFileSync('scratch/deep_audit_70_days_result.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('\nInforme detallado guardado en scratch/deep_audit_70_days_result.json.');
}

runDeepAudit().catch((err) => {
  console.error('Error fatal durante la auditoría profunda:', err);
  process.exit(1);
});
