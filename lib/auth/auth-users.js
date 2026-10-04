import { getDb, normalizeRows } from '@/lib/db/prisma';

/**
 * Cuentas de acceso (Supabase Auth) gestionadas directamente en auth.users / auth.identities
 * por la conexión a la BD, sin depender de la API de Supabase.
 *
 * Las filas se escriben con el mismo formato que GoTrue (hash bcrypt, identidad 'email',
 * tokens como '' y no NULL) para que las cuentas sigan siendo válidas si se vuelve a usar
 * la API de Supabase Auth. Cada función acepta un cliente opcional (p. ej. una transacción).
 */

const ACTIVE_USER = `deleted_at is null and (banned_until is null or banned_until < now())`;
const BCRYPT_COST = 10; // el mismo coste que usa GoTrue

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
    `select id::text as id, email from auth.users where lower(email) = $1 and deleted_at is null limit 1`,
    target
  );
  return rows[0] || null;
}

/** Usuario por id (uuid) o null. */
export async function getAuthUserById(id, client = getDb()) {
  if (!id) return null;
  const rows = await query(
    client,
    `select id::text as id, email from auth.users where id = $1::uuid and deleted_at is null limit 1`,
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
    `select id::text as id, email from auth.users
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
 * Crea una cuenta confirmada (equivale a auth.admin.createUser con email_confirm: true).
 * @returns {Promise<{ id: string, email: string }>}
 */
export async function createAuthUser({ email, password, userMetadata = {} }, client = getDb()) {
  const target = cleanEmail(email);
  if (!target || !password) throw new Error('Faltan email o contraseña');

  const rows = await query(
    client,
    `with new_user as (
       insert into auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, recovery_token, email_change_token_new, email_change
       ) values (
         '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
         $1, extensions.crypt($2, extensions.gen_salt('bf', ${BCRYPT_COST})), now(),
         '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(),
         '', '', '', ''
       )
       returning id, email
     ), new_identity as (
       insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
       select id::text, id,
              jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true, 'phone_verified', false),
              'email', now(), now(), now()
         from new_user
       returning user_id
     )
     select u.id::text as id, u.email from new_user u join new_identity i on i.user_id = u.id`,
    target,
    password,
    JSON.stringify(userMetadata || {})
  );

  if (!rows[0]) throw new Error('No se pudo crear la cuenta');
  return rows[0];
}

/**
 * Actualiza email, contraseña y/o metadatos (equivale a auth.admin.updateUserById).
 * Los metadatos se fusionan con los existentes, como hace Supabase Auth.
 */
export async function updateAuthUser(id, { email, password, userMetadata } = {}, client = getDb()) {
  if (!id) throw new Error('Falta la cuenta');
  const target = email ? cleanEmail(email) : null;

  const rows = await query(
    client,
    `update auth.users set
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

  if (target) {
    await query(
      client,
      `update auth.identities
          set identity_data = coalesce(identity_data, '{}'::jsonb) || jsonb_build_object('email', $2::text),
              updated_at = now()
        where user_id = $1::uuid and provider = 'email'`,
      String(id),
      target
    );
  }

  return rows[0];
}

/** Borra la cuenta (sus identidades y sesiones caen en cascada, como en auth.admin.deleteUser). */
export async function deleteAuthUser(id, client = getDb()) {
  if (!id) return false;
  const rows = await query(client, `delete from auth.users where id = $1::uuid returning id::text as id`, String(id));
  return rows.length > 0;
}
