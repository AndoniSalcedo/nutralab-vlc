/**
 * Temas de la ficha nutricional (web + PDF).
 *
 * El equipo guarda 9 colores base (`planColors`). Todo lo demás (texto atenuado,
 * divisores, chips, colores de tipo de día...) se DERIVA de ellos con `buildPlanTokens`,
 * de modo que la vista web y el PDF comparten exactamente el mismo aspecto.
 */

const PLAN_COLOR_KEYS = [
  'cardTopBg',
  'cardTopText',
  'cardBodyBg',
  'cardBodyText',
  'boxBg',
  'boxBorder',
  'itemBg',
  'accentText',
  'itemText',
];

export const PLAN_THEME_PRESETS = [
  {
    id: 'midnight_dark',
    name: 'Midnight',
    description: 'Azul noche con acento ámbar',
    mode: 'dark',
    colors: {
      cardTopBg: '#1b3b4a',
      cardTopText: '#cfe0ea',
      cardBodyBg: '#0f1226',
      cardBodyText: '#ffffff',
      boxBg: '#161a35',
      boxBorder: '#2a3059',
      itemBg: '#1e2347',
      accentText: '#ffb454',
      itemText: '#dfe3ee',
    },
  },
  {
    id: 'obsidian_orange',
    name: 'Obsidian',
    description: 'Negro mate y naranja de alto contraste',
    mode: 'dark',
    colors: {
      cardTopBg: '#1c1c20',
      cardTopText: '#fdba74',
      cardBodyBg: '#0b0b0d',
      cardBodyText: '#ffffff',
      boxBg: '#17171a',
      boxBorder: '#2c2c31',
      itemBg: '#222226',
      accentText: '#ff8a1f',
      itemText: '#e4e4e7',
    },
  },
  {
    id: 'emerald_health',
    name: 'Emerald',
    description: 'Verde bosque y menta clínica',
    mode: 'dark',
    colors: {
      cardTopBg: '#065f46',
      cardTopText: '#d1fae5',
      cardBodyBg: '#06231f',
      cardBodyText: '#ecfdf5',
      boxBg: '#0b3730',
      boxBorder: '#14614f',
      itemBg: '#0f4a40',
      accentText: '#4ade9c',
      itemText: '#d1fae5',
    },
  },
  {
    id: 'ocean_blue',
    name: 'Ocean',
    description: 'Azul marino con acento cian',
    mode: 'dark',
    colors: {
      cardTopBg: '#0c4a6e',
      cardTopText: '#e0f2fe',
      cardBodyBg: '#04172a',
      cardBodyText: '#f0f9ff',
      boxBg: '#082a45',
      boxBorder: '#124f7a',
      itemBg: '#0d3a5c',
      accentText: '#4cc3fb',
      itemText: '#e0f2fe',
    },
  },
  {
    id: 'cyber_violet',
    name: 'Violet',
    description: 'Violeta profundo con acento lila',
    mode: 'dark',
    colors: {
      cardTopBg: '#5b21b6',
      cardTopText: '#f3e8ff',
      cardBodyBg: '#150b29',
      cardBodyText: '#faf5ff',
      boxBg: '#221340',
      boxBorder: '#42227a',
      itemBg: '#2f1a57',
      accentText: '#c99bff',
      itemText: '#f0e6ff',
    },
  },
  {
    id: 'clean_light',
    name: 'Paper',
    description: 'Claro y limpio, ideal para imprimir',
    mode: 'light',
    colors: {
      cardTopBg: '#0f172a',
      cardTopText: '#f1f5f9',
      cardBodyBg: '#f4f6f9',
      cardBodyText: '#0f172a',
      boxBg: '#ffffff',
      boxBorder: '#dbe2ea',
      itemBg: '#f1f4f8',
      accentText: '#d9480f',
      itemText: '#334155',
    },
  },
  {
    id: 'sage_light',
    name: 'Sage',
    description: 'Claro con verde salvia, sobrio y cálido',
    mode: 'light',
    colors: {
      cardTopBg: '#3f5a4a',
      cardTopText: '#f1f7f2',
      cardBodyBg: '#f5f7f2',
      cardBodyText: '#1f2a23',
      boxBg: '#ffffff',
      boxBorder: '#d9e2d6',
      itemBg: '#eef3ec',
      accentText: '#2f7d4f',
      itemText: '#3b4a41',
    },
  },
  {
    id: 'sand_light',
    name: 'Sand',
    description: 'Claro arena con acento terracota',
    mode: 'light',
    colors: {
      cardTopBg: '#3b2f2a',
      cardTopText: '#fbf3ea',
      cardBodyBg: '#faf6f0',
      cardBodyText: '#2a211c',
      boxBg: '#ffffff',
      boxBorder: '#eadfd0',
      itemBg: '#f6efe5',
      accentText: '#b4491f',
      itemText: '#4a3d34',
    },
  },
];

const DEFAULT_PLAN_COLORS = PLAN_THEME_PRESETS[0].colors;

