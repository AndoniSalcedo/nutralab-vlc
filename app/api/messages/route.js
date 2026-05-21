import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeRecipientIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0)
  ));
}

export async function GET(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const url = new URL(request.url);
  const jugadorId = user.role === 'jugador'
    ? Number(user.id)
    : Number(url.searchParams.get('jugador_id'));

  if (!jugadorId) {
    return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });
  }

  if (user.role === 'jugador' && String(user.id) !== String(jugadorId)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('mensajes')
    .select('id,jugador_id,titulo,contenido,created_by_name,created_at')
    .or(`jugador_id.is.null,jugador_id.eq.${jugadorId}`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data || [] });
}

export async function POST(request) {
  const user = await getUser();
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const titulo = cleanText(body.titulo);
  const contenido = cleanText(body.contenido);
  const sendToAll = Boolean(body.sendToAll);
  const recipientIds = normalizeRecipientIds(body.recipientIds);

  if (!titulo || !contenido) {
    return NextResponse.json({ error: 'Título y mensaje son obligatorios' }, { status: 400 });
  }

  if (!sendToAll && recipientIds.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos un jugador' }, { status: 400 });
  }

  const base = {
    titulo,
    contenido,
    created_by: user.email || user.id || null,
    created_by_name: user.name || user.username || 'Nutricionista',
  };

  const rows = sendToAll
    ? [{ ...base, jugador_id: null }]
    : recipientIds.map((jugadorId) => ({ ...base, jugador_id: jugadorId }));

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('mensajes')
    .insert(rows)
    .select('id,jugador_id,titulo,contenido,created_by_name,created_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data || [] }, { status: 201 });
}
