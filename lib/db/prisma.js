import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Cliente Prisma de la app (esquema `teams`, conexión directa por el pooler de Supabase).
 *
 * Capa de compatibilidad: la app se escribió contra PostgREST (supabase-js), que devuelve
 * JSON plano. Para no tocar la UI, entrada y salida se normalizan a esa misma forma:
 *   - BigInt  → number           (ids bigserial)
 *   - @db.Date → 'YYYY-MM-DD'     (las fechas "puras" viajaban como texto)
 *   - Timestamptz → ISO string
 *   - Bytes   → Buffer
 * y en la entrada se aceptan ids como string/number, fechas como string y bytea en hex ('\x...').
 */

const MODELS = Object.fromEntries(
  Prisma.dmmf.datamodel.models.map((model) => [
    model.name,
    Object.fromEntries(model.fields.map((field) => [field.name, field])),
  ])
);

const isDateOnly = (field) => field?.nativeType?.[0] === 'Date';

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDateOnly(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

// ---------- salida ----------

function outScalar(value, field) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return isDateOnly(field) ? formatDateOnly(value) : value.toISOString();
  if (value instanceof Uint8Array && !Buffer.isBuffer(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  if (Prisma.Decimal.isDecimal?.(value)) return Number(value);
  return value;
}

function normalizeOut(modelName, value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => normalizeOut(modelName, item));
  if (typeof value !== 'object' || value instanceof Date || value instanceof Uint8Array) {
    return outScalar(value);
  }
  if (Prisma.Decimal.isDecimal?.(value)) return Number(value);

  const fields = MODELS[modelName] || {};
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    const field = fields[key];
    if (field?.kind === 'object') out[key] = normalizeOut(field.type, val);
    else if (val && typeof val === 'object' && !(val instanceof Date) && !(val instanceof Uint8Array) && !field) {
      out[key] = normalizeOut(null, val); // _count, agregados...
    } else out[key] = outScalar(val, field);
  }
  return out;
}

/** Normaliza filas de `$queryRaw` (sin metadatos de modelo). */
export function normalizeRows(rows) {
  return normalizeOut(null, rows);
}

// ---------- entrada ----------

