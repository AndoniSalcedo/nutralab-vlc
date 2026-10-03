/**
 * Migra los AST guardados (pautas por defecto, protocolo pre-partido y menús) al vocabulario
 * del árbol nutricional:
 * - Cada hoja "food" pasa a referenciar un nodo existente (rama o alimento) con su nombre canónico.
 * - Los nombres que no existían se traducen con REFERENCE_MAP (revisado a mano); las hierbas y
 *   condimentos sin equivalente en el catálogo se eliminan.
 * - Se elimina la propiedad obsoleta `category` de las hojas.
 * - Las pautas "meal" sin árbol (o con árbol vacío) pasan a rotación variada.
 *
 * Uso: npm run meals:migrate:names            (simulación, no escribe)
 *      npm run meals:migrate:names -- --write (escribe y guarda copia de seguridad)
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createFoodItemFromName, findTreeNode, getFullFoodTree } from '../lib/engine/food-tree.js';
import {
  validateAstValue,
  astNodeSchema,
  mealPatternsSchema,
  preMatchConfigSchema,
} from '../validations/mealAstSchema.js';

const DRY_RUN = !process.argv.includes('--write');
// .bak: ignorado por git (contiene datos de jugadores).
const BACKUP_PATH = 'scratch/ast-food-names-migration-backup.bak';

const oneOf = (...names) => ({ oneOf: names });

/** Nombre guardado → referencia del árbol. `null` = sin equivalente en el catálogo (se elimina). */
const REFERENCE_MAP = {
  // Grupos genéricos
  'Fruta fresca': 'Frutas',
  'Fruta de temporada': 'Frutas',
  'Frutos rojos': oneOf('Frambuesas', 'Arándanos', 'Fresas'),
  'Cítricos': oneOf('Naranja', 'Mandarina'),
  'Verduras variadas': 'Verduras y Hortalizas',
  'Verduras a la plancha': 'Verduras y Hortalizas',
  'Verduras de temporada': 'Verduras y Hortalizas',
  'Vegetales variados': 'Verduras y Hortalizas',
  'Hojas verdes y ensaladas': oneOf('Lechuga romana', 'Rúcula', 'Espinaca'),
  'Leche': 'Leches (Grupo genérico)',
  'Queso': 'Quesos (Grupo genérico)',
  'Huevo': 'Huevos',
  'embutidos_fiambres': 'Embutidos y fiambres',
  'Pescado blanco': 'Pescado blanco (Genérico)',
  'San Pedro': 'Pescado blanco (Genérico)',
  'Pescado para ceviche (especie no especificada)': 'Pescado blanco (Genérico)',
  'Pescado variado': 'Pescado (Genérico)',
  'Pescado y marisco variados': oneOf('Pescado (Genérico)', 'Marisco'),
  'Pollo troceado': 'Pollo (Genérico)',
  'Pollo (corte no especificado)': 'Pollo (Genérico)',
  'Pollo en dados': 'Pollo (Genérico)',
  'Carne de kebab de pollo': 'Pollo (Genérico)',
  'Nuggets de pollo': 'Pollo (Genérico)',
  'Muslo de pavo': 'Pavo (Genérico)',
  'Ternera (corte no especificado)': 'Vacuno / Carne Roja',
  'Carrillera de ternera': 'Vacuno / Carne Roja',
  'Carne de ternera para guisar': 'Vacuno / Carne Roja',
  'Carne de barbacoa (tipo y corte no especificados)': 'Carne (Genérico)',
  'Salchicha de cerdo': 'Cerdo fresco',
  'Butifarra': 'Cerdo fresco',
  'Copos de avena (Grupo genérico)': 'Cereales y Avena',
  'Pancakes': 'Cereales y Avena',
  'fideos': 'Pasta (Grupo genérico)',

  // Opciones alternativas escritas como un único ingrediente
  'patata y boniato': oneOf('Patata', 'Boniato'),
  'arroz y pasta': oneOf('Arroz (Grupo genérico)', 'Pasta (Grupo genérico)'),
  'pasta y arroz': oneOf('Pasta (Grupo genérico)', 'Arroz (Grupo genérico)'),
  'arroz y fideos': oneOf('Arroz (Grupo genérico)', 'Pasta (Grupo genérico)'),
  'arroz, pasta y ñoquis': oneOf('Arroz (Grupo genérico)', 'Pasta (Grupo genérico)', 'Ñoquis'),
  'patata, arroz y pasta': oneOf('Patata', 'Arroz (Grupo genérico)', 'Pasta (Grupo genérico)'),
  'pasta, arroz y patata': oneOf('Pasta (Grupo genérico)', 'Arroz (Grupo genérico)', 'Patata'),
  'lentejas, arroz y pasta': oneOf('Lentejas', 'Arroz (Grupo genérico)', 'Pasta (Grupo genérico)'),
  'lentejas, fideos y arroz': oneOf('Lentejas', 'Pasta (Grupo genérico)', 'Arroz (Grupo genérico)'),

  // Alimento concreto equivalente del catálogo
  'Yogur proteico': 'Yogur proteico natural',
  'Pimiento verde': 'Pimiento',
  'Espinacas': 'Espinaca',
  'Tomate cherry': 'Tomate',
  'Secreto ibérico': 'Secreto de cerdo',
  'Pluma de cerdo': 'Presa ibérica',
  'Lagarto ibérico': 'Presa ibérica',
  'Queso feta': 'Queso fresco',
  'Queso rallado': 'Queso parmesano',
  'Parmesano': 'Queso parmesano',
  'Queso mozzarella': 'Mozzarella fresca',
  'Mozzarella': 'Mozzarella fresca',
  'Ricotta': 'Requesón',
  'Ricota': 'Requesón',
  'Espárragos': 'Espárragos verdes',
  'Espárrago verde': 'Espárragos verdes',
  'Espárragos trigueros': 'Espárragos verdes',
  'Lechuga': 'Lechuga romana',
  'Pepinillo': 'Pepino',
  'Cebolleta': 'Cebolla',
  'Cebolla roja': 'Cebolla',
  'Cebolla morada': 'Cebolla',
  'Cebolla dulce': 'Cebolla',
  'Setas': 'Champiñón',
  'Champiñones': 'Champiñón',
  'Tirabeques': 'Judías verdes',
  'Guisante': 'Guisantes',
  'Habitas': 'Guisantes',
  'habitas': 'Guisantes',
  'Garrofón': 'Alubia blanca',
  'Jamón': 'Jamón serrano',
  'Pavo de fiambre': 'Pechuga de pavo (lonchas)',
  'Carne picada de potro': 'Hamburguesa de potro',
  'Carne picada de cordero': 'Cordero (parte más magra)',
  'Entrecote de ternera': 'Entrecot de ternera',
  'Redondo de ternera': 'Filete de ternera',
  'Solomillo de pollo': 'Solomillos de pollo',
  'Mejillones': 'Mejillones frescos',
  'Langostinos': 'Gambas',
  'Atún': 'Atún fresco',
  'Fresa': 'Fresas',
  'Cacahuete': 'Cacahuete (maní)',
  'Zumo': 'Zumo de naranja natural',
  'Ensure': 'Ensure Nutrición Entera',

  // Verduras sin ficha propia en el catálogo: rama de verduras
  'Col': 'Verduras y Hortalizas',
  'Calabaza': 'Verduras y Hortalizas',
  'Apio': 'Verduras y Hortalizas',
  'Apionabo': 'Verduras y Hortalizas',
  'Kale': 'Verduras y Hortalizas',
  'Brotes de soja': 'Verduras y Hortalizas',

  // Sin equivalente nutricional en el catálogo (hierbas, especias, guarniciones menores): se eliminan
  'Albahaca': null,
  'Perejil': null,
  'Cilantro': null,
  'Menta': null,
  'Romero': null,
  'Orégano': null,
  'Pimentón': null,
  'Jengibre': null,
  'Trufa': null,
  'Limón': null,
  'Alga wakame': null,
  'Aceitunas negras': null,
  'Aceituna negra': null,
  'Aceitunas': null,
  'Aceituna': null,
  'Nata': null,
  'pan rallado': null,
  'Pan rallado': null,
  'harina de trigo': null,
  'Edamame': null,
  'Maíz': null,
};

