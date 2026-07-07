import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer, getOwnedTeam } from '@/lib/team-access';
import { DEFAULT_PLAYER_MEALS_STRING } from '@/lib/nutrition-day-types';
import { toPositiveNumber as toNumber } from '@/lib/utils';


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

    const { data: jugador } = await supabase
      .from('jugadores')
      .select('auth_user_id')
      .eq('id', id)
      .single();

    await supabase.from('jugadores').delete().eq('id', id);
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
    factor_actividad: toNumber(form.get('factor_actividad')),
    gustos_preferencias: String(form.get('gustos_preferencias') || ''),
    contexto_clinico: String(form.get('contexto_clinico') || ''),
    objetivo: String(form.get('objetivo') || ''),
    kcal_objetivo: toNumber(form.get('kcal_objetivo')),
    cho_objetivo_g: toNumber(form.get('cho_objetivo_g')),
    proteina_objetivo_g: toNumber(form.get('proteina_objetivo_g')),
    grasa_objetivo_g: toNumber(form.get('grasa_objetivo_g')),
    agua_objetivo_ml: toNumber(form.get('agua_objetivo_ml')),
  };

  if (id) {
    await supabase.from('jugadores').update(payload).eq('id', id);
  } else {
    const insertPayload = {
      ...payload,
      num_comidas: DEFAULT_PLAYER_MEALS_STRING,
      postentreno: false,
    };
    await supabase.from('jugadores').insert(insertPayload);
  }

  return NextResponse.redirect(new URL(`/dashboard/equipo/${targetTeam.id}`, request.url), 303);
}
