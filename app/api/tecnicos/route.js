import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { forbidden, getOwnerId } from '@/lib/team-access';

async function findAuthUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

export async function GET() {
  try {
    const user = await getUser();
    const ownerId = getOwnerId(user);
    if (!ownerId) return forbidden('No autorizado');

    const supabase = getSupabaseAdmin();

    // 1. Obtener técnicos vinculados a este nutricionista
    const { data: links, error: linksError } = await supabase
      .from('nutricionista_tecnicos')
      .select('tecnico_id, tecnicos(*)')
      .eq('nutricionista_id', ownerId);

    if (linksError) throw linksError;

    const tecnicos = (links || []).map((l) => l.tecnicos).filter(Boolean);

    // 2. Obtener las asignaciones de equipos para estos técnicos
    const tecnicoIds = tecnicos.map((t) => t.id);
    let assignments = [];

    if (tecnicoIds.length > 0) {
      const { data, error } = await supabase
        .from('tecnico_equipos')
        .select('tecnico_id, equipo_id')
        .in('tecnico_id', tecnicoIds);

      if (error) throw error;
      assignments = data || [];
    }

    const assignmentsMap = new Map();
    for (const assoc of assignments) {
      const tId = assoc.tecnico_id;
      const current = assignmentsMap.get(tId) || [];
      current.push(assoc.equipo_id);
      assignmentsMap.set(tId, current);
    }

    const result = tecnicos.map((tecnico) => ({
      ...tecnico,
      team_ids: assignmentsMap.get(tecnico.id) || [],
    }));

    return NextResponse.json({ tecnicos: result });
  } catch (error) {
    console.error('Error fetching tecnicos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = String(body.action || 'create').trim();
    const supabase = getSupabaseAdmin();

    // Registro público de técnico (no requiere login de admin)
    if (action === 'register') {
      const nombre = String(body.nombre || '').trim();
      const apellidos = String(body.apellidos || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '').trim();

      if (!nombre || !email || !password) {
        return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
      }

      // Comprobar primero si ya hay un técnico registrado con este email en la BD
      const { data: existingTecnico } = await supabase
        .from('tecnicos')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingTecnico) {
        return NextResponse.json(
          { error: 'Este email ya está registrado como técnico. Puedes iniciar sesión directamente.' },
          { status: 400 }
        );
      }

      // Comprobar si ya existe el usuario en Supabase Auth (por ejemplo, porque también es jugador)
      const existingUser = await findAuthUserByEmail(supabase, email);
      let authUserId = null;
      let isNewAuthUser = false;

      if (existingUser) {
        // Reutilizar usuario en Auth y actualizar contraseña y metadatos
        authUserId = existingUser.id;
        const { error: updateAuthError } = await supabase.auth.admin.updateUserById(authUserId, {
          password,
          email_confirm: true,
          user_metadata: {
            ...(existingUser.user_metadata || {}),
            role: 'tecnico',
            name: `${nombre} ${apellidos}`.trim(),
          },
        });
        if (updateAuthError) throw updateAuthError;
      } else {
        // 1. Crear el usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: 'tecnico',
            name: `${nombre} ${apellidos}`.trim(),
          },
        });

        if (authError) throw authError;
        authUserId = authData.user.id;
        isNewAuthUser = true;
      }

      // 2. Crear el técnico en la base de datos de teams
      const { data: tecnico, error: dbError } = await supabase
        .from('tecnicos')
        .insert({
          auth_user_id: authUserId,
          nombre,
          apellidos,
          email,
          owner_id: null, // independiente
        })
        .select('*')
        .single();

      if (dbError) {
        // Rollback Auth user creation ONLY if we created it in this request
        if (isNewAuthUser && authUserId) {
          await supabase.auth.admin.deleteUser(authUserId);
        }
        throw dbError;
      }

      return NextResponse.json({ tecnico }, { status: 201 });
    }

    // Todas las demás acciones requieren autenticación de administrador (nutricionista)
    const user = await getUser();
    const ownerId = getOwnerId(user);
    if (!ownerId) return forbidden('No autorizado');

    if (action === 'create') {
      const email = String(body.email || '').trim().toLowerCase();

      if (!email) {
        return NextResponse.json({ error: 'Falta el email del técnico' }, { status: 400 });
      }

      // 1. Buscar al técnico registrado por email
      const { data: tecnico, error: searchError } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (searchError) throw searchError;
      if (!tecnico) {
        return NextResponse.json({
          error: 'No se encontró ningún técnico registrado con este correo. Por favor, indícale al técnico que se registre primero en la pantalla de acceso.'
        }, { status: 404 });
      }

      // 2. Vincular al técnico con el nutricionista actual
      const { error: linkError } = await supabase
        .from('nutricionista_tecnicos')
        .upsert({
          nutricionista_id: ownerId,
          tecnico_id: tecnico.id,
          status: 'accepted',
        }, { onConflict: 'nutricionista_id,tecnico_id' });

      if (linkError) throw linkError;

      return NextResponse.json({ tecnico }, { status: 200 });
    }

    if (action === 'delete') {
      const id = body.id;
      if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

      // 1. Eliminar vinculación nutricionista-técnico
      const { error: deleteLinkErr } = await supabase
        .from('nutricionista_tecnicos')
        .delete()
        .eq('nutricionista_id', ownerId)
        .eq('tecnico_id', id);

      if (deleteLinkErr) throw deleteLinkErr;

      // 2. Eliminar de tecnico_equipos los equipos de este nutricionista
      const { data: myTeams } = await supabase
        .from('equipos')
        .select('id')
        .eq('owner_id', ownerId);
      const myTeamIds = (myTeams || []).map((t) => t.id);

      if (myTeamIds.length > 0) {
        await supabase
          .from('tecnico_equipos')
          .delete()
          .eq('tecnico_id', id)
          .in('equipo_id', myTeamIds);
      }

      return NextResponse.json({ ok: true });
    }

    if (action === 'assign') {
      const tecnicoId = body.tecnico_id;
      const teamIds = Array.isArray(body.team_ids) ? body.team_ids : [];

      if (!tecnicoId) return NextResponse.json({ error: 'Falta tecnico_id' }, { status: 400 });

      // Verificar técnico está vinculado a este nutricionista
      const { data: link, error: linkError } = await supabase
        .from('nutricionista_tecnicos')
        .select('id')
        .eq('nutricionista_id', ownerId)
        .eq('tecnico_id', tecnicoId)
        .maybeSingle();

      if (linkError) throw linkError;
      if (!link) return forbidden('No tienes acceso a este técnico');

      // Validar que todos los equipos asignados pertenezcan a este dueño
      if (teamIds.length > 0) {
        const { data: validTeams, error: teamsError } = await supabase
          .from('equipos')
          .select('id')
          .eq('owner_id', ownerId)
          .in('id', teamIds);

        if (teamsError) throw teamsError;

        if ((validTeams || []).length !== teamIds.length) {
          return forbidden('Intento de asignar equipos sin acceso');
        }
      }

      // 1. Obtener todos los equipos del nutricionista actual
      const { data: myTeams } = await supabase
        .from('equipos')
        .select('id')
        .eq('owner_id', ownerId);
      const myTeamIds = (myTeams || []).map((t) => t.id);

      // 2. Eliminar solo las asignaciones de los equipos del nutricionista actual
      if (myTeamIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('tecnico_equipos')
          .delete()
          .eq('tecnico_id', tecnicoId)
          .in('equipo_id', myTeamIds);

        if (deleteError) throw deleteError;
      }

      // 3. Insertar nuevas asignaciones
      if (teamIds.length > 0) {
        const rows = teamIds.map((teamId) => ({
          tecnico_id: tecnicoId,
          equipo_id: teamId,
        }));

        const { error: insertError } = await supabase
          .from('tecnico_equipos')
          .insert(rows);

        if (insertError) throw insertError;
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('Tecnicos API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
