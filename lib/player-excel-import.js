import * as XLSX from 'xlsx';
import { cleanText, toNumber, normalizeYear, buildDate as asIsoDate, parseDate, slugify, playerFullName } from './utils';


export const TYPED_MEASUREMENT_FIELDS = [
  'altura_cm',
  'peso_kg',
  'porcentaje_grasa',
  'masa_magra_kg',
  'pliegue_biceps',
  'pliegue_triceps',
  'pliegue_subescapular',
  'pliegue_cresta_iliaca',
  'pliegue_supraeliaco',
  'pliegue_abdominal',
  'pliegue_pantorrilla',
  'pliegue_muslo',
  'suma_6_pliegues',
  'suma_8_pliegues',
  'porcentaje_grasa_faulkner',
  'porcentaje_grasa_yuhasz',
  'peso_oseo',
  'peso_residual',
  'peso_graso',
  'peso_muscular',
  'peso_magro',
  'peso_deseable',
  'endomorfia',
  'mesomorfia',
  'ectomorfia',
  'perimetro_brazo_contraido',
  'perimetro_pantorrilla_derecha',
  'perimetro_pantorrilla_izquierda',
  'perimetro_muslo_derecho',
  'perimetro_muslo_izquierdo',
  'perimetro_pantorrilla',
  'perimetro_muslo',
];

const FIELD_HEADERS = {
  altura_cm: ['Estatura (cm)', 'Altura', 'Altura (cm)'],
  peso_kg: ['Peso (Kg)', 'Peso (kg)', 'Peso', 'Peso total (Kg)'],
  porcentaje_grasa_faulkner: ['% grasa FAULKNER', '% grasa Faulkner', '% Grasa'],
  porcentaje_grasa_yuhasz: ['% grasa YUHASZ', '% grasa Yuhasz'],
  pliegue_biceps: ['Pliegue Bíceps', 'Pliegue Biceps'],
  pliegue_triceps: ['Pliegue Tríceps', 'Pliegue Triceps'],
  pliegue_subescapular: ['Pliegue Subescapular'],
  pliegue_cresta_iliaca: ['Pliegue Cresta ilíaca', 'Pliegue Cresta iliaca'],
  pliegue_supraeliaco: ['Pliegue Suprailíaco', 'Pliegue Supraeliaco'],
  pliegue_abdominal: ['Pliegue Abdominal'],
  pliegue_pantorrilla: ['Pliegue Pantorrilla Derecha', 'Pliegue Pantorrilla'],
  pliegue_muslo: ['Pliegue Muslo Derecho', 'Pliegue Muslo'],
  suma_6_pliegues: ['Suma 6 Pliegues'],
  suma_8_pliegues: ['Suma 8 Pliegues'],
  peso_oseo: ['Peso Oseo', 'Peso Óseo'],
  peso_residual: ['Peso Residual'],
  peso_graso: ['Peso Graso', 'Peso grasa (kg)', 'PESO GRASO (Kg)'],
  peso_muscular: ['Peso Muscular Lee&cols', 'PESO MÚSCULO (kg) (Lee&cols)'],
  peso_magro: ['Peso Magro'],
  peso_deseable: ['Peso deseable'],
  endomorfia: ['ENDO'],
  mesomorfia: ['MESO'],
  ectomorfia: ['ECTO'],
  perimetro_brazo_contraido: ['Perímetro Brazo Contraído Derecho', 'Perimetro Brazo Contraido Derecho'],
  perimetro_pantorrilla_derecha: ['Perímetro Pantorrilla Derecha', 'Perimetro Pantorrilla Derecha'],
  perimetro_pantorrilla_izquierda: ['Perímetro Pantorrilla Izquierda', 'Perimetro Pantorrilla Izquierda'],
  perimetro_muslo_derecho: ['Perímetro Muslo Derecho', 'Perimetro Muslo Derecho'],
  perimetro_muslo_izquierdo: ['Perímetro Muslo Izquierdo', 'Perimetro Muslo Izquierdo'],
  perimetro_pantorrilla: ['Perímetro Pantorrilla Derecha', 'Perimetro Pantorrilla Derecha'],
  perimetro_muslo: ['Perímetro Muslo Derecho', 'Perimetro Muslo Derecho'],
};

const ID_HEADERS = new Set([
  'temporada',
  'equipo',
  'fecha nacimiento',
  'nombre',
  'fecha medicion',
  'fecha',
]);

export function normalizeName(value) {
  return slugify(value, ' ');
}

function normalizeHeader(value) {
  return normalizeName(value);
}

export function parseExcelDate(value, { preferDayFirst = true } = {}) {
  return parseDate(value, { preferDayFirst, xlsxSsf: XLSX.SSF });
}

