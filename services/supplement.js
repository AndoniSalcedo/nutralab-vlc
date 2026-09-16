import {
  getSupplementationCatalogAction,
  updateSupplementationCatalogAction,
  getPlayerSupplementationAction,
  postPlayerSupplementationAction
} from '@/actions/supplementActions';

export async function getSupplementationCatalog() {
  return await getSupplementationCatalogAction();
}

export async function updateSupplementationCatalog(payload) {
  return await updateSupplementationCatalogAction(payload);
}

export async function getPlayerSupplementation(jugadorId) {
  return await getPlayerSupplementationAction(jugadorId);
}

export async function postPlayerSupplementation(jugadorId, payload) {
  return await postPlayerSupplementationAction(jugadorId, payload);
}
