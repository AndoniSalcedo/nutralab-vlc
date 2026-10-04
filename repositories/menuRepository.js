import { mockMenus, isMockTeam } from '@/config/boneyardMockData';

export async function getMenusByTeam(db, teamId) {
  if (isMockTeam(teamId)) {
    return mockMenus;
  }

  return db.menu_semanal.findMany({
    where: { equipo_id: teamId },
    orderBy: { semana: 'desc' },
  });
}

export async function updateMenu(db, id, payload) {
  return db.menu_semanal.update({ where: { id }, data: payload });
}

export async function deleteMenu(db, id) {
  await db.menu_semanal.deleteMany({ where: { id } });
  return true;
}

export async function getMenuByWeekAndTeam(db, week, teamId) {
  return db.menu_semanal.findUnique({
    where: { semana_equipo_id: { semana: week, equipo_id: teamId } },
  });
}

export async function getMenuById(db, id) {
  if (id === 101 || isMockTeam(id)) {
    return mockMenus[0] || null;
  }

  return db.menu_semanal.findUnique({
    where: { id },
    select: { id: true, equipo_id: true },
  });
}

export async function upsertMenu(db, payload) {
  return db.menu_semanal.upsert({
    where: { semana_equipo_id: { semana: payload.semana, equipo_id: payload.equipo_id } },
    create: payload,
    update: payload,
  });
}

export async function getMenusByTeamLimit(db, teamId, semana, limit = 10) {
  if (isMockTeam(teamId)) {
    return mockMenus.slice(0, limit);
  }

  return db.menu_semanal.findMany({
    where: semana ? { equipo_id: teamId, semana } : { equipo_id: teamId },
    orderBy: { semana: 'desc' },
    take: limit,
  });
}
