import {
  getTecnicosAction,
  createTecnicoAction,
  deleteTecnicoAction,
  assignTeamsAction,
  registerTecnicoAction,
} from '@/actions/tecnicoActions';

export async function getTecnicos() {
  const data = await getTecnicosAction();
  return data.tecnicos || [];
}

export async function createTecnico(payload) {
  const data = await createTecnicoAction(payload);
  return data.tecnico;
}

export async function deleteTecnico(id) {
  return await deleteTecnicoAction(id);
}

export async function assignTeams(tecnicoId, teamIds) {
  return await assignTeamsAction(tecnicoId, teamIds);
}

export async function registerTecnico(payload) {
  const data = await registerTecnicoAction(payload);
  return data.tecnico;
}

export async function uploadTecnicoAvatar(tecnicoId, file) {
  const formData = new FormData();
  if (tecnicoId) formData.append('id', tecnicoId);
  formData.append('avatar', file);

  const res = await fetch('/api/media/tecnico-avatar', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir foto de perfil');
  return data;
}
