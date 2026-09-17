'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer } from '@/lib/auth/team-access';
import {
  getEvolutionById,
  updateEvolution,
  upsertEvolution,
  deleteEvolution
} from '@/repositories/evolutionRepository';

const EVOLUTION_FIELDS = [
  'fecha',
  'altura_cm',
  'peso_kg',
  'porcentaje_grasa',
  'porcentaje_musculo',
  'pliegue_biceps',
  'pliegue_triceps',
  'pliegue_subescapular',
  'pliegue_cresta_iliaca',
  'pliegue_supraeliaco',
  'pliegue_abdominal',
  'pliegue_pantorrilla',
  'pliegue_muslo',
  'suma_6_pliegues',
  'suma_8_pliegues',
  'porcentaje_grasa_faulkner',
  'porcentaje_grasa_yuhasz',
  'peso_oseo',
  'peso_residual',
  'peso_graso',
  'peso_muscular',
  'peso_magro',
  'peso_deseable',
  'endomorfia',
  'mesomorfia',
  'ectomorfia',
  'perimetro_brazo_contraido',
  'perimetro_brazo_relajado',
  'perimetro_antebrazo',
  'perimetro_muneca',
  'perimetro_muslo_derecho',
  'perimetro_muslo_izquierdo',
  'perimetro_pantorrilla_derecha',
  'perimetro_pantorrilla_izquierda',
  'diametro_humero',
  'diametro_femur',
  'diametro_muneca',
  'somatocarta_x',
  'somatocarta_y',
  'indice_ponderal',
  'notas'
];


export async function saveEvolutionAction(body) {
  const { id, jugador_id, fecha } = body || {};
  if (!jugador_id || !fecha) throw new Error('Faltan datos obligatorios');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }
  const ownedPlayer = await getOwnedPlayer(supabase, user, jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  const payload = {};
  for (const key of EVOLUTION_FIELDS) {
    if (body[key] !== undefined) {
      payload[key] = body[key];
    }
  }

  let data;
  if (id) {
    data = await updateEvolution(supabase, id, payload);
  } else {
    data = await upsertEvolution(supabase, {
      jugador_id,
      ...payload
    });
  }

  revalidatePath(`/dashboard/jugador/${jugador_id}`);
  return { ok: true, evolucion: data };
}

export async function deleteEvolutionAction(id) {
  if (!id) throw new Error('Falta id de la medición');

  const supabase = getSupabaseAdmin();
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const evolucion = await getEvolutionById(supabase, id);
  if (!evolucion) throw new Error('Medición no encontrada');

  const ownedPlayer = await getOwnedPlayer(supabase, user, evolucion.jugador_id);
  if (!ownedPlayer) throw new Error('No tienes acceso a este jugador');

  await deleteEvolution(supabase, id);
  revalidatePath(`/dashboard/jugador/${evolucion.jugador_id}`);
  return { ok: true };
}

export {
  saveEvolutionAction as saveEvolution,
  deleteEvolutionAction as deleteEvolution,
};
