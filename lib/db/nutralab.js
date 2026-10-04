import { getDb, normalizeRows } from '@/lib/db/prisma';

/**
 * Tablas de nutralab (esquema public, gestionadas por su Prisma). Aquí solo se leen,
 * con SQL parametrizado, para no duplicar sus modelos en el schema de esta app.
 */

/** Nutricionista sin el avatar (solo si tiene uno, vía avatarSize). */
export async function getNutritionistProfile(id) {
  if (!id) return null;
  const rows = await getDb().$queryRawUnsafe(
    `select "id"::text as id, "name", "email", "avatarSize" from public."Nutritionist" where "id"::text = $1 limit 1`,
    String(id)
  );
  return normalizeRows(rows)[0] || null;
}

export async function getNutritionistAvatar(id) {
  if (!id) return null;
  const rows = await getDb().$queryRawUnsafe(
    `select "id"::text as id, "avatar", "avatarMime", "avatarSize" from public."Nutritionist" where "id"::text = $1 limit 1`,
    String(id)
  );
  return normalizeRows(rows)[0] || null;
}

export async function getAllFoods() {
  const rows = await getDb().$queryRawUnsafe(
    `select "id", "name", "kcal", "cho", "pro", "fat", "sortOrder" from public."Food" order by "sortOrder" asc, "name" asc`
  );
  return normalizeRows(rows);
}