/**
 * Alimentos renombrados o fusionados al unificar foods-menu con foods-crudo: el nombre antiguo pasa al nuevo
 * antes de buscarlo en el árbol (algunos, como "Arroz", coincidirían si no con una rama genérica).
 */
const RENAMED_FOODS = {
  'Huevo entero tortilla': 'Huevo entero',
  'Huevo plancha': 'Huevo entero',
  'Huevo duro': 'Huevo entero',
  'Huevo cocido': 'Huevo entero',
  'Colas de gamba': 'Gambas',
  'Yogur de proteína': 'Yogur proteico natural',
  'Judía verde': 'Judías verdes',
  'Tofu firme': 'Tofu',
  'Sardina': 'Sardinas',
  'Chuletas de pavo': 'Chuleta de pavo',
  'Atún en conserva': 'Atún natural conserva natural',
  'Emperador (pez espada)': 'Emperador',
  'Ñoquis de patata': 'Ñoquis',
  'Arroz': 'Arroz blanco',
  'Pan blanco de barra': 'Pan blanco',
  'Anacardo (marañón)': 'Anacardos',
  'Avellana': 'Avellanas',
  'Frambuesa': 'Frambuesas',
  'Garbanzo': 'Garbanzos',
  'Tortas de arroz': 'Tortitas de arroz',
  'Trigo sarraceno hinchado': 'Cereales de trigo sarraceno hinchados',
};

