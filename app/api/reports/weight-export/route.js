import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { getUser } from '@/lib/auth/session';
import { rateLimit } from '@/lib/security/rate-limit';
import { sanitizeFilename, pdfHeaders } from '@/lib/utils';
import WeightExportDocument from '@/components/reports/WeightExportDocument';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 1_000_000;
const MAX_ROWS = 1000;

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // Informes de plantilla: solo staff (los jugadores no deben poder generarlos).
    if (user.role === 'jugador') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const limited = rateLimit(`pdf:weight:${user.id}`, { limit: 20, windowMs: 60 * 1000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      );
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Petición demasiado grande' }, { status: 413 });
    }

    const body = await request.json();
    const {
      teamName = 'Plantilla',
      fecha = '',
      fechaFormatted = '',
      records = [],
      summary = {},
    } = body || {};

    if (Array.isArray(records) && records.length > MAX_ROWS) {
      return NextResponse.json({ error: 'Demasiados registros para exportar' }, { status: 400 });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No hay registros para exportar' }, { status: 400 });
    }

    const docElement = React.createElement(WeightExportDocument, {
      teamName,
      fechaFormatted: fechaFormatted || fecha,
      records,
      summary,
    });
    const stream = await renderToStream(docElement);

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const safeTeam = sanitizeFilename(teamName, 'Equipo');
    const safeDate = sanitizeFilename(fecha || 'Fecha', 'Medicion');
    const filename = `Toma_Pesos_${safeTeam}_${safeDate}.pdf`;

    return new NextResponse(uint8Array, {
      status: 200,
      headers: pdfHeaders(filename, buffer.length),
    });
  } catch (error) {
    console.error('Error al generar PDF de toma de pesos:', error);
    return NextResponse.json(
      { error: 'Error al generar el documento PDF' },
      { status: 500 }
    );
  }
}
