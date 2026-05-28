import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';

function parseCsvDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim();
  
  // Try to parse directly
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  
  // Try split parts: e.g. "22 May 2026" or "22 de Mayo de 2026" or "22-May-2026"
  const cleanedSplit = cleaned.replace(/de/gi, '').replace(/[-/]/g, ' ');
  const parts = cleanedSplit.split(/\s+/).filter(Boolean);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const months = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      ene: '01', abr: '04', ago: '08', dic: '12',
      mayo: '05', junio: '06', julio: '07', agosto: '08', septiembre: '09', 
      octubre: '10', noviembre: '11', diciembre: '12', enero: '01',
      febrero: '02', marzo: '03'
    };
    const prefix = monthStr.slice(0, 3);
    let month = months[prefix] || months[monthStr];
    if (month && !isNaN(day) && !isNaN(year)) {
      return `${year}-${month}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { jugador_id, data } = body;

    if (!jugador_id) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });
    
    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

    const ownedPlayer = await getOwnedPlayer(supabase, user, jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    if (Array.isArray(data)) {
      // Bulk CSV Import
      const recordsToUpsert = [];
      
      for (const row of data) {
        // We match CSV columns: Date, Time, Type, Value, Unit, Status, Notes, Questionaire
        // Map keys ignoring case and whitespace
        const getVal = (keys) => {
          for (const k of keys) {
            const foundKey = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
            if (foundKey) return row[foundKey];
          }
          return null;
        };

        const rawDate = getVal(['Date', 'fecha']);
        if (!rawDate) continue;

        const parsedDate = parseCsvDate(rawDate);
        if (!parsedDate) continue;

        const time = getVal(['Time', 'hora']) || '';
        const type = getVal(['Type', 'tipo']) || '';
        const rawValue = getVal(['Value', 'valor']);
        const value = rawValue !== null && rawValue !== undefined ? parseFloat(String(rawValue).replace(',', '.')) : null;
        const unit = getVal(['Unit', 'unidad']) || '';
        const status = getVal(['Status', 'estado']) || '';
        const notes = getVal(['Notes', 'notas']) || '';
        const questionnaire = getVal(['Questionaire', 'cuestionario']) || '';

        recordsToUpsert.push({
          jugador_id: Number(jugador_id),
          fecha: parsedDate,
          hora: String(time).trim(),
          tipo: String(type).trim(),
          valor: value,
          unidad: String(unit).trim(),
          estado: String(status).trim(),
          notas: String(notes).trim(),
          cuestionario: String(questionnaire).trim()
        });
      }

      if (recordsToUpsert.length === 0) {
        return NextResponse.json({ error: 'No se encontraron registros válidos para importar. Revisa el formato y las fechas.' }, { status: 400 });
      }

      // Upsert bulk
      const { error } = await supabase
        .from('registros_hidratacion')
        .upsert(recordsToUpsert, { onConflict: 'jugador_id,fecha' });

      if (error) throw error;

      return NextResponse.json({ success: true, count: recordsToUpsert.length });
    } else {
      // Single Upsert
      const { fecha, hora, tipo, valor, unidad, estado, notas, cuestionario } = body;
      if (!fecha) return NextResponse.json({ error: 'Falta fecha' }, { status: 400 });

      const { data: resData, error } = await supabase
        .from('registros_hidratacion')
        .upsert({
          jugador_id: Number(jugador_id),
          fecha,
          hora,
          tipo,
          valor: valor !== null && valor !== undefined ? parseFloat(valor) : null,
          unidad,
          estado,
          notas,
          cuestionario
        }, { onConflict: 'jugador_id,fecha' })
        .select().single();

      if (error) throw error;

      return NextResponse.json({ success: true, record: resData });
    }
  } catch (e) {
    console.error('Error in registros-hidratacion POST:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    
    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

    // Verify record exists and user owns the player
    const { data: record, error: fetchErr } = await supabase
      .from('registros_hidratacion')
      .select('jugador_id')
      .eq('id', id)
      .single();
    if (fetchErr || !record) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

    const ownedPlayer = await getOwnedPlayer(supabase, user, record.jugador_id);
    if (!ownedPlayer) return forbidden('No tienes acceso a este jugador');

    const { error } = await supabase.from('registros_hidratacion').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error in registros-hidratacion DELETE:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
