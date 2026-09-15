import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { forbidden, getOwnerId } from '@/lib/auth/team-access';
import {
  getTecnicosByOwner,
  getTecnicoByEmail,
  createTecnicoRecord,
  linkTecnicoToNutricionista,
  unlinkTecnicoFromNutricionista,
  getNutricionistaTecnicoLink,
  assignTeamsToTecnico,
} from '@/repositories/tecnicoRepository';

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
    const result = await getTecnicosByOwner(supabase, ownerId);
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
      const existingTecnico = await getTecnicoByEmail(supabase, email);
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

      try {
        const tecnico = await createTecnicoRecord(supabase, {
          auth_user_id: authUserId,
          nombre,
          apellidos,
          email,
          owner_id: null,
        });

        return NextResponse.json({ tecnico }, { status: 201 });
      } catch (dbError) {
        if (isNewAuthUser && authUserId) {
          await supabase.auth.admin.deleteUser(authUserId);
        }
        throw dbError;
      }
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

      const tecnico = await getTecnicoByEmail(supabase, email);
      if (!tecnico) {
        return NextResponse.json({
          error: 'No se encontró ningún técnico registrado con este correo. Por favor, indícale al técnico que se registre primero en la pantalla de acceso.'
        }, { status: 404 });
      }

      await linkTecnicoToNutricionista(supabase, ownerId, tecnico.id);

      return NextResponse.json({ tecnico }, { status: 200 });
    }

    if (action === 'delete') {
      const id = body.id;
      if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

      await unlinkTecnicoFromNutricionista(supabase, ownerId, id);

      return NextResponse.json({ ok: true });
    }

    if (action === 'assign') {
      const tecnicoId = body.tecnico_id;
      const teamIds = Array.isArray(body.team_ids) ? body.team_ids : [];

      if (!tecnicoId) return NextResponse.json({ error: 'Falta tecnico_id' }, { status: 400 });

      const link = await getNutricionistaTecnicoLink(supabase, ownerId, tecnicoId);
      if (!link) return forbidden('No tienes acceso a este técnico');

      await assignTeamsToTecnico(supabase, ownerId, tecnicoId, teamIds);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('Tecnicos API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