const fullTree = getFullFoodTree();

/** Nombre canónico con la misma prioridad que el generador: alimento exacto primero, después rama. */
function canonicalName(name) {
  const food = createFoodItemFromName(name, null, fullTree);
  if (food) return food.name;
  const node = findTreeNode(name, fullTree);
  return node ? node.label || name : null;
}

// Todas las referencias destino deben existir en el árbol.
for (const [source, target] of Object.entries(REFERENCE_MAP)) {
  const targets = target === null ? [] : typeof target === 'string' ? [target] : target.oneOf;
  const missing = targets.filter((name) => !canonicalName(name));
  if (missing.length > 0) throw new Error(`REFERENCE_MAP["${source}"] apunta a nodos inexistentes: ${missing.join(', ')}`);
}

function createReport() {
  return { renamed: new Map(), dropped: new Map(), unmapped: new Map(), emptiedPatterns: [] };
}
const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);

export function migrateAstNode(node, report) {
  if (!node || typeof node !== 'object') return null;

  if (node.type === 'food') {
    const storedName = String(node.name || node.foodName || node.label || '').trim();
    if (!storedName) return null;
    const name = RENAMED_FOODS[storedName] || storedName;
    if (name !== storedName) bump(report.renamed, `${storedName} → ${name}`);
    const canonical = canonicalName(name);
    if (canonical) {
      if (canonical !== name) bump(report.renamed, `${name} → ${canonical}`);
      return { type: 'food', name: canonical };
    }
    if (!(name in REFERENCE_MAP)) {
      bump(report.unmapped, name);
      return { type: 'food', name };
    }
    const target = REFERENCE_MAP[name];
    if (target === null) {
      bump(report.dropped, name);
      return null;
    }
    if (typeof target === 'string') {
      bump(report.renamed, `${name} → ${canonicalName(target)}`);
      return { type: 'food', name: canonicalName(target) };
    }
    bump(report.renamed, `${name} → (${target.oneOf.join(' o ')})`);
    return { type: 'oneOf', children: target.oneOf.map((option) => ({ type: 'food', name: canonicalName(option) })) };
  }

  if (node.type !== 'allOf' && node.type !== 'oneOf') return null;
  const children = (node.children || []).map((child) => migrateAstNode(child, report)).filter(Boolean);
  if (children.length === 0) return null;
  return {
    type: node.type,
    ...(node.label ? { label: node.label } : {}),
    ...(node.course ? { course: node.course } : {}),
    children,
  };
}

function migratePattern(pattern, report, where) {
  if (!pattern || typeof pattern !== 'object') return pattern;
  const { tree, ...rest } = pattern;
  if (pattern.type === 'complete') return { ...rest, type: 'complete' };

  const migratedTree = migrateAstNode(tree, report);
  if (!migratedTree) {
    report.emptiedPatterns.push(where);
    return { ...rest, type: 'complete', label: 'Rotación variada', unrecognized: [] };
  }
  return { ...rest, type: 'meal', tree: migratedTree };
}

export function migratePlayer(player, report) {
  const where = `jugador ${player.id}`;
  const recomendaciones_defecto = Object.fromEntries(
    Object.entries(player.recomendaciones_defecto || {}).map(([meal, pattern]) => [meal, migratePattern(pattern, report, `${where} · ${meal}`)])
  );
  const config_prepartido = Object.fromEntries(
    Object.entries(player.config_prepartido || {}).map(([schedule, cfg]) => [schedule, {
      ...cfg,
      ...(cfg?.recomendaciones ? {
        recomendaciones: Object.fromEntries(
          Object.entries(cfg.recomendaciones).map(([meal, pattern]) => [meal, migratePattern(pattern, report, `${where} · prepartido ${schedule} · ${meal}`)])
        ),
      } : {}),
    }])
  );
  return { recomendaciones_defecto, config_prepartido };
}

