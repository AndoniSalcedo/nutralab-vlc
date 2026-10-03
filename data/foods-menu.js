import { FOODS_CRUDO } from './foods-crudo.js';

/**
 * Alimentos disponibles en la ciudad deportiva (buffet y menús de comedor).
 * Es un subconjunto de FOODS_CRUDO: cada nombre referencia la ficha de ese catálogo, de modo que los datos
 * (macros, raciones, etiquetas y rama) son siempre los mismos en los planes con y sin menú.
 */
const MENU_FOOD_NAMES = [
  // Aves: pollo y pavo
  'Pechuga de pollo',
  'Contramuslo de pollo deshuesado',
  'Solomillos de pollo',
  'Hamburguesa de pollo',
  'Boloñesa de pollo',
  'Pechuga de pavo',
  'Pavo al horno',
  'Chuleta de pavo',
  'Albóndigas de pavo',
  'Hamburguesa de pavo',

  // Cerdo fresco
  'Secreto de cerdo',
  'Lomo de cerdo',
  'Solomillo de cerdo',
  'Presa ibérica',
  'Solomillo ibérico',

  // Vacuno, potro y cordero
  'Entrecot de ternera',
  'Solomillo de ternera',
  'Burger de ternera',
  'Filete de ternera',
  'Boloñesa de ternera',
  'Hamburguesa de potro',
  'Cordero (parte más magra)',

  // Pescados azules
  'Atún rojo',
  'Atún de aleta amarilla',
  'Salmón',
  'Trucha',
  'Sardinas',
  'Emperador',

  // Pescados blancos
  'Dorada',
  'Lubina',
  'Merluza',
  'Bacalao',
  'Lenguado',
  'Rodaballo',
  'Corvina',
  'Rape',
  'Gallineta',

  // Mariscos y cefalópodos
  'Sepia',
  'Calamar',
  'Pulpo',
  'Gambas',

  // Proteína vegetal
  'Seitán',
  'Tofu',
  'Heura',
  'Tempeh',
  'Soja texturizada',
  'Burger vegana',

  // Huevos, embutidos y conservas
  'Huevo entero',
  'Jamón serrano',
  'Pechuga de pavo (lonchas)',
  'Atún natural conserva natural',

  // Arroces
  'Arroz blanco',
  'Arroz integral',
  'Arroz basmati',

  // Panes y masas
  'Pan',
  'Pan blanco',
  'Pan sin gluten',
  'Fajitas',
  'Pan de molde de avena',
  'Focaccia',

  // Tubérculos y purés
  'Patata',
  'Boniato',
  'Gajos de patata',
  'Gajos de boniato',
  'Ñoquis',
  'Puré de patata',
  'Puré de boniato',

  // Pastas
  'Macarrones',
  'Macarrones integrales',
  'Fusilli',
  'Espaguetis',
  'Espaguetis integrales',
  'Pasta de trigo sarraceno',
  'Espirales de lentejas',

  // Legumbres
  'Guisantes',
  'Lentejas',
  'Garbanzos',

  // Otros granos
  'Quinoa',
  'Noodles de arroz',
  'Cuscús',

  // Cereales y desayuno
  'Tortitas de arroz',
  'Cereales de trigo sarraceno hinchados',
  'Copos de avena',
  'Cereales de chocolate de arroz',
  'Pancakes proteicos',
  'Pancakes proteicos sin gluten',
  'Crepes de avena',
  'Arroz con leche',
  'Browniato',
  'Nutable',

  // Lácteos y bebidas vegetales
  'Bebida de avena',
  'Leche desnatada',
  'Leche desnatada sin lactosa',
  'Leche entera',
  'Leche entera alto proteína',
  'Leche entera sin lactosa',
  'Bebida de coco',
  'Yogur proteico natural',
  'Yogur natural',
  'Yogur natural sin lactosa',
  'Yogur proteico sin lactosa',
  'Yogur de coco',
  'Queso fresco',
  'Queso fresco sin lactosa',
  'Queso edam en lonchas',

  // Grasas y frutos secos
  'AOVE',
  'Mantequilla',
  'Aguacate',
  'Pasta de aguacate',
  'Almendras laminadas tostadas',
  'Nueces',
  'Anacardos',
  'Avellanas',

  // Frutas y zumos
  'Naranja',
  'Plátano',
  'Frambuesas',
  'Arándanos',
  'Zumo de naranja natural',
  'Zumo de manzana',

  // Verduras y hortalizas
  'Acelga',
  'Alcachofa',
  'Berenjena',
  'Brócoli',
  'Calabacín',
  'Cebolla',
  'Champiñón',
  'Coliflor',
  'Espárragos blancos conserva',
  'Espárragos verdes',
  'Puerro',
  'Espinaca',
  'Judías verdes',
  'Lechuga romana',
  'Pepino',
  'Pimiento',
  'Pimiento rojo',
  'Remolacha',
  'Rúcula',
  'Tomate',
  'Tomate natural rallado',
  'Zanahoria',
  'Zarangollo',
  'Ajo',
  'Canela',

  // Bebidas, suplementos y endulzantes
  'Agua de coco',
  'Infusiones',
  'Café solo',
  'Café con leche',
  'Miel',
  'Miel de Manuka',
  'Mermelada',
  'Panela',
  'Cacao (puro y en untable / Colacao)',
  'Batido de proteína sin lactosa 30g',
  'Batido de proteína vegetal 30g',
];

const CRUDO_BY_NAME = new Map(FOODS_CRUDO.map((food) => [food.name, food]));
const MISSING_IN_CRUDO = MENU_FOOD_NAMES.filter((name) => !CRUDO_BY_NAME.has(name));
if (MISSING_IN_CRUDO.length > 0) {
  throw new Error(`Alimentos del menú sin ficha en FOODS_CRUDO: ${MISSING_IN_CRUDO.join(', ')}`);
}

export const FOODS_MENU = MENU_FOOD_NAMES.map((name) => CRUDO_BY_NAME.get(name));
