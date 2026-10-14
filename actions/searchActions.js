'use server';

import { getUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/prisma';
import { getOwnerId } from '@/lib/auth/owner';
import { getTeamsByOwner } from '@/repositories/teamRepository';
import { getTeamsByTecnico } from '@/repositories/tecnicoRepository';
import { getQuickSearchPlayers } from '@/repositories/playerRepository';

/**
 * Índice del buscador rápido (⌘K): equipos y jugadores a los que el usuario tiene acceso.
 * Nutricionista/admin: sus equipos. Técnico: los equipos que tiene asignados. Jugador: nada.
 * El filtrado por texto se hace en el cliente (las plantillas son pequeñas).
 */
export async function getQuickSearchIndex() {
  const user = await getUser();
  if (!user || user.role === 'jugador') throw new Error('No autorizado');

  const db = getDb();
  let teams = [];
  if (user.role === 'tecnico') {
    teams = await getTeamsByTecnico(db, user.id);
  } else {
    const ownerId = getOwnerId(user);
    if (!ownerId) throw new Error('No autorizado');
    teams = await getTeamsByOwner(db, ownerId);
  }

  const teamList = (teams || []).map((t) => ({
    id: t.id,
    nombre: t.nombre,
    temporada: t.temporada || '',
    foto_size: t.foto_size || null,
    updated_at: t.updated_at || null,
  }));
  const teamById = new Map(teamList.map((t) => [String(t.id), t]));

  const players = await getQuickSearchPlayers(db, teamList.map((t) => t.id));
  const playerList = (players || []).map((p) => {
    const team = teamById.get(String(p.equipo_id));
    return {
      id: p.id,
      nombre: p.nombre,
      apellidos: p.apellidos || '',
      posicion: p.posicion || '',
      avatar_size: p.avatar_size || null,
      updated_at: p.updated_at || null,
      equipo: team ? `${team.nombre}${team.temporada ? ` · ${team.temporada}` : ''}` : '',
    };
  });

  return { teams: teamList, players: playerList };
}
