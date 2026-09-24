'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getOwnedPlayer, getOwnedTeam } from '@/lib/auth/team-access';
import { DEFAULT_PLAYER_MEALS_STRING } from '@/config/nutrition-days';
import { toPositiveNumber as toNumber, cleanText } from '@/lib/utils';
import {
  TYPED_MEASUREMENT_FIELDS,
  buildImportPlan,
  parsePlayerExcel,
  toPreviewResponse,
} from '@/lib/io/player-excel-import';
import {
  getPlayerById,
  getPlayerAuthUserId,
  deletePlayer as deletePlayerInRepo,
  updatePlayer,
  insertPlayer,
  getOwnedPlayersByIds,
  insertPlayersBulk,
  getPlayersByTeamSelect,
} from '@/repositories/playerRepository';
import {
  insertEvolution,
  getEvolutionByPlayerAndDate,
  updateEvolution,
} from '@/repositories/evolutionRepository';
import { trackUsageEvent } from '@/lib/billing/client';

function getOwnerId(user) {
  if (!user || user.role === 'jugador' || user.role === 'tecnico') return null;
  return String(user.external_admin_id || user.id || user.email || user.username || '').trim() || null;
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function playerMetadata(jugador) {
  return {
    role: 'jugador',
    jugador_id: jugador.id,
    name: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
  };
}

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

const CAMPOS_PERMITIDOS = [
  'notas_hidratacion', 'notas_suplementacion', 'notas_protocolos',
  'gustos_preferencias', 'aversiones', 'intolerancias',
  'contexto_clinico', 'objetivo', 'posicion', 'num_comidas', 'preentreno', 'postentreno', 'recomendaciones_defecto', 'config_prepartido',
  'porcentaje_grasa_objetivo', 'protocolos_custom',
];

export async function updatePlayerField(id, field, value) {
  if (!id || !field || !CAMPOS_PERMITIDOS.includes(field)) {
    throw new Error('Campo no permitido: ' + field);
  }

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const ownedPlayer = await getOwnedPlayer(supabase, user, id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  let parsedValue = value;
  if (field === 'porcentaje_grasa_objetivo') {
    const num = Number(value);
    parsedValue = Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : 10;
  } else if (field === 'protocolos_custom') {
    parsedValue = typeof value === 'object' && value !== null ? value : {};
  }

  await updatePlayer(supabase, id, { [field]: parsedValue });
  revalidatePath(`/dashboard/jugador/${id}`);
  return { ok: true };
}

export async function updatePlayerCredentials(jugadorIdOrPayload, emailParam, passwordParam) {
  let jugadorId, email, password;
  if (typeof jugadorIdOrPayload === 'object' && jugadorIdOrPayload !== null) {
    jugadorId = jugadorIdOrPayload.jugadorId;
    email = jugadorIdOrPayload.email;
    password = jugadorIdOrPayload.password;
  } else {
    jugadorId = jugadorIdOrPayload;
    email = emailParam;
    password = passwordParam;
  }

  const user = await getUser();
  if (user?.role !== 'admin') {
    throw new Error('No autorizado');
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!jugadorId) throw new Error('Falta jugador');
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Introduce un correo válido');
  }
  if (!isValidPassword(cleanPassword)) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const supabase = getSupabaseAdmin();
  const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
  if (!ownedPlayer) {
    throw new Error('No tienes acceso a este jugador');
  }

  const jugador = await getPlayerById(supabase, jugadorId);
  if (!jugador) {
    throw new Error('Jugador no encontrado');
  }

  let authUserId = jugador.auth_user_id;
  const metadata = playerMetadata(jugador);

  if (authUserId) {
    const { error } = await supabase.auth.admin.updateUserById(authUserId, {
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
  } else {
    const existingUser = await findAuthUserByEmail(supabase, cleanEmail);

    if (existingUser) {
      authUserId = existingUser.id;
      const { error } = await supabase.auth.admin.updateUserById(authUserId, {
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          ...(existingUser.user_metadata || {}),
          ...metadata,
        },
      });
      if (error) throw error;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) throw error;
      authUserId = data.user.id;
    }
  }

  const updated = await updatePlayer(supabase, jugador.id, {
    auth_user_id: authUserId,
    auth_email: cleanEmail,
    credentials_created_at: new Date().toISOString(),
  });

  revalidatePath(`/dashboard/jugador/${jugadorId}`);
  return { credentials: updated };
}

export async function updatePlayerPassword(password) {
  const user = await getUser();
  if (user?.role !== 'jugador' || !user?.supabase_uid) {
    throw new Error('No autorizado');
  }

  const cleanPassword = String(password || '');
  if (cleanPassword.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.admin.updateUserById(user.supabase_uid, {
    password: cleanPassword,
  });
  if (error) throw error;

  return { ok: true };
}

export async function transferPlayers({ playerIds, targetTeamId, action }) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No se pudo determinar el propietario');

  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    throw new Error('Faltan jugadores por transferir');
  }
  if (!targetTeamId) {
    throw new Error('Falta el equipo de destino');
  }
  if (action !== 'move' && action !== 'copy') {
    throw new Error('Acción inválida');
  }

  const supabase = getSupabaseAdmin();
  const targetTeam = await getOwnedTeam(supabase, user, targetTeamId);
  if (!targetTeam) {
    throw new Error('No tienes acceso al equipo de destino');
  }

  const players = await getOwnedPlayersByIds(supabase, ownerId, playerIds);
  if (players.length !== playerIds.length) {
    throw new Error('No tienes acceso a todos los jugadores seleccionados o algunos no existen');
  }

  if (action === 'move') {
    for (const player of players) {
      if (player.equipo_id === targetTeamId) continue;
      await updatePlayer(supabase, player.id, { equipo_id: targetTeamId });
    }
    revalidatePath(`/dashboard/equipo/${targetTeamId}`);
    return { success: true, message: 'Jugadores movidos correctamente' };
  }

  if (action === 'copy') {
    const payloads = players.map(player => {
      // eslint-disable-next-line no-unused-vars
      const { id, equipo_id, auth_user_id, auth_email, credentials_created_at, created_at, equipos, ...playerData } = player;
      return {
        ...playerData,
        equipo_id: targetTeamId
      };
    });

    if (payloads.length > 0) {
      await insertPlayersBulk(supabase, payloads);
    }
    revalidatePath(`/dashboard/equipo/${targetTeamId}`);
    return { success: true, message: 'Jugadores copiados correctamente' };
  }
}

