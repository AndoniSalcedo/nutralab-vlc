import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getOwnedTeam } from '@/lib/team-access';
import { withLatestMeasurement } from '@/lib/player-metrics';
import WeeklySquadReportDocument from '@/lib/reports/WeeklySquadReportDocument';
import { planDataToLegacyContent } from '@/lib/nutrition-plan-card';
import { generarDatosPlan } from '@/lib/ai-plan-generator';
import { sanitizeFilename, pdfHeaders as getPdfHeaders } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


function normalizeIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function defaultMeta(meta = {}) {
  return {
    title: meta.title || 'Semana nutricional',
    subtitle: meta.subtitle || 'Plan nutricional',
    team: meta.team || 'Valencia CF · Primer Equipo',
    author: meta.author || 'Carlos Ferrando · Nutralab',
    handle: meta.handle || '@c.ferrando',
    microcycle: meta.microcycle || 'DOM 10 · 16:15. Partido.\nJUE 14 · 19:00. Partido.\nDOM 17 · 19:00. Partido.',
    rules: meta.rules || 'Ningun dia en deficit calorico. Carga glucogenica continua.\nPescado azul 4-5 tomas minimo. Frutos rojos diarios.\nBatido post-entreno y post-partido obligatorio.\nHidratacion reforzada y sueno 8 h.',
    buffet: meta.buffet || 'Desayuno y comidas usan exclusivamente las opciones disponibles del buffet. Las meriendas se hacen en casa con yogur de proteina, tortitas de arroz, fruta y frutos secos.',
    contexto: meta.contexto || 'semana_partido',
    calendario: meta.calendario || {
      lunes: 'entreno',
      martes: 'entreno',
      miercoles: 'descanso',
      jueves: 'entreno',
      viernes: 'entreno',
      sabado: 'descanso',
      domingo: 'descanso',
    },
  };
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}


async function resolveTeam(supabase, user, teamId) {
  if (user.role === 'jugador') {
    const { data: player, error } = await supabase
      .from('jugadores')
      .select('equipo_id')
      .eq('id', user.id)
      .single();

    if (error || !player?.equipo_id) {
      throw httpError('No tienes equipo asignado', 403);
    }

    const { data: team, error: teamError } = await supabase
      .from('equipos')
      .select('*')
      .eq('id', player.equipo_id)
      .single();

    if (teamError || !team) {
      throw httpError('No tienes acceso a este equipo', 403);
    }

    return team;
  }

  const team = await getOwnedTeam(supabase, user, teamId);
  if (!team) {
    throw httpError('No tienes acceso a este equipo', 403);
  }

  return team;
}

async function loadStoredMeta(supabase, teamId, semana) {
  if (!semana) return defaultMeta();

  const { data: informe, error } = await supabase
    .from('informes_semanales')
    .select('meta')
    .eq('equipo_id', teamId)
    .eq('semana', semana)
    .maybeSingle();

  if (error) throw error;

  return defaultMeta(informe?.meta);
}

