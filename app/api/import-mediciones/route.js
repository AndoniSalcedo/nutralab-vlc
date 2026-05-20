import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(req) {
  try {
    const { data } = await req.json();
    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    // 1. Obtener todos los jugadores actuales para machear por nombre/apellido
    const { data: jugadoresDb, error: jugError } = await supabase.from('jugadores').select('id, nombre, apellidos');
    if (jugError) throw jugError;

    let successCount = 0;

    for (const row of data) {
      const nombre = row['Nombre']?.toString().trim();
      const apellidos = row['Apellidos']?.toString().trim() || '';
      
      if (!nombre) continue;

      // Buscar si el jugador existe
      let jugador = jugadoresDb.find(j => 
        j.nombre.toLowerCase() === nombre.toLowerCase() && 
        (j.apellidos || '').toLowerCase() === apellidos.toLowerCase()
      );

      const peso_kg = row['Peso'] || row['Peso (kg)'] || row['peso_kg'] ? parseFloat(row['Peso'] || row['Peso (kg)'] || row['peso_kg']) : null;
      const porcentaje_grasa = row['% Grasa'] || row['Grasa'] || row['porcentaje_grasa'] ? parseFloat(row['% Grasa'] || row['Grasa'] || row['porcentaje_grasa']) : null;
      const masa_magra_kg = row['Masa Magra'] || row['Masa Magra (kg)'] || row['masa_magra_kg'] ? parseFloat(row['Masa Magra'] || row['Masa Magra (kg)'] || row['masa_magra_kg']) : null;
      const suma_6_pliegues = row['Pliegues'] || row['Suma 6 Pliegues'] || row['suma_6_pliegues'] ? parseFloat(row['Pliegues'] || row['Suma 6 Pliegues'] || row['suma_6_pliegues']) : null;
      
      // Parsear fecha, asumiendo formato DD/MM/YYYY o ISO
      let fecha = new Date().toISOString().split('T')[0];
      const rowFecha = row['Fecha'] || row['fecha'];
      if (rowFecha) {
        // Si viene como número de Excel (días desde 1900)
        if (typeof rowFecha === 'number') {
          const excelDate = new Date(Math.round((rowFecha - 25569) * 86400 * 1000));
          fecha = excelDate.toISOString().split('T')[0];
        } else {
          // Intentar parsear string
          const parts = rowFecha.toString().split('/');
          if (parts.length === 3) {
             fecha = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else {
            const d = new Date(rowFecha);
            if (!isNaN(d.getTime())) fecha = d.toISOString().split('T')[0];
          }
        }
      }

      // Si no existe, lo creamos
      if (!jugador) {
        const { data: newJugador, error: createError } = await supabase.from('jugadores').insert({
          nombre,
          apellidos,
          peso_kg,
          porcentaje_grasa,
          masa_magra_kg
        }).select().single();
        
        if (createError) {
          console.error('Error creando jugador:', createError);
          continue;
        }
        jugador = newJugador;
        jugadoresDb.push(jugador);
      } else {
        // Actualizar jugador con la medición más reciente (simplificado, actualizamos con la actual)
        await supabase.from('jugadores').update({
          peso_kg: peso_kg || jugador.peso_kg,
          porcentaje_grasa: porcentaje_grasa || jugador.porcentaje_grasa,
          masa_magra_kg: masa_magra_kg || jugador.masa_magra_kg
        }).eq('id', jugador.id);
      }

      // 2. Insertar o actualizar la evolución (upsert basado en jugador_id + fecha si existe unique, o simplemente insert)
      // Primero verificamos si ya existe una medición para ese día
      const { data: existEvol } = await supabase.from('evoluciones')
        .select('id')
        .eq('jugador_id', jugador.id)
        .eq('fecha', fecha)
        .single();

      const evoPayload = {
        jugador_id: jugador.id,
        fecha,
        peso_kg,
        porcentaje_grasa,
        masa_magra_kg,
        suma_6_pliegues,
        notas: 'Importado desde Excel'
      };

      if (existEvol) {
        await supabase.from('evoluciones').update(evoPayload).eq('id', existEvol.id);
      } else {
        await supabase.from('evoluciones').insert(evoPayload);
      }

      successCount++;
    }

    return NextResponse.json({ success: true, count: successCount });
  } catch (error) {
    console.error('API Error (import-mediciones):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
