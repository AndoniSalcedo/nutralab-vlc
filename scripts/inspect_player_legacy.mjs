import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const out = {};
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  });
  return out;
}

const env = parseEnv(path.join(process.cwd(), '.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: env.SUPABASE_SCHEMA || 'teams' },
});

async function main() {
  const { data: players, error } = await supabase
    .from('jugadores')
    .select('id, nombre, num_comidas, recomendaciones_defecto, config_prepartido');

  if (error) {
    console.error('Error fetching players:', error);
    return;
  }

  const configuredPlayers = players.filter((p) => {
    const hasRecs = p.recomendaciones_defecto && Object.keys(p.recomendaciones_defecto).length > 0;
    const hasPre = p.config_prepartido && Object.keys(p.config_prepartido).length > 0;
    return hasRecs || hasPre;
  });

  console.log(`\n=== PLAYERS WITH CONFIGURED DATA: ${configuredPlayers.length} of ${players.length} ===\n`);

  configuredPlayers.forEach((p) => {
    console.log(`=== ${p.nombre} (ID: ${p.id}) ===`);
    console.log(`num_comidas: ${p.num_comidas}`);
    console.log('recomendaciones_defecto:', JSON.stringify(p.recomendaciones_defecto, null, 2));
    if (p.config_prepartido) {
      console.log('config_prepartido:', JSON.stringify(p.config_prepartido, null, 2));
    }
    console.log('--------------------------------------------------\n');
  });
}

main();
