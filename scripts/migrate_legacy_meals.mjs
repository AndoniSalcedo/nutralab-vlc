import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const out = {};
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  });
  return out;
}

const env = parseEnv(path.join(process.cwd(), '.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: env.SUPABASE_SCHEMA || 'teams' },
});

const aiClient = new Anthropic({ apiKey: env.AI_API_KEY });
const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--commit');

async function parseMealsWithClaude(mealsMap, _isPreMatch = false) {
  const mealsToProcess = {};
  const results = {};

  for (const [mealName, val] of Object.entries(mealsMap)) {
    const rawText = typeof val === 'string' ? val.trim() : (val?.raw || val?.text || '').trim();
    const low = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isComplete = !rawText || [
      'variadas', 'variado', 'come variable', 'variable', 'libre', 'variadas saludables',
      'opciones variadas dulces saludables', 'variado le gusta comer sano', 'saludable',
    ].some((p) => low === p || low.startsWith(p));

    if (isComplete) {
      results[mealName] = {
        isComplete: true,
        proteina: [],
        hidrato: [],
        verdura: [],
        fruta: [],
        lacteo: [],
        grasa: null,
        raw: rawText || 'Variado',
        label: 'Árbol completo (rotación variada)',
        isValid: true,
      };
    } else {
      mealsToProcess[mealName] = rawText;
    }
  }

  if (Object.keys(mealsToProcess).length === 0) {
    return results;
  }

  const prompt = `Actúa como chef y nutricionista deportivo de élite del Valencia CF.
Tu misión es estructurar las tomas de alimentación de un jugador en los componentes canónicos de nuestro Árbol Nutricional oficial (FOOD_TREE).

CLASIFICA CADA TOMA EN SUS CATEGORÍAS TIPADAS:
- "proteina": array con las fuentes de proteína (ej: "Pollo (Genérico)", "Huevos", "Pechuga de pollo", "Ternera magra", "Salmón", "Atún fresco", "Sepia", "Proteínas", "Merluza", "Jamón serrano", etc.)
- "hidrato": array con las fuentes de hidratos/cereales/tubérculos (ej: "Arroz (Grupo genérico)", "Pasta (Grupo genérico)", "Patata", "Boniato", "Panes (Grupo genérico)", "Copos de avena", "Hidratos de Carbono", "Quinoa", etc.)
- "verdura": array con verduras y hortalizas (ej: "Tomate", "Calabacín", "Zanahoria", "Hojas verdes y ensaladas", "Verduras y Hortalizas", "Espinacas", etc.)
- "fruta": array con frutas (ej: "Plátano", "Manzana", "Frutas", "Naranja", "Dátil", etc.)
- "lacteo": array con lácteos y postres (ej: "Arroz con leche", "Yogur natural", "Yogur proteico natural", "Leches (Grupo genérico)", "Kéfir", etc.)
- "grasa": string o null (ej: "AOVE", "Aguacate", "Nueces", o null)
- "isComplete": boolean (true si es comida libre/variada/saludable por defecto)
- "unrecognized": array con términos ininteligibles o no alimentarios si los hay.

Tomas a analizar:
${JSON.stringify(mealsToProcess, null, 2)}

Devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "results": {
    "NombreDeLaComida": {
      "isComplete": false,
      "proteina": [],
      "hidrato": [],
      "verdura": [],
      "fruta": [],
      "lacteo": [],
      "grasa": null,
      "unrecognized": []
    }
  }
}`;

  const aiRes = await aiClient.messages.create({
    model: env.CHAT_MODEL || 'claude-sonnet-5',
    max_tokens: 3000,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = aiRes.content?.find((c) => c.type === 'text')?.text || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se pudo parsear la respuesta JSON de Claude');
  }

  const aiParsed = JSON.parse(jsonMatch[0]);
  const aiResults = aiParsed.results || {};

  for (const [mName, rawText] of Object.entries(mealsToProcess)) {
    const item = aiResults[mName] || { isComplete: false, proteina: [], hidrato: [], verdura: [], fruta: [], lacteo: [], grasa: null, unrecognized: [] };
    const parts = [
      ...(item.hidrato || []),
      ...(item.proteina || []),
      ...(item.verdura || []),
      ...(item.fruta || []),
      ...(item.lacteo || []),
      ...(item.grasa ? [item.grasa] : []),
    ];

    results[mName] = {
      isComplete: Boolean(item.isComplete),
      proteina: item.proteina || [],
      hidrato: item.hidrato || [],
      verdura: item.verdura || [],
      fruta: item.fruta || [],
      lacteo: item.lacteo || [],
      grasa: item.grasa || null,
      raw: rawText,
      label: parts.length > 0 ? parts.join(' + ') : 'Árbol completo',
      isValid: !(item.unrecognized && item.unrecognized.length > 0),
      unrecognized: item.unrecognized || [],
    };
  }

  return results;
}

async function main() {
  console.log(`\n======================================================`);
  console.log(` MIGRACIÓN DE PAUTAS LEGACY A ESTRUCTURA TIPADA`);
  console.log(` Modo: ${isDryRun ? 'DRY-RUN (Simulación sin guardar)' : 'COMMIT (Guardando en Supabase)'}`);
  console.log(`======================================================\n`);

  const { data: players, error } = await supabase
    .from('jugadores')
    .select('id, nombre, num_comidas, recomendaciones_defecto, config_prepartido');

  if (error) {
    console.error('Error al cargar jugadores:', error);
    return;
  }

  const configuredPlayers = players.filter((p) => {
    const hasRecs = p.recomendaciones_defecto && Object.keys(p.recomendaciones_defecto).length > 0;
    const hasPre = p.config_prepartido && Object.keys(p.config_prepartido).length > 0;
    return hasRecs || hasPre;
  });

  console.log(`Jugadores con datos a migrar: ${configuredPlayers.length}\n`);

  for (const player of configuredPlayers) {
    console.log(`\n------------------------------------------------------`);
    console.log(`PROCESANDO: ${player.nombre} (ID: ${player.id})`);
    console.log(`------------------------------------------------------`);

    let newRecsDefecto = { ...(player.recomendaciones_defecto || {}) };
    let newConfigPre = { ...(player.config_prepartido || {}) };

    // 1. Migrar recomendaciones_defecto
    if (player.recomendaciones_defecto && Object.keys(player.recomendaciones_defecto).length > 0) {
      console.log(`> Analizando recomendaciones habituales con Claude...`);
      const parsed = await parseMealsWithClaude(player.recomendaciones_defecto, false);
      newRecsDefecto = parsed;
      for (const [meal, data] of Object.entries(parsed)) {
        console.log(`  [${meal}] "${data.raw}" -> ${data.label}`);
      }
    }

    // 2. Migrar config_prepartido
    if (player.config_prepartido && Object.keys(player.config_prepartido).length > 0) {
      for (const [scheduleKey, sched] of Object.entries(player.config_prepartido)) {
        const recs = { ...(sched?.recomendaciones || {}) };
        if (sched?.dia_anterior && !recs.Cena && !recs.cena) {
          recs.Cena = sched.dia_anterior;
        }

        if (Object.keys(recs).length > 0) {
          console.log(`> Analizando protocolo pre-partido (${scheduleKey}) con Claude...`);
          const parsedPre = await parseMealsWithClaude(recs, true);
          newConfigPre[scheduleKey] = {
            ...sched,
            recomendaciones: parsedPre,
          };
          for (const [meal, data] of Object.entries(parsedPre)) {
            console.log(`  (${scheduleKey}) [${meal}] "${data.raw}" -> ${data.label}`);
          }
        }
      }
    }

    if (!isDryRun) {
      console.log(`> Guardando cambios en Supabase para ${player.nombre}...`);
      const { error: updateErr } = await supabase
        .from('jugadores')
        .update({
          recomendaciones_defecto: newRecsDefecto,
          config_prepartido: newConfigPre,
        })
        .eq('id', player.id);

      if (updateErr) {
        console.error(`Error actualizando ${player.nombre}:`, updateErr);
      } else {
        console.log(`✓ ${player.nombre} migrado exitosamente.`);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(` Proceso completado ${isDryRun ? '(Simulación terminada)' : '(Base de datos actualizada)'}.`);
  console.log(`======================================================\n`);
}

main();
