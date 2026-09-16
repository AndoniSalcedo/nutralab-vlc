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

function genericOptions(items) {
  return [{ group: 'Opciones Genéricas del Árbol', items }];
}

export function getTreeProteinaOptions() {
  const seen = new Set();
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
    ...genericOptions([
      { value: 'pollo', label: 'Pollo (Genérico)' },
      { value: 'pavo', label: 'Pavo (Genérico)' },
      { value: 'conejo', label: 'Conejo' },
      { value: 'vacuno', label: 'Ternera / Vacuno (Genérico)' },
      { value: 'cerdo', label: 'Cerdo fresco (Genérico)' },
      { value: 'embutidos_fiambres', label: 'Embutidos y Fiambres (Genérico)' },
      { value: 'pescado_blanco', label: 'Pescado blanco (Genérico)' },
      { value: 'pescado_azul', label: 'Pescado azul (Genérico)' },
      { value: 'marisco', label: 'Marisco (Genérico)' },
      { value: 'huevos', label: 'Huevos (Genérico)' },
      { value: 'vegetal_proteina', label: 'Proteína vegetal (Genérico)' },
    ]),
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
  const cerealesDesayuno = FOODS_CRUDO.filter((f) => hasTreePath(f, 'cereales_desayuno'));
  cerealesDesayuno.forEach((f) => seen.add(f.name));
  const granos = FOODS_CRUDO.filter((f) => hasTreePath(f, 'otros_granos'));
  const legumbres = FOODS_CRUDO.filter((f) => hasTreePath(f, 'legumbres'));

  return [
    ...genericOptions([
      { value: 'pasta', label: 'Pasta (Genérica adaptable)' },
      { value: 'arroz', label: 'Arroz (Genérico adaptable)' },
      { value: 'panes', label: 'Panes (Genérico adaptable)' },
      { value: 'tuberculos', label: 'Tubérculos (Genérico)' },
      { value: 'otros_granos', label: 'Otros granos culinarios (Quinoa, Cuscús, Bulgur)' },
      { value: 'cereales_desayuno', label: 'Cereales de desayuno y Avena (Genérico)' },
      { value: 'legumbres', label: 'Legumbres (Genérico)' },
    ]),
    { group: 'Pastas', items: mapFoodsToItems(pastas) },
    { group: 'Arroces', items: mapFoodsToItems(arroces) },
    { group: 'Tubérculos', items: mapFoodsToItems(tuberculos) },
    { group: 'Panes y Masas', items: mapFoodsToItems(panes) },
    { group: 'Granos Culinarios (Quinoa, Cuscús...)', items: mapFoodsToItems(granos) },
    { group: 'Cereales de Desayuno y Avena', items: mapFoodsToItems(cerealesDesayuno) },
    { group: 'Legumbres', items: mapFoodsToItems(legumbres) },
  ];
}

export function getTreeVerduraOptions() {
  return [
    ...genericOptions([{ value: 'verduras', label: 'Verduras variadas (Genérico)' }]),
    { group: 'Verduras de Hoja Verde', items: mapFoodsToItems(FOODS_CRUDO.filter((f) => hasTreePath(f, 'hojas_verdes'))) },
    { group: 'Verduras y Hortalizas', items: mapFoodsToItems(FOODS_CRUDO.filter((f) => hasTreePath(f, 'hortalizas'))) },
  ];
}

export function getTreeFrutaOptions() {
  const frescas = FOODS_CRUDO.filter((f) => hasTreePath(f, 'frutas') && !hasTreePath(f, 'desecadas'));
  const desecadas = FOODS_CRUDO.filter((f) => hasTreePath(f, 'desecadas'));

  return [
    ...genericOptions([{ value: 'frutas', label: 'Fruta fresca / de temporada (Genérica)' }]),
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
      { value: 'yogures', label: 'Yogures (Genérico adaptable)' },
      { value: 'leches', label: 'Leches (Genérico adaptable)' },
      { value: 'quesos', label: 'Quesos (Genérico adaptable)' },
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
