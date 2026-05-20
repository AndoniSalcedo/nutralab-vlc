import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const client = new Anthropic();

const CONTEXTOS = {
  semana_normal: 'semana normal de entrenamiento (3-4 sesiones)',
  semana_partido: 'semana con partido oficial (microciclo competitivo)',
  dia_partido: 'dia de partido (ajuste maximo de timing nutricional)',
  viaje: 'viaje o desplazamiento para jugar fuera',
  lesion: 'periodo de lesion o inactividad reducida',
  vacaciones: 'periodo vacacional fuera de temporada',
  pretemporada: 'pretemporada (alta carga de trabajo)',
};

async function generarContenidoPlan({ jugador, contexto, contextoAdicional }) {
  const supabase = getSupabaseAdmin();
  const { data: menuData } = await supabase
      .from('menu_semanal')
      .select('*')
      .order('semana', { ascending: false })
      .limit(1)
      .single();

  let menuTexto = 'No hay menu semanal cargado en la ciudad deportiva.';
  if (menuData?.dias && menuData.dias.length > 0) {
    menuTexto = 'MENU CIUDAD DEPORTIVA (semana del ' + menuData.semana + '):\n';
    menuData.dias.forEach((dia) => {
      menuTexto += '\n' + dia.dia.toUpperCase() + ':\n';
      if (dia.comida) {
        menuTexto += '  Comida: ';
        const c = [dia.comida.primero, dia.comida.segundo, dia.comida.postre].filter(Boolean);
        menuTexto += c.join(' + ') + '\n';
      }
      if (dia.cena) {
        menuTexto += '  Cena: ';
        const c = [dia.cena.primero, dia.cena.segundo, dia.cena.postre].filter(Boolean);
        menuTexto += c.join(' + ') + '\n';
      }
    });
  }

  const kcal = jugador.kcal_objetivo || Math.round(500 + 22 * (jugador.masa_magra_kg || 70));
  const proteina = jugador.proteina_objetivo_g || Math.round((jugador.masa_magra_kg || 70) * 1.8);
  const cho = jugador.cho_objetivo_g || Math.round((jugador.peso_kg || 80) * 5);
  const grasa = jugador.grasa_objetivo_g || Math.round((kcal - proteina * 4 - cho * 4) / 9);
  const ingestas = jugador.num_comidas || '5 ingestas';

  const restricciones = [
    jugador.alergias ? 'ALERGIAS - OBLIGATORIO EVITAR: ' + jugador.alergias : null,
    jugador.intolerancias ? 'INTOLERANCIAS - OBLIGATORIO EVITAR: ' + jugador.intolerancias : null,
    jugador.aversiones ? 'AVERSIONES (no incluir): ' + jugador.aversiones : null,
  ].filter(Boolean).join('\n');

  const prompt = [
    'Eres Carlos Ferrando, nutricionista del Valencia CF.',
    'Genera un plan nutricional PERSONALIZADO y detallado.',
    'IMPORTANTE: Dirígete al jugador siempre en 2ª persona del singular ("tú"). Háblale directamente con cercanía y profesionalidad.',
    'Ejemplo de tono: "He preparado este plan para ti porque el míster me ha comentado que vas a jugar más minutos..."',
    '',
    '## DATOS DEL JUGADOR',
    'Nombre: ' + jugador.nombre + ' ' + jugador.apellidos,
    'Posicion: ' + (jugador.posicion || 'No especificada'),
    'Peso: ' + (jugador.peso_kg || '?') + ' kg | Masa magra: ' + (jugador.masa_magra_kg || '?') + ' kg | % Grasa: ' + (jugador.porcentaje_grasa || '?') + '%',
    '',
    '## OBJETIVOS NUTRICIONALES',
    'Kcal: ' + kcal + ' kcal/dia',
    'Proteina: ' + proteina + ' g | CHO: ' + cho + ' g | Grasa: ' + grasa + ' g',
    'Agua: ' + (jugador.agua_objetivo_ml || Math.round((jugador.peso_kg || 80) * 40)) + ' ml/dia',
    '',
    '## DISTRIBUCION DE INGESTAS',
    ingestas,
    '(Respeta exactamente este esquema de ingestas, horarios y nombres que indica Carlos)',
    '',
    '## PERFIL PERSONAL',
    'Objetivo: ' + (jugador.objetivo || 'Rendimiento deportivo optimo'),
    'Gustos: ' + (jugador.gustos_preferencias || 'No especificados'),
    restricciones ? restricciones : '',
    'Contexto clinico: ' + (jugador.contexto_clinico || 'Sin particularidades'),
    '',
    '## MENU CIUDAD DEPORTIVA (base para comida y cena)',
    menuTexto,
    '',
    '## INSTRUCCIONES',
    'Contexto actual: ' + (CONTEXTOS[contexto] || contexto),
    contextoAdicional ? 'Contexto adicional de Carlos (MÚY IMPORTANTE, inclúyelo en tu justificación inicial): ' + contextoAdicional : '',
    '',
    'IMPORTANTE:',
    '- Inicia el plan con un pequeño párrafo de justificación en 2ª persona ("tú") explicando al jugador por qué le has ajustado el plan así (basándote en el contexto actual y el contexto adicional si lo hay).',
    '- Para COMIDA y CENA: usa como base el menu de la ciudad deportiva. Puedes complementar o ajustar porciones segun los objetivos del jugador pero respeta los platos disponibles.',
    '- Para el RESTO de ingestas (desayuno, media manana, merienda, etc.): propones tu libremente segun el perfil y objetivos del jugador.',
    '- Respeta el esquema de ingestas exacto que ha definido Carlos (numero, nombre y horarios).',
    '- OBLIGATORIO: evita siempre los alimentos con alergia e intolerancia.',
    '- Incluye cantidades en gramos para los alimentos principales.',
    '- Genera el plan para 5 dias (Lunes a Viernes).',
    '- Al final, incluye 3-4 recomendaciones especificas para su contexto, también en 2ª persona.',
    '- Formato: usa Markdown con titulos, tablas y listas claras.',
  ].filter(s => s !== undefined).join('\n');

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jugadorId = searchParams.get('jugador_id');
    if (!jugadorId) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('planes_ia')
      .select('id,jugador_id,nombre,contexto,contexto_adicional,contenido,created_at,updated_at')
      .eq('jugador_id', jugadorId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ planes: data || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { jugador, nombre, contexto, contextoAdicional, contenido, draftOnly = false } = await req.json();
    const planNombre = String(nombre || '').trim();
    if (!jugador?.id) return NextResponse.json({ error: 'Falta jugador' }, { status: 400 });
    if (!planNombre) return NextResponse.json({ error: 'El nombre del plan es obligatorio' }, { status: 400 });

    const generatedContent = draftOnly || contenido === undefined
      ? await generarContenidoPlan({ jugador, contexto, contextoAdicional })
      : String(contenido || '');

    if (draftOnly) {
      return NextResponse.json({ contenido: generatedContent });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('planes_ia')
      .insert({
        jugador_id: jugador.id,
        nombre: planNombre,
        contexto,
        contexto_adicional: contextoAdicional || '',
        contenido: generatedContent,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, nombre, contenido, contexto, contextoAdicional } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta id del plan' }, { status: 400 });
    const planNombre = String(nombre || '').trim();
    if (!planNombre) return NextResponse.json({ error: 'El nombre del plan es obligatorio' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('planes_ia')
      .update({
        nombre: planNombre,
        contenido: contenido || '',
        contexto,
        contexto_adicional: contextoAdicional || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ plan: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