/** Normaliza colores guardados (incluye las claves antiguas) y rellena con el tema por defecto. */
export function resolvePlanColors(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_PLAN_COLORS;
  return {
    cardTopBg: r.cardTopBg || d.cardTopBg,
    cardTopText: r.cardTopText || d.cardTopText,
    cardBodyBg: r.cardBodyBg || d.cardBodyBg,
    cardBodyText: r.cardBodyText || d.cardBodyText,
    boxBg: r.boxBg || r.dayBoxBg || r.suppBoxBg || d.boxBg,
    boxBorder: r.boxBorder || r.dayBoxBorder || r.suppBoxBorder || d.boxBorder,
    itemBg: r.itemBg || r.mealBoxBg || r.suppItemBg || d.itemBg,
    accentText: r.accentText || r.mealTitleText || r.suppTitleText || d.accentText,
    itemText: r.itemText || r.mealDescText || r.notesDescText || d.itemText,
  };
}

/** Devuelve el preset cuyos 9 colores coinciden exactamente con `colors`, o null si está personalizado. */
export function findMatchingPreset(colors) {
  const c = resolvePlanColors(colors);
  return (
    PLAN_THEME_PRESETS.find((p) =>
      PLAN_COLOR_KEYS.every((k) => String(p.colors[k]).toLowerCase() === String(c[k]).toLowerCase())
    ) || null
  );
}

/* ------------------------------ utilidades de color ------------------------------ */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Acepta #rgb, #rrggbb y rgb()/rgba() básicos. Devuelve [r,g,b] o null. */
function parseColor(value) {
  const str = String(value || '').trim();
  const hex = HEX_RE.exec(str);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(str);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((v) => Math.min(255, v));
  return null;
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

/** Mezcla `a` con `b`: t=0 → a, t=1 → b. Sólido (sin alfa), válido en react-pdf. */
function mixColors(a, b, t) {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca) return b;
  if (!cb) return a;
  return toHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

function relativeLuminance(color) {
  const rgb = parseColor(color);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function isLightColor(color) {
  return relativeLuminance(color) > 0.42;
}

/** Pares texto/fondo que deben ser legibles. Devuelve los que no llegan a 4.5:1 (3:1 para los acentos). */
export function getContrastIssues(colors) {
  const c = resolvePlanColors(colors);
  const pairs = [
    { fg: 'cardBodyText', bg: 'cardBodyBg', label: 'Títulos sobre el fondo de la ficha', min: 4.5 },
    { fg: 'cardTopText', bg: 'cardTopBg', label: 'Texto de la barra superior', min: 4.5 },
    { fg: 'cardBodyText', bg: 'boxBg', label: 'Títulos sobre las tarjetas', min: 4.5 },
    { fg: 'itemText', bg: 'itemBg', label: 'Detalle de menús sobre las comidas', min: 4.5 },
    { fg: 'accentText', bg: 'itemBg', label: 'Nombre de comidas sobre las comidas', min: 3 },
    { fg: 'accentText', bg: 'boxBg', label: 'Títulos de sección sobre las tarjetas', min: 3 },
  ];
  return pairs
    .map((p) => ({ ...p, ratio: contrastRatio(c[p.fg], c[p.bg]) }))
    .filter((p) => p.ratio < p.min);
}

/* ------------------------------ colores de tipo de día ------------------------------ */

// [tono para fondos oscuros, tono para fondos claros] (escala Mantine 4/5 y 7)
const DAY_TYPE_HEX = {
  red: ['#ff6b6b', '#e03131'],
  pink: ['#f783ac', '#c2255c'],
  grape: ['#da77f2', '#9c36b5'],
  purple: ['#da77f2', '#9c36b5'],
  violet: ['#9775fa', '#6741d9'],
  indigo: ['#748ffc', '#4263eb'],
  blue: ['#4dabf7', '#1c7ed6'],
  cyan: ['#3bc9db', '#0c8599'],
  teal: ['#38d9a9', '#0ca678'],
  green: ['#69db7c', '#2f9e44'],
  lime: ['#a9e34b', '#66a80f'],
  yellow: ['#ffd43b', '#e67700'],
  orange: ['#ffa94d', '#e8590c'],
  gray: ['#adb5bd', '#495057'],
  muted: ['#adb5bd', '#495057'],
  dark: ['#adb5bd', '#343a40'],
};

/* ------------------------------ tokens derivados ------------------------------ */

/**
 * Tokens de diseño derivados de los 9 colores base. Usar tanto en la ficha web como en el PDF.
 */
export function buildPlanTokens(rawColors) {
  const c = resolvePlanColors(rawColors);
  const light = isLightColor(c.cardBodyBg);

  const dayColor = (name) => (DAY_TYPE_HEX[name] || DAY_TYPE_HEX.green)[light ? 1 : 0];

  return {
    ...c,
    light,
    /** Texto secundario (etiquetas, unidades, pies). */
    muted: mixColors(c.cardBodyText, c.cardBodyBg, 0.42),
    /** Color del tipo de día ya ajustado a claro/oscuro. */
    dayColor,
    /** Fondo suave de la etiqueta del tipo de día. */
    dayTint: (name) => mixColors(c.boxBg, dayColor(name), light ? 0.14 : 0.22),
    /** Etiqueta pequeña (dosis, horas). */
    chipBg: mixColors(c.boxBg, c.accentText, light ? 0.13 : 0.18),
    /** Texto secundario sobre la barra superior. */
    topMuted: mixColors(c.cardTopText, c.cardTopBg, 0.3),
    /** Fondo de las métricas dentro de la barra superior. */
    topTile: mixColors(c.cardTopBg, c.cardTopText, 0.1),
  };
}
