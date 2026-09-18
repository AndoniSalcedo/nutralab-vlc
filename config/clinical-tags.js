/**
 * Configuración Canónica de Etiquetas Clínicas y Restricciones Dietéticas para Nutralab
 * Permite selección determinista en ficha de jugador y filtrado 100% estricto del catálogo.
 */

export const CLINICAL_TAGS = [
  {
    value: 'sin_gluten',
    label: '🌾 Celíaco / Sin Gluten',
    shortLabel: 'Sin Gluten',
    icon: '🌾',
    description: 'Excluye trigo, cuscús, pan y avena convencional; incluye pasta y pan sin gluten',
  },
  {
    value: 'sin_lactosa',
    label: '🥛 Intolerancia a la Lactosa / Sin Lácteos',
    shortLabel: 'Sin Lactosa',
    icon: '🥛',
    description: 'Excluye lácteos tradicionales con lactosa; incluye lácteos sin lactosa y bebidas vegetales',
  },
  {
    value: 'sin_proteina_vaca',
    label: '🐮 APLV / Alergia a la Proteína de Vaca',
    shortLabel: 'Sin Proteína de Vaca (APLV)',
    icon: '🐮',
    description: 'Excluye estrictamente todos los lácteos de vaca (incluso sin lactosa), quesos, yogures, mantequilla, suero/whey y caseína',
  },
  {
    value: 'sibo_low_fodmap',
    label: '🦠 SIBO General / Bajo FODMAP',
    shortLabel: 'SIBO General',
    icon: '🦠',
    description: 'Excluye alimentos altamente fermentables (FODMAP): legumbres, cebolla, coliflor, lácteos enteros',
  },
  {
    value: 'sibo_hidrogeno',
    label: '💨 SIBO Hidrógeno (Diarrea / Bajo FODMAP)',
    shortLabel: 'SIBO Hidrógeno',
    icon: '💨',
    description: 'Sobrecrecimiento bacteriano productor de H2 con diarrea o tránsito rápido. Dieta estricta Baja en FODMAP',
  },
  {
    value: 'sibo_metano_imo',
    label: '🪨 SIBO Metano / IMO (Estreñimiento / Bajo FODMAP)',
    shortLabel: 'SIBO Metano (IMO)',
    icon: '🪨',
    description: 'Sobrecrecimiento de arqueas (IMO) con motilidad lenta y estreñimiento. Dieta Baja en FODMAP + procinéticos',
  },
  {
    value: 'sibo_mixto',
    label: '🔄 SIBO Mixto (Hidrógeno + Metano)',
    shortLabel: 'SIBO Mixto',
    icon: '🔄',
    description: 'Sobrecrecimiento mixto de bacterias y arqueas con alternancia de tránsito. Dieta Baja en FODMAP estricta',
  },
  {
    value: 'sibo_sulfuro',
    label: '🧪 SIBO Sulfhídrico / Sulfuro (Bajo en Azufre)',
    shortLabel: 'SIBO Sulfhídrico',
    icon: '🧪',
    description: 'Excluye alimentos ricos en FODMAP y alimentos ricos en azufre/sulfatos: crucíferas, huevos, ajo, cebolla y carnes rojas',
  },
  {
    value: 'colon_irritable',
    label: '🩺 Colon Irritable / SII (Bajo FODMAP)',
    shortLabel: 'Colon Irritable (SII)',
    icon: '🩺',
    description: 'Excluye alimentos altamente fermentables (FODMAP): legumbres, cebolla, ajo, coliflor y lácteos enteros',
  },
  {
    value: 'sin_fructosa',
    label: '🍎 Intolerancia / Alergia a la Fructosa',
    shortLabel: 'Sin Fructosa',
    icon: '🍎',
    description: 'Excluye frutas ricas en fructosa (manzana, pera, mango, sandía, uva, desecadas), miel, mermeladas, zumos y dulces',
  },
  {
    value: 'sin_cerdo',
    label: '🐷 Sin Cerdo / Halal',
    shortLabel: 'Sin Cerdo / Halal',
    icon: '🐷',
    description: 'Excluye carnes de cerdo, embutidos (jamón, lomo, secreto, bacon)',
  },
  {
    value: 'sin_pescado',
    label: '🐟 Alergia al Pescado',
    shortLabel: 'Sin Pescado',
    icon: '🐟',
    description: 'Excluye pescados blancos y azules (merluza, salmón, atún, bacalao, dorada...)',
  },
  {
    value: 'sin_marisco',
    label: '🦐 Alergia al Marisco',
    shortLabel: 'Sin Marisco',
    icon: '🦐',
    description: 'Excluye crustáceos y moluscos (gambas, langostinos, mejillones, almejas)',
  },
  {
    value: 'sin_huevo',
    label: '🥚 Alergia al Huevo',
    shortLabel: 'Sin Huevo',
    icon: '🥚',
    description: 'Excluye huevos enteros, tortillas y claras',
  },
  {
    value: 'sin_frutos_secos',
    label: '🥜 Alergia a Frutos Secos / Cacahuetes',
    shortLabel: 'Sin Frutos Secos',
    icon: '🥜',
    description: 'Excluye nueces, almendras, avellanas, cacahuetes, anacardos y cremas de frutos secos',
  },
  {
    value: 'sin_soja',
    label: '🫘 Alergia a la Soja',
    shortLabel: 'Sin Soja',
    icon: '🫘',
    description: 'Excluye soja, tofu, edamame, soja texturizada y salsas con soja',
  },
  {
    value: 'sin_carne_roja',
    label: '🥩 Sin Carne Roja / Pescetariano',
    shortLabel: 'Sin Carne Roja',
    icon: '🥩',
    description: 'Excluye carnes rojas (ternera, buey, cordero)',
  },
  {
    value: 'vegetariano',
    label: '🥗 Dieta Vegetariana',
    shortLabel: 'Vegetariano',
    icon: '🥗',
    description: 'Excluye todas las carnes, aves, pescados y mariscos',
  },
  {
    value: 'vegano',
    label: '🌱 Dieta Vegana',
    shortLabel: 'Vegano',
    icon: '🌱',
    description: 'Excluye todos los alimentos de origen animal (carnes, pescados, huevos y lácteos)',
  },
];

