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
      title: 'Nutralab VLC · API Externa (Hybrid)',
      version: '1.0.0',
      description:
        'API externa de **Nutralab VLC** para la generación determinista de planes nutricionales semanales para usuarios externos no registrados (**Hybrid**).\n\n' +
        '### Características del motor en esta ruta\n' +
        '- **Sin registro en base de datos**: procesa los parámetros del deportista en memoria.\n' +
        '- **Sin menú de comedor y sin ingestas personalizadas**: resuelve automáticamente el Árbol Taxonómico de Alimentos en crudo (`FOODS_CRUDO`) aplicando rotación semanal inteligente y calibración matemática en múltiplos de 5g.\n' +
        '- **Facturación integrada (`API_HYBRID`)**: cada generación exitosa registra automáticamente el evento de consumo bajo el tenant `Hybrid` en `nutralab-billing`.',
    },
    servers: [
      {
        url: '/',
        description: 'Servidor actual (Nutralab VLC)',
      },
    ],
    tags: [
      {
        name: 'Hybrid Diet Engine',
        description: 'Generación de planes nutricionales semanales para usuarios externos mediante token fijo',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Token fijo configurado en `EXTERNAL_API_KEY` enviado como `Authorization: Bearer <token>`',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Token fijo configurado en `EXTERNAL_API_KEY` enviado en la cabecera `x-api-key`',
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
          description: 'Planificación obligatoria de los 7 días de la semana.',
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
        HybridPlanRequest: {
          type: 'object',
          required: ['peso_kg', 'objetivo', 'num_comidas', 'calendario'],
          additionalProperties: false,
          properties: {
            peso_kg: {
              type: 'number',
              minimum: 1,
              maximum: 300,
              description: 'Peso corporal del usuario en kilogramos (> 0). Base matemática para el cálculo de kcal, macronutrientes (g/kg) e hidratación.',
              example: 75,
            },
            objetivo: {
              type: 'string',
              enum: objectiveValues,
              description: `Objetivo nutricional del plan:\n${objectiveDescriptions}`,
              example: 'mejora_rendimiento',
            },
            num_comidas: {
              oneOf: [
                {
                  type: 'integer',
                  minimum: 1,
                  maximum: 5,
                  description:
                    'Número de comidas diarias:\n' +
                    '- `1`: Comida\n' +
                    '- `2`: Comida, Cena\n' +
                    '- `3`: Desayuno, Comida, Cena\n' +
                    '- `4`: Desayuno, Almuerzo, Comida, Cena\n' +
                    '- `5`: Desayuno, Almuerzo, Comida, Merienda, Cena',
                },
                {
                  type: 'string',
                  description: `Lista de ingestas separada por comas entre: ${availableMealsList}`,
                },
              ],
              description: 'Estructura de comidas principales al día (1 a 5 o lista separada por comas).',
              example: 4,
            },
            calendario: {
              $ref: '#/components/schemas/CalendarioSemanal',
            },
            postentreno: {
              type: 'boolean',
              default: false,
              description: 'Si es `true`, añade automáticamente la toma `Post-entreno` (batido de proteína o recovery) en los días de tipo `entreno`, `doble` o `partido`.',
              example: true,
            },
            intolerancias: {
              oneOf: [
                {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ClinicalTag' },
                },
                {
                  type: 'string',
                  description: 'Etiquetas clínicas separadas por comas (ej. `"sin_lactosa, sin_gluten"`).',
                },
              ],
              default: [],
              description: `Restricciones clínicas, alergias o intolerancias que filtran estrictamente el catálogo de alimentos:\n${clinicalTagDescriptions}`,
              example: ['sin_lactosa'],
            },
            aversiones: {
              oneOf: [
                {
                  type: 'array',
                  items: { type: 'string' },
                },
                {
                  type: 'string',
                  description: 'Alimentos separados por comas (ej. `"salmón, brócoli"`).',
                },
              ],
              default: [],
              description: 'Lista opcional de alimentos específicos que el usuario prefiere evitar.',
              example: ['salmón', 'brócoli'],
            },
          },
        },
        MacroTotals: {
          type: 'object',
          properties: {
            kcal: { type: 'integer', example: 2374 },
            proteina: { type: 'integer', example: 143 },
            hidratos: { type: 'integer', example: 338 },
            grasa: { type: 'integer', example: 68 },
          },
        },
        IngestaResuelta: {
          type: 'object',
          properties: {
            nombre: { type: 'string', example: 'Comida' },
            detalle: {
              type: 'string',
              example: 'Arroz blanco (145g), Pechuga de pollo (195g), Calabacín (150g), Plátano (120g), AOVE (15g)',
            },
            macrosReales: {
              $ref: '#/components/schemas/MacroTotals',
            },
          },
        },
        DiaPlanResuelto: {
          type: 'object',
          properties: {
            dayKey: { type: 'string', example: 'lunes' },
            label: { type: 'string', example: 'Lunes' },
            tipoDia: { $ref: '#/components/schemas/DayType' },
            kcal: { type: 'integer', example: 2374 },
            proteina: { type: 'integer', example: 143 },
            hidratos: { type: 'integer', example: 338 },
            grasa: { type: 'integer', example: 68 },
            ingestas: {
              type: 'array',
              items: { $ref: '#/components/schemas/IngestaResuelta' },
            },
            macrosReales: { $ref: '#/components/schemas/MacroTotals' },
            desviacionMacros: { $ref: '#/components/schemas/MacroTotals' },
            cierreMacros: {
              type: 'object',
              properties: {
                estado: { type: 'string', enum: ['completo', 'parcial'], example: 'completo' },
                ingestasCalculadas: { type: 'integer', example: 5 },
                ingestasTotales: { type: 'integer', example: 5 },
              },
            },
          },
        },
        HybridPlanResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            plan: {
              type: 'object',
              properties: {
                version: { type: 'integer', example: 2 },
                meta: {
                  type: 'object',
                  properties: {
                    nombre: { type: 'string', example: 'Plan Nutricional Hybrid' },
                    semanaMenu: { type: 'string', nullable: true, example: null },
                    preMatchConfig: { type: 'object', nullable: true, example: null },
                    fecha: { type: 'string', format: 'date-time' },
                    engine: { type: 'string', example: 'deterministic_food_tree' },
                  },
                },
                jugador: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', nullable: true, example: null },
                    nombre: { type: 'string', example: 'Usuario Hybrid' },
                    posicion: { type: 'string', example: 'Deportista' },
                    num_comidas: { type: 'string', example: '4' },
                    postentreno: { type: 'boolean', example: true },
                    objetivo: { type: 'string', example: 'mejora_rendimiento' },
                  },
                },
                metricas: {
                  type: 'object',
                  properties: {
                    peso: { type: 'number', example: 75 },
                    grasa: { type: 'number', nullable: true, example: null },
                    masaMagra: { type: 'number', nullable: true, example: null },
                    pesoMuscular: { type: 'number', nullable: true, example: null },
                  },
                },
                dias: {
                  type: 'object',
                  properties: {
                    lunes: { $ref: '#/components/schemas/DiaPlanResuelto' },
                    martes: { $ref: '#/components/schemas/DiaPlanResuelto' },
                    miercoles: { $ref: '#/components/schemas/DiaPlanResuelto' },
                    jueves: { $ref: '#/components/schemas/DiaPlanResuelto' },
                    viernes: { $ref: '#/components/schemas/DiaPlanResuelto' },
                    sabado: { $ref: '#/components/schemas/DiaPlanResuelto' },
                    domingo: { $ref: '#/components/schemas/DiaPlanResuelto' },
                  },
                },
                notas: {
                  type: 'array',
                  items: { type: 'string' },
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
      '/api/external/hybrid/plan': {
        post: {
          tags: ['Hybrid Diet Engine'],
          summary: 'Generar plan nutricional semanal (sin menú y sin ingestas personalizadas)',
          description:
            'Requiere autenticación mediante token fijo (`Authorization: Bearer <EXTERNAL_API_KEY>` o `x-api-key: <EXTERNAL_API_KEY>`). Cada ejecución registra un evento `API_HYBRID` en el servicio de facturación.',
          security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HybridPlanRequest',
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
                    $ref: '#/components/schemas/HybridPlanResponse',
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
