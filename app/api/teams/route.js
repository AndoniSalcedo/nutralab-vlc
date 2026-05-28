import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { forbidden, getOwnedTeam, getOwnerId } from '@/lib/team-access';

function clean(value) {
  return String(value || '').trim();
}

function currentSeason() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${String(year + 1).slice(-2)}`;
}

const PLAYER_COPY_FIELDS = [
  'nombre',
  'apellidos',
  'posicion',
  'club',
  'fecha_nacimiento',
  'num_comidas',
  'objetivo',
  'gustos_preferencias',
  'aversiones',
  'intolerancias',
  'alergias',
  'contexto_clinico',
  'factor_actividad',
  'kcal_objetivo',
  'cho_objetivo_g',
  'proteina_objetivo_g',
  'grasa_objetivo_g',
  'agua_objetivo_ml',
  'notas_hidratacion',
  'notas_suplementacion',
  'notas_protocolos',
];

export async function POST(request) {
  const user = await getUser();
  const ownerId = getOwnerId(user);
  if (!ownerId) return forbidden('No autorizado');

  try {
    const body = await request.json();
    const action = clean(body.action || 'create');
    const supabase = getSupabaseAdmin();

    if (action === 'create') {
      const nombre = clean(body.nombre);
      const temporada = clean(body.temporada) || currentSeason();
      const descripcion = clean(body.descripcion) || null;

      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del equipo es obligatorio' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('equipos')
        .insert({ owner_id: ownerId, nombre, temporada, descripcion })
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json({ equipo: data }, { status: 201 });
    }

    if (action === 'delete') {
      const teamId = clean(body.team_id);
      const team = await getOwnedTeam(supabase, user, teamId);
      if (!team) return forbidden('No tienes acceso a este equipo');

      const { error } = await supabase.from('equipos').delete().eq('id', team.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'copy_season') {
      const teamId = clean(body.team_id);
      const nombre = clean(body.nombre);
      const temporada = clean(body.temporada);
      const sourceTeam = await getOwnedTeam(supabase, user, teamId);
      if (!sourceTeam) return forbidden('No tienes acceso a este equipo');
      if (!temporada) {
        return NextResponse.json({ error: 'La temporada destino es obligatoria' }, { status: 400 });
      }

      const { data: newTeam, error: teamError } = await supabase
        .from('equipos')
        .insert({
          owner_id: ownerId,
          nombre: nombre || sourceTeam.nombre,
          temporada,
          descripcion: sourceTeam.descripcion,
        })
        .select('*')
        .single();

      if (teamError) throw teamError;

      const { data: players, error: playersError } = await supabase
        .from('jugadores')
        .select(`id,${PLAYER_COPY_FIELDS.join(',')}`)
        .eq('equipo_id', sourceTeam.id)
        .order('nombre');

      if (playersError) throw playersError;

      let copiedPlayers = 0;
      for (const player of players || []) {
        const sourcePlayerId = player.id;
        const payload = Object.fromEntries(
          PLAYER_COPY_FIELDS.map((field) => [field, player[field] ?? null])
        );

        const { data: newPlayer, error: playerError } = await supabase
          .from('jugadores')
          .insert({ ...payload, equipo_id: newTeam.id })
          .select('id')
          .single();

        if (playerError) throw playerError;
        copiedPlayers++;

        const { data: evolutions, error: evolutionsError } = await supabase
          .from('evoluciones')
          .select('*')
          .eq('jugador_id', sourcePlayerId)
          .order('fecha');

        if (evolutionsError) throw evolutionsError;

        const evolutionPayloads = (evolutions || []).map(({ id, jugador_id, created_at, ...evolution }) => ({
          ...evolution,
          jugador_id: newPlayer.id,
        }));

        if (evolutionPayloads.length) {
          const { error: insertEvolutionsError } = await supabase
            .from('evoluciones')
            .insert(evolutionPayloads);
          if (insertEvolutionsError) throw insertEvolutionsError;
        }
      }

      return NextResponse.json({ equipo: newTeam, copiedPlayers });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('Teams API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
