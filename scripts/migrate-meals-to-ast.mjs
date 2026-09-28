import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { convertLegacyToAst, validateMealAst } from '../lib/engine/meal-ast.js';

const PAGE_SIZE = 500;
const DRY_RUN = !process.argv.includes('--write');
const BACKUP_PATH = 'scratch/meal-ast-migration-backup.json';

function readEnvFile() {
  const envVars = {};
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    let value = match[2] || '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[match[1]] = value;
  }
  return envVars;
}

export function migrateDish(dish) {
  if (!dish) return null;
  const existingTree = dish.tree?.type ? dish.tree : null;
  if (existingTree) {
    if (existingTree.type === 'food' && (existingTree.name || existingTree.label)) {
      return { nombre: dish.nombre, curso: dish.curso, tree: existingTree };
    }
    if ((existingTree.type === 'allOf' || existingTree.type === 'oneOf') && Array.isArray(existingTree.children) && existingTree.children.length > 0) {
      return { nombre: dish.nombre, curso: dish.curso, tree: existingTree };
    }
  }
  if (Array.isArray(dish.alternativas) && dish.alternativas.length > 0) {
    throw new Error(`El plato "${dish.nombre || 'sin nombre'}" tiene alternativas legacy que requieren revisión manual.`);
  }
  const categoryByKey = {
    hidrato: 'hidratos', proteina: 'proteina', verdura: 'verduras', fruta: 'frutas', lacteo: 'lacteos', grasa: 'grasas',
  };
  const children = [];
  for (const [key, category] of Object.entries(categoryByKey)) {
    const value = dish[key];
    const list = Array.isArray(value) ? value : value ? [value] : [];
    list.forEach((name) => {
      if (name && name !== 'Sin grasa añadida') children.push({ type: 'food', category, name: String(name) });
    });
  }
  if (children.length === 0) return null;
  return { nombre: dish.nombre, curso: dish.curso, tree: { type: 'allOf', label: dish.nombre || 'Plato', children } };
}

export function migrateService(service) {
  if (!service || typeof service !== 'object') return service;
  const legacyDishes = Array.isArray(service.platos_desglosados) ? service.platos_desglosados : [];
  const dishes = legacyDishes.map(migrateDish).filter((dish) => dish?.tree);

  const presentation = {
    primero: service.primero || null,
    segundo: service.segundo || null,
    postre: service.postre || null,
  };
  if (dishes.length === 0) {
    if (service.tree?.type) {
      const val = validateMealAst({ type: 'meal', tree: service.tree });
      if (val.valid) return { ...presentation, tree: service.tree };
    }
    return presentation;
  }
  const courses = [];
  for (const course of ['primero', 'segundo', 'postre']) {
    const options = dishes.filter((dish) => dish.curso === course).map((dish) => ({
      ...dish.tree,
      label: dish.nombre,
      ...(course === 'postre' ? { course: 'postre' } : {}),
    }));
    if (options.length > 0) courses.push({ type: 'oneOf', label: course, course, children: options });
  }
  return courses.length > 0
    ? { ...presentation, tree: { type: 'allOf', label: 'Servicio de menú', children: courses } }
    : presentation;
}

export function migratePlayerMeal(meal) {
  if (!meal) return null;
  let normalized;
  if (meal.type === 'complete') {
    normalized = meal;
  } else if (meal.type === 'meal' && meal.tree) {
    normalized = meal;
  } else if (meal.tree || ['allOf', 'oneOf', 'food'].includes(meal.type)) {
    normalized = convertLegacyToAst(meal);
  } else if (typeof meal === 'string' || Array.isArray(meal.alternativas) || meal.isComplete === true || (typeof meal === 'object' && meal !== null)) {
    normalized = convertLegacyToAst(meal);
  } else {
    throw new Error('La pauta no tiene AST ni una estructura legacy reconocida para conversión.');
  }

  const validation = validateMealAst(normalized);
  if (!validation.valid) {
    throw new Error(`Pauta AST no válida: ${validation.error}`);
  }
  return normalized;
}

