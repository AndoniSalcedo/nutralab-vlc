import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getAccessiblePlayer } from '@/lib/team-access';
import NutritionPlanCardDocument from '@/lib/reports/NutritionPlanCardDocument';
import { sanitizeFilename, pdfHeaders } from '@/lib/utils';
import { getAiPlanById } from '@/repositories/aiPlanRepository';
import { getPlayerWithTeamConfig } from '@/repositories/playerRepository';
import { getWeeklyReport } from '@/repositories/weeklyReportsRepository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function GET(_request, { params }) {
  try {
    const planId = params?.id;
    if (!planId) return NextResponse.json({ error: 'Falta id del plan' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const plan = await getAiPlanById(supabase, planId);
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    if (!plan.datos) return NextResponse.json({ error: 'Este plan no tiene datos de ficha para PDF' }, { status: 400 });

    if (user.role === 'jugador') {
      if (String(user.id) !== String(plan.jugador_id)) return forbidden();
    } else {
      const accessiblePlayer = await getAccessiblePlayer(supabase, user, plan.jugador_id);
      if (!accessiblePlayer) return forbidden('No tienes acceso a este jugador');
    }

    let weeklyReportMeta = null;
    const jugador = await getPlayerWithTeamConfig(supabase, plan.jugador_id);

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
      const report = await getWeeklyReport(supabase, jugador.equipo_id, semana);
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
    const filename = `${sanitizeFilename(`Ficha_${plan.nombre}`, 'Ficha_Nutricional')}.pdf`;

    return new NextResponse(uint8Array, {
      status: 200,
      headers: pdfHeaders(filename, buffer.length),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

