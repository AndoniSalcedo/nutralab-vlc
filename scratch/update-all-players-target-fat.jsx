import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: env.SUPABASE_SCHEMA || 'teams' },
});

async function main() {
  console.log('Actualizando porcentaje_grasa_objetivo a 10 para todos los jugadores...');
  
  const { data: players, error: fetchErr } = await supabase
    .from('jugadores')
    .select('id, nombre, apellidos, porcentaje_grasa_objetivo');

  if (fetchErr) throw fetchErr;

  console.log(`Total jugadores encontrados: ${players.length}`);

  const { error } = await supabase
    .from('jugadores')
    .update({ porcentaje_grasa_objetivo: 10 })
    .neq('id', 0); // updates all

  if (error) {
    console.error('Error al actualizar:', error);
  } else {
    console.log('✅ Actualización completada con éxito. Todos los jugadores tienen ahora 10% como objetivo.');
  }

  // Verificar
  const { data: updatedPlayers } = await supabase
    .from('jugadores')
    .select('id, nombre, apellidos, porcentaje_grasa_objetivo')
    .limit(10);

  console.log('Muestra de jugadores actualizados:');
  updatedPlayers?.forEach(p => console.log(`- [${p.id}] ${p.nombre} ${p.apellidos || ''}: % Grasa Objetivo = ${p.porcentaje_grasa_objetivo}%`));
}

main().catch(console.error);
