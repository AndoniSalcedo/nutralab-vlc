import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedTeam } from '@/lib/team-access';
import {
  TYPED_MEASUREMENT_FIELDS,
  buildImportPlan,
  parsePlayerExcel,
  toPreviewResponse,
} from '@/lib/player-excel-import';

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function cleanText(value) {
  return String(value || '').trim();
}

function playerUpdatePayload(group, existingPlayer) {
  const payload = {};
  if (group.fechaNacimiento && !existingPlayer?.fecha_nacimiento) {
    payload.fecha_nacimiento = group.fechaNacimiento;
  }
  return payload;
}

async function loadTeamPlayers(supabase, teamId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id,nombre,apellidos,fecha_nacimiento')
    .eq('equipo_id', teamId)
    .order('nombre');

  if (error) throw error;
  return data || [];
}

async function createPlayer(supabase, teamId, group) {
  const { data, error } = await supabase
    .from('jugadores')
    .insert({
      equipo_id: teamId,
      nombre: cleanText(group.nombre || group.nombreCompleto),
      apellidos: cleanText(group.apellidos),
      fecha_nacimiento: group.fechaNacimiento || null,
      factor_actividad: 1.6,
    })
    .select('id,nombre,apellidos,fecha_nacimiento')
    .single();

  if (error) throw error;
  return data;
}

async function updatePlayerIfNeeded(supabase, player, group) {
  const payload = playerUpdatePayload(group, player);
  if (!Object.keys(payload).length) return player;

  const { data, error } = await supabase
    .from('jugadores')
    .update(payload)
    .eq('id', player.id)
    .select('id,nombre,apellidos,fecha_nacimiento')
    .single();

  if (error) throw error;
  return data || { ...player, ...payload };
}

function measurementPayload(jugadorId, measurement, existing = null) {
  const payload = {
    jugador_id: jugadorId,
    fecha: measurement.fecha,
    metricas_excel: {
      ...(existing?.metricas_excel && typeof existing.metricas_excel === 'object' ? existing.metricas_excel : {}),
      ...measurement.metricasExcel,
    },
    fuente_hoja: measurement.sourceSheet,
    fuente_fila: measurement.sourceRow,
    fecha_original_excel: measurement.originalDate || null,
    fecha_corregida: measurement.dateCorrected,
  };

  if (!existing?.notas) {
    payload.notas = `Importado desde Excel: ${measurement.sourceSheet}`;
  }

  for (const field of TYPED_MEASUREMENT_FIELDS) {
    const value = measurement.typed[field];
    if (value !== null && value !== undefined) {
      payload[field] = value;
    } else if (!existing) {
      payload[field] = null;
    }
  }

  return payload;
}

async function saveMeasurement(supabase, jugadorId, measurement) {
  const { data: existing, error: existingError } = await supabase
    .from('evoluciones')
    .select('*')
    .eq('jugador_id', jugadorId)
    .eq('fecha', measurement.fecha)
    .maybeSingle();

  if (existingError) throw existingError;

  const payload = measurementPayload(jugadorId, measurement, existing);

  if (existing) {
    const { error } = await supabase
      .from('evoluciones')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw error;
    return 'actualizada';
  }

  const { error } = await supabase
    .from('evoluciones')
    .insert(payload);
  if (error) throw error;
  return 'creada';
}

function resolveDecision(group, decisions) {
  const decision = decisions?.[group.key] || {};

  if (decision.action === 'skip') return { action: 'skip' };
  if (decision.action === 'create') return { action: 'create' };
  if (decision.action === 'update' && decision.jugador_id) {
    return { action: 'update', jugadorId: decision.jugador_id };
  }

  if (group.accion === 'actualizar' && group.jugadorId) {
    return { action: 'update', jugadorId: group.jugadorId };
  }
  if (group.accion === 'crear') return { action: 'create' };
  return { action: 'skip', reason: 'Pendiente de revisión' };
}

async function importGroups({ supabase, team, plan, players, decisions }) {
  const playersById = new Map(players.map((player) => [String(player.id), player]));
  const results = [];

  for (const group of plan) {
    const decision = resolveDecision(group, decisions);
    const baseResult = {
      key: group.key,
      nombre: group.nombreCompleto,
      accion: decision.action,
      mediciones_creadas: 0,
      mediciones_actualizadas: 0,
      mediciones_omitidas: 0,
    };

    try {
      if (decision.action === 'skip') {
        results.push({
          ...baseResult,
          accion: 'omitido',
          error: decision.reason || null,
        });
        continue;
      }

      let player = null;
      let playerAction = decision.action === 'create' ? 'creado' : 'actualizado';

      if (decision.action === 'create') {
        player = await createPlayer(supabase, team.id, group);
        playersById.set(String(player.id), player);
      } else {
        player = playersById.get(String(decision.jugadorId));
        if (!player) {
          throw new Error('El jugador seleccionado no pertenece a este equipo');
        }
        player = await updatePlayerIfNeeded(supabase, player, group);
        playersById.set(String(player.id), player);
      }

      for (const measurement of group.mediciones) {
        const status = await saveMeasurement(supabase, player.id, measurement);
        if (status === 'creada') baseResult.mediciones_creadas += 1;
        else baseResult.mediciones_actualizadas += 1;
      }

      results.push({
        ...baseResult,
        accion: playerAction,
        jugador_id: player.id,
      });
    } catch (error) {
      results.push({
        ...baseResult,
        accion: 'error',
        error: error.message,
      });
    }
  }

  return results;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const mode = cleanText(formData.get('modo') || 'preview');
    const teamId = cleanText(formData.get('team_id'));

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Sin archivo Excel' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

    const team = await getOwnedTeam(supabase, user, teamId);
    if (!team) return forbidden('Debes importar dentro de un equipo propio');

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parsePlayerExcel(buffer);
    const players = await loadTeamPlayers(supabase, team.id);
    const plan = buildImportPlan(parsed, players);

    if (mode === 'preview') {
      return NextResponse.json(toPreviewResponse(parsed, plan));
    }

    if (mode !== 'importar') {
      return NextResponse.json({ error: 'Modo de importación no soportado' }, { status: 400 });
    }

    const decisions = parseJson(formData.get('decisiones'), {});
    const resultados = await importGroups({ supabase, team, plan, players, decisions });
    const okResults = resultados.filter((result) => !result.error && result.accion !== 'omitido');

    return NextResponse.json({
      ok: true,
      resumen: {
        jugadores: resultados.length,
        jugadores_importados: okResults.length,
        mediciones_creadas: resultados.reduce((sum, result) => sum + Number(result.mediciones_creadas || 0), 0),
        mediciones_actualizadas: resultados.reduce((sum, result) => sum + Number(result.mediciones_actualizadas || 0), 0),
        errores: resultados.filter((result) => result.error).length,
      },
      resultados,
    });
  } catch (error) {
    console.error('API Error (import-player-excel):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