export async function savePlayer(form) {
  const id = String(form.get('id') || '');
  const teamId = String(form.get('team_id') || '');
  const supabase = getSupabaseAdmin();
  const user = await getUser();

  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  let targetTeam = null;
  if (id) {
    const ownedPlayer = await getOwnedPlayer(supabase, user, id);
    if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');
    targetTeam = await getOwnedTeam(supabase, user, ownedPlayer.equipo_id);
    if (!targetTeam) throw new Error('No tienes acceso a este equipo');
  } else {
    targetTeam = await getOwnedTeam(supabase, user, teamId);
    if (!targetTeam) throw new Error('Debes crear o seleccionar un equipo antes de añadir jugadores');
  }

  const payload = {
    equipo_id: targetTeam.id,
    nombre: String(form.get('nombre') || ''),
    apellidos: String(form.get('apellidos') || ''),
    posicion: String(form.get('posicion') || ''),
    fecha_nacimiento: form.get('fecha_nacimiento') ? String(form.get('fecha_nacimiento')) : null,
    num_comidas: form.get('num_comidas') ? String(form.get('num_comidas')) : DEFAULT_PLAYER_MEALS_STRING,
    preentreno: form.get('preentreno') === 'true',
    postentreno: form.get('postentreno') === 'true',
    gustos_preferencias: String(form.get('gustos_preferencias') || ''),
    contexto_clinico: String(form.get('contexto_clinico') || ''),
    aversiones: String(form.get('aversiones') || ''),
    intolerancias: String(form.get('intolerancias') || ''),
    objetivo: String(form.get('objetivo') || ''),
    porcentaje_grasa_objetivo: form.has('porcentaje_grasa_objetivo') && form.get('porcentaje_grasa_objetivo')
      ? Math.round((Number(form.get('porcentaje_grasa_objetivo')) || 10) * 100) / 100
      : 10,
  };

  if (form.has('config_prepartido')) {
    try {
      payload.config_prepartido = JSON.parse(String(form.get('config_prepartido')));
    } catch {
      payload.config_prepartido = {};
    }
  }

  if (form.has('avatar')) {
    const avatarFile = form.get('avatar');
    if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      payload.avatar = `\\x${buffer.toString('hex')}`;
      payload.avatar_mime = avatarFile.type || 'image/webp';
      payload.avatar_size = avatarFile.size;
    }
  }

  if (form.get('remove_avatar') === 'true') {
    payload.avatar = null;
    payload.avatar_mime = null;
    payload.avatar_size = null;
  }

  if (id) {
    await updatePlayer(supabase, id, payload);
    revalidatePath(`/dashboard/jugador/${id}`);
  } else {
    const newPlayer = await insertPlayer(supabase, payload);

    const initialWeight = form.get('initial_weight') ? toNumber(form.get('initial_weight')) : null;
    const initialHeight = form.get('initial_height') ? toNumber(form.get('initial_height')) : null;

    if (newPlayer?.id && (initialWeight !== null || initialHeight !== null)) {
      await insertEvolution(supabase, {
        jugador_id: newPlayer.id,
        fecha: new Date().toISOString().split('T')[0],
        peso_kg: initialWeight,
        altura_cm: initialHeight,
        notas: 'Medición inicial al crear jugador',
      });
    }

    if (newPlayer?.id) {
      const emisor = {
        tipo: 'nutricionista',
        nombre: user?.name || 'Técnico / Nutricionista VBC',
        id: user?.id,
      };
      const cliente = {
        tipo: 'cliente',
        nombre: `${payload.nombre} ${payload.apellidos || ''}`.trim(),
        id: newPlayer.id,
      };

      trackUsageEvent({
        app: 'nutralab-vlc',
        tenantId: targetTeam.id,
        tenantName: targetTeam.nombre || 'Valencia Basket Club',
        userId: user.id,
        eventType: 'ALTA_JUGADOR',
        description: `Alta inicial de jugador: ${payload.nombre} ${payload.apellidos}`.trim(),
        metadata: {
          jugadorId: newPlayer.id,
          equipoId: targetTeam.id,
          emisor,
          cliente,
        },
      });
    }
  }

  revalidatePath(`/dashboard/equipo/${targetTeam.id}`);
  return { success: true };
}

