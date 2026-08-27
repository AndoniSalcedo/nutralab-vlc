# Prompts Semanales Reales (Sin Contexto Adicional Artificial)

> Estos son los prompts generados tal y como se generan en la aplicación real para cualquier jugador, usando únicamente sus datos clínicos y deportivos de la base de datos (sin los textos artificiales de prueba).

## Jugador: Eray Comert (ID 231)

```text
INSTRUCCIÓN CRÍTICA:
Devuelve ÚNICAMENTE un objeto JSON válido con las claves "dias" y "notas".
NO incluyas texto explicativo, encabezados Markdown ni introducciones.
ESTRUCTURA DE RESPUESTA OBLIGATORIA:
{
  "dias": {
    "lunes": {
      "ingestas": [
        {
          "nombre": "Nombre de la ingesta",
          "detalle": "Alimentos y gramos exactos en crudo de forma concisa."
        }
      ]
    },
    "martes": { ... },
    "miercoles": { ... },
    "jueves": { ... },
    "viernes": { ... },
    "sabado": { ... },
    "domingo": { ... }
  },
  "notas": [
    "Consejo 1...",
    "Consejo 2...",
    "Consejo 3...",
    "Consejo 4..."
  ]
}

ESPECIFICACIÓN COMPLETA DEL PLAN SEMANAL EN JSON:
{
  "rol": "Carlos Ferrando, nutricionista del Valencia CF",
  "tarea": "Diseñar el menú gastronómico de TODA LA SEMANA (Lunes a Domingo) calculando los gramos exactos en crudo para cumplir las macros fijadas en cada ingesta, garantizando alta variedad gastronómica y respetando estrictamente protocolos fijos, restricciones clínicas y preferencias del jugador.",
  "jugador": {
    "nombre": "Eray Comert",
    "posicion": "Defensa",
    "peso_kg": 79,
    "objetivo": "Ganancia de Músculo",
    "alergias_intolerancias": "Intolerancias: A algunas verduras flatulentas | Aversiones: Cerdo y lentejas",
    "preferencias": "Le gusta comer algo dulce por la noche"
  },
  "contexto_adicional": "Ajustar a las tolerancias y gustos del jugador",
  "plan_semanal_por_dias": {
    "lunes": {
      "dia": "Lunes",
      "tipo_dia": "entreno",
      "objetivos_totales": {
        "kcal": 2805,
        "proteina_g": 166,
        "hidratos_g": 395,
        "grasa_g": 79
      },
      "ingestas_a_generar": [
        {
          "nombre": "Desayuno",
          "objetivo": {
            "kcal": 581,
            "proteina_g": 31,
            "hidratos_g": 93,
            "grasa_g": 18
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 929,
            "proteina_g": 49,
            "hidratos_g": 139,
            "grasa_g": 29
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 362,
            "proteina_g": 14,
            "hidratos_g": 63,
            "grasa_g": 6
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 813,
            "proteina_g": 42,
            "hidratos_g": 100,
            "grasa_g": 26
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija cena de carga pre-partido (24h previas): Salmon con arroz y aguacate",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 120,
            "proteina_g": 30,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        }
      ]
    },
    "martes": {
      "dia": "Martes",
      "tipo_dia": "partido",
      "objetivos_totales": {
        "kcal": 3437,
        "proteina_g": 158,
        "hidratos_g": 553,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Desayuno",
          "objetivo": {
            "kcal": 715,
            "proteina_g": 29,
            "hidratos_g": 130,
            "grasa_g": 16
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: fruta y agua",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1144,
            "proteina_g": 46,
            "hidratos_g": 195,
            "grasa_g": 26
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: Arroz con salsa boloñesa + arroz con leche y plátano",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 458,
            "proteina_g": 13,
            "hidratos_g": 88,
            "grasa_g": 6
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: plátano + arroz con leche o tostada",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1000,
            "proteina_g": 40,
            "hidratos_g": 140,
            "grasa_g": 23
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: Postpartido: pasta o arroz con boloñesa y hamburguesa con helado",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 120,
            "proteina_g": 30,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        }
      ]
    },
    "miercoles": {
      "dia": "Miércoles",
      "tipo_dia": "recuperacion",
      "objetivos_totales": {
        "kcal": 2568,
        "proteina_g": 190,
        "hidratos_g": 316,
        "grasa_g": 79
      },
      "ingestas_a_generar": [
        {
          "nombre": "Desayuno",
          "objetivo": {
            "kcal": 559,
            "proteina_g": 43,
            "hidratos_g": 74,
            "grasa_g": 18
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 894,
            "proteina_g": 68,
            "hidratos_g": 111,
            "grasa_g": 29
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 334,
            "proteina_g": 19,
            "hidratos_g": 51,
            "grasa_g": 6
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 781,
            "proteina_g": 60,
            "hidratos_g": 80,
            "grasa_g": 26
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        }
      ]
    },
    "jueves": {
      "dia": "Jueves",
      "tipo_dia": "entreno",
      "objetivos_totales": {
        "kcal": 2805,
        "proteina_g": 166,
        "hidratos_g": 395,
        "grasa_g": 79
      },
      "ingestas_a_generar": [
        {
          "nombre": "Desayuno",
          "objetivo": {
            "kcal": 581,
            "proteina_g": 31,
            "hidratos_g": 93,
            "grasa_g": 18
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 929,
            "proteina_g": 49,
            "hidratos_g": 139,
            "grasa_g": 29
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 362,
            "proteina_g": 14,
            "hidratos_g": 63,
            "grasa_g": 6
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 813,
            "proteina_g": 42,
            "hidratos_g": 100,
            "grasa_g": 26
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 120,
            "proteina_g": 30,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        }
      ]
    },
    "viernes": {
      "dia": "Viernes",
      "tipo_dia": "entreno",
      "objetivos_totales": {
        "kcal": 2805,
        "proteina_g": 166,
        "hidratos_g": 395,
        "grasa_g": 79
      },
      "ingestas_a_generar": [
        {
          "nombre": "Desayuno",
          "objetivo": {
            "kcal": 581,
            "proteina_g": 31,
            "hidratos_g": 93,
            "grasa_g": 18
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 929,
            "proteina_g": 49,
            "hidratos_g": 139,
            "grasa_g": 29
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 362,
            "proteina_g": 14,
            "hidratos_g": 63,
            "grasa_g": 6
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 813,
            "proteina_g": 42,
            "hidratos_g": 100,
            "grasa_g": 26
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija cena de carga pre-partido (24h previas): Salmon con arroz y aguacate",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 120,
            "proteina_g": 30,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        }
      ]
    },
    "sabado": {
      "dia": "Sábado",
      "tipo_dia": "partido",
      "objetivos_totales": {
        "kcal": 3437,
        "proteina_g": 158,
        "hidratos_g": 553,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Desayuno",
          "objetivo": {
            "kcal": 715,
            "proteina_g": 29,
            "hidratos_g": 130,
            "grasa_g": 16
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: fruta y agua",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1144,
            "proteina_g": 46,
            "hidratos_g": 195,
            "grasa_g": 26
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: Arroz con salsa boloñesa + arroz con leche y plátano",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 458,
            "proteina_g": 13,
            "hidratos_g": 88,
            "grasa_g": 6
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: plátano + arroz con leche o tostada",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1000,
            "proteina_g": 40,
            "hidratos_g": 140,
            "grasa_g": 23
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: Postpartido: pasta o arroz con boloñesa y hamburguesa con helado",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 120,
            "proteina_g": 30,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        }
      ]
    },
    "domingo": {
      "dia": "Domingo",
      "tipo_dia": "recuperacion",
      "objetivos_totales": {
        "kcal": 2568,
        "proteina_g": 190,
        "hidratos_g": 316,
        "grasa_g": 79
      },
      "ingestas_a_generar": [
        {
          "nombre": "Desayuno",
          "objetivo": {
            "kcal": 559,
            "proteina_g": 43,
            "hidratos_g": 74,
            "grasa_g": 18
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 894,
            "proteina_g": 68,
            "hidratos_g": 111,
            "grasa_g": 29
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 334,
            "proteina_g": 19,
            "hidratos_g": 51,
            "grasa_g": 6
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 781,
            "proteina_g": 60,
            "hidratos_g": 80,
            "grasa_g": 26
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Propuesta libre: Diseñar un plato variado, saludable y diferente a los otros días de la semana (rotar entre carnes magras, pescados blancos/azules, huevos o legumbres; y entre arroz, pasta, patata, boniato o quinoa).",
          "restricciones_clinicas": "A algunas verduras flatulentas | Cerdo y lentejas",
          "preferencias_jugador": "Le gusta comer algo dulce por la noche"
        }
      ]
    }
  },
  "tabla_composicion_alimentos_100g": {
    "cereales_y_derivados_en_crudo": {
      "arroz_blanco": {
        "hc_g": 78,
        "p_g": 8,
        "g_g": 1,
        "kcal": 355
      },
      "arroz_integral": {
        "hc_g": 74,
        "p_g": 8,
        "g_g": 2.5,
        "kcal": 350
      },
      "pasta_trigo": {
        "hc_g": 75,
        "p_g": 12,
        "g_g": 1.5,
        "kcal": 360
      },
      "copos_avena": {
        "hc_g": 60,
        "p_g": 13,
        "g_g": 7,
        "kcal": 370
      },
      "quinoa": {
        "hc_g": 64,
        "p_g": 14,
        "g_g": 6,
        "kcal": 368
      },
      "pan_blanco": {
        "hc_g": 52,
        "p_g": 8,
        "g_g": 1.5,
        "kcal": 260
      },
      "pan_integral": {
        "hc_g": 45,
        "p_g": 9,
        "g_g": 2,
        "kcal": 245
      },
      "tortas_arroz": {
        "hc_g": 80,
        "p_g": 8,
        "g_g": 2.5,
        "kcal": 380
      },
      "tortas_maiz": {
        "hc_g": 78,
        "p_g": 8,
        "g_g": 3,
        "kcal": 370
      }
    },
    "tuberculos": {
      "patata": {
        "hc_g": 18,
        "p_g": 2,
        "g_g": 0.1,
        "kcal": 80
      },
      "boniato": {
        "hc_g": 21,
        "p_g": 1.6,
        "g_g": 0.1,
        "kcal": 90
      },
      "yuca": {
        "hc_g": 38,
        "p_g": 1.4,
        "g_g": 0.3,
        "kcal": 160
      }
    },
    "legumbres_en_crudo": {
      "lentejas": {
        "hc_g": 54,
        "p_g": 25,
        "g_g": 1.5,
        "kcal": 330
      },
      "garbanzos": {
        "hc_g": 55,
        "p_g": 20,
        "g_g": 6,
        "kcal": 355
      },
      "alubias": {
        "hc_g": 54,
        "p_g": 22,
        "g_g": 1.5,
        "kcal": 320
      }
    },
    "frutas_y_miel": {
      "platano": {
        "hc_g": 21,
        "p_g": 1.2,
        "g_g": 0.2,
        "kcal": 90
      },
      "manzana_pera": {
        "hc_g": 13,
        "p_g": 0.3,
        "g_g": 0.2,
        "kcal": 54
      },
      "naranja_kiwi": {
        "hc_g": 10,
        "p_g": 1,
        "g_g": 0.2,
        "kcal": 45
      },
      "fresas_frutos_rojos": {
        "hc_g": 7,
        "p_g": 0.7,
        "g_g": 0.3,
        "kcal": 35
      },
      "pina_mango": {
        "hc_g": 14,
        "p_g": 0.5,
        "g_g": 0.1,
        "kcal": 58
      },
      "datil": {
        "hc_g": 70,
        "p_g": 2,
        "g_g": 0.2,
        "kcal": 290
      },
      "miel": {
        "hc_g": 82,
        "p_g": 0.3,
        "g_g": 0,
        "kcal": 330
      }
    },
    "carnes_y_aves_en_crudo": {
      "pechuga_pollo_pavo": {
        "hc_g": 0,
        "p_g": 23,
        "g_g": 2,
        "kcal": 110
      },
      "solomillo_ternera_magra": {
        "hc_g": 0,
        "p_g": 22,
        "g_g": 4,
        "kcal": 125
      },
      "lomo_cerdo_magro": {
        "hc_g": 0,
        "p_g": 22,
        "g_g": 5,
        "kcal": 135
      },
      "hamburguesa_ternera_magra": {
        "hc_g": 0,
        "p_g": 21,
        "g_g": 6,
        "kcal": 140
      }
    },
    "pescados_y_mariscos_en_crudo": {
      "pescado_blanco_merluza_bacalao_lubina": {
        "hc_g": 0,
        "p_g": 18,
        "g_g": 1,
        "kcal": 82
      },
      "salmon_fresco": {
        "hc_g": 0,
        "p_g": 20,
        "g_g": 12,
        "kcal": 190
      },
      "atun_fresco": {
        "hc_g": 0,
        "p_g": 23,
        "g_g": 5,
        "kcal": 140
      },
      "atun_lata_al_natural": {
        "hc_g": 0,
        "p_g": 24,
        "g_g": 0.8,
        "kcal": 105
      },
      "gambas_langostinos": {
        "hc_g": 0,
        "p_g": 21,
        "g_g": 1,
        "kcal": 95
      }
    },
    "huevos_y_lacteos": {
      "huevo_entero_unidad_50g": {
        "hc_g": 0.3,
        "p_g": 6.5,
        "g_g": 5,
        "kcal": 75
      },
      "claras_huevo_100g": {
        "hc_g": 0.7,
        "p_g": 11,
        "g_g": 0.1,
        "kcal": 48
      },
      "queso_fresco_batido_0": {
        "hc_g": 4,
        "p_g": 9,
        "g_g": 0.1,
        "kcal": 52
      },
      "yogur_griego_natural": {
        "hc_g": 4,
        "p_g": 9,
        "g_g": 5,
        "kcal": 97
      },
      "yogur_proteico_0": {
        "hc_g": 4,
        "p_g": 10,
        "g_g": 0.1,
        "kcal": 57
      },
      "yogur_natural_sin_lactosa": {
        "hc_g": 4.5,
        "p_g": 4,
        "g_g": 3,
        "kcal": 60
      },
      "yogur_proteico_sin_lactosa": {
        "hc_g": 4,
        "p_g": 10,
        "g_g": 0.1,
        "kcal": 57
      },
      "requeson_desnatado": {
        "hc_g": 3.5,
        "p_g": 12,
        "g_g": 0.5,
        "kcal": 68
      },
      "leche_desnatada_100ml": {
        "hc_g": 5,
        "p_g": 3.4,
        "g_g": 0.2,
        "kcal": 35
      },
      "bebida_avena_soja_100ml": {
        "hc_g": 6,
        "p_g": 1.5,
        "g_g": 1,
        "kcal": 40
      }
    },
    "grasas_y_frutos_secos": {
      "aceite_oliva_virgen_extra_aove": {
        "hc_g": 0,
        "p_g": 0,
        "g_g": 100,
        "kcal": 900
      },
      "aguacate": {
        "hc_g": 2,
        "p_g": 2,
        "g_g": 15,
        "kcal": 160
      },
      "nueces_almendras_avellanas": {
        "hc_g": 10,
        "p_g": 20,
        "g_g": 55,
        "kcal": 610
      },
      "crema_cacahuete_100": {
        "hc_g": 15,
        "p_g": 28,
        "g_g": 50,
        "kcal": 620
      }
    },
    "suplementacion_deportiva": {
      "aislado_proteina_suero_30g_scoop": {
        "hc_g": 1,
        "p_g": 26,
        "g_g": 0.5,
        "kcal": 115
      },
      "ensure_nutricion_entera_unidad": {
        "hc_g": 32,
        "p_g": 9,
        "g_g": 8,
        "kcal": 250
      }
    }
  },
  "reglas_calidad_nutricional_y_variedad": [
    "1. PROTOCOLOS FIJOS OBLIGATORIOS: Si una ingesta tiene \"es_protocolo_fijo: true\" (día de partido, cena de carga pre-partido con Ensure, batido post-entreno o menú de comedor), respeta ESTRICTAMENTE esos alimentos fijados; calcula únicamente los gramos exactos en crudo para cuadrar las macros.",
    "2. MÁXIMA VARIEDAD SEMANAL (PROHIBIDO REPETIR PLATOS): En todos los días y comidas sin protocolo fijo, la semana DEBE ser variada gastronómicamente. ROTA continuamente las fuentes de proteína (alterna ternera magra, pechuga de pollo, solomillo de pavo, lomo de cerdo magro, pescado blanco [merluza, lubina, bacalao], pescado azul [salmón, atún], huevos, legumbres). ROTA las fuentes de carbohidratos (arroz blanco/integral, pasta, patata, boniato, avena, quinoa). PROHIBIDO servir el mismo plato o la misma combinación de proteína e hidrato en días consecutivos.",
    "3. PREFERENCIAS DEL JUGADOR CON ELEVADA VARIABILIDAD: Si el jugador expresa preferencias (ej: \"solo como arroz con pollo\", \"como verdura con carne\"), respeta esa preferencia pero NO hagas platos idénticos todos los días. Varía los cortes/tipos de carne (solomillo, pechuga, carne magra, pavo), rota las verduras de acompañamiento (calabacín, espárragos, zanahoria, brócoli, pimientos, judías verdes) y varía las fuentes de hidrato afines para no caer en la monotonía.",
    "4. SEGURIDAD CLÍNICA TOTAL: Respeta rigurosamente alergias, intolerancias, aversiones y contexto médico del jugador. Jamás incluyas un alimento prohibido o conflictivo.",
    "5. CUADRE MATEMÁTICO EXACTO: Utiliza los valores de la tabla de composición por 100g para calcular con precisión los gramos de cada alimento para cumplir el objetivo de cada ingesta (tolerancia máxima ±5%). Si la carne/pescado no alcanza la proteína marcada, añade complementos proteicos limpios (claras de huevo, yogur proteico/sin lactosa, queso fresco batido, huevo cocido, lata de atún al natural).",
    "6. SOLO INGREDIENTES Y GRAMAJES (SIN MÉTODOS DE COCINADO NI \"EN CRUDO\"): Nombra únicamente los alimentos y sus gramos exactos. PROHIBIDO añadir métodos de cocinado (\"a la plancha\", \"al horno\", \"hervido\") y PROHIBIDO escribir \"(en crudo)\". Ejemplo: \"Arroz blanco 220g, solomillo de ternera 200g, calabacín y zanahoria 150g, AOVE 15g, plátano 150g\".",
    "7. PROHIBIDO RELLENO NARRATIVO Y RESÚMENES NUMÉRICOS: Sin introducciones, sin verbos (\"Prepara...\", \"Añade...\"), sin resúmenes numéricos al final (\"Total:\", \"kcal\", \"P:\"). Directo a los alimentos y gramajes.",
    "8. VERDURAS CONCRETAS: Nombra siempre verduras específicas.",
    "9. NOTAS SEMANALES INTEGRADAS: Genera en el mismo JSON exactamente 4 consejos/indicaciones clave de la semana dirigidos al jugador en segunda persona (\"tú\") de forma cercana y profesional (hidratación, descanso, adherencia a gramajes y pauta específica si hay partido)."
  ]
}
```

