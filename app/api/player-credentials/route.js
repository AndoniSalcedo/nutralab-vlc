import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getOwnedPlayer } from '@/lib/team-access';
import { getPlayerById, updatePlayer } from '@/repositories/playerRepository';

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function playerMetadata(jugador) {
  return {
    role: 'jugador',
    jugador_id: jugador.id,
    name: `${jugador.nombre} ${jugador.apellidos || ''}`.trim(),
  };
}

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

export async function POST(request) {
  try {
    const user = await getUser();
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { jugadorId, email, password } = await request.json();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!jugadorId) return NextResponse.json({ error: 'Falta jugador' }, { status: 400 });
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Introduce un correo válido' }, { status: 400 });
    }
    if (!isValidPassword(cleanPassword)) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
    if (!ownedPlayer) {
      return NextResponse.json({ error: 'No tienes acceso a este jugador' }, { status: 403 });
    }

    const jugador = await getPlayerById(supabase, jugadorId);

    if (!jugador) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    let authUserId = jugador.auth_user_id;
    const metadata = playerMetadata(jugador);

    if (authUserId) {
      const { error } = await supabase.auth.admin.updateUserById(authUserId, {
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) throw error;
    } else {
      const existingUser = await findAuthUserByEmail(supabase, cleanEmail);

      if (existingUser) {
        authUserId = existingUser.id;
        const { error } = await supabase.auth.admin.updateUserById(authUserId, {
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            ...(existingUser.user_metadata || {}),
            ...metadata,
          },
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: metadata,
        });
        if (error) throw error;
        authUserId = data.user.id;
      }
    }

    const updated = await updatePlayer(supabase, jugador.id, {
      auth_user_id: authUserId,
      auth_email: cleanEmail,
      credentials_created_at: new Date().toISOString(),
    });

    return NextResponse.json({ credentials: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Error creando credenciales' }, { status: 500 });
  }
}

