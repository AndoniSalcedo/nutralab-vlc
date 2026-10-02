import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { withLatestMeasurement } from '../lib/metrics/player.js';
import { generarDatosPlan } from '../lib/engine/generator.js';
const envVars = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/); if (m) { let v = m[2] || ''; if (/^["'].*["']$/.test(v)) v = v.slice(1, -1); envVars[m[1]] = v; } }
const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, db: { schema: 'teams' } });
const { data: jug } = await sb.from('jugadores').select('*, equipos(configuracion_nutricional)'); const { data: menus } = await sb.from('menu_semanal').select('*').eq('equipo_id', 7);
const players = []; for (const p of jug.filter((x) => x.num_comidas)) { const { data: ev } = await sb.from('evolucion').select('*').eq('jugador_id', p.id); const { data: pe } = await sb.from('pesajes').select('*').eq('jugador_id', p.id); const w = withLatestMeasurement(p, ev || [], pe || []); if (w.peso_kg) players.push(w); }
const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const CAL = [{ lunes: 'recuperacion', martes: 'entreno', miercoles: 'doble', jueves: 'entreno', viernes: 'entreno', sabado: 'partido', domingo: 'descanso' }, { lunes: 'lesion', martes: 'lesion', miercoles: 'entreno', jueves: 'entreno', viernes: 'entreno', sabado: 'entreno', domingo: 'partido' }, { lunes: 'descanso', martes: 'entreno', miercoles: 'entreno', jueves: 'entreno', viernes: 'descanso', sabado: 'entreno', domingo: 'descanso' }];
const out = []; const real = Math.random;
for (let i = 0; i < 240; i++) { const p = players[i % players.length]; const cal = CAL[i % CAL.length]; const menu = p.equipo_id === 7 && i % 4 !== 0 ? menus[i % menus.length] : null; const md = DAYS.filter((d) => cal[d] === 'partido'); const hz = ['manana', 'tarde', 'noche'][i % 3]; const pm = md.length && i % 5 !== 0 ? { enabled: true, partidos: Object.fromEntries(md.map((d) => [d, { horario: hz }])), diaPartido: md[0], horario: hz } : null;
  Math.random = seeded(9000 + i); const plan = await generarDatosPlan({ jugador: p, nombre: 't', calendario: cal, menu, teamConfig: p.equipos?.configuracion_nutricional || {}, preMatchConfig: pm }); out.push(crypto.createHash('md5').update(JSON.stringify(plan, (k, v) => (k === 'fecha' ? undefined : v))).digest('hex')); }
Math.random = real; fs.writeFileSync(process.argv[2], JSON.stringify(out)); console.log('guardados', out.length);
