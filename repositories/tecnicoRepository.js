
import { mockTeam, mockTeams, mockPlayers, isMockTeam, isMockPlayer, isBoneyardMode } from '@/config/boneyardMockData';
import { selectFields } from '@/lib/db/prisma';

export async function getTecnicosByOwner(db, ownerId) {
  const links = await db.nutricionista_tecnicos.findMany({
    where: { nutricionista_id: ownerId },
    select: { tecnico_id: true, tecnicos: true },
  });

  const tecnicos = links.map((l) => l.tecnicos).filter(Boolean);
  const tecnicoIds = tecnicos.map((t) => t.id);

  let assignments = [];
  if (tecnicoIds.length > 0) {
    assignments = await db.tecnico_equipos.findMany({
      where: { tecnico_id: { in: tecnicoIds } },
      select: { tecnico_id: true, equipo_id: true },
    });
  }

  const assignmentsMap = new Map();
  for (const assoc of assignments) {
    const tId = assoc.tecnico_id;
    const current = assignmentsMap.get(tId) || [];
    current.push(assoc.equipo_id);
    assignmentsMap.set(tId, current);
  }

  return tecnicos.map((tecnico) => ({
    ...tecnico,
    team_ids: assignmentsMap.get(tecnico.id) || [],
  }));
}

export async function getTecnicoByEmail(db, email) {
  return db.tecnicos.findUnique({ where: { email } });
}

export async function getTecnicoById(db, id) {
  return db.tecnicos.findUnique({
    where: { id },
    select: selectFields('id, nombre, apellidos, email, avatar, avatar_mime, avatar_size, updated_at'),
  });
}

export async function getTecnicoByAuthUserId(db, authUserId) {
  return db.tecnicos.findUnique({
    where: { auth_user_id: authUserId },
    select: selectFields('id, nombre, apellidos, email'),
  });
}

export async function createTecnicoRecord(db, { auth_user_id, nombre, apellidos, email, owner_id = null }) {
  return db.tecnicos.create({
    data: {
      auth_user_id,
      nombre,
      apellidos,
      email,
      owner_id,
    },
  });
}

export async function linkTecnicoToNutricionista(db, ownerId, tecnicoId) {
  const row = {
    nutricionista_id: ownerId,
    tecnico_id: tecnicoId,
    status: 'accepted',
  };
  await db.nutricionista_tecnicos.upsert({
    where: { nutricionista_id_tecnico_id: { nutricionista_id: ownerId, tecnico_id: tecnicoId } },
    create: row,
    update: row,
  });
  return true;
}

export async function unlinkTecnicoFromNutricionista(db, ownerId, tecnicoId) {
  await db.nutricionista_tecnicos.deleteMany({
    where: { nutricionista_id: ownerId, tecnico_id: tecnicoId },
  });

  const myTeams = await db.equipos.findMany({
    where: { owner_id: ownerId },
    select: { id: true },
  });

  const myTeamIds = myTeams.map((t) => t.id);
  if (myTeamIds.length > 0) {
    await db.tecnico_equipos.deleteMany({
      where: { tecnico_id: tecnicoId, equipo_id: { in: myTeamIds } },
    });
  }

  return true;
}

export async function getNutricionistaTecnicoLink(db, ownerId, tecnicoId) {
  return db.nutricionista_tecnicos.findUnique({
    where: { nutricionista_id_tecnico_id: { nutricionista_id: ownerId, tecnico_id: tecnicoId } },
    select: { id: true },
  });
}

export async function assignTeamsToTecnico(db, ownerId, tecnicoId, teamIds) {
  if (teamIds.length > 0) {
    const validTeams = await db.equipos.findMany({
      where: { owner_id: ownerId, id: { in: teamIds } },
      select: { id: true },
    });

    if (validTeams.length !== teamIds.length) {
      throw new Error('Intento de asignar equipos sin acceso');
    }
  }

  const myTeams = await db.equipos.findMany({
    where: { owner_id: ownerId },
    select: { id: true },
  });
  const myTeamIds = myTeams.map((t) => t.id);

  if (myTeamIds.length > 0) {
    await db.tecnico_equipos.deleteMany({
      where: { tecnico_id: tecnicoId, equipo_id: { in: myTeamIds } },
    });
  }

  if (teamIds.length > 0) {
    const rows = teamIds.map((teamId) => ({
      tecnico_id: tecnicoId,
      equipo_id: teamId,
    }));

    await db.tecnico_equipos.createMany({ data: rows });
  }

  return true;
}

export async function getTeamsByTecnico(db, tecnicoId) {
  if (isBoneyardMode() || (process.env.NODE_ENV !== 'production' && tecnicoId === 'boneyard-mock-user')) {
    return mockTeams;
  }

  const assignedTeams = await db.tecnico_equipos.findMany({
    where: { tecnico_id: tecnicoId },
    select: { equipo_id: true, equipos: true },
  });

  return assignedTeams.map((a) => a.equipos).filter(Boolean);
}

export async function getTecnicoTeam(db, tecnicoId, teamId) {
  if (isMockTeam(teamId)) {
    return mockTeam;
  }

  const data = await db.tecnico_equipos.findFirst({
    where: { tecnico_id: tecnicoId, equipo_id: teamId },
    select: { equipo_id: true, equipos: true },
  });

  return data?.equipos || null;
}

export async function getTecnicoPlayer(db, tecnicoId, playerId) {
  if (isMockPlayer(playerId)) {
    return mockPlayers[0];
  }

  const jugador = await db.jugadores.findUnique({
    where: { id: playerId },
    select: { id: true, equipo_id: true },
  });

  if (!jugador) return null;
  if (jugador.equipo_id === null) return null;

  const access = await db.tecnico_equipos.findFirst({
    where: { tecnico_id: tecnicoId, equipo_id: jugador.equipo_id },
    select: { id: true },
  });

  return access ? jugador : null;
}

export async function updateTecnicoAvatar(db, id, { avatar, avatar_mime, avatar_size }) {
  await db.tecnicos.updateMany({
    where: { id },
    data: {
      avatar,
      avatar_mime,
      avatar_size,
      updated_at: new Date().toISOString(),
    },
  });
  return true;
}

export async function removeTecnicoAvatar(db, id) {
  await db.tecnicos.updateMany({
    where: { id },
    data: {
      avatar: null,
      avatar_mime: null,
      avatar_size: null,
      updated_at: new Date().toISOString(),
    },
  });
  return true;
}
