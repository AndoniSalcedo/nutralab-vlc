import { useMemo } from 'react';
import { AspectRatio, Badge, Box, Button, Group, Image, Paper, Stack, Text } from "@mantine/core";
import { IconClock, IconEdit, IconFlame, IconNotes, IconTrash } from "@tabler/icons-react";
import MealCardSkeleton from "@/components/skeletons/MealCardSkeleton";
import foods from "@/data/foods";

const calcNutrient = (food, grams, key) => {
  const value = Number(food?.[key]);
  const qty = Number(grams);
  if (!Number.isFinite(value) || !Number.isFinite(qty)) return 0;
  return (value * qty) / 100;
};

const roundMacro = (value) => Math.round(value * 10) / 10;

const MEAL_META = {
  breakfast: { label: 'Desayuno', emoji: '🍳', color: 'blue' },
  midMorning: { label: 'Almuerzo', emoji: '🥪', color: 'teal' },
  lunch: { label: 'Comida', emoji: '🍽️', color: 'green' },
  snack: { label: 'Merienda', emoji: '🧁', color: 'pink' },
  dinner: { label: 'Cena', emoji: '🍲', color: 'grape' },
  lateSnack: { label: 'Re-cena', emoji: '🌙', color: 'indigo' },
};

function metaFor(mealType) {
  return MEAL_META[mealType] || { label: mealType || '—', emoji: '🥗', color: 'gray' };
}

export default function MealCard({ m, onOpen, onEdit, onDelete }) {
  const { label, emoji, color } = metaFor(m.mealType);
  const time = new Date(m.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const title = (m.dishName || '').trim() || label;

  const displayIngredients = Array.isArray(m.ingredients) ? m.ingredients : [];
  const ingredientsText = displayIngredients.length > 0 
    ? displayIngredients.join(', ') 
    : null;

  const calculatedMacros = useMemo(() => {
    let pro = 0;
    let cho = 0;
    let fat = 0;
    let parsedCount = 0;

    const displayIngredients = Array.isArray(m.ingredients) ? m.ingredients : [];

    for (const ingredientStr of displayIngredients) {
      const match = ingredientStr.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*g\)$/i);
      if (match) {
        const foodName = match[1].trim();
        const grams = parseFloat(match[2]);
        const foundFood = foods.find(f => f.name.toLowerCase() === foodName.toLowerCase());
        if (foundFood && !isNaN(grams)) {
          pro += calcNutrient(foundFood, grams, 'pro');
          cho += calcNutrient(foundFood, grams, 'cho');
          fat += calcNutrient(foundFood, grams, 'fat');
          parsedCount++;
        }
      }
    }

    if (parsedCount === 0) return null;
    return {
      pro: roundMacro(pro),
      cho: roundMacro(cho),
      fat: roundMacro(fat),
    };
  }, [m.ingredients]);

  return (
    <Paper
      withBorder
      shadow="md"
      radius="xl"
      p={0}
      style={{
        overflow: 'hidden',
        cursor: m.photoUrl ? 'pointer' : 'default',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        backgroundColor: 'var(--mantine-color-white)',
        borderColor: 'var(--mantine-color-gray-2)',
        boxShadow: '0 12px 30px rgba(17, 24, 39, 0.06)',
      }}
      onClick={() => m.photoUrl && onOpen?.()}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.99)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={(e) => {
         e.currentTarget.style.transform = 'scale(1)';
         e.currentTarget.style.boxShadow = '0 12px 30px rgba(17, 24, 39, 0.06)';
      }}
      onMouseEnter={(e) => {
         e.currentTarget.style.boxShadow = '0 18px 42px rgba(17, 24, 39, 0.10)';
         e.currentTarget.style.transform = 'translateY(-2px)';
      }}
    >
      <Box pos="relative">
        <AspectRatio ratio={16 / 9}>
          {m.photoUrl ? (
            <Image
              src={m.photoUrl}
              alt={label}
              fit="cover"
            />
          ) : (
            <MealCardSkeleton mealType={m.mealType} />
          )}
        </AspectRatio>

        <Badge
          variant="white"
          color="dark"
          radius="xl"
          size="md"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 2,
            fontWeight: 600,
            opacity: 0.96,
            boxShadow: '0 8px 18px rgba(17, 24, 39, 0.12)',
          }}
          leftSection={<IconClock size={13} />}
        >
          {time}
        </Badge>

      </Box>

      <Stack gap={6} p="md" pt="sm">
        <Group justify="space-between" align="flex-start" gap={8} wrap="nowrap">
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text size="lg" fw={800} c="dark.8" lineClamp={1}>
              {title}
            </Text>
            <Group gap={8} mt={6} wrap="wrap">
              {Number.isFinite(m.calories) && (
                <Badge
                  size="sm"
                  variant="light"
                  color="orange"
                  radius="xl"
                  leftSection={<IconFlame size={12} />}
                >
                  {m.calories} kcal
                </Badge>
              )}
              {calculatedMacros && (
                <>
                  <Badge size="sm" variant="light" color="blue" radius="xl">
                    P {calculatedMacros.pro} g
                  </Badge>
                  <Badge size="sm" variant="light" color="orange" radius="xl">
                    HC {calculatedMacros.cho} g
                  </Badge>
                  <Badge size="sm" variant="light" color="yellow" radius="xl">
                    G {calculatedMacros.fat} g
                  </Badge>
                </>
              )}
              <Badge size="sm" variant="light" color={color} radius="xl">
                {emoji} {label}
              </Badge>
            </Group>
          </Box>

          {(onEdit || onDelete) && (
            <Group gap={6} wrap="nowrap" justify="flex-end">
              {onEdit && (
                <Button
                  size="xs"
                  radius="xl"
                  variant="light"
                  color="dark"
                  leftSection={<IconEdit size={14} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit();
                  }}
                >
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  size="xs"
                  radius="xl"
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                >
                  Borrar
                </Button>
              )}
            </Group>
          )}
        </Group>

        {ingredientsText && (
          <Text size="sm" c="dark.4" lh={1.5} lineClamp={2}>
            <Text span fw={700} c="dark.7">Ingredientes: </Text>
            {ingredientsText}
          </Text>
        )}

        {m.notes && (
          <Group gap={6} align="flex-start" wrap="nowrap">
            <IconNotes size={14} color="var(--mantine-color-orange-6)" style={{ marginTop: 2, flexShrink: 0 }} />
            <Text size="sm" c="dark.4" fs="italic" lh={1.5} lineClamp={2}>
              {m.notes}
            </Text>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
