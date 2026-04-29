import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import * as XLSX from 'xlsx';

function esHojaJugador(nombre) {
  return !nombre.includes('INFORME') && nombre !== 'Individual';
}

function safeDate(val) {
  if (!val) return null;
  try { const d = new Date(val); return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]; } catch { return null; }
}

function safeNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : (n === 0 ? null : n);
}

function getFecha(f) {
  return f['FECHA MEDICION'] ?? f['FECHA MEDICIÓN'] ?? f['Fecha'] ?? null;
}

function getNombre(f) {
  return String(f['NOMBRE'] ?? f['Nombre'] ?? f['nombre'] ?? '').trim();
}

function extraerUltimaMedicion(filas) {
  const validas = filas.filter(f => {
    const nombre = getNombre(f);
    const peso = safeNum(f['Peso (Kg)'] ?? f['Peso (kg)']);
    return nombre !== '' && peso !== null;
  });
  if (validas.length === 0) return null;
  validas.sort((a, b) => {
    const fa = safeDate(getFecha(a)) ?? '0';
    const fb = safeDate(getFecha(b)) ?? '0';
    return fb.localeCompare(fa);
  });
  return validas[0];
}

function parsearJugador(hoja, filas) {
  const m = extraerUltimaMedicion(filas);
  if (!m) return null;
  const nombre = getNombre(m) || hoja;
  const partes = nombre.split(' ');
  const peso = safeNum(m['Peso (Kg)'] ?? m['Peso (kg)']);
  const grasa = safeNum(m['% grasa FAULKNER']);
  const peso_magro = safeNum(m['Peso Magro']);
  const masa_magra = peso_magro ?? (peso && grasa ? Math.round(peso * (1 - grasa / 100) * 10) / 10 : null);
  return {
    _nombre_completo: nombre,
    nombre: partes[0] || nombre,
    apellidos: partes.slice(1).join(' ') || '',
    fecha_nacimiento: safeDate(m['FECHA NACIMIENTO']),
    fecha_ultima_medicion: safeDate(getFecha(m)),
    altura_cm: safeNum(m['Estatura (cm)']),
    peso_kg: peso,
    porcentaje_grasa: grasa,
    masa_magra_kg: masa_magra,
    pliegue_biceps: safeNum(m['Pliegue Bíceps'] ?? m['Pliegue Biceps']),
    pliegue_triceps: safeNum(m['Pliegue Tríceps'] ?? m['Pliegue Triceps']),
    pliegue_subescapular: safeNum(m['Pliegue Subescapular']),
    pliegue_cresta_iliaca: safeNum(m['Pliegue Cresta ilíaca'] ?? m['Pliegue Cresta iliaca']),
    pliegue_supraeliaco: safeNum(m['Pliegue Suprailíaco'] ?? m['Pliegue Supraeliaco']),
    pliegue_abdominal: safeNum(m['Pliegue Abdominal']),
    pliegue_pantorrilla: safeNum(m['Pliegue Pantorrilla Derecha']),
    pliegue_muslo: safeNum(m['Pliegue Muslo Derecho']),
    suma_6_pliegues: safeNum(m['Suma 6 Pliegues']),
    suma_8_pliegues: safeNum(m['Suma 8 Pliegues']),
    porcentaje_grasa_faulkner: grasa,
    porcentaje_grasa_yuhasz: safeNum(m['% grasa YUHASZ']),
    peso_oseo: safeNum(m['Peso Oseo'] ?? m['Peso Óseo']),
    peso_residual: safeNum(m['Peso Residual']),
    peso_graso: safeNum(m['Peso Graso']),
    peso_muscular: safeNum(m['Peso Muscular Lee&cols']),
    peso_magro: peso_magro,
    peso_deseable: safeNum(m['Peso deseable']),
    endomorfia: safeNum(m['ENDO']),
    mesomorfia: safeNum(m['MESO']),
    ectomorfia: safeNum(m['ECTO']),
    perimetro_brazo_contraido: safeNum(m['Perímetro Brazo Contraído Derecho']),
    perimetro_pantorrilla: safeNum(m['Perímetro Pantorrilla Derecha']),
    perimetro_muslo: safeNum(m['Perímetro Muslo Derecho']),
  };
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('file');
    const modo = formData.get('modo');
    if (!archivo) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 });
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const jugadores = [];
    for (const nombreHoja of workbook.SheetNames) {
      if (!esHojaJugador(nombreHoja)) continue;
      const filas = XLSX.utils.sheet_to_json(workbook.Sheets[nombreHoja], { defval: null, raw: false });
      const j = parsearJugador(nombreHoja, filas);
      if (j) jugadores.push(j);
    }
    if (modo === 'preview') return NextResponse.json({ jugadores });
    const supabase = getSupabaseAdmin();
    const selStr = formData.get('seleccionados');
    const sel = selStr ? JSON.parse(selStr) : jugadores.map(j => j?._nombre_completo).filter(Boolean);
    const resultados = [];
    for (const j of jugadores) {
      if (!j || !sel.includes(j._nombre_completo)) continue;
      const { _nombre_completo, ...datos } = j;
      const { data: existente } = await supabase.from('jugadores').select('id').ilike('nombre', '%' + datos.nombre + '%').limit(1).single();
      if (existente) {
        const { error } = await supabase.from('jugadores').update(datos).eq('id', existente.id);
        resultados.push({ nombre: _nombre_completo, accion: 'actualizado', error: error?.message });
      } else {
        const { error } = await supabase.from('jugadores').insert({ ...datos, factor_actividad: 1.6 });
        resultados.push({ nombre: _nombre_completo, accion: 'creado', error: error?.message });
      }
    }
    return NextResponse.json({ ok: true, resultados });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}