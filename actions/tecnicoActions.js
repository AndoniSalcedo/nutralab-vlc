'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getOwnerId } from '@/lib/auth/team-access';
import {
  getTecnicosByOwner,
  getTecnicoByEmail,
  createTecnicoRecord,
  linkTecnicoToNutricionista,
  unlinkTecnicoFromNutricionista,
  getNutricionistaTecnicoLink,
  assignTeamsToTecnico,
  updateTecnicoAvatar,
  removeTecnicoAvatar,
} from '@/repositories/tecnicoRepository';

async function findAuthUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

export async function getTecnicosAction() {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const supabase = getSupabaseAdmin();
  const result = await getTecnicosByOwner(supabase, ownerId);
  return { tecnicos: result || [] };
}

export async function createTecnicoAction(payload) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const email = String(payload?.email || '').trim().toLowerCase();
  if (!email) throw new Error('Falta el email del técnico');

  const supabase = getSupabaseAdmin();
  const tecnico = await getTecnicoByEmail(supabase, email);
  if (!tecnico) {
    throw new Error('No se encontró ningún técnico registrado con este correo. Por favor, indícale al técnico que se registre primero en la pantalla de acceso.');
  }

  await linkTecnicoToNutricionista(supabase, ownerId, tecnico.id);
  revalidatePath('/dashboard/tecnicos');
  return { tecnico };
}

export async function deleteTecnicoAction(id) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');
  if (!id) throw new Error('Falta id');

  const supabase = getSupabaseAdmin();
  await unlinkTecnicoFromNutricionista(supabase, ownerId, id);
  revalidatePath('/dashboard/tecnicos');
  return { ok: true };
}

export async function assignTeamsAction(tecnicoId, teamIds) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');
  if (!tecnicoId) throw new Error('Falta tecnico_id');

  const teams = Array.isArray(teamIds) ? teamIds : [];
  const supabase = getSupabaseAdmin();
  const link = await getNutricionistaTecnicoLink(supabase, ownerId, tecnicoId);
  if (!link) throw new Error('No tienes acceso a este técnico');

  await assignTeamsToTecnico(supabase, ownerId, tecnicoId, teams);
  revalidatePath('/dashboard/tecnicos');
  return { ok: true };
}

export async function registerTecnicoAction(payload) {
  const nombre = String(payload?.nombre || '').trim();
  const apellidos = String(payload?.apellidos || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '').trim();

  if (!nombre || !email || !password) {
    throw new Error('Faltan campos obligatorios');
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const supabase = getSupabaseAdmin();
  const existingTecnico = await getTecnicoByEmail(supabase, email);
  if (existingTecnico) {
    throw new Error('Este email ya está registrado como técnico. Puedes iniciar sesión directamente.');
  }

  const existingUser = await findAuthUserByEmail(supabase, email);
  let authUserId = null;
  let isNewAuthUser = false;

  if (existingUser) {
    authUserId = existingUser.id;
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(authUserId, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        role: 'tecnico',
        name: `${nombre} ${apellidos}`.trim(),
      },
    });
    if (updateAuthError) throw updateAuthError;
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'tecnico',
        name: `${nombre} ${apellidos}`.trim(),
      },
    });

    if (authError) throw authError;
    authUserId = authData.user.id;
    isNewAuthUser = true;
  }

  try {
    const tecnico = await createTecnicoRecord(supabase, {
      auth_user_id: authUserId,
      nombre,
      apellidos,
      email,
      owner_id: null,
    });

    return { tecnico };
  } catch (dbError) {
    if (isNewAuthUser && authUserId) {
      await supabase.auth.admin.deleteUser(authUserId);
    }
    throw dbError;
  }
}

export async function getTecnicos() {
  const data = await getTecnicosAction();
  return data.tecnicos || [];
}

export async function createTecnico(payload) {
  const data = await createTecnicoAction(payload);
  return data.tecnico;
}

export async function registerTecnico(payload) {
  const data = await registerTecnicoAction(payload);
  return data.tecnico;
}

export async function uploadTecnicoAvatarAction(tecnicoIdOrFormData, maybeFile) {
  const user = await getUser();
  if (!user) throw new Error('No autorizado');

  let id;
  let remove = false;
  let avatarFile = null;

  if (tecnicoIdOrFormData instanceof FormData) {
    id = tecnicoIdOrFormData.get('id');
    remove = tecnicoIdOrFormData.get('remove') === 'true';
    avatarFile = tecnicoIdOrFormData.get('avatar');
  } else {
    id = tecnicoIdOrFormData;
    if (maybeFile && typeof maybeFile === 'object' && 'remove' in maybeFile && maybeFile.remove) {
      remove = true;
    } else {
      avatarFile = maybeFile;
    }
  }

  if (!id && user.role === 'tecnico') {
    id = user.id;
  }
  if (!id) throw new Error('Falta id del técnico');

  const supabase = getSupabaseAdmin();

  if (user.role === 'tecnico') {
    if (String(user.id) !== String(id)) {
      throw new Error('No tienes acceso a este técnico');
    }
  } else {
    const ownerId = getOwnerId(user);
    if (!ownerId) throw new Error('No autorizado');

    const link = await getNutricionistaTecnicoLink(supabase, ownerId, id);
    if (!link) throw new Error('No tienes acceso a este técnico');
  }

  if (remove) {
    await removeTecnicoAvatar(supabase, id);
    revalidatePath('/dashboard/tecnicos');
    return { success: true, removed: true };
  }

  if (!avatarFile || !(avatarFile instanceof File)) {
    throw new Error('Falta archivo de avatar');
  }

  const buffer = Buffer.from(await avatarFile.arrayBuffer());
  const payload = {
    avatar: `\\x${buffer.toString('hex')}`,
    avatar_mime: avatarFile.type || 'image/webp',
    avatar_size: avatarFile.size,
  };

  await updateTecnicoAvatar(supabase, id, payload);
  revalidatePath('/dashboard/tecnicos');

  return {
    success: true,
    avatar_mime: payload.avatar_mime,
    avatar_size: payload.avatar_size,
  };
}

export {
  deleteTecnicoAction as deleteTecnico,
  assignTeamsAction as assignTeams,
  uploadTecnicoAvatarAction as uploadTecnicoAvatar,
};
