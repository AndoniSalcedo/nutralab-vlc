import { describeFoodTreeOutline, getNodeFromTree, canResolveNodeForPlayer } from '@/lib/engine/food-tree';

/**
 * Reglas comunes del AST nutricional (allOf / oneOf / food) para los prompts de IA.
 * El único vocabulario válido para las hojas "food" es el árbol recibido.
 *
 * @param {Object} foodTree - Árbol que usará el generador (buildPlayerFoodTree)
 * @returns {string}
 */
export function buildFoodAstRules(foodTree) {
  return `REGLAS DEL ÁRBOL SINTÁCTICO (AST):
1. Cada árbol tiene nodos de tres tipos:
   - "allOf": Conjunción (todos sus hijos se comen juntos, ej: "pollo con patata y ensalada").
   - "oneOf": Disyunción (opciones excluyentes donde el motor elegirá una sola, ej: "arroz o patata", "pollo o ternera", "opción 1 o opción 2").
   - "food": Hoja que referencia un nodo del ÁRBOL NUTRICIONAL de abajo, con:
     * "type": "food"
     * "name": nombre EXACTO de una rama (el texto entre corchetes) o de un alimento listado en ella.
       Elige el nivel del árbol que corresponda a lo que dice el texto: una rama referencia la rama
       completa con todas sus subramas y alimentos (el motor rota entre ellos), un alimento referencia
       solo esa hoja. Ej: "fruta" → la rama de frutas; "proteína" → la rama de proteínas entera;
       "pollo" → la rama de pollo; "pechuga de pollo" → ese alimento.

2. DISTINCIÓN ENTRE CONJUNCIÓN Y DISYUNCIÓN:
   - "Pollo con patata y arroz" o "pasta con boloñesa + pollo y puré de patata":
     un "allOf" con todos los alimentos.
   - "Pollo con arroz o patata":
     la raíz es un "allOf" con el Pollo y un hijo "oneOf" con Arroz y Patata.
   - "Pasta con boloñesa o ternera con puré de patata":
     la raíz es un "oneOf" con dos hijos "allOf".
   - Los símbolos "+", "," o "y" indican conjunción ("allOf"). Interpreta erratas evidentes como el nodo del árbol al que se refieren.
   - Si el texto nombra una preparación que no está en el árbol (porridge, tortilla, bocadillo, batido...),
     descomponla en sus ingredientes principales del árbol. Ej: "porridge" → Copos de avena + Leches;
     "bocadillo de pavo" → Panes + Pechuga de pavo (lonchas). Si la preparación sí está en el árbol
     (p. ej. "pancakes" → Pancakes proteicos, "crepes" → Crepes de avena), usa ese alimento.

ÁRBOL NUTRICIONAL (única fuente válida de nombres; ramas entre corchetes, seguidas de sus alimentos):
${describeFoodTreeOutline(foodTree)}`;
}

/**
 * Normaliza un AST devuelto por la IA. Cada hoja "food" debe referenciar un nodo del
 * árbol dado (rama o alimento) que se pueda servir con ese árbol; si no, se acumula en
 * `unresolved`. El nombre se sustituye por la etiqueta canónica del nodo.
 */
export function normalizeFoodAst(node, foodTree, unresolved = []) {
  if (!node || typeof node !== 'object') return null;

  if (node.type === 'food') {
    const name = String(node.name || node.foodName || node.label || '').trim();
    if (!name) return null;
    const treeNode = getNodeFromTree(name, foodTree);
    if (!treeNode || !canResolveNodeForPlayer(name, null, foodTree)) {
      unresolved.push(name);
      return null;
    }
    return { type: 'food', name: treeNode.label || name };
  }

  if (node.type !== 'allOf' && node.type !== 'oneOf') return null;

  const children = (node.children || []).map((child) => normalizeFoodAst(child, foodTree, unresolved)).filter(Boolean);
  if (children.length === 0) return null;
  if (children.length === 1) return children[0];
  return {
    type: node.type,
    label: node.label || undefined,
    children,
  };
}

export function extractJson(text) {
  const jsonMatch = String(text || '').match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se pudo estructurar el árbol nutricional con la IA. Inténtalo de nuevo.');
  const cleaned = jsonMatch[0]
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\u0000-\u001F]+/g, ' ');
  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON.parse(jsonMatch[0]);
  }
}
