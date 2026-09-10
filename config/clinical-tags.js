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
    patterns: [/gluten/i, /celiac/i, /cel[ií]ac/i, /\btrigo\b/i],
  },
  {
    value: 'sin_lactosa',
    label: '🥛 Intolerancia a la Lactosa / Sin Lácteos',
    shortLabel: 'Sin Lactosa',
    icon: '🥛',
    description: 'Excluye lácteos tradicionales con lactosa; incluye lácteos sin lactosa y bebidas vegetales',
    patterns: [/lactosa/i, /l[aá]cteos/i, /\bleche\b/i, /\bcase[ií]na\b/i, /\bwhey\b/i],
  },
  {
    value: 'sin_proteina_vaca',
    label: '🐮 APLV / Alergia a la Proteína de Vaca',
    shortLabel: 'Sin Proteína de Vaca (APLV)',
    icon: '🐮',
    description: 'Excluye estrictamente todos los lácteos de vaca (incluso sin lactosa), quesos, yogures, mantequilla, suero/whey y caseína',
    patterns: [/aplv/i, /prote[ií]na.*vaca/i, /prote[ií]na.*leche/i, /alergia.*leche/i, /alergia.*l[aá]ctea/i, /cow.*milk.*protein/i, /cmpa/i],
  },
  {
    value: 'sibo_low_fodmap',
    label: '🦠 SIBO General / Bajo FODMAP',
    shortLabel: 'SIBO General',
    icon: '🦠',
    description: 'Excluye alimentos altamente fermentables (FODMAP): legumbres, cebolla, coliflor, lácteos enteros',
    patterns: [/sibo/i, /fodmap/i, /flatulent/i, /digestiv/i],
  },
  {
    value: 'sibo_hidrogeno',
    label: '💨 SIBO Hidrógeno (Diarrea / Bajo FODMAP)',
    shortLabel: 'SIBO Hidrógeno',
    icon: '💨',
    description: 'Sobrecrecimiento bacteriano productor de H2 con diarrea o tránsito rápido. Dieta estricta Baja en FODMAP',
    patterns: [/sibo.*hidr[oó]geno/i, /sibo.*h2\b/i, /(?<!sulfuro.*)hidr[oó]geno/i],
  },
  {
    value: 'sibo_metano_imo',
    label: '🪨 SIBO Metano / IMO (Estreñimiento / Bajo FODMAP)',
    shortLabel: 'SIBO Metano (IMO)',
    icon: '🪨',
    description: 'Sobrecrecimiento de arqueas (IMO) con motilidad lenta y estreñimiento. Dieta Baja en FODMAP + procinéticos',
    patterns: [/sibo.*metano/i, /\bimo\b/i, /methano/i, /metanog[eé]nic/i],
  },
  {
    value: 'sibo_mixto',
    label: '🔄 SIBO Mixto (Hidrógeno + Metano)',
    shortLabel: 'SIBO Mixto',
    icon: '🔄',
    description: 'Sobrecrecimiento mixto de bacterias y arqueas con alternancia de tránsito. Dieta Baja en FODMAP estricta',
    patterns: [/sibo.*mixto/i, /sibo.*combinado/i],
  },
  {
    value: 'sibo_sulfuro',
    label: '🧪 SIBO Sulfhídrico / Sulfuro (Bajo en Azufre)',
    shortLabel: 'SIBO Sulfhídrico',
    icon: '🧪',
    description: 'Excluye alimentos ricos en FODMAP y alimentos ricos en azufre/sulfatos: crucíferas, huevos, ajo, cebolla y carnes rojas',
    patterns: [/sibo.*sulf/i, /sulfh[ií]drico/i, /sulfuro/i, /h2s/i, /azufre/i],
  },
  {
    value: 'colon_irritable',
    label: '🩺 Colon Irritable / SII (Bajo FODMAP)',
    shortLabel: 'Colon Irritable (SII)',
    icon: '🩺',
    description: 'Excluye alimentos altamente fermentables (FODMAP): legumbres, cebolla, ajo, coliflor y lácteos enteros',
    patterns: [/colon.*irritable/i, /\bsii\b/i, /\bibs\b/i, /intestino.*irritable/i],
  },
  {
    value: 'sin_fructosa',
    label: '🍎 Intolerancia / Alergia a la Fructosa',
    shortLabel: 'Sin Fructosa',
    icon: '🍎',
    description: 'Excluye frutas ricas en fructosa (manzana, pera, mango, sandía, uva, desecadas), miel, mermeladas, zumos y dulces',
    patterns: [/fructosa/i, /fructose/i, /frutaosa/i, /malabsorci[oó]n.*fructosa/i, /intoleran.*fructosa/i, /alergia.*fructosa/i],
  },
  {
    value: 'sin_cerdo',
    label: '🐷 Sin Cerdo / Halal',
    shortLabel: 'Sin Cerdo / Halal',
    icon: '🐷',
    description: 'Excluye carnes de cerdo, embutidos (jamón, lomo, secreto, bacon)',
    patterns: [/cerdo/i, /pork/i, /jam[oó]n/i, /halal/i, /lomo embuchado/i],
  },
  {
    value: 'sin_pescado',
    label: '🐟 Alergia al Pescado',
    shortLabel: 'Sin Pescado',
    icon: '🐟',
    description: 'Excluye pescados blancos y azules (merluza, salmón, atún, bacalao, dorada...)',
    patterns: [/pescado/i, /\bfish\b/i, /merluza/i, /salm[oó]n/i, /at[uú]n/i, /bacalao/i],
  },
  {
    value: 'sin_marisco',
    label: '🦐 Alergia al Marisco',
    shortLabel: 'Sin Marisco',
    icon: '🦐',
    description: 'Excluye crustáceos y moluscos (gambas, langostinos, mejillones, almejas)',
    patterns: [/marisco/i, /seafood/i, /gamba/i, /langostino/i, /mejill[oó]n/i],
  },
  {
    value: 'sin_huevo',
    label: '🥚 Alergia al Huevo',
    shortLabel: 'Sin Huevo',
    icon: '🥚',
    description: 'Excluye huevos enteros, tortillas y claras',
    patterns: [/huevo/i, /\begg\b/i, /clara/i],
  },
  {
    value: 'sin_frutos_secos',
    label: '🥜 Alergia a Frutos Secos / Cacahuetes',
    shortLabel: 'Sin Frutos Secos',
    icon: '🥜',
    description: 'Excluye nueces, almendras, avellanas, cacahuetes, anacardos y cremas de frutos secos',
    patterns: [/fruto.*seco/i, /cacahuete/i, /man[ií]/i, /nuez/i, /nueces/i, /almendra/i, /avellana/i],
  },
  {
    value: 'sin_soja',
    label: '🫘 Alergia a la Soja',
    shortLabel: 'Sin Soja',
    icon: '🫘',
    description: 'Excluye soja, tofu, edamame, soja texturizada y salsas con soja',
    patterns: [/soja/i, /\bsoy\b/i, /tofu/i, /edamame/i],
  },
  {
    value: 'sin_carne_roja',
    label: '🥩 Sin Carne Roja / Pescetariano',
    shortLabel: 'Sin Carne Roja',
    icon: '🥩',
    description: 'Excluye carnes rojas (ternera, buey, cordero)',
    patterns: [/carne roja/i, /ternera/i, /pescetariano/i],
  },
  {
    value: 'vegetariano',
    label: '🥗 Dieta Vegetariana',
    shortLabel: 'Vegetariano',
    icon: '🥗',
    description: 'Excluye todas las carnes, aves, pescados y mariscos',
    patterns: [/vegetariano/i, /vegetarian/i],
  },
  {
    value: 'vegano',
    label: '🌱 Dieta Vegana',
    shortLabel: 'Vegano',
    icon: '🌱',
    description: 'Excluye todos los alimentos de origen animal (carnes, pescados, huevos y lácteos)',
    patterns: [/vegano/i, /\bvegan\b/i],
  },
];

