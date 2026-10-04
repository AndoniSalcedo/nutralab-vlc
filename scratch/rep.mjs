// Reproduce: busca días con |Δkcal|>100 para un jugador y los imprime
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { withLatestMeasurement } from '../lib/metrics/player.js';
import { generarDatosPlan } from '../lib/engine/generator.js';
const env = {}; for (const l of fs.readFileSync('.env.local','utf8').split('\n')) { const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/); if (m) { let v=m[2]||''; if (/^["'].*["']$/.test(v)) v=v.slice(1,-1); env[m[1]]=v; } }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false}, db:{schema:'teams'} });
const [pid, mid, tipo='recuperacion', runs='200'] = process.argv.slice(2);
const { data: p } = await sb.from('jugadores').select('*, equipos(configuracion_nutricional)').eq('id', +pid).single();
const { data: ev } = await sb.from('evoluciones').select('*').eq('jugador_id', p.id); const { data: pe } = await sb.from('pesajes').select('*').eq('jugador_id', p.id);
const w = withLatestMeasurement(p, ev||[], pe||[]);
const menu = mid === 'none' ? null : (await sb.from('menu_semanal').select('*').eq('id', +mid).single()).data;
console.log('num_comidas', p.num_comidas, 'post', p.postentreno, 'objetivo', p.objetivo, 'peso', w.peso_kg, 'tags', p.intolerancias, p.alergias, 'avers', p.aversiones);
console.log('pautas', JSON.stringify(Object.fromEntries(Object.entries(p.recomendaciones_defecto||{}).map(([k,v])=>[k,v?.raw]))));
const cal = Object.fromEntries(['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].map(d=>[d,tipo]));
let shown = 0; const stats = [];
for (let i = 0; i < +runs && shown < 3; i++) {
  const plan = await generarDatosPlan({ jugador: w, nombre:'t', calendario: cal, menu, teamConfig: p.equipos?.configuracion_nutricional||{}, preMatchConfig: null });
  for (const [d, v] of Object.entries(plan.dias)) { stats.push(v.desviacionMacros?.kcal); if (Math.abs(v.desviacionMacros?.kcal) > 100 && shown < 3) { shown++; console.log('\n', d, v.tipoDia, 'obj', v.kcal, 'P', v.proteina, 'HC', v.hidratos, 'G', v.grasa, 'Δ', JSON.stringify(v.desviacionMacros)); for (const i of v.ingestas) console.log('   ', i.nombre, '|', i.detalle, '|', JSON.stringify(i.macrosReales), 'obj', JSON.stringify(i.objetivo)); } }
}
console.log('días', stats.length, '>100:', stats.filter(x=>Math.abs(x)>100).length);
