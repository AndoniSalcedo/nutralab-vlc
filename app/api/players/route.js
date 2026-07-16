import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer, getOwnedTeam } from '@/lib/team-access';
import { DEFAULT_PLAYER_MEALS_STRING } from '@/lib/nutrition-day-types';
import { toPositiveNumber as toNumber } from '@/lib/utils';
import {
  getPlayerAuthUserId,
  deletePlayer,
  updatePlayer,
  insertPlayer
} from '@/repositories/playerRepository';
import { insertEvolution } from '@/repositories/evolutionRepository';


export async function POST(request) {
  const url = new URL(request.url);
  const deleting = url.searchParams.get('delete') === '1';
  const form = await request.formData();
  const id = String(form.get('id') || '');
  const teamId = String(form.get('team_id') || '');
  const supabase = getSupabaseAdmin();
  const user = await getUser();

  if (!user || user.role === 'jugador') {
    return forbidden('No autorizado');
  }

  if (deleting && id) {
    const ownedPlayer = await getOwnedPlayer(supabase, user, id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const jugador = await getPlayerAuthUserId(supabase, id);

    await deletePlayer(supabase, id);
    if (jugador?.auth_user_id) {
      await supabase.auth.admin.deleteUser(jugador.auth_user_id);
    }
    const redirectTeamId = ownedPlayer.equipo_id || teamId;
    return NextResponse.redirect(new URL(redirectTeamId ? `/dashboard/equipo/${redirectTeamId}` : '/dashboard', request.url));
  }

  let targetTeam = null;
  if (id) {
    const ownedPlayer = await getOwnedPlayer(supabase, user, id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    targetTeam = await getOwnedTeam(supabase, user, ownedPlayer.equipo_id);
    if (!targetTeam) return forbidden('No tienes acceso a este equipo');
  } else {
    targetTeam = await getOwnedTeam(supabase, user, teamId);
    if (!targetTeam) return forbidden('Debes crear o seleccionar un equipo antes de añadir jugadores');
  }

  const payload = {
    equipo_id: targetTeam.id,
    nombre: String(form.get('nombre') || ''),
    apellidos: String(form.get('apellidos') || ''),
    posicion: String(form.get('posicion') || ''),
    club: form.get('club') ? String(form.get('club')) : null,
    fecha_nacimiento: form.get('fecha_nacimiento') ? String(form.get('fecha_nacimiento')) : null,
    factor_actividad: form.get('factor_actividad') ? toNumber(form.get('factor_actividad')) : 1.55,
    num_comidas: form.get('num_comidas') ? String(form.get('num_comidas')) : DEFAULT_PLAYER_MEALS_STRING,
    preentreno: form.get('preentreno') === 'true',
    postentreno: form.get('postentreno') === 'true',
    gustos_preferencias: String(form.get('gustos_preferencias') || ''),
    contexto_clinico: String(form.get('contexto_clinico') || ''),
    aversiones: String(form.get('aversiones') || ''),
    intolerancias: String(form.get('intolerancias') || ''),
    alergias: String(form.get('alergias') || ''),
    objetivo: String(form.get('objetivo') || ''),
    kcal_objetivo: form.get('kcal_objetivo') ? toNumber(form.get('kcal_objetivo')) : null,
    cho_objetivo_g: form.get('cho_objetivo_g') ? toNumber(form.get('cho_objetivo_g')) : null,
    proteina_objetivo_g: form.get('proteina_objetivo_g') ? toNumber(form.get('proteina_objetivo_g')) : null,
    grasa_objetivo_g: form.get('grasa_objetivo_g') ? toNumber(form.get('grasa_objetivo_g')) : null,
    agua_objetivo_ml: form.get('agua_objetivo_ml') ? toNumber(form.get('agua_objetivo_ml')) : null,
  };

  if (id) {
    await updatePlayer(supabase, id, payload);
  } else {
    const newPlayer = await insertPlayer(supabase, payload);

    const initialWeight = form.get('initial_weight') ? toNumber(form.get('initial_weight')) : null;
    const initialHeight = form.get('initial_height') ? toNumber(form.get('initial_height')) : null;

    if (newPlayer?.id && (initialWeight !== null || initialHeight !== null)) {
      await insertEvolution(supabase, {
        jugador_id: newPlayer.id,
        fecha: new Date().toISOString().split('T')[0],
        peso_kg: initialWeight,
        altura_cm: initialHeight,
        notas: 'Medición inicial al crear jugador',
      });
    }
  }

  return NextResponse.redirect(new URL(`/dashboard/equipo/${targetTeam.id}`, request.url), 303);
}

