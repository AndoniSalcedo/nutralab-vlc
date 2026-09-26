import { z } from 'zod';
import {
  PLAYER_OBJECTIVES,
  NUTRITION_DAY_TYPES,
  AVAILABLE_MEALS,
} from '@/config/nutrition-days';
import { CLINICAL_TAGS } from '@/config/clinical-tags';

const VALID_OBJECTIVES = PLAYER_OBJECTIVES.map((o) => o.value);
const VALID_DAY_TYPES = NUTRITION_DAY_TYPES.map((d) => d.key);
const VALID_CLINICAL_TAGS = CLINICAL_TAGS.map((t) => t.value);

const VALID_CLINICAL_TAGS_SET = new Set(VALID_CLINICAL_TAGS);
const VALID_MEAL_NAMES = new Map(
  AVAILABLE_MEALS.map((m) => [m.value.toLowerCase(), m.value])
);

const dayTypeEnum = z.enum(VALID_DAY_TYPES, {
  errorMap: (issue) => ({
    message:
      issue.code === 'invalid_type' && issue.received === 'undefined'
        ? `El tipo de día es obligatorio (${VALID_DAY_TYPES.join(', ')})`
        : `Tipo de día inválido. Valores permitidos: ${VALID_DAY_TYPES.join(', ')}`,
  }),
});

const calendarioSchema = z
  .object(
    {
      lunes: dayTypeEnum,
      martes: dayTypeEnum,
      miercoles: dayTypeEnum,
      jueves: dayTypeEnum,
      viernes: dayTypeEnum,
      sabado: dayTypeEnum,
      domingo: dayTypeEnum,
    },
    {
      required_error: 'calendario es obligatorio y debe incluir los 7 días de la semana',
      invalid_type_error: 'calendario debe ser un objeto con los 7 días de la semana (lunes a domingo)',
    }
  )
  .strict();

const numComidasSchema = z
  .union(
    [
      z.number().int().min(1).max(5),
      z.string().trim().min(1),
    ],
    {
      required_error: 'num_comidas es obligatorio (número del 1 al 5 o lista de comidas)',
      invalid_type_error: 'num_comidas debe ser un número entero entre 1 y 5 o una cadena con nombres de comidas',
    }
  )
  .superRefine((val, ctx) => {
    if (typeof val === 'number') return;
    const asNumber = Number(val);
    if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 5) return;

    const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'num_comidas debe ser un número entre 1 y 5 o una lista separada por comas (Desayuno, Almuerzo, Comida, Merienda, Cena)',
      });
      return;
    }

    const invalidMeals = parts.filter((p) => !VALID_MEAL_NAMES.has(p.toLowerCase()));
    if (invalidMeals.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Nombres de comida no válidos en num_comidas: ${invalidMeals.join(', ')}. Valores permitidos: 1..5 o ${Array.from(VALID_MEAL_NAMES.values()).join(', ')}`,
      });
    }
  });

const intoleranciasSchema = z
  .union([
    z.array(z.string()),
    z.string(),
  ])
  .optional()
  .default([])
  .superRefine((val, ctx) => {
    const list = Array.isArray(val)
      ? val.map((s) => String(s).trim()).filter(Boolean)
      : String(val || '').split(/[,|;]/).map((s) => s.trim()).filter(Boolean);

    const invalid = list.filter((tag) => !VALID_CLINICAL_TAGS_SET.has(tag));
    if (invalid.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Etiquetas de intolerancias no reconocidas: ${invalid.join(', ')}. Valores permitidos: ${VALID_CLINICAL_TAGS.join(', ')}`,
      });
    }
  });

const aversionesSchema = z
  .union([
    z.array(z.string()),
    z.string(),
  ])
  .optional()
  .default([]);

export const externalPlanRequestSchema = z
  .object({
    peso_kg: z
      .number({
        required_error: 'peso_kg es obligatorio',
        invalid_type_error: 'peso_kg debe ser un número positivo (ej. 75)',
      })
      .positive('peso_kg debe ser mayor que 0')
      .max(300, 'peso_kg no puede superar 300 kg'),
    objetivo: z.enum(VALID_OBJECTIVES, {
      errorMap: (issue) => ({
        message:
          issue.code === 'invalid_type' && issue.received === 'undefined'
            ? 'objetivo es obligatorio'
            : `objetivo inválido. Valores permitidos: ${VALID_OBJECTIVES.join(', ')}`,
      }),
    }),
    num_comidas: numComidasSchema,
    calendario: calendarioSchema,
    postentreno: z
      .boolean({
        invalid_type_error: 'postentreno debe ser un valor booleano (true o false)',
      })
      .optional()
      .default(false),
    intolerancias: intoleranciasSchema,
    aversiones: aversionesSchema,
  })
  .strict();

export function normalizeNumComidas(value) {
  if (typeof value === 'number') return String(value);
  const trimmed = String(value).trim();
  const asNum = Number(trimmed);
  if (Number.isInteger(asNum) && asNum >= 1 && asNum <= 5) {
    return String(asNum);
  }
  return trimmed
    .split(',')
    .map((part) => VALID_MEAL_NAMES.get(part.trim().toLowerCase()))
    .filter(Boolean)
    .join(', ');
}

export function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,|;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
