import {
  uploadAnaliticaAction,
  deleteAnaliticaAction,
  toggleAnaliticaVisibilityAction
} from '@/actions/analyticActions';

export async function uploadAnalitica(file, jugadorId, fecha) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('jugador_id', String(jugadorId));
  fd.append('fecha_extraccion', fecha);

  return await uploadAnaliticaAction(fd);
}

export async function deleteAnalitica(id) {
  return await deleteAnaliticaAction(id);
}

export async function toggleAnaliticaVisibility(id, visible_para_jugador) {
  return await toggleAnaliticaVisibilityAction(id, visible_para_jugador);
}
