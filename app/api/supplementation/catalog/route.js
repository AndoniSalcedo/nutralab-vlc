import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getOwnedTeam } from '@/lib/team-access';

function canManage(user) {
  return user && user.role !== 'jugador';
}

function cleanText(value) {
  return String(value || '').trim();
}

function toPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function slugify(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function nextListOrder(supabase) {
  const { data } = await supabase
    .from('suplementacion_listas')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1);

  return Number(data?.[0]?.orden || 0) + 1;
}

export async function GET() {
  const user = await getUser();
  if (!canManage(user)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const [suplementosRes, listasRes, itemsRes] = await Promise.all([
    supabase.from('suplementos').select('*').order('nombre', { ascending: true }),
    supabase.from('suplementacion_listas').select('*').order('orden', { ascending: true }),
    supabase.from('suplementacion_lista_items').select('*').order('orden', { ascending: true }),
  ]);

  const firstError = [suplementosRes, listasRes, itemsRes].find((res) => res.error)?.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    suplementos: suplementosRes.data || [],
    listas: listasRes.data || [],
    items: itemsRes.data || [],
  });
}

export async function POST(request) {
  const user = await getUser();
  if (!canManage(user)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const action = cleanText(body.action);
  const supabase = getSupabaseAdmin();

  if (action === 'create_supplement') {
    const nombre = cleanText(body.nombre);
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre del suplemento es obligatorio' }, { status: 400 });
    }

    const slug = slugify(body.slug || nombre);
    const payload = {
      slug,
      nombre,
      categoria: cleanText(body.categoria) || 'Custom',
      descripcion: cleanText(body.descripcion) || null,
      pauta: cleanText(body.pauta) || 'Según producto.',
      timing: cleanText(body.timing) || 'Según pauta',
      dose_type: 'custom',
      dose_text: cleanText(body.dose_text || body.pauta) || 'Según producto',
      notas: cleanText(body.notas) || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('suplementos')
      .upsert(payload, { onConflict: 'slug' })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ suplemento: data }, { status: 201 });
  }

  if (action === 'update_supplement') {
    const id = toPositiveNumber(body.id);
    if (!id) {
      return NextResponse.json({ error: 'ID de suplemento no válido' }, { status: 400 });
    }

    const nombre = cleanText(body.nombre);
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre del suplemento es obligatorio' }, { status: 400 });
    }

    const payload = {
      nombre,
      categoria: cleanText(body.categoria) || 'Custom',
      descripcion: cleanText(body.descripcion) || null,
      pauta: cleanText(body.pauta) || 'Según producto.',
      timing: cleanText(body.timing) || 'Según pauta',
      dose_text: cleanText(body.dose_text || body.pauta) || 'Según producto',
      notas: cleanText(body.notas) || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('suplementos')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ suplemento: data }, { status: 200 });
  }

  if (action === 'delete_supplement') {
    const id = toPositiveNumber(body.id);
    if (!id) {
      return NextResponse.json({ error: 'ID de suplemento no válido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('suplementos')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'create_list') {
    const nombre = cleanText(body.nombre);
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre del catálogo es obligatorio' }, { status: 400 });
    }

    const slug = slugify(body.slug || nombre);
    const payload = {
      slug,
      nombre,
      orden: toPositiveNumber(body.orden) || await nextListOrder(supabase),
      descripcion: cleanText(body.descripcion) || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('suplementacion_listas')
      .upsert(payload, { onConflict: 'slug' })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lista: data }, { status: 201 });
  }

  if (action === 'add_item') {
    const listaId = toPositiveNumber(body.lista_id);
    const suplementoId = toPositiveNumber(body.suplemento_id);
    if (!listaId || !suplementoId) {
      return NextResponse.json({ error: 'Falta catálogo o suplemento' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('suplementacion_lista_items')
      .select('orden')
      .eq('lista_id', listaId)
      .order('orden', { ascending: false })
      .limit(1);

    const payload = {
      lista_id: listaId,
      suplemento_id: suplementoId,
      orden: Number(existing?.[0]?.orden || 0) + 1,
      notas: cleanText(body.notas) || null,
    };

    const { data, error } = await supabase
      .from('suplementacion_lista_items')
      .upsert(payload, { onConflict: 'lista_id,suplemento_id' })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data }, { status: 201 });
  }

  if (action === 'remove_item') {
    const itemId = toPositiveNumber(body.item_id);
    if (!itemId) {
      return NextResponse.json({ error: 'Falta item_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('suplementacion_lista_items')
      .delete()
      .eq('id', itemId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'assign_all') {
    const listaId = toPositiveNumber(body.lista_id);
    const team = await getOwnedTeam(supabase, user, body.team_id);
    if (!listaId) {
      return NextResponse.json({ error: 'Selecciona un catálogo' }, { status: 400 });
    }
    if (!team) {
      return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 });
    }

    const { data: players, error: playersError } = await supabase
      .from('jugadores')
      .select('id')
      .eq('equipo_id', team.id);

    if (playersError) return NextResponse.json({ error: playersError.message }, { status: 500 });

    const rows = (players || []).map((player) => ({
      jugador_id: player.id,
      lista_id: listaId,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length) {
      const { error } = await supabase
        .from('jugador_suplementacion')
        .upsert(rows, { onConflict: 'jugador_id' });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, assigned: rows.length });
  }

  return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
}
