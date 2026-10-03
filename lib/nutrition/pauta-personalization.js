import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import {
  buildPlayerFoodTree,
  canResolveNodeForPlayer,
  createFoodItemFromName,
  getFullFoodTree,
  getNodeFromTree,
} from '@/lib/engine/food-tree';
import { formatAstToText } from '@/lib/engine/meal-ast';
import { normalizeFoodName } from '@/data/foods-crudo';

/**
 * Personalización de pautas: deja en cada pauta (por defecto o de protocolo de partido) solo alimentos que valen al
 * jugador. Se aplica al guardar una pauta y cuando cambian las restricciones del jugador, para que una pauta nunca
 * guarde un alimento que su dueño no puede tomar.
 *
 * Para cada alimento nombrado en la pauta:
 * - si el jugador lo puede tomar, se conserva;
 * - si no, se sustituye por su versión "sin gluten" o "sin lactosa" cuando existe en su catálogo;
 * - si no existe, se elimina de la pauta.
 */

const DIETARY_SUFFIXES = [' sin gluten', ' sin lactosa'];

function buildContext(jugador) {
  // Una pauta vale con y sin menú: se juzga con todo lo que el jugador puede tomar, también lo que en un plan con
  // menú queda fuera de la rotación.
  const menuCatalog = getClinicalCatalogForPlayer(jugador || [], { useMenuCatalog: true });
  const catalog = {
    ...menuCatalog,
    foods: [...menuCatalog.foods, ...menuCatalog.offMenuFoods.values()],
    foodsByNormalizedName: new Map([...menuCatalog.foodsByNormalizedName, ...menuCatalog.offMenuFoods]),
  };
  return { catalog, playerTree: buildPlayerFoodTree(catalog), fullTree: getFullFoodTree() };
}

function isAllowed(catalog, food) {
  const key = normalizeFoodName(food.name);
  return catalog.foodsByNormalizedName.has(key) || catalog.namedOnly?.has(key);
}

// Devuelve el nombre válido para el jugador, otro nombre equivalente, o null si hay que quitarlo.
function resolveLeafName(name, { catalog, playerTree, fullTree }) {
  const concrete = createFoodItemFromName(name, null, fullTree);
  if (concrete) {
    if (isAllowed(catalog, concrete.food)) return name;
    for (const suffix of DIETARY_SUFFIXES) {
      const key = normalizeFoodName(`${concrete.food.name}${suffix}`);
      const variant = catalog.foodsByNormalizedName.get(key) || catalog.namedOnly?.get(key);
      if (variant) return variant.name;
    }
    return null;
  }
  if (!getNodeFromTree(name, fullTree)) return name; // nombre desconocido: no se toca (lo valida el esquema)
  return canResolveNodeForPlayer(name, catalog, playerTree) ? name : null;
}

function personalizeNode(node, ctx, log) {
  if (!node) return null;
  if (node.type === 'food') {
    const resolved = resolveLeafName(node.name, ctx);
    if (resolved === node.name) return node;
    log.push(resolved ? { de: node.name, a: resolved } : { quitado: node.name });
    return resolved ? { ...node, name: resolved } : null;
  }
  const children = (node.children || []).map((child) => personalizeNode(child, ctx, log)).filter(Boolean);
  if (children.length === 0) return null;
  if (children.length === 1 && node.type === 'oneOf') return children[0];
  return { ...node, children };
}

/** Personaliza una pauta. Devuelve { pauta, cambios } (cambios vacío = no se ha tocado nada). */
function personalizePauta(pauta, ctx) {
  if (!pauta?.tree) return { pauta, cambios: [] };
  const cambios = [];
  const tree = personalizeNode(pauta.tree, ctx, cambios);
  if (cambios.length === 0) return { pauta, cambios };
  if (!tree) {
    // Se han quitado todos los alimentos: la toma pasa a rotación variada.
    const rest = { ...pauta };
    delete rest.tree;
    return { pauta: { ...rest, type: 'complete', label: 'Árbol completo (Rotación variada)', unrecognized: [] }, cambios };
  }
  const label = formatAstToText({ tree });
  return { pauta: { ...pauta, tree: { ...tree, label }, label, unrecognized: [] }, cambios };
}

/**
 * Personaliza las pautas por defecto y los protocolos de partido de un jugador con sus restricciones actuales.
 * `jugador` son sus datos (intolerancias, aversiones...). `recomendaciones_defecto` y `config_prepartido`, si se
 * pasan, son los valores a revisar (si no, no se tocan).
 * @returns {{ recomendaciones_defecto, config_prepartido, ajustes: Array<{ donde: string, cambios: Array }> }}
 */
export function personalizePautas(jugador, { recomendaciones_defecto, config_prepartido } = {}) {
  const ctx = buildContext(jugador);
  const ajustes = [];

  let defecto = recomendaciones_defecto;
  if (defecto && typeof defecto === 'object') {
    defecto = Object.fromEntries(Object.entries(defecto).map(([toma, pauta]) => {
      const { pauta: next, cambios } = personalizePauta(pauta, ctx);
      if (cambios.length) ajustes.push({ donde: `Pauta por defecto · ${toma}`, cambios });
      return [toma, next];
    }));
  }

  let protocolo = config_prepartido;
  if (protocolo && typeof protocolo === 'object') {
    protocolo = Object.fromEntries(Object.entries(protocolo).map(([horario, cfg]) => {
      if (!cfg?.recomendaciones) return [horario, cfg];
      const recomendaciones = Object.fromEntries(Object.entries(cfg.recomendaciones).map(([toma, pauta]) => {
        const { pauta: next, cambios } = personalizePauta(pauta, ctx);
        if (cambios.length) ajustes.push({ donde: `Protocolo de partido (${horario}) · ${toma}`, cambios });
        return [toma, next];
      }));
      return [horario, { ...cfg, recomendaciones }];
    }));
  }

  return { recomendaciones_defecto: defecto, config_prepartido: protocolo, ajustes };
}

/** Texto para avisar al usuario de lo que se ha ajustado. */
export function describeAjustes(ajustes) {
  return (ajustes || []).map(({ donde, cambios }) => {
    const partes = cambios.map((c) => (c.quitado ? `se quitó ${c.quitado}` : `${c.de} → ${c.a}`));
    return `${donde}: ${partes.join(', ')}`;
  });
}
