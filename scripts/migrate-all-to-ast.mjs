import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { convertLegacyToAst, convertDishToAst, convertServiceToAst } from '../lib/engine/meal-ast.js';

// Parse .env.local
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

async function runMigration() {
  console.log('🚀 Iniciando migración masiva a AST para todos los jugadores...');

  const { data: players, error } = await supabase
    .from('jugadores')
    .select('id, nombre, recomendaciones_defecto, config_prepartido');

  if (error) {
    console.error('❌ Error al obtener jugadores:', error);
    process.exit(1);
  }

  console.log(`📋 Total de jugadores en base de datos: ${players.length}`);

  let updatedCount = 0;
  let recsMigratedCount = 0;
  let prepartidoMigratedCount = 0;

  for (const player of players) {
    let hasChanges = false;
    const updates = {};

    // 1. Migrar recomendaciones_defecto
    if (player.recomendaciones_defecto && typeof player.recomendaciones_defecto === 'object') {
      const currentRecs = player.recomendaciones_defecto;
      const newRecs = {};
      let recsChanged = false;

      for (const [meal, mealData] of Object.entries(currentRecs)) {
        if (!mealData) continue;
        const migratedAst = convertLegacyToAst(mealData);
        newRecs[meal] = migratedAst;
        recsChanged = true;
      }

      if (recsChanged) {
        updates.recomendaciones_defecto = newRecs;
        hasChanges = true;
        recsMigratedCount++;
      }
    }

    // 2. Migrar config_prepartido
    if (player.config_prepartido && typeof player.config_prepartido === 'object') {
      const currentPrepartido = player.config_prepartido;
      const newPrepartido = {};
      let prepartidoChanged = false;

      for (const [scheduleKey, schedConfig] of Object.entries(currentPrepartido)) {
        if (!schedConfig || typeof schedConfig !== 'object') {
          newPrepartido[scheduleKey] = schedConfig;
          continue;
        }

        const newSchedConfig = { ...schedConfig };
        if (schedConfig.recomendaciones && typeof schedConfig.recomendaciones === 'object') {
          const newMealRecs = {};
          for (const [meal, mealData] of Object.entries(schedConfig.recomendaciones)) {
            if (!mealData) continue;
            newMealRecs[meal] = convertLegacyToAst(mealData);
          }
          newSchedConfig.recomendaciones = newMealRecs;
          prepartidoChanged = true;
        }

        newPrepartido[scheduleKey] = newSchedConfig;
      }

      if (prepartidoChanged) {
        updates.config_prepartido = newPrepartido;
        hasChanges = true;
        prepartidoMigratedCount++;
      }
    }

    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('jugadores')
        .update(updates)
        .eq('id', player.id);

      if (updateError) {
        console.error(`❌ Error actualizando jugador ${player.nombre} (${player.id}):`, updateError);
      } else {
        updatedCount++;
        console.log(`✅ Jugador actualizado: ${player.nombre}`);
      }
    }
  }

  console.log('\n====================================');
  console.log(`🎉 Migración de jugadores finalizada:`);
  console.log(`   - Jugadores actualizados: ${updatedCount}`);
  console.log(`   - Pautas por defecto migradas: ${recsMigratedCount}`);
  console.log(`   - Rutinas prepartido migradas: ${prepartidoMigratedCount}`);
  console.log('====================================\n');

  await migrateMenusToAst();
}

async function migrateMenusToAst() {
  console.log('🍽️  Iniciando migración de menús semanales a AST...');
  const { data: menus, error } = await supabase
    .from('menu_semanal')
    .select('id, semana, dias');

  if (error) {
    console.error('❌ Error al obtener menús semanales:', error);
    return;
  }

  console.log(`📋 Total de menús semanales en base de datos: ${menus.length}`);
  let menusUpdated = 0;

  for (const menu of menus) {
    if (!Array.isArray(menu.dias)) continue;
    let modified = false;

    const newDias = menu.dias.map((d) => {
      const day = { ...d };
      for (const service of ['comida', 'cena']) {
        if (day[service] && typeof day[service] === 'object') {
          const s = { ...day[service] };
          if (Array.isArray(s.platos_desglosados)) {
            s.platos_desglosados = s.platos_desglosados.map((dish) => {
              if (dish && !dish.tree) {
                modified = true;
                return {
                  ...dish,
                  tree: convertDishToAst(dish),
                };
              }
              return dish;
            });
          }
          const serviceAst = convertServiceToAst(s);
          if (serviceAst) {
            s.tree = serviceAst;
            modified = true;
          }
          day[service] = s;
        }
      }
      return day;
    });

    if (modified) {
      const { error: updateError } = await supabase
        .from('menu_semanal')
        .update({ dias: newDias })
        .eq('id', menu.id);

      if (updateError) {
        console.error(`❌ Error actualizando menú #${menu.id} (${menu.semana}):`, updateError);
      } else {
        menusUpdated++;
        console.log(`✅ Menú #${menu.id} (${menu.semana}) migrado a AST.`);
      }
    }
  }

  console.log('\n====================================');
  console.log(`🎉 Migración de menús finalizada:`);
  console.log(`   - Menús semanales actualizados a AST: ${menusUpdated}/${menus.length}`);
  console.log('====================================\n');
}

runMigration().catch((err) => {
  console.error('Error fatal durante la migración:', err);
  process.exit(1);
});