function inScalar(value, field) {
  if (value === null || value === undefined || !field) return value;
  switch (field.type) {
    case 'BigInt':
      if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
      if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return BigInt(value.trim());
      return value;
    case 'Int':
    case 'Float':
      if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
      return value;
    case 'DateTime':
      if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00.000Z`);
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? value : parsed;
      }
      if (typeof value === 'number') return new Date(value);
      return value;
    case 'Boolean':
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    case 'String':
      return typeof value === 'number' ? String(value) : value;
    case 'Bytes':
      if (typeof value === 'string' && value.startsWith('\\x')) return Buffer.from(value.slice(2), 'hex');
      return value;
    default:
      return value;
  }
}

const FILTER_OPS = new Set(['equals', 'not', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'has', 'hasSome', 'hasEvery']);
const RELATION_OPS = new Set(['is', 'isNot', 'some', 'every', 'none']);

function inScalarOrList(value, field) {
  return Array.isArray(value) && !field.isList ? value.map((v) => inScalar(v, field)) : inScalar(value, field);
}

function normalizeWhere(modelName, where) {
  if (!where || typeof where !== 'object') return where;
  const fields = MODELS[modelName] || {};
  const out = {};
  for (const [key, val] of Object.entries(where)) {
    // Prisma ignora un filtro `undefined` (devolvería todas las filas); PostgREST fallaba.
    if (val === undefined) throw new Error(`Filtro sin valor en ${modelName}.${key}`);
    if (key === 'AND' || key === 'OR' || key === 'NOT') {
      out[key] = Array.isArray(val) ? val.map((w) => normalizeWhere(modelName, w)) : normalizeWhere(modelName, val);
      continue;
    }
    const field = fields[key];
    if (!field) {
      // Clave única compuesta (p. ej. jugador_id_fecha: { jugador_id, fecha })
      out[key] = val && typeof val === 'object' ? normalizeWhere(modelName, val) : val;
    } else if (field.kind === 'object') {
      const rel = {};
      const isOpObject = val && typeof val === 'object' && Object.keys(val).some((k) => RELATION_OPS.has(k));
      if (isOpObject) {
        for (const [op, sub] of Object.entries(val)) rel[op] = normalizeWhere(field.type, sub);
        out[key] = rel;
      } else {
        out[key] = normalizeWhere(field.type, val);
      }
    } else if (val && typeof val === 'object' && !(val instanceof Date) && !Buffer.isBuffer(val) && !Array.isArray(val)) {
      const filter = {};
      for (const [op, sub] of Object.entries(val)) {
        if (!FILTER_OPS.has(op)) filter[op] = sub;
        else if (op === 'not' && sub && typeof sub === 'object' && !(sub instanceof Date)) filter[op] = normalizeWhere(modelName, { [key]: sub })[key];
        else filter[op] = inScalarOrList(sub, field);
      }
      out[key] = filter;
    } else {
      out[key] = inScalar(val, field);
    }
  }
  return out;
}

function normalizeData(modelName, data) {
  if (Array.isArray(data)) return data.map((d) => normalizeData(modelName, d));
  if (!data || typeof data !== 'object') return data;
  const fields = MODELS[modelName] || {};
  const out = {};
  for (const [key, val] of Object.entries(data)) {
    const field = fields[key];
    if (!field || field.kind === 'object') out[key] = val;
    else if (field.type === 'Json' && val === null) out[key] = Prisma.DbNull;
    else if (field.type === 'Json' || field.isList) out[key] = val;
    else if (val && typeof val === 'object' && 'set' in val) out[key] = { ...val, set: inScalar(val.set, field) };
    else out[key] = inScalar(val, field);
  }
  return out;
}

function normalizeArgs(modelName, args) {
  if (!args || typeof args !== 'object') return args;
  const next = { ...args };
  if (next.where) next.where = normalizeWhere(modelName, next.where);
  if (next.data) next.data = normalizeData(modelName, next.data);
  if (next.create) next.create = normalizeData(modelName, next.create);
  if (next.update) next.update = normalizeData(modelName, next.update);
  return next;
}

// Las imágenes (bytea) nunca viajan en las consultas generales: la UI pinta las fotos con
// /api/media/* a partir de *_size. Solo esas rutas las piden con `select` explícito.
const OMIT_BINARIES = {
  jugadores: { avatar: true },
  equipos: { foto: true },
  tecnicos: { avatar: true },
  comidas: { photo: true },
};

function createClient() {
  return new PrismaClient({ omit: OMIT_BINARIES }).$extends({
    query: {
      $allModels: {
        async $allOperations({ model, args, query }) {
          const result = await query(normalizeArgs(model, args));
          return normalizeOut(model, result);
        },
      },
    },
  });
}

const globalForPrisma = globalThis;

/** Cliente compartido (en desarrollo sobrevive al hot reload). */
export function getDb() {
  if (!globalForPrisma.__nutralabVlcPrisma) {
    globalForPrisma.__nutralabVlcPrisma = createClient();
  }
  return globalForPrisma.__nutralabVlcPrisma;
}

/** 'id,nombre, apellidos' → { id: true, nombre: true, apellidos: true }; '*' → undefined (todas). */
export function selectFields(fields) {
  if (!fields || fields.trim() === '*') return undefined;
  return Object.fromEntries(
    fields.split(',').map((f) => f.trim()).filter(Boolean).map((f) => [f, true])
  );
}

/**
 * Upsert de varias filas en una transacción (equivalente a `.upsert([...], { onConflict })`).
 * `uniqueKey(row)` devuelve el `where` único de cada fila.
 */
export async function upsertMany(db, model, rows, uniqueKey) {
  if (!rows?.length) return [];
  const upsert = (client, row) => client[model].upsert({ where: uniqueKey(row), create: row, update: row });
  // Dentro de una transacción interactiva (`tx`) no existe $transaction: ya es atómico.
  if (typeof db.$transaction !== 'function') {
    const results = [];
    for (const row of rows) results.push(await upsert(db, row));
    return results;
  }
  return db.$transaction(rows.map((row) => upsert(db, row)));
}

export { Prisma };
