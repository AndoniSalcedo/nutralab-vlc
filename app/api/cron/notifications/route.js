import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import { runPlayerReminders } from '@/services/reminders';

// Recorre a todos los jugadores con avisos (incluida la línea de tiempo del día de partido)
export const maxDuration = 60;

// Vercel Cron envía `Authorization: Bearer $CRON_SECRET`; cualquier otro planificador debe hacer lo mismo
function isAuthorized(request) {
  if (!env.CRON_SECRET) return false;
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const received = Buffer.from(request.headers.get('authorization') || '');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const result = await runPlayerReminders();
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[cron/notifications]', error);
    return NextResponse.json({ error: 'Error enviando recordatorios' }, { status: 500 });
  }
}
