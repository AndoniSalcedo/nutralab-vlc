import { NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai/client';
import { env } from '@/config/env';
import {
  findTreeNode,
  getCompleteMealBranches,
} from '@/lib/engine';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { getOwnedPlayer } from '@/lib/auth/team-access';

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { text, mealName = 'Comida', meals, isPreMatch = false, jugadorId = null } = body;

    let jugador = null;
    if (jugadorId) {
      const supabase = getSupabaseAdmin();
      jugador = await getOwnedPlayer(supabase, user, jugadorId);
    }

    // Normalizar a un mapa de comidas { [mealName]: rawText }
    const mealsToProcess = {};
    if (meals && typeof meals === 'object' && Object.keys(meals).length > 0) {
      Object.entries(meals).forEach(([k, v]) => {
        mealsToProcess[k] = typeof v === 'string' ? v.trim() : (v?.raw || '').trim();
      });
    } else if (text !== undefined) {
      mealsToProcess[mealName] = typeof text === 'string' ? text.trim() : '';
    }

    if (Object.keys(mealsToProcess).length === 0) {
      return NextResponse.json({
        success: true,
        results: {},
      });
    }

    // Identificar qué comidas necesitan llamada a IA y cuáles son vacías / Árbol Completo
    const results = {};
    const mealsForAI = {};

    Object.entries(mealsToProcess).forEach(([mName, rawText]) => {
      const low = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const isComplete = !rawText || [
        'variadas', 'variado', 'come variable', 'variable', 'libre', 'variadas saludables',
        'opciones variadas dulces saludables', 'variado le gusta comer sano', 'saludable',
      ].some((p) => low === p || low.startsWith(p));

      if (isComplete) {
        const branches = getCompleteMealBranches(mName, null, jugador, isPreMatch);
        results[mName] = {
          raw: rawText,
          isComplete: true,
          proteina: [],
          hidrato: [],
          verdura: [],
          fruta: [],
          lacteo: [],
          grasa: null,
          branches,
          unrecognized: [],
          isValid: true,
          label: `Árbol completo (${branches.map((b) => b.label).join(' + ')})`,
        };
      } else {
        mealsForAI[mName] = rawText;
      }
    });

    // Si todas eran vacías o Árbol Completo, devolver de inmediato sin llamar a IA
    if (Object.keys(mealsForAI).length === 0) {
      return NextResponse.json({
        success: true,
        results,
        tree: Object.values(results)[0] || null,
      });
    }

    // Consultar a Claude para estructurar el Árbol Nutricional en categorías tipadas
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
- "unrecognized": array con términos ininteligibles o no alimentarios si los hay (ej: palabras sin sentido o errores ininteligibles). Si un término no se puede interpretar como alimento o grupo, colócalo aquí.

Tomas a analizar:
${JSON.stringify(mealsForAI, null, 2)}

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
      return NextResponse.json({
        success: false,
        error: 'No se pudo estructurar el árbol nutricional con la IA. Inténtalo de nuevo.',
      }, { status: 422 });
    }

    const aiParsed = JSON.parse(jsonMatch[0]);
    const aiResults = aiParsed.results || {};

    // Validar los resultados de Claude contra el Árbol canónico
    for (const [mName, rawText] of Object.entries(mealsForAI)) {
      const item = aiResults[mName] || {
        isComplete: false,
        proteina: [],
        hidrato: [],
        verdura: [],
        fruta: [],
        lacteo: [],
        grasa: null,
        unrecognized: [],
      };

      // Si Claude detectó términos no reconocidos
      if (Array.isArray(item.unrecognized) && item.unrecognized.length > 0) {
        return NextResponse.json({
          success: false,
          error: `No se pudo interpretar "${item.unrecognized.join(', ')}" en ${mName}. Por favor, escribe alimentos válidos.`,
          unrecognized: item.unrecognized,
        }, { status: 400 });
      }

      if (item.isComplete) {
        const branches = getCompleteMealBranches(mName, null, jugador, isPreMatch);
        results[mName] = {
          raw: rawText,
          isComplete: true,
          proteina: [],
          hidrato: [],
          verdura: [],
          fruta: [],
          lacteo: [],
          grasa: null,
          branches,
          unrecognized: [],
          isValid: true,
          label: `Árbol completo (${branches.map((b) => b.label).join(' + ')})`,
        };
        continue;
      }

      // Reunir todos los items para armar branches
      const allItems = [
        ...(item.hidrato || []),
        ...(item.proteina || []),
        ...(item.verdura || []),
        ...(item.fruta || []),
        ...(item.lacteo || []),
        ...(item.grasa ? [item.grasa] : []),
      ];

      const branches = [];
      const seenIds = new Set();
      for (const itemName of allItems) {
        const node = findTreeNode(itemName);
        if (node) {
          const nodeId = node.id.toLowerCase();
          if (!seenIds.has(nodeId)) {
            seenIds.add(nodeId);
            branches.push({
              id: node.id,
              label: node.label,
              isGeneric: Boolean(node.isGeneric || !node.isLeaf),
              category: node.id,
              foodName: Array.isArray(node.foodNames) && node.foodNames.length > 0 ? node.foodNames[0] : node.label,
            });
          }
        } else {
          const normKey = itemName.toLowerCase();
          if (!seenIds.has(normKey)) {
            seenIds.add(normKey);
            branches.push({
              id: normKey,
              label: itemName,
              isGeneric: false,
              category: 'especifico',
              foodName: itemName,
            });
          }
        }
      }

      const label = allItems.length > 0 ? allItems.join(' + ') : 'Árbol completo';

      results[mName] = {
        raw: rawText,
        isComplete: false,
        proteina: item.proteina || [],
        hidrato: item.hidrato || [],
        verdura: item.verdura || [],
        fruta: item.fruta || [],
        lacteo: item.lacteo || [],
        grasa: item.grasa || null,
        branches: branches.length > 0 ? branches : getCompleteMealBranches(mName, null, jugador, isPreMatch),
        unrecognized: [],
        isValid: true,
        label,
      };
    }

    return NextResponse.json({
      success: true,
      results,
      tree: Object.values(results)[0] || null,
    });
  } catch (error) {
    console.error('Error en parse-meal-tree:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el árbol nutricional' },
      { status: 500 }
    );
  }
}
