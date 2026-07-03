export async function updatePlayerCredentials(jugadorId, email, password) {
  const res = await fetch('/api/player-credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jugadorId,
      email,
      password,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error creando credenciales');
  return data;
}

export async function updatePlayerPassword(password) {
  const res = await fetch('/api/player-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error actualizando contraseña');
  return data;
}

export async function importPlayerExcel({ file, modo, teamId, decisiones }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('modo', modo);
  if (teamId) formData.append('team_id', teamId);
  if (decisiones) formData.append('decisiones', JSON.stringify(decisiones));

  const res = await fetch('/api/import-player-excel', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo procesar el Excel');
  return data;
}

export async function deletePlayer(id) {
  const formData = new FormData();
  formData.append('id', id);
  const res = await fetch('/api/players?delete=1', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Error al eliminar jugador');
  return res;
}

export async function savePlayer(formData) {
  const res = await fetch('/api/players', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Error al guardar jugador');
  return res;
}

export async function updatePlayerField(id, field, value) {
  const res = await fetch('/api/update-player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, field, value }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo guardar el campo');
  return data;
}
