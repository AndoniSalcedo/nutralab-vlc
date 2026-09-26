import { aiClient as client } from './client';
import { env } from '@/config/env';
import { findTreeNode } from '@/lib/engine';

/**
 * Desglosa los platos del menú semanal en ingredientes elementales.
 * - Proteínas: especifica el corte/alimento real del catálogo (ej. "Contramuslo de pollo deshuesado", "Pechuga de pollo", "Solomillo de ternera", "Merluza", "Sepia").
 * - Hidratos: genéricos cuando aplica (ej. "pasta", "arroz", "patata", "boniato", "fideos", "lentejas").
 * - Verduras: verduras reales en crudo (ej. "Calabacín", "Pimiento verde", "Zanahoria").
 * - Grasa: "AOVE".
 */
export async function decomposeDishListWithAI(dishes) {
  if (!dishes || dishes.length === 0) return {};

  const chunkSize = 25;
  const chunks = [];
  for (let i = 0; i < dishes.length; i += chunkSize) {
    chunks.push(dishes.slice(i, i + chunkSize));
  }

  async function processChunk(chunk) {
    const prompt = `Actúa como chef y nutricionista deportivo de élite del Valencia CF.
Desglosa cada uno de los siguientes platos del comedor en sus ingredientes elementales en crudo:

REGLAS ESENCIALES:
1. "proteina": array con los alimentos proteicos reales. ¡IMPORTANTE! En carnes y aves DEBES IDENTIFICAR EL CORTE O PREPARACIÓN EXACTA, nunca un genérico difuso. Por ejemplo:
   - Si el plato indica "contramuslo", pon "Contramuslo de pollo deshuesado".
   - Si indica "pechuga" o "pollo asado", pon "Pechuga de pollo".
   - Si indica "alitas", pon "Alitas de pollo".
   - Si indica "carne picada", pon "Carne picada de ternera" o "Carne picada de pollo" según corresponda.
   - Si indica "solomillo", pon "Solomillo de ternera".
   - Si indica "carrillera" o "creps de carrillera", pon "Carrillera de ternera".
   - Si indica "chuletas de pavo", pon "Pechuga de pavo".
   - Si indica "secreto", pon "Secreto ibérico" o "Lomo de cerdo".
   - Si indica pescados o mariscos, pon el pescado exacto: "Merluza", "Rape", "Corvina", "Gallineta", "Sepia", "Atún fresco", "Gambas", "Bacalao".
   - Si el plato no lleva carne, pescado ni huevos principales, pon null.
2. "hidrato": alimento o cereal base. La pasta es genérica ("pasta", que luego se adaptará a trigo o sin gluten según el historial del jugador). El arroz ("arroz"), la patata ("patata"), el boniato ("boniato"), los fideos ("fideos") o las lentejas ("lentejas"). Si no lleva, pon null.
3. "verdura": array de verduras específicas en crudo (ej: ["Calabacín", "Pimiento verde"], ["Tomate", "Zanahoria"], ["Champiñón"], ["Espinacas"]). Si no lleva, pon null.
4. "fruta": array de frutas si es postre o lleva fruta fresca (ej: ["Fruta fresca"], ["Fruta de temporada"], ["Plátano"], ["Manzana"]). Si no lleva, pon null.
5. "lacteo": array de lácteos o yogures si es postre o lácteo proteico (ej: ["Yogur proteico"], ["Yogur natural"], ["Kéfir"], ["Queso fresco"]). Si no lleva, pon null.
6. "grasa": "AOVE" o null. Solo si es un plato cocinado con aceite (plancha, horno, salteado, guiso). NUNCA en postres, frutas ni yogures.

Platos a desglosar:
${JSON.stringify(chunk, null, 2)}

Devuelve ÚNICAMENTE un objeto JSON donde cada clave sea el nombre exacto del plato y el valor un objeto con:
{
  "nombre": string (nombre del plato),
  "proteina": array de strings o null,
  "hidrato": string o null,
  "verdura": array de strings o null,
  "fruta": array de strings o null,
  "lacteo": array de strings o null,
  "grasa": string o null
}`;

    const res = await client.messages.create({
      model: env.AI_MODEL,
      max_tokens: 4000,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: prompt }],
    });

    const text = res.content.find((c) => c.type === 'text')?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se pudo extraer JSON en el desglose de platos');
    return JSON.parse(jsonMatch[0]);
  }

  const results = await Promise.all(chunks.map((c) => processChunk(c)));
  const merged = Object.assign({}, ...results);
  const canonicalMap = {};
  Object.entries(merged).forEach(([k, v]) => {
    canonicalMap[k] = canonicalizeDecomposedDish(v);
  });
  return canonicalMap;
}