export function migratePlayerRecord(player) {
  const issues = [];
  const recommendations = {};
  for (const [mealName, meal] of Object.entries(player.recomendaciones_defecto || {})) {
    try {
      recommendations[mealName] = migratePlayerMeal(meal);
    } catch (error) {
      issues.push({ path: `recomendaciones_defecto.${mealName}`, error: error.message });
      recommendations[mealName] = meal;
    }
  }
  const preMatch = {};
  for (const [schedule, config] of Object.entries(player.config_prepartido || {})) {
    if (!config || typeof config !== 'object') {
      preMatch[schedule] = config;
      continue;
    }
    const { dia_anterior: dayBefore, recomendaciones = {}, ...rest } = config;
    const migratedRecs = {};
    for (const [mealName, meal] of Object.entries(recomendaciones)) {
      try {
        migratedRecs[mealName] = migratePlayerMeal(meal);
      } catch (error) {
        issues.push({ path: `config_prepartido.${schedule}.recomendaciones.${mealName}`, error: error.message });
        migratedRecs[mealName] = meal;
      }
    }
    if (dayBefore && !migratedRecs.Cena && !migratedRecs.cena) {
      try {
        migratedRecs.Cena = migratePlayerMeal(dayBefore);
      } catch (error) {
        issues.push({ path: `config_prepartido.${schedule}.dia_anterior`, error: error.message });
      }
    }
    preMatch[schedule] = { ...rest, recomendaciones: migratedRecs };
  }
  return { ...player, recomendaciones_defecto: recommendations, config_prepartido: preMatch, migrationIssues: issues };
}

export function migrateMenu(menu) {
  const issues = [];
  const dias = (menu.dias || []).map((day) => {
    const nextDay = { dia: day.dia };
    for (const serviceName of ['comida', 'cena']) {
      try {
        nextDay[serviceName] = migrateService(day[serviceName]);
      } catch (error) {
        issues.push({ path: `${day.dia}.${serviceName}`, error: error.message });
        nextDay[serviceName] = day[serviceName];
      }
    }
    return nextDay;
  });
  return { ...menu, dias, migrationIssues: issues };
}

async function fetchAll(supabase, table, select) {
  const allRows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allRows.push(...(data || []));
    if (table === 'jugadores') {
      for (const row of data || []) {
        if (row.recomendaciones_defecto && typeof row.recomendaciones_defecto !== 'object') {
          throw new Error(`jugadores.${row.id}.recomendaciones_defecto no es un objeto JSON`);
        }
      }
    }
    if (!data || data.length < PAGE_SIZE) return allRows;
  }
}

function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalJson);
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalJson(obj[key]);
  }
  return sorted;
}

async function migrateTable({ supabase, table, idColumn, select, transform, backupRows }) {
  const rows = await fetchAll(supabase, table, select);
  let updated = 0;
  let unchanged = 0;
  const errors = [];

  for (const row of rows) {
    try {
      const payload = transform(row);
      const beforeRelevant = table === 'jugadores'
        ? { recomendaciones_defecto: row.recomendaciones_defecto || {}, config_prepartido: row.config_prepartido || {} }
        : { dias: row.dias || [] };
      if (JSON.stringify(canonicalJson(payload)) === JSON.stringify(canonicalJson(beforeRelevant))) {
        unchanged++;
        continue;
      }
      backupRows.push({ table, id: row[idColumn], before: row });
      if (!DRY_RUN) {
        const { error } = await supabase.from(table).update(payload).eq(idColumn, row[idColumn]);
        if (error) throw error;
      }
      updated++;
    } catch (error) {
      errors.push({ id: row[idColumn], error: error.message });
    }
  }

  return { table, count: rows.length, updated, unchanged, errors };
}

async function main() {
  const env = readEnvFile();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: env.SUPABASE_SCHEMA || 'teams' },
  });
  const backupRows = [];

  const players = await migrateTable({
    supabase,
    table: 'jugadores',
    idColumn: 'id',
    select: 'id,nombre,recomendaciones_defecto,config_prepartido',
    transform: (player) => {
      const { migrationIssues, recomendaciones_defecto, config_prepartido } = migratePlayerRecord(player);
      if (migrationIssues.length > 0) throw new Error(JSON.stringify(migrationIssues));
      return { recomendaciones_defecto, config_prepartido };
    },
    backupRows,
  });
  const menus = await migrateTable({
    supabase,
    table: 'menu_semanal',
    idColumn: 'id',
    select: 'id,semana,dias',
    transform: (menu) => {
      const { migrationIssues, dias } = migrateMenu(menu);
      if (migrationIssues.length > 0) throw new Error(JSON.stringify(migrationIssues));
      return { dias };
    },
    backupRows,
  });

  const report = {
    mode: DRY_RUN ? 'dry-run' : 'write',
    createdAt: new Date().toISOString(),
    backupPath: BACKUP_PATH,
    players,
    menus,
    totalErrors: players.errors.length + menus.errors.length,
  };
  fs.mkdirSync('scratch', { recursive: true });
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(backupRows, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.totalErrors > 0) process.exitCode = 1;
}

const isMainScript = process.argv[1] && (
  process.argv[1].endsWith('migrate-meals-to-ast.mjs') ||
  process.argv[1].endsWith('migrate-meals-to-ast')
);

if (isMainScript) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
