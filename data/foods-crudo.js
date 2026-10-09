/**
 * Catálogo Oficial de Alimentos Limpios en Crudo para Nutralab
 * Fuente base: data/foods.js (filtrado sin cocinados, procesados ni alcohol)
 * Nombres naturales en español para integración con IA y cálculo exacto.
 * Cada alimento incluye sus etiquetas dietéticas y clínicas ('tags') para filtrado determinista.
 * Límites gastronómicos mínimos y máximos (minGrams, maxGrams) para cada alimento.
 * Valores por 100g de alimento en crudo o ración indicada. Las kcal son siempre 4·proteína + 4·hidratos + 9·grasa
 * (como los objetivos del día); el motor comprueba al cargar que se cumple.
 * Frutas y verduras: 'temporada' con los meses (MES) en que están de temporada en España. Al elegir fruta o verdura
 * libre dentro de un grupo, el motor rota solo entre las de temporada del mes del plan; lo que una pauta, el
 * protocolo o un plato del menú nombran de forma concreta se sirve siempre. Toda fruta y verdura que rota debe tenerla.
 */

const MES = Object.freeze({
  ENERO: 1,
  FEBRERO: 2,
  MARZO: 3,
  ABRIL: 4,
  MAYO: 5,
  JUNIO: 6,
  JULIO: 7,
  AGOSTO: 8,
  SEPTIEMBRE: 9,
  OCTUBRE: 10,
  NOVIEMBRE: 11,
  DICIEMBRE: 12,
});

const TODO_EL_AÑO = Object.freeze(Object.values(MES));

