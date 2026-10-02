import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { getClinicalCatalogForPlayer } from '../lib/nutrition/clinical-catalog.js';
import { getFullFoodTree, createFoodItemFromName, getNodeFromTree, buildPlayerFoodTree, canResolveNodeForPlayer } from '../lib/engine/food-tree.js';
import { normalizeFoodName } from '../data/foods-crudo.js';
const envVars = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/); if (m) { let v = m[2] || ''; if (/^["'].*["']$/.test(v)) v = v.slice(1, -1); envVars[m[1]] = v; } }
const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, db: { schema: 'teams' } });
const full = getFullFoodTree();
const { data } = await sb.from('jugadores').select('id,nombre,apellidos,intolerancias,aversiones,alergias,recomendaciones_defecto,config_prepartido');
const leaves = (n, acc = []) => { if (n?.type === 'food') acc.push(n.name); (n?.children || []).forEach((c) => leaves(c, acc)); return acc; };
let total = 0, bad = 0; const rows = [];
for (const p of data) {
  const cat = getClinicalCatalogForPlayer(p, { useMenuCatalog: true }); const tree = buildPlayerFoodTree(cat);
  const check = (where, pa) => { if (!pa?.tree) return; total++; const inv = [];
    for (const name of leaves(pa.tree)) { const concrete = createFoodItemFromName(name, null, full); const key = normalizeFoodName(name);
      if (concrete) { if (!cat.foodsByNormalizedName.has(normalizeFoodName(concrete.name)) && !cat.namedOnly.has(normalizeFoodName(concrete.name))) { const alt = [' sin gluten', ' sin lactosa'].map((s) => normalizeFoodName(concrete.name + s)).find((k) => cat.foodsByNormalizedName.has(k)); inv.push(`${name}${alt ? ` → ${cat.foodsByNormalizedName.get(alt).name}` : ' → (sin equivalente: quitar)'}`); } }
      else if (getNodeFromTree(name, full) && !canResolveNodeForPlayer(name, cat, tree)) inv.push(`${name} [grupo sin opciones aptas]`); }
    if (inv.length) { bad++; rows.push(`${p.id}:${p.nombre.trim()} (${p.intolerancias || '-'} | av: ${p.aversiones || '-'}) ${where} "${String(pa.raw).slice(0, 60)}" → ${inv.join('; ')}`); } };
  for (const [m, pa] of Object.entries(p.recomendaciones_defecto || {})) check(`def/${m}`, pa);
  for (const [h, cfg] of Object.entries(p.config_prepartido || {})) for (const [m, pa] of Object.entries(cfg.recomendaciones || {})) check(`${h}/${m}`, pa);
}
console.log(`pautas con árbol: ${total} | con algún alimento no apto para su propio jugador: ${bad}`); rows.forEach((r) => console.log(' ', r));
