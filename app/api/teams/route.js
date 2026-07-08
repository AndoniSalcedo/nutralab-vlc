import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { forbidden, getOwnedTeam, getOwnerId } from '@/lib/team-access';
import { insertTeam, deleteTeam, updateTeam } from '@/repositories/teamRepository';
import { getPlayersByTeam, insertPlayer } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIdOrdered, insertEvolutionsBulk } from '@/repositories/evolutionRepository';

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
  'club',
  'fecha_nacimiento',
  'num_comidas',
  'objetivo',
  'gustos_preferencias',
  'aversiones',
  'intolerancias',
  'alergias',
  'contexto_clinico',
  'postentreno',
  'factor_actividad',
  'kcal_objetivo',
  'cho_objetivo_g',
  'proteina_objetivo_g',
  'grasa_objetivo_g',
  'agua_objetivo_ml',
  'notas_hidratacion',
  'notas_suplementacion',
  'notas_protocolos',
];

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

      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del equipo es obligatorio' }, { status: 400 });
      }

      const data = await insertTeam(supabase, { owner_id: ownerId, nombre, temporada, descripcion });
      return NextResponse.json({ equipo: data }, { status: 201 });
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
      const sourceTeam = await getOwnedTeam(supabase, user, teamId);
      if (!sourceTeam) return forbidden('No tienes acceso a este equipo');
      if (!temporada) {
        return NextResponse.json({ error: 'La temporada destino es obligatoria' }, { status: 400 });
      }

      let players = [];
      if (selectedPlayerIds?.length !== 0) {
        const teamPlayers = await getPlayersByTeam(supabase, sourceTeam.id);
        
        if (selectedPlayerIds) {
          const idsSet = new Set(selectedPlayerIds.map(String));
          players = teamPlayers.filter(p => idsSet.has(String(p.id)));
          
          const foundIds = new Set(players.map((player) => String(player.id)));
          const missingIds = selectedPlayerIds.filter((playerId) => !foundIds.has(playerId));
          if (missingIds.length) return forbidden('Algún jugador seleccionado no pertenece a este equipo');
        } else {
          players = teamPlayers;
        }
      }

      const newTeam = await insertTeam(supabase, {
        owner_id: ownerId,
        nombre: nombre || sourceTeam.nombre,
        temporada,
        descripcion: hasDescripcion ? descripcion : sourceTeam.descripcion,
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

        const evolutions = await getEvolutionsByPlayerIdOrdered(supabase, sourcePlayerId);

        const evolutionPayloads = (evolutions || []).map((evo) => {
          const cleanEvo = { ...evo, jugador_id: newPlayer.id };
          delete cleanEvo.id;
          delete cleanEvo.created_at;
          return cleanEvo;
        });

        if (evolutionPayloads.length) {
          await insertEvolutionsBulk(supabase, evolutionPayloads);
        }
      }

      return NextResponse.json({ equipo: newTeam, copiedPlayers, players: copiedPlayerSummaries });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('Teams API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

