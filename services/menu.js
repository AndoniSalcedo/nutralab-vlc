export async function getWeeklyMenus(teamId) {
  const url = teamId ? `/api/menu-semanal?equipo_id=${teamId}` : '/api/menu-semanal';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al cargar menús');
  const data = await res.json();
  return data;
}

export async function uploadWeeklyMenu(file, weekDate, teamId) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('semana', weekDate);
  fd.append('equipo_id', teamId);

  const res = await fetch('/api/menu-semanal', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir el archivo');
  return data;
}

export async function deleteWeeklyMenu(id) {
  const res = await fetch(`/api/menu-semanal?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar el menú');
  return data;
}