async function persistWeeklyReport(supabase, teamId, meta, semana) {
  const semanaVal = semana || new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('informes_semanales')
    .upsert(
      {
        equipo_id: teamId,
        semana: semanaVal,
        meta: {
          ...meta,
          semana: semanaVal,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'equipo_id,semana' }
    );

  if (error) {
    console.error('Error saving weekly report configuration:', error);
    throw httpError(`Error al guardar el informe en la base de datos: ${error.message}`, 500);
  }

  return semanaVal;
}

async function loadPlayersWithMeasurements(supabase, team, jugadorIds, semana, calendario, semanaMenu, contexto, forceRegenerate = false) {
  let playersQuery = supabase.from('jugadores').select('*').eq('equipo_id', team.id).order('nombre');
  if (jugadorIds.length) {
    playersQuery = playersQuery.in('id', jugadorIds);
  }

  const { data: rawPlayers, error: playersError } = await playersQuery;
  if (playersError) throw playersError;

  const players = rawPlayers || [];
  if (!players.length) {
    throw httpError('No hay jugadores para generar el informe', 400);
  }

  const playerIds = players.map((player) => player.id);
  const { data: evoluciones, error: evolucionesError } = await supabase
    .from('evoluciones')
    .select('jugador_id,fecha,altura_cm,peso_kg,porcentaje_grasa,masa_magra_kg,peso_muscular,suma_6_pliegues,suma_8_pliegues,metricas_excel')
    .in('jugador_id', playerIds)
    .order('fecha', { ascending: true });

  if (evolucionesError) throw evolucionesError;

  // Load menu
  let menu = null;
  if (semanaMenu !== 'none') {
    const menuWeekKey = semanaMenu || semana;
    const { data: menuData } = await supabase
      .from('menu_semanal')
      .select('*')
      .eq('semana', menuWeekKey)
      .eq('equipo_id', team.id)
      .maybeSingle();
    menu = menuData || null;
  }

  // Load all plans for these players
  const { data: allPlans, error: plansError } = await supabase
    .from('planes_ia')
    .select('*')
    .in('jugador_id', playerIds);

  if (plansError) throw plansError;

  const resolvedPlayers = [];
  for (const rawPlayer of players) {
    const playerEvoluciones = (evoluciones || []).filter((item) => String(item.jugador_id) === String(rawPlayer.id));
    const player = withLatestMeasurement(rawPlayer, playerEvoluciones);

    // Find if player has plan for this week
    const playerPlans = (allPlans || []).filter((p) => String(p.jugador_id) === String(player.id));
    let activePlan = playerPlans.find((p) => p.nombre === `Plan ${semana}`);

    if (!activePlan || forceRegenerate) {
      // Create and save AI plan
      const baseData = await generarDatosPlan({
        jugador: player,
        nombre: `Plan ${semana}`,
        contexto: contexto || 'semana_partido',
        menu,
        calendario,
        teamConfig: team.configuracion_nutricional
      });
      const finalContenido = planDataToLegacyContent(baseData, team.configuracion_nutricional);

      if (activePlan) {
        // Overwrite existing plan
        const { error: updateError } = await supabase
          .from('planes_ia')
          .update({
            contexto: contexto || 'semana_partido',
            contenido: finalContenido,
            datos: baseData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', activePlan.id);

        if (updateError) {
          console.error('Error updating plan for player:', player.id, updateError);
        }
        activePlan.datos = baseData;
      } else {
        // Insert new plan
        const { data: newPlan, error: insertError } = await supabase
          .from('planes_ia')
          .insert({
            jugador_id: player.id,
            nombre: `Plan ${semana}`,
            contexto: contexto || 'semana_partido',
            contenido: finalContenido,
            datos: baseData,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting plan for player:', player.id, insertError);
        }
        activePlan = newPlan || { datos: baseData };
      }
    }

    resolvedPlayers.push({
      ...player,
      plan: activePlan.datos,
    });
  }

  return resolvedPlayers;
}

async function renderReportResponse(meta, players, semana, teamConfig) {
  const stream = await renderToStream(<WeeklySquadReportDocument meta={{ ...meta, semana }} players={players} teamConfig={teamConfig} />);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const scope = players.length === 1 ? `${players[0].nombre || 'Jugador'}_${players[0].apellidos || ''}` : 'Plantilla';
  const filename = `${sanitizeFilename(`Informe_${meta.title}_${scope}`, 'Informe_Semanal')}.pdf`;

  return new NextResponse(uint8Array, {
    status: 200,
    headers: getPdfHeaders(filename, buffer.length),
  });
}

function jsonError(error, fallback = 'Error generando informe') {
  return NextResponse.json(
    { error: error.message || fallback },
    { status: error.status || 500 }
  );
}

export async function POST(request) {
  const user = await getUser();
  if (!user || user.role === 'jugador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const body = await request.json();
    const meta = defaultMeta({ ...body?.meta, calendario: body?.calendario || body?.meta?.calendario });
    const jugadorIds = normalizeIds(body?.jugadorIds);
    const calendario = meta.calendario;
    const semanaMenu = body?.semanaMenu || body?.meta?.semanaMenu;

    const team = await resolveTeam(supabase, user, body?.team_id);
    let semana = body?.meta?.semana;

    semana = await persistWeeklyReport(supabase, team.id, { ...meta, semanaMenu }, semana);
    const players = await loadPlayersWithMeasurements(supabase, team, jugadorIds, semana, calendario, semanaMenu, meta.contexto, true);
    return renderReportResponse(meta, players, semana, team.configuracion_nutricional);
  } catch (error) {
    console.error('Error generating weekly squad report:', error);
    return jsonError(error);
  }
}

export async function GET(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const semanaParam = searchParams.get('semana');
  const paramJugadorId = searchParams.get('jugadorId');
  const paramTeamId = searchParams.get('teamId');

  const isPlayer = user.role === 'jugador';
  const supabase = getSupabaseAdmin();

  try {
    let jugadorIds = normalizeIds(paramJugadorId ? [paramJugadorId] : []);

    if (isPlayer) {
      jugadorIds = [Number(user.id)];
    }

    const team = await resolveTeam(supabase, user, paramTeamId);
    const meta = await loadStoredMeta(supabase, team.id, semanaParam);
    const players = await loadPlayersWithMeasurements(supabase, team, jugadorIds, semanaParam, meta?.calendario, meta?.semanaMenu, meta?.contexto);

    return renderReportResponse(meta, players, semanaParam, team.configuracion_nutricional);
  } catch (error) {
    console.error('Error generating weekly squad report (GET):', error);
    return jsonError(error);
  }
}
