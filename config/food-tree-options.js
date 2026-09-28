import { FOODS_CRUDO } from '@/data/foods-crudo';
import { hasTreePath } from '@/lib/engine/food-tree';

/**
 * Configuración de los selectores de edición del árbol.
 * No participa en la generación del plan; esa ruta usa el catálogo clínico
 * específico del jugador.
 */
function mapFoodsToItems(foods, seen = new Set()) {
  return foods.reduce((items, food) => {
    const name = typeof food === 'string' ? food : food?.name;
    if (name && !seen.has(name)) {
      seen.add(name);
      items.push({ value: name, label: name });
    }
    return items;
  }, []);
}

function genericOptions(items, seen = null) {
  if (seen) {
    items.forEach((it) => {
      const val = typeof it === 'string' ? it : it.value;
      if (val) seen.add(val);
    });
  }
  return [{ group: 'Opciones Genéricas del Árbol', items }];
}

export function getTreeProteinaOptions() {
  const seen = new Set();
  const generics = genericOptions([
    { value: 'Pollo (Genérico)', label: 'Pollo (Genérico)' },
    { value: 'Pavo (Genérico)', label: 'Pavo (Genérico)' },
    { value: 'Conejo', label: 'Conejo' },
    { value: 'Ternera / Vacuno (Genérico)', label: 'Ternera / Vacuno (Genérico)' },
    { value: 'Cerdo fresco (Genérico)', label: 'Cerdo fresco (Genérico)' },
    { value: 'Embutidos y Fiambres (Genérico)', label: 'Embutidos y Fiambres (Genérico)' },
    { value: 'Pescado blanco (Genérico)', label: 'Pescado blanco (Genérico)' },
    { value: 'Pescado azul (Genérico)', label: 'Pescado azul (Genérico)' },
    { value: 'Marisco (Genérico)', label: 'Marisco (Genérico)' },
    { value: 'Huevos (Genérico)', label: 'Huevos (Genérico)' },
    { value: 'Proteína vegetal (Genérico)', label: 'Proteína vegetal (Genérico)' },
  ], seen);

  const pollo = FOODS_CRUDO.filter((f) => hasTreePath(f, 'pollo'));
  const pavo = FOODS_CRUDO.filter((f) => hasTreePath(f, 'pavo'));
  const conejo = FOODS_CRUDO.filter((f) => hasTreePath(f, 'conejo'));
  const ternera = FOODS_CRUDO.filter((f) => hasTreePath(f, 'vacuno'));
  const cerdo = FOODS_CRUDO.filter((f) => hasTreePath(f, 'cerdo'));
  const embutidos = FOODS_CRUDO.filter((f) => hasTreePath(f, 'embutidos'));
  const mariscos = FOODS_CRUDO.filter((f) => hasTreePath(f, 'marisco'));
  const azules = FOODS_CRUDO.filter((f) => hasTreePath(f, 'pescado_azul'));
  const blancos = FOODS_CRUDO.filter((f) => hasTreePath(f, 'pescado_blanco'));
  const vegetalHuevos = FOODS_CRUDO.filter((f) => hasTreePath(f, 'huevos') || hasTreePath(f, 'vegetal_proteina'));

  return [
    ...generics,
    { group: 'Pollo', items: mapFoodsToItems(pollo, seen) },
    { group: 'Pavo y Conejo', items: mapFoodsToItems([...pavo, ...conejo], seen) },
    { group: 'Ternera y Carnes Rojas', items: mapFoodsToItems(ternera, seen) },
    { group: 'Cerdo fresco', items: mapFoodsToItems(cerdo, seen) },
    { group: 'Embutidos y Fiambres', items: mapFoodsToItems(embutidos, seen) },
    { group: 'Pescados Blancos', items: mapFoodsToItems(blancos, seen) },
    { group: 'Pescados Azules y Conservas', items: mapFoodsToItems(azules, seen) },
    { group: 'Mariscos y Cefalópodos', items: mapFoodsToItems(mariscos, seen) },
    { group: 'Huevos y Proteína Vegetal', items: mapFoodsToItems(vegetalHuevos, seen) },
  ];
}

