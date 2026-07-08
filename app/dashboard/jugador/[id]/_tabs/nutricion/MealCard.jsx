import { useMemo, useState } from 'react';
import { AspectRatio, Badge, Box, Group, Image, Paper, Stack, Text, ActionIcon, Tooltip, Collapse } from "@mantine/core";
import { IconClock, IconEdit, IconTrash } from "@tabler/icons-react";
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
  breakfast: { label: 'Desayuno', color: 'blue' },
  midMorning: { label: 'Almuerzo', color: 'teal' },
  lunch: { label: 'Comida', color: 'green' },
  snack: { label: 'Merienda', color: 'pink' },
  dinner: { label: 'Cena', color: 'grape' },
  lateSnack: { label: 'Re-cena', color: 'indigo' },
};

function metaFor(mealType) {
  return MEAL_META[mealType] || { label: mealType || '—', color: 'gray' };
}

export default function MealCard({ m, onOpen, onEdit, onDelete }) {
  const { label } = metaFor(m.mealType);
  const time = new Date(m.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const title = (m.dishName || '').trim() || label;
  const [expanded, setExpanded] = useState(false);

  const displayIngredients = Array.isArray(m.ingredients) ? m.ingredients : [];
  const ingredientsText = displayIngredients.length > 0 ? displayIngredients.join(', ') : null;

  const calculatedMacros = useMemo(() => {
    let pro = 0, cho = 0, fat = 0, parsedCount = 0;
    const items = Array.isArray(m.ingredients) ? m.ingredients : [];

    for (const ingredientStr of items) {
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
    return { pro: roundMacro(pro), cho: roundMacro(cho), fat: roundMacro(fat) };
  }, [m.ingredients]);

  const hasMacros = calculatedMacros || Number.isFinite(m.calories);

  return (
    <Paper
      withBorder
      radius="xl"
      p={0}
      style={{
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        backgroundColor: 'var(--mantine-color-white)',
        borderColor: 'var(--mantine-color-gray-2)',
      }}
      onClick={() => setExpanded(prev => !prev)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
    >
      {/* 1. Large photo on top */}
      <Box 
        pos="relative" 
        onClick={(e) => {
          if (m.photoUrl && onOpen) {
            e.stopPropagation();
            onOpen();
          }
        }}
        style={{ cursor: m.photoUrl ? 'pointer' : 'default' }}
      >
        <AspectRatio ratio={16 / 9}>
          {m.photoUrl ? (
            <Image src={m.photoUrl} alt={label} fit="cover" />
          ) : (
            <MealCardSkeleton mealType={m.mealType} />
          )}
        </AspectRatio>

        {/* Meal Type Badge floating on top-left of image */}
        <Badge
          variant="white"
          color="dark"
          radius="xl"
          size="xs"
          tt="none"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
            fontWeight: 600,
            opacity: 0.9,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          {label}
        </Badge>

        {/* Time Badge floating on top-right of image */}
        <Badge
          variant="white"
          color="dark"
          radius="xl"
          size="xs"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            fontWeight: 600,
            opacity: 0.9,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          }}
          leftSection={<IconClock size={11} />}
        >
          {time}
        </Badge>
      </Box>

      {/* 2. Text Content Stack below */}
      <Stack gap={6} p="md" pt="sm">
        {/* Row 1: Title + Action Icons */}
        <Group justify="space-between" align="center" gap={8} wrap="nowrap">
          <Text size="lg" fw={800} c="dark.8" lineClamp={1}>
            {title}
          </Text>

          {(onEdit || onDelete) && (
            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
              {onEdit && (
                <Tooltip label="Editar" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="md"
                    size="md"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip label="Eliminar" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    radius="md"
                    size="md"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          )}
        </Group>

        {/* Row 2: Macros Inline Text */}
        {hasMacros && (
          <Text size="xs" c="dimmed" fw={600} lh={1.3}>
            {Number.isFinite(m.calories) && (
              <Text span c="dark.5" fw={700}>{m.calories} kcal</Text>
            )}
            {calculatedMacros && (
              <>
                {Number.isFinite(m.calories) && <Text span c="gray.4"> · </Text>}
                <Text span c="blue.5">P {calculatedMacros.pro}g</Text>
                <Text span c="gray.4"> · </Text>
                <Text span c="teal.5">HC {calculatedMacros.cho}g</Text>
                <Text span c="gray.4"> · </Text>
                <Text span c="yellow.7">G {calculatedMacros.fat}g</Text>
              </>
            )}
          </Text>
        )}
      </Stack>

      {/* 3. Expandable Detail Panel */}
      <Collapse in={expanded}>
        <Stack gap="xs" p="md" pt={0} style={{ borderTop: '1px solid var(--mantine-color-gray-1)' }}>
          {ingredientsText && (
            <Box mt="xs">
              <Text size="10px" fw={700} c="dimmed" tt="uppercase" mb={2}>Ingredientes</Text>
              <Text size="xs" c="dark.5" lh={1.4}>{ingredientsText}</Text>
            </Box>
          )}
          {m.notes && (
            <Box mt="xs">
              <Text size="10px" fw={700} c="dimmed" tt="uppercase" mb={2}>Notas completas</Text>
              <Text size="xs" c="dark.5" fs="italic" lh={1.4}>{m.notes}</Text>
            </Box>
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
}