export const CLINICAL_TAGS_MAP = new Map(CLINICAL_TAGS.map((t) => [t.value, t]));

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

  // Si es un objeto jugador
  let rawStr = '';
  if (typeof playerOrTags === 'object') {
    // Si viene en intolerancias
    const intol = playerOrTags.intolerancias || '';
    const alerg = playerOrTags.alergias || '';
    const context = playerOrTags.contexto_clinico || '';
    rawStr = `${intol}, ${alerg}`;

    // Si tiene tags exactos separados por comas o pipes
    const tokens = rawStr.split(/[,|;]/).map((s) => s.trim()).filter(Boolean);
    const exactMatches = tokens.filter((t) => CLINICAL_TAGS_MAP.has(t));
    if (exactMatches.length > 0) {
      return Array.from(new Set(exactMatches));
    }

    // Si no contiene tags canónicos directos, analizamos con regex para compatibilidad hacia atrás
    const detected = new Set();
    const searchable = `${intol} ${alerg}`.toLowerCase();

    for (const tag of CLINICAL_TAGS) {
      if (tag.patterns.some((p) => p.test(searchable))) {
        detected.add(tag.value);
      }
      // Chequear subtipos de SIBO o Colon Irritable específicamente en contexto clínico si se menciona
      if (tag.value === 'sibo_sulfuro' && /sulfh[ií]drico|sulfuro|h2s|azufre/i.test(context)) {
        detected.add(tag.value);
      } else if (tag.value === 'sibo_hidrogeno' && /hidr[oó]geno|h2\b/i.test(context)) {
        detected.add(tag.value);
      } else if (tag.value === 'sibo_metano_imo' && /metano|imo\b|methano/i.test(context)) {
        detected.add(tag.value);
      } else if (tag.value === 'sibo_mixto' && /mixto|combinado/i.test(context) && /sibo/i.test(context)) {
        detected.add(tag.value);
      } else if (tag.value === 'sibo_low_fodmap' && /sibo|fodmap/i.test(context)) {
        detected.add(tag.value);
      }
      if (tag.value === 'colon_irritable' && /colon|sii\b|ibs\b|intestino.*irritable/i.test(context)) {
        detected.add(tag.value);
      }
    }

    // Si se detectó un subtipo específico de SIBO, eliminar el genérico para evitar duplicación en UI
    if (detected.has('sibo_sulfuro')) {
      detected.delete('sibo_hidrogeno');
    }
    if (detected.has('sibo_hidrogeno') || detected.has('sibo_metano_imo') || detected.has('sibo_mixto') || detected.has('sibo_sulfuro')) {
      detected.delete('sibo_low_fodmap');
    }

    return Array.from(detected);
  }

  // Si es un string simple
  if (typeof playerOrTags === 'string') {
    const tokens = playerOrTags.split(/[,|;]/).map((s) => s.trim()).filter(Boolean);
    const exactMatches = tokens.filter((t) => CLINICAL_TAGS_MAP.has(t));
    if (exactMatches.length > 0) {
      return Array.from(new Set(exactMatches));
    }
    const detected = new Set();
    const lower = playerOrTags.toLowerCase();
    for (const tag of CLINICAL_TAGS) {
      if (tag.patterns.some((p) => p.test(lower))) {
        detected.add(tag.value);
      }
    }

    // Si se detectó un subtipo específico de SIBO, eliminar el genérico para evitar duplicación en UI
    if (detected.has('sibo_sulfuro')) {
      detected.delete('sibo_hidrogeno');
    }
    if (detected.has('sibo_hidrogeno') || detected.has('sibo_metano_imo') || detected.has('sibo_mixto') || detected.has('sibo_sulfuro')) {
      detected.delete('sibo_low_fodmap');
    }

    return Array.from(detected);
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