function parseSheetMeasurementDate(sheetName) {
  const match = String(sheetName || '').match(/MEDICION\s+(\d{1,2})-(\d{1,2})-(\d{2,4})/i);
  if (!match) return null;
  return asIsoDate(normalizeYear(match[3]), match[2], match[1]);
}


function buildHeaderLookup(header) {
  const lookup = new Map();
  header.forEach((label, index) => {
    const normalized = normalizeHeader(label);
    if (normalized && !lookup.has(normalized)) lookup.set(normalized, index);
  });
  return lookup;
}

function headerIndex(lookup, labels) {
  for (const label of labels) {
    const index = lookup.get(normalizeHeader(label));
    if (index !== undefined) return index;
  }
  return -1;
}

function valueByHeaders(row, lookup, labels) {
  const index = headerIndex(lookup, labels);
  return index >= 0 ? row[index] : null;
}

function uniqueRawKey(label, seen, index) {
  const base = cleanText(label) || `Columna ${index + 1}`;
  const count = seen.get(base) || 0;
  seen.set(base, count + 1);
  return count ? `${base} (${count + 1})` : base;
}

function serializeCell(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return parseExcelDate(value);
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = cleanText(value);
  return text || null;
}

function buildRawColumns(row, header) {
  const raw = {};
  const seen = new Map();
  header.forEach((label, index) => {
    const value = serializeCell(row[index]);
    if (value === null || value === '') return;
    raw[uniqueRawKey(label, seen, index)] = value;
  });
  return raw;
}

function rawMetricCount(row, header) {
  return header.reduce((count, label, index) => {
    const normalized = normalizeHeader(label);
    if (!normalized || ID_HEADERS.has(normalized)) return count;
    const value = serializeCell(row[index]);
    return value === null || value === '' ? count : count + 1;
  }, 0);
}

function mapTypedMeasurement(row, lookup) {
  const typed = {};
  for (const [field, labels] of Object.entries(FIELD_HEADERS)) {
    typed[field] = toNumber(valueByHeaders(row, lookup, labels));
  }

  typed.porcentaje_grasa = typed.porcentaje_grasa_faulkner ?? typed.porcentaje_grasa_yuhasz ?? null;
  typed.masa_magra_kg = typed.peso_magro ?? null;

  if (typed.masa_magra_kg === null && typed.peso_kg !== null && typed.porcentaje_grasa !== null) {
    typed.masa_magra_kg = Math.round(typed.peso_kg * (1 - typed.porcentaje_grasa / 100) * 10) / 10;
  }

  return Object.fromEntries(
    Object.entries(typed).map(([field, value]) => [field, value ?? null])
  );
}

function findHeaderRow(rows) {
  for (let index = 0; index < Math.min(rows.length, 12); index += 1) {
    const header = (rows[index] || []).map(cleanText);
    const lookup = buildHeaderLookup(header);
    if (lookup.has('nombre') && lookup.has('fecha medicion')) return index;
  }
  return -1;
}

function isSummaryMarker(name) {
  const normalized = normalizeName(name);
  return (
    normalized === 'promedio' ||
    normalized === 'estado ideal' ||
    normalized.startsWith('estudios antropometricos')
  );
}

function isValidMeasurementDate(date) {
  return Boolean(date && date >= '2000-01-01' && date <= '2100-12-31');
}

function splitName(fullName) {
  const parts = cleanText(fullName).split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombre: parts[0] || fullName, apellidos: '' };
  return { nombre: parts[0], apellidos: parts.slice(1).join(' ') };
}

function recordSignature(record) {
  return JSON.stringify(record.typed);
}

function sourcePriority(record) {
  return record.sourceType === 'player_history' ? 2 : 1;
}

function betterRecord(a, b) {
  if (a.metricsCount !== b.metricsCount) return a.metricsCount > b.metricsCount ? a : b;
  if (sourcePriority(a) !== sourcePriority(b)) return sourcePriority(a) > sourcePriority(b) ? a : b;
  if (a.sheetIndex !== b.sheetIndex) return a.sheetIndex > b.sheetIndex ? a : b;
  return a.rowIndex >= b.rowIndex ? a : b;
}

