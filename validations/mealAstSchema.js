import { z } from 'zod';
import { findTreeNode, getFullFoodTree } from '@/lib/engine/food-tree';

/**
 * Contrato único del AST nutricional (pautas de jugador, protocolo pre-partido y platos de menú).
 * Las hojas "food" referencian por nombre un nodo del árbol (rama o alimento); las propiedades
 * que no forman parte del contrato (p. ej. el antiguo `category`) se descartan al parsear.
 */
const foodNodeSchema = z.object({
  type: z.literal('food'),
  name: z.string().trim().min(1, 'La hoja food necesita un nombre.'),
});

const groupNodeSchema = z.lazy(() => z.object({
  type: z.enum(['allOf', 'oneOf']),
  label: z.string().optional(),
  course: z.enum(['primero', 'segundo', 'postre']).optional(),
  children: z.array(astNodeSchema).min(1, 'allOf/oneOf necesita al menos un hijo.'),
}));

export const astNodeSchema = z.lazy(() => z.union([foodNodeSchema, groupNodeSchema]));

const patternBase = {
  raw: z.string().optional(),
  label: z.string().optional(),
  isMainMeal: z.boolean().optional(),
  unrecognized: z.array(z.string()).optional(),
  // Solo en el protocolo de partido: 'defecto' sigue la pauta habitual de la toma; 'manual' la escribió el nutricionista.
  origen: z.enum(['defecto', 'manual']).optional(),
};

/** Pauta de una toma: árbol concreto ("meal") o rotación variada ("complete"). */
export const mealPatternSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('meal'), tree: astNodeSchema, ...patternBase }),
  z.object({ type: z.literal('complete'), ...patternBase }),
]);

/** recomendaciones_defecto: { [nombreToma]: pauta } */
export const mealPatternsSchema = z.record(z.string(), mealPatternSchema);

/** config_prepartido: { [horario]: { ingestas, postentreno, recomendaciones } } */
export const preMatchConfigSchema = z.record(z.string(), z.object({
  ingestas: z.array(z.string()).optional(),
  postentreno: z.boolean().optional(),
  recomendaciones: mealPatternsSchema.optional(),
}).passthrough());

/** Nombres de hojas "food" que no existen en el árbol dado (por defecto, el catálogo completo). */
function findUnresolvedFoodNames(tree, foodTree = getFullFoodTree()) {
  const unresolved = [];
  const visit = (node) => {
    if (!node) return;
    if (node.type === 'food') {
      if (!findTreeNode(node.name, foodTree)) unresolved.push(node.name);
      return;
    }
    (node.children || []).forEach(visit);
  };
  visit(tree);
  return Array.from(new Set(unresolved));
}

function formatZodError(error, prefix) {
  const issue = error.issues[0];
  const where = issue.path.length > 0 ? ` (${issue.path.join('.')})` : '';
  return `${prefix}${where}: ${issue.message}`;
}

/**
 * Valida un valor contra un schema y comprueba que todas las hojas existen en el árbol.
 * @returns {{ success: true, data: any } | { success: false, error: string }}
 */
export function validateAstValue(schema, value, { foodTree = getFullFoodTree(), label = 'Pauta' } = {}) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { success: false, error: formatZodError(parsed.error, label) };

  const trees = [];
  const collect = (node) => {
    if (!node || typeof node !== 'object') return;
    if (['allOf', 'oneOf', 'food'].includes(node.type)) {
      trees.push(node);
      return;
    }
    Object.values(node).forEach(collect);
  };
  collect(parsed.data);

  const unresolved = Array.from(new Set(trees.flatMap((tree) => findUnresolvedFoodNames(tree, foodTree))));
  if (unresolved.length > 0) {
    return { success: false, error: `${label}: "${unresolved.join('", "')}" no existe en el árbol nutricional.` };
  }
  return { success: true, data: parsed.data };
}
