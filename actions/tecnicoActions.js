'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getOwnerId } from '@/lib/auth/team-access';
import { findAuthUserByEmail } from '@/lib/auth/auth-users';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { readImageUpload, toByteaHex } from '@/lib/security/uploads';
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

export async function getTecnicos() {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const supabase = getSupabaseAdmin();
  const result = await getTecnicosByOwner(supabase, ownerId);
  return result || [];
}

export async function createTecnico(payload) {
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
  return tecnico;
}

export async function deleteTecnico(id) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');
  if (!id) throw new Error('Falta id');

  const supabase = getSupabaseAdmin();
  await unlinkTecnicoFromNutricionista(supabase, ownerId, id);
  revalidatePath('/dashboard/tecnicos');
  return { ok: true };
}

export async function assignTeams(tecnicoId, teamIds) {
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

export async function registerTecnico(payload) {
  const nombre = String(payload?.nombre || '').trim();
  const apellidos = String(payload?.apellidos || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '').trim();

  if (!nombre || !email || !password) {
    throw new Error('Faltan campos obligatorios');
  }
  if (!email.includes('@') || email.length > 254 || nombre.length > 100 || apellidos.length > 150) {
    throw new Error('Datos no válidos');
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  // Endpoint público: limitar altas por IP y por email.
  await enforceRateLimit('register-tecnico', email, { limit: 3, windowMs: 60 * 60 * 1000 });
  await enforceRateLimit('register-tecnico-ip', '', { limit: 10, windowMs: 60 * 60 * 1000 });

  const supabase = getSupabaseAdmin();
  const existingTecnico = await getTecnicoByEmail(supabase, email);
  const existingUser = existingTecnico ? null : await findAuthUserByEmail(supabase, email);

  // Nunca se toca una cuenta existente: antes se le reseteaba la contraseña,
  // lo que permitía a un anónimo apoderarse de cualquier usuario por su email.
  if (existingTecnico || existingUser) {
    throw new Error('No se puede registrar este email. Si ya tienes cuenta, inicia sesión o contacta con tu nutricionista.');
  }

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
  const authUserId = authData.user.id;

  try {
    return await createTecnicoRecord(supabase, {
      auth_user_id: authUserId,
      nombre,
      apellidos,
      email,
      owner_id: null,
    });
  } catch (dbError) {
    await supabase.auth.admin.deleteUser(authUserId);
    throw dbError;
  }
}

export async function uploadTecnicoAvatar(tecnicoIdOrFormData, maybeFile) {
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

  const image = await readImageUpload(avatarFile);
  const payload = {
    avatar: toByteaHex(image.buffer),
    avatar_mime: image.mime,
    avatar_size: image.size,
  };

  await updateTecnicoAvatar(supabase, id, payload);
  revalidatePath('/dashboard/tecnicos');

  return {
    success: true,
    avatar_mime: payload.avatar_mime,
    avatar_size: payload.avatar_size,
  };
}
