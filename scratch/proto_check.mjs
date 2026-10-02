import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { withLatestMeasurement } from '../lib/metrics/player.js';
import { generarDatosPlan } from '../lib/engine/generator.js';
const envVars = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) { const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/); if (m) { let v = m[2] || ''; if (/^["'].*["']$/.test(v)) v = v.slice(1, -1); envVars[m[1]] = v; } }
const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, db: { schema: 'teams' } });
const { data: jug } = await sb.from('jugadores').select('*, equipos(configuracion_nutricional)');
const { data: [menu] } = await sb.from('menu_semanal').select('*').eq('equipo_id', 7).order('created_at', { ascending: false }).limit(1);
const cal = { lunes: 'entreno', martes: 'entreno', miercoles: 'descanso', jueves: 'entreno', viernes: 'entreno', sabado: 'entreno', domingo: 'partido' };
const names = ['Arnau', 'Jesús', 'César', 'Gonzalo', 'Hugo', 'Arnaut'];
const cases = [['Arnau', 'noche', 'domingo', 'Comida'], ['Arnau', 'noche', 'sabado', 'Cena'], ['Jesús', 'noche', 'domingo', 'Comida'], ['César', 'noche', 'domingo', 'Comida'], ['César', 'tarde', 'domingo', 'Comida'], ['Gonzalo', 'noche', 'sabado', 'Cena'], ['Hugo', 'manana', 'domingo', 'Comida'], ['Arnaut', 'manana', 'domingo', 'Comida']];
for (const [nombre, horario, dia, comida] of cases) {
  const raw = jug.find((p) => p.nombre.trim().startsWith(nombre) && (nombre !== 'Arnau' || (p.apellidos || '').startsWith('Mart')) && p.config_prepartido?.[horario]?.recomendaciones?.[comida]); if (!raw) { console.log('sin protocolo', nombre, horario, comida); continue; }
  const { data: ev } = await sb.from('evolucion').select('*').eq('jugador_id', raw.id); const { data: pe } = await sb.from('pesajes').select('*').eq('jugador_id', raw.id);
  const j = withLatestMeasurement(raw, ev || [], pe || []); if (!j.peso_kg) { console.log('sin peso', nombre); continue; }
  let withEggs = 0, N = 30, dev = 0, ex = '';
  for (let i = 0; i < N; i++) {
    const plan = await generarDatosPlan({ jugador: j, nombre: 't', calendario: cal, menu: raw.equipo_id === 7 ? menu : null, teamConfig: raw.equipos?.configuracion_nutricional || {}, preMatchConfig: { enabled: true, horario, partidos: { [dia]: { horario } }, diaPartido: dia } });
    const ing = plan.dias[dia].ingestas.find((x) => x.nombre === comida) || plan.dias[dia === 'domingo' ? 'sabado' : dia].ingestas.find((x) => x.nombre === comida);
    if (/huevo|clara/i.test(ing.detalle)) withEggs++; dev += Math.abs(plan.dias[dia].desviacionMacros?.kcal || 0); if (!ex) ex = ing.detalle;
  }
  console.log(`${nombre} · ${horario} · ${dia} ${comida}: con huevos ${withEggs}/${N} | desvío del día ${(dev / N).toFixed(0)} kcal\n    pauta: ${raw.config_prepartido[horario].recomendaciones[comida].raw.slice(0, 80)}\n    ej: ${ex}`);
}
