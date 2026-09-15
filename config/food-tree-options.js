import { FOODS_CRUDO } from '@/data/foods-crudo';

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
  const aves = FOODS_CRUDO.filter((f) => f.category === 'carnes_y_aves' && !f.tags?.includes('carne_roja') && !f.tags?.includes('cerdo'));
  const ternera = FOODS_CRUDO.filter((f) => f.category === 'carnes_y_aves' && f.tags?.includes('carne_roja'));
  const cerdo = FOODS_CRUDO.filter((f) => f.category === 'carnes_y_aves' && f.tags?.includes('cerdo'));
  const mariscos = FOODS_CRUDO.filter((f) => f.tags?.includes('marisco'));
  const azules = FOODS_CRUDO.filter((f) => f.tags?.includes('pescado_azul'));
  const blancos = FOODS_CRUDO.filter((f) => f.tags?.includes('pescado_blanco'));
  const vegetalHuevos = FOODS_CRUDO.filter((f) => f.tags?.includes('huevo') || ['tofu firme', 'seitán', 'seitan', 'soja texturizada'].includes(f.name.toLowerCase()));

  return [
    ...genericOptions([
      { value: 'pollo', label: 'Pollo (Genérico)' },
      { value: 'pavo', label: 'Pavo (Genérico)' },
      { value: 'vacuno', label: 'Ternera / Vacuno (Genérico)' },
      { value: 'cerdo', label: 'Cerdo (Genérico)' },
      { value: 'pescado_blanco', label: 'Pescado blanco (Genérico)' },
      { value: 'pescado_azul', label: 'Pescado azul (Genérico)' },
      { value: 'marisco', label: 'Marisco (Genérico)' },
      { value: 'huevos', label: 'Huevos (Genérico)' },
      { value: 'vegetal_proteina', label: 'Proteína vegetal (Genérico)' },
    ]),
    { group: 'Aves y Conejo', items: mapFoodsToItems(aves, seen) },
    { group: 'Ternera y Carnes Rojas', items: mapFoodsToItems(ternera, seen) },
    { group: 'Cerdo', items: mapFoodsToItems(cerdo, seen) },
    { group: 'Pescados Blancos', items: mapFoodsToItems(blancos, seen) },
    { group: 'Pescados Azules y Conservas', items: mapFoodsToItems(azules, seen) },
    { group: 'Mariscos y Cefalópodos', items: mapFoodsToItems(mariscos, seen) },
    { group: 'Huevos y Proteína Vegetal', items: mapFoodsToItems(vegetalHuevos, seen) },
  ];
}

export function getTreeHidratoOptions() {
  const seen = new Set();
  const carbFoods = FOODS_CRUDO.filter((f) => ['cereales_y_tuberculos', 'otros_granos'].includes(f.category));
  const pastas = carbFoods.filter((f) => f.name.toLowerCase().includes('pasta'));
  pastas.forEach((f) => seen.add(f.name));
  const arroces = carbFoods.filter((f) => !seen.has(f.name) && f.name.toLowerCase().includes('arroz') && !f.name.toLowerCase().includes('tortas'));
  arroces.forEach((f) => seen.add(f.name));
  const tuberculos = carbFoods.filter((f) => ['patata', 'boniato', 'yuca', 'ñoquis', 'noquis'].some((k) => f.name.toLowerCase().includes(k)));
  tuberculos.forEach((f) => seen.add(f.name));
  const panes = carbFoods.filter((f) => !seen.has(f.name) && ['pan ', 'pan de', 'tostada', 'picos', 'tortas', 'tortilla de trigo', 'biscote'].some((k) => f.name.toLowerCase().includes(k)));
  panes.forEach((f) => seen.add(f.name));
  const granos = carbFoods.filter((f) => !seen.has(f.name) && !f.name.toLowerCase().includes('leche'));
  const legumbres = FOODS_CRUDO.filter((f) => f.category === 'legumbres' && f.name.toLowerCase() !== 'soja texturizada');

  return [
    ...genericOptions([
      { value: 'pasta', label: 'Pasta (Genérica adaptable)' },
      { value: 'arroz', label: 'Arroz (Genérico adaptable)' },
      { value: 'panes', label: 'Panes (Genérico adaptable)' },
      { value: 'tuberculos', label: 'Tubérculos (Genérico)' },
      { value: 'otros_granos', label: 'Otros granos y cereales (Genérico)' },
      { value: 'legumbres', label: 'Legumbres (Genérico)' },
    ]),
    { group: 'Pastas', items: mapFoodsToItems(pastas) },
    { group: 'Arroces', items: mapFoodsToItems(arroces) },
    { group: 'Tubérculos', items: mapFoodsToItems(tuberculos) },
    { group: 'Panes y Masas', items: mapFoodsToItems(panes) },
    { group: 'Granos, Cereales y Semillas', items: mapFoodsToItems(granos) },
    { group: 'Legumbres', items: mapFoodsToItems(legumbres) },
  ];
}

export function getTreeVerduraOptions() {
  return [
    ...genericOptions([{ value: 'verduras', label: 'Verduras variadas (Genérico)' }]),
    { group: 'Verduras y Hortalizas', items: mapFoodsToItems(FOODS_CRUDO.filter((f) => f.category === 'verduras_y_hortalizas')) },
  ];
}

export function getTreeFrutaOptions() {
  const frutaFoods = FOODS_CRUDO.filter((f) => f.category === 'frutas' && f.name !== 'Vinagre de manzana');
  const desecadasKeywords = ['desecada', 'compota', 'seco', 'pasta de dátil', 'pasta de datil'];
  const desecadas = frutaFoods.filter((f) => desecadasKeywords.some((k) => f.name.toLowerCase().includes(k)));
  const desecadasNames = new Set(desecadas.map((f) => f.name));
  const frescas = frutaFoods.filter((f) => !desecadasNames.has(f.name));

  return [
    ...genericOptions([{ value: 'frutas', label: 'Fruta fresca / de temporada (Genérica)' }]),
    { group: 'Frutas Frescas', items: mapFoodsToItems(frescas) },
    { group: 'Frutas Desecadas y Compotas', items: mapFoodsToItems(desecadas) },
  ];
}

export function getTreeLacteoOptions() {
  const yogurKeywords = ['yogur', 'kéfir', 'kefir', 'skyr'];
  const quesoKeywords = ['queso', 'requesón', 'requeson', 'mozzarella'];
  const yogures = FOODS_CRUDO.filter((f) => yogurKeywords.some((k) => f.name.toLowerCase().includes(k)));
  const quesos = FOODS_CRUDO.filter((f) => quesoKeywords.some((k) => f.name.toLowerCase().includes(k)));
  const leches = FOODS_CRUDO.filter((f) => f.name.toLowerCase().includes('leche') && f.name !== 'Arroz con leche');

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
