import {
  saveEvolutionAction,
  deleteEvolutionAction
} from '@/actions/evolutionActions';

export async function saveEvolution(payload) {
  return await saveEvolutionAction(payload);
}

export async function deleteEvolution(id) {
  return await deleteEvolutionAction(id);
}
