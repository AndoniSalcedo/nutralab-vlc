// Estrategia de hidratación personal del jugador: a partir de su peso, el sodio en sudor,
// la última osmolaridad y lo que ha bebido en sus partidos, "lo que debería beber".
// Pautas de referencia: ACSM/IOC (5-7 ml/kg 2-4 h antes, 0,4-0,8 L/h durante, 1,25-1,5 L por kg
// perdido después, 30-60 g/h de hidratos en esfuerzos > 1 h).
import { calculateHydration } from '@/lib/metrics/anthropometry';
import { buildSessionFromRows, calculatePlayerTotals } from '@/config/intrapartido';

const MATCH_HOURS = 1.6; // 90 min + descanso y añadidos
const OSM_RECENT_DAYS = 14;

// Mismos umbrales de sodio en sudor (mg/L) que la escala del widget de sudoración
const SODIUM_LEVELS = [
  { max: 750, key: 'bajo', label: 'Sodio en sudor bajo', drinkMgL: [300, 500] },
  { max: 1100, key: 'moderado', label: 'Sodio en sudor moderado', drinkMgL: [500, 800] },
  { max: 1450, key: 'alto', label: 'Sodio en sudor alto', drinkMgL: [800, 1000] },
  { max: Infinity, key: 'muy_alto', label: 'Sodio en sudor muy alto', drinkMgL: [1000, 1500] },
];
// Estado que da el dispositivo ("Low Sodium", "Very High Sodium"...): manda sobre el valor
const SODIUM_BY_ESTADO = [
  [/very|muy/, 3],
  [/high|alto/, 2],
  [/moderate|moderado|medio/, 1],
  [/low|bajo/, 0],
];

// Osmolaridad salival (mOsm) como la clasifica el dispositivo: ≤65 hidratado, 66-100 leve,
// 101-150 moderada, >150 severa. Se usa el estado del registro y, si falta, el valor.
const OSM_LEVELS = [
  { key: 'optimo', max: 65, estado: /^hydrated|^hidratado|bien hidratado/, label: 'Bien hidratado en tu última medición', extraMl: 0 },
  { key: 'leve', max: 100, estado: /mild|leve/, label: 'Deshidratación leve en tu última medición', extraMl: 500 },
  { key: 'moderada', max: 150, estado: /moderate|moderada/, label: 'Deshidratación moderada en tu última medición', extraMl: 1000 },
  { key: 'severa', max: Infinity, estado: /sever|severa/, label: 'Deshidratación severa en tu última medición', extraMl: 1000 },
];

const round50 = (value) => Math.round(value / 50) * 50;
const isSweat = (record) => String(record?.tipo || '').toLowerCase().trim() === 'sweat';

function latestBy(records, predicate) {
  return (records || [])
    .filter((r) => r?.fecha && predicate(r))
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .at(-1) || null;
}

function sodiumLevel(sweatRecord) {
  if (!sweatRecord) return null;
  const value = Number(sweatRecord.valor);
  const valueMgL = Number.isFinite(value) && value > 0 ? value : null;
  const estado = String(sweatRecord.estado || '').toLowerCase();
  const byEstado = SODIUM_BY_ESTADO.find(([pattern]) => pattern.test(estado))?.[1];
  if (byEstado != null) return { ...SODIUM_LEVELS[byEstado], valueMgL };
  return valueMgL == null ? null : { ...SODIUM_LEVELS.find((level) => valueMgL < level.max), valueMgL };
}

function osmStatus(osmRecord, today) {
  if (!osmRecord) return null;
  const ageDays = Math.round((new Date(`${today}T12:00:00Z`) - new Date(`${String(osmRecord.fecha).slice(0, 10)}T12:00:00Z`)) / 86400000);
  if (ageDays > OSM_RECENT_DAYS) return null;
  const value = Number(osmRecord.valor);
  const estado = String(osmRecord.estado || '').toLowerCase().trim();
  // "Hydrated" se comprueba aparte: "Mildly Dehydrated" también contiene "hydrated"
  const level = OSM_LEVELS.slice(1).find((l) => l.estado.test(estado))
    || (OSM_LEVELS[0].estado.test(estado) ? OSM_LEVELS[0] : null)
    || (Number.isFinite(value) && value > 0 ? OSM_LEVELS.find((l) => value <= l.max) : null);
  if (!level) return null;
  return { value: Number.isFinite(value) ? value : null, fecha: osmRecord.fecha, level: level.key, label: level.label, extraMl: level.extraMl };
}

