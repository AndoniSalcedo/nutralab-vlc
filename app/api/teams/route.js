import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { forbidden, getOwnedTeam, getOwnerId } from '@/lib/team-access';
import { insertTeam, deleteTeam, updateTeam, getTeamsByOwner } from '@/repositories/teamRepository';
import { getPlayersByTeam, insertPlayer, getOwnedPlayersByIds } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdOrdered, insertEvolutionsBulk } from '@/repositories/evolutionRepository';
import { getAnalyticsByPlayerId, insertAnalyticsBulk } from '@/repositories/analyticsRepository';
import { getHydrationRecordsByPlayerId, insertHydrationRecordsBulk } from '@/repositories/hydrationRepository';
import { getAiPlansByPlayerId, insertAiPlansBulk } from '@/repositories/aiPlanRepository';
import { getJugadorSuplementacion, getJugadorSuplementosExtra, upsertJugadorSuplementacion, upsertJugadorSuplementosExtraBulk } from '@/repositories/supplementationRepository';

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

export async function GET() {
  try {
    const user = await getUser();
    const ownerId = getOwnerId(user);
    if (!ownerId) return forbidden('No autorizado');

    const supabase = getSupabaseAdmin();
    const teams = await getTeamsByOwner(supabase, ownerId);
    return NextResponse.json({ equipos: teams });
  } catch (error) {
    console.error('Teams GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) return forbidden('No autorizado');

  try {
    const body = await request.json();
    const action = clean(body.action || 'create');
    const supabase = getSupabaseAdmin();

    if (action === 'create') {
      const nombre = clean(body.nombre);
      const temporada = clean(body.temporada) || currentSeason();
      const descripcion = clean(body.descripcion) || null;
      const selectedPlayerIds = cleanPlayerIds(body.player_ids);

      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del equipo es obligatorio' }, { status: 400 });
      }

      const newTeam = await insertTeam(supabase, { owner_id: ownerId, nombre, temporada, descripcion });

      if (selectedPlayerIds && selectedPlayerIds.length > 0) {
        const players = await getOwnedPlayersByIds(supabase, ownerId, selectedPlayerIds);
        const foundIds = new Set(players.map((player) => String(player.id)));
        const missingIds = selectedPlayerIds.filter((playerId) => !foundIds.has(playerId));
        if (missingIds.length) return forbidden('Algún jugador seleccionado no pertenece a tus equipos');

        let copiedPlayers = 0;
        const copiedPlayerSummaries = [];
        for (const player of players) {
          const sourcePlayerId = player.id;
          const payload = Object.fromEntries(
            PLAYER_COPY_FIELDS.map((field) => [field, player[field] ?? null])
          );

          const newPlayer = await insertPlayer(supabase, { ...payload, equipo_id: newTeam.id });
          copiedPlayers++;
          copiedPlayerSummaries.push({
            id: newPlayer.id,
            nombre: newPlayer.nombre,
            apellidos: newPlayer.apellidos,
            posicion: newPlayer.posicion
          });

          await copyPlayerAllHistory(supabase, sourcePlayerId, newPlayer.id);
        }
        return NextResponse.json({ equipo: newTeam, copiedPlayers, players: copiedPlayerSummaries }, { status: 201 });
      }

      return NextResponse.json({ equipo: newTeam }, { status: 201 });
    }

    if (action === 'delete') {
      const teamId = clean(body.team_id);
      const team = await getOwnedTeam(supabase, user, teamId);
      if (!team) return forbidden('No tienes acceso a este equipo');

      await deleteTeam(supabase, team.id);
      return NextResponse.json({ ok: true });
    }

    if (action === 'update') {
      const teamId = clean(body.team_id);
      const nombre = clean(body.nombre);
      const temporada = clean(body.temporada);
      const descripcion = clean(body.descripcion) || null;

      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del equipo es obligatorio' }, { status: 400 });
      }

      const team = await getOwnedTeam(supabase, user, teamId);
      if (!team) return forbidden('No tienes acceso a este equipo');
      const data = await updateTeam(supabase, team.id, { nombre, temporada, descripcion });
      return NextResponse.json({ equipo: data }, { status: 200 });
    }

    if (action === 'copy_season') {
      const teamId = clean(body.team_id);
      const nombre = clean(body.nombre);
      const temporada = clean(body.temporada);
      const selectedPlayerIds = cleanPlayerIds(body.player_ids);
      const hasDescripcion = Object.prototype.hasOwnProperty.call(body, 'descripcion');
      const descripcion = hasDescripcion ? clean(body.descripcion) || null : undefined;
      let sourceTeam = null;
      if (teamId) {
        sourceTeam = await getOwnedTeam(supabase, user, teamId);
        if (!sourceTeam) return forbidden('No tienes acceso a este equipo');
      }

      if (!temporada) {
        return NextResponse.json({ error: 'La temporada destino es obligatoria' }, { status: 400 });
      }

      let players = [];
      if (selectedPlayerIds && selectedPlayerIds.length !== 0) {
        players = await getOwnedPlayersByIds(supabase, ownerId, selectedPlayerIds);
        const foundIds = new Set(players.map((player) => String(player.id)));
        const missingIds = selectedPlayerIds.filter((playerId) => !foundIds.has(playerId));
        if (missingIds.length) return forbidden('Algún jugador seleccionado no pertenece a tus equipos');
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
        const payload = Object.fromEntries(
          PLAYER_COPY_FIELDS.map((field) => [field, player[field] ?? null])
        );

        const newPlayer = await insertPlayer(supabase, { ...payload, equipo_id: newTeam.id });
        copiedPlayers++;
        copiedPlayerSummaries.push({
          id: newPlayer.id,
          nombre: newPlayer.nombre,
          apellidos: newPlayer.apellidos,
          posicion: newPlayer.posicion
        });

        await copyPlayerAllHistory(supabase, sourcePlayerId, newPlayer.id);
      }

      return NextResponse.json({ equipo: newTeam, copiedPlayers, players: copiedPlayerSummaries });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('Teams API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

