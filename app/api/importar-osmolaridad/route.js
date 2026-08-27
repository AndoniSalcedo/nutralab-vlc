import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedTeam } from '@/lib/team-access';
import { normalizeName, playerFullName, partialCandidates, previewCandidate } from '@/lib/player-excel-import';
import { toNumber as parseCsvNumber, parseDate as parseCsvDate, normalizeKey } from '@/lib/utils';
import { getPlayersByTeamSelect } from '@/repositories/playerRepository';
import { upsertHydrationRecords } from '@/repositories/hydrationRepository';



function normalizeRecordType(type) {
  const normalized = String(type || '').trim().toLowerCase();
  if (normalized === 'hydration') return 'sosm';
  if (normalized === 'sweat') return 'sweat';
  return normalized || 'sosm';
}


function detectDelimiter(text) {
  const commaCount = (text.match(/,/g) || []).length;
  const semicolonCount = (text.match(/;/g) || []).length;
  return commaCount >= semicolonCount ? ',' : ';';
}

function parseCSV(csvText) {
  const delimiter = detectDelimiter(csvText.slice(0, 2000));
  const rows = [];
  let row = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let j = 0; j < csvText.length; j++) {
    const char = csvText[j];
    const next = csvText[j + 1];

    if (char === '"' && insideQuotes && next === '"') {
      currentVal += '"';
      j += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === delimiter && !insideQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') j += 1;
      row.push(currentVal.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  row.push(currentVal.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

function getVal(row, headers, keys) {
  const normalizedKeys = keys.map(normalizeKey);
  for (const k of keys) {
    const idx = headers.findIndex(h => normalizeKey(h) === normalizeKey(k));
    if (idx !== -1) return row[idx];
  }
  const idx = headers.findIndex(h => normalizedKeys.includes(normalizeKey(h)));
  if (idx !== -1) return row[idx];
  return null;
}


async function loadTeamPlayers(supabase, teamId) {
  return getPlayersByTeamSelect(supabase, teamId, 'id,nombre,apellidos,fecha_nacimiento');
}


export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const mode = String(formData.get('mode') || 'preview').trim();
    const teamId = String(formData.get('team_id') || '').trim();

    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 });
    }
    if (!teamId) {
      return NextResponse.json({ error: 'ID de equipo no proporcionado' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const user = await getUser();
    if (!user || user.role === 'jugador') return forbidden('No autorizado');

    const team = await getOwnedTeam(supabase, user, teamId);
    if (!team) return forbidden('No tienes acceso a este equipo');

    // Load players
    const teamPlayers = await loadTeamPlayers(supabase, team.id);

    // Read CSV file content
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const csvText = fileBuffer.toString('utf-8');
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return NextResponse.json({ error: 'El archivo CSV está vacío o no contiene filas de datos.' }, { status: 400 });
    }

    const headers = rows[0].map(h => String(h || '').replace(/^\uFEFF/, '').trim());

    // Group rows by player name
    const nameHeaders = ['name', 'nombre', 'jugador', 'player'];
    const nameColIdx = headers.findIndex(h => nameHeaders.includes(normalizeKey(h)));
    if (nameColIdx === -1) {
      return NextResponse.json({ error: 'No se encontró la columna de nombre del jugador (ej. Name, Nombre).' }, { status: 400 });
    }

    const valHeaders = ['value', 'valor', 'sosm', 'osmolarity', 'osmolaridad'];
    const valColIdx = headers.findIndex(h => valHeaders.includes(normalizeKey(h)));
    if (valColIdx === -1) {
      return NextResponse.json({ error: 'No se encontró la columna de valor de la métrica (ej. Value, Valor).' }, { status: 400 });
    }

    const typeHeaders = ['type', 'tipo'];
    const typeColIdx = headers.findIndex(h => typeHeaders.includes(normalizeKey(h)));

    const statusHeaders = ['status', 'estado'];
    const statusColIdx = headers.findIndex(h => statusHeaders.includes(normalizeKey(h)));

    const notesHeaders = ['notes', 'notas'];
    const notesColIdx = headers.findIndex(h => notesHeaders.includes(normalizeKey(h)));

    const qHeaders = ['questions', 'questionnaire', 'questionaire', 'cuestionario', 'preguntas'];
    const qColIdx = headers.findIndex(h => qHeaders.includes(normalizeKey(h)));

    // Parse records row-by-row
    const parsedMeasurements = [];
    let skippedRows = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < Math.max(nameColIdx, valColIdx)) {
        skippedRows++;
        continue;
      }

      const name = String(row[nameColIdx] || '').trim();
      if (!name) {
        skippedRows++;
        continue;
      }

      const rawDate = getVal(row, headers, ['Date', 'fecha', 'dia', 'measurement date']);
      const rawTime = getVal(row, headers, ['Time', 'hora']);

      let parsedDate = null;
      let timePart = rawTime ? String(rawTime).trim() : '';

      if (rawDate) {
        parsedDate = parseCsvDate(rawDate);
        if (!parsedDate && String(rawDate).includes(' ')) {
          const parts = String(rawDate).trim().split(/\s+/);
          parsedDate = parseCsvDate(parts[0]);
          if (parsedDate && !timePart) {
            timePart = parts.slice(1).join(' ');
          }
        }
      } else if (rawTime) {
        const cleanedTime = String(rawTime).trim();
        if (cleanedTime.includes(' ')) {
          const parts = cleanedTime.split(/\s+/);
          parsedDate = parseCsvDate(parts[0]);
          timePart = parts.slice(1).join(' ');
        }
      }

      if (!parsedDate) {
        skippedRows++;
        continue; // Required date
      }

      const rawVal = row[valColIdx];
      const parsedVal = parseCsvNumber(rawVal);
      if (parsedVal === null) {
        skippedRows++;
        continue; // Required valid number
      }

      const rawType = typeColIdx !== -1 ? row[typeColIdx] : '';
      const type = normalizeRecordType(rawType);

      const status = statusColIdx !== -1 ? String(row[statusColIdx] || '').trim() : '';
      const notes = notesColIdx !== -1 ? String(row[notesColIdx] || '').trim() : '';
      const questionnaire = qColIdx !== -1 ? String(row[qColIdx] || '').trim() : '';

      parsedMeasurements.push({
        rawName: name,
        key: normalizeName(name),
        fecha: parsedDate,
        hora: String(timePart).trim(),
        tipo: type,
        valor: parsedVal,
        unidad: type === 'sweat' ? 'mg/L' : 'mOsm',
        estado: status,
        notes: notes,
        cuestionario: questionnaire
      });
    }

    // Group parsed measurements by player key
    const playersMap = new Map();
    for (const m of parsedMeasurements) {
      if (!playersMap.has(m.key)) {
        playersMap.set(m.key, {
          key: m.key,
          nombreCompleto: m.rawName,
          mediciones: []
        });
      }
      playersMap.get(m.key).mediciones.push(m);
    }

    // Build the plan with matches
    const playersPlan = Array.from(playersMap.values()).map(group => {
      const exactMatches = teamPlayers.filter((p) => normalizeName(playerFullName(p)) === group.key);
      
      let accion = 'crear'; 
      let jugadorId = null;
      let matchReason = null;
      let candidates = [];

      if (exactMatches.length === 1) {
        accion = 'actualizar';
        jugadorId = exactMatches[0].id;
        matchReason = 'nombre exacto';
      } else if (exactMatches.length > 1) {
        accion = 'revision';
        candidates = exactMatches;
        matchReason = 'nombre exacto duplicado';
      } else {
        candidates = partialCandidates(group.key, teamPlayers);
        if (candidates.length) {
          accion = 'revision';
          matchReason = 'coincidencia parcial';
        } else {
          // If no exact match and no partial candidates, we cannot save/create this player!
          accion = 'error';
          matchReason = 'jugador no encontrado y sin coincidencias parciales';
        }
      }

      const sortedDates = group.mediciones.map(m => m.fecha).sort();
      const ultimaFecha = sortedDates[sortedDates.length - 1] || null;

      return {
        key: group.key,
        nombreCompleto: group.nombreCompleto,
        accion,
        jugadorId,
        matchReason,
        candidatos: candidates.map(previewCandidate),
        medicionesCount: group.mediciones.length,
        ultimaFecha,
        mediciones: group.mediciones
      };
    });

    if (mode === 'preview') {
      return NextResponse.json({
        ok: true,
        resumen: {
          players: playersPlan.length,
          measurements: parsedMeasurements.length,
          skippedRows
        },
        jugadores: playersPlan
      });
    }

    if (mode === 'importar') {
      const decisions = JSON.parse(formData.get('decisiones') || '{}');
      const recordsToUpsert = [];
      const resultsSummary = [];

      let skippedCount = 0;

      for (const playerGroup of playersPlan) {
        const decision = decisions[playerGroup.key];
        let targetJugadorId = null;

        if (decision) {
          if (decision.action === 'update') {
            targetJugadorId = Number(decision.jugador_id);
          } else if (decision.action === 'skip') {
            skippedCount += playerGroup.mediciones.length;
            resultsSummary.push({
              nombre: playerGroup.nombreCompleto,
              key: playerGroup.key,
              accion: 'omitido',
              mediciones_procesadas: 0,
              status: 'Omitido por el usuario'
            });
            continue;
          }
        } else {
          if (playerGroup.accion === 'actualizar') {
            targetJugadorId = playerGroup.jugadorId;
          }
        }

        if (!targetJugadorId) {
          skippedCount += playerGroup.mediciones.length;
          resultsSummary.push({
            nombre: playerGroup.nombreCompleto,
            key: playerGroup.key,
            accion: 'error',
            mediciones_procesadas: 0,
            status: 'Sin jugador asignado'
          });
          continue;
        }

        const playerRecords = playerGroup.mediciones.map(m => ({
          jugador_id: targetJugadorId,
          fecha: m.fecha,
          hora: m.hora,
          tipo: m.tipo,
          valor: m.valor,
          unidad: m.unidad,
          estado: m.estado,
          notas: m.notes,
          cuestionario: m.cuestionario
        }));

        const uniquePlayerRecordsMap = new Map();
        for (const rec of playerRecords) {
          const recKey = `${rec.fecha}:${rec.tipo}`;
          uniquePlayerRecordsMap.set(recKey, rec);
        }

        const uniqueRecords = Array.from(uniquePlayerRecordsMap.values());
        recordsToUpsert.push(...uniqueRecords);

        resultsSummary.push({
          nombre: playerGroup.nombreCompleto,
          key: playerGroup.key,
          accion: 'actualizado',
          mediciones_procesadas: uniqueRecords.length,
          status: 'Correcto'
        });
      }

      if (recordsToUpsert.length > 0) {
        await upsertHydrationRecords(supabase, recordsToUpsert);
      }

      return NextResponse.json({
        ok: true,
        resumen: {
          jugadores: playersPlan.length,
          mediciones_guardadas: recordsToUpsert.length,
          mediciones_omitidas: skippedCount,
          jugadores_procesados: resultsSummary.length
        },
        resultados: resultsSummary
      });
    }

    return NextResponse.json({ error: 'Modo de importación no soportado' }, { status: 400 });

  } catch (error) {
    console.error('API Error (importar-osmolaridad):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