export async function deletePlayer(id) {
  if (!id) throw new Error('Falta id del jugador');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const owned = await getOwnedPlayer(supabase, user, id);
  if (!owned) throw new Error('No tienes acceso a este jugador');

  const jugador = await getPlayerAuthUserId(supabase, id);

  await deletePlayerInRepo(supabase, id);
  if (jugador?.auth_user_id) {
    await supabase.auth.admin.deleteUser(jugador.auth_user_id);
  }

  if (owned?.equipo_id) {
    revalidatePath(`/dashboard/equipo/${owned.equipo_id}`);
  }
  return { success: true };
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function playerUpdatePayload(group, existingPlayer) {
  const payload = {};
  if (group.fechaNacimiento && !existingPlayer?.fecha_nacimiento) {
    payload.fecha_nacimiento = group.fechaNacimiento;
  }
  return payload;
}

async function loadTeamPlayers(supabase, teamId) {
  return getPlayersByTeamSelect(supabase, teamId, 'id,nombre,apellidos,fecha_nacimiento');
}

async function createPlayer(supabase, teamId, group) {
  return insertPlayer(supabase, {
    equipo_id: teamId,
    nombre: cleanText(group.nombre || group.nombreCompleto),
    apellidos: cleanText(group.apellidos),
    fecha_nacimiento: group.fechaNacimiento || null,
    num_comidas: DEFAULT_PLAYER_MEALS_STRING,
    preentreno: false,
    postentreno: false,
  });
}

async function updatePlayerIfNeeded(supabase, player, group) {
  const payload = playerUpdatePayload(group, player);
  if (!Object.keys(payload).length) return player;
  return updatePlayer(supabase, player.id, payload);
}

function measurementPayload(jugadorId, measurement, existing = null) {
  const payload = {
    jugador_id: jugadorId,
    fecha: measurement.fecha,
    metricas_excel: {
      ...(existing?.metricas_excel && typeof existing.metricas_excel === 'object' ? existing.metricas_excel : {}),
      ...measurement.metricasExcel,
    },
    fuente_hoja: measurement.sourceSheet,
    fuente_fila: measurement.sourceRow,
    fecha_original_excel: measurement.originalDate || null,
    fecha_corregida: measurement.dateCorrected,
  };

  if (!existing?.notas) {
    payload.notas = `Importado desde Excel: ${measurement.sourceSheet}`;
  }

  for (const field of TYPED_MEASUREMENT_FIELDS) {
    const value = measurement.typed[field];
    if (value !== null && value !== undefined) {
      payload[field] = value;
    } else if (!existing) {
      payload[field] = null;
    }
  }

  return payload;
}

async function saveMeasurement(supabase, jugadorId, measurement) {
  const existing = await getEvolutionByPlayerAndDate(supabase, jugadorId, measurement.fecha);
  const payload = measurementPayload(jugadorId, measurement, existing);

  if (existing) {
    await updateEvolution(supabase, existing.id, payload);
    return 'actualizada';
  }

  await insertEvolution(supabase, payload);
  return 'creada';
}

function resolveDecision(group, decisions) {
  const decision = decisions?.[group.key] || {};
  let actionObj = { action: 'skip', reason: 'Pendiente de revisión' };

  if (decision.action === 'skip') actionObj = { action: 'skip' };
  else if (decision.action === 'create') actionObj = { action: 'create' };
  else if (decision.action === 'update' && decision.jugador_id) {
    actionObj = { action: 'update', jugadorId: decision.jugador_id };
  } else if (group.jugadorId) {
    actionObj = { action: 'update', jugadorId: group.jugadorId };
  } else if (group.accion === 'crear') {
    actionObj = { action: 'create' };
  }

  actionObj.fallbackDates = decision.fallbackDates || {};
  return actionObj;
}

async function importGroups({ supabase, team, plan, players, decisions }) {
  const playersById = new Map(players.map((player) => [String(player.id), player]));
  const results = [];

  for (const group of plan) {
    const decision = resolveDecision(group, decisions);
    const baseResult = {
      key: group.key,
      nombre: group.nombreCompleto,
      accion: decision.action,
      mediciones_creadas: 0,
      mediciones_actualizadas: 0,
      mediciones_omitidas: 0,
    };

    try {
      if (decision.action === 'skip') {
        results.push({
          ...baseResult,
          accion: 'omitido',
          error: decision.reason || null,
        });
        continue;
      }

      let player = null;
      let playerAction = decision.action === 'create' ? 'creado' : 'actualizado';

      if (decision.action === 'create') {
        player = await createPlayer(supabase, team.id, group);
        playersById.set(String(player.id), player);
      } else {
        player = playersById.get(String(decision.jugadorId));
        if (!player) {
          throw new Error('El jugador seleccionado no pertenece a este equipo');
        }
        player = await updatePlayerIfNeeded(supabase, player, group);
        playersById.set(String(player.id), player);
      }

      for (const measurement of group.mediciones) {
        const measurementId = `${measurement.sourceSheet}-${measurement.sourceRow}`;
        const finalDate = measurement.fecha || decision.fallbackDates[measurementId];
        if (!finalDate) {
          baseResult.mediciones_omitidas = (baseResult.mediciones_omitidas || 0) + 1;
          continue;
        }
        const measurementToSave = { ...measurement, fecha: finalDate };
        const status = await saveMeasurement(supabase, player.id, measurementToSave);
        if (status === 'creada') baseResult.mediciones_creadas += 1;
        else baseResult.mediciones_actualizadas += 1;
      }

      results.push({
        ...baseResult,
        accion: playerAction,
        jugador_id: player.id,
      });
    } catch (error) {
      results.push({
        ...baseResult,
        accion: 'error',
        error: error.message,
      });
    }
  }

  return results;
}

export async function importPlayerExcel(formDataOrPayload) {
  let formData = formDataOrPayload;
  if (!(formDataOrPayload instanceof FormData)) {
    formData = new FormData();
    if (formDataOrPayload.file) formData.append('file', formDataOrPayload.file);
    if (formDataOrPayload.modo) formData.append('modo', formDataOrPayload.modo);
    if (formDataOrPayload.teamId) formData.append('team_id', formDataOrPayload.teamId);
    if (formDataOrPayload.decisiones) formData.append('decisiones', JSON.stringify(formDataOrPayload.decisiones));
  }

  const file = formData.get('file');
  const mode = cleanText(formData.get('modo') || 'preview');
  const teamId = cleanText(formData.get('team_id'));

  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('Sin archivo Excel');
  }

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const team = await getOwnedTeam(supabase, user, teamId);
  if (!team) throw new Error('Debes importar dentro de un equipo propio');

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parsePlayerExcel(buffer);
  const players = await loadTeamPlayers(supabase, team.id);
  const plan = buildImportPlan(parsed, players);

  if (mode === 'preview') {
    return toPreviewResponse(parsed, plan);
  }

  if (mode !== 'importar') {
    throw new Error('Modo de importación no soportado');
  }

  const decisions = parseJson(formData.get('decisiones'), {});
  const resultados = await importGroups({ supabase, team, plan, players, decisions });
  const okResults = resultados.filter((result) => !result.error && result.accion !== 'omitido');

  revalidatePath(`/dashboard/equipo/${team.id}`);

  return {
    ok: true,
    resumen: {
      jugadores: resultados.length,
      jugadores_importados: okResults.length,
      mediciones_creadas: resultados.reduce((sum, result) => sum + Number(result.mediciones_creadas || 0), 0),
      mediciones_actualizadas: resultados.reduce((sum, result) => sum + Number(result.mediciones_actualizadas || 0), 0),
      errores: resultados.filter((result) => result.error).length,
    },
    resultados,
  };
}

