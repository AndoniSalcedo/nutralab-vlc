import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth';
import { forbidden, getOwnedTeam } from '@/lib/team-access';
import { normalizeName } from '@/lib/player-excel-import';

function parseCsvDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).replace(/^\uFEFF/, '').trim();
  if (!cleaned) return null;

  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (isoMatch) {
    return buildDate(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const numericMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numericMatch) {
    const first = Number(numericMatch[1]);
    const second = Number(numericMatch[2]);
    const year = normalizeYear(numericMatch[3]);
    if (first > 12) return buildDate(year, second, first);
    if (second > 12) return buildDate(year, first, second);
    return buildDate(year, second, first);
  }

  const cleanedSplit = cleaned.replace(/\bde\b/gi, '').replace(/[-/]/g, ' ');
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
      return buildDate(year, month, day);
    }
  }

  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return null;
}

function normalizeYear(year) {
  const parsed = Number(year);
  if (String(year).length === 2) return parsed >= 70 ? 1900 + parsed : 2000 + parsed;
  return parsed;
}

function buildDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function normalizeKey(key) {
  return String(key || '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseCsvNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const cleaned = String(value).trim().replace(/\s/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;

  if (lastComma > -1 && lastDot > -1) {
    normalized = lastComma > lastDot
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
  } else if (lastComma > -1) {
    normalized = cleaned.replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

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

function playerFullName(player) {
  return `${player.nombre || ''} ${player.apellidos || ''}`.trim();
}

function partialCandidates(groupNameNormalized, players) {
  const groupTokens = groupNameNormalized.split(' ').filter((token) => token.length > 2);
  if (!groupTokens.length) return [];

  return players
    .map((player) => ({ player, normalized: normalizeName(playerFullName(player)) }))
    .filter(({ normalized }) => {
      const playerTokens = normalized.split(' ').filter((token) => token.length > 2);
      if (!playerTokens.length) return false;
      const groupInsidePlayer = groupTokens.every((token) => playerTokens.includes(token));
      const playerInsideGroup = playerTokens.every((token) => groupTokens.includes(token));
      const sharedTokens = groupTokens.filter((token) => playerTokens.includes(token)).length;
      return groupInsidePlayer || playerInsideGroup || sharedTokens >= Math.min(2, groupTokens.length);
    })
    .slice(0, 8)
    .map(({ player }) => player);
}

function previewCandidate(player) {
  return {
    id: player.id,
    nombreCompleto: playerFullName(player),
    fecha_nacimiento: player.fecha_nacimiento || null,
  };
}

async function loadTeamPlayers(supabase, teamId) {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id,nombre,apellidos,fecha_nacimiento')
    .eq('equipo_id', teamId)
    .order('nombre');

  if (error) throw error;
  return data || [];
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

    const qHeaders = ['questions', 'questionnaire', 'cuestionario', 'preguntas'];
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

      let datePart = null;
      let timePart = '';

      if (rawDate) {
        datePart = rawDate;
        timePart = rawTime || '';
      } else if (rawTime) {
        const cleanedTime = String(rawTime).trim();
        if (cleanedTime.includes(' ')) {
          const parts = cleanedTime.split(/\s+/);
          datePart = parts[0];
          timePart = parts[1];
        } else {
          datePart = null;
          timePart = cleanedTime;
        }
      }

      if (datePart && String(datePart).includes(' ')) {
        const parts = String(datePart).trim().split(/\s+/);
        datePart = parts[0];
        if (!timePart) timePart = parts[1] || '';
      }

      const parsedDate = parseCsvDate(datePart);
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
        const { error } = await supabase
          .from('registros_hidratacion')
          .upsert(recordsToUpsert, { onConflict: 'jugador_id,fecha,tipo' });

        if (error) throw error;
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
