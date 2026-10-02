// Simulación masiva: N semanas con jugadores reales, calendarios con partidos, protocolos y menús. Busca cosas raras.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { withLatestMeasurement } from '../lib/metrics/player.js';
import { generarDatosPlan } from '../lib/engine/generator.js';
import { getClinicalCatalogForPlayer } from '../lib/nutrition/clinical-catalog.js';
import { getFullFoodTree, getNodeFromTree, createFoodItemFromName } from '../lib/engine/food-tree.js';
import { isPreMatchPreviousDayMeal, isPreMatchMatchDayMeal } from '../config/nutrition-days.js';
import { normalizeFoodName } from '../data/foods-crudo.js';
const N = +process.argv[2] || 2000;
const envVars = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/); if (m) { let v = m[2] || ''; if (/^["'].*["']$/.test(v)) v = v.slice(1, -1); envVars[m[1]] = v; } }
const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, db: { schema: 'teams' } });
const { data: jug } = await sb.from('jugadores').select('*, equipos(configuracion_nutricional)');
const { data: menuList } = await sb.from('menu_semanal').select('*');
const players = [];
for (const p of jug.filter((x) => x.num_comidas)) { const { data: ev } = await sb.from('evolucion').select('*').eq('jugador_id', p.id); const { data: pe } = await sb.from('pesajes').select('*').eq('jugador_id', p.id); const w = withLatestMeasurement(p, ev || [], pe || []); if (w.peso_kg) players.push(w); }
const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const CAL = [
  ['sábado', { lunes: 'recuperacion', martes: 'entreno', miercoles: 'doble', jueves: 'entreno', viernes: 'entreno', sabado: 'partido', domingo: 'descanso' }],
  ['domingo', { lunes: 'descanso', martes: 'entreno', miercoles: 'entreno', jueves: 'doble', viernes: 'entreno', sabado: 'entreno', domingo: 'partido' }],
  ['miércoles+sábado', { lunes: 'entreno', martes: 'entreno', miercoles: 'partido', jueves: 'recuperacion', viernes: 'entreno', sabado: 'partido', domingo: 'descanso' }],
  ['sin partido', { lunes: 'descanso', martes: 'entreno', miercoles: 'entreno', jueves: 'entreno', viernes: 'descanso', sabado: 'entreno', domingo: 'descanso' }],
  ['partido lunes', { lunes: 'partido', martes: 'recuperacion', miercoles: 'entreno', jueves: 'entreno', viernes: 'doble', sabado: 'entreno', domingo: 'descanso' }],
  ['lesión', { lunes: 'lesion', martes: 'lesion', miercoles: 'lesion', jueves: 'recuperacion', viernes: 'entreno', sabado: 'entreno', domingo: 'descanso' }],
];
const HOR = ['manana', 'tarde', 'noche'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const full = getFullFoodTree();
const S = { plans: 0, errors: {}, avisos: {}, avisoEx: {}, days: 0, byTipo: {}, byHor: {}, dev: [], issues: {}, ex: {}, proto: { expected: 0, ok: 0, na: 0, fail: {} }, tokens: 0, unparsed: 0, perPlayer: {} };
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const issue = (k, ex) => { bump(S.issues, k); if (!S.ex[k]) S.ex[k] = []; if (S.ex[k].length < 600) S.ex[k].push(ex); };
const catCache = new Map();
const getCat = (p, menu) => { const k = `${p.id}:${menu ? 1 : 0}`; if (!catCache.has(k)) catCache.set(k, getClinicalCatalogForPlayer(p, { useMenuCatalog: Boolean(menu) })); return catCache.get(k); };
function parse(detalle, cat) {
  const out = [];
  for (let tok of String(detalle).split(/,\s+(?=[A-ZÁÉÍÓÚÑ0-9])/)) {
    tok = tok.trim(); S.tokens++; let m;
    if ((m = tok.match(/^(\d+)\s+Huevos?(?:\s+y\s+(\d+)\s+Claras?)?$/i))) { out.push({ f: cat.foodsByNormalizedName.get('huevo entero'), g: 50 * +m[1] }); if (m[2]) out.push({ f: cat.foodsByNormalizedName.get('claras de huevo'), g: 30 * +m[2] }); continue; }
    if ((m = tok.match(/^(\d+)\s+Claras?$/i))) { out.push({ f: cat.foodsByNormalizedName.get('claras de huevo'), g: 30 * +m[1] }); continue; }
    if ((m = tok.match(/^(.*?)\s+\d+\s+unidad(?:es)?$/i))) { const f0 = cat.foodsByNormalizedName.get(normalizeFoodName(m[1].trim())); if (f0) { out.push({ f: f0, g: 1 }); continue; } }
    if ((m = tok.match(/^(.*?)\s+(\d+(?:\.\d+)?)g(?:\s.*)?$/))) {
      const name = m[1].trim(); let f = cat.foodsByNormalizedName.get(normalizeFoodName(name));
      if (!f) { const mm = name.match(/^tostadas? de (.*)$/i); if (mm) f = cat.foodsByNormalizedName.get(normalizeFoodName(mm[1])) || cat.foodsByNormalizedName.get(normalizeFoodName('pan ' + mm[1])); }
      if (f) { out.push({ f, g: +m[2], name }); continue; }
    }
    S.unparsed++;
  }
  return out;
}
// ¿Se cumple la pauta (AST) con lo servido? true / false / null (no aplicable al jugador)
function satisfied(node, served, cat) {
  if (!node) return null;
  if (node.type === 'food') {
    const name = node.name || node.foodName || node.label; const concrete = createFoodItemFromName(name, null, full);
    if (concrete) { if (!cat.foodsByNormalizedName.has(normalizeFoodName(concrete.name))) return null; return served.some((s) => s.f && normalizeFoodName(s.f.name) === normalizeFoodName(concrete.name)); }
    const n = getNodeFromTree(name, full); if (!n) return null; const id = String(n.id).toLowerCase();
    if (id === 'proteina' || id === 'hidratos' || id === 'frutas' || id === 'verduras' || id === 'grasas' || id === 'lacteos') return null;
    return served.some((s) => (s.f?.treePath || []).map((x) => String(x).toLowerCase()).includes(id));
  }
  const kids = (node.children || []).map((c) => satisfied(c, served, cat)).filter((x) => x !== null);
  if (kids.length === 0) return null;
  return node.type === 'oneOf' ? kids.some(Boolean) : kids.every(Boolean);
}
const t0 = Date.now(); let attempts = 0;
while (S.plans < N && attempts < N * 2) {
  attempts++;
  const p = pick(players); const [calName, cal] = pick(CAL);
  if (calName === 'lesión' && p.equipo_id !== 7) continue;
  const useMenu = p.equipo_id === 7 && Math.random() < 0.75; const menu = useMenu ? pick(menuList.filter((m) => m.equipo_id === 7)) : null;
  const matchDays = DAYS.filter((d) => cal[d] === 'partido'); const enabled = matchDays.length > 0 && Math.random() < 0.9;
  const partidos = {}; for (const d of matchDays) partidos[d] = { horario: pick(HOR) };
  const preMatchConfig = enabled ? { enabled: true, partidos, diaPartido: matchDays[0], horario: partidos[matchDays[0]].horario } : null;
  let plan; try { plan = await generarDatosPlan({ jugador: p, nombre: 't', calendario: cal, menu, teamConfig: p.equipos?.configuracion_nutricional || {}, preMatchConfig }); }
  catch (e) { bump(S.errors, `${calName}: ${e.message.slice(0, 120)}`); continue; }
  S.plans++; const cat = getCat(p, menu); bump(S.perPlayer, `${p.nombre.trim()} ${p.apellidos || ''}`.trim());
  for (const a of plan.meta.avisos || []) { { const mm = a.mensaje.match(/"([^"]+)".*?(?:sustituido por ([^.]+)\.|omitido)/); const key = `${p.nombre.trim()} | ${mm?.[1] || '?'} → ${mm?.[2] || 'omitido'} (${a.ingesta})`; bump(S.avisoFoods ||= {}, key); } const k = a.mensaje.replace(/"[^"]+"/g, '"X"').replace(/por [^.]*\./, 'por …'); bump(S.avisos, k); (S.avisoEx[k] ||= []).length < 3 && S.avisoEx[k].push(`${p.nombre.trim()} ${a.dia} ${a.ingesta}: ${a.mensaje.slice(0, 120)}`); }
  const mainProt = {};
  DAYS.forEach((dk, di) => {
    const d = plan.dias[dk]; if (!d) return; S.days++; const tag = `${p.nombre.trim()} ${dk} (${calName}${enabled ? '' : ', sin protocolo'})`;
    bump(S.byTipo, d.tipoDia);
    if (d.desviacionMacros) { S.dev.push({ k: d.desviacionMacros.kcal, p: d.desviacionMacros.proteina, tipo: d.tipoDia }); if (Math.abs(d.desviacionMacros.kcal) > 100) issue('Día con desvío > 100 kcal', `${tag}: ${Math.round(d.desviacionMacros.kcal)} kcal`); }
    else issue('Día sin cálculo completo (cierre parcial)', tag);
    if (d.ingestas.length < 3) issue('Día con menos de 3 tomas', tag);
    const horario = enabled ? (d.tipoDia === 'partido' ? partidos[dk]?.horario : (cal[DAYS[(di + 1) % 7]] === 'partido' ? partidos[DAYS[(di + 1) % 7]]?.horario : null)) : null;
    for (const ing of d.ingestas) {
      const main = /Comida|Cena/i.test(ing.nombre); const served = parse(ing.detalle || '', cat); const names = served.filter((s) => s.f).map((s) => s.f.name);
      if (/^\[/.test(ing.detalle || '')) issue('Toma sin opción apta', `${tag} ${ing.nombre}: ${ing.detalle}`);
      if (served.some((s) => s.g <= 0)) issue('Alimento con 0 g', `${tag} ${ing.nombre}: ${ing.detalle}`);
      if (new Set(names).size !== names.length) issue('Alimento repetido dentro de la misma toma', `${tag} ${ing.nombre}: ${ing.detalle}`);
      for (const s of served) if (s.f && !cat.foodsByNormalizedName.has(normalizeFoodName(s.f.name))) issue('Alimento fuera del catálogo clínico del jugador', `${tag}: ${s.f.name}`);
      const kcal = ing.macrosReales?.kcal; if (kcal !== undefined && !/Post/i.test(ing.nombre)) { if (main && (kcal < 350 || kcal > 1700)) issue(`${ing.nombre} con kcal extremas`, `${tag}: ${kcal} kcal — ${ing.detalle.slice(0, 90)}`); if (!main && kcal > 1100) issue('Toma ligera con >1100 kcal', `${tag} ${ing.nombre}: ${kcal} kcal`); }
      if (main) { const mp = served.find((s) => s.f?.treePath?.[0] === 'proteina' && !['huevos', 'embutidos'].includes(s.f.treePath[1])); if (mp) mainProt[dk] = (mainProt[dk] || []).concat(mp.f.name); }
      // protocolo de partido
      if (horario && !/post/i.test(ing.nombre)) {
        const isMatch = d.tipoDia === 'partido'; const rec = p.config_prepartido?.[horario]?.recomendaciones?.[ing.nombre] || p.config_prepartido?.[horario]?.recomendaciones?.[String(ing.nombre).toLowerCase()];
        const covered = isMatch ? (isPreMatchMatchDayMeal(horario, ing.nombre) || (rec && !isPreMatchPreviousDayMeal(horario, ing.nombre))) : isPreMatchPreviousDayMeal(horario, ing.nombre);
        if (covered && rec?.tree) { S.proto.expected++; const r = satisfied(rec.tree, served, cat); if (r === null) S.proto.na++; else if (r) S.proto.ok++; else { bump(S.proto.fail, isMatch ? 'día de partido' : 'víspera'); issue('Protocolo de partido no cumplido', `${tag} ${ing.nombre} [${horario}] pauta "${String(rec.raw).slice(0, 60)}" → ${ing.detalle.slice(0, 100)}`); } }
        if (covered && !rec?.tree && rec) { /* pauta de rotación */ }
      }
    }
  });
  // variedad semanal
  const cnt = {}; DAYS.forEach((dk) => (mainProt[dk] || []).forEach((n) => bump(cnt, n)));
  for (const [n, c] of Object.entries(cnt)) if (c >= 4) issue('Misma proteína ≥4 veces en la semana', `${p.nombre.trim()}: ${n} ×${c}`);
  for (let i = 0; i < 6; i++) { const a = mainProt[DAYS[i]] || [], b = mainProt[DAYS[i + 1]] || []; if (a.some((x) => b.includes(x))) issue('Misma proteína en días consecutivos', `${p.nombre.trim()} ${DAYS[i]}-${DAYS[i + 1]}: ${a.find((x) => b.includes(x))}`); }
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const L = [];
L.push(`# ${S.plans} semanas generadas (${S.days} días) con ${players.length} jugadores en ${((Date.now() - t0) / 1000).toFixed(0)} s | errores: ${Object.values(S.errors).reduce((a, b) => a + b, 0)}`);
for (const [k, v] of Object.entries(S.errors)) L.push(`  ERROR ${v}× ${k}`);
const ks = S.dev.map((d) => Math.abs(d.k)); L.push(`\nCUADRE: error medio ${mean(ks).toFixed(0)} kcal | ≤50: ${(100 * ks.filter((x) => x <= 50).length / ks.length).toFixed(1)}% | ≤100: ${(100 * ks.filter((x) => x <= 100).length / ks.length).toFixed(2)}% | proteína error medio ${mean(S.dev.map((d) => Math.abs(d.p))).toFixed(1)} g`);
for (const t of Object.keys(S.byTipo)) { const a = S.dev.filter((d) => d.tipo === t); L.push(`   ${t.padEnd(13)} n=${String(a.length).padStart(5)} error ${mean(a.map((d) => Math.abs(d.k))).toFixed(0)} kcal | >100: ${a.filter((d) => Math.abs(d.k) > 100).length}`); }
L.push(`\nPROTOCOLOS DE PARTIDO: tomas con pauta esperada ${S.proto.expected} | cumplidas ${S.proto.ok} | no aplicables al jugador ${S.proto.na} | incumplidas ${S.proto.expected - S.proto.ok - S.proto.na} ${JSON.stringify(S.proto.fail)}`);
L.push(`\nAVISOS DEL MOTOR (${Object.values(S.avisos).reduce((a, b) => a + b, 0)}):`); for (const [k, v] of Object.entries(S.avisos).sort((a, b) => b[1] - a[1]).slice(0, 8)) L.push(`  ${String(v).padStart(5)}× ${k.slice(0, 150)}\n         ej: ${S.avisoEx[k][0]}`);
L.push('\nSUSTITUCIONES/OMISIONES más frecuentes (jugador | alimento de la pauta → resultado):'); for (const [k, v] of Object.entries(S.avisoFoods || {}).sort((a, b) => b[1] - a[1]).slice(0, 25)) L.push(`  ${String(v).padStart(4)}× ${k}`);
L.push(`\nHALLAZGOS:`); for (const [k, v] of Object.entries(S.issues).sort((a, b) => b[1] - a[1])) L.push(`  ${String(v).padStart(5)}× ${k}\n${S.ex[k].slice(0, 3).map((e) => '         ej: ' + e).join('\n')}`);
L.push(`\nlectura de alimentos: ${(100 * (1 - S.unparsed / S.tokens)).toFixed(1)}% de ${S.tokens}`);
console.log(L.join('\n'));
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ issues: S.issues, ex: S.ex, avisos: S.avisos, avisoEx: S.avisoEx }));
