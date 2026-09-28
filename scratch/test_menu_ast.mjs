import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { convertDishToAst, convertServiceToAst, formatAstToText } from './lib/engine/meal-ast.js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    envVars[match[1]] = val;
  }
}
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: envVars.SUPABASE_SCHEMA || 'teams' }
});

const { data: menu } = await supabase.from('menu_semanal').select('*').eq('id', 24).single();
const lunes = menu.dias.find(d => d.dia.toLowerCase() === 'lunes');

console.log('--- TEST DISH AST ---');
const sampleDish = lunes.comida.platos_desglosados[0];
const dishAst = convertDishToAst(sampleDish);
console.log('Sample dish name:', sampleDish.nombre);
console.log('Dish AST:', JSON.stringify(dishAst, null, 2));

console.log('\n--- TEST SERVICE AST ---');
const serviceAst = convertServiceToAst(lunes.comida);
console.log('Service AST:', JSON.stringify(serviceAst, null, 2));
console.log('Formatted Service AST:', formatAstToText({ tree: serviceAst }));
