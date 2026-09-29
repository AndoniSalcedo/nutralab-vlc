/** Busca un usuario de Supabase Auth por email (la API admin solo permite listar). */
export async function findAuthUserByEmail(supabase, email) {
  const target = String(email || '').trim().toLowerCase();
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === target);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}
