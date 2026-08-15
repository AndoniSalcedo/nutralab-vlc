export async function getTeams() {
  const res = await fetch('/api/teams');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los equipos');
  return data.equipos;
}

export async function createTeam(payload) {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo guardar el equipo');
  return data;
}

export async function deleteTeam(teamId) {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', team_id: teamId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el equipo');
  return data;
}

export async function updateTeam(teamId, payload) {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', team_id: teamId, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el equipo');
  return data;
}
