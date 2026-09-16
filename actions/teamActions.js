'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getOwnedTeam, getOwnerId } from '@/lib/auth/team-access';
import {
  insertTeam,
  deleteTeam,
  updateTeam,
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
  'alergias',
  'contexto_clinico',
  'preentreno',
  'postentreno',
  'notas_hidratacion',
  'notas_suplementacion',
  'notas_protocolos',
];

async function copyPlayerAllHistory(supabase, sourcePlayerId, newPlayerId) {
  try {
    const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, sourcePlayerId);
    const evolutionPayloads = (evolutions || []).map((evo) => {
      const cleanEvo = { ...evo, jugador_id: newPlayerId };
      delete cleanEvo.id;
      delete cleanEvo.created_at;
      delete cleanEvo.updated_at;
      return cleanEvo;
    });
    if (evolutionPayloads.length) {
      await insertEvolutionsBulk(supabase, evolutionPayloads);
    }
  } catch (e) {
    console.error(`Error copying evolutions for player ${sourcePlayerId}:`, e);
  }

  try {
    const analitics = await getAnalyticsByPlayerId(supabase, sourcePlayerId);
    const analiticalPayloads = (analitics || []).map((item) => {
      const cleanItem = { ...item, jugador_id: newPlayerId };
      delete cleanItem.id;
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      return cleanItem;
    });
    if (analiticalPayloads.length) {
      await insertAnalyticsBulk(supabase, analiticalPayloads);
    }
  } catch (e) {
    console.error(`Error copying analytics for player ${sourcePlayerId}:`, e);
  }

  try {
    const hydrations = await getHydrationRecordsByPlayerId(supabase, sourcePlayerId);
    const hydrationPayloads = (hydrations || []).map((item) => {
      const cleanItem = { ...item, jugador_id: newPlayerId };
      delete cleanItem.id;
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      return cleanItem;
    });
    if (hydrationPayloads.length) {
      await insertHydrationRecordsBulk(supabase, hydrationPayloads);
    }
  } catch (e) {
    console.error(`Error copying hydration for player ${sourcePlayerId}:`, e);
  }

  try {
    const aiPlans = await getAiPlansByPlayerId(supabase, sourcePlayerId);
    const aiPlanPayloads = (aiPlans || []).map((item) => {
      const cleanItem = { ...item, jugador_id: newPlayerId };
      delete cleanItem.id;
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      return cleanItem;
    });
    if (aiPlanPayloads.length) {
      await insertAiPlansBulk(supabase, aiPlanPayloads);
    }
  } catch (e) {
    console.error(`Error copying AI plans for player ${sourcePlayerId}:`, e);
  }

  try {
    const suplementacion = await getJugadorSuplementacion(supabase, sourcePlayerId);
    if (suplementacion) {
      const cleanSupl = { ...suplementacion, jugador_id: newPlayerId };
      delete cleanSupl.id;
      delete cleanSupl.created_at;
      delete cleanSupl.updated_at;
      await upsertJugadorSuplementacion(supabase, cleanSupl);
    }
  } catch (e) {
    console.error(`Error copying supplementation for player ${sourcePlayerId}:`, e);
  }

  try {
    const extras = await getJugadorSuplementosExtra(supabase, sourcePlayerId);
    const extraPayloads = (extras || []).map((item) => {
      const cleanItem = { ...item, jugador_id: newPlayerId };
      delete cleanItem.id;
      delete cleanItem.created_at;
      delete cleanItem.updated_at;
      return cleanItem;
    });
    if (extraPayloads.length) {
      await upsertJugadorSuplementosExtraBulk(supabase, extraPayloads);
    }
  } catch (e) {
    console.error(`Error copying extra supplementation for player ${sourcePlayerId}:`, e);
  }
}

export async function getTeamsAction() {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const supabase = getSupabaseAdmin();
  const teams = await getTeamsByOwner(supabase, ownerId);
  return { equipos: teams || [] };
}

