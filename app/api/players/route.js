import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(request) {
  const url = new URL(request.url);
  const deleting = url.searchParams.get('delete') === '1';
  const form = await request.formData();
  const id = String(form.get('id') || '');
  const supabase = getSupabaseAdmin();

  if (deleting && id) {
    await supabase.from('jugadores').delete().eq('id', id);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const payload = {
    nombre: String(form.get('nombre') || ''),
    apellidos: String(form.get('apellidos') || ''),
    posicion: String(form.get('posicion') || ''),
    altura_cm: toNumber(form.get('altura_cm')),
    peso_kg: toNumber(form.get('peso_kg')),
    porcentaje_grasa: toNumber(form.get('porcentaje_grasa')),
    masa_magra_kg: toNumber(form.get('masa_magra_kg')),
    factor_actividad: toNumber(form.get('factor_actividad')),
    gustos_preferencias: String(form.get('gustos_preferencias') || ''),
    contexto_clinico: String(form.get('contexto_clinico') || ''),
    objetivo: String(form.get('objetivo') || ''),
    kcal_objetivo: toNumber(form.get('kcal_objetivo')),
    cho_objetivo_g: toNumber(form.get('cho_objetivo_g')),
    proteina_objetivo_g: toNumber(form.get('proteina_objetivo_g')),
    grasa_objetivo_g: toNumber(form.get('grasa_objetivo_g')),
    agua_objetivo_ml: toNumber(form.get('agua_objetivo_ml')),
  };

  if (id) {
    await supabase.from('jugadores').update(payload).eq('id', id);
  } else {
    await supabase.from('jugadores').insert(payload);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url), 303);
}