function canonicalizeDecomposedDish(dish) {
  if (!dish) return dish;

  function resolveItem(str) {
    if (!str || typeof str !== 'string') return null;
    const node = findTreeNode(str);
    if (!node) return str.trim();
    if (node.isGeneric) return node.id;
    if (Array.isArray(node.foodNames) && node.foodNames.length > 0) return node.foodNames[0];
    return node.label || str.trim();
  }

  function resolveList(arr) {
    if (!arr) return null;
    const list = Array.isArray(arr) ? arr : [arr];
    const resolved = list.map(resolveItem).filter(Boolean);
    return resolved.length > 0 ? resolved : null;
  }

  return {
    nombre: dish.nombre,
    proteina: resolveList(dish.proteina),
    hidrato: resolveItem(dish.hidrato),
    verdura: resolveList(dish.verdura),
    fruta: resolveList(dish.fruta),
    lacteo: resolveList(dish.lacteo),
    grasa: dish.grasa || null,
  };
}

export function isServiceEvent(text) {
  if (!text || typeof text !== 'string') return true;
  const upper = text.toUpperCase().trim();
  return (
    upper.includes('PREPARTIDO') ||
    upper.includes('PARTIDO') ||
    upper.includes('DESCANSO') ||
    upper.includes('LIBRE') ||
    upper.includes('PICNIC') ||
    upper.includes('HOTEL') ||
    upper.includes('SIN REGISTRAR') ||
    upper === '-'
  );
}

/**
 * Recorre los días de un menú semanal y enriquece comida y cena con su array platos_desglosados
 */
export async function enrichMenuWithDecomposedDishes(dias) {
  if (!Array.isArray(dias) || dias.length === 0) return dias;

  // 1. Recopilar todos los platos únicos de comida y cena (incluyendo postres, excluyendo eventos)
  const dishSet = new Set();
  dias.forEach((d) => {
    ['comida', 'cena'].forEach((service) => {
      ['primero', 'segundo', 'postre'].forEach((course) => {
        const text = d[service]?.[course];
        if (text && typeof text === 'string') {
          text.split('/').forEach((p) => {
            const trimmed = p.trim();
            if (trimmed && !isServiceEvent(trimmed)) {
              dishSet.add(trimmed);
            }
          });
        }
      });
    });
  });

  const dishes = Array.from(dishSet);
  if (dishes.length === 0) return dias;

  // 2. Desglosar con la IA
  const decomposedMap = await decomposeDishListWithAI(dishes);

  // 3. Inyectar platos_desglosados a cada día y servicio solo para platos reales desglosados
  return dias.map((d) => {
    const newComida = { ...(d.comida || {}) };
    const newCena = { ...(d.cena || {}) };

    function getDishesForService(serviceData) {
      const list = [];
      const seen = new Set();
      ['primero', 'segundo', 'postre'].forEach((course) => {
        const text = serviceData?.[course];
        if (text && typeof text === 'string') {
          text.split('/').forEach((p) => {
            const trimmed = p.trim();
            if (trimmed && !seen.has(trimmed) && !isServiceEvent(trimmed)) {
              seen.add(trimmed);
              const found = decomposedMap[trimmed];
              if (found) {
                list.push({ ...found, curso: course });
              }
            }
          });
        }
      });
      return list;
    }

    newComida.platos_desglosados = getDishesForService(newComida);
    newCena.platos_desglosados = getDishesForService(newCena);

    return {
      ...d,
      comida: newComida,
      cena: newCena,
    };
  });
}
