'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/prisma';
import { getOwnerId } from '@/lib/auth/team-access';
import { findAuthUserByEmail, createAuthUser } from '@/lib/auth/auth-users';
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

  const db = getDb();
  const result = await getTecnicosByOwner(db, ownerId);
  return result || [];
}

export async function createTecnico(payload) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const email = String(payload?.email || '').trim().toLowerCase();
  if (!email) throw new Error('Falta el email del técnico');

  const db = getDb();
  const tecnico = await getTecnicoByEmail(db, email);
  if (!tecnico) {
    throw new Error('No se encontró ningún técnico registrado con este correo. Por favor, indícale al técnico que se registre primero en la pantalla de acceso.');
  }

  await linkTecnicoToNutricionista(db, ownerId, tecnico.id);
  revalidatePath('/dashboard/tecnicos');
  return tecnico;
}

export async function deleteTecnico(id) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');
  if (!id) throw new Error('Falta id');

  const db = getDb();
  await unlinkTecnicoFromNutricionista(db, ownerId, id);
  revalidatePath('/dashboard/tecnicos');
  return { ok: true };
}

export async function assignTeams(tecnicoId, teamIds) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');
  if (!tecnicoId) throw new Error('Falta tecnico_id');

  const teams = Array.isArray(teamIds) ? teamIds : [];
  const db = getDb();
  const link = await getNutricionistaTecnicoLink(db, ownerId, tecnicoId);
  if (!link) throw new Error('No tienes acceso a este técnico');

  await assignTeamsToTecnico(db, ownerId, tecnicoId, teams);
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

  const db = getDb();
  const existingTecnico = await getTecnicoByEmail(db, email);
  const existingUser = existingTecnico ? null : await findAuthUserByEmail(db, email);

  // Nunca se toca una cuenta existente: antes se le reseteaba la contraseña,
  // lo que permitía a un anónimo apoderarse de cualquier usuario por su email.
  if (existingTecnico || existingUser) {
    throw new Error('No se puede registrar este email. Si ya tienes cuenta, inicia sesión o contacta con tu nutricionista.');
  }

  // Cuenta de acceso y ficha del técnico en una sola transacción: o se crean las dos o ninguna.
  return db.$transaction(async (tx) => {
    const authUser = await createAuthUser({
      email,
      password,
      userMetadata: {
        role: 'tecnico',
        name: `${nombre} ${apellidos}`.trim(),
      },
    }, tx);

    return createTecnicoRecord(tx, {
      auth_user_id: authUser.id,
      nombre,
      apellidos,
      email,
      owner_id: null,
    });
  });
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

  const db = getDb();

  if (user.role === 'tecnico') {
    if (String(user.id) !== String(id)) {
      throw new Error('No tienes acceso a este técnico');
    }
  } else {
    const ownerId = getOwnerId(user);
    if (!ownerId) throw new Error('No autorizado');

    const link = await getNutricionistaTecnicoLink(db, ownerId, id);
    if (!link) throw new Error('No tienes acceso a este técnico');
  }

  if (remove) {
    await removeTecnicoAvatar(db, id);
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

  await updateTecnicoAvatar(db, id, payload);
  revalidatePath('/dashboard/tecnicos');

  return {
    success: true,
    avatar_mime: payload.avatar_mime,
    avatar_size: payload.avatar_size,
  };
}
