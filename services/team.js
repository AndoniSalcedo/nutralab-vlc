import {
  getTeamsAction,
  createTeamAction,
  updateTeamAction,
  deleteTeamAction,
  saveTeamConfigAction
} from '@/actions/teamActions';

export async function getTeams() {
  const data = await getTeamsAction();
  return data.equipos;
}

export async function createTeam(payload) {
  return await createTeamAction(payload);
}

export async function deleteTeam(teamId) {
  return await deleteTeamAction(teamId);
}

export async function updateTeam(teamId, payload) {
  return await updateTeamAction(teamId, payload);
}

export async function uploadTeamPhoto(teamId, file) {
  const formData = new FormData();
  formData.append('id', teamId);
  formData.append('foto', file);

  const res = await fetch('/api/media/team-avatar', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir foto del equipo');
  return data;
}

export async function removeTeamPhoto(teamId) {
  const formData = new FormData();
  formData.append('id', teamId);
  formData.append('remove', 'true');

  const res = await fetch('/api/media/team-avatar', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar foto del equipo');
  return data;
}

export async function saveTeamConfig(teamId, configuracion_nutricional) {
  return await saveTeamConfigAction(teamId, configuracion_nutricional);
}
