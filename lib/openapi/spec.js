import {
  PLAYER_OBJECTIVES,
  NUTRITION_DAY_TYPES,
  AVAILABLE_MEALS,
} from '@/config/nutrition-days';
import { CLINICAL_TAGS } from '@/config/clinical-tags';

export function buildOpenApiSpec() {
  const objectiveValues = PLAYER_OBJECTIVES.map((o) => o.value);
  const objectiveDescriptions = PLAYER_OBJECTIVES.map(
    (o) => `- \`${o.value}\`: ${o.label}`
  ).join('\n');

  const dayTypeValues = NUTRITION_DAY_TYPES.map((d) => d.key);
  const dayTypeDescriptions = NUTRITION_DAY_TYPES.map(
    (d) => `- \`${d.key}\`: ${d.label}`
  ).join('\n');

  const clinicalTagValues = CLINICAL_TAGS.map((t) => t.value);
  const clinicalTagDescriptions = CLINICAL_TAGS.map(
    (t) => `- \`${t.value}\`: ${t.shortLabel} (${t.description})`
  ).join('\n');

  const availableMealsList = AVAILABLE_MEALS.map((m) => m.value).join(', ');

  return {
    openapi: '3.0.3',
    info: {
      title: 'Nutralab VLC · API Externa',
      version: '1.0.0',
      description:
        'API externa de **Nutralab VLC** para la generación de planes nutricionales semanales personalizados.\n\n' +
        'Permite obtener la planificación completa de comidas, gramajes en crudo, distribución calórica y macronutrientes para los 7 días de la semana a partir del peso corporal, objetivo físico, número de tomas y restricciones alimentarias.',
    },
    servers: [
      {
        url: '/',
        description: 'Servidor actual (Nutralab VLC)',
      },
    ],
    tags: [
      {
        name: 'Planes Nutricionales',
        description: 'Generación de planes nutricionales semanales para usuarios externos',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Token de API enviado como `Authorization: Bearer <EXTERNAL_API_KEY>`',
        },
      },
      schemas: {
        DayType: {
          type: 'string',
          enum: dayTypeValues,
          description: `Tipo de carga física del día:\n${dayTypeDescriptions}`,
          example: 'entreno',
        },
        CalendarioSemanal: {
          type: 'object',
          required: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
          additionalProperties: false,
          description: 'Planificación obligatoria del tipo de jornada para cada día de la semana.',
          properties: {
            lunes: { $ref: '#/components/schemas/DayType' },
            martes: { $ref: '#/components/schemas/DayType' },
            miercoles: { $ref: '#/components/schemas/DayType' },
            jueves: { $ref: '#/components/schemas/DayType' },
            viernes: { $ref: '#/components/schemas/DayType' },
            sabado: { $ref: '#/components/schemas/DayType' },
            domingo: { $ref: '#/components/schemas/DayType' },
          },
          example: {
            lunes: 'entreno',
            martes: 'entreno',
            miercoles: 'descanso',
            jueves: 'entreno',
            viernes: 'entreno',
            sabado: 'partido',
            domingo: 'recuperacion',
          },
        },
        ClinicalTag: {
          type: 'string',
          enum: clinicalTagValues,
          description: `Etiqueta clínica o restricción alimentaria canónica:\n${clinicalTagDescriptions}`,
        },
        PlanRequest: {
          type: 'object',
          required: ['peso_kg', 'objetivo', 'num_comidas', 'calendario'],
          additionalProperties: false,
          properties: {
            peso_kg: {
              type: 'number',
              minimum: 1,
              maximum: 300,
              description: 'Peso corporal del usuario en kilogramos (> 0). Base para el cálculo de calorías y macronutrientes.',
              example: 75,
            },
            objetivo: {
              type: 'string',
              enum: objectiveValues,
              description: `Objetivo nutricional del plan:\n${objectiveDescriptions}`,
              example: 'mejora_rendimiento',
            },
            num_comidas: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              default: 4,
              description:
                'Número de comidas principales al día (1 a 5). También admite lista separada por comas entre: ' + availableMealsList,
              example: 4,
            },
            calendario: {
              $ref: '#/components/schemas/CalendarioSemanal',
            },
            postentreno: {
              type: 'boolean',
              default: false,
              description: 'Si es `true`, añade automáticamente la toma Post-entreno en días de entrenamiento o competición.',
              example: true,
            },
            intolerancias: {
              type: 'array',
              items: { $ref: '#/components/schemas/ClinicalTag' },
              default: [],
              description: `Restricciones clínicas, alergias o intolerancias:\n${clinicalTagDescriptions}`,
              example: ['sin_lactosa'],
            },
            aversiones: {
              type: 'array',
              items: { type: 'string' },
              default: [],
              description: 'Lista de alimentos específicos que el usuario prefiere evitar (ej. ["salmón", "brócoli"]).',
              example: ['salmón', 'brócoli'],
            },
          },
        },
        MacroTotals: {
          type: 'object',
          description: 'Desglose de calorías y macronutrientes.',
          properties: {
            kcal: { type: 'integer', example: 2405, description: 'Calorías totales (kcal)' },
            proteina: { type: 'integer', example: 152, description: 'Proteínas (g)' },
            hidratos: { type: 'integer', example: 298, description: 'Carbohidratos (g)' },
            grasa: { type: 'integer', example: 66, description: 'Grasas (g)' },
          },
        },
        Ingesta: {
          type: 'object',
          description: 'Comida individual del día con alimentos, gramajes y macronutrientes.',
          properties: {
            nombre: { type: 'string', example: 'Desayuno' },
            detalle: {
              type: 'string',
              example: 'Tostadas de pan integral (80g), Jamón serrano (60g), AOVE (10g), Manzana (150g)',
            },
            macros: {
              $ref: '#/components/schemas/MacroTotals',
            },
          },
        },
        DiaPlan: {
          type: 'object',
          description: 'Planificación nutricional completa para un día.',
          properties: {
            label: { type: 'string', example: 'Lunes' },
            tipoDia: { $ref: '#/components/schemas/DayType' },
            kcal: { type: 'integer', example: 2400, description: 'Objetivo calórico del día (kcal)' },
            proteina: { type: 'integer', example: 150, description: 'Objetivo de proteínas (g)' },
            hidratos: { type: 'integer', example: 300, description: 'Objetivo de carbohidratos (g)' },
            grasa: { type: 'integer', example: 65, description: 'Objetivo de grasas (g)' },
            macrosTotales: {
              $ref: '#/components/schemas/MacroTotals',
              description: 'Macronutrientes reales calculados de la suma de todas las ingestas del día.',
            },
            ingestas: {
              type: 'array',
              items: { $ref: '#/components/schemas/Ingesta' },
            },
          },
        },
        PlanResponse: {
          type: 'object',
          description: 'Respuesta con el plan nutricional semanal completo.',
          properties: {
            ok: { type: 'boolean', example: true },
            plan: {
              type: 'object',
              properties: {
                nombre: { type: 'string', example: 'Plan Nutricional' },
                fecha: { type: 'string', format: 'date-time', example: '2026-09-26T14:30:00.000Z' },
                usuario: {
                  type: 'object',
                  properties: {
                    peso_kg: { type: 'number', example: 75 },
                    objetivo: { type: 'string', example: 'mejora_rendimiento' },
                    num_comidas: { type: 'string', example: '4' },
                    postentreno: { type: 'boolean', example: true },
                  },
                },
                dias: {
                  type: 'object',
                  properties: {
                    lunes: { $ref: '#/components/schemas/DiaPlan' },
                    martes: { $ref: '#/components/schemas/DiaPlan' },
                    miercoles: { $ref: '#/components/schemas/DiaPlan' },
                    jueves: { $ref: '#/components/schemas/DiaPlan' },
                    viernes: { $ref: '#/components/schemas/DiaPlan' },
                    sabado: { $ref: '#/components/schemas/DiaPlan' },
                    domingo: { $ref: '#/components/schemas/DiaPlan' },
                  },
                },
                notas: {
                  type: 'array',
                  items: { type: 'string' },
                  example: [
                    'Ajusta la hidratación según la intensidad de la sesión y la sudoración.',
                    'Respeta los gramajes en crudo indicados para cada comida.',
                    'Toma el batido post-entreno en los primeros 30 minutos tras finalizar la sesión.',
                    'Mantén las pautas de descanso nocturno y digestión adecuada.',
                  ],
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Parámetros de entrada inválidos' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'peso_kg' },
                  message: { type: 'string', example: 'peso_kg es obligatorio' },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      '/api/external/v1/plan': {
        post: {
          tags: ['Planes Nutricionales'],
          summary: 'Generar plan nutricional semanal personalizado',
          description:
            'Genera la planificación nutricional de los 7 días de la semana adaptada al peso, objetivo, calendario y restricciones del usuario.\n\n' +
            'Requiere autenticación mediante token de API (`Authorization: Bearer <EXTERNAL_API_KEY>`).',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PlanRequest',
                },
                examples: {
                  rendimiento_estandar: {
                    summary: '1. Rendimiento deportivo (75 kg, 4 comidas + post-entreno)',
                    value: {
                      peso_kg: 75,
                      objetivo: 'mejora_rendimiento',
                      num_comidas: 4,
                      postentreno: true,
                      calendario: {
                        lunes: 'entreno',
                        martes: 'entreno',
                        miercoles: 'descanso',
                        jueves: 'entreno',
                        viernes: 'entreno',
                        sabado: 'partido',
                        domingo: 'recuperacion',
                      },
                      intolerancias: [],
                      aversiones: [],
                    },
                  },
                  perdida_grasa_restricciones: {
                    summary: '2. Pérdida de grasa con intolerancia a lactosa y sin gluten',
                    value: {
                      peso_kg: 68.5,
                      objetivo: 'perdida_grasa',
                      num_comidas: 3,
                      postentreno: false,
                      calendario: {
                        lunes: 'entreno',
                        martes: 'descanso',
                        miercoles: 'entreno',
                        jueves: 'descanso',
                        viernes: 'entreno',
                        sabado: 'doble',
                        domingo: 'descanso',
                      },
                      intolerancias: ['sin_lactosa', 'sin_gluten'],
                      aversiones: ['salmón', 'brócoli'],
                    },
                  },
                  ganancia_muscular_vegano: {
                    summary: '3. Ganancia muscular (Dieta Vegana, 5 comidas + post-entreno)',
                    value: {
                      peso_kg: 80,
                      objetivo: 'ganancia_musculo',
                      num_comidas: 5,
                      postentreno: true,
                      calendario: {
                        lunes: 'entreno',
                        martes: 'doble',
                        miercoles: 'recuperacion',
                        jueves: 'entreno',
                        viernes: 'entreno',
                        sabado: 'entreno',
                        domingo: 'descanso',
                      },
                      intolerancias: ['vegano'],
                      aversiones: [],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Plan nutricional semanal generado correctamente.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PlanResponse',
                  },
                  example: {
                    ok: true,
                    plan: {
                      nombre: 'Plan Nutricional',
                      fecha: '2026-09-26T14:30:00.000Z',
                      usuario: {
                        peso_kg: 75,
                        objetivo: 'mejora_rendimiento',
                        num_comidas: '4',
                        postentreno: true,
                      },
                      dias: {
                        lunes: {
                          label: 'Lunes',
                          tipoDia: 'entreno',
                          kcal: 2400,
                          proteina: 150,
                          hidratos: 300,
                          grasa: 65,
                          macrosTotales: {
                            kcal: 2405,
                            proteina: 152,
                            hidratos: 298,
                            grasa: 66,
                          },
                          ingestas: [
                            {
                              nombre: 'Desayuno',
                              detalle: 'Tostadas de pan integral (80g), Jamón serrano (60g), AOVE (10g), Manzana (150g)',
                              macros: { kcal: 490, proteina: 28, hidratos: 55, grasa: 16 },
                            },
                            {
                              nombre: 'Almuerzo',
                              detalle: 'Yogur natural (125g), Nueces (20g), Plátano (100g)',
                              macros: { kcal: 280, proteina: 9, hidratos: 35, grasa: 12 },
                            },
                            {
                              nombre: 'Comida',
                              detalle: 'Arroz blanco (140g), Pechuga de pollo (200g), Calabacín (150g), AOVE (15g)',
                              macros: { kcal: 780, proteina: 55, hidratos: 98, grasa: 18 },
                            },
                            {
                              nombre: 'Post-entreno',
                              detalle: 'Batido de proteína whey (30g), Plátano (100g)',
                              macros: { kcal: 210, proteina: 25, hidratos: 24, grasa: 1 },
                            },
                            {
                              nombre: 'Cena',
                              detalle: 'Patata cocida (250g), Salmón fresco (180g), Ensalada mixta (150g), AOVE (15g)',
                              macros: { kcal: 645, proteina: 35, hidratos: 50, grasa: 19 },
                            },
                          ],
                        },
                        martes: {
                          label: 'Martes',
                          tipoDia: 'entreno',
                          kcal: 2400,
                          proteina: 150,
                          hidratos: 300,
                          grasa: 65,
                          macrosTotales: {
                            kcal: 2390,
                            proteina: 149,
                            hidratos: 302,
                            grasa: 64,
                          },
                          ingestas: [
                            {
                              nombre: 'Desayuno',
                              detalle: 'Huevos revueltos (2 uds), Pan de centeno (80g), AOVE (10g), Naranja (150g)',
                              macros: { kcal: 510, proteina: 26, hidratos: 52, grasa: 21 },
                            },
                            {
                              nombre: 'Comida',
                              detalle: 'Pasta blanca (130g), Lomo de merluza (220g), Judías verdes (150g), AOVE (15g)',
                              macros: { kcal: 790, proteina: 54, hidratos: 100, grasa: 18 },
                            },
                            {
                              nombre: 'Cena',
                              detalle: 'Boniato al horno (220g), Pechuga de pavo (200g), Espárragos trigueros (150g), AOVE (15g)',
                              macros: { kcal: 630, proteina: 48, hidratos: 56, grasa: 17 },
                            },
                          ],
                        },
                        miercoles: {
                          label: 'Miércoles',
                          tipoDia: 'descanso',
                          kcal: 2050,
                          proteina: 140,
                          hidratos: 220,
                          grasa: 65,
                          macrosTotales: {
                            kcal: 2045,
                            proteina: 141,
                            hidratos: 218,
                            grasa: 66,
                          },
                          ingestas: [
                            {
                              nombre: 'Desayuno',
                              detalle: 'Bowl de copos de avena (60g), Yogur natural (125g), Arándanos (80g), Nueces (15g)',
                              macros: { kcal: 460, proteina: 20, hidratos: 58, grasa: 16 },
                            },
                            {
                              nombre: 'Comida',
                              detalle: 'Lentejas cocidas (250g), Solomillo de ternera (180g), Ensalada de tomate (150g), AOVE (15g)',
                              macros: { kcal: 780, proteina: 58, hidratos: 68, grasa: 22 },
                            },
                            {
                              nombre: 'Cena',
                              detalle: 'Crema de calabaza (250g), Lubina a la plancha (200g), AOVE (10g)',
                              macros: { kcal: 520, proteina: 42, hidratos: 30, grasa: 18 },
                            },
                          ],
                        },
                        jueves: {
                          label: 'Jueves',
                          tipoDia: 'entreno',
                          kcal: 2400,
                          proteina: 150,
                          hidratos: 300,
                          grasa: 65,
                          macrosTotales: {
                            kcal: 2410,
                            proteina: 151,
                            hidratos: 299,
                            grasa: 66,
                          },
                          ingestas: [
                            {
                              nombre: 'Desayuno',
                              detalle: 'Tostadas de pan integral (80g), Queso fresco batido (150g), Miel (15g), Plátano (100g)',
                              macros: { kcal: 480, proteina: 22, hidratos: 75, grasa: 8 },
                            },
                            {
                              nombre: 'Comida',
                              detalle: 'Arroz jazmín (140g), Pechuga de pollo (200g), Brócoli al vapor (150g), AOVE (15g)',
                              macros: { kcal: 780, proteina: 55, hidratos: 98, grasa: 18 },
                            },
                            {
                              nombre: 'Cena',
                              detalle: 'Patata cocida (250g), Atún claro al natural (160g), Zanahoria (100g), AOVE (15g)',
                              macros: { kcal: 620, proteina: 48, hidratos: 52, grasa: 17 },
                            },
                          ],
                        },
                        viernes: {
                          label: 'Viernes',
                          tipoDia: 'entreno',
                          kcal: 2400,
                          proteina: 150,
                          hidratos: 300,
                          grasa: 65,
                          macrosTotales: {
                            kcal: 2395,
                            proteina: 150,
                            hidratos: 301,
                            grasa: 65,
                          },
                          ingestas: [
                            {
                              nombre: 'Desayuno',
                              detalle: 'Tostadas con aceite y pavo en lonchas (80g pan, 70g pavo, 10g AOVE), Kiwi (100g)',
                              macros: { kcal: 470, proteina: 26, hidratos: 52, grasa: 15 },
                            },
                            {
                              nombre: 'Comida',
                              detalle: 'Quinoa cocida (220g), Salmón a la plancha (180g), Espinacas (150g), AOVE (10g)',
                              macros: { kcal: 790, proteina: 50, hidratos: 72, grasa: 28 },
                            },
                            {
                              nombre: 'Cena',
                              detalle: 'Tortilla francesa (2 huevos), Pan de molde integral (60g), Ensalada verde (150g), AOVE (10g)',
                              macros: { kcal: 540, proteina: 28, hidratos: 40, grasa: 24 },
                            },
                          ],
                        },
                        sabado: {
                          label: 'Sábado',
                          tipoDia: 'partido',
                          kcal: 2650,
                          proteina: 155,
                          hidratos: 360,
                          grasa: 65,
                          macrosTotales: {
                            kcal: 2640,
                            proteina: 154,
                            hidratos: 358,
                            grasa: 65,
                          },
                          ingestas: [
                            {
                              nombre: 'Desayuno pre-partido',
                              detalle: 'Pan blanco tostado (100g), Mermelada (30g), Pavo (50g), Plátano maduro (120g)',
                              macros: { kcal: 550, proteina: 22, hidratos: 98, grasa: 6 },
                            },
                            {
                              nombre: 'Comida pre-partido',
                              detalle: 'Arroz blanco cocido (180g), Pechuga de pollo hervida (180g), AOVE (10g)',
                              macros: { kcal: 850, proteina: 52, hidratos: 120, grasa: 14 },
                            },
                            {
                              nombre: 'Post-partido',
                              detalle: 'Batido recovery de carbohidratos y proteína (4:1)',
                              macros: { kcal: 320, proteina: 20, hidratos: 60, grasa: 0 },
                            },
                            {
                              nombre: 'Cena',
                              detalle: 'Boniato asado (250g), Dorada al horno (200g), Calabacín a la plancha (150g), AOVE (15g)',
                              macros: { kcal: 650, proteina: 44, hidratos: 62, grasa: 18 },
                            },
                          ],
                        },
                        domingo: {
                          label: 'Domingo',
                          tipoDia: 'recuperacion',
                          kcal: 2150,
                          proteina: 145,
                          hidratos: 240,
                          grasa: 65,
                          macrosTotales: {
                            kcal: 2160,
                            proteina: 146,
                            hidratos: 238,
                            grasa: 66,
                          },
                          ingestas: [
                            {
                              nombre: 'Desayuno',
                              detalle: 'Bowl de avena con bebida de almendra (60g avena, 200ml bebida), Frutos rojos (100g), Nueces (15g)',
                              macros: { kcal: 450, proteina: 16, hidratos: 62, grasa: 14 },
                            },
                            {
                              nombre: 'Comida',
                              detalle: 'Guiso de garbanzos con verduras (250g), Pollo desmigado (180g), AOVE (15g)',
                              macros: { kcal: 790, proteina: 56, hidratos: 74, grasa: 22 },
                            },
                            {
                              nombre: 'Cena',
                              detalle: 'Sopa de fideos (200g), Pescado blanco al vapor (200g), AOVE (10g)',
                              macros: { kcal: 510, proteina: 40, hidratos: 45, grasa: 14 },
                            },
                          ],
                        },
                      },
                      notas: [
                        'Ajusta la hidratación según la intensidad de la sesión y la sudoración.',
                        'Respeta los gramajes en crudo indicados para cada comida.',
                        'Toma el batido post-entreno en los primeros 30 minutos tras finalizar la sesión.',
                        'Mantén las pautas de descanso nocturno y digestión adecuada.',
                      ],
                    },
                  },
                },
              },
            },
            400: {
              description: 'Error de validación en los parámetros enviados.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            401: {
              description: 'No autorizado (token no proporcionado o inválido).',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            500: {
              description: 'Error interno del servidor o falta de configuración del token.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