---

## Jugador: Gonzalo  Crettaz (ID 236)

```text
INSTRUCCIÓN CRÍTICA:
Devuelve ÚNICAMENTE un objeto JSON válido con las claves "dias" y "notas".
NO incluyas texto explicativo, encabezados Markdown ni introducciones.
ESTRUCTURA DE RESPUESTA OBLIGATORIA:
{
  "dias": {
    "lunes": {
      "ingestas": [
        {
          "nombre": "Nombre de la ingesta",
          "detalle": "Alimentos y gramos exactos en crudo de forma concisa."
        }
      ]
    },
    "martes": { ... },
    "miercoles": { ... },
    "jueves": { ... },
    "viernes": { ... },
    "sabado": { ... },
    "domingo": { ... }
  },
  "notas": [
    "Consejo 1...",
    "Consejo 2...",
    "Consejo 3...",
    "Consejo 4..."
  ]
}

ESPECIFICACIÓN COMPLETA DEL PLAN SEMANAL EN JSON:
{
  "rol": "Carlos Ferrando, nutricionista del Valencia CF",
  "tarea": "Diseñar el menú gastronómico de TODA LA SEMANA (Lunes a Domingo) calculando los gramos exactos en crudo para cumplir las macros fijadas en cada ingesta, garantizando alta variedad gastronómica y respetando estrictamente protocolos fijos, restricciones clínicas y preferencias del jugador.",
  "jugador": {
    "nombre": "Gonzalo  Crettaz",
    "posicion": "Portero",
    "peso_kg": 78.6,
    "objetivo": "Mejora del Rendimiento Deportivo",
    "contexto_clinico": "Principio de SIBO",
    "alergias_intolerancias": "Intolerancias: lactosa y gluten",
    "preferencias": "carne roja"
  },
  "contexto_adicional": "Ajustar a las tolerancias y gustos del jugador",
  "plan_semanal_por_dias": {
    "lunes": {
      "dia": "Lunes",
      "tipo_dia": "entreno",
      "objetivos_totales": {
        "kcal": 2476,
        "proteina_g": 149,
        "hidratos_g": 354,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1225,
            "proteina_g": 62,
            "hidratos_g": 184,
            "grasa_g": 36
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado, le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1131,
            "proteina_g": 57,
            "hidratos_g": 170,
            "grasa_g": 35
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija cena de carga pre-partido (24h previas): patata o boniato y salmon + huevo + vegetales",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 120,
            "proteina_g": 30,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        }
      ]
    },
    "martes": {
      "dia": "Martes",
      "tipo_dia": "partido",
      "objetivos_totales": {
        "kcal": 3340,
        "proteina_g": 145,
        "hidratos_g": 542,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1442,
            "proteina_g": 54,
            "hidratos_g": 237,
            "grasa_g": 33
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: arroz con aguacate + maíz + atún + pollo + fruta",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 450,
            "proteina_g": 12,
            "hidratos_g": 87,
            "grasa_g": 6
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: tortas de arroz con miel y pllátano",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1332,
            "proteina_g": 50,
            "hidratos_g": 218,
            "grasa_g": 32
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 116,
            "proteina_g": 29,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        }
      ]
    },
    "miercoles": {
      "dia": "Miércoles",
      "tipo_dia": "recuperacion",
      "objetivos_totales": {
        "kcal": 2240,
        "proteina_g": 165,
        "hidratos_g": 314,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1165,
            "proteina_g": 86,
            "hidratos_g": 163,
            "grasa_g": 36
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado, le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1075,
            "proteina_g": 79,
            "hidratos_g": 151,
            "grasa_g": 35
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        }
      ]
    },
    "jueves": {
      "dia": "Jueves",
      "tipo_dia": "entreno",
      "objetivos_totales": {
        "kcal": 2476,
        "proteina_g": 149,
        "hidratos_g": 354,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1225,
            "proteina_g": 62,
            "hidratos_g": 184,
            "grasa_g": 36
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado, le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1131,
            "proteina_g": 57,
            "hidratos_g": 170,
            "grasa_g": 35
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 120,
            "proteina_g": 30,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        }
      ]
    },
    "viernes": {
      "dia": "Viernes",
      "tipo_dia": "entreno",
      "objetivos_totales": {
        "kcal": 2476,
        "proteina_g": 149,
        "hidratos_g": 354,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1225,
            "proteina_g": 62,
            "hidratos_g": 184,
            "grasa_g": 36
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado, le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1131,
            "proteina_g": 57,
            "hidratos_g": 170,
            "grasa_g": 35
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija cena de carga pre-partido (24h previas): patata o boniato y salmon + huevo + vegetales",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 120,
            "proteina_g": 30,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        }
      ]
    },
    "sabado": {
      "dia": "Sábado",
      "tipo_dia": "partido",
      "objetivos_totales": {
        "kcal": 3340,
        "proteina_g": 145,
        "hidratos_g": 542,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1442,
            "proteina_g": 54,
            "hidratos_g": 237,
            "grasa_g": 33
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: arroz con aguacate + maíz + atún + pollo + fruta",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Merienda",
          "objetivo": {
            "kcal": 450,
            "proteina_g": 12,
            "hidratos_g": 87,
            "grasa_g": 6
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Pauta fija dia de partido: tortas de arroz con miel y pllátano",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1332,
            "proteina_g": 50,
            "hidratos_g": 218,
            "grasa_g": 32
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Post-entreno",
          "objetivo": {
            "kcal": 116,
            "proteina_g": 29,
            "hidratos_g": 0,
            "grasa_g": 0
          },
          "es_protocolo_fijo": true,
          "base_propuesta": "Batido de proteina de suero en polvo (~30g de proteina pura) disuelto en agua.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        }
      ]
    },
    "domingo": {
      "dia": "Domingo",
      "tipo_dia": "recuperacion",
      "objetivos_totales": {
        "kcal": 2240,
        "proteina_g": 165,
        "hidratos_g": 314,
        "grasa_g": 71
      },
      "ingestas_a_generar": [
        {
          "nombre": "Comida",
          "objetivo": {
            "kcal": 1165,
            "proteina_g": 86,
            "hidratos_g": 163,
            "grasa_g": 36
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado, le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        },
        {
          "nombre": "Cena",
          "objetivo": {
            "kcal": 1075,
            "proteina_g": 79,
            "hidratos_g": 151,
            "grasa_g": 35
          },
          "es_protocolo_fijo": false,
          "base_propuesta": "Preferencia habitual del jugador: \"Variado le gusta comer sano\". Mantén esta base de preferencias pero AUMENTA LA VARIABILIDAD a lo largo de la semana (varía los tipos o cortes de carne magra/pescados afines, diferentes verduras como calabacín, brócoli, espárragos, y fuentes de hidratos compatibles), evitando repetir el mismo plato en días consecutivos.",
          "restricciones_clinicas": "lactosa y gluten",
          "preferencias_jugador": "carne roja"
        }
      ]
    }
  },
  "tabla_composicion_alimentos_100g": {
    "cereales_y_derivados_en_crudo": {
      "arroz_blanco": {
        "hc_g": 78,
        "p_g": 8,
        "g_g": 1,
        "kcal": 355
      },
      "arroz_integral": {
        "hc_g": 74,
        "p_g": 8,
        "g_g": 2.5,
        "kcal": 350
      },
      "pasta_trigo": {
        "hc_g": 75,
        "p_g": 12,
        "g_g": 1.5,
        "kcal": 360
      },
      "copos_avena": {
        "hc_g": 60,
        "p_g": 13,
        "g_g": 7,
        "kcal": 370
      },
      "quinoa": {
        "hc_g": 64,
        "p_g": 14,
        "g_g": 6,
        "kcal": 368
      },
      "pan_blanco": {
        "hc_g": 52,
        "p_g": 8,
        "g_g": 1.5,
        "kcal": 260
      },
      "pan_integral": {
        "hc_g": 45,
        "p_g": 9,
        "g_g": 2,
        "kcal": 245
      },
      "tortas_arroz": {
        "hc_g": 80,
        "p_g": 8,
        "g_g": 2.5,
        "kcal": 380
      },
      "tortas_maiz": {
        "hc_g": 78,
        "p_g": 8,
        "g_g": 3,
        "kcal": 370
      }
    },
    "tuberculos": {
      "patata": {
        "hc_g": 18,
        "p_g": 2,
        "g_g": 0.1,
        "kcal": 80
      },
      "boniato": {
        "hc_g": 21,
        "p_g": 1.6,
        "g_g": 0.1,
        "kcal": 90
      },
      "yuca": {
        "hc_g": 38,
        "p_g": 1.4,
        "g_g": 0.3,
        "kcal": 160
      }
    },
    "legumbres_en_crudo": {
      "lentejas": {
        "hc_g": 54,
        "p_g": 25,
        "g_g": 1.5,
        "kcal": 330
      },
      "garbanzos": {
        "hc_g": 55,
        "p_g": 20,
        "g_g": 6,
        "kcal": 355
      },
      "alubias": {
        "hc_g": 54,
        "p_g": 22,
        "g_g": 1.5,
        "kcal": 320
      }
    },
    "frutas_y_miel": {
      "platano": {
        "hc_g": 21,
        "p_g": 1.2,
        "g_g": 0.2,
        "kcal": 90
      },
      "manzana_pera": {
        "hc_g": 13,
        "p_g": 0.3,
        "g_g": 0.2,
        "kcal": 54
      },
      "naranja_kiwi": {
        "hc_g": 10,
        "p_g": 1,
        "g_g": 0.2,
        "kcal": 45
      },
      "fresas_frutos_rojos": {
        "hc_g": 7,
        "p_g": 0.7,
        "g_g": 0.3,
        "kcal": 35
      },
      "pina_mango": {
        "hc_g": 14,
        "p_g": 0.5,
        "g_g": 0.1,
        "kcal": 58
      },
      "datil": {
        "hc_g": 70,
        "p_g": 2,
        "g_g": 0.2,
        "kcal": 290
      },
      "miel": {
        "hc_g": 82,
        "p_g": 0.3,
        "g_g": 0,
        "kcal": 330
      }
    },
    "carnes_y_aves_en_crudo": {
      "pechuga_pollo_pavo": {
        "hc_g": 0,
        "p_g": 23,
        "g_g": 2,
        "kcal": 110
      },
      "solomillo_ternera_magra": {
        "hc_g": 0,
        "p_g": 22,
        "g_g": 4,
        "kcal": 125
      },
      "lomo_cerdo_magro": {
        "hc_g": 0,
        "p_g": 22,
        "g_g": 5,
        "kcal": 135
      },
      "hamburguesa_ternera_magra": {
        "hc_g": 0,
        "p_g": 21,
        "g_g": 6,
        "kcal": 140
      }
    },
    "pescados_y_mariscos_en_crudo": {
      "pescado_blanco_merluza_bacalao_lubina": {
        "hc_g": 0,
        "p_g": 18,
        "g_g": 1,
        "kcal": 82
      },
      "salmon_fresco": {
        "hc_g": 0,
        "p_g": 20,
        "g_g": 12,
        "kcal": 190
      },
      "atun_fresco": {
        "hc_g": 0,
        "p_g": 23,
        "g_g": 5,
        "kcal": 140
      },
      "atun_lata_al_natural": {
        "hc_g": 0,
        "p_g": 24,
        "g_g": 0.8,
        "kcal": 105
      },
      "gambas_langostinos": {
        "hc_g": 0,
        "p_g": 21,
        "g_g": 1,
        "kcal": 95
      }
    },
    "huevos_y_lacteos": {
      "huevo_entero_unidad_50g": {
        "hc_g": 0.3,
        "p_g": 6.5,
        "g_g": 5,
        "kcal": 75
      },
      "claras_huevo_100g": {
        "hc_g": 0.7,
        "p_g": 11,
        "g_g": 0.1,
        "kcal": 48
      },
      "queso_fresco_batido_0": {
        "hc_g": 4,
        "p_g": 9,
        "g_g": 0.1,
        "kcal": 52
      },
      "yogur_griego_natural": {
        "hc_g": 4,
        "p_g": 9,
        "g_g": 5,
        "kcal": 97
      },
      "yogur_proteico_0": {
        "hc_g": 4,
        "p_g": 10,
        "g_g": 0.1,
        "kcal": 57
      },
      "yogur_natural_sin_lactosa": {
        "hc_g": 4.5,
        "p_g": 4,
        "g_g": 3,
        "kcal": 60
      },
      "yogur_proteico_sin_lactosa": {
        "hc_g": 4,
        "p_g": 10,
        "g_g": 0.1,
        "kcal": 57
      },
      "requeson_desnatado": {
        "hc_g": 3.5,
        "p_g": 12,
        "g_g": 0.5,
        "kcal": 68
      },
      "leche_desnatada_100ml": {
        "hc_g": 5,
        "p_g": 3.4,
        "g_g": 0.2,
        "kcal": 35
      },
      "bebida_avena_soja_100ml": {
        "hc_g": 6,
        "p_g": 1.5,
        "g_g": 1,
        "kcal": 40
      }
    },
    "grasas_y_frutos_secos": {
      "aceite_oliva_virgen_extra_aove": {
        "hc_g": 0,
        "p_g": 0,
        "g_g": 100,
        "kcal": 900
      },
      "aguacate": {
        "hc_g": 2,
        "p_g": 2,
        "g_g": 15,
        "kcal": 160
      },
      "nueces_almendras_avellanas": {
        "hc_g": 10,
        "p_g": 20,
        "g_g": 55,
        "kcal": 610
      },
      "crema_cacahuete_100": {
        "hc_g": 15,
        "p_g": 28,
        "g_g": 50,
        "kcal": 620
      }
    },
    "suplementacion_deportiva": {
      "aislado_proteina_suero_30g_scoop": {
        "hc_g": 1,
        "p_g": 26,
        "g_g": 0.5,
        "kcal": 115
      },
      "ensure_nutricion_entera_unidad": {
        "hc_g": 32,
        "p_g": 9,
        "g_g": 8,
        "kcal": 250
      }
    }
  },
  "reglas_calidad_nutricional_y_variedad": [
    "1. PROTOCOLOS FIJOS OBLIGATORIOS: Si una ingesta tiene \"es_protocolo_fijo: true\" (día de partido, cena de carga pre-partido con Ensure, batido post-entreno o menú de comedor), respeta ESTRICTAMENTE esos alimentos fijados; calcula únicamente los gramos exactos en crudo para cuadrar las macros.",
    "2. MÁXIMA VARIEDAD SEMANAL (PROHIBIDO REPETIR PLATOS): En todos los días y comidas sin protocolo fijo, la semana DEBE ser variada gastronómicamente. ROTA continuamente las fuentes de proteína (alterna ternera magra, pechuga de pollo, solomillo de pavo, lomo de cerdo magro, pescado blanco [merluza, lubina, bacalao], pescado azul [salmón, atún], huevos, legumbres). ROTA las fuentes de carbohidratos (arroz blanco/integral, pasta, patata, boniato, avena, quinoa). PROHIBIDO servir el mismo plato o la misma combinación de proteína e hidrato en días consecutivos.",
    "3. PREFERENCIAS DEL JUGADOR CON ELEVADA VARIABILIDAD: Si el jugador expresa preferencias (ej: \"solo como arroz con pollo\", \"como verdura con carne\"), respeta esa preferencia pero NO hagas platos idénticos todos los días. Varía los cortes/tipos de carne (solomillo, pechuga, carne magra, pavo), rota las verduras de acompañamiento (calabacín, espárragos, zanahoria, brócoli, pimientos, judías verdes) y varía las fuentes de hidrato afines para no caer en la monotonía.",
    "4. SEGURIDAD CLÍNICA TOTAL: Respeta rigurosamente alergias, intolerancias, aversiones y contexto médico del jugador. Jamás incluyas un alimento prohibido o conflictivo.",
    "5. CUADRE MATEMÁTICO EXACTO: Utiliza los valores de la tabla de composición por 100g para calcular con precisión los gramos de cada alimento para cumplir el objetivo de cada ingesta (tolerancia máxima ±5%). Si la carne/pescado no alcanza la proteína marcada, añade complementos proteicos limpios (claras de huevo, yogur proteico/sin lactosa, queso fresco batido, huevo cocido, lata de atún al natural).",
    "6. SOLO INGREDIENTES Y GRAMAJES (SIN MÉTODOS DE COCINADO NI \"EN CRUDO\"): Nombra únicamente los alimentos y sus gramos exactos. PROHIBIDO añadir métodos de cocinado (\"a la plancha\", \"al horno\", \"hervido\") y PROHIBIDO escribir \"(en crudo)\". Ejemplo: \"Arroz blanco 220g, solomillo de ternera 200g, calabacín y zanahoria 150g, AOVE 15g, plátano 150g\".",
    "7. PROHIBIDO RELLENO NARRATIVO Y RESÚMENES NUMÉRICOS: Sin introducciones, sin verbos (\"Prepara...\", \"Añade...\"), sin resúmenes numéricos al final (\"Total:\", \"kcal\", \"P:\"). Directo a los alimentos y gramajes.",
    "8. VERDURAS CONCRETAS: Nombra siempre verduras específicas.",
    "9. NOTAS SEMANALES INTEGRADAS: Genera en el mismo JSON exactamente 4 consejos/indicaciones clave de la semana dirigidos al jugador en segunda persona (\"tú\") de forma cercana y profesional (hidratación, descanso, adherencia a gramajes y pauta específica si hay partido)."
  ]
}
```

---

