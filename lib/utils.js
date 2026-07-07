export function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

export function toPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function toNumber(value, { zeroAsNull = true } = {}) {
  if (value === null || value === undefined || String(value).trim() === '') return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return zeroAsNull && value === 0 ? null : value;
  }

  const cleaned = String(value).trim().replace(/\s/g, '').replace('%', '');
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
  if (!Number.isFinite(parsed)) return null;
  return zeroAsNull && parsed === 0 ? null : parsed;
}

export function normalizeYear(year) {
  const parsed = Number(year);
  if (!Number.isFinite(parsed)) return null;
  if (String(year).length === 2) return parsed >= 70 ? 1900 + parsed : 2000 + parsed;
  return parsed;
}

export function buildDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseDate(value, { preferDayFirst = true, xlsxSsf = null } = {}) {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return buildDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === 'number' && xlsxSsf) {
    const parsed = xlsxSsf.parse_date_code(value);
    return parsed ? buildDate(parsed.y, parsed.m, parsed.d) : null;
  }

  const cleaned = String(value).replace(/^\uFEFF/, '').trim();
  if (!cleaned || /^0{1,2}[-/]0{1,2}[-/]0{1,4}$/.test(cleaned)) return null;

  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (isoMatch) {
    return buildDate(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const numericMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numericMatch) {
    const first = Number(numericMatch[1]);
    const second = Number(numericMatch[2]);
    const year = normalizeYear(numericMatch[3]);
    if (!year) return null;

    if (first > 12) return buildDate(year, second, first);
    if (second > 12) return buildDate(year, first, second);
    return preferDayFirst ? buildDate(year, second, first) : buildDate(year, first, second);
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

export function sanitizeFilename(value, defaultFallback = 'archivo') {
  const filename = String(value || defaultFallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return filename || defaultFallback;
}

export function pdfHeaders(filename, length) {
  return {
    'Content-Type': 'application/pdf',
    'Content-Length': String(length),
    'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'Cache-Control': 'no-store',
  };
}

export function numberOrNull(value, decimals = 0) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function filenameFromResponse(response, fallback) {
  const header = response?.headers?.get('Content-Disposition') || '';
  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('');
}

export function formatNumberDecimal(value, suffix = '', decimals = 0) {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return '-';
  
  const factor = 10 ** decimals;
  const rounded = Math.round(n * factor) / factor;
  return `${String(rounded).replace('.', ',')}${suffix}`;
}

export function formatInteger(value) {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return '-';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function actionColor(action) {
  if (action === 'crear') return 'green';
  if (action === 'actualizar') return 'blue';
  if (action === 'ignorar') return 'gray';
  return 'orange';
}

export function actionLabel(action) {
  if (action === 'crear') return 'Crear';
  if (action === 'actualizar') return 'Actualizar';
  if (action === 'ignorar') return 'Ignorar';
  return 'Revisar';
}

export function initialDecisions(players) {
  const result = {};
  for (const p of players || []) {
    result[p.key] = p.accion;
  }
  return result;
}

export function normalizeKey(key) {
  return String(key || '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function playerFullName(player, fallback = 'Jugador') {
  const name = cleanText(`${player?.nombre || ''} ${player?.apellidos || ''}`);
  return name || fallback;
}

export function slugify(value, separator = '-') {
  if (value === null || value === undefined) return '';
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '');
}




