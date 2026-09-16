import {
  updatePlayerCredentialsAction,
  updatePlayerPasswordAction,
  updatePlayerFieldAction,
  transferPlayersAction,
  savePlayerAction,
  deletePlayerAction,
  importPlayerExcelAction,
} from '@/actions/playerActions';

export async function updatePlayerCredentials(jugadorId, email, password) {
  return await updatePlayerCredentialsAction({ jugadorId, email, password });
}

export async function updatePlayerPassword(password) {
  return await updatePlayerPasswordAction(password);
}

export async function importPlayerExcel({ file, modo, teamId, decisiones }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('modo', modo);
  if (teamId) formData.append('team_id', teamId);
  if (decisiones) formData.append('decisiones', JSON.stringify(decisiones));

  return await importPlayerExcelAction(formData);
}

export async function deletePlayer(id) {
  return await deletePlayerAction(id);
}

export async function savePlayer(formData) {
  return await savePlayerAction(formData);
}

export async function updatePlayerField(id, field, value) {
  return await updatePlayerFieldAction(id, field, value);
}

export async function transferPlayers({ playerIds, targetTeamId, action }) {
  return await transferPlayersAction({ playerIds, targetTeamId, action });
}

export async function uploadPlayerAvatar(jugadorId, file) {
  const formData = new FormData();
  if (jugadorId) formData.append('id', jugadorId);
  formData.append('avatar', file);

  const res = await fetch('/api/media/player-avatar', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir foto de perfil');
  return data;
}
