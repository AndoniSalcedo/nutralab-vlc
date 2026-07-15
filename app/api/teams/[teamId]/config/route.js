import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnerId } from '@/lib/team-access';
import { getTeamByIdAndOwner, updateTeamConfig } from '@/repositories/teamRepository';

export async function POST(request, { params }) {
  try {
    const user = await getUser();
    const ownerId = getOwnerId(user);
    if (!ownerId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { teamId } = params;
    const body = await request.json();
    const { configuracion_nutricional } = body;

    const supabase = getSupabaseAdmin();
    
    // Verificar que el equipo pertenece al usuario
    const team = await getTeamByIdAndOwner(supabase, teamId, ownerId);

    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado o sin permisos' }, { status: 404 });
    }

    // Actualizar configuración
    await updateTeamConfig(supabase, teamId, configuracion_nutricional);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating team config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

