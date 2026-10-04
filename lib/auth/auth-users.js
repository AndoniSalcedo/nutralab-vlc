import { getDb, normalizeRows } from '@/lib/db/prisma';

/**
 * Cuentas de acceso de jugadores y técnicos (tabla teams.auth_users).
 *
 * Heredada de Supabase Auth: mismos ids (jugadores/tecnicos.auth_user_id) y contraseñas en
 * bcrypt, comprobadas con pgcrypto (extensions.crypt). Cada función acepta un cliente
 * opcional (p. ej. una transacción).
 */

const ACTIVE_USER = `deleted_at is null and (banned_until is null or banned_until < now())`;
const BCRYPT_COST = 10;

const cleanEmail = (email) => String(email || '').trim().toLowerCase();

async function query(client, sql, ...params) {
  try {
    return normalizeRows(await client.$queryRawUnsafe(sql, ...params));
  } catch (error) {
    // 23505 = violación de unicidad (email ya usado por otra cuenta)
    if (error?.meta?.code === '23505' || /23505|duplicate key/i.test(String(error?.message))) {
      throw new Error('Ese correo ya está en uso por otra cuenta. Usa un correo distinto.');
    }
    throw error;
  }
}

/** Busca un usuario de Supabase Auth por email. */
export async function findAuthUserByEmail(_db, email, client = getDb()) {
  const target = cleanEmail(email);
  if (!target) return null;
  const rows = await query(
    client,
    `select id::text as id, email from teams.auth_users where lower(email) = $1 and deleted_at is null limit 1`,
    target
  );
  return rows[0] || null;
}

/** Usuario por id (uuid) o null. */
export async function getAuthUserById(id, client = getDb()) {
  if (!id) return null;
  const rows = await query(
    client,
    `select id::text as id, email from teams.auth_users where id = $1::uuid and deleted_at is null limit 1`,
    String(id)
  );
  return rows[0] || null;
}

/**
 * Comprueba email + contraseña contra el hash bcrypt de Supabase Auth (pgcrypto).
 * Devuelve { id, email } o null si no coincide.
 */
export async function verifyAuthPassword(email, password, client = getDb()) {
  const target = cleanEmail(email);
  if (!target || typeof password !== 'string' || !password) return null;
  const rows = await query(
    client,
    `select id::text as id, email from teams.auth_users
      where lower(email) = $1
        and ${ACTIVE_USER}
        and encrypted_password is not null and encrypted_password <> ''
        and encrypted_password = extensions.crypt($2, encrypted_password)
      limit 1`,
    target,
    password
  );
  return rows[0] || null;
}

/**
 * Crea una cuenta confirmada.
 * @returns {Promise<{ id: string, email: string }>}
 */
export async function createAuthUser({ email, password, userMetadata = {} }, client = getDb()) {
  const target = cleanEmail(email);
  if (!target || !password) throw new Error('Faltan email o contraseña');

  const rows = await query(
    client,
    `insert into teams.auth_users (email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
     values ($1, extensions.crypt($2, extensions.gen_salt('bf', ${BCRYPT_COST})), now(), $3::jsonb,
             '{"provider":"email","providers":["email"]}'::jsonb)
     returning id::text as id, email`,
    target,
    password,
    JSON.stringify(userMetadata || {})
  );

  if (!rows[0]) throw new Error('No se pudo crear la cuenta');
  return rows[0];
}

/**
 * Actualiza email, contraseña y/o metadatos. Los metadatos se fusionan con los existentes.
 */
export async function updateAuthUser(id, { email, password, userMetadata } = {}, client = getDb()) {
  if (!id) throw new Error('Falta la cuenta');
  const target = email ? cleanEmail(email) : null;

  const rows = await query(
    client,
    `update teams.auth_users set
        email = coalesce($2, email),
        encrypted_password = case when $3::text is null then encrypted_password
                                  else extensions.crypt($3::text, extensions.gen_salt('bf', ${BCRYPT_COST})) end,
        email_confirmed_at = case when $2 is null then email_confirmed_at else coalesce(email_confirmed_at, now()) end,
        raw_user_meta_data = case when $4::jsonb is null then raw_user_meta_data
                                  else coalesce(raw_user_meta_data, '{}'::jsonb) || $4::jsonb end,
        updated_at = now()
      where id = $1::uuid and deleted_at is null
      returning id::text as id, email`,
    String(id),
    target,
    password || null,
    userMetadata ? JSON.stringify(userMetadata) : null
  );

  if (!rows[0]) throw new Error('Cuenta de acceso no encontrada');

  return rows[0];
}

/** Borra la cuenta de acceso. */
export async function deleteAuthUser(id, client = getDb()) {
  if (!id) return false;
  const rows = await query(client, `delete from teams.auth_users where id = $1::uuid returning id::text as id`, String(id));
  return rows.length > 0;
}