export function parsePlayerExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const records = [];
  const sheetStats = [];
  const warnings = [];

  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    const normalizedSheetName = normalizeName(sheetName);
    if (normalizedSheetName.includes('informe')) {
      sheetStats.push({ sheetName, status: 'skipped', reason: 'informe' });
      return;
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true,
      blankrows: false,
    });
    const headerRowIndex = findHeaderRow(rows);

    if (headerRowIndex < 0) {
      sheetStats.push({ sheetName, status: 'skipped', reason: 'sin cabecera compatible' });
      return;
    }

    const header = (rows[headerRowIndex] || []).map(cleanText);
    const lookup = buildHeaderLookup(header);
    const nameIndex = lookup.get('nombre');
    const dateIndex = lookup.get('fecha medicion');
    const sheetDate = parseSheetMeasurementDate(sheetName);
    const sourceType = sheetDate ? 'team_measurement' : 'player_history';
    let parsedRows = 0;

    for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] || [];
      const fullName = cleanText(row[nameIndex]);
      const normalizedName = normalizeName(fullName);

      if (isSummaryMarker(fullName)) break;
      if (!fullName || normalizedName === '0') continue;

      const originalDate = parseExcelDate(row[dateIndex], { preferDayFirst: true });
      const validFecha = isValidMeasurementDate(originalDate) ? originalDate : null;

      const metricsCount = rawMetricCount(row, header);
      if (!metricsCount) continue;

      const typed = mapTypedMeasurement(row, lookup);
      const metricasExcel = buildRawColumns(row, header);
      const fechaNacimiento = parseExcelDate(
        valueByHeaders(row, lookup, ['FECHA NACIMIENTO', 'Fecha nacimiento']),
        { preferDayFirst: false }
      );
      const dateCorrected = false;

      records.push({
        key: `${normalizedName}|${validFecha || `sin-fecha-${sheetIndex}-${rowIndex}`}`,
        playerKey: normalizedName,
        fullName,
        ...splitName(fullName),
        fecha: validFecha,
        fechaNacimiento,
        typed,
        metricasExcel,
        metricsCount,
        sourceType,
        sourceSheet: sheetName,
        sourceRow: rowIndex + 1,
        sheetIndex,
        rowIndex,
        originalDate,
        dateCorrected,
        signature: null,
      });
      parsedRows += 1;

      if (dateCorrected) {
        warnings.push({
          type: 'date_corrected',
          sheetName,
          row: rowIndex + 1,
          player: fullName,
          originalDate,
          fecha,
        });
      }
    }

    sheetStats.push({ sheetName, status: parsedRows ? 'parsed' : 'empty', rows: parsedRows });
  });

  for (const record of records) {
    record.signature = recordSignature(record);
  }

  const deduped = dedupeRecords(records);
  const groups = groupRecordsByPlayer(deduped.records);

  return {
    records: deduped.records,
    groups,
    duplicateWarnings: deduped.warnings,
    dateWarnings: warnings,
    sheetStats,
    summary: {
      sheets: workbook.SheetNames.length,
      parsedSheets: sheetStats.filter((sheet) => sheet.status === 'parsed').length,
      skippedSheets: sheetStats.filter((sheet) => sheet.status === 'skipped').length,
      rawMeasurements: records.length,
      measurements: deduped.records.length,
      players: groups.length,
      dateCorrections: warnings.length,
      duplicateConflicts: deduped.warnings.filter((warning) => warning.conflict).length,
    },
  };
}

function dedupeRecords(records) {
  const byKey = new Map();

  for (const record of records) {
    const bucket = byKey.get(record.key) || [];
    bucket.push(record);
    byKey.set(record.key, bucket);
  }

  const deduped = [];
  const warnings = [];

  for (const bucket of byKey.values()) {
    let selected = bucket[0];
    for (const candidate of bucket.slice(1)) {
      selected = betterRecord(selected, candidate);
    }

    if (bucket.length > 1) {
      const conflict = new Set(bucket.map((record) => record.signature)).size > 1;
      selected.duplicateCount = bucket.length - 1;
      selected.duplicateConflict = conflict;
      selected.duplicateSources = bucket.map((record) => ({
        sheetName: record.sourceSheet,
        row: record.sourceRow,
        metricsCount: record.metricsCount,
      }));
      warnings.push({
        type: 'duplicate',
        conflict,
        player: selected.fullName,
        fecha: selected.fecha,
        selected: { sheetName: selected.sourceSheet, row: selected.sourceRow },
        sources: selected.duplicateSources,
      });
    } else {
      selected.duplicateCount = 0;
      selected.duplicateConflict = false;
      selected.duplicateSources = [];
    }

    deduped.push(selected);
  }

  deduped.sort((a, b) => (
    (a.playerKey || '').localeCompare(b.playerKey || '') ||
    (a.fecha || '').localeCompare(b.fecha || '') ||
    (a.sourceSheet || '').localeCompare(b.sourceSheet || '') ||
    a.sourceRow - b.sourceRow
  ));

  return { records: deduped, warnings };
}

