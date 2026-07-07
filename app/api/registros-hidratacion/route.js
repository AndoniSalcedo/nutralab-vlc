import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedPlayer } from '@/lib/team-access';
import { toNumber as parseCsvNumber, parseDate as parseCsvDate, normalizeKey } from '@/lib/utils';


function normalizeRecordType(type) {
  const normalized = String(type || '').trim().toLowerCase();
  return normalized || 'sosm';
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
      const recordsByDate = new Map();
      let skippedRows = 0;
      let duplicateDateRows = 0;
      
      for (const row of data) {
        // We match CSV columns: Date, Time, Type, Value, Unit, Status, Notes, Questionnaire
        // Map keys ignoring case and whitespace
        const getVal = (keys) => {
          const normalizedKeys = keys.map(normalizeKey);
          for (const k of keys) {
            const foundKey = Object.keys(row).find(rk => normalizeKey(rk) === normalizeKey(k));
            if (foundKey) return row[foundKey];
          }
          const foundKey = Object.keys(row).find(rk => normalizedKeys.includes(normalizeKey(rk)));
          if (foundKey) return row[foundKey];
          return null;
        };

        const rawDate = getVal(['Date', 'fecha', 'dia', 'measurement date']);
        if (!rawDate) {
          skippedRows += 1;
          continue;
        }

        const parsedDate = parseCsvDate(rawDate);
        if (!parsedDate) {
          skippedRows += 1;
          continue;
        }

        const time = getVal(['Time', 'hora']) || '';
        const type = normalizeRecordType(getVal(['Type', 'tipo']));
        const rawValue = getVal(['Value', 'valor', 'sosm', 'osmolarity', 'osmolaridad']);
        const value = parseCsvNumber(rawValue);
        const unit = getVal(['Unit', 'unidad']) || '';
        const status = getVal(['Status', 'estado']) || '';
        const notes = getVal(['Notes', 'notas']) || '';
        const questionnaire = getVal(['Questionaire', 'Questionnaire', 'cuestionario']) || '';

        const record = {
          jugador_id: Number(jugador_id),
          fecha: parsedDate,
          hora: String(time).trim(),
          tipo: type,
          valor: value,
          unidad: String(unit).trim(),
          estado: String(status).trim(),
          notas: String(notes).trim(),
          cuestionario: String(questionnaire).trim()
        };

        const recordKey = `${parsedDate}:${type}`;
        if (recordsByDate.has(recordKey)) duplicateDateRows += 1;
        recordsByDate.set(recordKey, record);
      }

      const recordsToUpsert = Array.from(recordsByDate.values());

      if (recordsToUpsert.length === 0) {
        return NextResponse.json({ error: 'No se encontraron registros válidos para importar. Revisa el formato y las fechas.' }, { status: 400 });
      }

      // Upsert bulk
      const { error } = await supabase
        .from('registros_hidratacion')
        .upsert(recordsToUpsert, { onConflict: 'jugador_id,fecha,tipo' });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        count: recordsToUpsert.length,
        skippedRows,
        duplicateDateRows
      });
    } else {
      // Single Upsert
      const { id, fecha, hora, tipo, valor, unidad, estado, notas, cuestionario } = body;
      if (!fecha) return NextResponse.json({ error: 'Falta fecha' }, { status: 400 });

      const payload = {
        jugador_id: Number(jugador_id),
        fecha,
        hora,
        tipo: normalizeRecordType(tipo),
        valor: parseCsvNumber(valor),
        unidad,
        estado,
        notas,
        cuestionario
      };

      let query;
      if (id) {
        query = supabase
          .from('registros_hidratacion')
          .update(payload)
          .eq('id', id)
          .eq('jugador_id', Number(jugador_id))
          .select()
          .single();
      } else {
        query = supabase
          .from('registros_hidratacion')
          .upsert(payload, { onConflict: 'jugador_id,fecha,tipo' })
          .select()
          .single();
      }

      const { data: resData, error } = await query;

      if (error) throw error;

      return NextResponse.json({ success: true, record: resData });
    }
  } catch (e) {
    console.error('Error in registros-hidratacion POST:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jugadorId = searchParams.get('jugador_id');
    if (!jugadorId) return NextResponse.json({ error: 'Falta jugador_id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user) return forbidden('No autorizado');

    const ownedPlayer = await getOwnedPlayer(supabase, user, jugadorId);
    if (!ownedPlayer && String(user.id) !== String(jugadorId)) {
      return forbidden('No tienes acceso a este jugador');
    }

    const { data, error } = await supabase
      .from('registros_hidratacion')
      .select('*')
      .eq('jugador_id', jugadorId)
      .order('fecha', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ records: data || [] });
  } catch (e) {
    console.error('Error in registros-hidratacion GET:', e);
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
