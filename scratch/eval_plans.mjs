// Evaluación del motor: desvío por toma y por día frente al objetivo real (plan.dias[d].ingestas[].objetivo).
// Uso: node --loader ./scratch/loader.mjs scratch/eval_plans.mjs [nJugadores] [equipoId]
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { withLatestMeasurement } from '../lib/metrics/player.js';
import { generarDatosPlan } from '../lib/engine/generator.js';
const envVars = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if (/^["'].*["']$/.test(v)) v = v.slice(1, -1); envVars[m[1]] = v; }
}
const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, db: { schema: 'teams' } });
const equipoId = +process.argv[3] || 7;
const { data: jug } = await sb.from('jugadores').select('*, equipos(configuracion_nutricional)').eq('equipo_id', equipoId);
const { data: [menu] } = await sb.from('menu_semanal').select('*').eq('equipo_id', equipoId).order('created_at', { ascending: false }).limit(1);
const cal = { lunes: 'entreno', martes: 'entreno', miercoles: 'descanso', jueves: 'entreno', viernes: 'entreno', sabado: 'descanso', domingo: 'descanso' };
const players = [];
for (const p of jug.filter((x) => x.num_comidas)) {
  if (players.length >= (+process.argv[2] || 30)) break;
  const { data: ev } = await sb.from('evolucion').select('*').eq('jugador_id', p.id);
  const { data: pe } = await sb.from('pesajes').select('*').eq('jugador_id', p.id);
  const w = withLatestMeasurement(p, ev || [], pe || []);
  if (w.peso_kg) players.push(w);
}
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const mae = (a) => mean(a.map(Math.abs));
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
for (const useMenu of [false, true]) {
  const day = { kcal: [], p: [], hc: [], g: [] }; const meal = {}; let errs = 0; const t0 = Date.now();
  for (const p of players) {
    let plan; try { plan = await generarDatosPlan({ jugador: p, nombre: 't', calendario: cal, menu: useMenu ? menu : null, teamConfig: p.equipos?.configuracion_nutricional || {}, preMatchConfig: null }); } catch { errs++; continue; }
    for (const d of Object.values(plan.dias)) {
      if (!d.desviacionMacros) continue;
      day.kcal.push(d.desviacionMacros.kcal); day.p.push(d.desviacionMacros.proteina); day.hc.push(d.desviacionMacros.hidratos); day.g.push(d.desviacionMacros.grasa);
      for (const ing of d.ingestas) {
        if (!ing.objetivo || !ing.macrosReales) continue;
        const k = ing.nombre.replace(/Post.*/, 'Post'); meal[k] ??= { kcal: [], p: [], hc: [], g: [] };
        meal[k].kcal.push(ing.macrosReales.kcal - ing.objetivo.kcal); meal[k].p.push(ing.macrosReales.proteina - ing.objetivo.proteina);
        meal[k].hc.push(ing.macrosReales.hidratos - ing.objetivo.hidratos); meal[k].g.push(ing.macrosReales.grasa - ing.objetivo.grasa);
      }
    }
  }
  console.log(`\n=== ${useMenu ? 'CON menú' : 'SIN menú'} · ${players.length} jugadores · ${day.kcal.length} días · errores ${errs} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  console.log(`DÍA  sesgo kcal ${mean(day.kcal).toFixed(0)} | error abs kcal ${mae(day.kcal).toFixed(0)} | P ${mean(day.p).toFixed(1)}/${mae(day.p).toFixed(1)} | HC ${mean(day.hc).toFixed(1)}/${mae(day.hc).toFixed(1)} | G ${mean(day.g).toFixed(1)}/${mae(day.g).toFixed(1)}   (sesgo/error abs)`);
  console.log(`     días |kcal|<=50: ${(100 * day.kcal.filter((x) => Math.abs(x) <= 50).length / day.kcal.length).toFixed(0)}% | <=100: ${(100 * day.kcal.filter((x) => Math.abs(x) <= 100).length / day.kcal.length).toFixed(0)}% | p10/p50/p90: ${pct(day.kcal, .1).toFixed(0)}/${pct(day.kcal, .5).toFixed(0)}/${pct(day.kcal, .9).toFixed(0)}`);
  for (const [k, v] of Object.entries(meal)) console.log(`  ${k.padEnd(10)} n=${String(v.kcal.length).padStart(3)} | kcal ${mean(v.kcal).toFixed(0).padStart(5)}/${mae(v.kcal).toFixed(0).padStart(3)} | P ${mean(v.p).toFixed(1).padStart(5)}/${mae(v.p).toFixed(1).padStart(4)} | HC ${mean(v.hc).toFixed(1).padStart(5)}/${mae(v.hc).toFixed(1).padStart(4)} | G ${mean(v.g).toFixed(1).padStart(5)}/${mae(v.g).toFixed(1).padStart(4)}`);
}