function groupRecordsByPlayer(records) {
  const byPlayer = new Map();

  for (const record of records) {
    const group = byPlayer.get(record.playerKey) || {
      key: record.playerKey,
      nombreCompleto: record.fullName,
      nombre: record.nombre,
      apellidos: record.apellidos,
      fechaNacimiento: record.fechaNacimiento,
      mediciones: [],
      warnings: [],
    };

    if (record.fullName.length > group.nombreCompleto.length) {
      group.nombreCompleto = record.fullName;
      group.nombre = record.nombre;
      group.apellidos = record.apellidos;
    }
    if (!group.fechaNacimiento && record.fechaNacimiento) group.fechaNacimiento = record.fechaNacimiento;

    if (!record.fecha) {
      group.warnings.push(`Medición omitida en ${record.sourceSheet}, fila ${record.sourceRow}: falta fecha`);
    } else if (record.dateCorrected) {
      group.warnings.push(`Fecha corregida en ${record.sourceSheet}, fila ${record.sourceRow}: ${record.originalDate} -> ${record.fecha}`);
    }
    if (record.duplicateCount) {
      group.warnings.push(
        `Duplicado ${record.fecha}: elegida ${record.sourceSheet} fila ${record.sourceRow} entre ${record.duplicateCount + 1} filas`
      );
    }

    group.mediciones.push(record);
    byPlayer.set(record.playerKey, group);
  }

  return Array.from(byPlayer.values()).map((group) => ({
    ...group,
    mediciones: group.mediciones.sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || ''))),
    warnings: Array.from(new Set(group.warnings)),
  }));
}

export { playerFullName };

export function partialCandidates(groupName, players) {
  const groupTokens = String(groupName || '').split(' ').filter((token) => token.length > 2);
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

export function previewCandidate(player) {
  return {
    id: player.id,
    nombreCompleto: playerFullName(player),
    fecha_nacimiento: player.fecha_nacimiento || null,
  };
}

export function buildImportPlan(parsed, players = []) {
  return parsed.groups.map((group) => {
    const exactMatches = players.filter((player) => normalizeName(playerFullName(player)) === group.key);
    const birthMatches = group.fechaNacimiento
      ? players.filter((player) => player.fecha_nacimiento === group.fechaNacimiento)
      : [];

    let accion = 'crear';
    let jugadorId = null;
    let matchReason = null;
    let candidates = [];

    if (exactMatches.length === 1) {
      accion = 'actualizar';
      jugadorId = exactMatches[0].id;
      matchReason = 'nombre exacto';
      candidates = exactMatches;
    } else if (exactMatches.length > 1) {
      accion = 'revision';
      candidates = exactMatches;
      matchReason = 'nombre exacto duplicado';
    } else if (birthMatches.length === 1) {
      accion = 'actualizar';
      jugadorId = birthMatches[0].id;
      matchReason = 'fecha de nacimiento';
      candidates = birthMatches;
    } else if (birthMatches.length > 1) {
      accion = 'revision';
      candidates = birthMatches;
      matchReason = 'fecha de nacimiento duplicada';
    } else {
      candidates = partialCandidates(group.key, players);
      if (candidates.length) {
        accion = 'revision';
        matchReason = 'coincidencia parcial';
      }
    }

    const hasMissingDates = group.mediciones.some((m) => !m.fecha);
    if (hasMissingDates) {
      accion = 'revision';
      matchReason = matchReason ? `${matchReason} y contiene mediciones sin fecha` : 'Contiene mediciones sin fecha';
    }

    const ultimaFecha = group.mediciones.filter((m) => m.fecha).at(-1)?.fecha || null;
    const duplicateConflicts = group.mediciones.filter((record) => record.duplicateConflict).length;
    const dateCorrections = group.mediciones.filter((record) => record.dateCorrected).length;
    const missingMeasurements = group.mediciones
      .filter((record) => !record.fecha)
      .map((m) => ({ id: `${m.sourceSheet}-${m.sourceRow}`, sheet: m.sourceSheet, row: m.sourceRow }));

    return {
      ...group,
      accion,
      jugadorId,
      matchReason,
      candidatos: candidates.map(previewCandidate),
      medicionesCount: group.mediciones.length,
      ultimaFecha,
      duplicateConflicts,
      dateCorrections,
      missingMeasurements,
    };
  });
}

export function toPreviewResponse(parsed, plan) {
  return {
    ok: true,
    resumen: parsed.summary,
    hojas: parsed.sheetStats,
    jugadores: plan.map((group) => ({
      key: group.key,
      nombreCompleto: group.nombreCompleto,
      nombre: group.nombre,
      apellidos: group.apellidos,
      fechaNacimiento: group.fechaNacimiento,
      accion: group.accion,
      jugadorId: group.jugadorId,
      matchReason: group.matchReason,
      candidatos: group.candidatos,
      medicionesCount: group.medicionesCount,
      ultimaFecha: group.ultimaFecha,
      warnings: group.warnings.slice(0, 8),
      warningsCount: group.warnings.length,
      duplicateConflicts: group.duplicateConflicts,
      dateCorrections: group.dateCorrections,
      missingMeasurements: group.missingMeasurements,
    })),
  };
}