export async function uploadPlayerAvatar(jugadorIdOrFormData, maybeFile) {
  const user = await getUser();
  if (!user) throw new Error('No autorizado');

  let id;
  let remove = false;
  let avatarFile = null;

  if (jugadorIdOrFormData instanceof FormData) {
    id = jugadorIdOrFormData.get('id');
    remove = jugadorIdOrFormData.get('remove') === 'true';
    avatarFile = jugadorIdOrFormData.get('avatar');
  } else {
    id = jugadorIdOrFormData;
    if (maybeFile && typeof maybeFile === 'object' && 'remove' in maybeFile && maybeFile.remove) {
      remove = true;
    } else {
      avatarFile = maybeFile;
    }
  }

  if (!id && user.role === 'jugador') {
    id = user.id;
  }
  if (!id) throw new Error('Falta id del jugador');

  const supabase = getSupabaseAdmin();

  if (user.role === 'jugador') {
    if (String(user.id) !== String(id)) {
      throw new Error('No tienes acceso a este jugador');
    }
  } else {
    const owned = await getOwnedPlayer(supabase, user, id);
    if (!owned) throw new Error('No tienes acceso a este jugador');
  }

  if (remove) {
    await updatePlayer(supabase, id, {
      avatar: null,
      avatar_mime: null,
      avatar_size: null,
      updated_at: new Date().toISOString(),
    });
    revalidatePath(`/dashboard/jugador/${id}`);
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
    updated_at: new Date().toISOString(),
  };

  await updatePlayer(supabase, id, payload);
  revalidatePath(`/dashboard/jugador/${id}`);

  return {
    success: true,
    avatar_mime: payload.avatar_mime,
    avatar_size: payload.avatar_size,
  };
}