export function migrateMenuDias(dias, report) {
  return (dias || []).map((day) => {
    const next = { ...day };
    for (const service of ['comida', 'cena']) {
      if (!day?.[service]?.tree) continue;
      next[service] = { ...day[service], tree: migrateAstNode(day[service].tree, report) };
    }
    return next;
  });
}

/** Serialización con claves ordenadas: jsonb no conserva el orden de las claves. */
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

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

async function run() {
  const env = readEnvFile();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: env.SUPABASE_SCHEMA || 'teams' },
  });

  const { data: players, error: playersError } = await supabase.from('jugadores').select('id, recomendaciones_defecto, config_prepartido');
  if (playersError) throw playersError;
  const { data: menus, error: menusError } = await supabase.from('menu_semanal').select('id, dias');
  if (menusError) throw menusError;

  const report = createReport();
  const playerUpdates = [];
  const menuUpdates = [];
  const invalid = [];

  for (const player of players) {
    const migrated = migratePlayer(player, report);
    const recs = validateAstValue(mealPatternsSchema, migrated.recomendaciones_defecto, { label: `jugador ${player.id} · pautas` });
    const pre = validateAstValue(preMatchConfigSchema, migrated.config_prepartido, { label: `jugador ${player.id} · prepartido` });
    if (!recs.success) invalid.push(recs.error);
    if (!pre.success) invalid.push(pre.error);
    if (stableStringify(migrated) !== stableStringify({ recomendaciones_defecto: player.recomendaciones_defecto || {}, config_prepartido: player.config_prepartido || {} })) {
      playerUpdates.push({ id: player.id, ...migrated });
    }
  }
  for (const menu of menus) {
    const dias = migrateMenuDias(menu.dias, report);
    for (const day of dias) {
      for (const service of ['comida', 'cena']) {
        if (!day?.[service]?.tree) continue;
        const check = validateAstValue(astNodeSchema, day[service].tree, { label: `menú ${menu.id} · ${day.dia} · ${service}` });
        if (!check.success) invalid.push(check.error);
      }
    }
    if (stableStringify(dias) !== stableStringify(menu.dias)) menuUpdates.push({ id: menu.id, dias });
  }

  const print = (title, map) => {
    console.log(`\n${title} (${map.size})`);
    [...map].sort((a, b) => b[1] - a[1]).forEach(([key, count]) => console.log(`  ${key}  x${count}`));
  };
  print('Referencias traducidas', report.renamed);
  print('Referencias eliminadas (sin equivalente)', report.dropped);
  print('Referencias SIN TRADUCCIÓN (se mantienen; revisar)', report.unmapped);
  console.log(`\nPautas que quedan sin árbol → rotación variada (${report.emptiedPatterns.length})`);
  report.emptiedPatterns.forEach((where) => console.log(`  ${where}`));
  console.log(`\nJugadores a actualizar: ${playerUpdates.length} · Menús a actualizar: ${menuUpdates.length}`);
  console.log(`Valores que siguen sin pasar la validación: ${invalid.length}`);
  invalid.forEach((message) => console.log(`  ${message}`));

  if (DRY_RUN) {
    console.log('\nSimulación: no se ha escrito nada. Ejecuta con --write para aplicar.');
    return;
  }
  if (invalid.length > 0 || report.unmapped.size > 0) {
    throw new Error('Hay valores sin traducir o inválidos: revisa REFERENCE_MAP antes de escribir.');
  }

  fs.writeFileSync(BACKUP_PATH, JSON.stringify({
    createdAt: new Date().toISOString(),
    players: players.filter((p) => playerUpdates.some((u) => u.id === p.id)),
    menus: menus.filter((m) => menuUpdates.some((u) => u.id === m.id)),
  }, null, 2));
  console.log(`Copia de seguridad: ${BACKUP_PATH}`);

  for (const update of playerUpdates) {
    const { error } = await supabase.from('jugadores').update({
      recomendaciones_defecto: update.recomendaciones_defecto,
      config_prepartido: update.config_prepartido,
    }).eq('id', update.id);
    if (error) throw error;
  }
  for (const update of menuUpdates) {
    const { error } = await supabase.from('menu_semanal').update({ dias: update.dias }).eq('id', update.id);
    if (error) throw error;
  }
  console.log('Migración aplicada.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
