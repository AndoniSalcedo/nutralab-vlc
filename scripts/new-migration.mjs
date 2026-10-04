// Crea una migración a partir de los cambios hechos en prisma/schema.prisma.
// Uso: npm run db:migration -- nombre_descriptivo
//
// 1. Edita prisma/schema.prisma.
// 2. npm run db:migration -- add_campo_x   → genera prisma/migrations/<fecha>_add_campo_x/migration.sql
//    (diferencia entre la BD actual y el schema).
// 3. REVISA el SQL generado y añade a mano lo que Prisma no conoce (RLS, funciones, checks...).
// 4. npm run db:migrate                     → la aplica (prisma migrate deploy).
//
// NUNCA usar `prisma migrate dev` ni `prisma db push`: la BD se comparte con nutralab y
// ante cualquier diferencia pueden proponer resetear el esquema (borrando los datos).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const name = String(process.argv[2] || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
if (!name) {
  console.error('Indica un nombre: npm run db:migration -- nombre_descriptivo');
  process.exit(1);
}

const sql = execFileSync(
  'node',
  ['scripts/prisma-env.mjs', 'migrate', 'diff',
    '--from-schema-datasource', 'prisma/schema.prisma',
    '--to-schema-datamodel', 'prisma/schema.prisma',
    '--script'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
);

if (!sql.trim() || /This is an empty migration/.test(sql)) {
  console.log('No hay cambios entre prisma/schema.prisma y la base de datos.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const dir = path.join('prisma', 'migrations', `${stamp}_${name}`);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'migration.sql'), `-- Migration: ${name}\n${sql}`);
console.log(`Creada ${dir}/migration.sql — revísala y aplícala con: npm run db:migrate`);