const CLINICAL_TAGS_MAP = new Map(CLINICAL_TAGS.map((t) => [t.value, t]));

function extractExplicitTags(value) {
  const values = Array.isArray(value)
    ? value
    : String(value || '').split(/[,|;]/);
  return values
    .map((valueItem) => String(valueItem).trim())
    .filter((valueItem) => CLINICAL_TAGS_MAP.has(valueItem));
}

/**
 * Parsea el perfil de un jugador (o texto libre histórico) y devuelve un array de tags canónicos.
 * Soporta arrays directos, cadenas separadas por comas, o detección retrocompatible en texto libre.
 */
export function parsePlayerClinicalTags(playerOrTags) {
  if (!playerOrTags) return [];

  // Si ya es un array de strings
  if (Array.isArray(playerOrTags)) {
    return Array.from(new Set(playerOrTags.filter((v) => CLINICAL_TAGS_MAP.has(v))));
  }

  // Si es un objeto jugador, se leen intolerancias o tags clínicos explícitos.
  if (typeof playerOrTags === 'object') {
    return Array.from(new Set([
      ...extractExplicitTags(playerOrTags.intolerancias),
      ...extractExplicitTags(playerOrTags.clinical_tags),
      ...extractExplicitTags(playerOrTags.tags),
    ]));
  }

  // Si es un string, solo se aceptan valores exactos del registro canónico.
  if (typeof playerOrTags === 'string') {
    return Array.from(new Set(extractExplicitTags(playerOrTags)));
  }

  return [];
}

/**
 * Formatea una lista de tags clínicos para mostrar en UI o PDF.
 * Ejemplo: ['sin_gluten', 'sin_lactosa'] -> '🌾 Sin Gluten, 🥛 Sin Lactosa'
 */
export function formatClinicalTags(tags, { useShortLabel = false, noIcons = false } = {}) {
  if (!tags) return '';
  const tagList = Array.isArray(tags) ? tags : parsePlayerClinicalTags(tags);
  if (tagList.length === 0) return 'Ninguna registrada';

  return tagList
    .map((val) => {
      const def = CLINICAL_TAGS_MAP.get(val);
      if (!def) return val;
      if (noIcons) {
        return useShortLabel ? def.shortLabel : def.label.replace(/^[^\w\s\d]+\s*/u, '');
      }
      return useShortLabel ? `${def.icon} ${def.shortLabel}` : def.label;
    })
    .join(', ');
}
