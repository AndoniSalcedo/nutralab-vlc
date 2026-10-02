// Informe de dietas: genera N semanas por jugador (con y sin menú) y analiza proporciones, restricciones y fallos.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { withLatestMeasurement } from '../lib/metrics/player.js';
import { generarDatosPlan } from '../lib/engine/generator.js';
import { getClinicalCatalogForPlayer } from '../lib/nutrition/clinical-catalog.js';
import { normalizeFoodName } from '../data/foods-crudo.js';
const WEEKS = +process.argv[2] || 3;
const envVars = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if (/^["'].*["']$/.test(v)) v = v.slice(1, -1); envVars[m[1]] = v; }
}
const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, db: { schema: 'teams' } });
const { data: jug } = await sb.from('jugadores').select('*, equipos(configuracion_nutricional)');
const menus = {}; { const { data } = await sb.from('menu_semanal').select('*').order('created_at', { ascending: false }); for (const m of data || []) menus[m.equipo_id] ??= m; }
const players = [];
for (const p of jug.filter((x) => x.num_comidas)) {
  const { data: ev } = await sb.from('evolucion').select('*').eq('jugador_id', p.id); const { data: pe } = await sb.from('pesajes').select('*').eq('jugador_id', p.id);
  const w = withLatestMeasurement(p, ev || [], pe || []); if (w.peso_kg) players.push(w);
}
const cals = [
  { lunes: 'entreno', martes: 'entreno', miercoles: 'descanso', jueves: 'entreno', viernes: 'entreno', sabado: 'descanso', domingo: 'descanso' },
  { lunes: 'descanso', martes: 'entreno', miercoles: 'entreno', jueves: 'recuperacion', viernes: 'entreno', sabado: 'partido', domingo: 'descanso' },
];
const GROUPS = [['proteina>carne', 'Carnes'], ['proteina>pescado', 'Pescado'], ['proteina>marisco', 'Marisco'], ['proteina>huevos', 'Huevos'], ['proteina>conservas_pescado', 'Conservas de pescado'], ['proteina>embutidos', 'Embutidos'], ['proteina>vegetal_proteina', 'Proteína vegetal'], ['lacteos', 'Lácteos'], ['hidratos>arroz', 'Arroz'], ['hidratos>pasta', 'Pasta'], ['hidratos>tuberculos', 'Tubérculos'], ['hidratos>legumbres', 'Legumbres'], ['hidratos>panes', 'Panes'], ['hidratos>cereales', 'Cereales/tortitas'], ['hidratos>otros_granos', 'Otros granos'], ['hidratos>preparados_desayuno', 'Pancakes/crepes'], ['frutas', 'Frutas'], ['verduras', 'Verduras'], ['grasas>aceites', 'Aceites'], ['grasas>aguacate', 'Aguacate'], ['grasas>frutos_secos', 'Frutos secos'], ['complementos', 'Complementos'], ['suplementos', 'Suplementos/otros']];
const groupOf = (f) => { const p = (f.treePath || []).join('>'); for (const [pref, name] of GROUPS) if (p === pref || p.startsWith(pref + '>')) return name; return 'Otros'; };
const stat = { plans: 0, errors: {}, avisos: {}, days: 0, tokens: 0, unparsed: 0, violations: [], issues: {}, dev: [], byObj: {}, kcalGroup: {}, macroSplit: { p: 0, c: 0, g: 0, tot: 0 }, tgtSplit: { p: 0, c: 0, g: 0, tot: 0 }, weekly: [], portions: [], mealP: [] };
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const issue = (k, ex) => { bump(stat.issues, k); (stat.issueEx ||= {})[k] ??= ex; };
function parse(detalle, cat) {
  const out = [];
  for (let tok of detalle.split(/,\s+(?=[A-ZÁÉÍÓÚÑ0-9])/)) {
    tok = tok.trim(); stat.tokens++;
    let m;
    if ((m = tok.match(/^(\d+)\s+Huevos?(?:\s+y\s+(\d+)\s+Claras?)?$/i))) { out.push({ f: cat.foodsByNormalizedName.get('huevo entero'), g: 50 * +m[1] }); if (m[2]) out.push({ f: cat.foodsByNormalizedName.get('claras de huevo'), g: 30 * +m[2] }); continue; }
    if ((m = tok.match(/^(\d+)\s+Claras?$/i))) { out.push({ f: cat.foodsByNormalizedName.get('claras de huevo'), g: 30 * +m[1] }); continue; }
    if ((m = tok.match(/^(.*?)\s+(\d+(?:\.\d+)?)g(?:\s.*)?$/))) {
      let name = m[1].trim(); let f = cat.foodsByNormalizedName.get(normalizeFoodName(name));
      if (!f) { const mm = name.match(/^(?:tostadas?|tostada) de (.*)$/i); if (mm) f = cat.foodsByNormalizedName.get(normalizeFoodName(mm[1])) || cat.foodsByNormalizedName.get(normalizeFoodName('pan ' + mm[1])); }
      if (f) { out.push({ f, g: +m[2], name }); continue; }
    }
    stat.unparsed++; (stat.unEx ||= new Set()).add(tok.slice(0, 40));
  }
  return out;
}
const t0 = Date.now();
for (const p of players) {
  for (const useMenu of [false, true]) {
    const menu = useMenu ? menus[p.equipo_id] : null; if (useMenu && !menu) continue;
    const cat = getClinicalCatalogForPlayer(p, { useMenuCatalog: useMenu });
    for (let w = 0; w < WEEKS; w++) {
      let plan; try { plan = await generarDatosPlan({ jugador: p, nombre: 't', calendario: cals[w % 2], menu, teamConfig: p.equipos?.configuracion_nutricional || {}, preMatchConfig: w % 2 === 1 ? { enabled: true, horario: 'tarde', partidos: { sabado: { horario: 'tarde' } }, diaPartido: 'sabado' } : null }); }
      catch (e) { bump(stat.errors, e.message.slice(0, 110)); continue; }
      stat.plans++;
      for (const a of plan.meta.avisos || []) bump(stat.avisos, a.mensaje.replace(/"[^"]+"/, '"X"').replace(/por .*$/, 'por …'));
      const wk = { fish: 0, blue: 0, red: 0, legumes: 0, eggs: 0, poultry: 0, proteinFoods: new Set() };
      const dayKeys = Object.keys(plan.dias); let prevCarb = null;
      for (const dk of dayKeys) {
        const d = plan.dias[dk]; stat.days++;
        if (d.desviacionMacros) { stat.dev.push(d.desviacionMacros); (stat.byObj[p.objetivo] ||= []).push(d.desviacionMacros.kcal); }
        if (d.macrosReales) { stat.macroSplit.p += 4 * d.macrosReales.proteina; stat.macroSplit.c += 4 * d.macrosReales.hidratos; stat.macroSplit.g += 9 * d.macrosReales.grasa; stat.macroSplit.tot += d.macrosReales.kcal; stat.tgtSplit.p += 4 * d.proteina; stat.tgtSplit.c += 4 * d.hidratos; stat.tgtSplit.g += 9 * d.grasa; stat.tgtSplit.tot += d.kcal; }
        const dayCarbBranches = []; const dayProtBranches = [];
        for (const ing of d.ingestas) {
          if (/^\[/.test(ing.detalle || '')) { issue('Toma sin opción apta', `${p.nombre} ${dk} ${ing.nombre}: ${ing.detalle}`); continue; }
          const items = parse(ing.detalle || '', cat);
          const main = /Comida|Cena/.test(ing.nombre);
          let hasProt = false, hasCarb = false, hasFat = false, mealP = 0;
          for (const { f, g } of items) {
            if (!f) continue;
            const gr = groupOf(f); const kc = g / 100 * f.kcal; bump(stat.kcalGroup, gr, kc);
            if (!cat.foodsByNormalizedName.has(normalizeFoodName(f.name))) { stat.violations.push(`${p.nombre}: ${f.name}`); }
            if (g < f.minGrams - 0.01 && f.treePath?.[0] !== 'grasas' && !/huevo|clara/i.test(f.name) && !f.treePath?.includes('aceites')) bump(stat.portions, `bajo mínimo: ${f.name}`);
            if (g > f.maxGrams + 0.01 && !/Tostadas|Pan/i.test(f.name)) bump(stat.portions, `sobre máximo: ${f.name}`);
            const tp = f.treePath || [];
            if (tp[0] === 'proteina' && !['huevos', 'embutidos', 'conservas_pescado'].includes(tp[1])) { hasProt = true; mealP += g / 100 * f.pro; }
            if (tp[0] === 'hidratos' && ['arroz', 'pasta', 'tuberculos', 'otros_granos', 'legumbres'].includes(tp[1])) { hasCarb = true; if (main) dayCarbBranches.push(tp[1]); }
            if (tp[0] === 'grasas') hasFat = true;
            if (main && tp[0] === 'proteina') { dayProtBranches.push(tp[2] || tp[1]); wk.proteinFoods.add(f.name); }
            if (main) { if (tp[1] === 'pescado') { wk.fish++; if (f.tags?.includes('pescado_azul')) wk.blue++; } if (tp[1] === 'carne' && ['vacuno', 'cerdo', 'cordero', 'carnes_otras'].includes(tp[2])) wk.red++; if (tp[1] === 'carne' && ['pollo', 'pavo'].includes(tp[2])) wk.poultry++; if (tp[1] === 'legumbres' || tp[1] === 'legumbres') wk.legumes++; if (tp[1] === 'huevos') wk.eggs++; }
            if (main && tp[1] === 'legumbres') wk.legumes += 0; 
          }
          if (main) { stat.mealP.push(mealP); if (!hasProt && !items.some(i => i.f?.treePath?.[1] === 'huevos' || i.f?.treePath?.[1] === 'vegetal_proteina')) issue(`${ing.nombre} sin proteína de plato`, `${p.nombre} ${dk}: ${ing.detalle}`); if (!hasCarb && !items.some(i => i.f?.treePath?.[1] === 'panes')) issue(`${ing.nombre} sin hidrato de plato`, `${p.nombre} ${dk}: ${ing.detalle}`); if (!hasFat) issue(`${ing.nombre} sin grasa (aceite/frutos secos)`, `${p.nombre} ${dk}: ${ing.detalle}`); }
        }
        const dupC = dayCarbBranches.length === 2 && dayCarbBranches[0] === dayCarbBranches[1]; if (dupC) issue('Misma familia de hidrato en comida y cena', `${p.nombre} ${dk}: ${dayCarbBranches[0]}`);
        const dupP = dayProtBranches.length === 2 && dayProtBranches[0] === dayProtBranches[1]; if (dupP) issue('Misma familia de proteína en comida y cena', `${p.nombre} ${dk}: ${dayProtBranches[0]}`);
        if (d.desviacionMacros && Math.abs(d.desviacionMacros.kcal) > 100) issue('Día con desvío > 100 kcal', `${p.nombre} ${dk}: ${d.desviacionMacros.kcal} kcal`);
      }
      stat.weekly.push({ useMenu, fish: wk.fish, blue: wk.blue, red: wk.red, poultry: wk.poultry, eggs: wk.eggs, distinct: wk.proteinFoods.size, mealsMain: dayKeys.length * 2 });
    }
  }
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1); const mae = (a) => mean(a.map(Math.abs));
const pctOf = (a, f) => (100 * a.filter(f).length / (a.length || 1)).toFixed(0);
const out = [];
out.push(`# Informe de dietas — ${stat.plans} planes semanales, ${stat.days} días, ${players.length} jugadores, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
out.push(`\n## Errores al generar: ${Object.values(stat.errors).reduce((a, b) => a + b, 0)}`); for (const [k, v] of Object.entries(stat.errors)) out.push(`  ${v}× ${k}`);
out.push(`\n## Avisos del motor`); for (const [k, v] of Object.entries(stat.avisos).sort((a, b) => b[1] - a[1])) out.push(`  ${v}× ${k}`); if (!Object.keys(stat.avisos).length) out.push('  ninguno');
const kd = stat.dev.map((d) => d.kcal); out.push(`\n## Cuadre diario (${kd.length} días)\n  error medio ${mae(kd).toFixed(0)} kcal | sesgo ${mean(kd).toFixed(0)} | ≤50 kcal ${pctOf(kd, (x) => Math.abs(x) <= 50)}% | ≤100 kcal ${pctOf(kd, (x) => Math.abs(x) <= 100)}% | P ${mae(stat.dev.map((d) => d.proteina)).toFixed(1)} g | HC ${mae(stat.dev.map((d) => d.hidratos)).toFixed(1)} g | G ${mae(stat.dev.map((d) => d.grasa)).toFixed(1)} g (error medio)`);
for (const [o, a] of Object.entries(stat.byObj)) out.push(`  objetivo ${o.padEnd(18)} n=${a.length} error medio ${mae(a).toFixed(0)} kcal, sesgo ${mean(a).toFixed(0)}`);
const sp = stat.macroSplit, tg = stat.tgtSplit;
out.push(`\n## Reparto de macros (% de kcal): calculado vs objetivo\n  proteína ${(100 * sp.p / sp.tot).toFixed(1)}% vs ${(100 * tg.p / tg.tot).toFixed(1)}% | hidratos ${(100 * sp.c / sp.tot).toFixed(1)}% vs ${(100 * tg.c / tg.tot).toFixed(1)}% | grasa ${(100 * sp.g / sp.tot).toFixed(1)}% vs ${(100 * tg.g / tg.tot).toFixed(1)}%`);
const totK = Object.values(stat.kcalGroup).reduce((a, b) => a + b, 0);
out.push(`\n## Proporción de kcal por grupo de alimentos (cobertura de lectura ${(100 * (1 - stat.unparsed / stat.tokens)).toFixed(1)}% de ${stat.tokens} alimentos)`);
for (const [g, v] of Object.entries(stat.kcalGroup).sort((a, b) => b[1] - a[1])) out.push(`  ${g.padEnd(22)} ${(100 * v / totK).toFixed(1).padStart(5)}%`);
const wm = (k, menu) => mean(stat.weekly.filter((w) => w.useMenu === menu).map((w) => w[k])).toFixed(1);
out.push(`\n## Por semana (comidas y cenas; 14 tomas)  [sin menú | con menú]`);
for (const [k, l] of [['fish', 'Pescado'], ['blue', '  de ellos azul'], ['red', 'Carne roja (vacuno/cerdo/cordero)'], ['poultry', 'Pollo/pavo'], ['eggs', 'Huevos'], ['distinct', 'Proteínas distintas']]) out.push(`  ${l.padEnd(36)} ${wm(k, false).padStart(5)} | ${wm(k, true).padStart(5)}`);
out.push(`  semanas con pescado azul < 2: ${pctOf(stat.weekly, (w) => w.blue < 2)}% | con carne roja > 4: ${pctOf(stat.weekly, (w) => w.red > 4)}% | sin pescado: ${pctOf(stat.weekly, (w) => w.fish === 0)}%`);
out.push(`\n## Fallos detectados`);
out.push(`  Alimentos servidos fuera del catálogo clínico del jugador (restricciones): ${stat.violations.length}${stat.violations.length ? ' → ' + [...new Set(stat.violations)].slice(0, 5).join('; ') : ''}`);
for (const [k, v] of Object.entries(stat.issues).sort((a, b) => b[1] - a[1])) out.push(`  ${String(v).padStart(5)}× ${k}   ej: ${stat.issueEx[k]}`);
const pc = Object.entries(stat.portions).sort((a, b) => b[1] - a[1]).slice(0, 10); out.push(`  Raciones fuera de rango (top): ${pc.length ? pc.map(([k, v]) => `${k} (${v})`).join('; ') : 'ninguna'}`);
out.push(`  Proteína de plato por comida/cena: media ${mean(stat.mealP).toFixed(0)} g | <20 g: ${pctOf(stat.mealP, (x) => x < 20)}% | >90 g: ${pctOf(stat.mealP, (x) => x > 90)}%`);
if (stat.unEx) out.push(`  Alimentos no leídos (ej.): ${[...stat.unEx].slice(0, 10).join(' | ')}`);
console.log(out.join('\n'));
