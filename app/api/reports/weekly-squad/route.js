import React from 'react';
import { NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getOwnedTeam } from '@/lib/team-access';
import { withLatestMeasurement } from '@/lib/player-metrics';
import WeeklySquadReportDocument from '@/lib/reports/WeeklySquadReportDocument';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sanitizeFilename(value) {
  return String(value || 'Informe_Semanal')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

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
  };
}

async function blobToBuffer(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request) {
  const user = await getUser();
  if (!user || user.role === 'jugador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const meta = defaultMeta(body?.meta);
    const jugadorIds = normalizeIds(body?.jugadorIds);
    const supabase = getSupabaseAdmin();
    const team = await getOwnedTeam(supabase, user, body?.team_id);
    if (!team) {
      return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 });
    }

    let playersQuery = supabase.from('jugadores').select('*').eq('equipo_id', team.id).order('nombre');
    if (jugadorIds.length) {
      playersQuery = playersQuery.in('id', jugadorIds);
    }

    const [resJugadores, resEvoluciones] = await Promise.all([
      playersQuery,
      supabase
        .from('evoluciones')
        .select('jugador_id,fecha,altura_cm,peso_kg,porcentaje_grasa,masa_magra_kg,suma_6_pliegues')
        .in('jugador_id', jugadorIds.length ? jugadorIds : [-1])
        .order('fecha', { ascending: true }),
    ]);

    if (resJugadores.error) throw resJugadores.error;
    if (resEvoluciones.error) throw resEvoluciones.error;

    let evoluciones = resEvoluciones.data || [];
    if (!jugadorIds.length) {
      const playerIds = (resJugadores.data || []).map((player) => player.id);
      const res = playerIds.length
        ? await supabase
            .from('evoluciones')
            .select('jugador_id,fecha,altura_cm,peso_kg,porcentaje_grasa,masa_magra_kg,suma_6_pliegues')
            .in('jugador_id', playerIds)
            .order('fecha', { ascending: true })
        : { data: [] };
      if (res.error) throw res.error;
      evoluciones = res.data || [];
    }
    const players = (resJugadores.data || []).map((player) => (
      withLatestMeasurement(
        player,
        evoluciones.filter((item) => String(item.jugador_id) === String(player.id))
      )
    ));

    if (!players.length) {
      return NextResponse.json({ error: 'No hay jugadores para generar el informe' }, { status: 400 });
    }

    const instance = pdf(<WeeklySquadReportDocument meta={meta} players={players} />);
    const blob = await instance.toBlob();
    const buffer = await blobToBuffer(blob);
    const scope = jugadorIds.length === 1 ? `${players[0].nombre || 'Jugador'}_${players[0].apellidos || ''}` : 'Plantilla';
    const filename = `${sanitizeFilename(`Informe_${meta.title}_${scope}`)}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating weekly squad report:', error);
    return NextResponse.json({ error: error.message || 'Error generando informe' }, { status: 500 });
  }
}
