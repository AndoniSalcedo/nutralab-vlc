'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getOwnedTeam } from '@/lib/auth/team-access';
import { updateTeamConfig } from '@/repositories/teamRepository';

export async function transferProtocolAction(payload) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  const { action, sourceTeamId, targetTeamId, protocol, targetDayTypeKey } = payload || {};
  if (!['copy', 'move'].includes(action)) {
    throw new Error('Acción no válida');
  }

  if (!sourceTeamId || !targetTeamId || !protocol || !targetDayTypeKey) {
    throw new Error('Parámetros incompletos para transferir el protocolo');
  }

  const supabase = getSupabaseAdmin();
  const sourceTeam = await getOwnedTeam(supabase, user, sourceTeamId);
  const targetTeam = await getOwnedTeam(supabase, user, targetTeamId);

  if (!sourceTeam || !targetTeam) {
    throw new Error('No tienes acceso a los equipos seleccionados');
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
    revalidatePath(`/dashboard/equipo/${sourceTeamId}/configuracion`);
  }

  revalidatePath(`/dashboard/equipo/${targetTeamId}/configuracion`);

  return {
    success: true,
    action,
    targetProtocol: newProtocol
  };
}

export async function batchImportProtocolsAction({ sourceTeamId, targetTeamId, protocols }) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    throw new Error('No autorizado');
  }

  if (!sourceTeamId || !targetTeamId || !Array.isArray(protocols) || protocols.length === 0) {
    throw new Error('Parámetros de importación incompletos');
  }

  const supabase = getSupabaseAdmin();
  const sourceTeam = await getOwnedTeam(supabase, user, sourceTeamId);
  const targetTeam = await getOwnedTeam(supabase, user, targetTeamId);

  if (!sourceTeam || !targetTeam) {
    throw new Error('No tienes acceso a los equipos seleccionados');
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
  revalidatePath(`/dashboard/equipo/${targetTeamId}/configuracion`);

  return {
    success: true,
    importedCount: imported.length,
    imported
  };
}

export {
  transferProtocolAction as transferProtocol,
  batchImportProtocolsAction as batchImportProtocols,
};
