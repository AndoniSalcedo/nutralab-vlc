'use server';

import { validateAstValue, mealPatternsSchema, preMatchConfigSchema } from '@/validations/mealAstSchema';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/prisma';
import { getOwnedPlayer, getOwnedTeam } from '@/lib/auth/team-access';
import { getOwnerId } from '@/lib/auth/owner';
import { findAuthUserByEmail, getAuthUserById, verifyAuthPassword, createAuthUser, updateAuthUser, deleteAuthUser } from '@/lib/auth/auth-users';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { readImageUpload, toByteaHex, MAX_DOCUMENT_BYTES } from '@/lib/security/uploads';
import { DEFAULT_PLAYER_MEALS_STRING, normalizeObjective } from '@/config/nutrition-days';
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
import { personalizePautas, describeAjustes } from '@/lib/nutrition/pauta-personalization';

// Campos del jugador que cambian lo que puede comer: al modificarlos se revisan sus pautas guardadas.
const RESTRICTION_FIELDS = ['intolerancias', 'aversiones'];

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

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const ownedPlayer = await getOwnedPlayer(db, user, id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  let parsedValue = value;
  if (field === 'porcentaje_grasa_objetivo') {
    const num = Number(value);
    parsedValue = Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : 10;
  } else if (field === 'objetivo') {
    parsedValue = normalizeObjective(value);
  } else if (field === 'protocolos_custom') {
    parsedValue = typeof value === 'object' && value !== null ? value : {};
  } else if (field === 'recomendaciones_defecto' || field === 'config_prepartido') {
    // Las pautas son AST nutricionales: se validan contra el contrato único antes de guardar.
    // El error se devuelve (no se lanza) para que el mensaje llegue al cliente en producción.
    const validation = field === 'recomendaciones_defecto'
      ? validateAstValue(mealPatternsSchema, value || {}, { label: 'Pautas por defecto' })
      : validateAstValue(preMatchConfigSchema, value || {}, { label: 'Protocolo pre-partido' });
    if (!validation.success) return { ok: false, error: validation.error };
    parsedValue = validation.data;
  }

  // Una pauta nunca guarda un alimento que el jugador no puede tomar, y al cambiar sus restricciones se revisan
  // las pautas ya guardadas. Si algo se ajusta, se devuelve para que el usuario lo vea.
  let ajustes = [];
  const update = { [field]: parsedValue };
  try {
    const current = await getPlayerById(db, id);
    const merged = { ...current, [field]: parsedValue };
    if (field === 'recomendaciones_defecto' || field === 'config_prepartido') {
      const result = personalizePautas(merged, { [field]: parsedValue });
      update[field] = result[field];
      ajustes = result.ajustes;
    } else if (RESTRICTION_FIELDS.includes(field)) {
      const result = personalizePautas(merged, {
        recomendaciones_defecto: current?.recomendaciones_defecto,
        config_prepartido: current?.config_prepartido,
      });
      if (result.ajustes.length > 0) {
        update.recomendaciones_defecto = result.recomendaciones_defecto;
        update.config_prepartido = result.config_prepartido;
        ajustes = result.ajustes;
      }
    }
  } catch (err) {
    console.warn('[updatePlayerField] No se pudieron personalizar las pautas:', err.message);
  }

  await updatePlayer(db, id, update);
  revalidatePath(`/dashboard/jugador/${id}`);
  return { ok: true, ...(ajustes.length > 0 ? { ajustes: describeAjustes(ajustes) } : {}) };
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

  const db = getDb();
  const ownedPlayer = await getOwnedPlayer(db, user, jugadorId);
  if (!ownedPlayer) {
    throw new Error('No tienes acceso a este jugador');
  }

  const jugador = await getPlayerById(db, jugadorId);
  if (!jugador) {
    throw new Error('Jugador no encontrado');
  }

  const metadata = playerMetadata(jugador);

  if (!jugador.auth_user_id) {
    // Si el email ya pertenece a otra cuenta NO se reutiliza ni se le cambia la
    // contraseña: hacerlo permitiría a un admin tomar cuentas de otros tenants.
    const existingUser = await findAuthUserByEmail(db, cleanEmail);
    if (existingUser) {
      throw new Error('Ese correo ya está en uso por otra cuenta. Usa un correo distinto.');
    }
  }

  // Cuenta de acceso y ficha del jugador en una sola transacción: o se guardan las dos o ninguna.
  const updated = await db.$transaction(async (tx) => {
    let authUserId = jugador.auth_user_id;
    if (authUserId) {
      await updateAuthUser(authUserId, { email: cleanEmail, password: cleanPassword, userMetadata: metadata }, tx);
    } else {
      const created = await createAuthUser({ email: cleanEmail, password: cleanPassword, userMetadata: metadata }, tx);
      authUserId = created.id;
    }

    return updatePlayer(tx, jugador.id, {
      auth_user_id: authUserId,
      auth_email: cleanEmail,
      credentials_created_at: new Date().toISOString(),
    });
  });

  revalidatePath(`/dashboard/jugador/${jugadorId}`);
  return { credentials: updated };
}

