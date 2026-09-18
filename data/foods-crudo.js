/**
 * Catálogo Oficial de Alimentos Limpios en Crudo para Nutralab
 * Fuente base: data/foods.js (filtrado sin cocinados, procesados ni alcohol)
 * Nombres naturales en español para integración con IA y cálculo exacto.
 * Cada alimento incluye sus etiquetas dietéticas y clínicas ('tags') para filtrado determinista.
 * Límites gastronómicos mínimos y máximos (minGrams, maxGrams) para cada alimento.
 * Valores por 100g de alimento en crudo o ración indicada.
 */

export const FOODS_CRUDO = [
  {
    "name": "Alitas de pollo",
    "originalName": "Alitas de pollo",
    "kcal": 203,
    "cho": 0,
    "pro": 18.3,
    "fat": 15,
    "tags": [],
    "minGrams": 120,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pollo"
    ]
  },
  {
    "name": "Carne picada de pavo",
    "originalName": "Carne picada de pavo",
    "kcal": 115,
    "cho": 0,
    "pro": 22,
    "fat": 3,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pavo"
    ]
  },
  {
    "name": "Carne picada de pollo",
    "originalName": "Carne picada de pollo",
    "kcal": 142,
    "cho": 0,
    "pro": 20.5,
    "fat": 6.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pollo"
    ]
  },
  {
    "name": "Carne picada de ternera",
    "originalName": "Carne picada de ternera",
    "kcal": 187,
    "cho": 0,
    "pro": 19.7,
    "fat": 12,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vacuno"
    ]
  },
  {
    "name": "Chuletas de pavo",
    "originalName": "chuletas de pavo",
    "kcal": 118,
    "cho": 0,
    "pro": 22.5,
    "fat": 2.8,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pavo"
    ]
  },
  {
    "name": "Entrecot de ternera",
    "originalName": "Entrecot de ternera crudo",
    "kcal": 250,
    "cho": 0,
    "pro": 20,
    "fat": 19,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 250,
    "maxGrams": 400,
    "treePath": [
      "proteina",
      "vacuno"
    ]
  },
  {
    "name": "Conejo",
    "originalName": "Conejo",
    "kcal": 131,
    "cho": 0,
    "pro": 21.8,
    "fat": 4.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "conejo"
    ]
  },
  {
    "name": "Contramuslo de pollo deshuesado",
    "originalName": "Contramuslo de pollo deshuesado",
    "kcal": 160,
    "cho": 0,
    "pro": 20,
    "fat": 9,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pollo"
    ]
  },
  {
    "name": "Entrecot de ternera",
    "originalName": "Ternera entrecot",
    "kcal": 220,
    "cho": 0,
    "pro": 20.6,
    "fat": 15.6,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vacuno"
    ]
  },
  {
    "name": "Hamburguesa de pavo",
    "originalName": "Hamburguesa de pavo crudo",
    "kcal": 135,
    "cho": 1,
    "pro": 18,
    "fat": 6.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pavo"
    ]
  },
  {
    "name": "Hamburguesa de pollo",
    "originalName": "Hamburguesa de pollo crudo",
    "kcal": 143,
    "cho": 1,
    "pro": 17,
    "fat": 8,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pollo"
    ]
  },
  {
    "name": "Hamburguesa de ternera",
    "originalName": "Hamburguesa de ternera crudo",
    "kcal": 215,
    "cho": 1,
    "pro": 18,
    "fat": 15,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vacuno"
    ]
  },
  {
    "name": "Hamburguesa de ternera magra",
    "originalName": "Hamburguesa de ternera magra",
    "kcal": 165,
    "cho": 1,
    "pro": 20,
    "fat": 9,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vacuno"
    ]
  },
  {
    "name": "Jamón cocido",
    "originalName": "Jamón cocido lonchas",
    "kcal": 145,
    "cho": 1,
    "pro": 20,
    "fat": 6,
    "tags": [
      "cerdo"
    ],
    "minGrams": 25,
    "maxGrams": 70,
    "treePath": [
      "proteina",
      "embutidos"
    ]
  },
  {
    "name": "Pechuga de pavo (lonchas)",
    "originalName": "pechuga de pavo (lonchas)",
    "kcal": 105,
    "cho": 2,
    "pro": 21,
    "fat": 1.5,
    "tags": [],
    "minGrams": 30,
    "maxGrams": 100,
    "treePath": [
      "proteina",
      "embutidos"
    ]
  },
  {
    "name": "Jamón cocido (York)",
    "originalName": "Jamón cocido (York)",
    "kcal": 111,
    "cho": 1.4,
    "pro": 18,
    "fat": 3.5,
    "tags": [
      "cerdo"
    ],
    "minGrams": 25,
    "maxGrams": 70,
    "treePath": [
      "proteina",
      "embutidos"
    ]
  },
  {
    "name": "Jamón serrano",
    "originalName": "Jamón serrano lonchas",
    "kcal": 240,
    "cho": 0,
    "pro": 31,
    "fat": 12,
    "tags": [
      "cerdo"
    ],
    "minGrams": 25,
    "maxGrams": 70,
    "treePath": [
      "proteina",
      "embutidos"
    ]
  },
  {
    "name": "Jamón serrano curado",
    "originalName": "Jamón serrano curado",
    "kcal": 241,
    "cho": 0.4,
    "pro": 31,
    "fat": 13.7,
    "tags": [
      "cerdo"
    ],
    "minGrams": 25,
    "maxGrams": 70,
    "treePath": [
      "proteina",
      "embutidos"
    ]
  },
  {
    "name": "Lomo embuchado",
    "originalName": "Lomo embuchado",
    "kcal": 316,
    "cho": 0.5,
    "pro": 40,
    "fat": 17,
    "tags": [
      "cerdo"
    ],
    "minGrams": 25,
    "maxGrams": 70,
    "treePath": [
      "proteina",
      "embutidos"
    ]
  },
  {
    "name": "Muslo de pollo",
    "originalName": "Muslo de pollo cruda",
    "kcal": 177,
    "cho": 0,
    "pro": 18,
    "fat": 11,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pollo"
    ]
  },
  {
    "name": "Pechuga de pavo",
    "originalName": "Pechuga de pavo",
    "kcal": 114,
    "cho": 0,
    "pro": 24,
    "fat": 1.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pavo"
    ]
  },
  {
    "name": "Pechuga de pollo",
    "originalName": "Pechuga de pollo",
    "kcal": 120,
    "cho": 0,
    "pro": 22.5,
    "fat": 2.6,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pollo"
    ]
  },
  {
    "name": "Solomillo de cerdo",
    "originalName": "Solomillo de cerdo cruda",
    "kcal": 143,
    "cho": 0,
    "pro": 21.5,
    "fat": 5.5,
    "tags": [
      "cerdo"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "cerdo"
    ]
  },
  {
    "name": "Solomillo de ternera",
    "originalName": "Solomillo de ternera",
    "kcal": 132,
    "cho": 0,
    "pro": 22.3,
    "fat": 4.6,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vacuno"
    ]
  },
  {
    "name": "Ternera magra",
    "originalName": "Ternera magra cruda",
    "kcal": 137,
    "cho": 0,
    "pro": 21,
    "fat": 5,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vacuno"
    ]
  },
  {
    "name": "Arroz basmati",
    "originalName": "Arroz basmati",
    "kcal": 365,
    "cho": 78,
    "pro": 7.1,
    "fat": 0.6,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "arroz"
    ]
  },
  {
    "name": "Arroz blanco",
    "originalName": "Arroz blanco crudo",
    "kcal": 365,
    "cho": 78,
    "pro": 7.1,
    "fat": 0.6,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "arroz"
    ]
  },
  {
    "name": "Arroz con leche",
    "kcal": 135,
    "cho": 22,
    "pro": 3.5,
    "fat": 2.8,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "suplementos",
      "dulces_otros"
    ]
  },
  {
    "name": "Arroz integral",
    "originalName": "Arroz integral crudo",
    "kcal": 370,
    "cho": 77,
    "pro": 7.5,
    "fat": 2.7,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "arroz"
    ]
  },
  {
    "name": "Arroz jazmín",
    "originalName": "Arroz jazmín",
    "kcal": 365,
    "cho": 78,
    "pro": 7.1,
    "fat": 0.6,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "arroz"
    ]
  },
  {
    "name": "Boniato",
    "originalName": "Batata boniato crudo",
    "kcal": 86,
    "cho": 20.1,
    "pro": 1.6,
    "fat": 0.1,
    "tags": [],
    "minGrams": 150,
    "maxGrams": 450,
    "defaultGrams": 250,
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Puré de boniato",
    "originalName": "Puré de boniato",
    "kcal": 90,
    "cho": 20,
    "pro": 1.6,
    "fat": 0.2,
    "tags": [],
    "minGrams": 150,
    "maxGrams": 450,
    "defaultGrams": 250,
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Bulgur",
    "originalName": "Bulgur crudo",
    "kcal": 342,
    "cho": 75.9,
    "pro": 12.3,
    "fat": 1.3,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Copos de avena",
    "originalName": "Avena en copos crudo",
    "kcal": 389,
    "cho": 66.3,
    "pro": 16.9,
    "fat": 6.9,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "cereales_desayuno"
    ]
  },
  {
    "name": "Copos de avena sin gluten",
    "originalName": "Copos de avena sin gluten",
    "kcal": 375,
    "cho": 59,
    "pro": 14,
    "fat": 7,
    "tags": [
      "sin_gluten_especial"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "cereales_desayuno"
    ]
  },
  {
    "name": "Cuscús",
    "originalName": "Cuscús crudo",
    "kcal": 376,
    "cho": 77.4,
    "pro": 12.8,
    "fat": 0.6,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Fideos de arroz",
    "originalName": "Fideos de arroz",
    "kcal": 364,
    "cho": 80,
    "pro": 7,
    "fat": 0.6,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Leche de avena",
    "originalName": "Leche de avena",
    "kcal": 47,
    "cho": 6.7,
    "pro": 1,
    "fat": 1.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "lacteos",
      "leches"
    ]
  },
  {
    "name": "Maíz dulce",
    "originalName": "Maíz dulce crudo",
    "kcal": 86,
    "cho": 19,
    "pro": 3.2,
    "fat": 1.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Ñoquis de patata",
    "originalName": "Ñoquis de patata",
    "kcal": 150,
    "cho": 31,
    "pro": 3.5,
    "fat": 0.8,
    "tags": [
      "gluten"
    ],
    "minGrams": 150,
    "maxGrams": 300,
    "defaultGrams": 150,
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Pan blanco de barra",
    "originalName": "Pan blanco de barra",
    "kcal": 265,
    "cho": 49,
    "pro": 9,
    "fat": 3.2,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan de centeno",
    "originalName": "Pan de centeno",
    "kcal": 258,
    "cho": 48,
    "pro": 8.5,
    "fat": 1.7,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan de hamburguesa",
    "originalName": "Pan de hamburguesa",
    "kcal": 280,
    "cho": 50,
    "pro": 9,
    "fat": 5,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan de molde blanco",
    "originalName": "Pan de molde blanco",
    "kcal": 264,
    "cho": 49,
    "pro": 8,
    "fat": 3.3,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan de molde integral",
    "originalName": "Pan de molde integral",
    "kcal": 250,
    "cho": 41,
    "pro": 9,
    "fat": 3.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan de pita",
    "originalName": "Pan de pita",
    "kcal": 275,
    "cho": 55,
    "pro": 9,
    "fat": 1.2,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan de semillas",
    "originalName": "Pan de semillas",
    "kcal": 280,
    "cho": 42,
    "pro": 10,
    "fat": 8,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan integral",
    "originalName": "Pan integral",
    "kcal": 247,
    "cho": 41,
    "pro": 9,
    "fat": 3.4,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan sin gluten",
    "originalName": "Pan sin gluten",
    "kcal": 240,
    "cho": 46,
    "pro": 3.5,
    "fat": 3.2,
    "tags": [
      "sin_gluten_especial"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pasta de Dátil",
    "originalName": "Pasta de Dátil ",
    "kcal": 231.2,
    "cho": 63.75,
    "pro": 2.12,
    "fat": 0.34,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Pasta de lenteja roja",
    "originalName": "pasta de lenteja roja cruda",
    "kcal": 338,
    "cho": 49,
    "pro": 26,
    "fat": 2.5,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Macarrones",
    "originalName": "Macarrones",
    "kcal": 371,
    "cho": 75,
    "pro": 13,
    "fat": 1.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Espaguetis",
    "originalName": "Espaguetis",
    "kcal": 371,
    "cho": 75,
    "pro": 13,
    "fat": 1.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Pasta sin gluten",
    "originalName": "Pasta sin gluten",
    "kcal": 360,
    "cho": 78,
    "pro": 7,
    "fat": 1.2,
    "tags": [
      "sin_gluten_especial"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Pasta de trigo sarraceno",
    "originalName": "Pasta de trigo sarraceno cruda",
    "kcal": 348,
    "cho": 71,
    "pro": 12.5,
    "fat": 1.7,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Patata",
    "originalName": "Patata crudo",
    "kcal": 77,
    "cho": 17.5,
    "pro": 2,
    "fat": 0.1,
    "tags": [],
    "minGrams": 150,
    "maxGrams": 450,
    "defaultGrams": 250,
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Puré de patata",
    "originalName": "Puré de patata casero",
    "kcal": 83,
    "cho": 17.5,
    "pro": 2,
    "fat": 0.5,
    "tags": [],
    "minGrams": 150,
    "maxGrams": 450,
    "defaultGrams": 250,
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Picos / colines",
    "originalName": "Picos / colines",
    "kcal": 400,
    "cho": 72,
    "pro": 10,
    "fat": 8,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Quinoa",
    "originalName": "Quinoa crudo",
    "kcal": 368,
    "cho": 64.2,
    "pro": 14.1,
    "fat": 6.1,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Tortas de arroz",
    "originalName": "Tortas de arroz",
    "kcal": 380,
    "cho": 82,
    "pro": 8,
    "fat": 2,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Tortas de maíz",
    "originalName": "Tortas de maíz",
    "kcal": 375,
    "cho": 80,
    "pro": 7.5,
    "fat": 2.2,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Tortilla de trigo",
    "originalName": "tortilla de trigo",
    "kcal": 312,
    "cho": 52,
    "pro": 8,
    "fat": 8.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Tortilla de trigo integral",
    "originalName": "tortilla de trigo integral",
    "kcal": 300,
    "cho": 48,
    "pro": 9,
    "fat": 8.2,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Fajitas",
    "originalName": "Tortillas para fajitas",
    "kcal": 312,
    "cho": 52,
    "pro": 8,
    "fat": 8.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 60,
    "maxGrams": 180,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Tostadas integrales (biscotes)",
    "originalName": "Tostadas integrales (biscotes)",
    "kcal": 385,
    "cho": 70,
    "pro": 11,
    "fat": 5,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Trigo sarraceno",
    "originalName": "Trigo sarraceno crudo",
    "kcal": 343,
    "cho": 71.5,
    "pro": 13.3,
    "fat": 3.4,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Trigo sarraceno hinchado",
    "originalName": "Trigo sarraceno hinchado",
    "kcal": 360.2,
    "cho": 67.92,
    "pro": 12.63,
    "fat": 3.57,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "cereales_desayuno"
    ]
  },
  {
    "name": "Arándano congelada",
    "originalName": "Arándano congelada",
    "kcal": 55.9,
    "cho": 14.21,
    "pro": 0.69,
    "fat": 0.29,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Arándano desecada",
    "originalName": "Arándano desecada",
    "kcal": 171,
    "cho": 40.6,
    "pro": 1.96,
    "fat": 0.84,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Arándanos",
    "originalName": "Arándano cruda",
    "kcal": 57,
    "cho": 14.5,
    "pro": 0.7,
    "fat": 0.3,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Ciruela",
    "originalName": "Ciruela",
    "kcal": 46,
    "cho": 11.4,
    "pro": 0.7,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Dátil",
    "originalName": "Dátil",
    "kcal": 282,
    "cho": 75,
    "pro": 2.5,
    "fat": 0.4,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Frambuesa",
    "originalName": "Frambuesa ",
    "kcal": 52,
    "cho": 12,
    "pro": 1.2,
    "fat": 0.7,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Frambuesa congelada",
    "originalName": "Frambuesa congelada",
    "kcal": 51,
    "cho": 11.76,
    "pro": 1.18,
    "fat": 0.69,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Fresa congelada",
    "originalName": "Fresa congelada",
    "kcal": 31.4,
    "cho": 7.55,
    "pro": 0.69,
    "fat": 0.29,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Fresa desecada",
    "originalName": "Fresa desecada",
    "kcal": 96,
    "cho": 21.56,
    "pro": 1.96,
    "fat": 0.84,
    "tags": [
      "fructosa"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Fresas",
    "originalName": "Fresa ",
    "kcal": 32,
    "cho": 7.7,
    "pro": 0.7,
    "fat": 0.3,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Higo seco",
    "originalName": "Higo seco ",
    "kcal": 249,
    "cho": 64,
    "pro": 3.3,
    "fat": 0.9,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Higo seco desecada",
    "originalName": "Higo seco desecada",
    "kcal": 747,
    "cho": 179.2,
    "pro": 9.24,
    "fat": 2.52,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Kiwi",
    "originalName": "Kiwi",
    "kcal": 61,
    "cho": 14.7,
    "pro": 1.1,
    "fat": 0.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Mandarina",
    "originalName": "Mandarina",
    "kcal": 53,
    "cho": 13.3,
    "pro": 0.8,
    "fat": 0.3,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Mango",
    "originalName": "Mango ",
    "kcal": 60,
    "cho": 15,
    "pro": 0.8,
    "fat": 0.4,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Mango congelada",
    "originalName": "Mango congelada",
    "kcal": 58.8,
    "cho": 14.7,
    "pro": 0.78,
    "fat": 0.39,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Mango desecada",
    "originalName": "Mango desecada",
    "kcal": 180,
    "cho": 42,
    "pro": 2.24,
    "fat": 1.12,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Manzana",
    "originalName": "Manzana ",
    "kcal": 52,
    "cho": 13.8,
    "pro": 0.3,
    "fat": 0.2,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Manzana compota sin azúcar",
    "originalName": "Manzana compota sin azúcar",
    "kcal": 42.6,
    "cho": 11.73,
    "pro": 0.26,
    "fat": 0.17,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Manzana desecada",
    "originalName": "Manzana desecada",
    "kcal": 156,
    "cho": 38.64,
    "pro": 0.84,
    "fat": 0.56,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Melocotón",
    "originalName": "Melocotón",
    "kcal": 39,
    "cho": 9.5,
    "pro": 0.9,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Melón",
    "originalName": "Melón ",
    "kcal": 34,
    "cho": 8.2,
    "pro": 0.8,
    "fat": 0.2,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Naranja",
    "originalName": "Naranja ",
    "kcal": 47,
    "cho": 11.8,
    "pro": 0.9,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Naranja desecada",
    "originalName": "Naranja desecada",
    "kcal": 141,
    "cho": 33.04,
    "pro": 2.52,
    "fat": 0.28,
    "tags": [
      "fructosa"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Nectarina",
    "originalName": "Nectarina",
    "kcal": 46,
    "cho": 10.6,
    "pro": 1,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Paraguayo",
    "originalName": "Paraguayo",
    "kcal": 42,
    "cho": 10,
    "pro": 0.9,
    "fat": 0.2,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Pera",
    "originalName": "Pera ",
    "kcal": 57,
    "cho": 15.2,
    "pro": 0.4,
    "fat": 0.1,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Pera compota sin azúcar",
    "originalName": "Pera compota sin azúcar",
    "kcal": 46.7,
    "cho": 12.92,
    "pro": 0.34,
    "fat": 0.09,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Piña congelada",
    "originalName": "Piña congelada",
    "kcal": 49,
    "cho": 12.84,
    "pro": 0.49,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Piña desecada",
    "originalName": "Piña desecada",
    "kcal": 150,
    "cho": 36.68,
    "pro": 1.4,
    "fat": 0.28,
    "tags": [
      "fructosa"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Piña pelada",
    "originalName": "Piña pelada",
    "kcal": 47.5,
    "cho": 12.58,
    "pro": 0.48,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Plátano",
    "originalName": "Plátano ",
    "kcal": 89,
    "cho": 22.8,
    "pro": 1.1,
    "fat": 0.3,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Plátano desecada",
    "originalName": "Plátano desecada",
    "kcal": 267,
    "cho": 63.84,
    "pro": 3.08,
    "fat": 0.84,
    "tags": [
      "fructosa"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Sandía",
    "originalName": "Sandía ",
    "kcal": 30,
    "cho": 7.6,
    "pro": 0.6,
    "fat": 0.2,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Uva desecada",
    "originalName": "Uva desecada",
    "kcal": 207,
    "cho": 50.4,
    "pro": 1.96,
    "fat": 0.56,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "frutas",
      "desecadas"
    ]
  },
  {
    "name": "Uvas",
    "originalName": "Uva ",
    "kcal": 69,
    "cho": 18,
    "pro": 0.7,
    "fat": 0.2,
    "tags": [
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Vinagre de manzana",
    "originalName": "Vinagre de manzana",
    "kcal": 22,
    "cho": 0.9,
    "pro": 0,
    "fat": 0,
    "tags": [
      "fructosa",
      "alto_azufre"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "suplementos",
      "salsas"
    ]
  },
  // {
  //   "name": "Zumo de naranja natural",
  //   "originalName": "Zumo de naranja natural",
  //   "kcal": 45,
  //   "cho": 10.4,
  //   "pro": 0.7,
  //   "fat": 0.2,
  //   "tags": [
  //     "fructosa"
  //   ],
  //   "minGrams": 100,
  //   "maxGrams": 220,
  //   "treePath": [
  //     "frutas"
  //   ]
  // },
  {
    "name": "Aceite de coco",
    "originalName": "Aceite de coco",
    "kcal": 862,
    "cho": 0,
    "pro": 0,
    "fat": 99.1,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 25,
    "treePath": [
      "grasas",
      "aceites"
    ]
  },
  {
    "name": "Aceite de girasol",
    "originalName": "Aceite de girasol",
    "kcal": 884,
    "cho": 0,
    "pro": 0,
    "fat": 100,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 25,
    "treePath": [
      "grasas",
      "aceites"
    ]
  },
  {
    "name": "Aguacate",
    "originalName": "aguacate",
    "kcal": 141,
    "cho": 5.9,
    "pro": 1.5,
    "fat": 12,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 30,
    "maxGrams": 120,
    "treePath": [
      "grasas",
      "aguacate"
    ]
  },
  {
    "name": "Almendras",
    "originalName": "Almendra ",
    "kcal": 579,
    "cho": 21.6,
    "pro": 21.2,
    "fat": 49.9,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Anacardo (marañón)",
    "originalName": "Anacardo (marañón)",
    "kcal": 553,
    "cho": 30.2,
    "pro": 18.2,
    "fat": 43.9,
    "tags": [
      "fruto_seco",
      "alto_fodmap"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "AOVE",
    "originalName": "Aceite de oliva virgen extra",
    "kcal": 884,
    "cho": 0,
    "pro": 0,
    "fat": 100,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 25,
    "defaultGrams": 15,
    "treePath": [
      "grasas",
      "aceites"
    ]
  },
  {
    "name": "Avellanas",
    "originalName": "Avellana",
    "kcal": 628,
    "cho": 16.7,
    "pro": 15,
    "fat": 60.8,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Cacahuete (maní)",
    "originalName": "Cacahuete (maní)",
    "kcal": 567,
    "cho": 16.1,
    "pro": 25.8,
    "fat": 49.2,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Crema de cacahuete natural (100% cacahuete)",
    "originalName": "Crema de cacahuete natural (100% cacahuete)",
    "kcal": 588,
    "cho": 20,
    "pro": 25,
    "fat": 50,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "defaultGrams": 20,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Mantequilla",
    "originalName": "Mantequilla",
    "kcal": 717,
    "cho": 0.1,
    "pro": 0.9,
    "fat": 81,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 15,
    "maxGrams": 40,
    "treePath": [
      "grasas",
      "aceites"
    ]
  },
  {
    "name": "Nueces",
    "originalName": "Nuez",
    "kcal": 654,
    "cho": 13.7,
    "pro": 15.2,
    "fat": 65.2,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Pistachos",
    "originalName": "Pistacho",
    "kcal": 560,
    "cho": 27.5,
    "pro": 20.2,
    "fat": 45.4,
    "tags": [
      "fruto_seco",
      "alto_fodmap"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Claras de huevo",
    "originalName": "Clara de huevo crudo",
    "kcal": 52,
    "cho": 0.7,
    "pro": 10.9,
    "fat": 0.2,
    "tags": [
      "huevo"
    ],
    "minGrams": 40,
    "maxGrams": 200,
    "treePath": [
      "proteina",
      "huevos"
    ]
  },
  {
    "name": "Huevo entero tortilla",
    "originalName": "Huevo entero tortilla",
    "kcal": 193.8,
    "cho": 1.1,
    "pro": 13,
    "fat": 13.75,
    "tags": [
      "huevo"
    ],
    "minGrams": 50,
    "maxGrams": 160,
    "treePath": [
      "proteina",
      "huevos"
    ]
  },
  {
    "name": "Huevo entero",
    "originalName": "Huevo entero crudo",
    "kcal": 160,
    "cho": 1.1,
    "pro": 13,
    "fat": 11,
    "tags": [
      "huevo"
    ],
    "minGrams": 50,
    "maxGrams": 160,
    "treePath": [
      "proteina",
      "huevos"
    ]
  },
  {
    "name": "Kéfir desnatado",
    "originalName": "Kéfir desnatado",
    "kcal": 38,
    "cho": 4.5,
    "pro": 3.8,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 30,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Kéfir entero",
    "originalName": "Kéfir entero",
    "kcal": 64,
    "cho": 4.7,
    "pro": 3.5,
    "fat": 3.5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 30,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Leche de almendra sin azúcar",
    "originalName": "Leche de almendra sin azúcar",
    "kcal": 24,
    "cho": 2.6,
    "pro": 0.5,
    "fat": 1.1,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches"
    ]
  },
  {
    "name": "Leche de soja sin azúcar",
    "originalName": "Leche de soja sin azúcar",
    "kcal": 33,
    "cho": 1.8,
    "pro": 3.3,
    "fat": 1.8,
    "tags": [
      "soja"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches"
    ]
  },
  {
    "name": "Leche desnatada",
    "originalName": "Leche desnatada",
    "kcal": 39,
    "cho": 5.28,
    "pro": 3.52,
    "fat": 2.15,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches"
    ]
  },
  {
    "name": "Leche entera",
    "originalName": "Leche entera ",
    "kcal": 60,
    "cho": 4.8,
    "pro": 3.2,
    "fat": 3.3,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches"
    ]
  },
  {
    "name": "Leche entera alto proteína",
    "originalName": "Leche entera alto proteína",
    "kcal": 69,
    "cho": 8.64,
    "pro": 5.76,
    "fat": 3.79,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches"
    ]
  },
  {
    "name": "Leche entera sin lactosa",
    "originalName": "Leche entera sin lactosa",
    "kcal": 60,
    "cho": 4.8,
    "pro": 3.2,
    "fat": 3.3,
    "tags": [
      "sin_lactosa_especial",
      "proteina_vaca"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches"
    ]
  },
  {
    "name": "Proteína whey en polvo",
    "originalName": "Proteína whey en polvo (concentrado, sin batir)",
    "kcal": 390,
    "cho": 8,
    "pro": 78,
    "fat": 6.5,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ],
    "minGrams": 30,
    "maxGrams": 150,
    "treePath": [
      "suplementos",
      "proteina_polvo"
    ]
  },
  {
    "name": "Queso cottage",
    "originalName": "Queso cottage",
    "kcal": 98,
    "cho": 3.4,
    "pro": 11.1,
    "fat": 4.3,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso crema tipo untable",
    "originalName": "Queso crema tipo untable",
    "kcal": 342,
    "cho": 4,
    "pro": 6,
    "fat": 34,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso curado",
    "originalName": "Queso curado ",
    "kcal": 400,
    "cho": 1.3,
    "pro": 25,
    "fat": 33,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso de cabra",
    "originalName": "Queso de cabra",
    "kcal": 364,
    "cho": 0.1,
    "pro": 21.6,
    "fat": 30,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso fresco",
    "originalName": "Queso fresco ",
    "kcal": 98,
    "cho": 3,
    "pro": 11,
    "fat": 4,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 40,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso fresco alto proteína",
    "originalName": "Queso fresco alto proteína",
    "kcal": 112.7,
    "cho": 5.4,
    "pro": 19.8,
    "fat": 4.6,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 40,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso fresco desnatado",
    "originalName": "Queso fresco desnatado",
    "kcal": 63.7,
    "cho": 3.3,
    "pro": 12.1,
    "fat": 2.6,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 40,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso fresco sin lactosa",
    "originalName": "Queso fresco sin lactosa",
    "kcal": 98,
    "cho": 3,
    "pro": 11,
    "fat": 4,
    "tags": [
      "sin_lactosa_especial",
      "proteina_vaca"
    ],
    "minGrams": 40,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso fresco batido desnatado",
    "originalName": "Queso fresco batido / desnatado",
    "kcal": 78,
    "cho": 3.4,
    "pro": 12,
    "fat": 1.8,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 40,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso manchego curado",
    "originalName": "Queso manchego curado",
    "kcal": 400,
    "cho": 0.1,
    "pro": 26,
    "fat": 33,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Queso parmesano",
    "originalName": "Queso parmesano",
    "kcal": 431,
    "cho": 4.1,
    "pro": 38,
    "fat": 29,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Requesón",
    "originalName": "Requesón",
    "kcal": 98,
    "cho": 3.4,
    "pro": 11,
    "fat": 4.3,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ],
    "minGrams": 30,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Seitán",
    "originalName": "seitán",
    "kcal": 121,
    "cho": 3.8,
    "pro": 24.7,
    "fat": 1.9,
    "tags": [
      "gluten",
      "proteina_vegetal"
    ],
    "minGrams": 30,
    "maxGrams": 150,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Skyr natural",
    "originalName": "Skyr natural (Arla/Mercadona)",
    "kcal": 63,
    "cho": 4,
    "pro": 11,
    "fat": 0.2,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ],
    "minGrams": 30,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Tofu firme",
    "originalName": "Tofu firme",
    "kcal": 76,
    "cho": 1.9,
    "pro": 8.1,
    "fat": 4.8,
    "tags": [
      "soja",
      "proteina_vegetal"
    ],
    "minGrams": 30,
    "maxGrams": 150,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Heura",
    "originalName": "Bocados de Heura",
    "kcal": 126,
    "cho": 1.8,
    "pro": 18.6,
    "fat": 3.1,
    "tags": [
      "soja",
      "proteina_vegetal"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Tempeh",
    "originalName": "Tempeh de soja",
    "kcal": 192,
    "cho": 7.6,
    "pro": 19,
    "fat": 10.8,
    "tags": [
      "soja",
      "proteina_vegetal"
    ],
    "minGrams": 80,
    "maxGrams": 200,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Burger vegana",
    "originalName": "Hamburguesa vegana",
    "kcal": 190,
    "cho": 4.2,
    "pro": 17,
    "fat": 11,
    "tags": [
      "soja",
      "proteina_vegetal"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Yogur griego natural",
    "originalName": "Yogur griego natural ",
    "kcal": 97,
    "cho": 3.6,
    "pro": 9,
    "fat": 5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur griego natural desnatado",
    "originalName": "Yogur griego natural desnatado",
    "kcal": 63.1,
    "cho": 3.96,
    "pro": 9.9,
    "fat": 3.25,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur proteico natural",
    "originalName": "Yogur High Protein natural (Danone)",
    "kcal": 60,
    "cho": 4,
    "pro": 10,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur proteico sabor chocolate",
    "originalName": "Yogur High Protein sabor chocolate (Danone)",
    "kcal": 85,
    "cho": 8,
    "pro": 10,
    "fat": 1.5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur natural",
    "originalName": "Yogur natural ",
    "kcal": 61,
    "cho": 4.7,
    "pro": 3.5,
    "fat": 3.3,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur natural alto proteína",
    "originalName": "Yogur natural alto proteína",
    "kcal": 70.1,
    "cho": 8.46,
    "pro": 6.3,
    "fat": 3.79,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur natural desnatado",
    "originalName": "Yogur natural desnatado",
    "kcal": 39.6,
    "cho": 5.17,
    "pro": 3.85,
    "fat": 2.15,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur natural sin lactosa",
    "originalName": "Yogur natural sin lactosa",
    "kcal": 61,
    "cho": 4.7,
    "pro": 3.5,
    "fat": 3.3,
    "tags": [
      "sin_lactosa_especial",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur proteico natural",
    "originalName": "Yogur proteico natural (Hacendado/Mercadona)",
    "kcal": 57,
    "cho": 3.9,
    "pro": 10,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur proteico sabor vainilla",
    "originalName": "Yogur proteico sabor vainilla (Hacendado/Mercadona)",
    "kcal": 65,
    "cho": 5.5,
    "pro": 10,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur proteico natural",
    "originalName": "Yogur Proteína natural (Central Lechera Asturiana)",
    "kcal": 62,
    "cho": 4.5,
    "pro": 10,
    "fat": 1,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Yogur proteico sin lactosa",
    "originalName": "Yogur sin lactosa Proteína natural (Kaiku)",
    "kcal": 60,
    "cho": 4,
    "pro": 10,
    "fat": 1.5,
    "tags": [
      "sin_lactosa_especial",
      "proteina_vaca"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures"
    ]
  },
  {
    "name": "Alubia blanca",
    "originalName": "Alubia blanca seca",
    "kcal": 333,
    "cho": 60,
    "pro": 23,
    "fat": 0.8,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 300,
    "treePath": [
      "hidratos",
      "legumbres"
    ]
  },
  {
    "name": "Garbanzo",
    "originalName": "Garbanzo seca",
    "kcal": 364,
    "cho": 61,
    "pro": 19,
    "fat": 6,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 300,
    "treePath": [
      "hidratos",
      "legumbres"
    ]
  },
  {
    "name": "Lenteja",
    "originalName": "Lenteja seca",
    "kcal": 353,
    "cho": 60,
    "pro": 25,
    "fat": 1.1,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 300,
    "treePath": [
      "hidratos",
      "legumbres"
    ]
  },
  {
    "name": "Soja texturizada",
    "originalName": "Soja texturizada seca",
    "kcal": 336,
    "cho": 31,
    "pro": 50,
    "fat": 1.2,
    "tags": [
      "soja",
      "alto_fodmap",
      "proteina_vegetal"
    ],
    "minGrams": 35,
    "maxGrams": 80,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Agua de coco",
    "originalName": "Agua de coco",
    "kcal": 19,
    "cho": 3.7,
    "pro": 0.7,
    "fat": 0.2,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "bebidas"
    ]
  },
  {
    "name": "Barrita energética avena y fruta",
    "originalName": "Barrita energética avena y fruta",
    "kcal": 195,
    "cho": 35,
    "pro": 5,
    "fat": 4,
    "tags": [
      "gluten",
      "fructosa"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "deportivos"
    ]
  },
  {
    "name": "Batido de proteína de suero 30g",
    "originalName": "Batido de proteína de suero 30g",
    "kcal": 90,
    "cho": 1,
    "pro": 20,
    "fat": 0.5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 25,
    "maxGrams": 40,
    "treePath": [
      "suplementos",
      "proteina_polvo"
    ]
  },
  {
    "name": "Batido de proteína sin lactosa 30g",
    "originalName": "Batido de proteína sin lactosa 30g",
    "kcal": 90,
    "cho": 1,
    "pro": 20,
    "fat": 0.5,
    "tags": [
      "proteina_vaca",
      "sin_lactosa_especial"
    ],
    "minGrams": 25,
    "maxGrams": 40,
    "treePath": [
      "suplementos",
      "proteina_polvo"
    ]
  },
  {
    "name": "Café solo (espresso)",
    "originalName": "Café solo (espresso)",
    "kcal": 2,
    "cho": 0,
    "pro": 0.1,
    "fat": 0,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "bebidas"
    ]
  },
  {
    "name": "Carne picada mixta",
    "originalName": "carne picada mixta",
    "kcal": 228,
    "cho": 0,
    "pro": 17.6,
    "fat": 17.5,
    "tags": [
      "carne_roja",
      "cerdo"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "proteina",
      "carnes_otras"
    ]
  },
  {
    "name": "Caseína micelar nocturna 30g",
    "originalName": "Caseína micelar nocturna 30g",
    "kcal": 110,
    "cho": 1.5,
    "pro": 25,
    "fat": 0.5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "proteina_polvo"
    ]
  },
  {
    "name": "Chocolate negro 70-85% cacao",
    "originalName": "Chocolate negro 70-85% cacao",
    "kcal": 598,
    "cho": 45.9,
    "pro": 7.8,
    "fat": 42.6,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 20,
    "defaultGrams": 20,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Colacao",
    "originalName": "Colacao",
    "kcal": 377,
    "cho": 78,
    "pro": 6.6,
    "fat": 2.5,
    "tags": [],
    "minGrams": 15,
    "maxGrams": 25,
    "defaultGrams": 20,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Ciclodextrina / Maltodextrina 30g",
    "originalName": "Ciclodextrina / Maltodextrina 30g",
    "kcal": 116,
    "cho": 29,
    "pro": 0,
    "fat": 0,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "deportivos"
    ]
  },
  {
    "name": "Colágeno hidrolizado + Vitamina C 15g",
    "originalName": "Colágeno hidrolizado + Vitamina C 15g",
    "kcal": 56,
    "cho": 0,
    "pro": 14,
    "fat": 0,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "deportivos"
    ]
  },
  {
    "name": "Ensure Nutrición Entera",
    "originalName": "Ensure Nutrición Entera (unidad)",
    "kcal": 250,
    "cho": 32,
    "pro": 9,
    "fat": 8,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "deportivos"
    ]
  },
  {
    "name": "Gazpacho",
    "originalName": "Gazpacho",
    "kcal": 42,
    "cho": 4.5,
    "pro": 1,
    "fat": 2.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Gel energético deportivo",
    "originalName": "Gel energético deportivo (unidad)",
    "kcal": 120,
    "cho": 30,
    "pro": 0,
    "fat": 0,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "deportivos"
    ]
  },
  {
    "name": "Helado",
    "kcal": 200,
    "cho": 25,
    "pro": 3.5,
    "fat": 10,
    "tags": [
      "proteina_vaca",
      "fructosa",
      "lactosa"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Mejiilon en conserva (escabeche)",
    "originalName": "mejiilon en conserva (escabeche)",
    "kcal": 168,
    "cho": 4,
    "pro": 14,
    "fat": 10,
    "tags": [
      "marisco",
      "alto_azufre"
    ],
    "minGrams": 50,
    "maxGrams": 160,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Miel",
    "originalName": "Miel",
    "kcal": 304,
    "cho": 82.4,
    "pro": 0.3,
    "fat": 0,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Mostaza de Dijon",
    "originalName": "Mostaza de Dijon",
    "kcal": 66,
    "cho": 5,
    "pro": 4.4,
    "fat": 3.3,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "salsas"
    ]
  },
  {
    "name": "Mozzarella fresca",
    "originalName": "Mozzarella fresca",
    "kcal": 280,
    "cho": 2.2,
    "pro": 18,
    "fat": 22,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "quesos"
    ]
  },
  {
    "name": "Pesto",
    "originalName": "Pesto",
    "kcal": 460,
    "cho": 5,
    "pro": 4.5,
    "fat": 46,
    "tags": [
      "proteina_vaca",
      "lactosa",
      "fruto_seco",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "salsas"
    ]
  },
  {
    "name": "Piñones",
    "originalName": "Piñones",
    "kcal": 673,
    "cho": 13.1,
    "pro": 13.7,
    "fat": 68.4,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "grasas",
      "semillas"
    ]
  },
  {
    "name": "Pipas de girasol",
    "originalName": "Pipas de girasol",
    "kcal": 584,
    "cho": 20,
    "pro": 20.8,
    "fat": 51.5,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "grasas",
      "semillas"
    ]
  },
  {
    "name": "Salmorejo",
    "originalName": "Salmorejo",
    "kcal": 95,
    "cho": 8,
    "pro": 2,
    "fat": 6,
    "tags": [
      "gluten",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Salsa boloñesa",
    "originalName": "Salsa boloñesa",
    "kcal": 105,
    "cho": 6,
    "pro": 6.5,
    "fat": 6,
    "tags": [
      "carne_roja",
      "cerdo",
      "alto_fodmap"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "salsas"
    ]
  },
  {
    "name": "Salsa de soja",
    "originalName": "Salsa de soja",
    "kcal": 53,
    "cho": 4.9,
    "pro": 8,
    "fat": 0.1,
    "tags": [
      "soja",
      "gluten"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "salsas"
    ]
  },
  {
    "name": "Salsa de soja sin azúcar",
    "originalName": "salsa de soja sin azúcar",
    "kcal": 53,
    "cho": 4.9,
    "pro": 8.1,
    "fat": 0.6,
    "tags": [
      "soja"
    ],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "salsas"
    ]
  },
  {
    "name": "Secreto de cerdo",
    "originalName": "Secreto de cerdo",
    "kcal": 290,
    "cho": 0,
    "pro": 17.5,
    "fat": 24,
    "tags": [
      "cerdo"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "cerdo"
    ]
  },
  {
    "name": "Semillas de calabaza (pipas)",
    "originalName": "Semillas de calabaza (pipas)",
    "kcal": 559,
    "cho": 10.7,
    "pro": 30.2,
    "fat": 49.1,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "grasas",
      "semillas"
    ]
  },
  {
    "name": "Semillas de chía",
    "originalName": "Semillas de chía",
    "kcal": 486,
    "cho": 42.1,
    "pro": 16.5,
    "fat": 30.7,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "grasas",
      "semillas"
    ]
  },
  {
    "name": "Semillas de lino (linaza)",
    "originalName": "Semillas de lino (linaza)",
    "kcal": 534,
    "cho": 28.9,
    "pro": 18.3,
    "fat": 42.2,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "grasas",
      "semillas"
    ]
  },
  {
    "name": "Sésamo",
    "originalName": "Sésamo",
    "kcal": 573,
    "cho": 23.4,
    "pro": 17.7,
    "fat": 49.7,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "grasas",
      "semillas"
    ]
  },
  {
    "name": "Té verde (infusión)",
    "originalName": "Té verde (infusión)",
    "kcal": 1,
    "cho": 0.2,
    "pro": 0,
    "fat": 0,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 250,
    "treePath": [
      "suplementos",
      "bebidas"
    ]
  },
  {
    "name": "Atún fresco",
    "originalName": "Atún fresco lomo crudo",
    "kcal": 130,
    "cho": 0,
    "pro": 23.5,
    "fat": 4,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_azul"
    ]
  },
  {
    "name": "Atún natural",
    "originalName": "Atún natural conserva lata",
    "kcal": 116,
    "cho": 0,
    "pro": 26,
    "fat": 1,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 50,
    "maxGrams": 120,
    "defaultGrams": 60,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Atún natural conserva aceite",
    "originalName": "Atún natural conserva aceite",
    "kcal": 220.4,
    "cho": 0,
    "pro": 27.3,
    "fat": 1.05,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 50,
    "maxGrams": 120,
    "defaultGrams": 60,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Atún natural conserva natural",
    "originalName": "Atún natural conserva natural",
    "kcal": 133.4,
    "cho": 0,
    "pro": 28.6,
    "fat": 1.1,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 50,
    "maxGrams": 120,
    "defaultGrams": 60,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Bacalao",
    "originalName": "bacalao (fresco)",
    "kcal": 74,
    "cho": 0,
    "pro": 17.7,
    "fat": 0.4,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Bacalao desalado",
    "originalName": "bacalao desalado",
    "kcal": 82,
    "cho": 0,
    "pro": 18,
    "fat": 0.7,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Bacalao fresco",
    "originalName": "Bacalao fresco",
    "kcal": 74,
    "cho": 0,
    "pro": 17.7,
    "fat": 0.4,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Berberecho conserva",
    "originalName": "berberecho conserva",
    "kcal": 69,
    "cho": 2.5,
    "pro": 15,
    "fat": 0.6,
    "tags": [
      "marisco"
    ],
    "minGrams": 50,
    "maxGrams": 160,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Berberechos frescos",
    "originalName": "berberecho fresco",
    "kcal": 79,
    "cho": 3,
    "pro": 15.7,
    "fat": 1,
    "tags": [
      "marisco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "marisco"
    ]
  },
  {
    "name": "Caballa",
    "originalName": "Caballa crudo",
    "kcal": 205,
    "cho": 0,
    "pro": 18.6,
    "fat": 13.9,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_azul"
    ]
  },
  {
    "name": "Caballa en conserva (al natural)",
    "originalName": "caballa en conserva (al natural)",
    "kcal": 167,
    "cho": 0,
    "pro": 24,
    "fat": 7.5,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 50,
    "maxGrams": 160,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Calamar",
    "originalName": "Calamar",
    "kcal": 92,
    "cho": 3.1,
    "pro": 15.6,
    "fat": 1.4,
    "tags": [
      "marisco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "marisco"
    ]
  },
  {
    "name": "Corvina",
    "originalName": "Corvina crudo",
    "kcal": 100,
    "cho": 0,
    "pro": 19,
    "fat": 2.6,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Dorada",
    "originalName": "Dorada",
    "kcal": 121,
    "cho": 0,
    "pro": 20,
    "fat": 4,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Emperador (pez espada)",
    "originalName": "Emperador (pez espada) crudo",
    "kcal": 121,
    "cho": 0,
    "pro": 19.8,
    "fat": 4,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_azul"
    ]
  },
  {
    "name": "Gambas",
    "originalName": "Gamba cruda",
    "kcal": 99,
    "cho": 0.2,
    "pro": 24,
    "fat": 0.3,
    "tags": [
      "marisco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "marisco"
    ]
  },
  {
    "name": "Lenguado",
    "originalName": "Lenguado",
    "kcal": 86,
    "cho": 0,
    "pro": 16.5,
    "fat": 1.9,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Lubina",
    "originalName": "Lubina",
    "kcal": 97,
    "cho": 0,
    "pro": 18.4,
    "fat": 2.5,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Mejillones frescos",
    "originalName": "Mejillon fresco",
    "kcal": 86,
    "cho": 3.7,
    "pro": 12,
    "fat": 2.2,
    "tags": [
      "marisco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "marisco"
    ]
  },
  {
    "name": "Merluza",
    "originalName": "Merluza",
    "kcal": 90,
    "cho": 0,
    "pro": 18,
    "fat": 1.5,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Rape",
    "originalName": "Rape crudo",
    "kcal": 82,
    "cho": 0,
    "pro": 18.7,
    "fat": 0.8,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Pulpo",
    "originalName": "Pulpo crudo",
    "kcal": 82,
    "cho": 2.2,
    "pro": 14.9,
    "fat": 1,
    "tags": [
      "marisco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "marisco"
    ]
  },
  {
    "name": "Rodaballo",
    "originalName": "Rodaballo ",
    "kcal": 92,
    "cho": 0,
    "pro": 16,
    "fat": 3,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_blanco"
    ]
  },
  {
    "name": "Salmón",
    "originalName": "Salmón crudo",
    "kcal": 208,
    "cho": 0,
    "pro": 20,
    "fat": 13,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_azul"
    ]
  },
  {
    "name": "Salmón conserva aceite",
    "originalName": "Salmón conserva aceite",
    "kcal": 395.2,
    "cho": 0,
    "pro": 21,
    "fat": 24.7,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 50,
    "maxGrams": 160,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Salmón conserva natural",
    "originalName": "Salmón conserva natural",
    "kcal": 239.2,
    "cho": 0,
    "pro": 22,
    "fat": 14.95,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 50,
    "maxGrams": 160,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Salmón ahumado",
    "originalName": "salmón ahumado",
    "kcal": 181,
    "cho": 0,
    "pro": 22,
    "fat": 10.5,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "embutidos"
    ]
  },
  {
    "name": "Salmón fresco",
    "originalName": "Salmón fresco",
    "kcal": 208,
    "cho": 0,
    "pro": 20,
    "fat": 13,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_azul"
    ]
  },
  {
    "name": "Sardina",
    "originalName": "Sardina crudo",
    "kcal": 208,
    "cho": 0,
    "pro": 25,
    "fat": 11,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado_azul"
    ]
  },
  {
    "name": "Sardina conserva aceite",
    "originalName": "Sardina conserva aceite",
    "kcal": 395.2,
    "cho": 0,
    "pro": 26.25,
    "fat": 20.9,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 50,
    "maxGrams": 160,
    "treePath": [
      "proteina",
      "conservas_pescado"
    ]
  },
  {
    "name": "Sepia",
    "originalName": "Sepia",
    "kcal": 79,
    "cho": 0.8,
    "pro": 16.2,
    "fat": 0.7,
    "tags": [
      "marisco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "marisco"
    ]
  },
  {
    "name": "Acelga",
    "originalName": "Acelga cruda",
    "kcal": 19,
    "cho": 3.7,
    "pro": 1.8,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Ajo",
    "originalName": "Ajo ",
    "kcal": 149,
    "cho": 33,
    "pro": 6.4,
    "fat": 0.5,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 5,
    "maxGrams": 10,
    "treePath": [
      "condimentos",
      "aromaticas"
    ]
  },
  {
    "name": "Alcachofa",
    "originalName": "alcachofa",
    "kcal": 44,
    "cho": 7.8,
    "pro": 2.4,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Berenjena",
    "originalName": "Berenjena cruda",
    "kcal": 25,
    "cho": 5.9,
    "pro": 1,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Brócoli",
    "originalName": "Brócoli crudo",
    "kcal": 34,
    "cho": 6.6,
    "pro": 2.8,
    "fat": 0.4,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Calabacín",
    "originalName": "Calabacín crudo",
    "kcal": 17,
    "cho": 3.1,
    "pro": 1.2,
    "fat": 0.3,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Cebolla",
    "originalName": "Cebolla cruda",
    "kcal": 40,
    "cho": 9.3,
    "pro": 1.1,
    "fat": 0.1,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Champiñón",
    "originalName": "Champiñón crudo",
    "kcal": 22,
    "cho": 3.3,
    "pro": 3.1,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Coliflor",
    "originalName": "Coliflor cruda",
    "kcal": 25,
    "cho": 5,
    "pro": 1.9,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Espárragos blancos conserva",
    "originalName": "espárragos blancos conserva",
    "kcal": 20,
    "cho": 2.5,
    "pro": 1.8,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Espárragos verdes",
    "originalName": "espárragos verdes",
    "kcal": 23,
    "cho": 1.8,
    "pro": 2.6,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Guisantes",
    "originalName": "Guisantes crudos",
    "kcal": 81,
    "cho": 14.5,
    "pro": 5.4,
    "fat": 0.4,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Puerro",
    "originalName": "Puerro crudo",
    "kcal": 31,
    "cho": 5.7,
    "pro": 1.5,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Espinaca",
    "originalName": "Espinaca cruda",
    "kcal": 23,
    "cho": 3.6,
    "pro": 2.9,
    "fat": 0.4,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Hamburguesa de espinacas",
    "originalName": "Hamburguesa de espinacas crudo",
    "kcal": 120,
    "cho": 12,
    "pro": 5,
    "fat": 5.5,
    "tags": [
      "gluten",
      "proteina_vegetal"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "proteinas",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Judías verdes",
    "kcal": 31,
    "cho": 4.2,
    "pro": 1.8,
    "fat": 0.1,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Lechuga romana",
    "originalName": "Lechuga romana cruda",
    "kcal": 17,
    "cho": 3.3,
    "pro": 1.2,
    "fat": 0.3,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Pepino",
    "originalName": "Pepino",
    "kcal": 15,
    "cho": 3.6,
    "pro": 0.7,
    "fat": 0.1,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Pimiento",
    "originalName": "Pimiento cruda",
    "kcal": 31,
    "cho": 6,
    "pro": 1,
    "fat": 0.3,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Remolacha",
    "originalName": "Remolacha cruda",
    "kcal": 43,
    "cho": 9.6,
    "pro": 1.6,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Rúcula",
    "originalName": "Rúcula cruda",
    "kcal": 25,
    "cho": 3.7,
    "pro": 2.6,
    "fat": 0.7,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Tomate",
    "originalName": "Tomate crudo",
    "kcal": 18,
    "cho": 3.9,
    "pro": 0.9,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Tomate frito",
    "originalName": "Tomate frito",
    "kcal": 82,
    "cho": 11,
    "pro": 1.6,
    "fat": 3.5,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Zanahoria",
    "originalName": "Zanahoria cruda",
    "kcal": 41,
    "cho": 9.6,
    "pro": 0.9,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Batido de proteína vegetal 30g",
    "originalName": "Batido de proteína vegetal 30g",
    "kcal": 90,
    "cho": 1.5,
    "pro": 20,
    "fat": 0.5,
    "tags": [
      "sin_lactosa_especial"
    ],
    "minGrams": 25,
    "maxGrams": 40,
    "treePath": [
      "suplementos",
      "proteina_polvo"
    ]
  }
];

export function normalizeFoodName(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[(),.]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Precomputar normalizedName en cada elemento del catálogo para indexación del árbol
FOODS_CRUDO.forEach((f) => {
  f.normalizedName = normalizeFoodName(f.name);
});

export default FOODS_CRUDO;
