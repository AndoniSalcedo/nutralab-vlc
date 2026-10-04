// Simulación masiva: 5000 semanas, con/sin menú (últimos 3 menús), partidos de mañana/tarde. Busca fallos y rarezas.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { withLatestMeasurement } from '../lib/metrics/player.js';
import { generarDatosPlan } from '../lib/engine/generator.js';
import { getClinicalCatalogForPlayer } from '../lib/nutrition/clinical-catalog.js';
import { getFullFoodTree, getNodeFromTree, createFoodItemFromName, buildPlayerFoodTree } from '../lib/engine/food-tree.js';
import { selectBuffetMealDishes } from '../lib/engine/menu-selection.js';
import { isPreMatchPreviousDayMeal, isPreMatchMatchDayMeal, sortMeals } from '../config/nutrition-days.js';
import { normalizeFoodName } from '../data/foods-crudo.js';

const N = +process.argv[2] || 5000;
const OUT = process.argv[3] || null;
let seed = +process.argv[4] || 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

const env = {};
for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/); if (m) { let v = m[2] || ''; if (/^["'].*["']$/.test(v)) v = v.slice(1, -1); env[m[1]] = v; } }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, db: { schema: 'teams' } });
const { data: jug } = await sb.from('jugadores').select('*, equipos(nombre, configuracion_nutricional)');
const { data: menusAll } = await sb.from('menu_semanal').select('*').eq('equipo_id', 7).order('created_at', { ascending: false }).limit(3);
const MENUS = { none: null, ...Object.fromEntries(menusAll.map((m) => [String(m.id), m])) };
const MENU_KEYS = Object.keys(MENUS);
const players = []; const skipped = [];
for (const p of jug) {
  const { data: ev } = await sb.from('evoluciones').select('*').eq('jugador_id', p.id);
  const { data: pe } = await sb.from('pesajes').select('*').eq('jugador_id', p.id);
  const w = withLatestMeasurement(p, ev || [], pe || []);
  if (w.num_comidas && w.peso_kg) players.push(w); else skipped.push(`${p.nombre}#${p.id} (eq ${p.equipo_id}): ${!w.num_comidas ? 'sin num_comidas' : ''} ${!w.peso_kg ? 'sin peso' : ''}`);
}
const team7 = players.filter((p) => p.equipo_id === 7);
const others = players.filter((p) => p.equipo_id !== 7);

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const HOR = ['manana', 'tarde'];
// Calendario aleatorio con 0-2 partidos y estructura realista
function randomCalendar() {
  const r = rnd();
  const nMatches = r < 0.06 ? 0 : (r < 0.8 ? 1 : 2);
  const cal = {};
  const matchIdx = [];
  if (nMatches >= 1) matchIdx.push(Math.floor(rnd() * 7));
  if (nMatches === 2) { let j; do { j = Math.floor(rnd() * 7); } while (Math.abs(j - matchIdx[0]) < 3 && Math.abs(j - matchIdx[0]) < 5); matchIdx.push(j); }
  for (let i = 0; i < 7; i++) {
    if (matchIdx.includes(i)) cal[DAYS[i]] = 'partido';
    else if (matchIdx.includes((i + 6) % 7)) cal[DAYS[i]] = pick(['recuperacion', 'descanso']);
    else if (matchIdx.includes((i + 1) % 7)) cal[DAYS[i]] = 'entreno';
    else cal[DAYS[i]] = pick(['entreno', 'entreno', 'doble', 'descanso', 'recuperacion']);
  }
  return cal;
}

const full = getFullFoodTree();
const S = { plans: 0, errors: {}, errEx: {}, days: 0, dev: [], issues: {}, ex: {}, info: {}, infoEx: {}, avisos: {}, avisoEx: {}, tokens: 0, unparsed: 0, unparsedEx: {},
  proto: { expected: 0, ok: 0, na: 0, fail: {} }, byCfg: {}, menuCheck: { meals: 0, protOk: 0, protOff: 0, carbOff: 0 }, det: { runs: 0, diff: 0 }, targets: {}, gramsOut: {} };
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const issue = (k, ex) => { bump(S.issues, k); (S.ex[k] ||= []).length < 400 && S.ex[k].push(ex); };
const info = (k, ex) => { bump(S.info, k); (S.infoEx[k] ||= []).length < 200 && S.infoEx[k].push(ex); };
const catCache = new Map();
const allowCache = new Map();
const getAllowed = (p) => { if (!allowCache.has(p.id)) { const a = getClinicalCatalogForPlayer(p, { useMenuCatalog: false }), b = getClinicalCatalogForPlayer(p, { useMenuCatalog: true }); allowCache.set(p.id, new Set([...a.foodsByNormalizedName.keys(), ...a.namedOnly.keys(), ...b.foodsByNormalizedName.keys(), ...b.namedOnly.keys(), ...b.offMenuFoods.keys()])); } return allowCache.get(p.id); };
const getCat = (p, menu) => { const k = `${p.id}:${menu ? 1 : 0}`; if (!catCache.has(k)) catCache.set(k, getClinicalCatalogForPlayer(p, { useMenuCatalog: Boolean(menu) })); return catCache.get(k); };

function lookup(cat, name) {
  const n = normalizeFoodName(name);
  return cat.foodsByNormalizedName.get(n) || createFoodItemFromName(name, null, full)?.food || null;
}
function parse(detalle, cat) {
  const out = [];
  for (let tok of String(detalle).split(/,\s+(?=[A-ZÁÉÍÓÚÑ0-9])/)) {
    tok = tok.trim(); if (!tok) continue; S.tokens++; let m;
    if ((m = tok.match(/^(\d+)\s+Huevos?(?:\s+y\s+(\d+)\s+Claras?)?$/i))) { out.push({ f: lookup(cat, 'huevo entero'), g: 50 * +m[1], unit: true }); if (m[2]) out.push({ f: lookup(cat, 'claras de huevo'), g: 30 * +m[2], unit: true }); continue; }
    if ((m = tok.match(/^(\d+)\s+Claras?(?: de huevo)?$/i))) { out.push({ f: lookup(cat, 'claras de huevo'), g: 30 * +m[1], unit: true }); continue; }
    if ((m = tok.match(/^(.*?)\s+(\d+)\s+unidad(?:es)?$/i))) { const f0 = lookup(cat, m[1].trim()); if (f0) { out.push({ f: f0, g: 1, unit: true }); continue; } }
    if ((m = tok.match(/^(.*?)\s+(-?\d+(?:\.\d+)?)g(?:\s.*)?$/))) {
      const name = m[1].trim(); let f = lookup(cat, name);
      if (!f) { const mm = name.match(/^tostadas? de (.*)$/i); if (mm) f = lookup(cat, mm[1]) || lookup(cat, 'pan ' + mm[1]); }
      if (f) { out.push({ f, g: +m[2], name }); continue; }
      out.push({ f: null, g: +m[2], name });
    }
    S.unparsed++; bump(S.unparsedEx, tok.replace(/\d+/g, 'N'));
  }
  return out;
}
const tp = (f) => (f?.treePath || []).map((x) => String(x).toLowerCase());
// ¿El alimento servido encaja con una hoja del árbol (concreta o rama)?
function leafMatches(leafName, food) {
  const concrete = createFoodItemFromName(leafName, null, full);
  if (concrete && normalizeFoodName(concrete.name) === normalizeFoodName(food.name)) return true;
  const n = getNodeFromTree(leafName, full);
  if (n && !concrete) return tp(food).includes(String(n.id).toLowerCase());
  return false;
}
function leaves(node, acc = []) { if (!node) return acc; if (node.type === 'food') acc.push(node.name); (node.children || []).forEach((c) => leaves(c, acc)); return acc; }
function satisfied(node, served, cat) {
  if (!node) return null;
  if (node.type === 'food') {
    const name = node.name; const concrete = createFoodItemFromName(name, null, full);
    if (concrete) { if (!(cat.allowed || cat.foodsByNormalizedName).has(normalizeFoodName(concrete.name))) return null; return served.some((s) => s.f && normalizeFoodName(s.f.name) === normalizeFoodName(concrete.name)); }
    const n = getNodeFromTree(name, full); if (!n) return null; const id = String(n.id).toLowerCase();
    if (['proteina', 'hidratos', 'frutas', 'verduras', 'grasas', 'lacteos'].includes(id)) return null;
    return served.some((s) => tp(s.f).includes(id));
  }
  const kids = (node.children || []).map((c) => satisfied(c, served, cat)).filter((x) => x !== null);
  if (kids.length === 0) return null;
  return node.type === 'oneOf' ? kids.some(Boolean) : kids.every(Boolean);
}
function namedLeaves(p, meal, horario, isMatch, dayMenu) {
  const out = [];
  const low = meal.toLowerCase();
  const d = p.recomendaciones_defecto?.[meal] || p.recomendaciones_defecto?.[low]; if (d?.tree) leaves(d.tree, out);
  if (horario) { const r = p.config_prepartido?.[horario]?.recomendaciones?.[meal] || p.config_prepartido?.[horario]?.recomendaciones?.[low]; if (r?.tree) leaves(r.tree, out); }
  const sv = /comida/.test(low) ? dayMenu?.comida : (/cena/.test(low) ? dayMenu?.cena : null); if (sv?.tree) leaves(sv.tree, out);
  return out;
}
const dayMenuFor = (menu, dk) => menu?.dias?.find((d) => { const s = String(d.dia || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); return s.includes(dk) || dk.includes(s); });
const isMainProt = (f) => tp(f)[0] === 'proteina' && !['huevos', 'embutidos'].includes(tp(f)[1]);
const isMainCarb = (f) => tp(f)[0] === 'hidratos' && !['panes', 'pan'].includes(tp(f)[1]);

const t0 = Date.now();
let attempt = 0;
while (S.plans < N && attempt < N * 2) {
  attempt++;
  const useT7 = rnd() < 0.7;
  const p = pick(useT7 ? team7 : others);
  const menuKey = p.equipo_id === 7 ? pick(MENU_KEYS) : 'none';
  const menu = MENUS[menuKey];
  const cal = randomCalendar();
  const matchDays = DAYS.filter((d) => cal[d] === 'partido');
  const enabled = matchDays.length > 0 && rnd() < 0.9;
  const partidos = {}; for (const d of matchDays) partidos[d] = { horario: pick(HOR) };
  const preMatchConfig = enabled ? { enabled: true, partidos, diaPartido: matchDays[0], horario: partidos[matchDays[0]].horario } : null;
  const horKey = !matchDays.length ? 'sin_partido' : (!enabled ? 'protocolo_off' : [...new Set(Object.values(partidos).map((x) => x.horario))].sort().join('+'));
  const cfgKey = `${menuKey === 'none' ? 'sin_menu' : 'menu_' + menuKey} | ${horKey}`;
  const pname = `${String(p.nombre || '').trim()} ${p.apellidos || ''}`.trim() + `#${p.id}`;
  const args = { jugador: p, nombre: 't', calendario: cal, menu, teamConfig: p.equipos?.configuracion_nutricional || {}, preMatchConfig };
  let plan;
  try { plan = await generarDatosPlan(args); }
  catch (e) { const k = `${e.message.slice(0, 140)}`; bump(S.errors, k); (S.errEx[k] ||= []).length < 5 && S.errEx[k].push(`${pname} ${cfgKey} ${JSON.stringify(cal)} | ${String(e.stack).split('\n').slice(1, 3).join(' ')}`); continue; }
  S.plans++;
  const cfg = (S.byCfg[cfgKey] ||= { plans: 0, days: 0, absK: 0, gt100: 0, partial: 0, issues: 0 }); cfg.plans++;
  const issuesBefore = Object.values(S.issues).reduce((a, b) => a + b, 0);

  // Determinismo: regenerar una de cada 40
  if (S.plans % 40 === 0) {
    S.det.runs++;
    const plan2 = await generarDatosPlan(args);
    const a = JSON.stringify(DAYS.map((d) => plan.dias[d]?.ingestas?.map((i) => i.detalle))), b = JSON.stringify(DAYS.map((d) => plan2.dias[d]?.ingestas?.map((i) => i.detalle)));
    if (a !== b) { S.det.diff++; info('Variación aleatoria: mismas entradas → plan distinto (Math.random)', `${pname} ${cfgKey}`); }
  }

  const cat = getCat(p, menu);
  for (const a of plan.meta?.avisos || []) {
    const k = a.mensaje.replace(/"[^"]+"/g, '"X"').replace(/por [^.]*\./, 'por …'); bump(S.avisos, k);
    (S.avisoEx[k] ||= []).length < 4 && S.avisoEx[k].push(`${pname} [${cfgKey}] ${a.dia} ${a.ingesta}: ${a.mensaje.slice(0, 160)}`);
  }
  const mainProt = {};
  DAYS.forEach((dk, di) => {
    const d = plan.dias[dk]; if (!d) { issue('Día ausente del plan', `${pname} ${dk}`); return; }
    S.days++; cfg.days++;
    const nextDk = DAYS[(di + 1) % 7];
    const tag = `${pname} ${dk}/${d.tipoDia} [${cfgKey}]`;
    // Objetivos por jugador y tipo de día deberían ser estables entre configuraciones
    const tk = `${p.id}|${d.tipoDia}`; ((S.targets[tk] ||= new Set())).add(`${d.kcal}/${d.proteina}/${d.hidratos}/${d.grasa}`);
    if (d.desviacionMacros) {
      const dm = d.desviacionMacros; S.dev.push({ k: dm.kcal, p: dm.proteina, h: dm.hidratos, g: dm.grasa, tipo: d.tipoDia, cfg: cfgKey });
      cfg.absK += Math.abs(dm.kcal);
      if (Math.abs(dm.kcal) > 100) { cfg.gt100++; issue('Día con desvío > 100 kcal', `${tag}: ${Math.round(dm.kcal)} kcal (P${dm.proteina} HC${dm.hidratos} G${dm.grasa}) obj ${d.kcal}`); }
      if (Math.abs(dm.proteina) > 15) issue('Día con desvío de proteína > 15 g', `${tag}: ${dm.proteina} g`);
      if (Math.abs(dm.hidratos) > 30) issue('Día con desvío de HC > 30 g', `${tag}: ${dm.hidratos} g`);
      if (Math.abs(dm.grasa) > 12) issue('Día con desvío de grasa > 12 g', `${tag}: ${dm.grasa} g`);
    } else { cfg.partial++; issue('Día sin cierre completo (parcial)', `${tag}: ${d.cierreMacros?.ingestasCalculadas}/${d.cierreMacros?.ingestasTotales}`); }

    const names = d.ingestas.map((i) => i.nombre);
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) issue('Toma duplicada en el día', `${tag}: ${names.join(', ')}`);
    const hasPost = names.some((n) => /post/i.test(n));
    if (hasPost && ['descanso', 'recuperacion'].includes(d.tipoDia)) issue('Post-entreno en día sin entreno', `${tag}: ${names.join(', ')}`);
    if (!hasPost && p.postentreno && ['entreno', 'doble'].includes(d.tipoDia)) issue('Falta post-entreno en día de entreno (jugador con post)', `${tag}: ${names.join(', ')}`);

    const isMatch = d.tipoDia === 'partido';
    const horario = enabled ? (isMatch ? partidos[dk]?.horario : (cal[nextDk] === 'partido' ? partidos[nextDk]?.horario : null)) : null;
    if (isMatch && horario) {
      const exp = sortMeals(names, horario);
      if (exp.join('|') !== names.join('|')) issue('Orden de tomas incoherente en día de partido', `${tag} [${horario}]: ${names.join(' → ')}`);
      const postIdx = names.findIndex((n) => /post/i.test(n));
      if (postIdx >= 0) {
        const before = names.slice(0, postIdx).map((n) => n.toLowerCase());
        if (horario === 'manana' && before.includes('comida')) issue('Partido mañana: Comida antes del post-partido', `${tag}: ${names.join(' → ')}`);
        if (horario === 'tarde' && !before.includes('comida') && names.map((n) => n.toLowerCase()).includes('comida')) issue('Partido tarde: Comida después del post-partido', `${tag}: ${names.join(' → ')}`);
      }
      const proto = p.config_prepartido?.[horario];
      if (!proto) info('Partido con protocolo activo pero jugador sin config_prepartido para ese horario', `${pname} ${horario}`);
    }
    // Víspera: pautas definidas para tomas que el jugador no tiene
    if (!isMatch && horario) {
      const recs = p.config_prepartido?.[horario]?.recomendaciones || {};
      for (const meal of Object.keys(recs)) if (isPreMatchPreviousDayMeal(horario, meal) && !names.map((n) => n.toLowerCase()).includes(meal.toLowerCase())) info('Pauta de víspera para una toma que el jugador no tiene ese día (se ignora)', `${pname} [${horario}] ${meal} (tomas: ${names.join(', ')})`);
    }

    const dayMenu = dayMenuFor(menu, dk);
    // Presupuesto: una toma ligera no debería tener objetivo ≥ que una principal
    const mainObj = d.ingestas.filter((i) => /comida|cena/i.test(i.nombre) && i.objetivo?.kcal).map((i) => i.objetivo.kcal);
    for (const i of d.ingestas) if (!/comida|cena|post/i.test(i.nombre) && i.objetivo?.kcal && mainObj.length && i.objetivo.kcal >= Math.min(...mainObj) * 0.95) issue('Presupuesto de toma ligera ≈/≥ que el de una principal', `${tag} ${i.nombre}: obj ${i.objetivo.kcal} vs principales ${mainObj.join('/')} (tomas: ${names.join(', ')})`);
    const dayFoodsByMeal = {};
    for (const ing of d.ingestas) {
      const det = String(ing.detalle ?? '');
      const low = ing.nombre.toLowerCase();
      const main = /comida|cena/i.test(ing.nombre);
      if (!det.trim()) issue('Toma vacía', `${tag} ${ing.nombre}`);
      if (/undefined|NaN|null|\[object/i.test(det)) issue('Texto corrupto en toma (undefined/NaN/null)', `${tag} ${ing.nombre}: ${det}`);
      if (/^\[/.test(det)) issue('Toma sin opción apta / alerta', `${tag} ${ing.nombre}: ${det}`);
      if (/,\s*,|\s{2,}/.test(det)) issue('Formato raro (comas/espacios dobles)', `${tag} ${ing.nombre}: ${det}`);
      const served = parse(det, cat);
      dayFoodsByMeal[low] = served;
      const fnames = served.filter((s) => s.f).map((s) => s.f.name);
      for (const s of served) {
        if (!s.f) continue;
        if (s.g <= 0) issue('Alimento con 0 g o negativo', `${tag} ${ing.nombre}: ${det}`);
        if (!s.unit && s.g % 5 !== 0) issue('Gramaje no múltiplo de 5', `${tag} ${ing.nombre}: ${s.f.name} ${s.g}g`);
        const nn = normalizeFoodName(s.f.name);
        if (!/post/i.test(ing.nombre)) {
          if (!getAllowed(p).has(nn)) issue('Alimento NO apto clínicamente para el jugador', `${tag} ${ing.nombre}: ${s.f.name} (tags jugador: ${JSON.stringify(cat.activeTags)} aversiones: ${JSON.stringify(cat.aversions)})`);
          else if (!cat.foodsByNormalizedName.has(nn)) {
            const named = s.unit || namedLeaves(p, ing.nombre, horario, isMatch, dayMenu).some((l) => leafMatches(l, s.f));
            if (!named) issue(menu ? 'Con menú: alimento fuera del menú/especial elegido sin que pauta o menú lo nombre' : 'Alimento "especial" (sin gluten/lactosa) elegido sin necesitarlo ni nombrarlo la pauta', `${tag} ${ing.nombre}: ${s.f.name}`);
          }
        }
        if (!s.unit && s.f.maxGrams && s.g > s.f.maxGrams + 0.1) { bump(S.gramsOut, `> max ${s.f.name} (max ${s.f.maxGrams})`); issue('Gramaje por encima del máximo del alimento', `${tag} ${ing.nombre}: ${s.f.name} ${s.g}g (max ${s.f.maxGrams})`); }
        if (!s.unit && s.f.minGrams && s.g < s.f.minGrams - 0.1) { bump(S.gramsOut, `< min ${s.f.name} (min ${s.f.minGrams})`); issue('Gramaje por debajo del mínimo del alimento', `${tag} ${ing.nombre}: ${s.f.name} ${s.g}g (min ${s.f.minGrams})`); }
      }
      if (new Set(fnames).size !== fnames.length) issue('Alimento repetido en la misma toma', `${tag} ${ing.nombre}: ${det}`);
      const kcal = ing.macrosReales?.kcal;
      if (kcal !== undefined && kcal !== null && !/post/i.test(ing.nombre)) {
        if (main && (kcal < 350 || kcal > 1700)) issue(`Comida/Cena con kcal extremas (<350 o >1700)`, `${tag} ${ing.nombre}: ${kcal} kcal — ${det.slice(0, 120)}`);
        if (!main && kcal > 1100) issue('Toma ligera con >1100 kcal', `${tag} ${ing.nombre}: ${kcal} kcal — ${det.slice(0, 120)}`);
        if (!main && kcal < 100) issue('Toma ligera con <100 kcal', `${tag} ${ing.nombre}: ${kcal} kcal — ${det.slice(0, 120)}`);
        if (ing.objetivo?.kcal && Math.abs(kcal - ing.objetivo.kcal) / ing.objetivo.kcal > 0.45) info('Toma desviada >45% de su presupuesto (compensada en el día)', `${tag} ${ing.nombre}: ${kcal}/${ing.objetivo.kcal}`);
      }
      if (main && !/post/i.test(ing.nombre)) {
        if (!served.some((s) => tp(s.f)[0] === 'proteina' || tp(s.f).includes('legumbres') || tp(s.f).includes('vegetal_proteina'))) issue('Comida/Cena sin proteína', `${tag} ${ing.nombre}: ${det}`);
        if (!served.some((s) => tp(s.f)[0] === 'hidratos' || tp(s.f).includes('legumbres'))) issue('Comida/Cena sin hidrato', `${tag} ${ing.nombre}: ${det}`);
        const mp = served.find((s) => isMainProt(s.f)); if (mp) (mainProt[dk] ||= {})[low] = mp.f.name;
      }

      // Protocolo de partido
      let covered = false; let rec = null;
      if (horario && !/post/i.test(ing.nombre)) {
        rec = p.config_prepartido?.[horario]?.recomendaciones?.[ing.nombre] || p.config_prepartido?.[horario]?.recomendaciones?.[low];
        covered = isMatch ? (isPreMatchMatchDayMeal(horario, ing.nombre) || (rec && !isPreMatchPreviousDayMeal(horario, ing.nombre))) : isPreMatchPreviousDayMeal(horario, ing.nombre);
        if (covered && rec) {
          // Alimentos altos en fibra en tomas del protocolo
          const fib = served.filter((s) => (s.f?.tags || []).includes('alto_fibra'));
          if (fib.length) {
            const explicit = fib.filter((s) => rec.tree && leaves(rec.tree).some((l) => { const c = createFoodItemFromName(l, null, full); return c && normalizeFoodName(c.name) === normalizeFoodName(s.f.name); }));
            if (fib.length > explicit.length) issue('Alimento alto en fibra en toma del protocolo prepartido (no pedido explícitamente)', `${tag} ${ing.nombre} [${horario}]: ${fib.filter((s) => !explicit.includes(s)).map((s) => s.f.name).join(', ')} — pauta "${String(rec.raw || rec.label).slice(0, 60)}"`);
          }
          if (rec.tree) {
            S.proto.expected++;
            const r = satisfied(rec.tree, served, { ...cat, allowed: getAllowed(p) });
            if (r === null) S.proto.na++;
            else if (r) S.proto.ok++;
            else { bump(S.proto.fail, `${isMatch ? 'día de partido' : 'víspera'} ${horario} ${menu ? 'con menú' : 'sin menú'}`); issue('Protocolo de partido no cumplido', `${tag} ${ing.nombre} [${horario}] pauta "${String(rec.raw).slice(0, 70)}" → ${det.slice(0, 130)}`); }
          }
        }
      }

      // Menú de comedor: Comida/Cena no cubiertas por el protocolo deben salir del menú
      if (menu && main && !(covered && rec)) {
        const service = /comida/i.test(ing.nombre) ? dayMenu?.comida : dayMenu?.cena;
        if (service?.tree) {
          S.menuCheck.meals++;
          const ls = leaves(service.tree);
          const prots = served.filter((s) => s.f && isMainProt(s.f));
          const off = prots.filter((s) => !ls.some((l) => leafMatches(l, s.f)));
          if (prots.length && off.length === 0) S.menuCheck.protOk++;
          const buffet = selectBuffetMealDishes(service, cat, p, ing.nombre, buildPlayerFoodTree(cat));
          if (!buffet) { S.menuCheck.ignored = (S.menuCheck.ignored || 0) + 1; issue('Con menú: menú del día IGNORADO (sin combinación válida) → rotación libre', `${tag} ${ing.nombre} | 1º: ${(service.primero || '-').slice(0, 70)} | 2º: ${(service.segundo || '-').slice(0, 70)} | servido: ${det.slice(0, 100)}`); }
          else if (off.length) { S.menuCheck.protOff++; issue('Con menú: proteína servida que no está en el menú del día (con combinaciones disponibles)', `${tag} ${ing.nombre}: ${off.map((s) => s.f.name).join(', ')} | menú: ${(service.segundo || '').slice(0, 90)} | servido: ${det.slice(0, 110)}`); }
          const carbsOff = served.filter((s) => s.f && isMainCarb(s.f) && !ls.some((l) => leafMatches(l, s.f)));
          if (carbsOff.length) { S.menuCheck.carbOff++; info('Con menú: hidrato principal añadido que no está en el menú', `${tag} ${ing.nombre}: ${carbsOff.map((s) => s.f.name).join(', ')} | menú 1º: ${(service.primero || '').slice(0, 80)}`); }
        } else if (service && !service.tree) {
          info('Con menú: servicio sin árbol (DESCANSO/vacío) → pauta por defecto', `menu ${menuKey} ${dk} ${ing.nombre}: ${service.primero}`);
        }
      }
    }
    // misma proteína/hidrato comida y cena el mismo día
    const c = dayFoodsByMeal['comida'] || [], n = dayFoodsByMeal['cena'] || [];
    const cp = c.filter((s) => isMainProt(s.f)).map((s) => s.f.name), np = n.filter((s) => isMainProt(s.f)).map((s) => s.f.name);
    const same = cp.filter((x) => np.includes(x)); if (same.length) issue('Misma proteína en comida y cena (' + (menu ? 'con menú' : 'sin menú') + ')', `${tag}: ${same.join(', ')}`);
    const cc = c.filter((s) => isMainCarb(s.f)).map((s) => s.f.name), nc = n.filter((s) => isMainCarb(s.f)).map((s) => s.f.name);
    const sameC = cc.filter((x) => nc.includes(x)); if (sameC.length) issue('Mismo hidrato principal en comida y cena (' + (menu ? 'con menú' : 'sin menú') + ')', `${tag}: ${sameC.join(', ')}`);
  });
  // Variedad semanal
  const cnt = {}; DAYS.forEach((dk) => Object.values(mainProt[dk] || {}).forEach((x) => bump(cnt, x)));
  for (const [x, c] of Object.entries(cnt)) if (c >= 4) issue('Misma proteína ≥4 veces en la semana (' + (menu ? 'con menú' : 'sin menú') + ')', `${pname} [${cfgKey}]: ${x} ×${c}`);
  for (let i = 0; i < 6; i++) { const a = Object.values(mainProt[DAYS[i]] || {}), b = Object.values(mainProt[DAYS[i + 1]] || {}); const x = a.find((y) => b.includes(y)); if (x) issue('Misma proteína en días consecutivos (' + (menu ? 'con menú' : 'sin menú') + ')', `${pname} ${DAYS[i]}-${DAYS[i + 1]} [${cfgKey}]: ${x}`); }
  cfg.issues += Object.values(S.issues).reduce((a, b) => a + b, 0) - issuesBefore;
  if (S.plans % 500 === 0) console.error(`… ${S.plans} planes (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const L = [];
L.push(`Jugadores descartados (no generables): ${skipped.length}`);
L.push(`# ${S.plans} planes (${S.days} días) | ${players.length} jugadores (${team7.length} equipo 7) | menús ${menusAll.map((m) => `${m.id}=${m.semana}`).join(', ')} | ${((Date.now() - t0) / 1000).toFixed(0)} s | excepciones: ${Object.values(S.errors).reduce((a, b) => a + b, 0)}`);
for (const [k, v] of Object.entries(S.errors)) L.push(`  ERROR ${v}× ${k}\n${S.errEx[k].map((e) => '      ' + e).join('\n')}`);
const ks = S.dev.map((d) => Math.abs(d.k));
L.push(`\nCUADRE: |Δkcal| medio ${mean(ks).toFixed(1)} | ≤50: ${(100 * ks.filter((x) => x <= 50).length / ks.length).toFixed(1)}% | ≤100: ${(100 * ks.filter((x) => x <= 100).length / ks.length).toFixed(2)}% | |ΔP| ${mean(S.dev.map((d) => Math.abs(d.p))).toFixed(1)} g | |ΔHC| ${mean(S.dev.map((d) => Math.abs(d.h))).toFixed(1)} g | |ΔG| ${mean(S.dev.map((d) => Math.abs(d.g))).toFixed(1)} g`);
for (const t of [...new Set(S.dev.map((d) => d.tipo))]) { const a = S.dev.filter((d) => d.tipo === t); L.push(`   ${t.padEnd(13)} n=${String(a.length).padStart(6)} |Δkcal| ${mean(a.map((d) => Math.abs(d.k))).toFixed(1)} | >100: ${a.filter((d) => Math.abs(d.k) > 100).length} | sesgo medio ${mean(a.map((d) => d.k)).toFixed(1)} kcal`); }
L.push('\nPOR CONFIGURACIÓN (menú | horario):');
for (const [k, v] of Object.entries(S.byCfg).sort()) L.push(`   ${k.padEnd(32)} planes ${String(v.plans).padStart(5)} | |Δkcal| ${(v.absK / Math.max(1, v.days - v.partial)).toFixed(1)} | días >100 ${v.gt100} | parciales ${v.partial} | hallazgos/plan ${(v.issues / v.plans).toFixed(2)}`);
L.push(`\nPROTOCOLOS: esperadas ${S.proto.expected} | cumplidas ${S.proto.ok} | no aplicables ${S.proto.na} | incumplidas ${S.proto.expected - S.proto.ok - S.proto.na} ${JSON.stringify(S.proto.fail)}`);
L.push(`MENÚ: comidas/cenas con menú comprobadas ${S.menuCheck.meals} | proteína del menú ${S.menuCheck.protOk} | proteína fuera de menú ${S.menuCheck.protOff} | hidrato principal fuera de menú ${S.menuCheck.carbOff}`);
L.push(`DETERMINISMO: ${S.det.runs} regeneraciones | distintas ${S.det.diff}`);
const unstable = Object.entries(S.targets).filter(([, s]) => s.size > 1);
L.push(`OBJETIVOS INESTABLES (mismo jugador+tipo de día con objetivos distintos): ${unstable.length}${unstable.slice(0, 5).map(([k, s]) => `\n   ${k}: ${[...s].join(' | ')}`).join('')}`);
L.push(`\nAVISOS DEL MOTOR (${Object.values(S.avisos).reduce((a, b) => a + b, 0)}):`);
for (const [k, v] of Object.entries(S.avisos).sort((a, b) => b[1] - a[1]).slice(0, 12)) L.push(`  ${String(v).padStart(6)}× ${k.slice(0, 170)}\n${S.avisoEx[k].slice(0, 2).map((e) => '         ej: ' + e).join('\n')}`);
L.push('\nHALLAZGOS:');
for (const [k, v] of Object.entries(S.issues).sort((a, b) => b[1] - a[1])) L.push(`  ${String(v).padStart(6)}× ${k}\n${S.ex[k].slice(0, 4).map((e) => '         ej: ' + e).join('\n')}`);
L.push('\nINFO (no necesariamente error):');
for (const [k, v] of Object.entries(S.info).sort((a, b) => b[1] - a[1])) L.push(`  ${String(v).padStart(6)}× ${k}\n${S.infoEx[k].slice(0, 3).map((e) => '         ej: ' + e).join('\n')}`);
L.push('\nGRAMAJES FUERA DE LÍMITES (top):');
for (const [k, v] of Object.entries(S.gramsOut).sort((a, b) => b[1] - a[1]).slice(0, 20)) L.push(`  ${String(v).padStart(6)}× ${k}`);
L.push(`\nLECTURA DE ALIMENTOS: ${(100 * (1 - S.unparsed / S.tokens)).toFixed(2)}% de ${S.tokens} | no leídos top: ${Object.entries(S.unparsedEx).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${v}× "${k}"`).join(' ; ')}`);
console.log(L.join('\n'));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ issues: S.issues, ex: S.ex, info: S.info, infoEx: S.infoEx, avisos: S.avisos, avisoEx: S.avisoEx, errors: S.errors, errEx: S.errEx, byCfg: S.byCfg }, null, 1));