export async function updatePlayerPassword(password, currentPassword) {
  const user = await getUser();
  if (user?.role !== 'jugador' || !user?.supabase_uid) {
    throw new Error('No autorizado');
  }

  const cleanPassword = String(password || '');
  if (cleanPassword.length < 8 || cleanPassword.length > 128) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }
  if (!currentPassword) {
    throw new Error('Introduce tu contraseña actual');
  }

  await enforceRateLimit('change-password', String(user.id), { limit: 5, windowMs: 15 * 60 * 1000 });

  const authUser = await getAuthUserById(user.supabase_uid);
  if (!authUser?.email) {
    throw new Error('No se pudo verificar tu cuenta');
  }

  // Verifica la contraseña actual contra auth.users (sin crear sesión).
  const verified = await verifyAuthPassword(authUser.email, String(currentPassword));
  if (!verified || verified.id !== authUser.id) {
    throw new Error('La contraseña actual no es correcta');
  }

  await updateAuthUser(user.supabase_uid, { password: cleanPassword });

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

  const db = getDb();
  const targetTeam = await getOwnedTeam(db, user, targetTeamId);
  if (!targetTeam) {
    throw new Error('No tienes acceso al equipo de destino');
  }

  const players = await getOwnedPlayersByIds(db, ownerId, playerIds);
  if (players.length !== playerIds.length) {
    throw new Error('No tienes acceso a todos los jugadores seleccionados o algunos no existen');
  }

  if (action === 'move') {
    const sourceTeamIds = new Set();
    for (const player of players) {
      if (player.equipo_id) sourceTeamIds.add(player.equipo_id);
      if (String(player.equipo_id) === String(targetTeamId)) continue;
      await updatePlayer(db, player.id, { equipo_id: targetTeamId });
    }
    sourceTeamIds.forEach((srcId) => {
      revalidatePath(`/dashboard/equipo/${srcId}`);
    });
    revalidatePath(`/dashboard/equipo/${targetTeamId}`);
    revalidatePath('/dashboard');
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
      await insertPlayersBulk(db, payloads);
    }
    revalidatePath(`/dashboard/equipo/${targetTeamId}`);
    revalidatePath('/dashboard');
    return { success: true, message: 'Jugadores copiados correctamente' };
  }
}

