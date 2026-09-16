import {
  getWeeklyMenusAction,
  createWeeklyMenuAction,
  uploadWeeklyMenuAction,
  updateWeeklyMenuAction,
  deleteWeeklyMenuAction
} from '@/actions/menuActions';

export async function getWeeklyMenus(teamId) {
  const data = await getWeeklyMenusAction(teamId);
  return data;
}

export async function uploadWeeklyMenu(file, weekDate, teamId) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('semana', weekDate);
  fd.append('equipo_id', teamId);

  return await uploadWeeklyMenuAction(fd);
}

export async function createWeeklyMenu({ semana, equipo_id, dias }) {
  return await createWeeklyMenuAction({ semana, equipo_id, dias });
}

export async function deleteWeeklyMenu(id) {
  return await deleteWeeklyMenuAction(id);
}

export async function updateWeeklyMenu(id, dias) {
  return await updateWeeklyMenuAction(id, dias);
}
