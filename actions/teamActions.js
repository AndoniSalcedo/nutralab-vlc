'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/prisma';
import { getOwnedTeam, getOwnerId } from '@/lib/auth/team-access';
import { readImageUpload, toByteaHex } from '@/lib/security/uploads';
import { assertPlainObject } from '@/lib/security/json';
import {
  insertTeam,
  deleteTeam as deleteTeamInRepo,
  updateTeam as updateTeamInRepo,
  getTeamsByOwner,
  getTeamByIdAndOwner,
  updateTeamConfig
} from '@/repositories/teamRepository';
import { getPlayersByTeam, insertPlayer, getOwnedPlayersByIds } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdOrdered, insertEvolutionsBulk } from '@/repositories/evolutionRepository';
import { getAnalyticsByPlayerId, insertAnalyticsBulk } from '@/repositories/analyticsRepository';
import { getHydrationRecordsByPlayerId, insertHydrationRecordsBulk } from '@/repositories/hydrationRepository';
import { getAiPlansByPlayerId, insertAiPlansBulk } from '@/repositories/aiPlanRepository';
import {
  getJugadorSuplementacion,
  getJugadorSuplementosExtra,
  upsertJugadorSuplementacion,
  upsertJugadorSuplementosExtraBulk
} from '@/repositories/supplementationRepository';

function clean(value) {
  return String(value || '').trim();
}

function cleanPlayerIds(value) {
  if (!Array.isArray(value)) return null;
  return Array.from(new Set(value.map((item) => clean(item)).filter(Boolean)));
}

