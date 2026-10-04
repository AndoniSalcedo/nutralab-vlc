import { mockTeam, mockTeams, isMockTeam, isBoneyardMode } from '@/config/boneyardMockData';
import { getOwnerId } from '@/lib/auth/owner';
import { selectFields } from '@/lib/db/prisma';


export async function getOwnedTeam(db, user, teamId) {
  if (user?.isBoneyardBypass || isMockTeam(teamId)) {
    return mockTeam;
  }

  const ownerId = getOwnerId(user);
  if (!ownerId || !teamId) return null;

  return db.equipos.findFirst({ where: { id: teamId, owner_id: ownerId } });
}

export async function getTeamsByOwner(db, ownerId) {
  if (isBoneyardMode() || (process.env.NODE_ENV !== 'production' && ownerId === 'boneyard-mock-user')) {
    return mockTeams;
  }

  return db.equipos.findMany({
    where: { owner_id: ownerId },
    orderBy: [{ temporada: 'desc' }, { nombre: 'asc' }],
  });
}

export async function getTeamByIdAndOwner(db, teamId, ownerId) {
  if (isMockTeam(teamId)) {
    return mockTeam;
  }

  return db.equipos.findFirst({
    where: { id: teamId, owner_id: ownerId },
    select: { id: true },
  });
}

export async function insertTeam(db, { owner_id, nombre, temporada, descripcion, configuracion_nutricional = null, foto = null, foto_mime = null, foto_size = null }) {
  const payload = { owner_id, nombre, temporada, descripcion, configuracion_nutricional };
  if (foto !== undefined) {
    payload.foto = foto;
    payload.foto_mime = foto_mime;
    payload.foto_size = foto_size;
  }

  return db.equipos.create({ data: payload });
}

export async function deleteTeam(db, teamId) {
  await db.equipos.deleteMany({ where: { id: teamId } });
  return true;
}

export async function updateTeamConfig(db, teamId, configuracion_nutricional) {
  await db.equipos.updateMany({ where: { id: teamId }, data: { configuracion_nutricional } });
  return true;
}

export async function updateTeam(db, teamId, payload) {
  return db.equipos.update({ where: { id: teamId }, data: payload });
}

export async function getTeamPhoto(db, teamId) {
  return db.equipos.findUnique({
    where: { id: teamId },
    select: selectFields('id, nombre, foto, foto_mime, foto_size, updated_at'),
  });
}
