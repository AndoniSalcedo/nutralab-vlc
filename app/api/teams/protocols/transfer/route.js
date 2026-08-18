import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAccessibleTeam, forbidden } from '@/lib/team-access';
import { updateTeamConfig } from '@/repositories/teamRepository';

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return forbidden('No autenticado');

    const body = await request.json();
    const { action, sourceTeamId, targetTeamId, protocol, protocols, targetDayTypeKey } = body;
    const supabase = getSupabaseAdmin();

    if (action === 'batch_import') {
      if (!sourceTeamId || !targetTeamId || !Array.isArray(protocols) || protocols.length === 0) {
        return NextResponse.json({ error: 'Parámetros de importación incompletos' }, { status: 400 });
      }

      const sourceTeam = await getAccessibleTeam(supabase, user, sourceTeamId);
      const targetTeam = await getAccessibleTeam(supabase, user, targetTeamId);

      if (!sourceTeam || !targetTeam) {
        return forbidden('No tienes acceso a los equipos seleccionados');
      }

      const sourceConfig = sourceTeam.configuracion_nutricional || {};
      const sourceProtocols = sourceConfig.protocols || [];
      const targetConfig = targetTeam.configuracion_nutricional || {};
      const targetProtocols = [...(targetConfig.protocols || [])];

      const imported = [];
      for (const item of protocols) {
        const src = sourceProtocols.find(p => p.id === item.id);
        if (!src) continue;

        const newProt = {
          ...src,
          id: `prot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          dayTypeKey: item.targetDayTypeKey || src.dayTypeKey,
          name: item.name || src.name
        };
        targetProtocols.push(newProt);
        imported.push(newProt);
      }

      targetConfig.protocols = targetProtocols;
      await updateTeamConfig(supabase, targetTeamId, targetConfig);

      return NextResponse.json({ success: true, importedCount: imported.length, imported });
    }

    if (action === 'copy' || action === 'move') {
      if (!sourceTeamId || !targetTeamId || !protocol || !targetDayTypeKey) {
        return NextResponse.json({ error: 'Parámetros incompletos para transferir el protocolo' }, { status: 400 });
      }

      const sourceTeam = await getAccessibleTeam(supabase, user, sourceTeamId);
      const targetTeam = await getAccessibleTeam(supabase, user, targetTeamId);

      if (!sourceTeam || !targetTeam) {
        return forbidden('No tienes acceso a los equipos seleccionados');
      }

      const targetConfig = targetTeam.configuracion_nutricional || {};
      const targetProtocols = [...(targetConfig.protocols || [])];

      const newProtocol = {
        ...protocol,
        id: `prot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        dayTypeKey: targetDayTypeKey,
        name: protocol.name
      };
      targetProtocols.push(newProtocol);
      targetConfig.protocols = targetProtocols;

      await updateTeamConfig(supabase, targetTeamId, targetConfig);

      if (action === 'move') {
        const sourceConfig = sourceTeam.configuracion_nutricional || {};
        const sourceProtocols = (sourceConfig.protocols || []).filter(p => p.id !== protocol.id);
        sourceConfig.protocols = sourceProtocols;
        await updateTeamConfig(supabase, sourceTeamId, sourceConfig);
      }

      return NextResponse.json({ 
        success: true, 
        action, 
        targetProtocol: newProtocol 
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error in protocol transfer API:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
