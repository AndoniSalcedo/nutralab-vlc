import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { getUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/prisma';
import { getAccessibleTeam } from '@/lib/auth/team-access';
import { withLatestMeasurement } from '@/lib/metrics/player';
import WeeklySquadReportDocument from '@/components/reports/WeeklySquadReportDocument';
import { sanitizePlanData } from '@/lib/engine';
import { generatePlanDraft, resolvePlanMenu, savePlan, withReportMeta } from '@/lib/plans/generate';
import { sanitizeFilename, pdfHeaders as getPdfHeaders } from '@/lib/utils';
import { getPlayersByTeam } from '@/repositories/playerRepository';
import { getEvolutionsByPlayerIds } from '@/repositories/evolutionRepository';
import { getPesajesByPlayerIds } from '@/repositories/pesajeRepository';


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
    team: meta.team || 'Primer Equipo',
    author: meta.author || 'Carlos Ferrando · Nutralab',
    handle: meta.handle || '@c.ferrando',
    microcycle: meta.microcycle || 'DOM 10 · 16:15. Partido.\nJUE 14 · 19:00. Partido.\nDOM 17 · 19:00. Partido.',
    rules: meta.rules || 'Ningún día en déficit calórico. Carga glucogénica continua.\nPescado azul 4-5 tomas mínimo. Frutos rojos diarios.\nBatido post-entreno y post-partido obligatorio.\nHidratación reforzada y sueño 8 h.',
    buffet: meta.buffet || 'Desayuno y comidas usan exclusivamente las opciones disponibles del buffet. Las meriendas se hacen en casa con yogur de proteína, tortitas de arroz, fruta y frutos secos.',
    calendario: meta.calendario || {
      lunes: 'entreno',
      martes: 'entreno',
      miercoles: 'descanso',
      jueves: 'entreno',
      viernes: 'entreno',
      sabado: 'descanso',
      domingo: 'descanso',
    },
    preMatchConfig: meta.preMatchConfig || null,
  };
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.expose = status < 500;
  return error;
}


async function resolveTeam(db, user, teamId) {
  const team = await getAccessibleTeam(db, user, teamId);
  if (!team) {
    throw httpError('No tienes acceso a este equipo', 403);
  }

  return team;
}

