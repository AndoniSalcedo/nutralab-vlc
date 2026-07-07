import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import NutritionPlanCardDocument from '@/lib/reports/NutritionPlanCardDocument';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sanitizeFilename(value) {
  const filename = String(value || 'Ficha_Nutricional')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return filename || 'Ficha_Nutricional';
}

function pdfHeaders(filename, length) {
  return {
    'Content-Type': 'application/pdf',
    'Content-Length': String(length),
    'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'Cache-Control': 'no-store',
  };
}

export async function GET(_request, { params }) {
  try {
    const planId = params?.id;
    if (!planId) return NextResponse.json({ error: 'Falta id del plan' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: plan, error } = await supabase
      .from('planes_ia')
      .select('id,jugador_id,nombre,datos')
      .eq('id', planId)
      .single();

    if (error) throw error;
    if (!plan?.datos) return NextResponse.json({ error: 'Este plan no tiene datos de ficha para PDF' }, { status: 400 });

    if (user.role === 'jugador') {
      if (String(user.id) !== String(plan.jugador_id)) return forbidden();
    } else {
      const ownedPlayer = await getOwnedPlayer(supabase, user, plan.jugador_id);
      if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');
    }

    let weeklyReportMeta = null;
    const { data: jugador } = await supabase
      .from('jugadores')
      .select('equipo_id, equipos(configuracion_nutricional)')
      .eq('id', plan.jugador_id)
      .single();

    const teamConfig = jugador?.equipos?.configuracion_nutricional;

    let semana = plan.datos?.meta?.semanaMenu;
    if (!semana && plan.datos?.meta?.fecha) {
      const d = new Date(plan.datos.meta.fecha);
      if (!Number.isNaN(d.getTime())) {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        semana = monday.toISOString().split('T')[0];
      }
    }

    if (jugador?.equipo_id && semana) {
      const { data: report } = await supabase
        .from('informes_semanales')
        .select('meta')
        .eq('equipo_id', jugador.equipo_id)
        .eq('semana', semana)
        .maybeSingle();
      if (report) {
        weeklyReportMeta = report.meta;
      }
    }

    const stream = await renderToStream(
      <NutritionPlanCardDocument data={plan.datos} weeklyReportMeta={weeklyReportMeta} teamConfig={teamConfig} />
    );
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const filename = `${sanitizeFilename(`Ficha_${plan.nombre}`)}.pdf`;

    return new NextResponse(uint8Array, {
      status: 200,
      headers: pdfHeaders(filename, buffer.length),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