// Media por partido de lo que tomó el jugador en sus controles intrapartido
function matchAverages(historial, playerId) {
  const totals = (historial || []).map(({ match, convocado, tomas }) => {
    const session = buildSessionFromRows(match, [convocado], tomas);
    return calculatePlayerTotals(session.intakes[String(playerId)] || {});
  });
  if (!totals.length) return null;
  const avg = (key) => totals.reduce((sum, t) => sum + (Number(t[key]) || 0), 0) / totals.length;
  return { matches: totals.length, aguaMl: Math.round(avg('aguaMl')), sodioMg: Math.round(avg('sodioMg')), carbsG: Math.round(avg('carbsG')) };
}

/**
 * @param {{ jugadorId, weightKg, registrosHidratacion, historialIntrapartido, dayType, today }} input
 * @returns {object|null} null si no hay peso (no se puede personalizar)
 */
export function buildHydrationStrategy({ jugadorId, weightKg, registrosHidratacion = [], historialIntrapartido = [], dayType = 'partido', today }) {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight < 40 || weight > 160) return null;

  const sodium = sodiumLevel(latestBy(registrosHidratacion, isSweat));
  const osm = osmStatus(latestBy(registrosHidratacion, (r) => !isSweat(r)), today);
  const history = matchAverages(historialIntrapartido, jugadorId);

  // Sin tasa de sudoración medida: litros/hora según el peso dentro del rango de referencia
  const perHour = Math.min(900, Math.max(500, round50(weight * 8)));
  const duringMl = round50(perHour * MATCH_HOURS);
  const drinkMgL = sodium?.drinkMgL || [400, 700];
  const sodiumTarget = [round50((duringMl / 1000) * drinkMgL[0]), round50((duringMl / 1000) * drinkMgL[1])];
  const carbsTarget = [Math.round(30 * MATCH_HOURS), Math.round(60 * MATCH_HOURS)];

  const plan = {
    dailyMl: calculateHydration(weight, dayType) + (osm?.extraMl || 0),
    pre: { minMl: round50(weight * 5), maxMl: round50(weight * 7) },
    warmupMl: [150, 250],
    during: { perHourMl: perHour, totalMl: duringMl, halftimeMl: round50(duringMl * 0.35) },
    drinkSodiumMgL: drinkMgL,
    sodiumMg: sodiumTarget,
    carbsG: carbsTarget,
    postMlPerKg: [1250, 1500],
  };

  const tips = [];
  const osmValue = osm?.value ? ` (${Math.round(osm.value)} mOsm)` : '';
  if (osm?.level === 'severa' || osm?.level === 'moderada') tips.push(`Tu última osmolaridad${osmValue} indica deshidratación ${osm.level}: suma ~1 L más hoy y avisa a nutrición.`);
  else if (osm?.level === 'leve') tips.push(`Tu última osmolaridad${osmValue} indica deshidratación leve: suma ~500 ml más hoy.`);
  if (sodium?.key === 'alto' || sodium?.key === 'muy_alto') tips.push('Pierdes mucha sal al sudar: usa bebida con electrolitos (no solo agua) y sala un poco más la comida previa.');
  if (sodium?.key === 'bajo') tips.push('Pierdes poca sal al sudar: con isotónica normal es suficiente.');
  if (!sodium) tips.push('Aún no tienes test de sudor: la pauta de sodio es la estándar. Pide a nutrición que te lo midan.');
  if (history) {
    if (history.aguaMl < duringMl * 0.7) tips.push(`En tus partidos bebes ~${history.aguaMl} ml: intenta acercarte a ${duringMl} ml (aprovecha calentamiento, pausas y descanso).`);
    else tips.push(`En tus partidos bebes ~${history.aguaMl} ml: vas bien, mantén ese ritmo.`);
    if (history.sodioMg < sodiumTarget[0] * 0.7) tips.push(`El sodio que tomas en partido (~${history.sodioMg} mg) se queda corto: tu objetivo es ${sodiumTarget[0]}-${sodiumTarget[1]} mg.`);
    if (history.carbsG < carbsTarget[0] * 0.7) tips.push(`Tomas pocos hidratos durante el partido (~${history.carbsG} g): un gel o isotónica en el descanso te ayuda en la 2ª parte.`);
  }

  return { weightKg: weight, sodium, osm, history, plan, tips };
}