export async function savePlayer(form) {
  const id = String(form.get('id') || '');
  const teamId = String(form.get('team_id') || '');
  const db = getDb();
  const user = await getUser();

  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  let targetTeam = null;
  if (id) {
    const ownedPlayer = await getOwnedPlayer(db, user, id);
    if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');
    targetTeam = await getOwnedTeam(db, user, ownedPlayer.equipo_id);
    if (!targetTeam) throw new Error('No tienes acceso a este equipo');
  } else {
    targetTeam = await getOwnedTeam(db, user, teamId);
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
    objetivo: normalizeObjective(String(form.get('objetivo') || '')),
    porcentaje_grasa_objetivo: form.has('porcentaje_grasa_objetivo') && form.get('porcentaje_grasa_objetivo')
      ? Math.round((Number(form.get('porcentaje_grasa_objetivo')) || 10) * 100) / 100
      : 10,
  };

  if (form.has('config_prepartido')) {
    try {
      const parsedConfig = JSON.parse(String(form.get('config_prepartido')));
      const validation = validateAstValue(preMatchConfigSchema, parsedConfig || {}, { label: 'Protocolo pre-partido' });
      payload.config_prepartido = validation.success ? validation.data : {};
    } catch {
      payload.config_prepartido = {};
    }
  }

  // Las pautas guardadas deben valer al jugador con las restricciones que acaba de guardar el formulario.
  let ajustes = [];
  try {
    const current = id ? await getPlayerById(db, id) : null;
    const merged = { ...(current || {}), ...payload };
    const result = personalizePautas(merged, {
      recomendaciones_defecto: current?.recomendaciones_defecto,
      config_prepartido: payload.config_prepartido ?? current?.config_prepartido,
    });
    ajustes = result.ajustes;
    if (ajustes.length > 0) {
      if (current?.recomendaciones_defecto) payload.recomendaciones_defecto = result.recomendaciones_defecto;
      if (result.config_prepartido) payload.config_prepartido = result.config_prepartido;
    }
  } catch (err) {
    console.warn('[savePlayer] No se pudieron personalizar las pautas:', err.message);
  }

  if (form.has('avatar')) {
    const avatarFile = form.get('avatar');
    if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
      const image = await readImageUpload(avatarFile);
      payload.avatar = toByteaHex(image.buffer);
      payload.avatar_mime = image.mime;
      payload.avatar_size = image.size;
    }
  }

  if (form.get('remove_avatar') === 'true') {
    payload.avatar = null;
    payload.avatar_mime = null;
    payload.avatar_size = null;
  }

  if (id) {
    await updatePlayer(db, id, payload);
    revalidatePath(`/dashboard/jugador/${id}`);
  } else {
    const newPlayer = await insertPlayer(db, payload);

    const initialWeight = form.get('initial_weight') ? toNumber(form.get('initial_weight')) : null;
    const initialHeight = form.get('initial_height') ? toNumber(form.get('initial_height')) : null;

    if (newPlayer?.id && (initialWeight !== null || initialHeight !== null)) {
      await insertEvolution(db, {
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
        nombre: user?.name || 'Técnico / Nutricionista Valencia FC',
        id: user?.id,
      };
      const cliente = {
        tipo: 'cliente',
        nombre: `${payload.nombre} ${payload.apellidos || ''}`.trim(),
        id: newPlayer.id,
      };

      try {
        await trackUsageEvent({
          app: 'nutralab-vlc',
          tenantId: targetTeam.id,
          tenantName: targetTeam.nombre || 'Valencia C.F.',
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
      } catch (billingErr) {
        console.warn('[playerActions] Error al reportar alta a billing:', billingErr.message);
      }
    }
  }

  revalidatePath(`/dashboard/equipo/${targetTeam.id}`);
  return { success: true, ...(ajustes.length > 0 ? { ajustes: describeAjustes(ajustes) } : {}) };
}

export async function deletePlayer(id) {
  if (!id) throw new Error('Falta id del jugador');

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const owned = await getOwnedPlayer(db, user, id);
  if (!owned) throw new Error('No tienes acceso a este jugador');

  const jugador = await getPlayerAuthUserId(db, id);

  await deletePlayerInRepo(db, id);
  if (jugador?.auth_user_id) {
    try {
      await deleteAuthUser(jugador.auth_user_id);
    } catch (authDeleteError) {
      // El jugador ya está borrado; la cuenta de acceso queda huérfana pero sin perfil no puede entrar.
      console.error('No se pudo borrar la cuenta de acceso del jugador:', authDeleteError.message);
    }
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

async function loadTeamPlayers(db, teamId) {
  return getPlayersByTeamSelect(db, teamId, 'id,nombre,apellidos,fecha_nacimiento');
}

async function createPlayer(db, teamId, group) {
  return insertPlayer(db, {
    equipo_id: teamId,
    nombre: cleanText(group.nombre || group.nombreCompleto),
    apellidos: cleanText(group.apellidos),
    fecha_nacimiento: group.fechaNacimiento || null,
    num_comidas: DEFAULT_PLAYER_MEALS_STRING,
    preentreno: false,
    postentreno: false,
  });
}

async function updatePlayerIfNeeded(db, player, group) {
  const payload = playerUpdatePayload(group, player);
  if (!Object.keys(payload).length) return player;
  return updatePlayer(db, player.id, payload);
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

async function saveMeasurement(db, jugadorId, measurement) {
  const existing = await getEvolutionByPlayerAndDate(db, jugadorId, measurement.fecha);
  const payload = measurementPayload(jugadorId, measurement, existing);

  if (existing) {
    await updateEvolution(db, existing.id, payload);
    return 'actualizada';
  }

  await insertEvolution(db, payload);
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

async function importGroups({ db, team, plan, players, decisions, user }) {
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
        player = await createPlayer(db, team.id, group);
        playersById.set(String(player.id), player);

        if (player?.id) {
          const emisor = {
            tipo: 'nutricionista',
            nombre: user?.name || 'Técnico / Nutricionista Valencia FC',
            id: user?.id,
          };
          const cliente = {
            tipo: 'cliente',
            nombre: `${player.nombre || ''} ${player.apellidos || ''}`.trim(),
            id: player.id,
          };

          try {
            await trackUsageEvent({
              app: 'nutralab-vlc',
              tenantId: team.id,
              tenantName: team.nombre || 'Valencia C.F.',
              userId: user?.id,
              eventType: 'ALTA_JUGADOR',
              description: `Alta inicial de jugador (Excel): ${player.nombre || ''} ${player.apellidos || ''}`.trim(),
              metadata: {
                jugadorId: player.id,
                equipoId: team.id,
                emisor,
                cliente,
                origen: 'excel',
              },
            });
          } catch (billingErr) {
            console.warn('[playerActions] Error al reportar alta Excel a billing:', billingErr.message);
          }
        }
      } else {
        player = playersById.get(String(decision.jugadorId));
        if (!player) {
          throw new Error('El jugador seleccionado no pertenece a este equipo');
        }
        player = await updatePlayerIfNeeded(db, player, group);
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
        const status = await saveMeasurement(db, player.id, measurementToSave);
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
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('El archivo Excel es demasiado grande');
  }

  const db = getDb();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const team = await getOwnedTeam(db, user, teamId);
  if (!team) throw new Error('Debes importar dentro de un equipo propio');

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parsePlayerExcel(buffer);
  const players = await loadTeamPlayers(db, team.id);
  const plan = buildImportPlan(parsed, players);

  if (mode === 'preview') {
    return toPreviewResponse(parsed, plan);
  }

  if (mode !== 'importar') {
    throw new Error('Modo de importación no soportado');
  }

  const decisions = parseJson(formData.get('decisiones'), {});
  const resultados = await importGroups({ db, team, plan, players, decisions, user });
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

  const db = getDb();

  if (user.role === 'jugador') {
    if (String(user.id) !== String(id)) {
      throw new Error('No tienes acceso a este jugador');
    }
  } else {
    const owned = await getOwnedPlayer(db, user, id);
    if (!owned) throw new Error('No tienes acceso a este jugador');
  }

  if (remove) {
    await updatePlayer(db, id, {
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

  const image = await readImageUpload(avatarFile);
  const payload = {
    avatar: toByteaHex(image.buffer),
    avatar_mime: image.mime,
    avatar_size: image.size,
    updated_at: new Date().toISOString(),
  };

  await updatePlayer(db, id, payload);
  revalidatePath(`/dashboard/jugador/${id}`);

  return {
    success: true,
    avatar_mime: payload.avatar_mime,
    avatar_size: payload.avatar_size,
  };
}
