/**
 * Catálogo Oficial de Alimentos Limpios en Crudo para Nutralab
 * Fuente base: data/foods.js (filtrado sin cocinados, procesados ni alcohol)
 * Nombres naturales en español para integración con IA y cálculo exacto.
 * Cada alimento incluye sus etiquetas dietéticas y clínicas ('tags') para filtrado determinista.
 * Valores por 100g de alimento en crudo o ración indicada.
 */

export const FOODS_CRUDO = [
  {
    "name": "Alitas de pollo",
    "originalName": "Alitas de pollo ",
    "category": "carnes_y_aves",
    "kcal": 203,
    "cho": 0,
    "pro": 18.3,
    "fat": 15,
    "tags": []
  },
  {
    "name": "Carne picada de pavo",
    "originalName": "Carne picada de pavo",
    "category": "carnes_y_aves",
    "kcal": 115,
    "cho": 0,
    "pro": 22,
    "fat": 3,
    "tags": []
  },
  {
    "name": "Carne picada de pollo",
    "originalName": "Carne picada de pollo",
    "category": "carnes_y_aves",
    "kcal": 142,
    "cho": 0,
    "pro": 20.5,
    "fat": 6.5,
    "tags": []
  },
  {
    "name": "Carne picada de ternera",
    "originalName": "Carne picada de ternera",
    "category": "carnes_y_aves",
    "kcal": 187,
    "cho": 0,
    "pro": 19.7,
    "fat": 12,
    "tags": [
      "carne_roja"
    ]
  },
  {
    "name": "Chuletas de pavo",
    "originalName": "chuletas de pavo",
    "category": "carnes_y_aves",
    "kcal": 118,
    "cho": 0,
    "pro": 22.5,
    "fat": 2.8,
    "tags": []
  },
  {
    "name": "Chuletón de ternera",
    "originalName": "Chuletón de ternera crudo",
    "category": "carnes_y_aves",
    "kcal": 250,
    "cho": 0,
    "pro": 20,
    "fat": 19,
    "tags": [
      "carne_roja"
    ]
  },
  {
    "name": "Conejo",
    "originalName": "Conejo",
    "category": "carnes_y_aves",
    "kcal": 131,
    "cho": 0,
    "pro": 21.8,
    "fat": 4.5,
    "tags": []
  },
  {
    "name": "Contramuslo de pollo deshuesado",
    "originalName": "Contramuslo de pollo deshuesado",
    "category": "carnes_y_aves",
    "kcal": 160,
    "cho": 0,
    "pro": 20,
    "fat": 9,
    "tags": []
  },
  {
    "name": "Entrecot de ternera",
    "originalName": "Ternera entrecot",
    "category": "carnes_y_aves",
    "kcal": 220,
    "cho": 0,
    "pro": 20.6,
    "fat": 15.6,
    "tags": [
      "carne_roja"
    ]
  },
  {
    "name": "Hamburguesa de cerdo",
    "originalName": "Hamburguesa de cerdo crudo",
    "category": "carnes_y_aves",
    "kcal": 210,
    "cho": 1,
    "pro": 17,
    "fat": 15.5,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Hamburguesa de pavo",
    "originalName": "Hamburguesa de pavo crudo",
    "category": "carnes_y_aves",
    "kcal": 135,
    "cho": 1,
    "pro": 18,
    "fat": 6.5,
    "tags": []
  },
  {
    "name": "Hamburguesa de pollo",
    "originalName": "Hamburguesa de pollo crudo",
    "category": "carnes_y_aves",
    "kcal": 143,
    "cho": 1,
    "pro": 17,
    "fat": 8,
    "tags": []
  },
  {
    "name": "Hamburguesa de ternera",
    "originalName": "Hamburguesa de ternera crudo",
    "category": "carnes_y_aves",
    "kcal": 215,
    "cho": 1,
    "pro": 18,
    "fat": 15,
    "tags": [
      "carne_roja"
    ]
  },
  {
    "name": "Hamburguesa de ternera magra",
    "originalName": "Hamburguesa de ternera magra",
    "category": "carnes_y_aves",
    "kcal": 165,
    "cho": 1,
    "pro": 20,
    "fat": 9,
    "tags": [
      "carne_roja"
    ]
  },
  {
    "name": "Jamón cocido",
    "originalName": "Jamón cocido lonchas",
    "category": "carnes_y_aves",
    "kcal": 145,
    "cho": 1,
    "pro": 20,
    "fat": 6,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Jamón cocido (York)",
    "originalName": "Jamón cocido (York)",
    "category": "carnes_y_aves",
    "kcal": 111,
    "cho": 1.4,
    "pro": 18,
    "fat": 3.5,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Jamón ibérico de bellota",
    "originalName": "Jamón ibérico de bellota",
    "category": "carnes_y_aves",
    "kcal": 260,
    "cho": 0.3,
    "pro": 33,
    "fat": 15,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Jamón serrano",
    "originalName": "Jamón serrano lonchas",
    "category": "carnes_y_aves",
    "kcal": 240,
    "cho": 0,
    "pro": 31,
    "fat": 12,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Jamón serrano curado",
    "originalName": "Jamón serrano curado",
    "category": "carnes_y_aves",
    "kcal": 241,
    "cho": 0.4,
    "pro": 31,
    "fat": 13.7,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Lomo embuchado",
    "originalName": "Lomo embuchado",
    "category": "carnes_y_aves",
    "kcal": 316,
    "cho": 0.5,
    "pro": 40,
    "fat": 17,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Morro de cerdo cocido",
    "originalName": "Morro de cerdo cocido",
    "category": "carnes_y_aves",
    "kcal": 175,
    "cho": 0,
    "pro": 15.5,
    "fat": 12.5,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Muslo de pollo",
    "originalName": "Muslo de pollo cruda",
    "category": "carnes_y_aves",
    "kcal": 177,
    "cho": 0,
    "pro": 18,
    "fat": 11,
    "tags": []
  },
  {
    "name": "Pechuga de pavo",
    "originalName": "Pechuga de pavo",
    "category": "carnes_y_aves",
    "kcal": 114,
    "cho": 0,
    "pro": 24,
    "fat": 1.5,
    "tags": []
  },
  {
    "name": "Pechuga de pollo",
    "originalName": "Pechuga de pollo",
    "category": "carnes_y_aves",
    "kcal": 120,
    "cho": 0,
    "pro": 22.5,
    "fat": 2.6,
    "tags": []
  },
  {
    "name": "Solomillo de cerdo",
    "originalName": "Solomillo de cerdo cruda",
    "category": "carnes_y_aves",
    "kcal": 143,
    "cho": 0,
    "pro": 21.5,
    "fat": 5.5,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Solomillo de ternera",
    "originalName": "Solomillo de ternera",
    "category": "carnes_y_aves",
    "kcal": 132,
    "cho": 0,
    "pro": 22.3,
    "fat": 4.6,
    "tags": [
      "carne_roja"
    ]
  },
  {
    "name": "Ternera magra",
    "originalName": "Ternera magra cruda",
    "category": "carnes_y_aves",
    "kcal": 137,
    "cho": 0,
    "pro": 21,
    "fat": 5,
    "tags": [
      "carne_roja"
    ]
  },
  {
    "name": "Arroz basmati",
    "originalName": "Arroz basmati",
    "category": "cereales_y_tuberculos",
    "kcal": 365,
    "cho": 78,
    "pro": 7.1,
    "fat": 0.6,
    "tags": []
  },
  {
    "name": "Arroz blanco",
    "originalName": "Arroz blanco crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 365,
    "cho": 78,
    "pro": 7.1,
    "fat": 0.6,
    "tags": []
  },
  {
    "name": "Arroz con leche",
    "category": "cereales_y_tuberculos",
    "kcal": 135,
    "cho": 22,
    "pro": 3.5,
    "fat": 2.8,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Arroz integral",
    "originalName": "Arroz integral crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 370,
    "cho": 77,
    "pro": 7.5,
    "fat": 2.7,
    "tags": []
  },
  {
    "name": "Arroz jazmín",
    "originalName": "Arroz jazmín",
    "category": "cereales_y_tuberculos",
    "kcal": 365,
    "cho": 78,
    "pro": 7.1,
    "fat": 0.6,
    "tags": []
  },
  {
    "name": "Boniato",
    "originalName": "Batata boniato crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 86,
    "cho": 20.1,
    "pro": 1.6,
    "fat": 0.1,
    "tags": []
  },
  {
    "name": "Bulgur",
    "originalName": "Bulgur crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 342,
    "cho": 75.9,
    "pro": 12.3,
    "fat": 1.3,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Copos de avena",
    "originalName": "Avena en copos crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 389,
    "cho": 66.3,
    "pro": 16.9,
    "fat": 6.9,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Copos de avena sin gluten",
    "originalName": "Copos de avena sin gluten",
    "category": "cereales_y_tuberculos",
    "kcal": 375,
    "cho": 59,
    "pro": 14,
    "fat": 7,
    "tags": [
      "sin_gluten_especial"
    ]
  },
  {
    "name": "Cuscús",
    "originalName": "Cuscús crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 376,
    "cho": 77.4,
    "pro": 12.8,
    "fat": 0.6,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Fideos de arroz",
    "originalName": "Fideos de arroz",
    "category": "cereales_y_tuberculos",
    "kcal": 364,
    "cho": 80,
    "pro": 7,
    "fat": 0.6,
    "tags": []
  },
  {
    "name": "Leche de avena",
    "originalName": "Leche de avena",
    "category": "cereales_y_tuberculos",
    "kcal": 47,
    "cho": 6.7,
    "pro": 1,
    "fat": 1.5,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Maíz dulce",
    "originalName": "Maíz dulce crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 86,
    "cho": 19,
    "pro": 3.2,
    "fat": 1.2,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Ñoquis de patata",
    "originalName": "Ñoquis de patata",
    "category": "cereales_y_tuberculos",
    "kcal": 150,
    "cho": 31,
    "pro": 3.5,
    "fat": 0.8,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan blanco de barra",
    "originalName": "Pan blanco de barra",
    "category": "cereales_y_tuberculos",
    "kcal": 265,
    "cho": 49,
    "pro": 9,
    "fat": 3.2,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan de centeno",
    "originalName": "Pan de centeno",
    "category": "cereales_y_tuberculos",
    "kcal": 258,
    "cho": 48,
    "pro": 8.5,
    "fat": 1.7,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan de hamburguesa",
    "originalName": "Pan de hamburguesa",
    "category": "cereales_y_tuberculos",
    "kcal": 280,
    "cho": 50,
    "pro": 9,
    "fat": 5,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan de molde blanco",
    "originalName": "Pan de molde blanco",
    "category": "cereales_y_tuberculos",
    "kcal": 264,
    "cho": 49,
    "pro": 8,
    "fat": 3.3,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan de molde integral",
    "originalName": "Pan de molde integral",
    "category": "cereales_y_tuberculos",
    "kcal": 250,
    "cho": 41,
    "pro": 9,
    "fat": 3.5,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan de pita",
    "originalName": "Pan de pita",
    "category": "cereales_y_tuberculos",
    "kcal": 275,
    "cho": 55,
    "pro": 9,
    "fat": 1.2,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan de semillas",
    "originalName": "Pan de semillas",
    "category": "cereales_y_tuberculos",
    "kcal": 280,
    "cho": 42,
    "pro": 10,
    "fat": 8,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan integral",
    "originalName": "Pan integral",
    "category": "cereales_y_tuberculos",
    "kcal": 247,
    "cho": 41,
    "pro": 9,
    "fat": 3.4,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pan sin gluten",
    "originalName": "Pan sin gluten",
    "category": "cereales_y_tuberculos",
    "kcal": 240,
    "cho": 46,
    "pro": 3.5,
    "fat": 3.2,
    "tags": [
      "sin_gluten_especial"
    ]
  },
  {
    "name": "Pasta de Dátil",
    "originalName": "Pasta de Dátil ",
    "category": "cereales_y_tuberculos",
    "kcal": 231.2,
    "cho": 63.75,
    "pro": 2.12,
    "fat": 0.34,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Pasta de lenteja roja",
    "originalName": "pasta de lenteja roja cruda",
    "category": "cereales_y_tuberculos",
    "kcal": 338,
    "cho": 49,
    "pro": 26,
    "fat": 2.5,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Pasta de trigo",
    "originalName": "Pasta de trigo crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 371,
    "cho": 75,
    "pro": 13,
    "fat": 1.5,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Pasta sin gluten",
    "originalName": "Pasta sin gluten",
    "category": "cereales_y_tuberculos",
    "kcal": 360,
    "cho": 78,
    "pro": 7,
    "fat": 1.2,
    "tags": [
      "sin_gluten_especial"
    ]
  },
  {
    "name": "Patata",
    "originalName": "Patata crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 77,
    "cho": 17.5,
    "pro": 2,
    "fat": 0.1,
    "tags": []
  },
  {
    "name": "Picos / colines",
    "originalName": "Picos / colines",
    "category": "cereales_y_tuberculos",
    "kcal": 400,
    "cho": 72,
    "pro": 10,
    "fat": 8,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Quinoa",
    "originalName": "Quinoa crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 368,
    "cho": 64.2,
    "pro": 14.1,
    "fat": 6.1,
    "tags": []
  },
  {
    "name": "Tortas de arroz",
    "originalName": "Tortas de arroz",
    "category": "cereales_y_tuberculos",
    "kcal": 380,
    "cho": 82,
    "pro": 8,
    "fat": 2,
    "tags": []
  },
  {
    "name": "Tortas de maíz",
    "originalName": "Tortas de maíz",
    "category": "cereales_y_tuberculos",
    "kcal": 375,
    "cho": 80,
    "pro": 7.5,
    "fat": 2.2,
    "tags": []
  },
  {
    "name": "Tortilla de trigo",
    "originalName": "tortilla de trigo",
    "category": "cereales_y_tuberculos",
    "kcal": 312,
    "cho": 52,
    "pro": 8,
    "fat": 8.5,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Tortilla de trigo integral",
    "originalName": "tortilla de trigo integral",
    "category": "cereales_y_tuberculos",
    "kcal": 300,
    "cho": 48,
    "pro": 9,
    "fat": 8.2,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Tostadas integrales (biscotes)",
    "originalName": "Tostadas integrales (biscotes)",
    "category": "cereales_y_tuberculos",
    "kcal": 385,
    "cho": 70,
    "pro": 11,
    "fat": 5,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Trigo sarraceno",
    "originalName": "Trigo sarraceno crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 343,
    "cho": 71.5,
    "pro": 13.3,
    "fat": 3.4,
    "tags": []
  },
  {
    "name": "Trigo sarraceno hinchado",
    "originalName": "Trigo sarraceno hinchado",
    "category": "cereales_y_tuberculos",
    "kcal": 360.2,
    "cho": 67.92,
    "pro": 12.63,
    "fat": 3.57,
    "tags": []
  },
  {
    "name": "Yuca",
    "originalName": "Yuca crudo",
    "category": "cereales_y_tuberculos",
    "kcal": 160,
    "cho": 38,
    "pro": 1.4,
    "fat": 0.3,
    "tags": []
  },
  {
    "name": "Arándano congelada",
    "originalName": "Arándano congelada",
    "category": "frutas",
    "kcal": 55.9,
    "cho": 14.21,
    "pro": 0.69,
    "fat": 0.29,
    "tags": []
  },
  {
    "name": "Arándano desecada",
    "originalName": "Arándano desecada",
    "category": "frutas",
    "kcal": 171,
    "cho": 40.6,
    "pro": 1.96,
    "fat": 0.84,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Arándanos",
    "originalName": "Arándano cruda",
    "category": "frutas",
    "kcal": 57,
    "cho": 14.5,
    "pro": 0.7,
    "fat": 0.3,
    "tags": []
  },
  {
    "name": "Ciruela",
    "originalName": "Ciruela",
    "category": "frutas",
    "kcal": 46,
    "cho": 11.4,
    "pro": 0.7,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Dátil",
    "originalName": "Dátil",
    "category": "frutas",
    "kcal": 282,
    "cho": 75,
    "pro": 2.5,
    "fat": 0.4,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Frambuesa",
    "originalName": "Frambuesa ",
    "category": "frutas",
    "kcal": 52,
    "cho": 12,
    "pro": 1.2,
    "fat": 0.7,
    "tags": []
  },
  {
    "name": "Frambuesa congelada",
    "originalName": "Frambuesa congelada",
    "category": "frutas",
    "kcal": 51,
    "cho": 11.76,
    "pro": 1.18,
    "fat": 0.69,
    "tags": []
  },
  {
    "name": "Fresa congelada",
    "originalName": "Fresa congelada",
    "category": "frutas",
    "kcal": 31.4,
    "cho": 7.55,
    "pro": 0.69,
    "fat": 0.29,
    "tags": []
  },
  {
    "name": "Fresa desecada",
    "originalName": "Fresa desecada",
    "category": "frutas",
    "kcal": 96,
    "cho": 21.56,
    "pro": 1.96,
    "fat": 0.84,
    "tags": [
      "fructosa"
    ]
  },
  {
    "name": "Fresas",
    "originalName": "Fresa ",
    "category": "frutas",
    "kcal": 32,
    "cho": 7.7,
    "pro": 0.7,
    "fat": 0.3,
    "tags": []
  },
  {
    "name": "Higo seco",
    "originalName": "Higo seco ",
    "category": "frutas",
    "kcal": 249,
    "cho": 64,
    "pro": 3.3,
    "fat": 0.9,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Higo seco desecada",
    "originalName": "Higo seco desecada",
    "category": "frutas",
    "kcal": 747,
    "cho": 179.2,
    "pro": 9.24,
    "fat": 2.52,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Kiwi",
    "originalName": "Kiwi",
    "category": "frutas",
    "kcal": 61,
    "cho": 14.7,
    "pro": 1.1,
    "fat": 0.5,
    "tags": []
  },
  {
    "name": "Mandarina",
    "originalName": "Mandarina",
    "category": "frutas",
    "kcal": 53,
    "cho": 13.3,
    "pro": 0.8,
    "fat": 0.3,
    "tags": []
  },
  {
    "name": "Mango",
    "originalName": "Mango ",
    "category": "frutas",
    "kcal": 60,
    "cho": 15,
    "pro": 0.8,
    "fat": 0.4,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ]
  },
  {
    "name": "Mango congelada",
    "originalName": "Mango congelada",
    "category": "frutas",
    "kcal": 58.8,
    "cho": 14.7,
    "pro": 0.78,
    "fat": 0.39,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Mango desecada",
    "originalName": "Mango desecada",
    "category": "frutas",
    "kcal": 180,
    "cho": 42,
    "pro": 2.24,
    "fat": 1.12,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Manzana",
    "originalName": "Manzana ",
    "category": "frutas",
    "kcal": 52,
    "cho": 13.8,
    "pro": 0.3,
    "fat": 0.2,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ]
  },
  {
    "name": "Manzana compota sin azúcar",
    "originalName": "Manzana compota sin azúcar",
    "category": "frutas",
    "kcal": 42.6,
    "cho": 11.73,
    "pro": 0.26,
    "fat": 0.17,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Manzana desecada",
    "originalName": "Manzana desecada",
    "category": "frutas",
    "kcal": 156,
    "cho": 38.64,
    "pro": 0.84,
    "fat": 0.56,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Melocotón",
    "originalName": "Melocotón",
    "category": "frutas",
    "kcal": 39,
    "cho": 9.5,
    "pro": 0.9,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Melón",
    "originalName": "Melón ",
    "category": "frutas",
    "kcal": 34,
    "cho": 8.2,
    "pro": 0.8,
    "fat": 0.2,
    "tags": []
  },
  {
    "name": "Naranja",
    "originalName": "Naranja ",
    "category": "frutas",
    "kcal": 47,
    "cho": 11.8,
    "pro": 0.9,
    "fat": 0.1,
    "tags": []
  },
  {
    "name": "Naranja desecada",
    "originalName": "Naranja desecada",
    "category": "frutas",
    "kcal": 141,
    "cho": 33.04,
    "pro": 2.52,
    "fat": 0.28,
    "tags": [
      "fructosa"
    ]
  },
  {
    "name": "Nectarina",
    "originalName": "Nectarina",
    "category": "frutas",
    "kcal": 46,
    "cho": 10.6,
    "pro": 1,
    "fat": 0.3,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Paraguayo",
    "originalName": "Paraguayo",
    "category": "frutas",
    "kcal": 42,
    "cho": 10,
    "pro": 0.9,
    "fat": 0.2,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Pera",
    "originalName": "Pera ",
    "category": "frutas",
    "kcal": 57,
    "cho": 15.2,
    "pro": 0.4,
    "fat": 0.1,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ]
  },
  {
    "name": "Pera compota sin azúcar",
    "originalName": "Pera compota sin azúcar",
    "category": "frutas",
    "kcal": 46.7,
    "cho": 12.92,
    "pro": 0.34,
    "fat": 0.09,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Piña congelada",
    "originalName": "Piña congelada",
    "category": "frutas",
    "kcal": 49,
    "cho": 12.84,
    "pro": 0.49,
    "fat": 0.1,
    "tags": []
  },
  {
    "name": "Piña desecada",
    "originalName": "Piña desecada",
    "category": "frutas",
    "kcal": 150,
    "cho": 36.68,
    "pro": 1.4,
    "fat": 0.28,
    "tags": [
      "fructosa"
    ]
  },
  {
    "name": "Piña pelada",
    "originalName": "Piña pelada",
    "category": "frutas",
    "kcal": 47.5,
    "cho": 12.58,
    "pro": 0.48,
    "fat": 0.1,
    "tags": []
  },
  {
    "name": "Plátano",
    "originalName": "Plátano ",
    "category": "frutas",
    "kcal": 89,
    "cho": 22.8,
    "pro": 1.1,
    "fat": 0.3,
    "tags": []
  },
  {
    "name": "Plátano desecada",
    "originalName": "Plátano desecada",
    "category": "frutas",
    "kcal": 267,
    "cho": 63.84,
    "pro": 3.08,
    "fat": 0.84,
    "tags": [
      "fructosa"
    ]
  },
  {
    "name": "Sandía",
    "originalName": "Sandía ",
    "category": "frutas",
    "kcal": 30,
    "cho": 7.6,
    "pro": 0.6,
    "fat": 0.2,
    "tags": [
      "alto_fodmap",
      "fructosa"
    ]
  },
  {
    "name": "Uva desecada",
    "originalName": "Uva desecada",
    "category": "frutas",
    "kcal": 207,
    "cho": 50.4,
    "pro": 1.96,
    "fat": 0.56,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Uvas",
    "originalName": "Uva ",
    "category": "frutas",
    "kcal": 69,
    "cho": 18,
    "pro": 0.7,
    "fat": 0.2,
    "tags": [
      "fructosa"
    ]
  },
  {
    "name": "Vinagre de manzana",
    "originalName": "Vinagre de manzana",
    "category": "frutas",
    "kcal": 22,
    "cho": 0.9,
    "pro": 0,
    "fat": 0,
    "tags": [
      "fructosa",
      "alto_azufre"
    ]
  },
  {
    "name": "Zumo de naranja natural",
    "originalName": "Zumo de naranja natural",
    "category": "frutas",
    "kcal": 45,
    "cho": 10.4,
    "pro": 0.7,
    "fat": 0.2,
    "tags": [
      "fructosa"
    ]
  },
  {
    "name": "Aceite de coco",
    "originalName": "Aceite de coco",
    "category": "grasas_y_frutos_secos",
    "kcal": 862,
    "cho": 0,
    "pro": 0,
    "fat": 99.1,
    "tags": []
  },
  {
    "name": "Aceite de girasol",
    "originalName": "Aceite de girasol",
    "category": "grasas_y_frutos_secos",
    "kcal": 884,
    "cho": 0,
    "pro": 0,
    "fat": 100,
    "tags": []
  },
  {
    "name": "Aguacate",
    "originalName": "aguacate",
    "category": "grasas_y_frutos_secos",
    "kcal": 141,
    "cho": 5.9,
    "pro": 1.5,
    "fat": 12,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Almendras",
    "originalName": "Almendra ",
    "category": "grasas_y_frutos_secos",
    "kcal": 579,
    "cho": 21.6,
    "pro": 21.2,
    "fat": 49.9,
    "tags": [
      "fruto_seco"
    ]
  },
  {
    "name": "Anacardo (marañón)",
    "originalName": "Anacardo (marañón)",
    "category": "grasas_y_frutos_secos",
    "kcal": 553,
    "cho": 30.2,
    "pro": 18.2,
    "fat": 43.9,
    "tags": [
      "fruto_seco",
      "alto_fodmap"
    ]
  },
  {
    "name": "AOVE",
    "originalName": "AOVE",
    "category": "grasas_y_frutos_secos",
    "kcal": 884,
    "cho": 0,
    "pro": 0,
    "fat": 100,
    "tags": []
  },
  {
    "name": "AOVE (Aceite de oliva virgen extra)",
    "originalName": "Aceite de oliva virgen extra",
    "category": "grasas_y_frutos_secos",
    "kcal": 884,
    "cho": 0,
    "pro": 0,
    "fat": 100,
    "tags": []
  },
  {
    "name": "Avellanas",
    "originalName": "Avellana",
    "category": "grasas_y_frutos_secos",
    "kcal": 628,
    "cho": 16.7,
    "pro": 15,
    "fat": 60.8,
    "tags": [
      "fruto_seco"
    ]
  },
  {
    "name": "Cacahuete (maní)",
    "originalName": "Cacahuete (maní)",
    "category": "grasas_y_frutos_secos",
    "kcal": 567,
    "cho": 16.1,
    "pro": 25.8,
    "fat": 49.2,
    "tags": [
      "fruto_seco"
    ]
  },
  {
    "name": "Crema de cacahuete natural (100% cacahuete)",
    "originalName": "Crema de cacahuete natural (100% cacahuete)",
    "category": "grasas_y_frutos_secos",
    "kcal": 588,
    "cho": 20,
    "pro": 25,
    "fat": 50,
    "tags": [
      "fruto_seco"
    ]
  },
  {
    "name": "Mantequilla",
    "originalName": "Mantequilla",
    "category": "grasas_y_frutos_secos",
    "kcal": 717,
    "cho": 0.1,
    "pro": 0.9,
    "fat": 81,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Nueces",
    "originalName": "Nuez",
    "category": "grasas_y_frutos_secos",
    "kcal": 654,
    "cho": 13.7,
    "pro": 15.2,
    "fat": 65.2,
    "tags": [
      "fruto_seco"
    ]
  },
  {
    "name": "Pistachos",
    "originalName": "Pistacho",
    "category": "grasas_y_frutos_secos",
    "kcal": 560,
    "cho": 27.5,
    "pro": 20.2,
    "fat": 45.4,
    "tags": [
      "fruto_seco",
      "alto_fodmap"
    ]
  },
  {
    "name": "Claras de huevo",
    "originalName": "Clara de huevo crudo",
    "category": "huevos_y_lacteos",
    "kcal": 52,
    "cho": 0.7,
    "pro": 10.9,
    "fat": 0.2,
    "tags": [
      "huevo"
    ]
  },
  {
    "name": "Huevo entero tortilla",
    "originalName": "Huevo entero tortilla",
    "category": "huevos_y_lacteos",
    "kcal": 193.8,
    "cho": 1.1,
    "pro": 13,
    "fat": 13.75,
    "tags": [
      "huevo"
    ]
  },
  {
    "name": "Huevo entero (unidad 50g)",
    "originalName": "Huevo entero crudo",
    "category": "huevos_y_lacteos",
    "kcal": 155,
    "cho": 1.1,
    "pro": 13,
    "fat": 11,
    "tags": [
      "huevo"
    ]
  },
  {
    "name": "Kéfir desnatado",
    "originalName": "Kéfir desnatado",
    "category": "huevos_y_lacteos",
    "kcal": 38,
    "cho": 4.5,
    "pro": 3.8,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Kéfir entero",
    "originalName": "Kéfir entero",
    "category": "huevos_y_lacteos",
    "kcal": 64,
    "cho": 4.7,
    "pro": 3.5,
    "fat": 3.5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Leche de almendra sin azúcar",
    "originalName": "Leche de almendra sin azúcar",
    "category": "huevos_y_lacteos",
    "kcal": 24,
    "cho": 2.6,
    "pro": 0.5,
    "fat": 1.1,
    "tags": [
      "fruto_seco"
    ]
  },
  {
    "name": "Leche de soja sin azúcar",
    "originalName": "Leche de soja sin azúcar",
    "category": "huevos_y_lacteos",
    "kcal": 33,
    "cho": 1.8,
    "pro": 3.3,
    "fat": 1.8,
    "tags": [
      "soja"
    ]
  },
  {
    "name": "Leche desnatada",
    "originalName": "Leche desnatada",
    "category": "huevos_y_lacteos",
    "kcal": 39,
    "cho": 5.28,
    "pro": 3.52,
    "fat": 2.15,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Leche entera",
    "originalName": "Leche entera ",
    "category": "huevos_y_lacteos",
    "kcal": 60,
    "cho": 4.8,
    "pro": 3.2,
    "fat": 3.3,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Leche entera alto proteína",
    "originalName": "Leche entera alto proteína",
    "category": "huevos_y_lacteos",
    "kcal": 69,
    "cho": 8.64,
    "pro": 5.76,
    "fat": 3.79,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Leche entera sin lactosa",
    "originalName": "Leche entera sin lactosa",
    "category": "huevos_y_lacteos",
    "kcal": 60,
    "cho": 4.8,
    "pro": 3.2,
    "fat": 3.3,
    "tags": [
      "sin_lactosa_especial",
      "proteina_vaca"
    ]
  },
  {
    "name": "Proteína whey en polvo (concentrado, sin batir)",
    "originalName": "Proteína whey en polvo (concentrado, sin batir)",
    "category": "huevos_y_lacteos",
    "kcal": 390,
    "cho": 8,
    "pro": 78,
    "fat": 6.5,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ]
  },
  {
    "name": "Queso cottage",
    "originalName": "Queso cottage",
    "category": "huevos_y_lacteos",
    "kcal": 98,
    "cho": 3.4,
    "pro": 11.1,
    "fat": 4.3,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso crema tipo untable",
    "originalName": "Queso crema tipo untable",
    "category": "huevos_y_lacteos",
    "kcal": 342,
    "cho": 4,
    "pro": 6,
    "fat": 34,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso curado",
    "originalName": "Queso curado ",
    "category": "huevos_y_lacteos",
    "kcal": 400,
    "cho": 1.3,
    "pro": 25,
    "fat": 33,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso de cabra",
    "originalName": "Queso de cabra",
    "category": "huevos_y_lacteos",
    "kcal": 364,
    "cho": 0.1,
    "pro": 21.6,
    "fat": 30,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso fresco",
    "originalName": "Queso fresco ",
    "category": "huevos_y_lacteos",
    "kcal": 98,
    "cho": 3,
    "pro": 11,
    "fat": 4,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso fresco alto proteína",
    "originalName": "Queso fresco alto proteína",
    "category": "huevos_y_lacteos",
    "kcal": 112.7,
    "cho": 5.4,
    "pro": 19.8,
    "fat": 4.6,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso fresco desnatado",
    "originalName": "Queso fresco desnatado",
    "category": "huevos_y_lacteos",
    "kcal": 63.7,
    "cho": 3.3,
    "pro": 12.1,
    "fat": 2.6,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso fresco sin lactosa",
    "originalName": "Queso fresco sin lactosa",
    "category": "huevos_y_lacteos",
    "kcal": 98,
    "cho": 3,
    "pro": 11,
    "fat": 4,
    "tags": [
      "sin_lactosa_especial",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso fresco batido / desnatado",
    "originalName": "Queso fresco batido / desnatado",
    "category": "huevos_y_lacteos",
    "kcal": 78,
    "cho": 3.4,
    "pro": 12,
    "fat": 1.8,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso manchego curado",
    "originalName": "Queso manchego curado",
    "category": "huevos_y_lacteos",
    "kcal": 400,
    "cho": 0.1,
    "pro": 26,
    "fat": 33,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Queso parmesano",
    "originalName": "Queso parmesano",
    "category": "huevos_y_lacteos",
    "kcal": 431,
    "cho": 4.1,
    "pro": 38,
    "fat": 29,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Requesón",
    "originalName": "Requesón",
    "category": "huevos_y_lacteos",
    "kcal": 98,
    "cho": 3.4,
    "pro": 11,
    "fat": 4.3,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ]
  },
  {
    "name": "Seitán",
    "originalName": "seitán",
    "category": "huevos_y_lacteos",
    "kcal": 121,
    "cho": 3.8,
    "pro": 24.7,
    "fat": 1.9,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Skyr natural (Arla/Mercadona)",
    "originalName": "Skyr natural (Arla/Mercadona)",
    "category": "huevos_y_lacteos",
    "kcal": 63,
    "cho": 4,
    "pro": 11,
    "fat": 0.2,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ]
  },
  {
    "name": "Tofu firme",
    "originalName": "Tofu firme",
    "category": "huevos_y_lacteos",
    "kcal": 76,
    "cho": 1.9,
    "pro": 8.1,
    "fat": 4.8,
    "tags": [
      "soja"
    ]
  },
  {
    "name": "Yogur griego natural",
    "originalName": "Yogur griego natural ",
    "category": "huevos_y_lacteos",
    "kcal": 97,
    "cho": 3.6,
    "pro": 9,
    "fat": 5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur griego natural desnatado",
    "originalName": "Yogur griego natural desnatado",
    "category": "huevos_y_lacteos",
    "kcal": 63.1,
    "cho": 3.96,
    "pro": 9.9,
    "fat": 3.25,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur High Protein natural (Danone)",
    "originalName": "Yogur High Protein natural (Danone)",
    "category": "huevos_y_lacteos",
    "kcal": 60,
    "cho": 4,
    "pro": 10,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur High Protein sabor chocolate (Danone)",
    "originalName": "Yogur High Protein sabor chocolate (Danone)",
    "category": "huevos_y_lacteos",
    "kcal": 85,
    "cho": 8,
    "pro": 10,
    "fat": 1.5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur natural",
    "originalName": "Yogur natural ",
    "category": "huevos_y_lacteos",
    "kcal": 61,
    "cho": 4.7,
    "pro": 3.5,
    "fat": 3.3,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur natural alto proteína",
    "originalName": "Yogur natural alto proteína",
    "category": "huevos_y_lacteos",
    "kcal": 70.1,
    "cho": 8.46,
    "pro": 6.3,
    "fat": 3.79,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur natural desnatado",
    "originalName": "Yogur natural desnatado",
    "category": "huevos_y_lacteos",
    "kcal": 39.6,
    "cho": 5.17,
    "pro": 3.85,
    "fat": 2.15,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur natural sin lactosa",
    "originalName": "Yogur natural sin lactosa",
    "category": "huevos_y_lacteos",
    "kcal": 61,
    "cho": 4.7,
    "pro": 3.5,
    "fat": 3.3,
    "tags": [
      "sin_lactosa_especial",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur proteico natural (Hacendado/Mercadona)",
    "originalName": "Yogur proteico natural (Hacendado/Mercadona)",
    "category": "huevos_y_lacteos",
    "kcal": 57,
    "cho": 3.9,
    "pro": 10,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur proteico sabor vainilla (Hacendado/Mercadona)",
    "originalName": "Yogur proteico sabor vainilla (Hacendado/Mercadona)",
    "category": "huevos_y_lacteos",
    "kcal": 65,
    "cho": 5.5,
    "pro": 10,
    "fat": 0.2,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur Proteína natural (Central Lechera Asturiana)",
    "originalName": "Yogur Proteína natural (Central Lechera Asturiana)",
    "category": "huevos_y_lacteos",
    "kcal": 62,
    "cho": 4.5,
    "pro": 10,
    "fat": 1,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Yogur sin lactosa Proteína natural (Kaiku)",
    "originalName": "Yogur sin lactosa Proteína natural (Kaiku)",
    "category": "huevos_y_lacteos",
    "kcal": 60,
    "cho": 4,
    "pro": 10,
    "fat": 1.5,
    "tags": [
      "sin_lactosa_especial",
      "proteina_vaca"
    ]
  },
  {
    "name": "Alubia blanca",
    "originalName": "Alubia blanca seca",
    "category": "legumbres",
    "kcal": 333,
    "cho": 60,
    "pro": 23,
    "fat": 0.8,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Garbanzo",
    "originalName": "Garbanzo seca",
    "category": "legumbres",
    "kcal": 364,
    "cho": 61,
    "pro": 19,
    "fat": 6,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Lenteja",
    "originalName": "Lenteja seca",
    "category": "legumbres",
    "kcal": 353,
    "cho": 60,
    "pro": 25,
    "fat": 1.1,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Soja texturizada",
    "originalName": "Soja texturizada seca",
    "category": "legumbres",
    "kcal": 336,
    "cho": 31,
    "pro": 50,
    "fat": 1.2,
    "tags": [
      "soja",
      "alto_fodmap"
    ]
  },
  {
    "name": "Agua de coco",
    "originalName": "Agua de coco",
    "category": "otros_y_suplementos",
    "kcal": 19,
    "cho": 3.7,
    "pro": 0.7,
    "fat": 0.2,
    "tags": []
  },
  {
    "name": "Barrita energética avena y fruta",
    "originalName": "Barrita energética avena y fruta",
    "category": "otros_y_suplementos",
    "kcal": 195,
    "cho": 35,
    "pro": 5,
    "fat": 4,
    "tags": [
      "gluten",
      "fructosa"
    ]
  },
  {
    "name": "Batido de proteína de suero 30g",
    "originalName": "Batido de proteína de suero 30g",
    "category": "otros_y_suplementos",
    "kcal": 115,
    "cho": 1,
    "pro": 26,
    "fat": 0.5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Batido de proteína sin lactosa 30g",
    "originalName": "Batido de proteína sin lactosa 30g",
    "category": "otros_y_suplementos",
    "kcal": 115,
    "cho": 1,
    "pro": 26,
    "fat": 0.5,
    "tags": [
      "proteina_vaca",
      "sin_lactosa_especial"
    ]
  },
  {
    "name": "Café solo (espresso)",
    "originalName": "Café solo (espresso)",
    "category": "otros_y_suplementos",
    "kcal": 2,
    "cho": 0,
    "pro": 0.1,
    "fat": 0,
    "tags": []
  },
  {
    "name": "Carne picada mixta",
    "originalName": "carne picada mixta",
    "category": "otros_y_suplementos",
    "kcal": 228,
    "cho": 0,
    "pro": 17.6,
    "fat": 17.5,
    "tags": [
      "carne_roja",
      "cerdo"
    ]
  },
  {
    "name": "Caseína micelar nocturna 30g",
    "originalName": "Caseína micelar nocturna 30g",
    "category": "otros_y_suplementos",
    "kcal": 110,
    "cho": 1.5,
    "pro": 25,
    "fat": 0.5,
    "tags": [
      "lactosa",
      "proteina_vaca"
    ]
  },
  {
    "name": "Chocolate negro 70-85% cacao",
    "originalName": "Chocolate negro 70-85% cacao",
    "category": "otros_y_suplementos",
    "kcal": 598,
    "cho": 45.9,
    "pro": 7.8,
    "fat": 42.6,
    "tags": []
  },
  {
    "name": "Ciclodextrina / Maltodextrina 30g",
    "originalName": "Ciclodextrina / Maltodextrina 30g",
    "category": "otros_y_suplementos",
    "kcal": 116,
    "cho": 29,
    "pro": 0,
    "fat": 0,
    "tags": []
  },
  {
    "name": "Colágeno hidrolizado + Vitamina C 15g",
    "originalName": "Colágeno hidrolizado + Vitamina C 15g",
    "category": "otros_y_suplementos",
    "kcal": 56,
    "cho": 0,
    "pro": 14,
    "fat": 0,
    "tags": []
  },
  {
    "name": "Ensure Nutrición Entera (unidad)",
    "originalName": "Ensure Nutrición Entera (unidad)",
    "category": "otros_y_suplementos",
    "kcal": 250,
    "cho": 32,
    "pro": 9,
    "fat": 8,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ]
  },
  {
    "name": "Gazpacho",
    "originalName": "Gazpacho",
    "category": "otros_y_suplementos",
    "kcal": 42,
    "cho": 4.5,
    "pro": 1,
    "fat": 2.2,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Gel energético deportivo (unidad)",
    "originalName": "Gel energético deportivo (unidad)",
    "category": "otros_y_suplementos",
    "kcal": 120,
    "cho": 30,
    "pro": 0,
    "fat": 0,
    "tags": []
  },
  {
    "name": "Helado",
    "category": "otros_y_suplementos",
    "kcal": 200,
    "cho": 25,
    "pro": 3.5,
    "fat": 10,
    "tags": [
      "proteina_vaca",
      "fructosa",
      "lactosa"
    ]
  },
  {
    "name": "Mejiilon en conserva (escabeche)",
    "originalName": "mejiilon en conserva (escabeche)",
    "category": "otros_y_suplementos",
    "kcal": 168,
    "cho": 4,
    "pro": 14,
    "fat": 10,
    "tags": [
      "marisco",
      "alto_azufre"
    ]
  },
  {
    "name": "Miel",
    "originalName": "Miel",
    "category": "otros_y_suplementos",
    "kcal": 304,
    "cho": 82.4,
    "pro": 0.3,
    "fat": 0,
    "tags": [
      "fructosa",
      "alto_fodmap"
    ]
  },
  {
    "name": "Mostaza de Dijon",
    "originalName": "Mostaza de Dijon",
    "category": "otros_y_suplementos",
    "kcal": 66,
    "cho": 5,
    "pro": 4.4,
    "fat": 3.3,
    "tags": []
  },
  {
    "name": "Mozzarella fresca",
    "originalName": "Mozzarella fresca",
    "category": "otros_y_suplementos",
    "kcal": 280,
    "cho": 2.2,
    "pro": 18,
    "fat": 22,
    "tags": [
      "proteina_vaca",
      "lactosa"
    ]
  },
  {
    "name": "Pesto",
    "originalName": "Pesto",
    "category": "otros_y_suplementos",
    "kcal": 460,
    "cho": 5,
    "pro": 4.5,
    "fat": 46,
    "tags": [
      "proteina_vaca",
      "lactosa",
      "fruto_seco",
      "alto_fodmap"
    ]
  },
  {
    "name": "Piñones",
    "originalName": "Piñones",
    "category": "otros_y_suplementos",
    "kcal": 673,
    "cho": 13.1,
    "pro": 13.7,
    "fat": 68.4,
    "tags": [
      "fruto_seco"
    ]
  },
  {
    "name": "Pipas de girasol",
    "originalName": "Pipas de girasol",
    "category": "otros_y_suplementos",
    "kcal": 584,
    "cho": 20,
    "pro": 20.8,
    "fat": 51.5,
    "tags": []
  },
  {
    "name": "Salmorejo",
    "originalName": "Salmorejo",
    "category": "otros_y_suplementos",
    "kcal": 95,
    "cho": 8,
    "pro": 2,
    "fat": 6,
    "tags": [
      "gluten",
      "alto_fodmap"
    ]
  },
  {
    "name": "Salsa boloñesa",
    "originalName": "Salsa boloñesa",
    "category": "otros_y_suplementos",
    "kcal": 105,
    "cho": 6,
    "pro": 6.5,
    "fat": 6,
    "tags": [
      "carne_roja",
      "cerdo",
      "alto_fodmap"
    ]
  },
  {
    "name": "Salsa de soja",
    "originalName": "Salsa de soja",
    "category": "otros_y_suplementos",
    "kcal": 53,
    "cho": 4.9,
    "pro": 8,
    "fat": 0.1,
    "tags": [
      "soja",
      "gluten"
    ]
  },
  {
    "name": "Salsa de soja sin azúcar",
    "originalName": "salsa de soja sin azúcar",
    "category": "otros_y_suplementos",
    "kcal": 53,
    "cho": 4.9,
    "pro": 8.1,
    "fat": 0.6,
    "tags": [
      "soja"
    ]
  },
  {
    "name": "Secreto de cerdo",
    "originalName": "Secreto de cerdo",
    "category": "carnes_y_aves",
    "kcal": 290,
    "cho": 0,
    "pro": 17.5,
    "fat": 24,
    "tags": [
      "cerdo"
    ]
  },
  {
    "name": "Semillas de calabaza (pipas)",
    "originalName": "Semillas de calabaza (pipas)",
    "category": "otros_y_suplementos",
    "kcal": 559,
    "cho": 10.7,
    "pro": 30.2,
    "fat": 49.1,
    "tags": []
  },
  {
    "name": "Semillas de chía",
    "originalName": "Semillas de chía",
    "category": "otros_y_suplementos",
    "kcal": 486,
    "cho": 42.1,
    "pro": 16.5,
    "fat": 30.7,
    "tags": []
  },
  {
    "name": "Semillas de lino (linaza)",
    "originalName": "Semillas de lino (linaza)",
    "category": "otros_y_suplementos",
    "kcal": 534,
    "cho": 28.9,
    "pro": 18.3,
    "fat": 42.2,
    "tags": []
  },
  {
    "name": "Sésamo",
    "originalName": "Sésamo",
    "category": "otros_y_suplementos",
    "kcal": 573,
    "cho": 23.4,
    "pro": 17.7,
    "fat": 49.7,
    "tags": []
  },
  {
    "name": "Té verde (infusión)",
    "originalName": "Té verde (infusión)",
    "category": "otros_y_suplementos",
    "kcal": 1,
    "cho": 0.2,
    "pro": 0,
    "fat": 0,
    "tags": []
  },
  {
    "name": "Atún natural",
    "originalName": "Atún natural crudo",
    "category": "pescados_y_mariscos",
    "kcal": 116,
    "cho": 0,
    "pro": 26,
    "fat": 1,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Atún natural conserva aceite",
    "originalName": "Atún natural conserva aceite",
    "category": "pescados_y_mariscos",
    "kcal": 220.4,
    "cho": 0,
    "pro": 27.3,
    "fat": 1.05,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Atún natural conserva natural",
    "originalName": "Atún natural conserva natural",
    "category": "pescados_y_mariscos",
    "kcal": 133.4,
    "cho": 0,
    "pro": 28.6,
    "fat": 1.1,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Bacalao",
    "originalName": "bacalao (fresco)",
    "category": "pescados_y_mariscos",
    "kcal": 74,
    "cho": 0,
    "pro": 17.7,
    "fat": 0.4,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Bacalao desalado",
    "originalName": "bacalao desalado",
    "category": "pescados_y_mariscos",
    "kcal": 82,
    "cho": 0,
    "pro": 18,
    "fat": 0.7,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Bacalao fresco",
    "originalName": "Bacalao fresco",
    "category": "pescados_y_mariscos",
    "kcal": 74,
    "cho": 0,
    "pro": 17.7,
    "fat": 0.4,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Berberecho conserva",
    "originalName": "berberecho conserva",
    "category": "pescados_y_mariscos",
    "kcal": 69,
    "cho": 2.5,
    "pro": 15,
    "fat": 0.6,
    "tags": [
      "marisco"
    ]
  },
  {
    "name": "Berberechos frescos",
    "originalName": "berberecho fresco",
    "category": "pescados_y_mariscos",
    "kcal": 79,
    "cho": 3,
    "pro": 15.7,
    "fat": 1,
    "tags": [
      "marisco"
    ]
  },
  {
    "name": "Caballa",
    "originalName": "Caballa crudo",
    "category": "pescados_y_mariscos",
    "kcal": 205,
    "cho": 0,
    "pro": 18.6,
    "fat": 13.9,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Caballa en conserva (al natural)",
    "originalName": "caballa en conserva (al natural)",
    "category": "pescados_y_mariscos",
    "kcal": 167,
    "cho": 0,
    "pro": 24,
    "fat": 7.5,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Calamar",
    "originalName": "Calamar",
    "category": "pescados_y_mariscos",
    "kcal": 92,
    "cho": 3.1,
    "pro": 15.6,
    "fat": 1.4,
    "tags": [
      "pescado",
      "marisco"
    ]
  },
  {
    "name": "Corvina",
    "originalName": "Corvina crudo",
    "category": "pescados_y_mariscos",
    "kcal": 100,
    "cho": 0,
    "pro": 19,
    "fat": 2.6,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Dorada",
    "originalName": "Dorada",
    "category": "pescados_y_mariscos",
    "kcal": 121,
    "cho": 0,
    "pro": 20,
    "fat": 4,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Emperador (pez espada)",
    "originalName": "Emperador (pez espada) crudo",
    "category": "pescados_y_mariscos",
    "kcal": 121,
    "cho": 0,
    "pro": 19.8,
    "fat": 4,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Gambas",
    "originalName": "Gamba cruda",
    "category": "pescados_y_mariscos",
    "kcal": 99,
    "cho": 0.2,
    "pro": 24,
    "fat": 0.3,
    "tags": [
      "marisco"
    ]
  },
  {
    "name": "Lenguado",
    "originalName": "Lenguado",
    "category": "pescados_y_mariscos",
    "kcal": 86,
    "cho": 0,
    "pro": 16.5,
    "fat": 1.9,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Lubina",
    "originalName": "Lubina",
    "category": "pescados_y_mariscos",
    "kcal": 97,
    "cho": 0,
    "pro": 18.4,
    "fat": 2.5,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Mejillones frescos",
    "originalName": "Mejillon fresco",
    "category": "pescados_y_mariscos",
    "kcal": 86,
    "cho": 3.7,
    "pro": 12,
    "fat": 2.2,
    "tags": [
      "marisco"
    ]
  },
  {
    "name": "Merluza",
    "originalName": "Merluza",
    "category": "pescados_y_mariscos",
    "kcal": 90,
    "cho": 0,
    "pro": 18,
    "fat": 1.5,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Rape",
    "originalName": "Rape crudo",
    "category": "pescados_y_mariscos",
    "kcal": 82,
    "cho": 0,
    "pro": 18.7,
    "fat": 0.8,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Pulpo",
    "originalName": "Pulpo crudo",
    "category": "pescados_y_mariscos",
    "kcal": 82,
    "cho": 2.2,
    "pro": 14.9,
    "fat": 1,
    "tags": [
      "pescado",
      "marisco"
    ]
  },
  {
    "name": "Rodaballo",
    "originalName": "Rodaballo ",
    "category": "pescados_y_mariscos",
    "kcal": 92,
    "cho": 0,
    "pro": 16,
    "fat": 3,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Salmón",
    "originalName": "Salmón crudo",
    "category": "pescados_y_mariscos",
    "kcal": 208,
    "cho": 0,
    "pro": 20,
    "fat": 13,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Salmón conserva aceite",
    "originalName": "Salmón conserva aceite",
    "category": "pescados_y_mariscos",
    "kcal": 395.2,
    "cho": 0,
    "pro": 21,
    "fat": 24.7,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Salmón conserva natural",
    "originalName": "Salmón conserva natural",
    "category": "pescados_y_mariscos",
    "kcal": 239.2,
    "cho": 0,
    "pro": 22,
    "fat": 14.95,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Salmón ahumado",
    "originalName": "salmón ahumado",
    "category": "pescados_y_mariscos",
    "kcal": 181,
    "cho": 0,
    "pro": 22,
    "fat": 10.5,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Salmón fresco",
    "originalName": "Salmón fresco",
    "category": "pescados_y_mariscos",
    "kcal": 208,
    "cho": 0,
    "pro": 20,
    "fat": 13,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Sardina",
    "originalName": "Sardina crudo",
    "category": "pescados_y_mariscos",
    "kcal": 208,
    "cho": 0,
    "pro": 25,
    "fat": 11,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Sardina conserva aceite",
    "originalName": "Sardina conserva aceite",
    "category": "pescados_y_mariscos",
    "kcal": 395.2,
    "cho": 0,
    "pro": 26.25,
    "fat": 20.9,
    "tags": [
      "pescado"
    ]
  },
  {
    "name": "Sepia",
    "originalName": "Sepia",
    "category": "pescados_y_mariscos",
    "kcal": 79,
    "cho": 0.8,
    "pro": 16.2,
    "fat": 0.7,
    "tags": [
      "pescado",
      "marisco"
    ]
  },
  {
    "name": "Acelga",
    "originalName": "Acelga cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 19,
    "cho": 3.7,
    "pro": 1.8,
    "fat": 0.2,
    "tags": []
  },
  {
    "name": "Ajo",
    "originalName": "Ajo ",
    "category": "verduras_y_hortalizas",
    "kcal": 149,
    "cho": 33,
    "pro": 6.4,
    "fat": 0.5,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Alcachofa",
    "originalName": "alcachofa",
    "category": "verduras_y_hortalizas",
    "kcal": 44,
    "cho": 7.8,
    "pro": 2.4,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Berenjena",
    "originalName": "Berenjena cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 25,
    "cho": 5.9,
    "pro": 1,
    "fat": 0.2,
    "tags": []
  },
  {
    "name": "Brócoli",
    "originalName": "Brócoli crudo",
    "category": "verduras_y_hortalizas",
    "kcal": 34,
    "cho": 6.6,
    "pro": 2.8,
    "fat": 0.4,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Calabacín",
    "originalName": "Calabacín crudo",
    "category": "verduras_y_hortalizas",
    "kcal": 17,
    "cho": 3.1,
    "pro": 1.2,
    "fat": 0.3,
    "tags": []
  },
  {
    "name": "Cebolla",
    "originalName": "Cebolla cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 40,
    "cho": 9.3,
    "pro": 1.1,
    "fat": 0.1,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Champiñón",
    "originalName": "Champiñón crudo",
    "category": "verduras_y_hortalizas",
    "kcal": 22,
    "cho": 3.3,
    "pro": 3.1,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Coliflor",
    "originalName": "Coliflor cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 25,
    "cho": 5,
    "pro": 1.9,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Espárragos blancos conserva",
    "originalName": "espárragos blancos conserva",
    "category": "verduras_y_hortalizas",
    "kcal": 20,
    "cho": 2.5,
    "pro": 1.8,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Espárragos verdes",
    "originalName": "espárragos verdes",
    "category": "verduras_y_hortalizas",
    "kcal": 23,
    "cho": 1.8,
    "pro": 2.6,
    "fat": 0.2,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Guisantes",
    "originalName": "Guisantes crudos",
    "category": "verduras_y_hortalizas",
    "kcal": 81,
    "cho": 14.5,
    "pro": 5.4,
    "fat": 0.4,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Puerro",
    "originalName": "Puerro crudo",
    "category": "verduras_y_hortalizas",
    "kcal": 31,
    "cho": 5.7,
    "pro": 1.5,
    "fat": 0.3,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Espinaca",
    "originalName": "Espinaca cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 23,
    "cho": 3.6,
    "pro": 2.9,
    "fat": 0.4,
    "tags": []
  },
  {
    "name": "Hamburguesa de espinacas",
    "originalName": "Hamburguesa de espinacas crudo",
    "category": "verduras_y_hortalizas",
    "kcal": 120,
    "cho": 12,
    "pro": 5,
    "fat": 5.5,
    "tags": [
      "gluten"
    ]
  },
  {
    "name": "Judías verdes",
    "category": "verduras_y_hortalizas",
    "kcal": 31,
    "cho": 4.2,
    "pro": 1.8,
    "fat": 0.1,
    "tags": []
  },
  {
    "name": "Lechuga romana",
    "originalName": "Lechuga romana cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 17,
    "cho": 3.3,
    "pro": 1.2,
    "fat": 0.3,
    "tags": []
  },
  {
    "name": "Pepino",
    "originalName": "Pepino",
    "category": "verduras_y_hortalizas",
    "kcal": 15,
    "cho": 3.6,
    "pro": 0.7,
    "fat": 0.1,
    "tags": []
  },
  {
    "name": "Pimiento",
    "originalName": "Pimiento cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 31,
    "cho": 6,
    "pro": 1,
    "fat": 0.3,
    "tags": []
  },
  {
    "name": "Remolacha",
    "originalName": "Remolacha cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 43,
    "cho": 9.6,
    "pro": 1.6,
    "fat": 0.2,
    "tags": []
  },
  {
    "name": "Rúcula",
    "originalName": "Rúcula cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 25,
    "cho": 3.7,
    "pro": 2.6,
    "fat": 0.7,
    "tags": []
  },
  {
    "name": "Tomate",
    "originalName": "Tomate crudo",
    "category": "verduras_y_hortalizas",
    "kcal": 18,
    "cho": 3.9,
    "pro": 0.9,
    "fat": 0.2,
    "tags": []
  },
  {
    "name": "Tomate frito",
    "originalName": "Tomate frito",
    "category": "verduras_y_hortalizas",
    "kcal": 82,
    "cho": 11,
    "pro": 1.6,
    "fat": 3.5,
    "tags": [
      "alto_fodmap"
    ]
  },
  {
    "name": "Zanahoria",
    "originalName": "Zanahoria cruda",
    "category": "verduras_y_hortalizas",
    "kcal": 41,
    "cho": 9.6,
    "pro": 0.9,
    "fat": 0.2,
    "tags": []
  },
  {
    "name": "Batido de proteína vegetal 30g",
    "originalName": "Batido de proteína vegetal 30g",
    "category": "otros_y_suplementos",
    "kcal": 115,
    "cho": 1.5,
    "pro": 24,
    "fat": 1,
    "tags": [
      "sin_lactosa_especial"
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

// Precomputar normalizedName en cada elemento del catálogo para acceso O(1)
FOODS_CRUDO.forEach((f) => {
  f.normalizedName = normalizeFoodName(f.name);
});

export const FOODS_BY_NORMALIZED_NAME = new Map(
  FOODS_CRUDO.map((f) => [f.normalizedName, f])
);

export const FOOD_NAMES_LIST = FOODS_CRUDO.map((f) => f.name);
export const FOOD_NORMALIZED_NAMES_LIST = FOODS_CRUDO.map((f) => f.normalizedName);

export default FOODS_CRUDO;
