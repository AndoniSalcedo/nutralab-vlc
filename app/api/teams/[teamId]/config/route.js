import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { getOwnerId } from '@/lib/team-access';

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
    const { data: team, error: checkError } = await supabase
      .from('equipos')
      .select('id')
      .eq('id', teamId)
      .eq('owner_id', ownerId)
      .single();

    if (checkError || !team) {
      return NextResponse.json({ error: 'Equipo no encontrado o sin permisos' }, { status: 404 });
    }

    // Actualizar configuración
    const { error: updateError } = await supabase
      .from('equipos')
      .update({ configuracion_nutricional })
      .eq('id', teamId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating team config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
