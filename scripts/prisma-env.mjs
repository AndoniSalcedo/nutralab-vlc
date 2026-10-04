// Ejecuta el CLI de Prisma con las variables de .env.local (Prisma solo lee .env por sí mismo).
// Uso: node scripts/prisma-env.mjs <comando de prisma...>   p. ej. migrate deploy
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

for (const file of ['.env.local', '.env']) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const result = spawnSync('npx', ['prisma', ...process.argv.slice(2)], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
