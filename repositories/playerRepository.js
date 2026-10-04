import { mockPlayers, mockTeam, isMockPlayer, isMockTeam, isBoneyardMode } from '@/config/boneyardMockData';
import { getOwnerId } from '@/lib/auth/owner';
import { selectFields } from '@/lib/db/prisma';


export async function getOwnedPlayer(db, user, playerId) {
  if (user?.isBoneyardBypass || isMockPlayer(playerId)) {
    return mockPlayers[0];
  }

  const ownerId = getOwnerId(user);
  if (!ownerId || !playerId) return null;

  return db.jugadores.findFirst({
    where: { id: playerId, equipos: { owner_id: ownerId } },
    select: { id: true, equipo_id: true, equipos: { select: { id: true, owner_id: true } } },
  });
}

export async function getPlayerById(db, id) {
  if (isMockPlayer(id)) {
    const player = mockPlayers.find((p) => String(p.id) === String(id));
    return player || mockPlayers[0];
  }

  return db.jugadores.findUniqueOrThrow({ where: { id } });
}


export async function getPlayerAuthUserId(db, id) {
  return db.jugadores.findUniqueOrThrow({
    where: { id },
    select: { auth_user_id: true },
  });
}


export async function getPlayerByAuthUserIdSingle(db, authUserId) {
  return db.jugadores.findFirst({
    where: { auth_user_id: authUserId },
    select: { id: true, nombre: true, apellidos: true },
  });
}

export async function getPlayersByOwner(db, ownerId) {
  if (isBoneyardMode() || (process.env.NODE_ENV !== 'production' && ownerId === 'boneyard-mock-user')) {
    return mockPlayers;
  }

  return db.jugadores.findMany({
    where: { equipos: { owner_id: ownerId } },
    select: {
      id: true,
      equipo_id: true,
      nombre: true,
      apellidos: true,
      posicion: true,
      equipos: { select: { owner_id: true } },
    },
    orderBy: { nombre: 'asc' },
  });
}

export async function getPlayersByTeam(db, teamId) {
  if (isMockTeam(teamId)) {
    return mockPlayers;
  }

  return db.jugadores.findMany({
    where: { equipo_id: teamId },
    orderBy: { nombre: 'asc' },
  });
}

export async function getPlayersByTeamSelect(db, teamId, fields = '*') {
  if (isMockTeam(teamId)) {
    return mockPlayers;
  }

  return db.jugadores.findMany({
    where: { equipo_id: teamId },
    select: selectFields(fields),
    orderBy: { nombre: 'asc' },
  });
}

export async function getPlayersByTeamSelectSimple(db, teamId) {
  if (isMockTeam(teamId)) {
    return mockPlayers;
  }

  return db.jugadores.findMany({
    where: { equipo_id: teamId },
    select: selectFields('id,nombre,apellidos,posicion,avatar_size,updated_at'),
    orderBy: { nombre: 'asc' },
  });
}

export async function getPlayersByTeamIds(db, teamId, ids) {
  return db.jugadores.findMany({
    where: { equipo_id: teamId, id: { in: ids } },
    select: { id: true },
  });
}

export async function getPlayersByMultipleTeamIds(db, teamIds) {
  if (!teamIds || teamIds.length === 0) return [];
  if (teamIds.every(isMockTeam)) {
    return mockPlayers;
  }

  return db.jugadores.findMany({
    where: { equipo_id: { in: teamIds } },
    select: selectFields('id,equipo_id,nombre,apellidos,posicion'),
    orderBy: { nombre: 'asc' },
  });
}

export async function getPlayerWithTeamConfig(db, id) {
  if (isMockPlayer(id)) {
    const player = mockPlayers.find((p) => String(p.id) === String(id)) || mockPlayers[0];
    return { ...player, equipos: mockTeam };
  }

  return db.jugadores.findUniqueOrThrow({
    where: { id },
    include: { equipos: { select: { nombre: true, configuracion_nutricional: true } } },
  });
}


export async function insertPlayer(db, payload) {
  return db.jugadores.create({ data: payload });
}

export async function insertPlayersBulk(db, payloads) {
  if (!payloads?.length) return [];
  return db.jugadores.createManyAndReturn({ data: payloads });
}

export async function updatePlayer(db, id, payload) {
  return db.jugadores.update({ where: { id }, data: payload });
}

export async function deletePlayer(db, id) {
  await db.jugadores.deleteMany({ where: { id } });
  return true;
}

export async function getOwnedPlayersByIds(db, ownerId, playerIds) {
  if (!ownerId || !playerIds || !playerIds.length) return [];

  return db.jugadores.findMany({
    where: { id: { in: playerIds }, equipos: { owner_id: ownerId } },
    include: { equipos: { select: { owner_id: true } } },
  });
}

export async function getPlayerAvatar(db, id) {
  return db.jugadores.findUnique({
    where: { id },
    select: selectFields('id, nombre, apellidos, equipo_id, avatar, avatar_mime, avatar_size, updated_at'),
  });
}
