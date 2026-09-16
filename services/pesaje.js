import {
  savePesajeAction,
  deletePesajeAction
} from '@/actions/pesajeActions';

export async function savePesaje(payload) {
  return await savePesajeAction(payload);
}

export async function deletePesaje(id) {
  return await deletePesajeAction(id);
}