async function runWithConcurrency(items, limit, fn) {
  const results = [];
  const index = { current: 0 };

  async function worker() {
    while (index.current < items.length) {
      const curIndex = index.current++;
      results[curIndex] = await fn(items[curIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function loadPlayersWithMeasurements(
  db,
  team,
  jugadorIds,
  semana,
  semanaMenu,
  { meta, nombre, persistPlans = true, draftPlans = null, user = null } = {}
) {
  const rawPlayers = await getPlayersByTeam(db, team.id);
  let players = rawPlayers || [];
  if (jugadorIds.length) {
    const idsSet = new Set(jugadorIds.map(String));
    players = players.filter((p) => idsSet.has(String(p.id)));
  }

  if (!players.length) {
    throw httpError('No hay jugadores para generar el informe', 400);
  }

  const playerIds = players.map((player) => player.id);
  const [evoluciones, pesajes] = await Promise.all([
    getEvolutionsByPlayerIds(db, playerIds),
    getPesajesByPlayerIds(db, playerIds),
  ]);

  const menu = await resolvePlanMenu(db, { semanaMenu, equipoId: team.id });

  async function persist(player, datos) {
    const saved = await savePlan(db, {
      jugadorId: player.id,
      nombre,
      datos: withReportMeta(datos, meta),
    });
    return saved || { datos };
  }

  const resolvedPlayers = await runWithConcurrency(players, 5, async (rawPlayer) => {
    const playerEvoluciones = (evoluciones || []).filter((item) => String(item.jugador_id) === String(rawPlayer.id));
    const playerPesajes = (pesajes || []).filter((item) => String(item.jugador_id) === String(rawPlayer.id));
    const player = withLatestMeasurement(rawPlayer, playerEvoluciones, playerPesajes);

    let activePlan = null;
    const draftPlan = draftPlans?.get(String(player.id));
    let planError = null;

    if (draftPlan) {
      // Un fallo al guardar un borrador aprobado aborta la petición: no se entrega un PDF de planes sin guardar
      activePlan = persistPlans ? await persist(player, draftPlan) : { datos: draftPlan };
    } else {
      try {
        const baseData = await generatePlanDraft(db, {
          jugador: player,
          nombre,
          menu,
          calendario: meta.calendario,
          preMatchConfig: meta.preMatchConfig,
          teamConfig: team.configuracion_nutricional,
          equipoId: team.id,
          equipoNombre: team.nombre,
          semana,
          user,
          origen: 'informe_equipo',
        });
        activePlan = persistPlans ? await persist(player, baseData) : { datos: baseData };
      } catch (err) {
        console.warn(`[weekly-squad] No se pudo generar el plan para ${player.nombre || player.id}:`, err.message);
        planError = err.message;
      }
    }

    return { ...player, plan: activePlan?.datos || null, error: planError };
  });

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
  if (!error?.expose) console.error('[weekly-squad]', error);
  return NextResponse.json(
    // Los errores 5xx/desconocidos no exponen detalles internos al cliente.
    { error: error?.expose ? error.message : fallback },
    { status: error?.expose ? error.status : 500 }
  );
}

export async function POST(request) {
  const user = await getUser();
  if (!user || user.role === 'jugador' || user.role === 'tecnico') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const db = getDb();

  try {
    const body = await request.json();
    const meta = defaultMeta({ ...body?.meta, calendario: body?.calendario || body?.meta?.calendario });
    const jugadorIds = normalizeIds(body?.jugadorIds);
    const semanaMenu = body?.semanaMenu || body?.meta?.semanaMenu;

    const team = await resolveTeam(db, user, body?.team_id);
    let semana = body?.meta?.semana;
    const generateOnly = !!body?.generateOnly;
    const previewOnly = !!body?.previewOnly;
    const commitDraft = !!body?.commitDraft;
    const downloadOnly = !!body?.downloadOnly;

    if (!semana) {
      semana = new Date().toISOString().split('T')[0];
    }
    const nombre = String(body?.nombre || '').trim() || `Plan ${semana}`;

    const draftPlayers = Array.isArray(body?.draftPlayers) ? body.draftPlayers : [];
    const draftPlans = new Map(
      draftPlayers
        .filter((item) => item?.id && item?.plan && typeof item.plan === 'object')
        .map((item) => [String(item.id), sanitizePlanData(item.plan, team.configuracion_nutricional)])
    );

    if (commitDraft && draftPlans.size !== jugadorIds.length) {
      throw httpError('El borrador de validación no contiene todos los jugadores seleccionados', 400);
    }

    const hasDraftPlans = draftPlans.size > 0;
    const shouldPersist = !previewOnly && !downloadOnly;

    const players = await loadPlayersWithMeasurements(db, team, jugadorIds, semana, semanaMenu, {
      meta,
      nombre,
      persistPlans: shouldPersist,
      draftPlans: hasDraftPlans ? draftPlans : null,
      user,
    });

    if (commitDraft && players.length !== jugadorIds.length) {
      throw httpError('Alguno de los jugadores seleccionados no pertenece a este equipo', 403);
    }

    if (previewOnly || generateOnly) {
      return NextResponse.json({
        success: true,
        generatedPlayers: players.map((p) => p.id),
        preview: players.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          apellidos: p.apellidos,
          posicion: p.posicion,
          plan: p.plan,
          error: p.error || null,
        })),
        semana,
      });
    }

    const playersToRender = players.filter((p) => p.plan);
    if (!playersToRender.length) {
      throw httpError('No se pudo generar ningún plan válido para los jugadores seleccionados', 400);
    }

    return renderReportResponse(meta, playersToRender, semana, team.configuracion_nutricional);
  } catch (error) {
    console.error('Error generating weekly squad report:', error);
    return jsonError(error);
  }
}