function currentSeason() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${String(year + 1).slice(-2)}`;
}

const PLAYER_COPY_FIELDS = [
  'nombre',
  'apellidos',
  'posicion',
  'fecha_nacimiento',
  'num_comidas',
  'objetivo',
  'gustos_preferencias',
  'aversiones',
  'intolerancias',
  'contexto_clinico',
  'preentreno',
  'postentreno',
  'notas_hidratacion',
  'notas_suplementacion',
  'notas_protocolos',
];

async function copyPlayerAllHistory(db, sourcePlayerId, newPlayerId) {
  try {
    const evolutions = await getEvolutionsByPlayerIdOrdered(db, sourcePlayerId);
    const evolutionPayloads = (evolutions || []).map((evo) => {
      const cleanEvo = { ...evo, jugador_id: newPlayerId };
      delete cleanEvo.id;
      delete cleanEvo.created_at;
      delete cleanEvo.updated_at;
      return cleanEvo;
    });
    if (evolutionPayloads.length) {
      await insertEvolutionsBulk(db, evolutionPayloads);
    }
  } catch (e) {
    console.error(`Error copying evolutions for player ${sourcePlayerId}:`, e);
  }

  try {
    const analitics = await getAnalyticsByPlayerId(db, sourcePlayerId);
    const analiticalPayloads = (analitics || []).map((item) => {
      const cleanItem = { ...item, jugador_id: newPlayerId };
      delete cleanItem.id;
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      return cleanItem;
    });
    if (analiticalPayloads.length) {
      await insertAnalyticsBulk(db, analiticalPayloads);
    }
  } catch (e) {
    console.error(`Error copying analytics for player ${sourcePlayerId}:`, e);
  }

  try {
    const hydrations = await getHydrationRecordsByPlayerId(db, sourcePlayerId);
    const hydrationPayloads = (hydrations || []).map((item) => {
      const cleanItem = { ...item, jugador_id: newPlayerId };
      delete cleanItem.id;
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      return cleanItem;
    });
    if (hydrationPayloads.length) {
      await insertHydrationRecordsBulk(db, hydrationPayloads);
    }
  } catch (e) {
    console.error(`Error copying hydration for player ${sourcePlayerId}:`, e);
  }

  try {
    const aiPlans = await getAiPlansByPlayerId(db, sourcePlayerId);
    const aiPlanPayloads = (aiPlans || []).map((item) => {
      const cleanItem = { ...item, jugador_id: newPlayerId };
      delete cleanItem.id;
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      return cleanItem;
    });
    if (aiPlanPayloads.length) {
      await insertAiPlansBulk(db, aiPlanPayloads);
    }
  } catch (e) {
    console.error(`Error copying AI plans for player ${sourcePlayerId}:`, e);
  }

  try {
    const suplementacion = await getJugadorSuplementacion(db, sourcePlayerId);
    if (suplementacion) {
      const cleanSupl = { ...suplementacion, jugador_id: newPlayerId };
      delete cleanSupl.id;
      delete cleanSupl.created_at;
      delete cleanSupl.updated_at;
      await upsertJugadorSuplementacion(db, cleanSupl);
    }
  } catch (e) {
    console.error(`Error copying supplementation for player ${sourcePlayerId}:`, e);
  }

  try {
    const extras = await getJugadorSuplementosExtra(db, sourcePlayerId);
    const extraPayloads = (extras || []).map((item) => {
      const cleanItem = { ...item, jugador_id: newPlayerId };
      delete cleanItem.id;
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      return cleanItem;
    });
    if (extraPayloads.length) {
      await upsertJugadorSuplementosExtraBulk(db, extraPayloads);
    }
  } catch (e) {
    console.error(`Error copying extra supplementation for player ${sourcePlayerId}:`, e);
  }
}

export async function getTeams() {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const db = getDb();
  const teams = await getTeamsByOwner(db, ownerId);
  return teams || [];
}

export async function createTeam(payload) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const db = getDb();
  const action = clean(payload?.action || 'create');

  if (action === 'create') {
    const nombre = clean(payload.nombre);
    const temporada = clean(payload.temporada) || currentSeason();
    const descripcion = clean(payload.descripcion) || null;
    const selectedPlayerIds = cleanPlayerIds(payload.player_ids);

    if (!nombre) {
      throw new Error('El nombre del equipo es obligatorio');
    }

    const newTeam = await insertTeam(db, { owner_id: ownerId, nombre, temporada, descripcion });

    if (selectedPlayerIds && selectedPlayerIds.length > 0) {
      const players = await getOwnedPlayersByIds(db, ownerId, selectedPlayerIds);
      const foundIds = new Set(players.map((player) => String(player.id)));
      const missingIds = selectedPlayerIds.filter((playerId) => !foundIds.has(playerId));
      if (missingIds.length) throw new Error('Algún jugador seleccionado no pertenece a tus equipos');

      let copiedPlayers = 0;
      const copiedPlayerSummaries = [];
      for (const player of players) {
        const sourcePlayerId = player.id;
        const copyPayload = Object.fromEntries(
          PLAYER_COPY_FIELDS.map((field) => [field, player[field] ?? null])
        );

        const newPlayer = await insertPlayer(db, { ...copyPayload, equipo_id: newTeam.id });
        copiedPlayers++;
        copiedPlayerSummaries.push({
          id: newPlayer.id,
          nombre: newPlayer.nombre,
          apellidos: newPlayer.apellidos,
          posicion: newPlayer.posicion
        });

        await copyPlayerAllHistory(db, sourcePlayerId, newPlayer.id);
      }
      revalidatePath('/dashboard');
      return { equipo: newTeam, copiedPlayers, players: copiedPlayerSummaries };
    }

    revalidatePath('/dashboard');
    return { equipo: newTeam };
  }

  if (action === 'copy_season') {
    const teamId = clean(payload.team_id);
    const nombre = clean(payload.nombre);
    const temporada = clean(payload.temporada);
    const selectedPlayerIds = cleanPlayerIds(payload.player_ids);
    const hasDescripcion = Object.prototype.hasOwnProperty.call(payload, 'descripcion');
    const descripcion = hasDescripcion ? clean(payload.descripcion) || null : undefined;
    let sourceTeam = null;
    if (teamId) {
      sourceTeam = await getOwnedTeam(db, user, teamId);
      if (!sourceTeam) throw new Error('No tienes acceso a este equipo');
    }

    if (!temporada) {
      throw new Error('La temporada destino es obligatoria');
    }

    let players = [];
    if (selectedPlayerIds && selectedPlayerIds.length !== 0) {
      players = await getOwnedPlayersByIds(db, ownerId, selectedPlayerIds);
      const foundIds = new Set(players.map((player) => String(player.id)));
      const missingIds = selectedPlayerIds.filter((playerId) => !foundIds.has(playerId));
      if (missingIds.length) throw new Error('Algún jugador seleccionado no pertenece a tus equipos');
    } else if (sourceTeam) {
      players = await getPlayersByTeam(db, sourceTeam.id);
    }

    const newTeam = await insertTeam(db, {
      owner_id: ownerId,
      nombre: nombre || (sourceTeam ? sourceTeam.nombre : 'Nuevo equipo'),
      temporada,
      descripcion: hasDescripcion ? descripcion : (sourceTeam ? sourceTeam.descripcion : null),
      configuracion_nutricional: sourceTeam?.configuracion_nutricional || null,
    });

    let copiedPlayers = 0;
    const copiedPlayerSummaries = [];
    for (const player of players || []) {
      const sourcePlayerId = player.id;
      const copyPayload = Object.fromEntries(
        PLAYER_COPY_FIELDS.map((field) => [field, player[field] ?? null])
      );

      const newPlayer = await insertPlayer(db, { ...copyPayload, equipo_id: newTeam.id });
      copiedPlayers++;
      copiedPlayerSummaries.push({
        id: newPlayer.id,
        nombre: newPlayer.nombre,
        apellidos: newPlayer.apellidos,
        posicion: newPlayer.posicion
      });

      await copyPlayerAllHistory(db, sourcePlayerId, newPlayer.id);
    }

    revalidatePath('/dashboard');
    return { equipo: newTeam, copiedPlayers, players: copiedPlayerSummaries };
  }

  throw new Error('Acción no soportada');
}

export async function updateTeam(teamId, payload) {
  const cleanTeamId = clean(teamId);
  const nombre = clean(payload?.nombre);
  const temporada = clean(payload?.temporada);
  const descripcion = clean(payload?.descripcion);

  if (!cleanTeamId || !nombre) {
    throw new Error('Faltan datos obligatorios');
  }

  const db = getDb();
  const user = await getUser();
  const team = await getOwnedTeam(db, user, cleanTeamId);
  if (!team) throw new Error('No tienes acceso a este equipo');

  const data = await updateTeamInRepo(db, team.id, { nombre, temporada, descripcion });
  revalidatePath(`/dashboard/equipo/${cleanTeamId}`);
  revalidatePath('/dashboard');
  return { equipo: data };
}

export async function deleteTeam(teamId) {
  const db = getDb();
  const user = await getUser();
  const team = await getOwnedTeam(db, user, teamId);
  if (!team) throw new Error('No tienes acceso a este equipo');

  await deleteTeamInRepo(db, team.id);
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function saveTeamConfig(teamId, configuracion_nutricional) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!user || user.role !== 'admin' || !ownerId) {
    throw new Error('No autorizado');
  }

  const db = getDb();
  const team = await getTeamByIdAndOwner(db, teamId, ownerId);
  if (!team) {
    throw new Error('Equipo no encontrado o sin permisos');
  }

  assertPlainObject(configuracion_nutricional, { label: 'Configuración nutricional' });
  await updateTeamConfig(db, teamId, configuracion_nutricional);
  revalidatePath(`/dashboard/equipo/${teamId}/configuracion`);
  return { success: true };
}

export async function uploadTeamPhoto(teamIdOrFormData, maybeFile) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  let id;
  let fotoFile;
  if (teamIdOrFormData instanceof FormData) {
    id = teamIdOrFormData.get('id');
    fotoFile = teamIdOrFormData.get('foto') || teamIdOrFormData.get('avatar');
  } else {
    id = teamIdOrFormData;
    fotoFile = maybeFile;
  }

  if (!id) throw new Error('Falta id del equipo');
  if (!fotoFile || !(fotoFile instanceof File)) {
    throw new Error('Falta archivo de foto');
  }

  const db = getDb();
  const ownedTeam = await getOwnedTeam(db, user, id);
  if (!ownedTeam) throw new Error('No tienes acceso a este equipo');

  const image = await readImageUpload(fotoFile);
  const payload = {
    foto: toByteaHex(image.buffer),
    foto_mime: image.mime,
    foto_size: image.size,
    updated_at: new Date().toISOString(),
  };

  await updateTeamInRepo(db, id, payload);
  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/equipo/${id}`);
  return {
    success: true,
    foto_mime: payload.foto_mime,
    foto_size: payload.foto_size,
  };
}

export async function removeTeamPhoto(teamIdOrFormData) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  let id;
  if (teamIdOrFormData instanceof FormData) {
    id = teamIdOrFormData.get('id');
  } else {
    id = teamIdOrFormData;
  }

  if (!id) throw new Error('Falta id del equipo');

  const db = getDb();
  const ownedTeam = await getOwnedTeam(db, user, id);
  if (!ownedTeam) throw new Error('No tienes acceso a este equipo');

  await updateTeamInRepo(db, id, {
    foto: null,
    foto_mime: null,
    foto_size: null,
    updated_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/equipo/${id}`);
  return { success: true, removed: true };
}
