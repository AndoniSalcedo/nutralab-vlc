/**
 * Deja a todos los jugadores con su protocolo de partido completo (mañana, tarde y noche): las tomas pautadas a mano
 * se conservan y el resto pasan a ser "por defecto", una copia de su pauta habitual que la app rehace cada vez que
 * cambian sus comidas o pautas (ver lib/nutrition/prematch-protocol.js).
 *
 * Uso: npm run prematch:sync            (simulación, no escribe)
 *      npm run prematch:sync -- --write (escribe y guarda copia de seguridad)
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { syncPreMatchProtocol, isDefaultProtocolMeal } from '../lib/nutrition/prematch-protocol.js';
import { validateAstValue, preMatchConfigSchema } from '../validations/mealAstSchema.js';

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
const canonical = (value) => (Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value);
const sameJson = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
// .bak: ignorado por git (contiene datos de jugadores).
const BACKUP_PATH = 'scratch/prematch-protocols-backup.bak';

const prisma = new PrismaClient();
const players = await prisma.jugadores.findMany({
  select: { id: true, nombre: true, apellidos: true, num_comidas: true, recomendaciones_defecto: true, config_prepartido: true },
  orderBy: { id: 'asc' },
});

const backup = {};
const invalid = [];
let changed = 0;
let manualMeals = 0;
let defaultMeals = 0;

for (const player of players) {
  const next = syncPreMatchProtocol(player);
  for (const cfg of Object.values(next)) {
    for (const pattern of Object.values(cfg?.recomendaciones || {})) {
      if (isDefaultProtocolMeal(pattern)) defaultMeals++;
      else manualMeals++;
    }
  }
  if (sameJson(next, player.config_prepartido || {})) continue;

  const validation = validateAstValue(preMatchConfigSchema, next, { label: 'Protocolo pre-partido' });
  const name = `${player.nombre} ${player.apellidos || ''}`.trim();
  if (!validation.success) {
    invalid.push(`${name} (#${player.id}): ${validation.error}`);
    continue;
  }
  changed++;
  backup[String(player.id)] = player.config_prepartido;
  if (!DRY_RUN) {
    await prisma.jugadores.update({ where: { id: player.id }, data: { config_prepartido: validation.data } });
  }
}

if (!DRY_RUN) fs.writeFileSync(BACKUP_PATH, JSON.stringify(backup, null, 2));
console.log(`${DRY_RUN ? 'SIMULACIÓN' : 'ESCRITO'}: ${changed} de ${players.length} jugadores actualizados.`);
console.log(`Tomas de protocolo resultantes: ${manualMeals} manuales, ${defaultMeals} por defecto.`);
if (invalid.length) console.log(`Sin tocar por no ser válidos:\n  ${invalid.join('\n  ')}`);
if (!DRY_RUN) console.log(`Copia de seguridad: ${BACKUP_PATH}`);
await prisma.$disconnect();
