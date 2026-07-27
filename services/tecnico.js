export async function getTecnicos() {
  const res = await fetch('/api/tecnicos');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudieron obtener los técnicos');
  return data.tecnicos || [];
}

export async function createTecnico(payload) {
  const res = await fetch('/api/tecnicos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo vincular el técnico');
  return data.tecnico;
}

export async function deleteTecnico(id) {
  const res = await fetch('/api/tecnicos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el técnico');
  return data;
}

export async function assignTeams(tecnicoId, teamIds) {
  const res = await fetch('/api/tecnicos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'assign', tecnico_id: tecnicoId, team_ids: teamIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudieron asignar los equipos');
  return data;
}

export async function registerTecnico(payload) {
  const res = await fetch('/api/tecnicos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo registrar el técnico');
  return data.tecnico;
}
