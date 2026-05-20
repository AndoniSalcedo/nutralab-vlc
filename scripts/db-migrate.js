'use strict';

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { Client } = require('pg');

const DEFAULT_SCHEMA = 'teams';
const ENV_FILES = ['.env.local', '.env'];
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

function parseEnvFile(filePath) {
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
    if (!(key in process.env)) out[key] = val;
  });
  return out;
}

function loadEnvFiles() {
  for (const name of ENV_FILES) {
    const envFromFile = parseEnvFile(path.join(process.cwd(), name));
    Object.entries(envFromFile).forEach(([key, value]) => {
      if (!(key in process.env)) process.env[key] = value;
    });
  }
}

function getConnectionString() {
  return (
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PG_CONNECTION_STRING ||
    ''
  );
}

function sanitizeSchema(name) {
  const schema = String(name || '').trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error('Invalid schema name. Use letters, numbers, and underscore only.');
  }
  return schema;
}

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function readMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d{14}_.+\.sql$/.test(file))
    .sort()
    .map((file) => {
      const version = file.slice(0, 14);
      const name = file.slice(15, -4);
      return {
        file,
        version,
        name,
        sql: fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'),
      };
    });
}

async function ensureMigrationTable(client, schema) {
  await client.query(`create schema if not exists ${schema};`);
  await client.query(`
    create table if not exists ${schema}.schema_migrations (
      version text primary key,
      name text not null,
      file_name text not null,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getAppliedVersions(client, schema) {
  const result = await client.query(`select version from ${schema}.schema_migrations order by version;`);
  return new Set(result.rows.map((row) => row.version));
}

async function printStatus(client, schema, migrations) {
  await ensureMigrationTable(client, schema);
  const applied = await getAppliedVersions(client, schema);
  migrations.forEach((migration) => {
    const state = applied.has(migration.version) ? 'applied' : 'pending';
    process.stdout.write(`${state.padEnd(8)} ${migration.file}\n`);
  });
}

async function applyMigration(client, schema, migration) {
  await client.query('begin');
  try {
    await client.query(migration.sql);
    await client.query(
      `insert into ${schema}.schema_migrations (version, name, file_name)
       values ($1, $2, $3)
       on conflict (version) do nothing;`,
      [migration.version, migration.name, migration.file]
    );
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw new Error(`Migration failed (${migration.file}): ${err.message}`);
  }
}

async function run() {
  loadEnvFiles();

  const schema = sanitizeSchema(getArg('schema') || process.env.TARGET_SCHEMA || DEFAULT_SCHEMA);
  const statusOnly = process.argv.includes('--status');
  const migrations = readMigrations();
  const conn = getConnectionString();

  if (schema !== DEFAULT_SCHEMA) {
    throw new Error(`This migration set targets the "${DEFAULT_SCHEMA}" schema. Received "${schema}".`);
  }

  if (!conn) {
    throw new Error(
      'Missing connection string. Set SUPABASE_DB_URL, DATABASE_URL, POSTGRES_URL, or PG_CONNECTION_STRING.'
    );
  }

  const client = new Client({ connectionString: conn });
  await client.connect();

  try {
    if (statusOnly) {
      await printStatus(client, schema, migrations);
      return;
    }

    await ensureMigrationTable(client, schema);
    const applied = await getAppliedVersions(client, schema);
    const pending = migrations.filter((migration) => !applied.has(migration.version));

    if (pending.length === 0) {
      process.stdout.write('No pending migrations.\n');
      return;
    }

    for (const migration of pending) {
      process.stdout.write(`Applying ${migration.file}...\n`);
      await applyMigration(client, schema, migration);
    }

    await client.query(`notify pgrst, 'reload schema';`);
    process.stdout.write(`Applied ${pending.length} migration(s).\n`);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
