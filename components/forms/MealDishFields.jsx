import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Box,
  Divider,
  Group,
  Image,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  rem,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import {
  IconCalculator,
  IconCamera,
  IconFlame,
  IconPlus,
  IconScale,
  IconTrash,
  IconX,
} from '@/components/icons3d';
import { MACRO_KEYS, applyFoodChange, foodKcal, roundMacro, rowMacros, toNumber } from '@/lib/nutrition/mealDishes';

const MACRO_FIELDS = [
  { key: 'protein', label: 'Proteína', color: 'var(--mantine-color-bosque-6)' },
  { key: 'carbs', label: 'Hidratos', color: 'var(--mantine-color-lima-6)' },
  { key: 'fat', label: 'Grasa', color: 'var(--mantine-color-hueso-7)' },
];

const MAX_PHOTO_BYTES = 6 * 1024 ** 2;

export default function MealDishFields({
  dish,
  foods,
  foodsLoading,
  foodOptions,
  nextId,
  onChange,
  onPhoto,
  onRemovePhoto,
}) {
  const [foodValue, setFoodValue] = useState(null);
  const [foodGrams, setFoodGrams] = useState(100);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!dish.file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(dish.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [dish.file]);

  const photoSrc = previewUrl || dish.photoUrl;
  const hasMacros = MACRO_KEYS.some((key) => toNumber(dish[key]) != null);
  const missingMacros = toNumber(dish.calories) > 0 && !hasMacros;

  const addFood = () => {
    const food = foods.find((item) => item.id === foodValue);
    const grams = Number(foodGrams);

    if (!food || !Number.isFinite(grams) || grams <= 0) {
      notifications.show({
        title: 'Completa el ingrediente',
        message: 'Selecciona un alimento de la biblioteca e indica los gramos.',
        color: 'yellow',
      });
      return;
    }

    const row = { id: nextId(), food, grams: roundMacro(grams) };
    onChange((current) => ({ ...applyFoodChange(current, null, row), rows: [...current.rows, row] }));
    setFoodValue(null);
    setFoodGrams(100);
  };

  const setRowGrams = (row, value) => {
    const grams = Number(value);
    const next = { id: row.id, food: row.food, grams: Number.isFinite(grams) ? grams : 0 };
    onChange((current) => ({
      ...applyFoodChange(current, row, next),
      rows: current.rows.map((item) => (item.id === row.id ? next : item)),
    }));
  };

  const removeRow = (row) => {
    onChange((current) => ({
      ...applyFoodChange(current, row, null),
      rows: current.rows.filter((item) => item.id !== row.id),
    }));
  };

  const rejectPhoto = () => {
    notifications.show({
      title: 'No se pudo usar esa imagen',
      message: 'Sube una foto JPG, PNG o WebP de menos de 6 MB.',
      color: 'yellow',
    });
  };

  return (
    <Stack gap="md">
      <Box>
        <Text fw={600} size="sm" mb={4}>Fotografía del plato (opcional)</Text>

        {photoSrc ? (
          <Paper
            withBorder
            radius="lg"
            shadow="sm"
            style={{ overflow: 'hidden', position: 'relative' }}
            w="100%"
            bg="gray.1"
          >
            <Image src={photoSrc} alt={dish.dishName || 'Foto del plato'} h={200} w="100%" fit="cover" />

            <ActionIcon
              aria-label="Quitar foto"
              variant="filled"
              color="dark"
              radius="xl"
              size="lg"
              onClick={onRemovePhoto}
              style={{ position: 'absolute', top: 10, right: 10, opacity: 0.8 }}
            >
              <IconX size={20} />
            </ActionIcon>
          </Paper>
        ) : (
          <Dropzone
            accept={{ 'image/*': [] }}
            multiple={false}
            onDrop={onPhoto}
            onReject={rejectPhoto}
            maxSize={MAX_PHOTO_BYTES}
            radius="lg"
            styles={{
              root: {
                border: '2px dashed var(--mantine-color-gray-4)',
                backgroundColor: 'var(--mantine-color-gray-0)',
                padding: 0,
                minHeight: rem(120),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              },
              inner: { pointerEvents: 'all', width: '100%' },
            }}
          >
            <Stack align="center" gap="xs">
              <IconCamera size={40} />
              <Stack gap={0} align="center">
                <Text size="sm" fw={700} c="dark.4" ta="center">
                  Sube una foto para tener registro
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  La imagen se guardará junto a este plato
                </Text>
              </Stack>
            </Stack>
          </Dropzone>
        )}
      </Box>

      <TextInput
        label="Nombre del plato"
        placeholder="Ej: arroz con pollo, café con leche..."
        value={dish.dishName}
        onChange={(e) => {
          const { value } = e.currentTarget;
          onChange((current) => ({ ...current, dishName: value }));
        }}
        variant="filled"
        radius="md"
      />

      <Paper withBorder radius="lg" p="md" bg="gray.0">
        <Stack gap="sm">
          <Group gap="xs">
            <IconCalculator size={28} />
            <Box>
              <Text fw={700} size="sm">Añadir ingredientes</Text>
              <Text size="xs" c="dimmed">Se suman a lo que ya tenga el plato</Text>
            </Box>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Select
              placeholder="Buscar alimento"
              data={foodOptions}
              value={foodValue}
              onChange={setFoodValue}
              searchable
              clearable
              limit={25}
              disabled={foodsLoading && !foods.length}
              variant="filled"
              radius="md"
              nothingFoundMessage={foodsLoading ? 'Cargando alimentos…' : 'No hay alimentos'}
            />
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <NumberInput
                placeholder="Gramos"
                value={foodGrams}
                onChange={setFoodGrams}
                min={1}
                step={10}
                variant="filled"
                radius="md"
                leftSection={<IconScale size={16} />}
                rightSection={<Text size="xs" c="dimmed" mr="xs">g</Text>}
                style={{ flex: 1 }}
              />
              <ActionIcon
                size={36}
                radius="xl"
                color="dark"
                variant="filled"
                onClick={addFood}
                aria-label="Añadir ingrediente"
              >
                <IconPlus size={18} />
              </ActionIcon>
            </Group>
          </SimpleGrid>

          {dish.rows.length > 0 && (
            <>
              <Divider />
              <Stack gap="xs">
                {dish.rows.map((row) => {
                  const macros = rowMacros(row);
                  return (
                    <Paper key={row.id} withBorder radius="md" p="xs" bg="white">
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                          <Text size="sm" fw={600} lineClamp={1}>{row.food.name}</Text>
                          <Text size="xs" c="dimmed">
                            {Math.round(foodKcal(row.food, row.grams))} kcal · P {macros.protein} · HC {macros.carbs} · G {macros.fat} g
                          </Text>
                        </Box>
                        <Group gap={6} wrap="nowrap">
                          <NumberInput
                            aria-label={`Gramos de ${row.food.name}`}
                            value={row.grams}
                            onChange={(value) => setRowGrams(row, value)}
                            min={1}
                            step={10}
                            w={92}
                            size="xs"
                            radius="md"
                            rightSection={<Text size="xs" c="dimmed" mr={4}>g</Text>}
                          />
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            radius="xl"
                            onClick={() => removeRow(row)}
                            aria-label={`Quitar ${row.food.name}`}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            </>
          )}
        </Stack>
      </Paper>

      <NumberInput
        label="Energía estimada"
        placeholder="0"
        value={dish.calories}
        onChange={(value) => onChange((current) => ({ ...current, calories: value === '' ? '' : String(value) }))}
        min={0}
        step={10}
        variant="filled"
        radius="md"
        leftSection={<IconFlame size={16} />}
        rightSection={<Text size="xs" c="dimmed" mr="xs">kcal</Text>}
      />

      <Stack gap={4}>
        <SimpleGrid cols={3} spacing="xs">
          {MACRO_FIELDS.map((macro) => (
            <NumberInput
              key={macro.key}
              label={
                <Group gap={5} wrap="nowrap">
                  <Box w={7} h={7} style={{ borderRadius: '50%', flexShrink: 0, backgroundColor: macro.color }} />
                  {macro.label}
                </Group>
              }
              placeholder="0"
              value={dish[macro.key]}
              onChange={(value) => onChange((current) => ({ ...current, [macro.key]: value === '' ? '' : String(value) }))}
              min={0}
              max={1000}
              step={1}
              decimalScale={1}
              variant="filled"
              radius="md"
              rightSection={<Text size="xs" c="dimmed" mr="xs">g</Text>}
            />
          ))}
        </SimpleGrid>
        {missingMacros && (
          <Text size="xs" c="dimmed">
            Sin macros, este plato solo cuenta en las calorías. Añade ingredientes o escríbelos para que sume en el balance.
          </Text>
        )}
      </Stack>

      <Textarea
        label="Ingredientes"
        description="Uno por línea"
        placeholder="Ej: 2 huevos, pan integral..."
        autosize
        minRows={2}
        value={dish.ingredients}
        onChange={(e) => {
          const { value } = e.currentTarget;
          onChange((current) => ({ ...current, ingredients: value }));
        }}
        variant="filled"
        radius="md"
      />
    </Stack>
  );
}