export const FOODS_CRUDO = [
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
      "carne",
      "pavo"
    ]
  },
  {
    "name": "Carne picada de pollo",
    "originalName": "Carne picada de pollo",
    "kcal": 140.5,
    "cho": 0,
    "pro": 20.5,
    "fat": 6.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pollo"
    ]
  },
  {
    "name": "Carne picada de ternera",
    "originalName": "Carne picada de ternera",
    "kcal": 186.8,
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
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Chuleta de pavo",
    "originalName": "chuletas de pavo",
    "kcal": 115.2,
    "cho": 0,
    "pro": 22.5,
    "fat": 2.8,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pavo"
    ]
  },
  {
    "name": "Conejo",
    "originalName": "Conejo",
    "kcal": 127.7,
    "cho": 0,
    "pro": 21.8,
    "fat": 4.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "conejo"
    ]
  },
  {
    "name": "Contramuslo de pollo deshuesado",
    "originalName": "Contramuslo de pollo deshuesado",
    "kcal": 154.5,
    "cho": 0,
    "pro": 19.5,
    "fat": 8.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pollo"
    ]
  },
  {
    "name": "Entrecot de ternera",
    "originalName": "Ternera entrecot",
    "kcal": 222.8,
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
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Hamburguesa de pavo",
    "originalName": "Hamburguesa de pavo crudo",
    "kcal": 134.5,
    "cho": 1,
    "pro": 18,
    "fat": 6.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pavo"
    ]
  },
  {
    "name": "Hamburguesa de pollo",
    "originalName": "Hamburguesa de pollo crudo",
    "kcal": 145.5,
    "cho": 1.8,
    "pro": 19.5,
    "fat": 6.7,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pollo"
    ]
  },
  {
    "name": "Hamburguesa de ternera",
    "originalName": "Hamburguesa de ternera crudo",
    "kcal": 211,
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
      "carne",
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
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Jamón cocido",
    "originalName": "Jamón cocido lonchas",
    "kcal": 138,
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
    "kcal": 105.5,
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
    "kcal": 109.1,
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
    "kcal": 232,
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
    "kcal": 248.9,
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
    "kcal": 315,
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
    "kcal": 171,
    "cho": 0,
    "pro": 18,
    "fat": 11,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pollo"
    ]
  },
  {
    "name": "Pechuga de pavo",
    "originalName": "Pechuga de pavo",
    "kcal": 110.8,
    "cho": 0,
    "pro": 24.1,
    "fat": 1.6,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pavo"
    ]
  },
  {
    "name": "Pechuga de pollo",
    "originalName": "Pechuga de pollo",
    "kcal": 117.4,
    "cho": 0,
    "pro": 23.5,
    "fat": 2.6,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pollo"
    ]
  },
  {
    "name": "Solomillo de cerdo",
    "originalName": "Solomillo de cerdo cruda",
    "kcal": 139.8,
    "cho": 0,
    "pro": 22.8,
    "fat": 5.4,
    "tags": [
      "cerdo"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "cerdo"
    ]
  },
  {
    "name": "Solomillo de ternera",
    "originalName": "Solomillo de ternera",
    "kcal": 130.6,
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
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Ternera magra",
    "originalName": "Ternera magra cruda",
    "kcal": 129,
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
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Arroz basmati",
    "originalName": "Arroz basmati",
    "kcal": 345.8,
    "cho": 78,
    "pro": 7.1,
    "fat": 0.6,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "arroz"
    ]
  },
  {
    "name": "Arroz blanco",
    "originalName": "Arroz blanco crudo",
    "kcal": 353.4,
    "cho": 80,
    "pro": 7,
    "fat": 0.6,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "arroz"
    ]
  },
  {
    "name": "Arroz con leche",
    "kcal": 127.2,
    "cho": 22,
    "pro": 3.5,
    "fat": 2.8,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 80,
    "maxGrams": 200,
    "treePath": [
      "suplementos",
      "dulces_otros"
    ]
  },
  {
    "name": "Arroz integral",
    "originalName": "Arroz integral crudo",
    "kcal": 362.3,
    "cho": 77,
    "pro": 7.5,
    "fat": 2.7,
    "tags": [
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "arroz"
    ]
  },
  {
    "name": "Arroz jazmín",
    "originalName": "Arroz jazmín",
    "kcal": 345.8,
    "cho": 78,
    "pro": 7.1,
    "fat": 0.6,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "arroz"
    ]
  },
  {
    "name": "Boniato",
    "originalName": "Batata boniato crudo",
    "kcal": 87.7,
    "cho": 20.1,
    "pro": 1.6,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 450,
    "defaultGrams": 250,
    "temporada": [MES.OCTUBRE, MES.NOVIEMBRE],
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Puré de boniato",
    "originalName": "Puré de boniato",
    "kcal": 88.2,
    "cho": 20,
    "pro": 1.6,
    "fat": 0.2,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 400,
    "defaultGrams": 250,
    "temporada": [MES.OCTUBRE, MES.NOVIEMBRE],
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Bulgur",
    "originalName": "Bulgur crudo",
    "kcal": 364.5,
    "cho": 75.9,
    "pro": 12.3,
    "fat": 1.3,
    "tags": [
      "gluten",
      "alto_fibra"
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
    "kcal": 394.9,
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
      "cereales"
    ]
  },
  {
    "name": "Copos de avena sin gluten",
    "originalName": "Copos de avena sin gluten",
    "kcal": 355,
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
      "cereales"
    ]
  },
  {
    "name": "Cuscús",
    "originalName": "Cuscús crudo",
    "kcal": 366.2,
    "cho": 77.4,
    "pro": 12.8,
    "fat": 0.6,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Bebida de avena",
    "originalName": "Leche de avena",
    "kcal": 44.3,
    "cho": 6.7,
    "pro": 1,
    "fat": 1.5,
    "tags": [
      "gluten",
      "sin_lactosa_especial",
      "vegetal"
    ],
    "minGrams": 100,
    "maxGrams": 300,
    "treePath": [
      "lacteos",
      "leches",
      "bebidas_vegetales"
    ]
  },
  {
    "name": "Ñoquis",
    "originalName": "Ñoquis de patata",
    "kcal": 158.5,
    "cho": 35,
    "pro": 3.5,
    "fat": 0.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "defaultGrams": 150,
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Pan blanco",
    "originalName": "Pan blanco de barra",
    "kcal": 260.8,
    "cho": 49,
    "pro": 9,
    "fat": 3.2,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 100,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pan de centeno",
    "originalName": "Pan de centeno",
    "kcal": 241.3,
    "cho": 48,
    "pro": 8.5,
    "fat": 1.7,
    "tags": [
      "gluten",
      "alto_fibra"
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
    "kcal": 281,
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
    "kcal": 257.7,
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
    "kcal": 231.5,
    "cho": 41,
    "pro": 9,
    "fat": 3.5,
    "tags": [
      "gluten",
      "alto_fibra"
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
    "kcal": 266.8,
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
      "gluten",
      "alto_fibra"
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
    "kcal": 230.6,
    "cho": 41,
    "pro": 9,
    "fat": 3.4,
    "tags": [
      "gluten",
      "alto_fibra"
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
    "kcal": 226.8,
    "cho": 46,
    "pro": 3.5,
    "fat": 3.2,
    "tags": [
      "sin_gluten_especial"
    ],
    "minGrams": 30,
    "maxGrams": 100,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Pasta de Dátil",
    "originalName": "Pasta de Dátil ",
    "kcal": 266.5,
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
    "kcal": 322.5,
    "cho": 49,
    "pro": 26,
    "fat": 2.5,
    "tags": [
      "alto_fodmap",
      "sin_gluten_especial",
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Macarrones",
    "originalName": "Macarrones",
    "kcal": 365.5,
    "cho": 75,
    "pro": 13,
    "fat": 1.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Espaguetis",
    "originalName": "Espaguetis",
    "kcal": 365.5,
    "cho": 75,
    "pro": 13,
    "fat": 1.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Pasta sin gluten",
    "originalName": "Pasta sin gluten",
    "kcal": 350.8,
    "cho": 78,
    "pro": 7,
    "fat": 1.2,
    "tags": [
      "sin_gluten_especial"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Pasta de trigo sarraceno",
    "originalName": "Pasta de trigo sarraceno cruda",
    "kcal": 349.3,
    "cho": 71,
    "pro": 12.5,
    "fat": 1.7,
    "tags": [
      "sin_gluten_especial"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Patata",
    "originalName": "Patata crudo",
    "kcal": 78.9,
    "cho": 17.5,
    "pro": 2,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
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
    "kcal": 82.5,
    "cho": 17.5,
    "pro": 2,
    "fat": 0.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 400,
    "defaultGrams": 250,
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  // {
  //   "name": "Picos / colines",
  //   "originalName": "Picos / colines",
  //   "kcal": 400,
  //   "cho": 72,
  //   "pro": 10,
  //   "fat": 8,
  //   "tags": [
  //     "gluten"
  //   ],
  //   "minGrams": 30,
  //   "maxGrams": 80,
  //   "treePath": [
  //     "hidratos",
  //     "panes"
  //   ]
  // },
  {
    "name": "Noodles de arroz",
    "originalName": "Noodles de arroz",
    "kcal": 347,
    "cho": 82,
    "pro": 3.4,
    "fat": 0.6,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Quinoa",
    "originalName": "Quinoa crudo",
    "kcal": 368.1,
    "cho": 64.2,
    "pro": 14.1,
    "fat": 6.1,
    "tags": [
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 180,
    "treePath": [
      "hidratos",
      "otros_granos"
    ]
  },
  {
    "name": "Tortitas de arroz",
    "originalName": "Tortas de arroz",
    "kcal": 378,
    "cho": 82,
    "pro": 8,
    "fat": 2,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 70,
    "treePath": [
      "hidratos",
      "cereales"
    ]
  },
  {
    "name": "Tortas de maíz",
    "originalName": "Tortas de maíz",
    "kcal": 369.8,
    "cho": 80,
    "pro": 7.5,
    "fat": 2.2,
    "tags": [],
    "minGrams": 20,
    "maxGrams": 70,
    "treePath": [
      "hidratos",
      "cereales"
    ]
  },
  {
    "name": "Tortilla de trigo",
    "originalName": "tortilla de trigo",
    "kcal": 316.5,
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
      "wraps"
    ]
  },
  {
    "name": "Tortilla de trigo integral",
    "originalName": "tortilla de trigo integral",
    "kcal": 301.8,
    "cho": 48,
    "pro": 9,
    "fat": 8.2,
    "tags": [
      "gluten",
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 170,
    "treePath": [
      "hidratos",
      "wraps"
    ]
  },
  {
    "name": "Fajitas",
    "originalName": "Tortillas para fajitas",
    "kcal": 316.5,
    "cho": 52,
    "pro": 8,
    "fat": 8.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 40,
    "maxGrams": 180,
    "treePath": [
      "hidratos",
      "wraps"
    ]
  },
  {
    "name": "Tostadas integrales (biscotes)",
    "originalName": "Tostadas integrales (biscotes)",
    "kcal": 369,
    "cho": 70,
    "pro": 11,
    "fat": 5,
    "tags": [
      "gluten",
      "alto_fibra"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Cereales de trigo sarraceno hinchados",
    "originalName": "Trigo sarraceno hinchado",
    "kcal": 354.8,
    "cho": 68,
    "pro": 12.6,
    "fat": 3.6,
    "tags": [],
    "minGrams": 40,
    "maxGrams": 100,
    "treePath": [
      "hidratos",
      "cereales"
    ]
  },
  {
    "name": "Arándanos",
    "originalName": "Arándano cruda",
    "kcal": 63.5,
    "cho": 14.5,
    "pro": 0.7,
    "fat": 0.3,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 200,
    "temporada": [MES.MARZO, MES.ABRIL, MES.MAYO, MES.JUNIO, MES.JULIO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Ciruela",
    "originalName": "Ciruela",
    "kcal": 51.1,
    "cho": 11.4,
    "pro": 0.7,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Dátil",
    "originalName": "Dátil",
    "kcal": 313.6,
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
    "name": "Frambuesas",
    "originalName": "Frambuesa ",
    "kcal": 59.1,
    "cho": 12,
    "pro": 1.2,
    "fat": 0.7,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 200,
    "temporada": [MES.JUNIO, MES.JULIO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Fresas",
    "originalName": "Fresa ",
    "kcal": 36.3,
    "cho": 7.7,
    "pro": 0.7,
    "fat": 0.3,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.MARZO, MES.ABRIL, MES.MAYO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Kiwi",
    "originalName": "Kiwi",
    "kcal": 67.7,
    "cho": 14.7,
    "pro": 1.1,
    "fat": 0.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Mandarina",
    "originalName": "Mandarina",
    "kcal": 59.1,
    "cho": 13.3,
    "pro": 0.8,
    "fat": 0.3,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Mango",
    "originalName": "Mango ",
    "kcal": 66.8,
    "cho": 15,
    "pro": 0.8,
    "fat": 0.4,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.AGOSTO, MES.SEPTIEMBRE, MES.OCTUBRE, MES.NOVIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Manzana",
    "originalName": "Manzana ",
    "kcal": 58.2,
    "cho": 13.8,
    "pro": 0.3,
    "fat": 0.2,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.SEPTIEMBRE, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Manzana compota sin azúcar",
    "originalName": "Manzana compota sin azúcar",
    "kcal": 49.5,
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
    "name": "Melocotón",
    "originalName": "Melocotón",
    "kcal": 44.3,
    "cho": 9.5,
    "pro": 0.9,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.MAYO, MES.JUNIO, MES.JULIO, MES.AGOSTO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Melón",
    "originalName": "Melón ",
    "kcal": 37.8,
    "cho": 8.2,
    "pro": 0.8,
    "fat": 0.2,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Naranja",
    "originalName": "Naranja ",
    "kcal": 51.7,
    "cho": 11.8,
    "pro": 0.9,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.ABRIL, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Nectarina",
    "originalName": "Nectarina",
    "kcal": 49.1,
    "cho": 10.6,
    "pro": 1,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.MAYO, MES.JUNIO, MES.JULIO, MES.AGOSTO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Paraguayo",
    "originalName": "Paraguayo",
    "kcal": 45.4,
    "cho": 10,
    "pro": 0.9,
    "fat": 0.2,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Pera",
    "originalName": "Pera ",
    "kcal": 63.3,
    "cho": 15.2,
    "pro": 0.4,
    "fat": 0.1,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.SEPTIEMBRE, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Pera compota sin azúcar",
    "originalName": "Pera compota sin azúcar",
    "kcal": 53.9,
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
    "name": "Piña pelada",
    "originalName": "Piña pelada",
    "kcal": 53.1,
    "cho": 12.58,
    "pro": 0.48,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": TODO_EL_AÑO,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Plátano",
    "originalName": "Plátano ",
    "kcal": 98.3,
    "cho": 22.8,
    "pro": 1.1,
    "fat": 0.3,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": TODO_EL_AÑO,
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Sandía",
    "originalName": "Sandía ",
    "kcal": 34.6,
    "cho": 7.6,
    "pro": 0.6,
    "fat": 0.2,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Zumo de naranja natural",
    "originalName": "Zumo de naranja natural",
    "kcal": 46.2,
    "cho": 10.4,
    "pro": 0.7,
    "fat": 0.2,
    "tags": [],
    "minGrams": 150,
    "maxGrams": 300,
    "treePath": [
      "frutas",
      "zumos"
    ]
  },
  {
    "name": "Zumo de manzana",
    "originalName": "Zumo de manzana",
    "kcal": 46.5,
    "cho": 11.3,
    "pro": 0.1,
    "fat": 0.1,
    "tags": [],
    "minGrams": 150,
    "maxGrams": 300,
    "treePath": [
      "frutas",
      "zumos"
    ]
  },
  {
    "name": "Uvas",
    "originalName": "Uva ",
    "kcal": 76.6,
    "cho": 18,
    "pro": 0.7,
    "fat": 0.2,
    "tags": [
      "fructosa"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.AGOSTO, MES.SEPTIEMBRE, MES.OCTUBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Pomelo",
    "originalName": "Pomelo crudo",
    "kcal": 46.9,
    "cho": 10.7,
    "pro": 0.8,
    "fat": 0.1,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.DICIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Níspero",
    "originalName": "Níspero crudo",
    "kcal": 51.8,
    "cho": 12.1,
    "pro": 0.4,
    "fat": 0.2,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.ABRIL, MES.MAYO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Cerezas",
    "originalName": "Cereza cruda",
    "kcal": 70.2,
    "cho": 16,
    "pro": 1.1,
    "fat": 0.2,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.MAYO, MES.JUNIO, MES.JULIO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Albaricoque",
    "originalName": "Albaricoque crudo",
    "kcal": 53.6,
    "cho": 11.1,
    "pro": 1.4,
    "fat": 0.4,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.MAYO, MES.JUNIO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Higos",
    "originalName": "Higo fresco crudo",
    "kcal": 82.7,
    "cho": 19.2,
    "pro": 0.8,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Moras",
    "originalName": "Mora cruda",
    "kcal": 48.5,
    "cho": 9.6,
    "pro": 1.4,
    "fat": 0.5,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 200,
    "temporada": [MES.JULIO, MES.AGOSTO],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Granada",
    "originalName": "Granada cruda",
    "kcal": 92.4,
    "cho": 18.7,
    "pro": 1.7,
    "fat": 1.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.SEPTIEMBRE, MES.OCTUBRE, MES.NOVIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Caqui",
    "originalName": "Caqui crudo",
    "kcal": 78.6,
    "cho": 18.6,
    "pro": 0.6,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 100,
    "maxGrams": 220,
    "temporada": [MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "frutas"
    ]
  },
  {
    "name": "Vinagre de manzana",
    "originalName": "Vinagre de manzana",
    "kcal": 3.6,
    "cho": 0.9,
    "pro": 0,
    "fat": 0,
    "tags": [
      "fructosa",
      "alto_azufre"
    ],
    "minGrams": 10,
    "maxGrams": 15,
    "treePath": [
      "complementos",
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
    "kcal": 891.9,
    "cho": 0,
    "pro": 0,
    "fat": 99.1,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 25,
    "treePath": [
      "grasas",
      "aceites",
      "aceites_otros"
    ]
  },
  {
    "name": "Aceite de girasol",
    "originalName": "Aceite de girasol",
    "kcal": 900,
    "cho": 0,
    "pro": 0,
    "fat": 100,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 25,
    "treePath": [
      "grasas",
      "aceites",
      "aceites_otros"
    ]
  },
  {
    "name": "Aguacate",
    "originalName": "aguacate",
    "kcal": 137.6,
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
    "kcal": 620.3,
    "cho": 21.6,
    "pro": 21.2,
    "fat": 49.9,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 35,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Anacardos",
    "originalName": "Anacardo (marañón)",
    "kcal": 588.7,
    "cho": 30.2,
    "pro": 18.2,
    "fat": 43.9,
    "tags": [
      "fruto_seco",
      "alto_fodmap"
    ],
    "minGrams": 15,
    "maxGrams": 35,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "AOVE",
    "originalName": "Aceite de oliva virgen extra",
    "kcal": 900,
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
    "kcal": 674,
    "cho": 16.7,
    "pro": 15,
    "fat": 60.8,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 35,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Cacahuete (maní)",
    "originalName": "Cacahuete (maní)",
    "kcal": 610.4,
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
    "kcal": 630,
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
    "kcal": 733,
    "cho": 0.1,
    "pro": 0.9,
    "fat": 81,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 10,
    "maxGrams": 30,
    "treePath": [
      "grasas",
      "aceites",
      "aceites_otros"
    ]
  },
  {
    "name": "Nueces",
    "originalName": "Nuez",
    "kcal": 702.4,
    "cho": 13.7,
    "pro": 15.2,
    "fat": 65.2,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 35,
    "defaultGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Pistachos",
    "originalName": "Pistacho",
    "kcal": 599.4,
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
    "kcal": 48.2,
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
    "name": "Huevo entero",
    "originalName": "Huevo entero crudo",
    "kcal": 155.4,
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
    "kcal": 35,
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
    "kcal": 64.3,
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
    "kcal": 22.3,
    "cho": 2.6,
    "pro": 0.5,
    "fat": 1.1,
    "tags": [
      "fruto_seco",
      "sin_lactosa_especial",
      "vegetal"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches",
      "bebidas_vegetales"
    ]
  },
  {
    "name": "Leche de soja sin azúcar",
    "originalName": "Leche de soja sin azúcar",
    "kcal": 36.6,
    "cho": 1.8,
    "pro": 3.3,
    "fat": 1.8,
    "tags": [
      "soja",
      "sin_lactosa_especial",
      "vegetal"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches",
      "bebidas_vegetales"
    ]
  },
  {
    "name": "Leche desnatada",
    "originalName": "Leche desnatada",
    "kcal": 37,
    "cho": 5.28,
    "pro": 3.52,
    "fat": 0.2,
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
    "kcal": 61.7,
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
    "kcal": 72.9,
    "cho": 4.8,
    "pro": 6,
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
    "name": "Leche entera sin lactosa",
    "originalName": "Leche entera sin lactosa",
    "kcal": 61.7,
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
    "kcal": 402.5,
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
    "kcal": 96.7,
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
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Queso crema tipo untable",
    "originalName": "Queso crema tipo untable",
    "kcal": 346,
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
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Queso curado",
    "originalName": "Queso curado ",
    "kcal": 402.2,
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
      "quesos",
      "quesos_curados"
    ]
  },
  {
    "name": "Queso de cabra",
    "originalName": "Queso de cabra",
    "kcal": 356.8,
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
      "quesos",
      "quesos_curados"
    ]
  },
  {
    "name": "Queso fresco",
    "originalName": "Queso fresco ",
    "kcal": 92,
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
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Queso fresco alto proteína",
    "originalName": "Queso fresco alto proteína",
    "kcal": 113.4,
    "cho": 5.4,
    "pro": 19.8,
    "fat": 1.4,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 40,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Queso fresco desnatado",
    "originalName": "Queso fresco desnatado",
    "kcal": 63.4,
    "cho": 3.3,
    "pro": 12.1,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 40,
    "maxGrams": 150,
    "treePath": [
      "lacteos",
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Queso fresco sin lactosa",
    "originalName": "Queso fresco sin lactosa",
    "kcal": 92,
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
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Queso fresco batido desnatado",
    "originalName": "Queso fresco batido / desnatado",
    "kcal": 77.8,
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
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Queso manchego curado",
    "originalName": "Queso manchego curado",
    "kcal": 401.4,
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
      "quesos",
      "quesos_curados"
    ]
  },
  {
    "name": "Queso parmesano",
    "originalName": "Queso parmesano",
    "kcal": 429.4,
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
      "quesos",
      "quesos_curados"
    ]
  },
  {
    "name": "Requesón",
    "originalName": "Requesón",
    "kcal": 96.3,
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
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Seitán",
    "originalName": "seitán",
    "kcal": 131.1,
    "cho": 3.8,
    "pro": 24.7,
    "fat": 1.9,
    "tags": [
      "gluten",
      "proteina_vegetal"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Skyr natural",
    "originalName": "Skyr natural (Arla/Mercadona)",
    "kcal": 61.8,
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
    "name": "Tofu",
    "originalName": "Tofu firme",
    "kcal": 119.4,
    "cho": 2.1,
    "pro": 12,
    "fat": 7,
    "tags": [
      "soja",
      "proteina_vegetal"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Heura",
    "originalName": "Bocados de Heura",
    "kcal": 109.5,
    "cho": 1.8,
    "pro": 18.6,
    "fat": 3.1,
    "tags": [
      "soja",
      "proteina_vegetal"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Tempeh",
    "originalName": "Tempeh de soja",
    "kcal": 203.6,
    "cho": 7.6,
    "pro": 19,
    "fat": 10.8,
    "tags": [
      "soja",
      "proteina_vegetal"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Burger vegana",
    "originalName": "Hamburguesa vegana",
    "kcal": 183.8,
    "cho": 4.2,
    "pro": 17,
    "fat": 11,
    "tags": [
      "soja",
      "proteina_vegetal"
    ],
    "minGrams": 100,
    "maxGrams": 300,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Yogur griego natural",
    "originalName": "Yogur griego natural ",
    "kcal": 95.4,
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
    "kcal": 59,
    "cho": 3.96,
    "pro": 9.9,
    "fat": 0.4,
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
    "originalName": "Yogur proteico natural (Hacendado/Mercadona)",
    "kcal": 57.4,
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
    "name": "Yogur proteico sabor chocolate",
    "originalName": "Yogur High Protein sabor chocolate (Danone)",
    "kcal": 85.5,
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
    "kcal": 62.5,
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
    "kcal": 93.2,
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
    "kcal": 37.9,
    "cho": 5.17,
    "pro": 3.85,
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
    "name": "Yogur natural sin lactosa",
    "originalName": "Yogur natural sin lactosa",
    "kcal": 62.5,
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
    "name": "Yogur proteico sabor vainilla",
    "originalName": "Yogur proteico sabor vainilla (Hacendado/Mercadona)",
    "kcal": 63.8,
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
    "name": "Yogur proteico sin lactosa",
    "originalName": "Yogur sin lactosa Proteína natural (Kaiku)",
    "kcal": 69.5,
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
    "kcal": 339.2,
    "cho": 60,
    "pro": 23,
    "fat": 0.8,
    "tags": [
      "alto_fodmap",
      "alto_fibra"
    ],
    "minGrams": 100,
    "maxGrams": 300,
    "treePath": [
      "hidratos",
      "legumbres"
    ]
  },
  {
    "name": "Garbanzos",
    "originalName": "Garbanzo seca",
    "kcal": 374,
    "cho": 61,
    "pro": 19,
    "fat": 6,
    "tags": [
      "alto_fodmap",
      "legumbres",
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 180,
    "treePath": [
      "hidratos",
      "legumbres"
    ]
  },
  {
    "name": "Lentejas",
    "originalName": "Lentejas",
    "kcal": 349.9,
    "cho": 60,
    "pro": 25,
    "fat": 1.1,
    "tags": [
      "alto_fodmap",
      "legumbres",
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 180,
    "treePath": [
      "hidratos",
      "legumbres"
    ]
  },
  {
    "name": "Soja texturizada",
    "originalName": "Soja texturizada seca",
    "kcal": 334.8,
    "cho": 31,
    "pro": 50,
    "fat": 1.2,
    "tags": [
      "soja",
      "alto_fodmap",
      "proteina_vegetal"
    ],
    "minGrams": 30,
    "maxGrams": 100,
    "treePath": [
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Agua de coco",
    "originalName": "Agua de coco",
    "kcal": 19.4,
    "cho": 3.7,
    "pro": 0.7,
    "fat": 0.2,
    "tags": [],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "suplementos",
      "bebidas"
    ]
  },
  {
    name: 'Café solo',
    originalName: 'Café solo',
    kcal: 0.4,
    cho: 0,
    pro: 0.1,
    fat: 0,
    tags: [],
    minGrams: 30,
    maxGrams: 250,
    treePath: ['suplementos', 'bebidas'],
  },
  {
    name: 'Café con leche',
    originalName: 'Café con leche',
    kcal: 43.9,
    cho: 4.5,
    pro: 3.1,
    fat: 1.5,
    tags: ['lactosa', 'proteina_vaca'],
    minGrams: 100,
    maxGrams: 300,
    treePath: ['suplementos', 'bebidas'],
  },
  {
    "name": "Barrita energética avena y fruta",
    "originalName": "Barrita energética avena y fruta",
    "kcal": 196,
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
    "kcal": 88.5,
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
    "kcal": 88.5,
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
    "kcal": 0.4,
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
    "kcal": 227.9,
    "cho": 0,
    "pro": 17.6,
    "fat": 17.5,
    "tags": [
      "carne_roja",
      "cerdo"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carnes_otras"
    ]
  },
  {
    "name": "Caseína micelar nocturna 30g",
    "originalName": "Caseína micelar nocturna 30g",
    "kcal": 110.5,
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
    "kcal": 598.2,
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
    "name": "Cacao (puro y en untable / Colacao)",
    "originalName": "Colacao",
    "kcal": 360.9,
    "cho": 78,
    "pro": 6.6,
    "fat": 2.5,
    "tags": [],
    "minGrams": 15,
    "maxGrams": 30,
    "defaultGrams": 20,
    "treePath": [
      "suplementos",
      "dulces_otros"
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
    "kcal": 236,
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
    "kcal": 41.8,
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
    "kcal": 204,
    "cho": 25,
    "pro": 3.5,
    "fat": 10,
    "tags": [
      "proteina_vaca",
      "fructosa",
      "lactosa"
    ],
    "minGrams": 30,
    "maxGrams": 150,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Mejillon en conserva (escabeche)",
    "originalName": "mejillon en conserva (escabeche)",
    "kcal": 162,
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
    "kcal": 330.8,
    "cho": 82.4,
    "pro": 0.3,
    "fat": 0,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 15,
    "maxGrams": 40,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Mostaza de Dijon",
    "originalName": "Mostaza de Dijon",
    "kcal": 67.3,
    "cho": 5,
    "pro": 4.4,
    "fat": 3.3,
    "tags": [],
    "minGrams": 10,
    "maxGrams": 15,
    "treePath": [
      "complementos",
      "salsas"
    ]
  },
  {
    "name": "Mozzarella fresca",
    "originalName": "Mozzarella fresca",
    "kcal": 278.8,
    "cho": 2.2,
    "pro": 18,
    "fat": 22,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ],
    "minGrams": 30,
    "maxGrams": 125,
    "treePath": [
      "lacteos",
      "quesos",
      "quesos_frescos"
    ]
  },
  {
    "name": "Pesto",
    "originalName": "Pesto",
    "kcal": 452,
    "cho": 5,
    "pro": 4.5,
    "fat": 46,
    "tags": [
      "proteina_vaca",
      "lactosa",
      "fruto_seco",
      "alto_fodmap"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "treePath": [
      "complementos",
      "salsas"
    ]
  },
  {
    "name": "Piñones",
    "originalName": "Piñones",
    "kcal": 722.8,
    "cho": 13.1,
    "pro": 13.7,
    "fat": 68.4,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 35,
    "treePath": [
      "grasas",
      "frutos_secos",
      "semillas"
    ]
  },
  {
    "name": "Pipas de girasol",
    "originalName": "Pipas de girasol",
    "kcal": 626.7,
    "cho": 20,
    "pro": 20.8,
    "fat": 51.5,
    "tags": [],
    "minGrams": 15,
    "maxGrams": 40,
    "treePath": [
      "grasas",
      "frutos_secos",
      "semillas"
    ]
  },
  {
    "name": "Salmorejo",
    "originalName": "Salmorejo",
    "kcal": 94,
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
    "kcal": 104,
    "cho": 6,
    "pro": 6.5,
    "fat": 6,
    "tags": [
      "carne_roja",
      "cerdo",
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 120,
    "treePath": [
      "complementos",
      "salsas"
    ]
  },
  {
    "name": "Salsa de soja",
    "originalName": "Salsa de soja",
    "kcal": 52.5,
    "cho": 4.9,
    "pro": 8,
    "fat": 0.1,
    "tags": [
      "soja",
      "gluten"
    ],
    "minGrams": 10,
    "maxGrams": 15,
    "treePath": [
      "complementos",
      "salsas"
    ]
  },
  {
    "name": "Salsa de soja sin azúcar",
    "originalName": "salsa de soja sin azúcar",
    "kcal": 57.4,
    "cho": 4.9,
    "pro": 8.1,
    "fat": 0.6,
    "tags": [
      "soja"
    ],
    "minGrams": 10,
    "maxGrams": 15,
    "treePath": [
      "complementos",
      "salsas"
    ]
  },
  {
    "name": "Secreto de cerdo",
    "originalName": "Secreto de cerdo",
    "kcal": 198.2,
    "cho": 0,
    "pro": 18.5,
    "fat": 13.8,
    "tags": [
      "cerdo"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "treePath": [
      "proteina",
      "carne",
      "cerdo"
    ]
  },
  {
    "name": "Semillas de calabaza (pipas)",
    "originalName": "Semillas de calabaza (pipas)",
    "kcal": 605.5,
    "cho": 10.7,
    "pro": 30.2,
    "fat": 49.1,
    "tags": [],
    "minGrams": 15,
    "maxGrams": 40,
    "treePath": [
      "grasas",
      "frutos_secos",
      "semillas"
    ]
  },
  {
    "name": "Semillas de chía",
    "originalName": "Semillas de chía",
    "kcal": 510.7,
    "cho": 42.1,
    "pro": 16.5,
    "fat": 30.7,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos",
      "semillas"
    ]
  },
  {
    "name": "Semillas de lino (linaza)",
    "originalName": "Semillas de lino (linaza)",
    "kcal": 568.6,
    "cho": 28.9,
    "pro": 18.3,
    "fat": 42.2,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos",
      "semillas"
    ]
  },
  {
    "name": "Sésamo",
    "originalName": "Sésamo",
    "kcal": 611.7,
    "cho": 23.4,
    "pro": 17.7,
    "fat": 49.7,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 25,
    "treePath": [
      "grasas",
      "frutos_secos",
      "semillas"
    ]
  },
  {
    "name": "Té verde (infusión)",
    "originalName": "Té verde (infusión)",
    "kcal": 0.8,
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
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Atún natural",
    "originalName": "Atún natural conserva lata",
    "kcal": 113,
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
    "kcal": 219.9,
    "cho": 0,
    "pro": 27.3,
    "fat": 12.3,
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
    "kcal": 101.2,
    "cho": 0,
    "pro": 23.5,
    "fat": 0.8,
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
    "kcal": 74.4,
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
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Bacalao desalado",
    "originalName": "bacalao desalado",
    "kcal": 78.3,
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
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Bacalao fresco",
    "originalName": "Bacalao fresco",
    "kcal": 74.4,
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
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Berberecho conserva",
    "originalName": "berberecho conserva",
    "kcal": 75.4,
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
    "kcal": 83.8,
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
    "kcal": 199.5,
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
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Caballa en conserva (al natural)",
    "originalName": "caballa en conserva (al natural)",
    "kcal": 163.5,
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
    "kcal": 80,
    "cho": 1.3,
    "pro": 16,
    "fat": 1.2,
    "tags": [
      "pescado",
      "marisco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Corvina",
    "originalName": "Corvina crudo",
    "kcal": 99.4,
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
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Dorada",
    "originalName": "Dorada",
    "kcal": 116,
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
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Emperador",
    "originalName": "Emperador (pez espada) crudo",
    "kcal": 115.2,
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
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Gambas",
    "originalName": "Gamba cruda",
    "kcal": 99.5,
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
    "kcal": 80.1,
    "cho": 0,
    "pro": 17.1,
    "fat": 1.3,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Lubina",
    "originalName": "Lubina",
    "kcal": 83.5,
    "cho": 0,
    "pro": 18.4,
    "fat": 1.1,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Mejillones frescos",
    "originalName": "Mejillon fresco",
    "kcal": 82.6,
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
    "kcal": 73.1,
    "cho": 0,
    "pro": 16.7,
    "fat": 0.7,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Rape",
    "originalName": "Rape crudo",
    "kcal": 68.4,
    "cho": 0,
    "pro": 15.3,
    "fat": 0.8,
    "tags": [
      "pescado",
      "pescado_blanco"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Pulpo",
    "originalName": "Pulpo crudo",
    "kcal": 77.4,
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
    "kcal": 91,
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
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Salmón",
    "originalName": "Salmón crudo",
    "kcal": 190.1,
    "cho": 0,
    "pro": 20.3,
    "fat": 12.1,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Salmón conserva aceite",
    "originalName": "Salmón conserva aceite",
    "kcal": 306.3,
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
    "kcal": 222.5,
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
    "kcal": 182.5,
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
    "kcal": 197,
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
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Sardinas",
    "originalName": "Sardina crudo",
    "kcal": 139.9,
    "cho": 0,
    "pro": 18.1,
    "fat": 7.5,
    "tags": [
      "pescado",
      "pescado_azul"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Sardina conserva aceite",
    "originalName": "Sardina conserva aceite",
    "kcal": 293.1,
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
    "kcal": 75.3,
    "cho": 0.7,
    "pro": 16.1,
    "fat": 0.9,
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
    "kcal": 23.8,
    "cho": 3.7,
    "pro": 1.8,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.ABRIL, MES.SEPTIEMBRE, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Ajo",
    "originalName": "Ajo ",
    "kcal": 162.1,
    "cho": 33,
    "pro": 6.4,
    "fat": 0.5,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 5,
    "maxGrams": 10,
    "treePath": [
      "complementos",
      "condimentos"
    ]
  },
  {
    "name": "Alcachofa",
    "originalName": "alcachofa",
    "kcal": 42.6,
    "cho": 7.8,
    "pro": 2.4,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.ABRIL, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Berenjena",
    "originalName": "Berenjena cruda",
    "kcal": 29.4,
    "cho": 5.9,
    "pro": 1,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Brócoli",
    "originalName": "Brócoli crudo",
    "kcal": 41.2,
    "cho": 6.6,
    "pro": 2.8,
    "fat": 0.4,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Calabacín",
    "originalName": "Calabacín crudo",
    "kcal": 19.9,
    "cho": 3.1,
    "pro": 1.2,
    "fat": 0.3,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.MAYO, MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Cebolla",
    "originalName": "Cebolla cruda",
    "kcal": 42.5,
    "cho": 9.3,
    "pro": 1.1,
    "fat": 0.1,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Champiñón",
    "originalName": "Champiñón crudo",
    "kcal": 28.3,
    "cho": 3.3,
    "pro": 3.1,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": TODO_EL_AÑO,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Coliflor",
    "originalName": "Coliflor cruda",
    "kcal": 30.3,
    "cho": 5,
    "pro": 1.9,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Espárragos blancos conserva",
    "originalName": "espárragos blancos conserva",
    "kcal": 19,
    "cho": 2.5,
    "pro": 1.8,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": TODO_EL_AÑO,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Espárragos verdes",
    "originalName": "espárragos verdes",
    "kcal": 19.4,
    "cho": 1.8,
    "pro": 2.6,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.MARZO, MES.ABRIL, MES.MAYO],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Guisantes",
    "originalName": "Guisantes crudos",
    "kcal": 83.2,
    "cho": 14.5,
    "pro": 5.4,
    "fat": 0.4,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.MARZO, MES.ABRIL, MES.MAYO],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Puerro",
    "originalName": "Puerro crudo",
    "kcal": 31.5,
    "cho": 5.7,
    "pro": 1.5,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Espinaca",
    "originalName": "Espinaca cruda",
    "kcal": 29.6,
    "cho": 3.6,
    "pro": 2.9,
    "fat": 0.4,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.ABRIL, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Hamburguesa de espinacas",
    "originalName": "Hamburguesa de espinacas crudo",
    "kcal": 117.5,
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
      "proteina",
      "vegetal_proteina"
    ]
  },
  {
    "name": "Judías verdes",
    "kcal": 24.9,
    "cho": 4.2,
    "pro": 1.8,
    "fat": 0.1,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.MAYO, MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Lechuga romana",
    "originalName": "Lechuga romana cruda",
    "kcal": 20.7,
    "cho": 3.3,
    "pro": 1.2,
    "fat": 0.3,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "temporada": [MES.ABRIL, MES.MAYO, MES.JUNIO],
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Pepino",
    "originalName": "Pepino",
    "kcal": 18.1,
    "cho": 3.6,
    "pro": 0.7,
    "fat": 0.1,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.MAYO, MES.JUNIO, MES.JULIO, MES.AGOSTO],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Pimiento",
    "originalName": "Pimiento cruda",
    "kcal": 30.7,
    "cho": 6,
    "pro": 1,
    "fat": 0.3,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Remolacha",
    "originalName": "Remolacha cruda",
    "kcal": 46.6,
    "cho": 9.6,
    "pro": 1.6,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE, MES.OCTUBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Rúcula",
    "originalName": "Rúcula cruda",
    "kcal": 31.5,
    "cho": 3.7,
    "pro": 2.6,
    "fat": 0.7,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.MARZO, MES.ABRIL, MES.MAYO, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Tomate",
    "originalName": "Tomate crudo",
    "kcal": 21,
    "cho": 3.9,
    "pro": 0.9,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Tomate frito",
    "originalName": "Tomate frito",
    "kcal": 81.9,
    "cho": 11,
    "pro": 1.6,
    "fat": 3.5,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": TODO_EL_AÑO,
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Zanahoria",
    "originalName": "Zanahoria cruda",
    "kcal": 43.8,
    "cho": 9.6,
    "pro": 0.9,
    "fat": 0.2,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Batido de proteína vegetal 30g",
    "originalName": "Batido de proteína vegetal 30g",
    "kcal": 90.5,
    "cho": 1.5,
    "pro": 20,
    "fat": 0.5,
    "tags": [
      "sin_lactosa_especial",
      "vegetal"
    ],
    "minGrams": 25,
    "maxGrams": 40,
    "treePath": [
      "suplementos",
      "proteina_polvo"
    ]
  },
  {
    "name": "Pancakes proteicos",
    "originalName": "Pancakes proteicos de avena, claras y proteína de suero",
    "kcal": 212,
    "cho": 24,
    "pro": 20,
    "fat": 4,
    "tags": [
      "gluten",
      "huevo",
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 80,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "preparados_desayuno"
    ]
  },
  {
    "name": "Pancakes proteicos sin gluten",
    "originalName": "Pancakes proteicos de avena sin gluten, claras y proteína de suero sin lactosa",
    "kcal": 212,
    "cho": 24,
    "pro": 20,
    "fat": 4,
    "tags": [
      "sin_gluten_especial",
      "huevo",
      "proteina_vaca"
    ],
    "minGrams": 80,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "preparados_desayuno"
    ]
  },
  {
    "name": "Crepes de avena",
    "originalName": "Crepes de harina de avena, huevo y leche",
    "kcal": 186,
    "cho": 24,
    "pro": 9,
    "fat": 6,
    "tags": [
      "gluten",
      "huevo",
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 60,
    "maxGrams": 180,
    "treePath": [
      "hidratos",
      "preparados_desayuno"
    ]
  },
  {
    "name": "Solomillos de pollo",
    "originalName": "Solomillos de pollo",
    "kcal": 107.5,
    "cho": 0,
    "pro": 23.5,
    "fat": 1.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pollo"
    ]
  },
  {
    "name": "Boloñesa de pollo",
    "originalName": "Boloñesa de pollo",
    "kcal": 126.5,
    "cho": 3.5,
    "pro": 18,
    "fat": 4.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pollo"
    ]
  },
  {
    "name": "Pavo al horno",
    "originalName": "Pavo al horno",
    "kcal": 132.5,
    "cho": 0,
    "pro": 23,
    "fat": 4.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pavo"
    ]
  },
  {
    "name": "Albóndigas de pavo",
    "originalName": "Albóndigas de pavo",
    "kcal": 141.5,
    "cho": 3,
    "pro": 20,
    "fat": 5.5,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "pavo"
    ]
  },
  {
    "name": "Lomo de cerdo",
    "originalName": "Lomo de cerdo",
    "kcal": 133.2,
    "cho": 0,
    "pro": 22.5,
    "fat": 4.8,
    "tags": [
      "cerdo"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "cerdo"
    ]
  },
  {
    "name": "Burger de ternera",
    "originalName": "Burger de ternera",
    "kcal": 147.2,
    "cho": 1,
    "pro": 20.5,
    "fat": 6.8,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Filete de ternera",
    "originalName": "Filete de ternera",
    "kcal": 117.9,
    "cho": 0,
    "pro": 22.5,
    "fat": 3.1,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Boloñesa de ternera",
    "originalName": "Boloñesa de ternera",
    "kcal": 149.5,
    "cho": 3.5,
    "pro": 17,
    "fat": 7.5,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Hamburguesa de potro",
    "originalName": "Hamburguesa de potro",
    "kcal": 124,
    "cho": 0.5,
    "pro": 21.5,
    "fat": 4,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Cordero (parte más magra)",
    "originalName": "Cordero (parte más magra)",
    "kcal": 154.2,
    "cho": 0,
    "pro": 21,
    "fat": 7.8,
    "tags": [
      "carne_roja"
    ],
    "minGrams": 100,
    "maxGrams": 300,
    "treePath": [
      "proteina",
      "carne",
      "vacuno"
    ]
  },
  {
    "name": "Atún rojo",
    "originalName": "Atún rojo",
    "kcal": 137.3,
    "cho": 0,
    "pro": 23.3,
    "fat": 4.9,
    "tags": [
      "pescado"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Atún de aleta amarilla",
    "originalName": "Atún de aleta amarilla",
    "kcal": 125,
    "cho": 0,
    "pro": 24.5,
    "fat": 3,
    "tags": [
      "pescado"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Trucha",
    "originalName": "Trucha",
    "kcal": 113.5,
    "cho": 0,
    "pro": 20.5,
    "fat": 3.5,
    "tags": [
      "pescado"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_azul"
    ]
  },
  {
    "name": "Gallineta",
    "originalName": "Gallineta",
    "kcal": 87.5,
    "cho": 0,
    "pro": 18.5,
    "fat": 1.5,
    "tags": [
      "pescado"
    ],
    "minGrams": 100,
    "maxGrams": 350,
    "treePath": [
      "proteina",
      "pescado",
      "pescado_blanco"
    ]
  },
  {
    "name": "Presa ibérica",
    "originalName": "Presa ibérica",
    "kcal": 160.5,
    "cho": 0,
    "pro": 21,
    "fat": 8.5,
    "tags": [
      "cerdo"
    ],
    "minGrams": 100,
    "maxGrams": 250,
    "treePath": [
      "proteina",
      "carne",
      "cerdo"
    ]
  },
  {
    "name": "Solomillo ibérico",
    "originalName": "Solomillo ibérico",
    "kcal": 142,
    "cho": 0,
    "pro": 22,
    "fat": 6,
    "tags": [
      "cerdo"
    ],
    "minGrams": 100,
    "maxGrams": 250,
    "treePath": [
      "proteina",
      "carne",
      "cerdo"
    ]
  },
  {
    "name": "Pan",
    "originalName": "Pan",
    "kcal": 255.5,
    "cho": 52,
    "pro": 8.5,
    "fat": 1.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 40,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Gajos de patata",
    "originalName": "Gajos de patata",
    "kcal": 78.9,
    "cho": 17.5,
    "pro": 2,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 450,
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Gajos de boniato",
    "originalName": "Gajos de boniato",
    "kcal": 87.7,
    "cho": 20.1,
    "pro": 1.6,
    "fat": 0.1,
    "tags": [],
    "minGrams": 100,
    "maxGrams": 450,
    "temporada": [MES.OCTUBRE, MES.NOVIEMBRE],
    "treePath": [
      "hidratos",
      "tuberculos"
    ]
  },
  {
    "name": "Macarrones integrales",
    "originalName": "Macarrones integrales",
    "kcal": 333.8,
    "cho": 65,
    "pro": 13.5,
    "fat": 2.2,
    "tags": [
      "gluten",
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Fusilli",
    "originalName": "Fusilli",
    "kcal": 365.5,
    "cho": 75,
    "pro": 13,
    "fat": 1.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Espaguetis integrales",
    "originalName": "Espaguetis integrales",
    "kcal": 333.8,
    "cho": 65,
    "pro": 13.5,
    "fat": 2.2,
    "tags": [
      "gluten",
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Espirales de lentejas",
    "originalName": "Espirales de lentejas",
    "kcal": 317.5,
    "cho": 50,
    "pro": 26,
    "fat": 1.5,
    "tags": [
      "sin_gluten_especial",
      "alto_fibra"
    ],
    "minGrams": 50,
    "maxGrams": 200,
    "treePath": [
      "hidratos",
      "pasta"
    ]
  },
  {
    "name": "Leche desnatada sin lactosa",
    "originalName": "Leche desnatada sin lactosa",
    "kcal": 34.1,
    "cho": 4.9,
    "pro": 3.4,
    "fat": 0.1,
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
    "name": "Almendras laminadas tostadas",
    "originalName": "Almendras laminadas tostadas",
    "kcal": 620.3,
    "cho": 21.6,
    "pro": 21.2,
    "fat": 49.9,
    "tags": [
      "fruto_seco"
    ],
    "minGrams": 15,
    "maxGrams": 35,
    "treePath": [
      "grasas",
      "frutos_secos"
    ]
  },
  {
    "name": "Pasta de aguacate",
    "originalName": "Pasta de aguacate",
    "kcal": 137.6,
    "cho": 5.9,
    "pro": 1.5,
    "fat": 12,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 30,
    "maxGrams": 100,
    "treePath": [
      "grasas",
      "aguacate"
    ]
  },
  {
    "name": "Tomate natural rallado",
    "originalName": "Tomate natural rallado",
    "kcal": 21,
    "cho": 3.9,
    "pro": 0.9,
    "fat": 0.2,
    "tags": [],
    "minGrams": 40,
    "maxGrams": 150,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Pimiento rojo",
    "originalName": "Pimiento rojo",
    "kcal": 30.7,
    "cho": 6,
    "pro": 1,
    "fat": 0.3,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 150,
    "temporada": [MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Zarangollo",
    "originalName": "Zarangollo",
    "kcal": 24.5,
    "cho": 3.5,
    "pro": 1.5,
    "fat": 0.5,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 200,
    "temporada": [MES.MAYO, MES.JUNIO, MES.JULIO, MES.AGOSTO, MES.SEPTIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Col",
    "originalName": "Col repollo cruda",
    "kcal": 29.3,
    "cho": 5.8,
    "pro": 1.3,
    "fat": 0.1,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Apio",
    "originalName": "Apio crudo",
    "kcal": 16.6,
    "cho": 3,
    "pro": 0.7,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Nabo",
    "originalName": "Nabo crudo",
    "kcal": 30.1,
    "cho": 6.4,
    "pro": 0.9,
    "fat": 0.1,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Calabaza",
    "originalName": "Calabaza cruda",
    "kcal": 30.9,
    "cho": 6.5,
    "pro": 1,
    "fat": 0.1,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ENERO, MES.SEPTIEMBRE, MES.OCTUBRE, MES.NOVIEMBRE, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Escarola",
    "originalName": "Escarola cruda",
    "kcal": 20.6,
    "cho": 3.4,
    "pro": 1.3,
    "fat": 0.2,
    "tags": [],
    "minGrams": 50,
    "maxGrams": 200,
    "temporada": [MES.ENERO, MES.FEBRERO, MES.DICIEMBRE],
    "treePath": [
      "verduras",
      "hojas_verdes"
    ]
  },
  {
    "name": "Habas",
    "originalName": "Habas tiernas crudas",
    "kcal": 74.6,
    "cho": 11.7,
    "pro": 5.6,
    "fat": 0.6,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.MARZO, MES.ABRIL, MES.MAYO],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Cebolleta",
    "originalName": "Cebolleta cruda",
    "kcal": 38.2,
    "cho": 7.3,
    "pro": 1.8,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ABRIL, MES.MAYO],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Rábano",
    "originalName": "Rábano crudo",
    "kcal": 17.3,
    "cho": 3.4,
    "pro": 0.7,
    "fat": 0.1,
    "tags": [],
    "minGrams": 80,
    "maxGrams": 250,
    "temporada": [MES.ABRIL],
    "treePath": [
      "verduras",
      "hortalizas"
    ]
  },
  {
    "name": "Infusiones",
    "originalName": "Infusiones",
    "kcal": 0.8,
    "cho": 0.2,
    "pro": 0,
    "fat": 0,
    "tags": [],
    "minGrams": 150,
    "maxGrams": 300,
    "treePath": [
      "suplementos",
      "bebidas"
    ]
  },
  {
    "name": "Miel de Manuka",
    "originalName": "Miel de Manuka",
    "kcal": 329.2,
    "cho": 82,
    "pro": 0.3,
    "fat": 0,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ],
    "minGrams": 15,
    "maxGrams": 40,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Bebida de coco",
    "originalName": "Bebida de coco",
    "kcal": 20.2,
    "cho": 2.7,
    "pro": 0.1,
    "fat": 1,
    "tags": [
      "sin_lactosa_especial",
      "vegetal"
    ],
    "minGrams": 150,
    "maxGrams": 350,
    "treePath": [
      "lacteos",
      "leches",
      "bebidas_vegetales"
    ]
  },
  {
    "name": "Yogur de coco",
    "originalName": "Yogur de coco",
    "kcal": 70.5,
    "cho": 7,
    "pro": 0.5,
    "fat": 4.5,
    "tags": [
      "sin_lactosa_especial",
      "vegetal"
    ],
    "minGrams": 120,
    "maxGrams": 250,
    "treePath": [
      "lacteos",
      "yogures",
      "yogures_vegetales"
    ]
  },
  {
    "name": "Pan de molde de avena",
    "originalName": "Pan de molde de avena",
    "kcal": 257,
    "cho": 43,
    "pro": 10,
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
    "name": "Focaccia",
    "originalName": "Focaccia",
    "kcal": 293,
    "cho": 45,
    "pro": 8,
    "fat": 9,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 100,
    "treePath": [
      "hidratos",
      "panes"
    ]
  },
  {
    "name": "Cereales de chocolate de arroz",
    "originalName": "Cereales de chocolate de arroz",
    "kcal": 378.5,
    "cho": 84,
    "pro": 5,
    "fat": 2.5,
    "tags": [
      "gluten"
    ],
    "minGrams": 30,
    "maxGrams": 80,
    "treePath": [
      "hidratos",
      "cereales"
    ]
  },
  {
    "name": "Queso edam en lonchas",
    "originalName": "Queso edam en lonchas",
    "kcal": 357.6,
    "cho": 1.4,
    "pro": 25,
    "fat": 28,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ],
    "minGrams": 20,
    "maxGrams": 60,
    "treePath": [
      "lacteos",
      "quesos",
      "quesos_curados"
    ]
  },
  {
    "name": "Mermelada",
    "originalName": "Mermelada",
    "kcal": 250.5,
    "cho": 62,
    "pro": 0.4,
    "fat": 0.1,
    "tags": [
      "fructosa"
    ],
    "minGrams": 15,
    "maxGrams": 40,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Panela",
    "originalName": "Panela",
    "kcal": 382.5,
    "cho": 95,
    "pro": 0.4,
    "fat": 0.1,
    "tags": [],
    "minGrams": 5,
    "maxGrams": 20,
    "treePath": [
      "suplementos",
      "otros"
    ]
  },
  {
    "name": "Browniato",
    "originalName": "Browniato",
    "kcal": 229.5,
    "cho": 30,
    "pro": 6,
    "fat": 9.5,
    "tags": [
      "huevo",
      "gluten"
    ],
    "minGrams": 40,
    "maxGrams": 100,
    "treePath": [
      "suplementos",
      "dulces_otros"
    ]
  },
  {
    "name": "Nutable",
    "originalName": "Nutable",
    "kcal": 549,
    "cho": 35,
    "pro": 10,
    "fat": 41,
    "tags": [
      "fruto_seco",
      "fructosa"
    ],
    "minGrams": 15,
    "maxGrams": 30,
    "treePath": [
      "suplementos",
      "dulces_otros"
    ]
  },
  {
    "name": "Canela",
    "originalName": "Canela",
    "kcal": 246.8,
    "cho": 55,
    "pro": 4,
    "fat": 1.2,
    "tags": [],
    "minGrams": 2,
    "maxGrams": 5,
    "treePath": [
      "complementos",
      "condimentos"
    ]
  },
  {
    "name": "Harina de arroz",
    "originalName": "Harina de arroz",
    "kcal": 356.6,
    "cho": 80,
    "pro": 6,
    "fat": 1.4,
    "tags": [],
    "minGrams": 30,
    "maxGrams": 100,
    "treePath": [
      "hidratos",
      "cereales",
      "harinas"
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