export function getTreeHidratoOptions() {
  const seen = new Set();
  const pastas = FOODS_CRUDO.filter((f) => hasTreePath(f, 'pasta'));
  pastas.forEach((f) => seen.add(f.name));
  const arroces = FOODS_CRUDO.filter((f) => hasTreePath(f, 'arroz'));
  arroces.forEach((f) => seen.add(f.name));
  const tuberculos = FOODS_CRUDO.filter((f) => hasTreePath(f, 'tuberculos'));
  tuberculos.forEach((f) => seen.add(f.name));
  const panes = FOODS_CRUDO.filter((f) => hasTreePath(f, 'panes'));
  panes.forEach((f) => seen.add(f.name));
  const cereales = FOODS_CRUDO.filter((f) => hasTreePath(f, 'cereales'));
  cereales.forEach((f) => seen.add(f.name));
  const granos = FOODS_CRUDO.filter((f) => hasTreePath(f, 'otros_granos'));
  const legumbres = FOODS_CRUDO.filter((f) => hasTreePath(f, 'legumbres'));

  const generics = genericOptions([
    { value: 'Pasta (Grupo genérico)', label: 'Pasta (Grupo genérico)' },
    { value: 'Arroz (Grupo genérico)', label: 'Arroz (Grupo genérico)' },
    { value: 'Panes (Grupo genérico)', label: 'Panes (Grupo genérico)' },
    { value: 'Tubérculos', label: 'Tubérculos (Genérico)' },
    { value: 'Otros granos culinarios', label: 'Otros granos culinarios (Quinoa, Cuscús, Bulgur)' },
    { value: 'Cereales y Avena (Genérico)', label: 'Cereales y Avena (Genérico)' },
    { value: 'Legumbres', label: 'Legumbres (Genérico)' },
  ], seen);

  return [
    ...generics,
    { group: 'Pastas', items: mapFoodsToItems(pastas, seen) },
    { group: 'Arroces', items: mapFoodsToItems(arroces, seen) },
    { group: 'Tubérculos', items: mapFoodsToItems(tuberculos, seen) },
    { group: 'Panes y Masas', items: mapFoodsToItems(panes, seen) },
    { group: 'Granos Culinarios (Quinoa, Cuscús...)', items: mapFoodsToItems(granos, seen) },
    { group: 'Cereales y Avena', items: mapFoodsToItems(cereales, seen) },
    { group: 'Legumbres', items: mapFoodsToItems(legumbres, seen) },
  ];
}

export function getTreeVerduraOptions() {
  return [
    ...genericOptions([{ value: 'Verduras variadas', label: 'Verduras variadas (Genérico)' }]),
    { group: 'Verduras de Hoja Verde', items: mapFoodsToItems(FOODS_CRUDO.filter((f) => hasTreePath(f, 'hojas_verdes'))) },
    { group: 'Verduras y Hortalizas', items: mapFoodsToItems(FOODS_CRUDO.filter((f) => hasTreePath(f, 'hortalizas'))) },
  ];
}

export function getTreeFrutaOptions() {
  const frescas = FOODS_CRUDO.filter((f) => hasTreePath(f, 'frutas') && !hasTreePath(f, 'desecadas'));
  const desecadas = FOODS_CRUDO.filter((f) => hasTreePath(f, 'desecadas'));

  return [
    ...genericOptions([{ value: 'Fruta fresca', label: 'Fruta fresca / de temporada (Genérica)' }]),
    { group: 'Frutas Frescas', items: mapFoodsToItems(frescas) },
    { group: 'Frutas Desecadas y Compotas', items: mapFoodsToItems(desecadas) },
  ];
}

export function getTreeLacteoOptions() {
  const yogures = FOODS_CRUDO.filter((f) => hasTreePath(f, 'yogures'));
  const quesos = FOODS_CRUDO.filter((f) => hasTreePath(f, 'quesos'));
  const leches = FOODS_CRUDO.filter((f) => hasTreePath(f, 'leches'));

  return [
    ...genericOptions([
      { value: 'Yogures (Grupo genérico)', label: 'Yogures (Grupo genérico)' },
      { value: 'Leches (Grupo genérico)', label: 'Leches (Grupo genérico)' },
      { value: 'Quesos (Grupo genérico)', label: 'Quesos (Grupo genérico)' },
    ]),
    { group: 'Yogures y Kéfir', items: mapFoodsToItems(yogures) },
    { group: 'Quesos', items: mapFoodsToItems(quesos) },
    { group: 'Leches y Bebidas Vegetales', items: mapFoodsToItems(leches) },
  ];
}

export function getTreeGrasaOptions() {
  return [
    { value: 'AOVE', label: 'AOVE' },
    { value: 'Aguacate', label: 'Aguacate' },
    { value: 'Frutos secos', label: 'Frutos secos' },
    { value: 'Aceite de coco', label: 'Aceite de coco' },
    { value: 'Sin grasa añadida', label: 'Sin grasa añadida' },
  ];
}