export async function createTeamAction(payload) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const supabase = getSupabaseAdmin();
  const action = clean(payload?.action || 'create');

  if (action === 'create') {
    const nombre = clean(payload.nombre);
    const temporada = clean(payload.temporada) || currentSeason();
    const descripcion = clean(payload.descripcion) || null;
    const selectedPlayerIds = cleanPlayerIds(payload.player_ids);

    if (!nombre) {
      throw new Error('El nombre del equipo es obligatorio');
    }

    const newTeam = await insertTeam(supabase, { owner_id: ownerId, nombre, temporada, descripcion });

    if (selectedPlayerIds && selectedPlayerIds.length > 0) {
      const players = await getOwnedPlayersByIds(supabase, ownerId, selectedPlayerIds);
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

        const newPlayer = await insertPlayer(supabase, { ...copyPayload, equipo_id: newTeam.id });
        copiedPlayers++;
        copiedPlayerSummaries.push({
          id: newPlayer.id,
          nombre: newPlayer.nombre,
          apellidos: newPlayer.apellidos,
          posicion: newPlayer.posicion
        });

        await copyPlayerAllHistory(supabase, sourcePlayerId, newPlayer.id);
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
      sourceTeam = await getOwnedTeam(supabase, user, teamId);
      if (!sourceTeam) throw new Error('No tienes acceso a este equipo');
    }

    if (!temporada) {
      throw new Error('La temporada destino es obligatoria');
    }

    let players = [];
    if (selectedPlayerIds && selectedPlayerIds.length !== 0) {
      players = await getOwnedPlayersByIds(supabase, ownerId, selectedPlayerIds);
      const foundIds = new Set(players.map((player) => String(player.id)));
      const missingIds = selectedPlayerIds.filter((playerId) => !foundIds.has(playerId));
      if (missingIds.length) throw new Error('Algún jugador seleccionado no pertenece a tus equipos');
    } else if (sourceTeam) {
      players = await getPlayersByTeam(supabase, sourceTeam.id);
    }

    const newTeam = await insertTeam(supabase, {
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

      const newPlayer = await insertPlayer(supabase, { ...copyPayload, equipo_id: newTeam.id });
      copiedPlayers++;
      copiedPlayerSummaries.push({
        id: newPlayer.id,
        nombre: newPlayer.nombre,
        apellidos: newPlayer.apellidos,
        posicion: newPlayer.posicion
      });

      await copyPlayerAllHistory(supabase, sourcePlayerId, newPlayer.id);
    }

    revalidatePath('/dashboard');
    return { equipo: newTeam, copiedPlayers, players: copiedPlayerSummaries };
  }

  throw new Error('Acción no soportada');
}

export async function updateTeamAction(teamId, payload) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const cleanTeamId = clean(teamId);
  const nombre = clean(payload?.nombre);
  const temporada = clean(payload?.temporada);
  const descripcion = clean(payload?.descripcion) || null;

  if (!nombre) {
    throw new Error('El nombre del equipo es obligatorio');
  }

  const supabase = getSupabaseAdmin();
  const team = await getOwnedTeam(supabase, user, cleanTeamId);
  if (!team) throw new Error('No tienes acceso a este equipo');

  const data = await updateTeam(supabase, team.id, { nombre, temporada, descripcion });
  revalidatePath(`/dashboard/equipo/${cleanTeamId}`);
  revalidatePath('/dashboard');
  return { equipo: data };
}

export async function deleteTeamAction(teamId) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) throw new Error('No autorizado');

  const cleanTeamId = clean(teamId);
  const supabase = getSupabaseAdmin();
  const team = await getOwnedTeam(supabase, user, cleanTeamId);
  if (!team) throw new Error('No tienes acceso a este equipo');

  await deleteTeam(supabase, team.id);
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function saveTeamConfigAction(teamId, configuracion_nutricional) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!user || user.role !== 'admin' || !ownerId) {
    throw new Error('No autorizado');
  }

  const supabase = getSupabaseAdmin();
  const team = await getTeamByIdAndOwner(supabase, teamId, ownerId);
  if (!team) {
    throw new Error('Equipo no encontrado o sin permisos');
  }

  await updateTeamConfig(supabase, teamId, configuracion_nutricional);
  revalidatePath(`/dashboard/equipo/${teamId}/configuracion`);
  return { success: true };
}
