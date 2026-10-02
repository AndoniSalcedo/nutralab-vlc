import { FOODS_CRUDO } from '../data/foods-crudo.js';
import { FOODS_MENU } from '../data/foods-menu.js';
import { normalizeFoodName } from '../data/foods-crudo.js';
const nm = (f) => f.normalizedName || normalizeFoodName(f.name);
const crudoBy = new Map(FOODS_CRUDO.map((f) => [nm(f), f]));
const menuBy = new Map(FOODS_MENU.map((f) => [nm(f), f]));
console.log('crudo', FOODS_CRUDO.length, '| menu', FOODS_MENU.length, '| nombres en ambos', [...menuBy.keys()].filter((k) => crudoBy.has(k)).length);
// emparejar menú -> crudo por nombre o por originalName
const pairs = []; const menuOnly = [];
for (const m of FOODS_MENU) {
  const c = crudoBy.get(nm(m)) || crudoBy.get(normalizeFoodName(m.originalName || ''));
  if (c) pairs.push([m, c]); else menuOnly.push(m);
}
console.log('pares menú↔crudo', pairs.length, '| solo en menú', menuOnly.length);
const rel = (a, b) => (Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b)));
const diffs = [];
for (const [m, c] of pairs) {
  const d = { name: m.name, crudo: c.name };
  let max = 0; const parts = [];
  for (const k of ['kcal', 'pro', 'cho', 'fat']) { const r = rel(m[k], c[k]); const abs = Math.abs(m[k] - c[k]); if (r > 0.15 && (k === 'kcal' ? abs > 20 : abs > 2)) { parts.push(`${k} ${c[k]}→${m[k]}`); max = Math.max(max, r); } }
  const tags = (x) => [...(x.tags || [])].sort().join(',');
  const path = (x) => (x.treePath || []).join('>');
  if (tags(m) !== tags(c)) parts.push(`tags [${tags(c)}]→[${tags(m)}]`);
  if (path(m) !== path(c)) parts.push(`ruta ${path(c)}→${path(m)}`);
  if (m.minGrams !== c.minGrams || m.maxGrams !== c.maxGrams) parts.push(`g ${c.minGrams}-${c.maxGrams}→${m.minGrams}-${m.maxGrams}`);
  if (parts.length) diffs.push({ ...d, parts, max });
}
console.log('\n=== PARES CON DIFERENCIAS:', diffs.length);
for (const d of diffs.sort((a, b) => b.max - a.max)) console.log(`${d.name}${d.name !== d.crudo ? ` (crudo: ${d.crudo})` : ''} | ${d.parts.join(' | ')}`);

console.log('\n\n=== COHERENCIA INTERNA (kcal declaradas vs 4P+4C+9G) · umbral: >15 kcal y >15 %');
for (const [lbl, list] of [['CRUDO', FOODS_CRUDO], ['MENÚ', FOODS_MENU]]) {
  const bad = []; const other = [];
  for (const f of list) {
    const calc = 4 * f.pro + 4 * f.cho + 9 * f.fat; const d = f.kcal - calc;
    if (Math.abs(d) > 15 && Math.abs(d) / Math.max(1, f.kcal) > 0.15) bad.push(`${f.name} [${(f.treePath || []).join('>')}]: declara ${f.kcal}, macros dan ${calc.toFixed(0)} (P${f.pro} C${f.cho} G${f.fat})`);
    if (f.pro + f.cho + f.fat > 100.5) other.push(`${f.name}: P+C+G=${(f.pro + f.cho + f.fat).toFixed(0)} g por 100 g`);
    if (!(f.minGrams > 0) || !(f.maxGrams >= f.minGrams)) other.push(`${f.name}: gramos ${f.minGrams}-${f.maxGrams}`);
    if (!Array.isArray(f.treePath) || f.treePath.length < 2) other.push(`${f.name}: treePath ${JSON.stringify(f.treePath)}`);
  }
  console.log(`\n--- ${lbl}: ${bad.length} con kcal incoherentes, ${other.length} otros`);
  bad.forEach((x) => console.log('  ' + x)); other.forEach((x) => console.log('  ! ' + x));
}
