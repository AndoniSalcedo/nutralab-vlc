/**
 * Guarda en todos los jugadores su reparto de kcal por ingesta (`reparto_ingestas`). Quien no lo tiene, o lo tiene
 * con otras tomas que las actuales, recibe el reparto por defecto de sus tomas (el patrón fijo que usaba el motor).
 *
 * Uso: npm run meals:distribution:sync            (simulación, no escribe)
 *      npm run meals:distribution:sync -- --write (escribe)
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { syncMealDistribution } from '../lib/nutrition/meal-distribution.js';

for (const file of ['.env.local', '.env']) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const DRY_RUN = !process.argv.includes('--write');
// Postgres guarda el JSON con sus claves reordenadas: se compara sin tener en cuenta el orden.
const canonical = (value) => (value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]))
  : value);
const sameJson = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

const prisma = new PrismaClient();
const players = await prisma.jugadores.findMany({
  select: { id: true, nombre: true, apellidos: true, num_comidas: true, postentreno: true, reparto_ingestas: true },
  orderBy: { id: 'asc' },
});

let changed = 0;
const examples = new Map();
for (const player of players) {
  const next = syncMealDistribution(player);
  if (sameJson(next, player.reparto_ingestas)) continue;
  changed++;
  const key = JSON.stringify(next);
  if (!examples.has(key)) examples.set(key, `${player.nombre} ${player.apellidos || ''}`.trim());
  if (!DRY_RUN) {
    await prisma.jugadores.update({ where: { id: player.id }, data: { reparto_ingestas: next } });
  }
}

console.log(`${DRY_RUN ? 'SIMULACIÓN' : 'ESCRITO'}: ${changed} de ${players.length} jugadores actualizados.`);
for (const [distribution, name] of examples) console.log(`  ${distribution}  (p. ej. ${name})`);
await prisma.$disconnect();
